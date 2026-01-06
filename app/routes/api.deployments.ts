/**
 * Da Vinci Deployments API
 *
 * Manages project deployments through Coolify integration
 */

import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import { getCoolifyClient } from '~/lib/services/coolify.server';
import type { CoolifyApplication } from '~/lib/services/coolify.server';

/**
 * GET /api/deployments
 * List all deployments
 *
 * Query params:
 * - projectId: Filter by project ID
 * - status: Filter by status (pending, building, deployed, failed)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');

    const where: any = {};
    if (projectId) {
      where.projectId = parseInt(projectId);
    }
    if (status) {
      where.status = status;
    }

    const deployments = await db.deployment.findMany({
      where,
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return json({
      deployments,
      count: deployments.length,
    });
  } catch (error: any) {
    return json(
      { error: error.message || 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deployments
 * Create a new deployment
 *
 * Body:
 * {
 *   projectId: number,
 *   gitBranch?: string,
 *   forceRebuild?: boolean,
 *   commitSha?: string
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { projectId, gitBranch, forceRebuild, commitSha } = body;

    if (!projectId) {
      return json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get project details
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    });

    if (!project) {
      return json(
        { error: `Project with id ${projectId} not found` },
        { status: 404 }
      );
    }

    // If project doesn't have a Coolify UUID yet, create the application
    let coolifyAppUuid = project.coolifyAppUuid;

    if (!coolifyAppUuid) {
      const coolify = getCoolifyClient();

      // You'll need to get these from your project settings
      // For now, using placeholders
      const coolifyApp = await coolify.createPublicGitApp({
        project_uuid: process.env.COOLIFY_PROJECT_UUID || '',
        server_uuid: process.env.COOLIFY_SERVER_UUID || '',
        environment_name: 'production',
        destination_uuid: process.env.COOLIFY_DESTINATION_UUID || '',
        git_repository: project.gitRepository || '',
        git_branch: gitBranch || project.gitBranch || 'main',
        name: project.name,
        description: `Da Vinci project: ${project.name}`,
        domains: project.subdomain ? `${project.subdomain}.${project.organization.customDomain || 'dev.cybtek.fr'}` : undefined,
        build_pack: 'nixpacks',
      });

      coolifyAppUuid = coolifyApp.uuid;

      // Update project with Coolify UUID
      await db.project.update({
        where: { id: projectId },
        data: { coolifyAppUuid },
      });
    }

    // Create deployment record
    const deployment = await db.deployment.create({
      data: {
        projectId,
        status: 'pending',
        gitBranch: gitBranch || project.gitBranch || 'main',
        commitSha: commitSha || null,
        coolifyDeploymentUuid: null, // Will be updated after deployment starts
      },
    });

    // Trigger deployment in Coolify
    const coolify = getCoolifyClient();
    const deploymentResponse = await coolify.deployApplication(coolifyAppUuid, {
      force_rebuild: forceRebuild,
      commit_sha: commitSha,
    });

    // Update deployment with Coolify UUID and status
    const updatedDeployment = await db.deployment.update({
      where: { id: deployment.id },
      data: {
        coolifyDeploymentUuid: deploymentResponse.uuid,
        status: 'building',
      },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    return json({
      deployment: updatedDeployment,
      message: 'Deployment started successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return json(
      { error: error.message || 'Failed to create deployment' },
      { status: 500 }
    );
  }
}
