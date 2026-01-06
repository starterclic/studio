/**
 * RBAC Middleware
 *
 * Provides authorization checks for API routes and loaders
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { type UserRole } from '@prisma/client';
import { hasPermission, hasAllPermissions, hasAnyPermission, Permission } from '../rbac/permissions';

/**
 * User context from authenticated session
 */
export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

/**
 * Error thrown when user doesn't have required permission
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'You must be logged in to access this resource') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Require user to have a specific permission
 * Throws ForbiddenError if user doesn't have permission
 */
export function requirePermission(user: UserContext | null, permission: Permission): void {
  if (!user) {
    throw new UnauthorizedError();
  }

  if (!hasPermission(user.role, permission)) {
    throw new ForbiddenError(
      `Your role (${user.role}) does not have permission to: ${permission}`
    );
  }
}

/**
 * Require user to have ALL of the specified permissions
 * Throws ForbiddenError if user is missing any permission
 */
export function requireAllPermissions(
  user: UserContext | null,
  permissions: Permission[]
): void {
  if (!user) {
    throw new UnauthorizedError();
  }

  if (!hasAllPermissions(user.role, permissions)) {
    throw new ForbiddenError(
      `Your role (${user.role}) is missing required permissions: ${permissions.join(', ')}`
    );
  }
}

/**
 * Require user to have ANY of the specified permissions
 * Throws ForbiddenError if user has none of the permissions
 */
export function requireAnyPermission(
  user: UserContext | null,
  permissions: Permission[]
): void {
  if (!user) {
    throw new UnauthorizedError();
  }

  if (!hasAnyPermission(user.role, permissions)) {
    throw new ForbiddenError(
      `Your role (${user.role}) must have at least one of: ${permissions.join(', ')}`
    );
  }
}

/**
 * Require user to have a specific role
 */
export function requireRole(user: UserContext | null, ...roles: UserRole[]): void {
  if (!user) {
    throw new UnauthorizedError();
  }

  if (!roles.includes(user.role)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${roles.join(', ')}`
    );
  }
}

/**
 * Require user to be in the same organization as the resource
 */
export function requireSameOrganization(
  user: UserContext | null,
  resourceOrganizationId: string
): void {
  if (!user) {
    throw new UnauthorizedError();
  }

  if (user.organizationId !== resourceOrganizationId && user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('You can only access resources from your own organization');
  }
}

/**
 * Middleware wrapper for loaders - handles RBAC errors automatically
 */
export function withRBAC<T>(
  handler: (args: LoaderFunctionArgs, user: UserContext) => Promise<T>
) {
  return async (args: LoaderFunctionArgs): Promise<Response | T> => {
    try {
      // Get user from session (you'll need to implement this based on your auth)
      const user = await getUserFromSession(args.request);

      if (!user) {
        throw new UnauthorizedError();
      }

      // Call the actual handler
      return await handler(args, user);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return json({ error: error.message }, { status: 401 });
      }

      if (error instanceof ForbiddenError) {
        return json({ error: error.message }, { status: 403 });
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Middleware wrapper for actions - handles RBAC errors automatically
 */
export function withRBACAction<T>(
  handler: (args: ActionFunctionArgs, user: UserContext) => Promise<T>
) {
  return async (args: ActionFunctionArgs): Promise<Response | T> => {
    try {
      // Get user from session
      const user = await getUserFromSession(args.request);

      if (!user) {
        throw new UnauthorizedError();
      }

      // Call the actual handler
      return await handler(args, user);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return json({ error: error.message }, { status: 401 });
      }

      if (error instanceof ForbiddenError) {
        return json({ error: error.message }, { status: 403 });
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Get user from session
 * Delegates to auth.server.ts
 */
async function getUserFromSession(request: Request): Promise<UserContext | null> {
  const { getUserContext } = await import('../services/auth.server');
  return getUserContext(request);
}

/**
 * Example usage in a route:
 *
 * export const loader = withRBAC(async (args, user) => {
 *   requirePermission(user, Permission.READ_PROJECT);
 *   // ... rest of loader logic
 * });
 *
 * Or manually:
 *
 * export const action = async ({ request }: ActionFunctionArgs) => {
 *   const user = await getUserFromSession(request);
 *   requirePermission(user, Permission.CREATE_PROJECT);
 *   // ... rest of action logic
 * };
 */
