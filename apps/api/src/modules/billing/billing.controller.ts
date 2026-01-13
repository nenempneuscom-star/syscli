import { Router, Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard, billingGuard, receptionistGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { paginationSchema, paymentStatusSchema, paymentMethodSchema } from '@healthflow/validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication and tenant context
router.use(authGuard, tenantGuard);

// Invoice item schema
const invoiceItemSchema = z.object({
  description: z.string().min(1),
  procedureCode: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

// Health plan info schema
const healthPlanInfoSchema = z.object({
  planName: z.string().min(1),
  planCode: z.string().min(1),
  authorizationNumber: z.string().optional(),
  guideNumber: z.string().optional(),
});

// Create invoice schema
const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  items: z.array(invoiceItemSchema).min(1),
  discount: z.number().min(0).default(0),
  dueDate: z.string(),
  paymentMethod: paymentMethodSchema.optional(),
  healthPlanInfo: healthPlanInfoSchema.optional(),
  notes: z.string().optional(),
});

// Payment schema
const paymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: paymentMethodSchema,
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /billing/invoices - List invoices
router.get(
  '/invoices',
  validateQuery(
    paginationSchema.extend({
      patientId: z.string().uuid().optional(),
      status: paymentStatusSchema.optional(),
      paymentMethod: paymentMethodSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billingService.findAll(req.tenantId!, req.query as never);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /billing/invoices/overdue - Get overdue invoices
router.get(
  '/invoices/overdue',
  billingGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await billingService.getOverdueInvoices(req.tenantId!);
      res.json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  }
);

// GET /billing/invoices/:id - Get invoice details
router.get('/invoices/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await billingService.findById(req.tenantId!, req.params.id);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// GET /billing/patient/:patientId - Get patient invoices
router.get(
  '/patient/:patientId',
  validateQuery(
    paginationSchema.extend({
      status: paymentStatusSchema.optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billingService.findByPatient(
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

// POST /billing/invoices - Create invoice
router.post(
  '/invoices',
  receptionistGuard,
  validateBody(createInvoiceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await billingService.create(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /billing/invoices/:id - Update invoice
router.patch(
  '/invoices/:id',
  billingGuard,
  validateBody(createInvoiceSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await billingService.update(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

// POST /billing/invoices/:id/pay - Register payment
router.post(
  '/invoices/:id/pay',
  receptionistGuard,
  validateBody(paymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await billingService.registerPayment(
        req.tenantId!,
        req.params.id,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

// POST /billing/invoices/:id/cancel - Cancel invoice
router.post(
  '/invoices/:id/cancel',
  billingGuard,
  validateBody(z.object({ reason: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await billingService.cancel(
        req.tenantId!,
        req.params.id,
        req.user!.id,
        req.body.reason
      );
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

// GET /billing/summary - Financial summary
router.get(
  '/summary',
  billingGuard,
  validateQuery(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await billingService.getFinancialSummary(
        req.tenantId!,
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

// GET /billing/daily - Daily summary
router.get(
  '/daily',
  billingGuard,
  validateQuery(z.object({ date: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await billingService.getDailySummary(
        req.tenantId!,
        req.query.date as string
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

export const billingRouter = router;
