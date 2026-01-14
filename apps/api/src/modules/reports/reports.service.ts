import { prisma } from '../../infrastructure/database/prisma.js';
import { createChildLogger } from '../../infrastructure/logging/logger.js';

const logger = createChildLogger('ReportsService');

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface DashboardMetrics {
  patients: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  revenue: {
    total: number;
    pending: number;
    received: number;
  };
  inventory: {
    lowStockCount: number;
    expiringSoonCount: number;
  };
}

export interface AppointmentStats {
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  byProfessional: Array<{ professionalId: string; professionalName: string; count: number; revenue: number }>;
  byDayOfWeek: Array<{ dayOfWeek: number; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
  averageDuration: number;
  peakHours: number[];
}

export interface PatientStats {
  byGender: Array<{ gender: string; count: number }>;
  byAgeGroup: Array<{ ageGroup: string; count: number }>;
  byHealthPlan: Array<{ healthPlan: string | null; count: number }>;
  newPatientsOverTime: Array<{ date: string; count: number }>;
  retentionRate: number;
}

export interface RevenueStats {
  byPaymentMethod: Array<{ method: string; total: number; count: number }>;
  byProfessional: Array<{ professionalId: string; professionalName: string; total: number }>;
  overTime: Array<{ date: string; total: number; count: number }>;
  averageTicket: number;
  topProcedures: Array<{ procedure: string; count: number; total: number }>;
}

export interface ProductivityStats {
  professionals: Array<{
    id: string;
    name: string;
    appointments: number;
    completedAppointments: number;
    revenue: number;
    averageAppointmentDuration: number;
    occupancyRate: number;
  }>;
  overall: {
    totalAppointments: number;
    totalRevenue: number;
    averageOccupancy: number;
  };
}

export class ReportsService {
  async getDashboardMetrics(tenantId: string, dateRange: DateRangeQuery): Promise<DashboardMetrics> {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);

    // Patients metrics
    const [totalPatients, newPatientsThisMonth, activePatientsThisMonth] = await Promise.all([
      prisma.patient.count({ where: { tenantId } }),
      prisma.patient.count({
        where: {
          tenantId,
          createdAt: { gte: monthStart },
        },
      }),
      prisma.appointment.findMany({
        where: {
          tenantId,
          startTime: { gte: monthStart, lte: end },
          status: 'COMPLETED',
        },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    // Appointments metrics
    const appointments = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId,
        startTime: { gte: start, lte: end },
      },
      _count: true,
    });

    const appointmentStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };

    appointments.forEach((a) => {
      appointmentStats.total += a._count;
      if (a.status === 'COMPLETED') appointmentStats.completed = a._count;
      if (a.status === 'CANCELLED') appointmentStats.cancelled = a._count;
      if (a.status === 'NO_SHOW') appointmentStats.noShow = a._count;
    });

