import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedException, ForbiddenException } from '../exceptions/http-exception.js';
import type { AuthUser, UserRole } from '@healthflow/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
    }
  }
}

interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const authGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      req.user = {
        id: decoded.sub,
        tenantId: decoded.tenantId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };

      req.tenantId = decoded.tenantId;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token', 'INVALID_TOKEN');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        req.user = {
          id: decoded.sub,
          tenantId: decoded.tenantId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        };

        req.tenantId = decoded.tenantId;
      } catch {
        // Token invalid, but that's okay for optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const rolesGuard = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedException('Not authenticated', 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenException('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        })
      );
    }

    next();
  };
};

export const superAdminGuard = rolesGuard('SUPER_ADMIN');
export const tenantAdminGuard = rolesGuard('SUPER_ADMIN', 'TENANT_ADMIN');
export const doctorGuard = rolesGuard('SUPER_ADMIN', 'TENANT_ADMIN', 'DOCTOR');
export const nurseGuard = rolesGuard('SUPER_ADMIN', 'TENANT_ADMIN', 'DOCTOR', 'NURSE');
export const receptionistGuard = rolesGuard(
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST'
);
export const billingGuard = rolesGuard('SUPER_ADMIN', 'TENANT_ADMIN', 'BILLING_ADMIN');
export const adminGuard = rolesGuard('SUPER_ADMIN', 'TENANT_ADMIN');
