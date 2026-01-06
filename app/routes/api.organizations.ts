/**
 * API Route: Organizations (Liste & Création)
 * GET /api/organizations - Liste toutes les organisations
 * POST /api/organizations - Crée une nouvelle organisation
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/organizations
 * Récupère la liste de toutes les organisations avec leurs projets
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const includeProjects = url.searchParams.get('includeProjects') === 'true';
    const includeUsers = url.searchParams.get('includeUsers') === 'true';

    const organizations = await db.organization.findMany({
      include: {
        projects: includeProjects,
        users: includeUsers,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({
      success: true,
      data: organizations,
      count: organizations.length,
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
 * POST /api/organizations
 * Crée une nouvelle organisation
 *
 * Body: {
 *   name: string,
 *   slug: string,
 *   customDomain?: string,
 *   plan?: string,
 *   brandingLogo?: string,
 *   brandingColors?: object
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
    const { name, slug, customDomain, plan, brandingLogo, brandingColors, maxProjects, maxUsers } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Organization name is required',
        },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Organization slug is required',
        },
        { status: 400 }
      );
    }

    const organization = await db.organization.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        customDomain: customDomain?.trim() || null,
        plan: plan || 'free',
        brandingLogo: brandingLogo?.trim() || null,
        brandingColors: brandingColors || null,
        maxProjects: maxProjects || 3,
        maxUsers: maxUsers || 5,
      },
    });

    return Response.json(
      {
        success: true,
        data: organization,
        message: 'Organization created successfully',
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