    // Revenue metrics
    const [paidInvoices, pendingInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PENDING',
          createdAt: { gte: start, lte: end },
        },
        _sum: { total: true },
      }),
    ]);

    // Inventory metrics
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId },
      select: { currentStock: true, minStock: true },
    });

    const lowStockCount = inventoryItems.filter((i) => i.currentStock <= i.minStock).length;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringProducts = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        type: 'IN',
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    return {
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth,
        activeThisMonth: activePatientsThisMonth.length,
      },
      appointments: {
        ...appointmentStats,
        completionRate: appointmentStats.total > 0
          ? (appointmentStats.completed / appointmentStats.total) * 100
          : 0,
      },
      revenue: {
        total: Number(paidInvoices._sum.total || 0) + Number(pendingInvoices._sum.total || 0),
        received: Number(paidInvoices._sum.total || 0),
        pending: Number(pendingInvoices._sum.total || 0),
      },
      inventory: {
        lowStockCount,
        expiringSoonCount: expiringProducts.length,
      },
    };
  }

  async getAppointmentStats(tenantId: string, dateRange: DateRangeQuery): Promise<AppointmentStats> {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: start, lte: end },
      },
      include: {
        professional: {
          select: { id: true, name: true },
        },
        invoices: {
          select: { total: true },
        },
      },
    });

    // By status
    const statusCounts = new Map<string, number>();
    appointments.forEach((a) => {
      statusCounts.set(a.status, (statusCounts.get(a.status) || 0) + 1);
    });

    // By type
    const typeCounts = new Map<string, number>();
    appointments.forEach((a) => {
      typeCounts.set(a.type, (typeCounts.get(a.type) || 0) + 1);
    });

    // By professional
    const professionalStats = new Map<string, { name: string; count: number; revenue: number }>();
    appointments.forEach((a) => {
      const existing = professionalStats.get(a.professionalId) || {
        name: a.professional.name,
        count: 0,
        revenue: 0,
      };
      existing.count++;
      if (a.invoices && a.invoices.length > 0) {
        existing.revenue += Number(a.invoices[0].total);
      }
      professionalStats.set(a.professionalId, existing);
    });

    // By day of week
    const dayOfWeekCounts = new Map<number, number>();
    appointments.forEach((a) => {
      const day = new Date(a.startTime).getDay();
      dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
    });

    // By hour
    const hourCounts = new Map<number, number>();
    appointments.forEach((a) => {
      const hour = new Date(a.startTime).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Calculate average duration
    let totalDuration = 0;
    let durationCount = 0;
    appointments.forEach((a) => {
      if (a.endTime) {
        const duration = new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
        totalDuration += duration / (1000 * 60); // in minutes
        durationCount++;
      }
    });

    // Find peak hours (top 3)
    const hourArray = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    return {
      byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      byType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
      byProfessional: Array.from(professionalStats.entries()).map(([professionalId, stats]) => ({
        professionalId,
        professionalName: stats.name,
        count: stats.count,
        revenue: stats.revenue,
      })),
      byDayOfWeek: Array.from(dayOfWeekCounts.entries()).map(([dayOfWeek, count]) => ({ dayOfWeek, count })),
      byHour: Array.from(hourCounts.entries()).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour - b.hour),
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      peakHours: hourArray,
    };
  }

  async getPatientStats(tenantId: string, dateRange: DateRangeQuery): Promise<PatientStats> {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const patients = await prisma.patient.findMany({
      where: { tenantId },
      select: {
        id: true,
        gender: true,
        birthDate: true,
        healthPlan: true,
        createdAt: true,
      },
    });

    // By gender
    const genderCounts = new Map<string, number>();
    patients.forEach((p) => {
      genderCounts.set(p.gender, (genderCounts.get(p.gender) || 0) + 1);
    });

    // By age group
    const ageGroups = new Map<string, number>();
    const now = new Date();
    patients.forEach((p) => {
      const age = Math.floor((now.getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      let group: string;
      if (age < 18) group = '0-17';
      else if (age < 30) group = '18-29';
      else if (age < 45) group = '30-44';
      else if (age < 60) group = '45-59';
      else if (age < 75) group = '60-74';
      else group = '75+';
      ageGroups.set(group, (ageGroups.get(group) || 0) + 1);
    });

    // By health plan
    const healthPlanCounts = new Map<string | null, number>();
    patients.forEach((p) => {
      const plan = p.healthPlan || null;
      healthPlanCounts.set(plan, (healthPlanCounts.get(plan) || 0) + 1);
    });

    // New patients over time (by month)
    const newPatientsByMonth = new Map<string, number>();
    patients.forEach((p) => {
      const createdAt = new Date(p.createdAt);
      if (createdAt >= start && createdAt <= end) {
        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        newPatientsByMonth.set(monthKey, (newPatientsByMonth.get(monthKey) || 0) + 1);
      }
    });

    // Retention rate (patients with more than one appointment)
    const patientAppointmentCounts = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { tenantId },
      _count: true,
    });

    const returningPatients = patientAppointmentCounts.filter((p) => p._count > 1).length;
    const totalPatientsWithAppointments = patientAppointmentCounts.length;
    const retentionRate = totalPatientsWithAppointments > 0
      ? (returningPatients / totalPatientsWithAppointments) * 100
      : 0;

    return {
      byGender: Array.from(genderCounts.entries()).map(([gender, count]) => ({ gender, count })),
      byAgeGroup: Array.from(ageGroups.entries())
        .map(([ageGroup, count]) => ({ ageGroup, count }))
        .sort((a, b) => {
          const order = ['0-17', '18-29', '30-44', '45-59', '60-74', '75+'];
          return order.indexOf(a.ageGroup) - order.indexOf(b.ageGroup);
        }),
      byHealthPlan: Array.from(healthPlanCounts.entries())
        .map(([healthPlan, count]) => ({ healthPlan, count }))
        .sort((a, b) => b.count - a.count),
      newPatientsOverTime: Array.from(newPatientsByMonth.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      retentionRate,
    };
  }

  async getRevenueStats(tenantId: string, dateRange: DateRangeQuery): Promise<RevenueStats> {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      include: {
        appointment: {
          include: {
            professional: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // By payment method
    const methodStats = new Map<string, { total: number; count: number }>();
    invoices.forEach((i) => {
      const method = i.paymentMethod || 'OTHER';
      const existing = methodStats.get(method) || { total: 0, count: 0 };
      existing.total += Number(i.total);
      existing.count++;
      methodStats.set(method, existing);
    });

    // By professional
    const professionalStats = new Map<string, { name: string; total: number }>();
    invoices.forEach((i) => {
      if (i.appointment?.professional) {
        const prof = i.appointment.professional;
        const existing = professionalStats.get(prof.id) || { name: prof.name, total: 0 };
        existing.total += Number(i.total);
        professionalStats.set(prof.id, existing);
      }
    });

    // Over time (by day)
    const dailyStats = new Map<string, { total: number; count: number }>();
    invoices.forEach((i) => {
      if (i.paidAt) {
        const dateKey = i.paidAt.toISOString().split('T')[0];
        const existing = dailyStats.get(dateKey) || { total: 0, count: 0 };
        existing.total += Number(i.total);
        existing.count++;
        dailyStats.set(dateKey, existing);
      }
    });

    // Top procedures
    const procedureStats = new Map<string, { count: number; total: number }>();
    invoices.forEach((i) => {
      const items = i.items as Array<{ description: string; total: number }>;
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const existing = procedureStats.get(item.description) || { count: 0, total: 0 };
          existing.count++;
          existing.total += item.total;
          procedureStats.set(item.description, existing);
        });
      }
    });

    // Average ticket
    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const averageTicket = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    return {
      byPaymentMethod: Array.from(methodStats.entries())
        .map(([method, stats]) => ({ method, ...stats }))
        .sort((a, b) => b.total - a.total),
      byProfessional: Array.from(professionalStats.entries())
        .map(([professionalId, stats]) => ({ professionalId, professionalName: stats.name, total: stats.total }))
        .sort((a, b) => b.total - a.total),
      overTime: Array.from(dailyStats.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      averageTicket,
      topProcedures: Array.from(procedureStats.entries())
        .map(([procedure, stats]) => ({ procedure, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    };
  }

  async getProductivityStats(tenantId: string, dateRange: DateRangeQuery): Promise<ProductivityStats> {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all professionals
    const professionals = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['DOCTOR', 'NURSE'] },
      },
      select: { id: true, name: true },
    });

    // Get appointments for each professional
    const professionalStats = await Promise.all(
      professionals.map(async (prof) => {
        const appointments = await prisma.appointment.findMany({
          where: {
            tenantId,
            professionalId: prof.id,
            startTime: { gte: start, lte: end },
          },
          include: {
            invoices: {
              select: { total: true, status: true },
            },
          },
        });

        const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

        // Calculate revenue
        const revenue = appointments.reduce((sum, a) => {
          const invoice = a.invoices && a.invoices.length > 0 ? a.invoices[0] : null;
          if (invoice?.status === 'PAID') {
            return sum + Number(invoice.total);
          }
          return sum;
        }, 0);

        // Calculate average duration
        let totalDuration = 0;
        let durationCount = 0;
        completedAppointments.forEach((a) => {
          if (a.endTime) {
            totalDuration += new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
            durationCount++;
          }
        });
        const averageDuration = durationCount > 0 ? totalDuration / durationCount / (1000 * 60) : 0;

        // Calculate occupancy rate (simplified: completed / total slots)
        // Assuming 8 hours work day, 30 min appointments = 16 slots per day
        const workDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalSlots = workDays * 16;
        const occupancyRate = totalSlots > 0 ? (appointments.length / totalSlots) * 100 : 0;

        return {
          id: prof.id,
          name: prof.name,
          appointments: appointments.length,
          completedAppointments: completedAppointments.length,
          revenue,
          averageAppointmentDuration: averageDuration,
          occupancyRate: Math.min(occupancyRate, 100),
        };
      })
    );

    // Calculate overall stats
    const totalAppointments = professionalStats.reduce((sum, p) => sum + p.appointments, 0);
    const totalRevenue = professionalStats.reduce((sum, p) => sum + p.revenue, 0);
    const averageOccupancy = professionalStats.length > 0
      ? professionalStats.reduce((sum, p) => sum + p.occupancyRate, 0) / professionalStats.length
      : 0;

    return {
      professionals: professionalStats.sort((a, b) => b.revenue - a.revenue),
      overall: {
        totalAppointments,
        totalRevenue,
        averageOccupancy,
      },
    };
  }

  async getTopPatients(tenantId: string, dateRange: DateRangeQuery, limit: number = 10) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const patientInvoices = await prisma.invoice.groupBy({
      by: ['patientId'],
      where: {
        tenantId,
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      _sum: { total: true },
      _count: true,
    });

    const sortedPatients = patientInvoices
      .sort((a, b) => Number(b._sum.total || 0) - Number(a._sum.total || 0))
      .slice(0, limit);

    const patientDetails = await prisma.patient.findMany({
      where: {
        id: { in: sortedPatients.map((p) => p.patientId) },
      },
      select: { id: true, fullName: true, phone: true, email: true },
    });

    const patientMap = new Map(patientDetails.map((p) => [p.id, p]));

    return sortedPatients.map((p) => ({
      patient: patientMap.get(p.patientId),
      totalSpent: Number(p._sum.total || 0),
      invoiceCount: p._count,
    }));
  }

  async getMedicalRecordStats(tenantId: string, dateRange: DateRangeQuery) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const records = await prisma.medicalRecord.groupBy({
      by: ['type'],
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      _count: true,
    });

    const totalRecords = records.reduce((sum, r) => sum + r._count, 0);

    return {
      byType: records.map((r) => ({ type: r.type, count: r._count })),
      total: totalRecords,
    };
  }
}

export const reportsService = new ReportsService();
