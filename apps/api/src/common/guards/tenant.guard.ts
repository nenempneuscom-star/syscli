import { Request, Response, NextFunction } from 'express';
import { ForbiddenException, BadRequestException } from '../exceptions/http-exception.js';

export const tenantGuard = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.tenantId) {
    return next(new ForbiddenException('Tenant context required', 'NO_TENANT_CONTEXT'));
  }

  // Ensure user belongs to the tenant they're trying to access
  if (req.user && req.user.tenantId !== req.tenantId && req.user.role !== 'SUPER_ADMIN') {
    return next(new ForbiddenException('Access denied to this tenant', 'TENANT_ACCESS_DENIED'));
  }

  next();
};

export const extractTenantFromSubdomain = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Extract subdomain from host header
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  if (subdomain && subdomain !== 'api' && subdomain !== 'localhost') {
    req.headers['x-tenant-subdomain'] = subdomain;
  }

  next();
};

export const requireTenantId = (paramName = 'tenantId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const tenantId = req.params[paramName] || req.query.tenantId || req.body?.tenantId;

    if (!tenantId) {
      return next(new BadRequestException('Tenant ID is required', 'TENANT_ID_REQUIRED'));
    }

    // Super admins can access any tenant
    if (req.user?.role === 'SUPER_ADMIN') {
      req.tenantId = tenantId as string;
      return next();
    }

    // Regular users can only access their own tenant
    if (req.user?.tenantId !== tenantId) {
      return next(new ForbiddenException('Access denied to this tenant', 'TENANT_ACCESS_DENIED'));
    }

    req.tenantId = tenantId as string;
    next();
  };
};
