import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../infrastructure/database/prisma.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard, tenantAdminGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '@healthflow/validators';
import { NotFoundException, ConflictException } from '../../common/exceptions/http-exception.js';

const router = Router();

// GET /users - List users in tenant
router.get(
  '/',
  authGuard,
  tenantGuard,
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage, sortBy, sortOrder } = req.query as {
        page: number;
        perPage: number;
        sortBy?: string;
        sortOrder: 'asc' | 'desc';
      };

      const skip = (page - 1) * perPage;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { tenantId: req.tenantId! },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            professionalId: true,
            specialties: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.user.count({ where: { tenantId: req.tenantId! } }),
      ]);

      res.json({
        success: true,
        data: users,
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

// GET /users/:id - Get user by ID
router.get('/:id', authGuard, tenantGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        professionalId: true,
        specialties: true,
        phone: true,
        avatar: true,
        isActive: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /users - Create new user
router.post(
  '/',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, ...userData } = req.body;

      // Check if email already exists in tenant
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          tenantId: req.tenantId!,
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered', 'EMAIL_TAKEN');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          ...userData,
          email,
          passwordHash,
          tenantId: req.tenantId!,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          professionalId: true,
          specialties: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /users/:id - Update user
router.patch(
  '/:id',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  validateBody(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: req.body,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          professionalId: true,
          specialties: true,
          isActive: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /users/:id - Deactivate user (soft delete)
router.delete(
  '/:id',
  authGuard,
  tenantAdminGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Prevent deleting yourself
      if (id === req.user!.id) {
        throw new ConflictException('Cannot deactivate yourself', 'SELF_DEACTIVATION');
      }

      await prisma.user.update({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /users/professionals - List professionals (doctors, nurses)
router.get(
  '/list/professionals',
  authGuard,
  tenantGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professionals = await prisma.user.findMany({
        where: {
          tenantId: req.tenantId!,
          role: { in: ['DOCTOR', 'NURSE'] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          role: true,
          professionalId: true,
          specialties: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: professionals,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const userRouter = router;
