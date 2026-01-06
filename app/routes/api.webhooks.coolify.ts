/**
 * Da Vinci Coolify Webhooks Handler
 *
 * Receives and processes deployment events from Coolify in real-time
 * Documentation: https://coolify.io/docs/api/webhooks
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import {
  notifyDeploymentStarted,
  notifyDeploymentSuccess,
  notifyDeploymentFailed,
} from '~/lib/services/notifications.server';

// Coolify webhook event types
type CoolifyEventType =
  | 'application:deployment:started'
  | 'application:deployment:success'
  | 'application:deployment:failed'
  | 'application:status:changed'
  | 'application:restarted'
  | 'server:status:changed';

interface CoolifyWebhookPayload {
  event: CoolifyEventType;
  data: {
    applicationUuid?: string;
    deploymentUuid?: string;
    serverUuid?: string;
    status?: string;
    message?: string;
    logs?: string;
    startedAt?: string;
    finishedAt?: string;
    duration?: number;
    error?: string;
    commitSha?: string;
    commitMessage?: string;
    branch?: string;
  };
  timestamp: string;
}

/**
 * POST /api/webhooks/coolify
 *
 * Receives webhook events from Coolify and updates deployments in real-time
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse webhook payload
    const payload: CoolifyWebhookPayload = await request.json();

    console.log('[Coolify Webhook]', {
      event: payload.event,
      applicationUuid: payload.data.applicationUuid,
      deploymentUuid: payload.data.deploymentUuid,
      timestamp: payload.timestamp,
    });

    // Verify webhook signature (if configured)
    const webhookSecret = process.env.COOLIFY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-coolify-signature');
      if (!signature || !verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error('[Coolify Webhook] Invalid signature');
        return json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process the event
    const result = await processWebhookEvent(payload);

    return json({
      success: true,
      event: payload.event,
      processed: result,
    });
  } catch (error: any) {
    console.error('[Coolify Webhook] Error processing webhook:', error);
    return json(
      { error: 'Failed to process webhook', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(payload: CoolifyWebhookPayload) {
  const { event, data } = payload;

  switch (event) {
    case 'application:deployment:started':
      return await handleDeploymentStarted(data);

    case 'application:deployment:success':
      return await handleDeploymentSuccess(data);

    case 'application:deployment:failed':
      return await handleDeploymentFailed(data);

    case 'application:status:changed':
      return await handleApplicationStatusChanged(data);

    case 'application:restarted':
      return await handleApplicationRestarted(data);

    case 'server:status:changed':
      return await handleServerStatusChanged(data);

    default:
      console.warn('[Coolify Webhook] Unknown event type:', event);
      return { handled: false, reason: 'Unknown event type' };
  }
}

/**
 * Handle deployment started event
 */
async function handleDeploymentStarted(data: CoolifyWebhookPayload['data']) {
  const { deploymentUuid, applicationUuid, startedAt } = data;

  if (!deploymentUuid) {
    return { handled: false, reason: 'Missing deploymentUuid' };
  }

  // Find deployment by Coolify UUID
  const deployment = await db.deployment.findFirst({
    where: { coolifyDeploymentUuid: deploymentUuid },
  });

  if (!deployment) {
    // If no existing deployment found, try to find by application UUID
    if (applicationUuid) {
      const project = await db.project.findFirst({
        where: { coolifyAppUuid: applicationUuid },
      });

      if (project) {
        // Create new deployment record
        const newDeployment = await db.deployment.create({
          data: {
            projectId: project.id,
            coolifyDeploymentUuid: deploymentUuid,
            status: 'building',
            startedAt: startedAt ? new Date(startedAt) : new Date(),
            commitSha: data.commitSha,
            commitMessage: data.commitMessage,
            gitBranch: data.branch || project.gitBranch,
          },
        });

        // Send notification
        await notifyDeploymentStarted(newDeployment.id, project.name);

        return { handled: true, action: 'created' };
      }
    }

    return { handled: false, reason: 'Deployment not found' };
  }

  // Update existing deployment
  const updatedDeployment = await db.deployment.update({
    where: { id: deployment.id },
    data: {
      status: 'building',
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      error: null, // Clear any previous errors
    },
    include: {
      project: true,
    },
  });

  // Send notification
  await notifyDeploymentStarted(updatedDeployment.id, updatedDeployment.project.name);

  return { handled: true, action: 'updated', deploymentId: deployment.id };
}

/**
 * Handle deployment success event
 */
