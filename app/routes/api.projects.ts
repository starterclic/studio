/**
 * API Route: Projects (Liste & Création)
 * GET /api/projects - Liste tous les projets
 * POST /api/projects - Crée un nouveau projet
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/projects
 * Récupère la liste de tous les projets
 * Query params:
 * - organizationId: filtre par organisation
 * - status: filtre par statut (ACTIVE, PAUSED, ARCHIVED)
 * - includeDeployments: inclut les déploiements
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status');
    const includeDeployments = url.searchParams.get('includeDeployments') === 'true';

    const projects = await db.project.findMany({
      where: {
        ...(organizationId && { organizationId }),
        ...(status && { status: status as any }),
      },
      include: {
        organization: true,
        deployments: includeDeployments
          ? {
              take: 5,
              orderBy: { createdAt: 'desc' },
            }
          : false,
        _count: {
          select: {
            deployments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({
      success: true,
      data: projects,
      count: projects.length,
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
 * POST /api/projects
 * Crée un nouveau projet
 *
 * Body: {
 *   name: string,
 *   slug: string,
 *   organizationId: string,
 *   subdomain: string,
 *   templateId: string,
 *   customDomain?: string,
 *   coolifyProjectId?: string,
 *   repoUrl?: string,
 *   status?: 'CREATING' | 'BUILDING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETED'
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
    const {
      name,
      slug,
      organizationId,
      subdomain,
      templateId,
      customDomain,
      coolifyProjectId,
      repoUrl,
      status,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Project slug is required',
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

    if (!subdomain || typeof subdomain !== 'string' || subdomain.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Subdomain is required',
        },
        { status: 400 }
      );
    }

    if (!templateId) {
      return Response.json(
        {
          success: false,
          error: 'Template ID is required',
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

    // Vérifier que le template existe
    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return Response.json(
        {
          success: false,
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        organizationId,
        subdomain: subdomain.trim(),
        templateId,
        customDomain: customDomain?.trim() || null,
        coolifyProjectId: coolifyProjectId?.trim() || null,
        repoUrl: repoUrl?.trim() || null,
        status: status || 'CREATING',
      },
      include: {
        organization: true,
      },
    });

    return Response.json(
      {
        success: true,
        data: project,
        message: 'Project created successfully',
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
