import { prisma } from '../../infrastructure/database/prisma.js';
import {
  NotFoundException,
  BadRequestException,
} from '../../common/exceptions/http-exception.js';
import { createChildLogger } from '../../infrastructure/logging/logger.js';
import type { PaymentStatus, PaymentMethod, PaginationQuery } from '@healthflow/shared-types';

const logger = createChildLogger('BillingService');

export interface InvoiceItem {
  description: string;
  procedureCode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceInput {
  patientId: string;
  appointmentId?: string;
  items: InvoiceItem[];
  discount?: number;
  dueDate: string;
  paymentMethod?: PaymentMethod;
  healthPlanInfo?: {
    planName: string;
    planCode: string;
    authorizationNumber?: string;
    guideNumber?: string;
  };
  notes?: string;
}

export interface InvoiceFilters extends PaginationQuery {
  patientId?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
}

export interface PaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

export class BillingService {
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Count invoices this month
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-${month}-01`),
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `${year}${month}-${sequence}`;
  }

  async findAll(tenantId: string, filters: InvoiceFilters) {
    const { page = 1, perPage = 20, patientId, status, startDate, endDate, paymentMethod } = filters;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ...(patientId && { patientId }),
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: { id: true, fullName: true, phone: true, email: true, healthPlan: true },
          },
          appointment: {
            select: { id: true, startTime: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            document: true,
            phone: true,
            email: true,
            address: true,
            healthPlan: true,
            healthPlanNumber: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            type: true,
            professional: {
              select: { id: true, name: true, professionalId: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found', 'INVOICE_NOT_FOUND');
    }

    return invoice;
  }

  async findByPatient(tenantId: string, patientId: string, filters: InvoiceFilters) {
    const { page = 1, perPage = 20, status } = filters;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      patientId,
      ...(status && { status }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async create(tenantId: string, input: CreateInvoiceInput) {
    const { patientId, appointmentId, items, discount = 0, dueDate, paymentMethod, healthPlanInfo, notes } = input;

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found', 'PATIENT_NOT_FOUND');
    }

    // Verify appointment if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId, patientId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount;

    if (total < 0) {
      throw new BadRequestException('Discount cannot exceed subtotal', 'INVALID_DISCOUNT');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        patientId,
        appointmentId,
        invoiceNumber,
        items: items as any,
        subtotal,
        discount,
        total,
        status: 'PENDING',
        paymentMethod,
        healthPlanInfo: healthPlanInfo as any,
        dueDate: new Date(dueDate),
        notes,
      },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    logger.info(
      { invoiceId: invoice.id, invoiceNumber, patientId, total },
      'Invoice created'
    );

    return invoice;
  }

  async update(tenantId: string, id: string, input: Partial<CreateInvoiceInput>) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existingInvoice) {
      throw new NotFoundException('Invoice not found', 'INVOICE_NOT_FOUND');
    }

    if (existingInvoice.status === 'PAID') {
      throw new BadRequestException('Cannot update a paid invoice', 'INVOICE_ALREADY_PAID');
    }

    // Recalculate totals if items changed
    let updateData: Record<string, unknown> = { ...input };

    if (input.items) {
      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const discount = input.discount ?? Number(existingInvoice.discount);
      const total = subtotal - discount;

      updateData = {
        ...updateData,
        subtotal,
        total,
      };
    }

    if (input.dueDate) {
      updateData.dueDate = new Date(input.dueDate);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    logger.info({ invoiceId: id }, 'Invoice updated');

    return invoice;
  }

  async registerPayment(tenantId: string, id: string, userId: string, input: PaymentInput) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found', 'INVOICE_NOT_FOUND');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice already paid', 'INVOICE_ALREADY_PAID');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay a cancelled invoice', 'INVOICE_CANCELLED');
    }

    const invoiceTotal = Number(invoice.total);

    // Determine new status
    let newStatus: PaymentStatus = 'PAID';
    if (input.amount < invoiceTotal) {
      newStatus = 'PARTIAL';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        paymentMethod: input.paymentMethod,
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
        notes: input.notes ? `${invoice.notes || ''}\n${input.notes}` : invoice.notes,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE',
        resource: 'invoice',
        resourceId: id,
        oldValue: { status: invoice.status },
        newValue: { status: newStatus, amount: input.amount, paymentMethod: input.paymentMethod },
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info(
      { invoiceId: id, amount: input.amount, status: newStatus },
      'Payment registered'
    );

    return updatedInvoice;
  }

  async cancel(tenantId: string, id: string, userId: string, reason?: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found', 'INVOICE_NOT_FOUND');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid invoice', 'INVOICE_ALREADY_PAID');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${invoice.notes || ''}\nCancelamento: ${reason}` : invoice.notes,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE',
        resource: 'invoice',
        resourceId: id,
        oldValue: { status: invoice.status },
        newValue: { status: 'CANCELLED', reason },
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info({ invoiceId: id, reason }, 'Invoice cancelled');

    return updatedInvoice;
  }

  async getFinancialSummary(tenantId: string, startDate: string, endDate: string) {
    const where = {
      tenantId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      cancelledInvoices,
      revenueData,
      pendingData,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      prisma.invoice.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { total: true },
      }),
    ]);

    // Revenue by payment method
    const revenueByMethod = await prisma.invoice.groupBy({
      by: ['paymentMethod'],
      where: { ...where, status: 'PAID' },
      _sum: { total: true },
      _count: true,
    });

    // Overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        ...where,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
    });

    return {
      period: { startDate, endDate },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        cancelled: cancelledInvoices,
        overdue: overdueInvoices,
      },
      revenue: {
        total: Number(revenueData._sum.total || 0),
        pending: Number(pendingData._sum.total || 0),
        byPaymentMethod: revenueByMethod.map((r: { paymentMethod: PaymentMethod | null; _sum: { total: unknown }; _count: number }) => ({
          method: r.paymentMethod,
          total: Number(r._sum.total || 0),
          count: r._count,
        })),
      },
    };
  }

  async getOverdueInvoices(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices;
  }

  async getDailySummary(tenantId: string, date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const where = {
      tenantId,
      paidAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: 'PAID' as const,
    };

    const [invoices, totalRevenue, byMethod] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: { fullName: true },
          },
        },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.invoice.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { total: true },
        _count: true,
      }),
    ]);

    return {
      date,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      invoiceCount: invoices.length,
      byPaymentMethod: byMethod.map((r: { paymentMethod: PaymentMethod | null; _sum: { total: unknown }; _count: number }) => ({
        method: r.paymentMethod,
        total: Number(r._sum.total || 0),
        count: r._count,
      })),
      invoices,
    };
  }
}

export const billingService = new BillingService();
