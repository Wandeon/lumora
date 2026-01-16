import { prisma } from '@/shared/lib/db';
import { Prisma } from '@/generated/prisma';

interface AuditParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: object | null;
  newValue?: object | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ?? Prisma.JsonNull,
        newValue: params.newValue ?? Prisma.JsonNull,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
  }
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET: 'auth.password_reset',

  // API Key
  API_KEY_CREATE: 'apikey.create',
  API_KEY_ROTATE: 'apikey.rotate',
  API_KEY_DELETE: 'apikey.delete',

  // Gallery
  GALLERY_CREATE: 'gallery.create',
  GALLERY_UPDATE: 'gallery.update',
  GALLERY_DELETE: 'gallery.delete',
  GALLERY_PUBLISH: 'gallery.publish',

  // Order
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_STATUS_CHANGE: 'order.status_change',

  // User
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',

  // Tenant
  TENANT_UPDATE: 'tenant.update',
  TENANT_SETTINGS_CHANGE: 'tenant.settings_change',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
