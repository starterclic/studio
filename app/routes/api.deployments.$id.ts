/**
 * Da Vinci Individual Deployment API
 *
 * Manage individual deployment operations
 */

import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import { getCoolifyClient } from '~/lib/services/coolify.server';

/**
 * GET /api/deployments/:id
 * Get deployment details
 */
export async function loader({ params }: LoaderFunctionArgs) {
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
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!deployment) {
      return json(
        { error: `Deployment with id ${id} not found` },
        { status: 404 }
      );
    }

    // If we have a Coolify deployment UUID, get logs
    let logs = null;
    if (deployment.project.coolifyAppUuid) {
      try {
        const coolify = getCoolifyClient();
        const logsData = await coolify.getApplicationLogs(deployment.project.coolifyAppUuid);
        logs = logsData.logs;
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    }

    return json({
      deployment: {
        ...deployment,
        logs,
      },
    });
  } catch (error: any) {
    return json(
      { error: error.message || 'Failed to fetch deployment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deployments/:id
 * Update deployment status
 *
 * Body:
 * {
 *   status?: 'pending' | 'building' | 'deployed' | 'failed',
 *   buildLogs?: string,
 *   error?: string
 * }
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const id = parseInt(params.id!);

  if (isNaN(id)) {
    return json(
      { error: 'Invalid deployment ID' },
      { status: 400 }
    );
  }

  if (request.method === 'PATCH') {
    try {
      const body = await request.json();
      const { status, buildLogs, error } = body;

      const updateData: any = {};

      if (status) {
        updateData.status = status;
      }

      if (buildLogs !== undefined) {
        updateData.buildLogs = buildLogs;
      }

      if (error !== undefined) {
        updateData.error = error;
      }

      if (status === 'deployed') {
        updateData.deployedAt = new Date();
      }

      const deployment = await db.deployment.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            include: {
              organization: true,
            },
          },
        },
      });

      return json({ deployment });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to update deployment' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    try {
      // First, check if deployment exists and get project info
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

      // If this deployment is active, stop the Coolify application
      if (deployment.status === 'deployed' && deployment.project.coolifyAppUuid) {
        try {
          const coolify = getCoolifyClient();
          await coolify.stopApplication(deployment.project.coolifyAppUuid);
        } catch (error) {
          console.error('Failed to stop Coolify application:', error);
          // Continue with database deletion even if Coolify stop fails
        }
      }

      // Delete from database
      await db.deployment.delete({
        where: { id },
      });

      return json({
        message: `Deployment ${id} deleted successfully`,
      });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to delete deployment' },
        { status: 500 }
      );
    }
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
