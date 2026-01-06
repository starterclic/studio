/**
 * Da Vinci Deployment Restart API
 *
 * Restart a deployed application
 */

import { ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import { getCoolifyClient } from '~/lib/services/coolify.server';

/**
 * POST /api/deployments/:id/restart
 * Restart a deployed application
 */
export async function action({ params }: ActionFunctionArgs) {
  try {
    const id = parseInt(params.id!);

    if (isNaN(id)) {
      return json(
        { error: 'Invalid deployment ID' },
        { status: 400 }
      );
    }

    const deployment = await db.deployment.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!deployment) {
      return json(
        { error: `Deployment with id ${id} not found` },
        { status: 404 }
      );
    }

    if (!deployment.project.coolifyAppUuid) {
      return json(
        { error: 'No Coolify application associated with this deployment' },
        { status: 400 }
      );
    }

    const coolify = getCoolifyClient();
    await coolify.restartApplication(deployment.project.coolifyAppUuid);

    return json({
      message: 'Application restarted successfully',
      deployment,
    });
  } catch (error: any) {
    return json(
      { error: error.message || 'Failed to restart application' },
      { status: 500 }
    );
  }
}
