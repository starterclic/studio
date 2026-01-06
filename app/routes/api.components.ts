/**
 * Component Templates API
 *
 * Manage component library (global and agency-specific templates)
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import { getUserContext } from '~/lib/services/auth.server';
import {
  requirePermission,
  requireSameOrganization,
  ForbiddenError,
  UnauthorizedError,
} from '~/lib/middleware/rbac.middleware';
import { Permission } from '~/lib/rbac/permissions';
import { type ComponentCategory } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

interface CreateComponentRequest {
  name: string;
  slug: string;
  description?: string;
  category: ComponentCategory;
  astroCode: string;
  propsSchema?: object;
  thumbnail?: string;
  previewUrl?: string;
  isGlobal?: boolean;
  isPremium?: boolean;
}

interface UpdateComponentRequest {
  name?: string;
  slug?: string;
  description?: string;
  category?: ComponentCategory;
  astroCode?: string;
  propsSchema?: object;
  thumbnail?: string;
  previewUrl?: string;
  isPremium?: boolean;
  version?: string;
}

// ============================================================================
// GET /api/components
// List all available components (global + agency-specific)
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUserContext(request);

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(user, Permission.VIEW_COMPONENTS);

    const url = new URL(request.url);
    const category = url.searchParams.get('category') as ComponentCategory | null;
    const search = url.searchParams.get('search');

    // Get components:
    // 1. Global components (isGlobal = true)
    // 2. Agency-specific components (organizationId = user.organizationId)
    const components = await db.componentTemplate.findMany({
      where: {
        AND: [
          {
            OR: [
              { isGlobal: true },
              { organizationId: user.organizationId },
            ],
          },
          category ? { category } : {},
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        thumbnail: true,
        previewUrl: true,
        isGlobal: true,
        isPremium: true,
        usageCount: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose astroCode in list view (for performance)
      },
    });

    return json({ success: true, components });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return json({ error: error.message }, { status: 403 });
    }

    console.error('Components API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/components
// Create a new component template
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await getUserContext(request);

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = request.method;

    // CREATE
    if (method === 'POST') {
      requirePermission(user, Permission.CREATE_CUSTOM_COMPONENT);

      const data: CreateComponentRequest = await request.json();

      if (!data.name || !data.slug || !data.astroCode) {
        return json(
          { error: 'name, slug, and astroCode are required' },
          { status: 400 }
        );
      }

      // Only SUPER_ADMIN can create global components
      const isGlobal = data.isGlobal && user.role === 'SUPER_ADMIN';

      // Create component
      const component = await db.componentTemplate.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          category: data.category,
          astroCode: data.astroCode,
          propsSchema: data.propsSchema || {},
          thumbnail: data.thumbnail,
          previewUrl: data.previewUrl,
          isGlobal,
          isPremium: data.isPremium || false,
          organizationId: isGlobal ? null : user.organizationId,
        },
      });

      return json({ success: true, component });
    }

    // UPDATE
    if (method === 'PATCH') {
      requirePermission(user, Permission.MANAGE_TEMPLATES);

      const data: UpdateComponentRequest & { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this component
      const component = await db.componentTemplate.findUnique({
        where: { id: data.id },
      });

      if (!component) {
        return json({ error: 'Component not found' }, { status: 404 });
      }

      // Can only edit agency-specific components (or global if SUPER_ADMIN)
      if (component.isGlobal && user.role !== 'SUPER_ADMIN') {
        return json({ error: 'Cannot edit global components' }, { status: 403 });
      }

      if (!component.isGlobal && component.organizationId !== user.organizationId) {
        return json(
          { error: 'Cannot edit components from other agencies' },
          { status: 403 }
        );
      }

      // Update component
      const updatedComponent = await db.componentTemplate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          category: data.category,
          astroCode: data.astroCode,
          propsSchema: data.propsSchema,
          thumbnail: data.thumbnail,
          previewUrl: data.previewUrl,
          isPremium: data.isPremium,
          version: data.version,
        },
      });

      return json({ success: true, component: updatedComponent });
    }

    // DELETE
    if (method === 'DELETE') {
      requirePermission(user, Permission.MANAGE_TEMPLATES);

      const data: { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this component
      const component = await db.componentTemplate.findUnique({
        where: { id: data.id },
      });

      if (!component) {
        return json({ error: 'Component not found' }, { status: 404 });
      }

      // Can only delete agency-specific components (or global if SUPER_ADMIN)
      if (component.isGlobal && user.role !== 'SUPER_ADMIN') {
        return json({ error: 'Cannot delete global components' }, { status: 403 });
      }

      if (!component.isGlobal && component.organizationId !== user.organizationId) {
        return json(
          { error: 'Cannot delete components from other agencies' },
          { status: 403 }
        );
      }

      // Delete component
      await db.componentTemplate.delete({
        where: { id: data.id },
      });

      return json({ success: true });
    }

    // GET single component (with full astroCode)
    if (method === 'GET') {
      requirePermission(user, Permission.VIEW_COMPONENTS);

      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      const component = await db.componentTemplate.findUnique({
        where: { id },
      });

      if (!component) {
        return json({ error: 'Component not found' }, { status: 404 });
      }

      // Check access
      if (
        !component.isGlobal &&
        component.organizationId !== user.organizationId &&
        user.role !== 'SUPER_ADMIN'
      ) {
        return json({ error: 'Access denied' }, { status: 403 });
      }

      // Increment usage count
      await db.componentTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });

      return json({ success: true, component });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return json({ error: error.message }, { status: 403 });
    }

    console.error('Components API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
