import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard, receptionistGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { createAppointmentSchema, updateAppointmentSchema, paginationSchema } from '@healthflow/validators';
import { NotFoundException, ConflictException, BadRequestException } from '../../common/exceptions/http-exception.js';
import { z } from 'zod';

const router = Router();

// GET /appointments - List appointments
router.get(
  '/',
  authGuard,
  tenantGuard,
  validateQuery(
    paginationSchema.extend({
      professionalId: z.string().uuid().optional(),
      patientId: z.string().uuid().optional(),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, professionalId, patientId, status, startDate, endDate } = req.query as {
        page: number;
        perPage: number;
        professionalId?: string;
        patientId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
      };

      const skip = (page - 1) * perPage;

      const where = {
        tenantId: req.tenantId!,
        ...(professionalId && { professionalId }),
        ...(patientId && { patientId }),
        ...(status && { status: status as never }),
        ...(startDate && {
          startTime: {
            gte: new Date(startDate),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }),
      };

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: { id: true, fullName: true, phone: true },
            },
            professional: {
              select: { id: true, name: true, professionalId: true },
            },
            room: {
              select: { id: true, name: true },
            },
          },
          orderBy: { startTime: 'asc' },
          skip,
          take: perPage,
        }),
        prisma.appointment.count({ where }),
      ]);

      res.json({
        success: true,
        data: appointments,
        meta: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /appointments/today - Get today's appointments
router.get(
  '/today',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId: req.tenantId!,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          patient: {
            select: { id: true, fullName: true, phone: true },
          },
          professional: {
            select: { id: true, name: true },
          },
          room: {
            select: { id: true, name: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /appointments/:id - Get appointment by ID
router.get('/:id', authGuard, tenantGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
      include: {
        patient: true,
        professional: {
          select: { id: true, name: true, professionalId: true, specialties: true },
        },
        room: true,
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /appointments - Create new appointment
router.post(
  '/',
  authGuard,
  receptionistGuard,
  tenantGuard,
  validateBody(createAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { professionalId, startTime, endTime } = req.body;

      // Check for conflicting appointments
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: req.tenantId!,
          professionalId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lte: new Date(startTime) },
              endTime: { gt: new Date(startTime) },
            },
            {
              startTime: { lt: new Date(endTime) },
              endTime: { gte: new Date(endTime) },
            },
            {
              startTime: { gte: new Date(startTime) },
              endTime: { lte: new Date(endTime) },
            },
          ],
        },
      });

      if (conflictingAppointment) {
        throw new ConflictException(
          'Professional already has an appointment at this time',
          'APPOINTMENT_CONFLICT'
        );
      }

      const appointment = await prisma.appointment.create({
        data: {
          ...req.body,
          tenantId: req.tenantId!,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
        include: {
          patient: {
            select: { id: true, fullName: true },
          },
          professional: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /appointments/:id - Update appointment
router.patch(
  '/:id',
  authGuard,
  receptionistGuard,
  tenantGuard,
  validateBody(updateAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: req.body,
        include: {
          patient: {
            select: { id: true, fullName: true },
          },
          professional: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /appointments/:id/confirm - Confirm appointment
router.post(
  '/:id/confirm',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /appointments/:id/checkin - Check-in patient
router.post(
  '/:id/checkin',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          status: 'WAITING',
          checkedInAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /appointments/:id/start - Start appointment
router.post(
  '/:id/start',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /appointments/:id/complete - Complete appointment
router.post(
  '/:id/complete',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /appointments/:id/cancel - Cancel appointment
router.post(
  '/:id/cancel',
  authGuard,
  tenantGuard,
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const existingAppointment = await prisma.appointment.findFirst({
        where: { id, tenantId: req.tenantId! },
      });

      if (!existingAppointment) {
        throw new NotFoundException('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }

      if (existingAppointment.status === 'COMPLETED') {
        throw new BadRequestException('Cannot cancel a completed appointment', 'CANNOT_CANCEL');
      }

      const appointment = await prisma.appointment.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
        },
      });

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /appointments/professional/:professionalId/availability - Get professional availability
router.get(
  '/professional/:professionalId/availability',
  authGuard,
  tenantGuard,
  validateQuery(
    z.object({
      date: z.string(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { professionalId } = req.params;
      const { date } = req.query as { date: string };

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId: req.tenantId!,
          professionalId,
          startTime: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: {
          startTime: true,
          endTime: true,
        },
        orderBy: { startTime: 'asc' },
      });

      // Return busy slots
      res.json({
        success: true,
        data: {
          date,
          professionalId,
          busySlots: appointments.map((a) => ({
            start: a.startTime,
            end: a.endTime,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const appointmentRouter = router;
