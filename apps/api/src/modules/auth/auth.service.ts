import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/database/prisma.js';
import { config } from '../../config/index.js';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '../../common/exceptions/http-exception.js';
import { createChildLogger } from '../../infrastructure/logging/logger.js';
import type { AuthTokens, AuthUser, UserRole } from '@healthflow/shared-types';
import type { LoginInput, RegisterInput } from '@healthflow/validators';

const logger = createChildLogger('AuthService');

interface TokenPayload {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
}

export class AuthService {
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ sub: payload.sub }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    // Calculate expiration in seconds
    const decoded = jwt.decode(accessToken) as { exp: number };
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async login(input: LoginInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    logger.info({ email: input.email }, 'Login attempt');

    // Find user by email (and optionally tenant subdomain)
    const whereClause: Record<string, unknown> = { email: input.email };

    if (input.tenantSubdomain) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: input.tenantSubdomain },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
      }

      whereClause.tenantId = tenant.id;
    }

    const user = await prisma.user.findFirst({
      where: whereClause as { email: string; tenantId?: string },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled', 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const tokens = this.generateTokens(payload);

    // Log successful login
    logger.info({ userId: user.id, tenantId: user.tenantId }, 'Login successful');

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: '',
        userAgent: '',
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    return { user: authUser, tokens };
  }

  async register(input: RegisterInput, tenantId: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    logger.info({ email: input.email, tenantId }, 'Registration attempt');

    // Check if user already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists', 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: input.email,
        passwordHash,
        name: input.name,
        role: 'RECEPTIONIST', // Default role for new registrations
        isActive: true,
      },
    });

    logger.info({ userId: user.id, tenantId }, 'User registered successfully');

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const tokens = this.generateTokens(payload);

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    return { user: authUser, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { sub: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      const payload: TokenPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
      };

      return this.generateTokens(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedException('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect', 'INVALID_PASSWORD');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    logger.info({ userId }, 'Password changed successfully');
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };
  }
}

export const authService = new AuthService();
