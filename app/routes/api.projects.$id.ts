/**
 * API Route: Project Details (Lecture, Mise à jour, Suppression)
 * GET /api/projects/:id - Récupère un projet
 * PUT /api/projects/:id - Met à jour un projet
 * DELETE /api/projects/:id - Supprime un projet
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/projects/:id
 * Récupère les détails d'un projet avec ses déploiements
 */
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const includeDeployments = url.searchParams.get('includeDeployments') !== 'false';

    const project = await db.project.findUnique({
      where: { id },
      include: {
        organization: true,
        deployments: includeDeployments
          ? {
              orderBy: { createdAt: 'desc' },
            }
          : false,
        _count: {
          select: {
            deployments: true,
          },
        },
      },
    });

    if (!project) {
      return Response.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: project,
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
 * PUT /api/projects/:id - Mise à jour
 * DELETE /api/projects/:id - Suppression
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // PUT - Mise à jour
    if (request.method === 'PUT') {
      const body = (await request.json()) as any;
      const { name, subdomain, customDomain, status, coolifyProjectId, repoUrl } = body;

      const project = await db.project.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(subdomain && { subdomain: subdomain.trim() }),
          ...(customDomain !== undefined && { customDomain: customDomain?.trim() || null }),
          ...(status && { status }),
          ...(coolifyProjectId !== undefined && {
            coolifyProjectId: coolifyProjectId?.trim() || null,
          }),
          ...(repoUrl !== undefined && {
            repoUrl: repoUrl?.trim() || null,
          }),
        },
        include: {
          organization: true,
          _count: {
            select: {
              deployments: true,
            },
          },
        },
      });

      return Response.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    }

    // DELETE - Suppression (avec cascade sur les déploiements)
    if (request.method === 'DELETE') {
      await db.project.delete({
        where: { id },
      });

      return Response.json({
        success: true,
        message: 'Project deleted successfully (deployments also deleted)',
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
