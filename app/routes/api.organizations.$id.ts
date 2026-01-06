/**
 * API Route: Organization Details (Lecture, Mise à jour, Suppression)
 * GET /api/organizations/:id - Récupère une organisation
 * PUT /api/organizations/:id - Met à jour une organisation
 * DELETE /api/organizations/:id - Supprime une organisation
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/organizations/:id
 * Récupère les détails d'une organisation avec ses relations
 */
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const includeProjects = url.searchParams.get('includeProjects') === 'true';
    const includeUsers = url.searchParams.get('includeUsers') === 'true';

    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        projects: includeProjects
          ? {
              include: {
                deployments: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                },
              },
            }
          : false,
        users: includeUsers,
        _count: {
          select: {
            projects: true,
            users: true,
          },
        },
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: organization,
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
 * PUT /api/organizations/:id - Mise à jour
 * DELETE /api/organizations/:id - Suppression
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // PUT - Mise à jour
    if (request.method === 'PUT') {
      const body = (await request.json()) as any;
      const { name, customDomain, plan, brandingLogo, brandingColors, maxProjects, maxUsers } = body;

      const organization = await db.organization.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(customDomain !== undefined && { customDomain: customDomain?.trim() || null }),
          ...(plan && { plan }),
          ...(brandingLogo !== undefined && { brandingLogo: brandingLogo?.trim() || null }),
          ...(brandingColors !== undefined && { brandingColors }),
          ...(maxProjects && { maxProjects }),
          ...(maxUsers && { maxUsers }),
        },
      });

      return Response.json({
        success: true,
        data: organization,
        message: 'Organization updated successfully',
      });
    }

    // DELETE - Suppression
    if (request.method === 'DELETE') {
      await db.organization.delete({
        where: { id },
      });

      return Response.json({
        success: true,
        message: 'Organization deleted successfully',
      });
    }

    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
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
