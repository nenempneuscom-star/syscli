import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { validateBody } from '../../common/middleware/validate.js';
import { authGuard } from '../../common/guards/auth.guard.js';
import { loginSchema, refreshTokenSchema } from '@healthflow/validators';
import { z } from 'zod';

const router: Router = Router();

const registerWithTenantSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  confirmPassword: z.string(),
  tenantId: z.string().uuid(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// POST /auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/register
router.post(
  '/register',
  validateBody(registerWithTenantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, ...input } = req.body;
      const result = await authService.register(input, tenantId);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/refresh
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await authService.refreshToken(req.body.refreshToken);
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/profile
router.get('/profile', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/change-password
router.post(
  '/change-password',
  authGuard,
  validateBody(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/logout
router.post('/logout', authGuard, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT system, logout is handled client-side by deleting tokens
    // Here we just log the action for audit purposes
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
