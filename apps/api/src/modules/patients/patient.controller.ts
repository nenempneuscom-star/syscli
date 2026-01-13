import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard, receptionistGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { createPatientSchema, updatePatientSchema, paginationSchema } from '@healthflow/validators';
import { NotFoundException, ConflictException } from '../../common/exceptions/http-exception.js';
import { z } from 'zod';

const router = Router();

// GET /patients - List patients
router.get(
  '/',
  authGuard,
  tenantGuard,
  validateQuery(
    paginationSchema.extend({
      search: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, sortBy, sortOrder, search } = req.query as {
        page: number;
        perPage: number;
        sortBy?: string;
        sortOrder: 'asc' | 'desc';
        search?: string;
      };

      const skip = (page - 1) * perPage;

      const where = {
        tenantId: req.tenantId!,
        isActive: true,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }),
      };

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          select: {
            id: true,
            fullName: true,
            document: true,
            birthDate: true,
            gender: true,
            phone: true,
            email: true,
            healthPlan: true,
            createdAt: true,
            _count: {
              select: { appointments: true, medicalRecords: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.patient.count({ where }),
      ]);

      res.json({
        success: true,
        data: patients,
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

// GET /patients/:id - Get patient by ID
router.get('/:id', authGuard, tenantGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
      include: {
        _count: {
          select: { appointments: true, medicalRecords: true, invoices: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found', 'PATIENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

// POST /patients - Create new patient
router.post(
  '/',
  authGuard,
  receptionistGuard,
  tenantGuard,
  validateBody(createPatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { document } = req.body;

      // Check if document (CPF) already exists in tenant
      const existingPatient = await prisma.patient.findFirst({
        where: {
          document,
          tenantId: req.tenantId!,
        },
      });

      if (existingPatient) {
        throw new ConflictException('Patient with this CPF already exists', 'PATIENT_EXISTS');
      }

      const patient = await prisma.patient.create({
        data: {
          ...req.body,
          tenantId: req.tenantId!,
          createdById: req.user!.id,
        },
      });

      res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /patients/:id - Update patient
router.patch(
  '/:id',
  authGuard,
  receptionistGuard,
  tenantGuard,
  validateBody(updatePatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: req.body,
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /patients/:id - Deactivate patient (soft delete)
router.delete(
  '/:id',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.patient.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Patient deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /patients/:id/history - Get patient history (appointments + records)
router.get(
  '/:id/history',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [appointments, medicalRecords] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            patientId: id,
            tenantId: req.tenantId!,
          },
          include: {
            professional: {
              select: { id: true, name: true, professionalId: true },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        }),
        prisma.medicalRecord.findMany({
          where: {
            patientId: id,
            tenantId: req.tenantId!,
          },
          include: {
            professional: {
              select: { id: true, name: true, professionalId: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      res.json({
        success: true,
        data: {
          appointments,
          medicalRecords,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /patients/:id/consent - Record LGPD consent
router.post(
  '/:id/consent',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: {
          consentGiven: true,
          consentDate: new Date(),
        },
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const patientRouter = router;
