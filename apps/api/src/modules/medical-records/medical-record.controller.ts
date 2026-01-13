import { Router, Request, Response, NextFunction } from 'express';
import { medicalRecordService } from './medical-record.service.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard, doctorGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { createMedicalRecordSchema, paginationSchema, recordTypeSchema } from '@healthflow/validators';
import { z } from 'zod';

const router: Router = Router();

// All routes require authentication and tenant context
router.use(authGuard, tenantGuard);

// GET /medical-records - List medical records
router.get(
  '/',
  validateQuery(
    paginationSchema.extend({
      patientId: z.string().uuid().optional(),
      professionalId: z.string().uuid().optional(),
      type: recordTypeSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await medicalRecordService.findAll(req.tenantId!, req.query as never);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /medical-records/templates - Get record templates
router.get(
  '/templates',
  validateQuery(z.object({ type: recordTypeSchema.optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await medicalRecordService.getTemplates(
        req.tenantId!,
        req.query.type as never
      );
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }
);

// GET /medical-records/patient/:patientId - Get records for a patient
router.get(
  '/patient/:patientId',
  validateQuery(
    paginationSchema.extend({
      type: recordTypeSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await medicalRecordService.findByPatient(
        req.tenantId!,
        req.params.patientId,
        req.query as never
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /medical-records/patient/:patientId/timeline - Get patient timeline
router.get(
  '/patient/:patientId/timeline',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeline = await medicalRecordService.getPatientTimeline(
        req.tenantId!,
        req.params.patientId
      );
      res.json({ success: true, data: timeline });
    } catch (error) {
      next(error);
    }
  }
);

// GET /medical-records/:id - Get single record
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await medicalRecordService.findById(req.tenantId!, req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

// POST /medical-records - Create new record (doctors/nurses only)
router.post(
  '/',
  doctorGuard,
  validateBody(createMedicalRecordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await medicalRecordService.create(
        req.tenantId!,
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /medical-records/:id - Update record (doctors/nurses only)
router.patch(
  '/:id',
  doctorGuard,
  validateBody(
    z.object({
      content: z.record(z.unknown()).optional(),
      icdCodes: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await medicalRecordService.update(
        req.tenantId!,
        req.params.id,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
);

// POST /medical-records/:id/sign - Sign record digitally
router.post(
  '/:id/sign',
  doctorGuard,
  validateBody(z.object({ signature: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await medicalRecordService.addSignature(
        req.tenantId!,
        req.params.id,
        req.user!.id,
        req.body.signature
      );
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
);

export const medicalRecordRouter = router;
