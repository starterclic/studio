/**
 * Files API Route
 *
 * CRUD operations for workspace files with database persistence
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { protectApiRoute } from '~/lib/middleware/auth.middleware';
import { getProjectFiles, createFile } from '~/lib/services/files.server';

/**
 * GET /api/files?projectId=xxx
 * List all files in workspace
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await protectApiRoute(request);
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const files = await getProjectFiles(projectId, user.id);

    return json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error: any) {
    console.error('[Files API] Error fetching files:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/files
 * Create new file or folder
 */
export async function action({ request }: ActionFunctionArgs) {
  const user = await protectApiRoute(request);

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { path, name, type, content, language, projectId } = body;

    if (!path || !name || !type || !projectId) {
      return json(
        { error: 'Missing required fields: path, name, type, projectId' },
        { status: 400 }
      );
    }

    const file = await createFile({
      path,
      name,
      type,
      content,
      language,
      projectId,
      userId: user.id,
    });

    console.log('[Files API] Created:', { path, type, userId: user.id });

    return json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('[Files API] Error creating file:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
