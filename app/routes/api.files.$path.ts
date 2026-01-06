/**
 * Individual File API Route
 *
 * GET, UPDATE, DELETE operations for specific files with database persistence
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { protectApiRoute } from '~/lib/middleware/auth.middleware';
import { getFile, updateFile, deleteFile, renameFile } from '~/lib/services/files.server';

/**
 * GET /api/files/:path?projectId=xxx
 * Get file content
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await protectApiRoute(request);
  const { path } = params;
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!path || !projectId) {
    return json({ error: 'Path and projectId required' }, { status: 400 });
  }

  try {
    // Decode URL-encoded path
    const decodedPath = decodeURIComponent(path);
    const file = await getFile(decodedPath, projectId, user.id);

    if (!file) {
      return json({ error: 'File not found' }, { status: 404 });
    }

    return json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('[Files API] Error fetching file:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/files/:path?projectId=xxx
 * Update file content or rename
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await protectApiRoute(request);
  const { path } = params;
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!path || !projectId) {
    return json({ error: 'Path and projectId required' }, { status: 400 });
  }

  const decodedPath = decodeURIComponent(path);

  if (request.method === 'PATCH') {
    try {
      const body = await request.json();
      const { content, newPath } = body;

      // Rename/move file
      if (newPath) {
        const file = await renameFile(decodedPath, newPath, projectId, user.id);
        if (!file) {
          return json({ error: 'File not found' }, { status: 404 });
        }
        return json({
          success: true,
          file,
          renamed: true,
        });
      }

      // Update content
      if (content !== undefined) {
        const file = await updateFile(decodedPath, content, projectId, user.id);
        if (!file) {
          return json({ error: 'File not found' }, { status: 404 });
        }
        return json({
          success: true,
          file,
        });
      }

      return json({ error: 'No update provided' }, { status: 400 });
    } catch (error: any) {
      console.error('[Files API] Error updating file:', error);
      return json({ error: error.message }, { status: 500 });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const success = await deleteFile(decodedPath, projectId, user.id);
      if (!success) {
        return json({ error: 'File not found or already deleted' }, { status: 404 });
      }

      return json({
        success: true,
        deleted: decodedPath,
      });
    } catch (error: any) {
      console.error('[Files API] Error deleting file:', error);
      return json({ error: error.message }, { status: 500 });
    }
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
