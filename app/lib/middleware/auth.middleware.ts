/**
 * Da Vinci Authentication Middleware
 *
 * Provides utilities for protecting routes and checking permissions
 */

import { redirect } from '@remix-run/node';
import { getAuthenticatedUser, requireAuthenticatedUser, type AuthUser } from '../services/auth.server';

// ============================================================================
// Role-Based Access Control
// ============================================================================

export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export const RoleHierarchy: Record<UserRole, number> = {
  ADMIN: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  const userRole = user.roles[0] as UserRole;
  const userLevel = RoleHierarchy[userRole] || 0;
  const requiredLevel = RoleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Require user to have specific role
 */
export function requireRole(user: AuthUser, requiredRole: UserRole): void {
  if (!hasRole(user, requiredRole)) {
    throw new Response('Forbidden: Insufficient permissions', { status: 403 });
  }
}

// ============================================================================
// Organization Access Control
// ============================================================================

/**
 * Check if user has access to organization
 */
export function hasOrganizationAccess(user: AuthUser, organizationId: string): boolean {
  // Admins have access to all organizations
  if (hasRole(user, 'ADMIN')) {
    return true;
  }

  // Check if user's current organization matches
  return user.organizationId === organizationId;
}

/**
 * Require user to have access to organization
 */
export function requireOrganizationAccess(user: AuthUser, organizationId: string): void {
  if (!hasOrganizationAccess(user, organizationId)) {
    throw new Response('Forbidden: No access to this organization', { status: 403 });
  }
}

// ============================================================================
// Route Protection Utilities
// ============================================================================

/**
 * Protect a route - require authentication
 */
export async function protectRoute(request: Request, redirectTo?: string): Promise<AuthUser> {
  const pathname = redirectTo || new URL(request.url).pathname;
  return await requireAuthenticatedUser(request, pathname);
}

/**
 * Protect a route with role requirement
 */
export async function protectRouteWithRole(
  request: Request,
  requiredRole: UserRole,
  redirectTo?: string
): Promise<AuthUser> {
  const user = await protectRoute(request, redirectTo);
  requireRole(user, requiredRole);
  return user;
}

/**
 * Protect a route with organization access requirement
 */
export async function protectRouteWithOrganization(
  request: Request,
  organizationId: string,
  redirectTo?: string
): Promise<AuthUser> {
  const user = await protectRoute(request, redirectTo);
  requireOrganizationAccess(user, organizationId);
  return user;
}

// ============================================================================
// Optional Authentication
// ============================================================================

/**
 * Get user if authenticated, but don't require it
 */
export async function getOptionalUser(request: Request): Promise<AuthUser | null> {
  return await getAuthenticatedUser(request);
}

// ============================================================================
// API Route Protection
// ============================================================================

/**
 * Protect an API route - returns JSON error instead of redirect
 */
export async function protectApiRoute(request: Request): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}

/**
 * Protect an API route with role requirement
 */
export async function protectApiRouteWithRole(
  request: Request,
  requiredRole: UserRole
): Promise<AuthUser> {
  const user = await protectApiRoute(request);

  if (!hasRole(user, requiredRole)) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: requiredRole,
        current: user.roles?.[0] || 'none',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}
