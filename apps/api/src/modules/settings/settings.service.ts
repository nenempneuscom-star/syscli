import bcrypt from 'bcryptjs';
import { prisma } from '../../infrastructure/database/prisma.js';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../common/exceptions/http-exception.js';
import crypto from 'crypto';

// Types
interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
  professionalId?: string;
  specialties?: string[];
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface NotificationPreferences {
  email: {
    appointments: boolean;
    reminders: boolean;
    marketing: boolean;
    reports: boolean;
  };
  sms: {
    appointments: boolean;
    reminders: boolean;
  };
  push: {
    appointments: boolean;
    reminders: boolean;
    alerts: boolean;
  };
}

interface TenantSettingsInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  logo?: string;
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
    workingHours?: { start: string; end: string };
    workingDays?: number[];
    appointmentDuration?: number;
    appointmentBuffer?: number;
    features?: {
      telemedicine?: boolean;
      billing?: boolean;
      inventory?: boolean;
      multiLocation?: boolean;
      onlineBooking?: boolean;
    };
    notifications?: {
      appointmentReminder?: number; // hours before
      confirmationRequired?: boolean;
      autoConfirmation?: boolean;
    };
    billing?: {
      defaultPaymentTerms?: number; // days
      lateFeePercentage?: number;
      invoicePrefix?: string;
      invoiceNotes?: string;
    };
  };
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string;
  userName: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class SettingsService {
  // ==================== PROFILE ====================

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        professionalId: true,
        specialties: true,
        mfaEnabled: true,
        notificationPreferences: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        professionalId: true,
        specialties: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Validate new password strength
    if (input.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters', 'WEAK_PASSWORD');
    }

    // Hash and save new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  // ==================== MFA ====================

  async enableMFA(userId: string) {
    // Generate MFA secret (in production, use a proper TOTP library like speakeasy)
    const secret = crypto.randomBytes(20).toString('hex');

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        updatedAt: new Date(),
      },
    });

    // In production, return QR code for authenticator app
    return {
      success: true,
      secret,
      message: 'MFA enabled successfully. Save this secret in your authenticator app.',
    };
  }

  async disableMFA(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    // Verify password before disabling MFA
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Password is incorrect', 'INVALID_PASSWORD');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'MFA disabled successfully' };
  }

  // ==================== NOTIFICATION PREFERENCES ====================

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND');
    }

    // Return default preferences if not set
    const defaultPreferences: NotificationPreferences = {
      email: {
        appointments: true,
        reminders: true,
        marketing: false,
        reports: true,
      },
      sms: {
        appointments: true,
        reminders: true,
      },
      push: {
        appointments: true,
        reminders: true,
        alerts: true,
      },
    };

    return (user.notificationPreferences as NotificationPreferences) || defaultPreferences;
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: preferences,
        updatedAt: new Date(),
      },
      select: { notificationPreferences: true },
    });

    return user.notificationPreferences;
  }

  // ==================== TENANT SETTINGS ====================

  async getTenantSettings(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            maxUsers: true,
            maxPatients: true,
            features: true,
          },
        },
        _count: {
          select: {
            users: true,
            patients: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
    }

    return tenant;
  }

  async updateTenantSettings(tenantId: string, input: TenantSettingsInput) {
    const { settings, ...basicInfo } = input;

    // Get current settings to merge
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!currentTenant) {
      throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
    }

    const currentSettings = (currentTenant.settings as Record<string, any>) || {};
    const mergedSettings = settings ? { ...currentSettings, ...settings } : currentSettings;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...basicInfo,
        settings: mergedSettings,
        updatedAt: new Date(),
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tenant;
  }

  // ==================== USERS MANAGEMENT (Admin) ====================

  async getTenantUsers(tenantId: string) {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        professionalId: true,
        specialties: true,
        phone: true,
        isActive: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  async updateUserStatus(tenantId: string, userId: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: {
        id: userId,
        tenantId,
      },
      data: {
        isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    return user;
  }

  async updateUserRole(tenantId: string, userId: string, role: string) {
    const validRoles = ['TENANT_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_ADMIN'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException('Invalid role', 'INVALID_ROLE');
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
        tenantId,
      },
      data: {
        role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  }

  // ==================== AUDIT LOG ====================

  async getAuditLog(tenantId: string, filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const where: any = { tenantId };

    if (filters.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          userId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        userName: log.user?.name || 'Unknown',
        user: undefined,
      })) as AuditLogEntry[],
      total,
    };
  }

  // ==================== SYSTEM INFO ====================

  async getSystemInfo(tenantId: string) {
    const [tenant, userCount, patientCount, appointmentCount, storageUsage] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { plan: true },
      }),
      prisma.user.count({ where: { tenantId } }),
      prisma.patient.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId } }),
      // Calculate storage usage from medical records attachments (simplified)
      prisma.medicalRecord.count({ where: { tenantId } }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Tenant not found', 'TENANT_NOT_FOUND');
    }

    const plan = tenant.plan;

    return {
      usage: {
        users: {
          current: userCount,
          limit: plan?.maxUsers || 0,
          percentage: plan?.maxUsers ? (userCount / plan.maxUsers) * 100 : 0,
        },
        patients: {
          current: patientCount,
          limit: plan?.maxPatients || 0,
          percentage: plan?.maxPatients ? (patientCount / plan.maxPatients) * 100 : 0,
        },
        appointments: {
          total: appointmentCount,
        },
        medicalRecords: {
          total: storageUsage,
        },
      },
      plan: {
        id: plan?.id,
        name: plan?.name,
        features: plan?.features,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        createdAt: tenant.createdAt,
      },
    };
  }

  // ==================== BACKUP/EXPORT ====================

  async requestDataExport(tenantId: string, userId: string, exportType: 'full' | 'patients' | 'appointments' | 'medical-records') {
    // In production, this would queue a background job to generate the export
    const exportRequest = {
      id: crypto.randomUUID(),
      tenantId,
      requestedBy: userId,
      type: exportType,
      status: 'pending',
      requestedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    // Here you would save to database and queue the job
    // await prisma.exportRequest.create({ data: exportRequest });
    // await exportQueue.add('generate-export', exportRequest);

    return {
      success: true,
      message: 'Export requested successfully. You will receive an email when it is ready.',
      export: exportRequest,
    };
  }

  // ==================== INTEGRATIONS ====================

  async getIntegrations(tenantId: string) {
    // In production, fetch from database
    const integrations = [
      {
        id: 'whatsapp',
        name: 'WhatsApp Business',
        description: 'Envio de confirmacoes e lembretes via WhatsApp',
        status: 'not_configured',
        icon: 'message-circle',
      },
      {
        id: 'email',
        name: 'Email (SMTP)',
        description: 'Configuracao de servidor de email para notificacoes',
        status: 'not_configured',
        icon: 'mail',
      },
      {
        id: 'payment',
        name: 'Gateway de Pagamento',
        description: 'Integracao com Stripe, PagSeguro ou Mercado Pago',
        status: 'not_configured',
        icon: 'credit-card',
      },
      {
        id: 'calendar',
        name: 'Google Calendar',
        description: 'Sincronizacao de agenda com Google Calendar',
        status: 'not_configured',
        icon: 'calendar',
      },
      {
        id: 'tiss',
        name: 'TISS/ANS',
        description: 'Integracao com operadoras de saude',
        status: 'not_configured',
        icon: 'file-text',
      },
    ];

    return integrations;
  }

  async updateIntegration(tenantId: string, integrationId: string, config: Record<string, any>) {
    // In production, validate and save integration config
    // const integration = await prisma.integration.upsert({
    //   where: { tenantId_integrationId: { tenantId, integrationId } },
    //   update: { config, status: 'configured' },
    //   create: { tenantId, integrationId, config, status: 'configured' },
    // });

    return {
      success: true,
      message: 'Integration configured successfully',
      integrationId,
    };
  }
}

export const settingsService = new SettingsService();
