import type { Session } from 'next-auth';

type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

// Role hierarchy: owner > admin > editor > viewer
const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if user has at least the required role level
 */
export function hasRole(
  userRole: string | undefined,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Check if user can perform admin actions (owner or admin)
 */
export function canAdmin(session: Session | null): boolean {
  return hasRole(session?.user?.role, 'admin');
}

/**
 * Check if user can edit content (owner, admin, or editor)
 */
export function canEdit(session: Session | null): boolean {
  return hasRole(session?.user?.role, 'editor');
}

/**
 * Check if user can view content (any authenticated role)
 */
export function canView(session: Session | null): boolean {
  return hasRole(session?.user?.role, 'viewer');
}

/**
 * Authorization result for API responses (discriminated union)
 */
export type AuthorizationResult =
  | { authorized: true; tenantId: string; userId: string; role: string }
  | { authorized: false; error: string; status: number };

/**
 * Validate session and check role-based authorization for API routes
 */
export function authorizeApi(
  session: Session | null,
  requiredRole: UserRole = 'viewer'
): AuthorizationResult {
  if (!session?.user) {
    return {
      authorized: false,
      error: 'Authentication required',
      status: 401,
    };
  }

  if (!session.user.tenantId) {
    return {
      authorized: false,
      error: 'Tenant not configured',
      status: 401,
    };
  }

  if (!hasRole(session.user.role, requiredRole)) {
    return {
      authorized: false,
      error: `Insufficient permissions. Required role: ${requiredRole}`,
      status: 403,
    };
  }

  return {
    authorized: true,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
  };
}
