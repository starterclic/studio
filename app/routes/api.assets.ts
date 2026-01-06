/**
 * Assets API
 *
 * Media library management (images, videos, documents, etc.)
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
import { type AssetType } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

interface CreateAssetRequest {
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  type: AssetType;
  width?: number;
  height?: number;
  altText?: string;
}

interface UpdateAssetRequest {
  altText?: string;
  filename?: string;
}

// ============================================================================
// GET /api/assets
// List all assets for an organization
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUserContext(request);

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(user, Permission.MANAGE_MEDIA_LIBRARY);

    const url = new URL(request.url);
    const type = url.searchParams.get('type') as AssetType | null;
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get assets for user's organization
    const assets = await db.asset.findMany({
      where: {
        organizationId: user.organizationId,
        ...(type && { type }),
        ...(search && {
          OR: [
            { filename: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await db.asset.count({
      where: {
        organizationId: user.organizationId,
        ...(type && { type }),
        ...(search && {
          OR: [
            { filename: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    });

    // Calculate storage usage
    const storageUsage = await db.asset.aggregate({
      where: { organizationId: user.organizationId },
      _sum: { size: true },
    });

    return json({
      success: true,
      assets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      storageUsage: {
        bytes: storageUsage._sum.size || 0,
        mb: Math.round((storageUsage._sum.size || 0) / 1024 / 1024),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return json({ error: error.message }, { status: 403 });
    }

    console.error('Assets API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/assets
// Upload a new asset
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await getUserContext(request);

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = request.method;

    // CREATE (Upload)
    if (method === 'POST') {
      requirePermission(user, Permission.UPLOAD_ASSET);

      const data: CreateAssetRequest = await request.json();

      if (!data.filename || !data.path || !data.url || !data.mimeType || !data.size) {
        return json(
          { error: 'filename, path, url, mimeType, and size are required' },
          { status: 400 }
        );
      }

      // Get organization to check storage limits
      const organization = await db.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          assets: {
            select: { size: true },
          },
        },
      });

      if (!organization) {
        return json({ error: 'Organization not found' }, { status: 404 });
      }

      // Calculate current storage usage
      const currentUsageMB =
        organization.assets.reduce((sum, asset) => sum + asset.size, 0) / 1024 / 1024;

      const newAssetSizeMB = data.size / 1024 / 1024;

      // Check storage limit
      if (currentUsageMB + newAssetSizeMB > organization.maxStorageGB * 1024) {
        return json(
          {
            error: `Storage limit exceeded. You have ${Math.round(
              currentUsageMB
            )} MB used of ${organization.maxStorageGB * 1024} MB limit.`,
          },
          { status: 413 }
        );
      }

      // Create asset
      const asset = await db.asset.create({
        data: {
          filename: data.filename,
          path: data.path,
          url: data.url,
          mimeType: data.mimeType,
          size: data.size,
          type: data.type,
          width: data.width,
          height: data.height,
          altText: data.altText,
          organizationId: user.organizationId,
          uploadedBy: user.id,
        },
      });

      return json({ success: true, asset });
    }

    // UPDATE
    if (method === 'PATCH') {
      requirePermission(user, Permission.MANAGE_MEDIA_LIBRARY);

      const data: UpdateAssetRequest & { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this asset
      const asset = await db.asset.findUnique({
        where: { id: data.id },
      });

      if (!asset) {
        return json({ error: 'Asset not found' }, { status: 404 });
      }

      requireSameOrganization(user, asset.organizationId);

      // Update asset
      const updatedAsset = await db.asset.update({
        where: { id: data.id },
        data: {
          altText: data.altText,
          filename: data.filename,
        },
      });

      return json({ success: true, asset: updatedAsset });
    }

    // DELETE
    if (method === 'DELETE') {
      requirePermission(user, Permission.DELETE_ASSET);

      const data: { id: string } = await request.json();

      if (!data.id) {
        return json({ error: 'id is required' }, { status: 400 });
      }

      // Verify user has access to this asset
      const asset = await db.asset.findUnique({
        where: { id: data.id },
      });

      if (!asset) {
        return json({ error: 'Asset not found' }, { status: 404 });
      }

      requireSameOrganization(user, asset.organizationId);

      // Delete asset from database
      // Note: You may also want to delete the actual file from storage (S3, etc.)
      await db.asset.delete({
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

    console.error('Assets API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
