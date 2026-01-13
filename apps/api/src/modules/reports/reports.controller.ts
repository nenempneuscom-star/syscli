import { Router, Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { validateQuery } from '../../common/middleware/validate.js';
import { authGuard, adminGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { z } from 'zod';

const router: Router = Router();

// All routes require authentication and tenant context
router.use(authGuard, tenantGuard);

// Date range schema
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

// GET /reports/dashboard - Dashboard metrics
router.get(
  '/dashboard',
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await reportsService.getDashboardMetrics(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/appointments - Appointment statistics
router.get(
  '/appointments',
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reportsService.getAppointmentStats(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/patients - Patient statistics
router.get(
  '/patients',
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reportsService.getPatientStats(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/revenue - Revenue statistics
router.get(
  '/revenue',
  adminGuard,
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reportsService.getRevenueStats(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/productivity - Productivity statistics
router.get(
  '/productivity',
  adminGuard,
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reportsService.getProductivityStats(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/top-patients - Top patients by revenue
router.get(
  '/top-patients',
  adminGuard,
  validateQuery(
    dateRangeSchema.extend({
      limit: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const data = await reportsService.getTopPatients(
        req.tenantId!,
        {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string,
        },
        limit
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

// GET /reports/medical-records - Medical record statistics
router.get(
  '/medical-records',
  validateQuery(dateRangeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reportsService.getMedicalRecordStats(req.tenantId!, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export const reportsRouter = router;
