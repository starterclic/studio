/**
 * API Route: Users (Liste & Création)
 * GET /api/users - Liste tous les utilisateurs
 * POST /api/users - Crée un nouvel utilisateur
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/users
 * Récupère la liste de tous les utilisateurs
 * Query params:
 * - organizationId: filtre par organisation
 * - role: filtre par rôle (OWNER, ADMIN, DEVELOPER, VIEWER)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const role = url.searchParams.get('role');

    const users = await db.user.findMany({
      where: {
        ...(organizationId && { organizationId }),
        ...(role && { role: role as any }),
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
};

/**
 * POST /api/users
 * Crée un nouvel utilisateur
 *
 * Body: {
 *   email: string,
 *   name: string,
 *   organizationId: string,
 *   role?: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER',
 *   authentikId?: string
 * }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const body = (await request.json()) as any;
    const { email, name, organizationId, role, authentikId } = body;

    // Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json(
        {
          success: false,
          error: 'Valid email is required',
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Name is required',
        },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return Response.json(
        {
          success: false,
          error: 'Organization ID is required',
        },
        { status: 400 }
      );
    }

    // Vérifier que l'organisation existe
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return Response.json(
        {
          success: false,
          error: 'Organization not found',
        },
        { status: 404 }
      );
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        organizationId,
        role: role || 'CLIENT_EDITOR',
        authentikId: authentikId?.trim() || null,
      },
      include: {
        organization: true,
      },
    });

    return Response.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
};
