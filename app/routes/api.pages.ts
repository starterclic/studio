/**
 * Pages API
 *
 * CRUD operations for visual builder pages
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
import { type PageType } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

interface CreatePageRequest {
  projectId: string;
  title: string;
  slug: string;
  type?: PageType;
  content?: object;
  metaTitle?: string;
  metaDescription?: string;
}

interface UpdatePageRequest {
  title?: string;
  slug?: string;
  type?: PageType;
  content?: object;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  isDraft?: boolean;
}

// ============================================================================
// GET /api/pages?projectId={projectId}
// List all pages for a project
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUserContext(request);

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(user, Permission.READ_PROJECT);

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify user has access to this project
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    requireSameOrganization(user, project.organizationId);

    // Get all pages for this project
    const pages = await db.page.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    return json({ success: true, pages });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return json({ error: error.message }, { status: 403 });
    }

    console.error('Pages API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/pages
// Create a new page
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
      requirePermission(user, Permission.USE_VISUAL_BUILDER);

      const data: CreatePageRequest = await request.json();

      if (!data.projectId || !data.title || !data.slug) {
        return json(
          { error: 'projectId, title, and slug are required' },
          { status: 400 }
        );
      }

      // Verify user has access to this project
      const project = await db.project.findUnique({
        where: { id: data.projectId },
        select: { organizationId: true },
      });

      if (!project) {
        return json({ error: 'Project not found' }, { status: 404 });
      }

      requireSameOrganization(user, project.organizationId);

      // Create page
      const page = await db.page.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          slug: data.slug,
          path: `/pages/${data.slug}.astro`,
          type: data.type || 'STANDARD',
          content: data.content || {},
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          createdBy: user.id,
        },
      });

      // Create initial version
      await db.pageVersion.create({
        data: {
          pageId: page.id,
          version: 1,
          content: data.content || {},
          createdBy: user.id,
        },
      });

      return json({ success: true, page });
    }

    // UPDATE
    if (method === 'PATCH') {
      requirePermission(user, Permission.UPDATE_COMPONENT);

      const data: UpdatePageRequest & { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this page
      const page = await db.page.findUnique({
        where: { id: data.id },
        include: {
          project: {
            select: { organizationId: true },
          },
        },
      });

      if (!page) {
        return json({ error: 'Page not found' }, { status: 404 });
      }

      requireSameOrganization(user, page.project.organizationId);

      // Update page
      const updatedPage = await db.page.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          type: data.type,
          content: data.content,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          isPublished: data.isPublished,
          isDraft: data.isDraft,
        },
      });

      // Create new version if content changed
      if (data.content) {
        const latestVersion = await db.pageVersion.findFirst({
          where: { pageId: data.id },
          orderBy: { version: 'desc' },
        });

        await db.pageVersion.create({
          data: {
            pageId: data.id,
            version: (latestVersion?.version || 0) + 1,
            content: data.content,
            createdBy: user.id,
          },
        });
      }

      return json({ success: true, page: updatedPage });
    }

    // DELETE
    if (method === 'DELETE') {
      requirePermission(user, Permission.DELETE_COMPONENT);

      const data: { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this page
      const page = await db.page.findUnique({
        where: { id: data.id },
        include: {
          project: {
            select: { organizationId: true },
          },
        },
      });

      if (!page) {
        return json({ error: 'Page not found' }, { status: 404 });
      }

      requireSameOrganization(user, page.project.organizationId);

      // Delete page (cascade will delete versions)
      await db.page.delete({
        where: { id: data.id },
      });

      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return json({ error: error.message }, { status: 403 });
    }

    console.error('Pages API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
