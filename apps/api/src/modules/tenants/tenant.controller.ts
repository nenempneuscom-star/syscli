import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { validateBody } from '../../common/middleware/validate.js';
import { authGuard, superAdminGuard } from '../../common/guards/auth.guard.js';
import { createTenantSchema } from '@healthflow/validators';
import { NotFoundException, ConflictException } from '../../common/exceptions/http-exception.js';
import { z } from 'zod';

const router = Router();

// GET /tenants - List all tenants (Super Admin only)
router.get(
  '/',
  authGuard,
  superAdminGuard,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          plan: true,
          _count: {
            select: { users: true, patients: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /tenants/:id - Get tenant by ID
router.get('/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Non-super admins can only view their own tenant
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.tenantId !== id) {
      throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        _count: {
          select: { users: true, patients: true, appointments: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
});

// POST /tenants - Create new tenant (Super Admin only)
router.post(
  '/',
  authGuard,
  superAdminGuard,
  validateBody(createTenantSchema.extend({ planId: z.string().uuid() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subdomain, document } = req.body;

      // Check if subdomain is taken
      const existingSubdomain = await prisma.tenant.findUnique({
        where: { subdomain },
      });

      if (existingSubdomain) {
        throw new ConflictException('Subdomain already taken', 'SUBDOMAIN_TAKEN');
      }

      // Check if document (CNPJ) is taken
      const existingDocument = await prisma.tenant.findUnique({
        where: { document },
      });

      if (existingDocument) {
        throw new ConflictException('CNPJ already registered', 'DOCUMENT_TAKEN');
      }

      const tenant = await prisma.tenant.create({
        data: {
          ...req.body,
          settings: req.body.settings || {
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            language: 'pt-BR',
            workingHours: { start: '08:00', end: '18:00' },
            appointmentDuration: 30,
            features: {
              telemedicine: false,
              billing: true,
              inventory: true,
              multiLocation: false,
            },
          },
        },
        include: { plan: true },
      });

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /tenants/:id - Update tenant
router.patch(
  '/:id',
  authGuard,
  validateBody(createTenantSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Only super admin or tenant admin can update
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.tenantId !== id) {
        throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
      }

      const tenant = await prisma.tenant.update({
        where: { id },
        data: req.body,
        include: { plan: true },
      });

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /tenants/by-subdomain/:subdomain - Get tenant by subdomain (public)
router.get(
  '/by-subdomain/:subdomain',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subdomain } = req.params;

      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
        select: {
          id: true,
          name: true,
          subdomain: true,
          status: true,
          settings: true,
        },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const tenantRouter = router;