async function handleDeploymentSuccess(data: CoolifyWebhookPayload['data']) {
  const { deploymentUuid, finishedAt, duration, logs } = data;

  if (!deploymentUuid) {
    return { handled: false, reason: 'Missing deploymentUuid' };
  }

  const deployment = await db.deployment.findFirst({
    where: { coolifyDeploymentUuid: deploymentUuid },
  });

  if (!deployment) {
    return { handled: false, reason: 'Deployment not found' };
  }

  // Calculate duration if not provided
  let calculatedDuration = duration;
  if (!calculatedDuration && deployment.startedAt) {
    const start = new Date(deployment.startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    calculatedDuration = Math.floor((end - start) / 1000); // seconds
  }

  const updatedDeployment = await db.deployment.update({
    where: { id: deployment.id },
    data: {
      status: 'deployed',
      deployedAt: new Date(),
      finishedAt: finishedAt ? new Date(finishedAt) : new Date(),
      duration: calculatedDuration,
      buildLogs: logs || deployment.buildLogs,
      error: null,
    },
    include: {
      project: true,
    },
  });

  // Send notification
  await notifyDeploymentSuccess(
    updatedDeployment.id,
    updatedDeployment.project.name,
    calculatedDuration
  );

  return { handled: true, action: 'updated', deploymentId: deployment.id };
}

/**
 * Handle deployment failed event
 */
async function handleDeploymentFailed(data: CoolifyWebhookPayload['data']) {
  const { deploymentUuid, finishedAt, duration, error, logs } = data;

  if (!deploymentUuid) {
    return { handled: false, reason: 'Missing deploymentUuid' };
  }

  const deployment = await db.deployment.findFirst({
    where: { coolifyDeploymentUuid: deploymentUuid },
  });

  if (!deployment) {
    return { handled: false, reason: 'Deployment not found' };
  }

  // Calculate duration if not provided
  let calculatedDuration = duration;
  if (!calculatedDuration && deployment.startedAt) {
    const start = new Date(deployment.startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    calculatedDuration = Math.floor((end - start) / 1000);
  }

  const updatedDeployment = await db.deployment.update({
    where: { id: deployment.id },
    data: {
      status: 'failed',
      finishedAt: finishedAt ? new Date(finishedAt) : new Date(),
      duration: calculatedDuration,
      error: error || 'Deployment failed',
      buildLogs: logs || deployment.buildLogs,
    },
    include: {
      project: true,
    },
  });

  // Send notification
  await notifyDeploymentFailed(
    updatedDeployment.id,
    updatedDeployment.project.name,
    error
  );

  return { handled: true, action: 'updated', deploymentId: deployment.id };
}

/**
 * Handle application status changed event
 */
async function handleApplicationStatusChanged(data: CoolifyWebhookPayload['data']) {
  const { applicationUuid, status } = data;

  if (!applicationUuid) {
    return { handled: false, reason: 'Missing applicationUuid' };
  }

  const project = await db.project.findFirst({
    where: { coolifyAppUuid: applicationUuid },
  });

  if (!project) {
    return { handled: false, reason: 'Project not found' };
  }

  // Map Coolify status to our ProjectStatus enum
  let projectStatus = project.status;

  if (status === 'running') {
    projectStatus = 'DEPLOYED';
  } else if (status === 'stopped') {
    projectStatus = 'STOPPED';
  } else if (status === 'exited' || status === 'error') {
    projectStatus = 'FAILED';
  }

  await db.project.update({
    where: { id: project.id },
    data: { status: projectStatus },
  });

  return { handled: true, action: 'updated', projectId: project.id };
}

/**
 * Handle application restarted event
 */
async function handleApplicationRestarted(data: CoolifyWebhookPayload['data']) {
  const { applicationUuid } = data;

  if (!applicationUuid) {
    return { handled: false, reason: 'Missing applicationUuid' };
  }

  const project = await db.project.findFirst({
    where: { coolifyAppUuid: applicationUuid },
  });

  if (!project) {
    return { handled: false, reason: 'Project not found' };
  }

  // Update project status to deployed (running)
  await db.project.update({
    where: { id: project.id },
    data: { status: 'DEPLOYED' },
  });

  return { handled: true, action: 'updated', projectId: project.id };
}

/**
 * Handle server status changed event
 */
async function handleServerStatusChanged(data: CoolifyWebhookPayload['data']) {
  const { serverUuid, status } = data;

  console.log('[Coolify Webhook] Server status changed:', {
    serverUuid,
    status,
  });

  // Currently we don't track servers in our DB, but we log the event
  // In the future, we could store server health status

  return { handled: true, action: 'logged' };
}

/**
 * Verify webhook signature (HMAC SHA-256)
 */
function verifyWebhookSignature(
  payload: CoolifyWebhookPayload,
  signature: string,
  secret: string
): boolean {
  try {
    // Coolify typically uses HMAC SHA-256 for webhook signatures
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const payloadString = JSON.stringify(payload);
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('[Coolify Webhook] Signature verification error:', error);
    return false;
  }
}
