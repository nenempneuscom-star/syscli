import { Router, Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';
import { authGuard, tenantAdminGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { z } from 'zod';

const router: Router = Router();

// ==================== SCHEMAS ====================

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  professionalId: z.string().max(50).optional(),
  specialties: z.array(z.string()).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const notificationPreferencesSchema = z.object({
  email: z.object({
    appointments: z.boolean(),
    reminders: z.boolean(),
    marketing: z.boolean(),
    reports: z.boolean(),
  }),
  sms: z.object({
    appointments: z.boolean(),
    reminders: z.boolean(),
  }),
  push: z.object({
    appointments: z.boolean(),
    reminders: z.boolean(),
    alerts: z.boolean(),
  }),
});

const tenantSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  logo: z.string().url().optional(),
  settings: z.object({
    timezone: z.string().optional(),
    currency: z.string().optional(),
    language: z.string().optional(),
    workingHours: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    workingDays: z.array(z.number().min(0).max(6)).optional(),
    appointmentDuration: z.number().min(5).max(480).optional(),
    appointmentBuffer: z.number().min(0).max(60).optional(),
    features: z.object({
      telemedicine: z.boolean().optional(),
      billing: z.boolean().optional(),
      inventory: z.boolean().optional(),
      multiLocation: z.boolean().optional(),
      onlineBooking: z.boolean().optional(),
    }).optional(),
    notifications: z.object({
      appointmentReminder: z.number().optional(),
      confirmationRequired: z.boolean().optional(),
      autoConfirmation: z.boolean().optional(),
    }).optional(),
    billing: z.object({
      defaultPaymentTerms: z.number().optional(),
      lateFeePercentage: z.number().optional(),
      invoicePrefix: z.string().optional(),
      invoiceNotes: z.string().optional(),
    }).optional(),
  }).optional(),
});

const auditLogQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// ==================== PROFILE ROUTES ====================

// GET /settings/profile - Get current user profile
router.get(
  '/profile',
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await settingsService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /settings/profile - Update current user profile
router.patch(
  '/profile',
  authGuard,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await settingsService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

// POST /settings/profile/change-password - Change password
router.post(
  '/profile/change-password',
  authGuard,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.changePassword(req.user!.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== MFA ROUTES ====================

// POST /settings/security/mfa/enable - Enable MFA
router.post(
  '/security/mfa/enable',
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.enableMFA(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /settings/security/mfa/disable - Disable MFA
router.post(
  '/security/mfa/disable',
  authGuard,
  validateBody(z.object({ password: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.disableMFA(req.user!.id, req.body.password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== NOTIFICATION ROUTES ====================

// GET /settings/notifications - Get notification preferences
router.get(
  '/notifications',
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferences = await settingsService.getNotificationPreferences(req.user!.id);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /settings/notifications - Update notification preferences
router.put(
  '/notifications',
  authGuard,
  validateBody(notificationPreferencesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferences = await settingsService.updateNotificationPreferences(req.user!.id, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== TENANT SETTINGS ROUTES (Admin) ====================

// GET /settings/tenant - Get tenant settings
router.get(
  '/tenant',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.getTenantSettings(req.tenantId!);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /settings/tenant - Update tenant settings
router.patch(
  '/tenant',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(tenantSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.updateTenantSettings(req.tenantId!, req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== USERS MANAGEMENT (Admin) ====================

// GET /settings/users - Get tenant users
router.get(
  '/users',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await settingsService.getTenantUsers(req.tenantId!);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /settings/users/:id/status - Update user status
router.patch(
  '/users/:id/status',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(z.object({ isActive: z.boolean() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await settingsService.updateUserStatus(req.tenantId!, req.params.id, req.body.isActive);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /settings/users/:id/role - Update user role
router.patch(
  '/users/:id/role',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(z.object({ role: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await settingsService.updateUserRole(req.tenantId!, req.params.id, req.body.role);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== AUDIT LOG (Admin) ====================

// GET /settings/audit-log - Get audit log
router.get(
  '/audit-log',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateQuery(auditLogQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.getAuditLog(req.tenantId!, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== SYSTEM INFO ====================

// GET /settings/system - Get system info
router.get(
  '/system',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await settingsService.getSystemInfo(req.tenantId!);
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== DATA EXPORT ====================

// POST /settings/export - Request data export
router.post(
  '/export',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(z.object({
    type: z.enum(['full', 'patients', 'appointments', 'medical-records']),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.requestDataExport(req.tenantId!, req.user!.id, req.body.type);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== INTEGRATIONS ====================

// GET /settings/integrations - Get available integrations
router.get(
  '/integrations',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const integrations = await settingsService.getIntegrations(req.tenantId!);
      res.json({ success: true, data: integrations });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /settings/integrations/:id - Configure integration
router.put(
  '/integrations/:id',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(z.record(z.any())),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.updateIntegration(req.tenantId!, req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export const settingsRouter = router;
