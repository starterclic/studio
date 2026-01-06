/**
 * Da Vinci Deployment Detail Page
 *
 * View deployment details, logs, and manage deployment lifecycle
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useFetcher, Link, useNavigation } from '@remix-run/react';
import { useEffect, useState, useRef } from 'react';
import { db } from '~/utils/db.server';
import { getCoolifyClient } from '~/lib/services/coolify.server';

// Types
interface DeploymentDetail {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    customDomain?: string;
  };
  status: 'pending' | 'building' | 'deployed' | 'failed' | 'cancelled';
  commitSha?: string;
  commitMessage?: string;
  gitBranch: string;
  buildNumber: number;
  deployedAt?: string;
  createdAt: string;
  finishedAt?: string;
  duration?: number;
  error?: string;
  buildLogs?: string;
  coolifyDeploymentUuid?: string;
}

// Loader: Fetch deployment details
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('Deployment ID required', { status: 400 });
  }

  const deployment = await db.deployment.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          customDomain: true,
        },
      },
    },
  });

  if (!deployment) {
    throw new Response('Deployment not found', { status: 404 });
  }

  // Fetch live logs from Coolify if deployment is active
  let liveLogs = null;
  if (
    deployment.coolifyDeploymentUuid &&
    (deployment.status === 'building' || deployment.status === 'pending')
  ) {
    try {
      const coolify = getCoolifyClient();
      liveLogs = await coolify.getApplicationLogs(deployment.coolifyDeploymentUuid);
    } catch (error) {
      console.error('Failed to fetch live logs:', error);
    }
  }

  return json({ deployment, liveLogs });
}

// Action: Handle deployment actions (restart, delete, etc.)
export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  const formData = await request.formData();
  const action = formData.get('action');

  if (!id) {
    return json({ error: 'Deployment ID required' }, { status: 400 });
  }

  const deployment = await db.deployment.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!deployment) {
    return json({ error: 'Deployment not found' }, { status: 404 });
  }

  const coolify = getCoolifyClient();

  switch (action) {
    case 'restart':
      if (deployment.project.coolifyAppUuid) {
        try {
          await coolify.restartApplication(deployment.project.coolifyAppUuid);
          return json({ success: true, message: 'Application restarted' });
        } catch (error: any) {
          return json({ error: error.message }, { status: 500 });
        }
      }
      return json({ error: 'No Coolify app UUID' }, { status: 400 });

    case 'redeploy':
      try {
        // Create a new deployment
        const newDeployment = await db.deployment.create({
          data: {
            projectId: deployment.projectId,
            commitSha: deployment.commitSha,
            commitMessage: deployment.commitMessage,
            gitBranch: deployment.gitBranch,
            status: 'pending',
          },
        });

        // Trigger Coolify deployment
        if (deployment.project.coolifyAppUuid) {
          const result = await coolify.deployApplication(deployment.project.coolifyAppUuid);

          await db.deployment.update({
            where: { id: newDeployment.id },
            data: {
              coolifyDeploymentUuid: result.uuid,
              status: 'building',
              startedAt: new Date(),
            },
          });
        }

        return json({
          success: true,
          message: 'Redeployment started',
          deploymentId: newDeployment.id,
        });
      } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
      }

    case 'cancel':
      await db.deployment.update({
        where: { id },
        data: {
          status: 'cancelled',
          finishedAt: new Date(),
        },
      });
      return json({ success: true, message: 'Deployment cancelled' });

    case 'delete':
      await db.deployment.delete({ where: { id } });
      return json({ success: true, message: 'Deployment deleted', redirect: '/deployments' });

    default:
      return json({ error: 'Invalid action' }, { status: 400 });
  }
}

// Component
export default function DeploymentDetailPage() {
  const { deployment: initialDeployment, liveLogs } = useLoaderData<typeof loader>();
  const [deployment, setDeployment] = useState<DeploymentDetail>(initialDeployment);
  const [logs, setLogs] = useState(liveLogs || deployment.buildLogs || '');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  const navigation = useNavigation();

  // Auto-refresh for active deployments
  useEffect(() => {
    if (deployment.status === 'building' || deployment.status === 'pending') {
      const interval = setInterval(() => {
        window.location.reload();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [deployment.status]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Status badge
  const getStatusBadge = (status: DeploymentDetail['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      building: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '🔄' },
      deployed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✅' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '❌' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '🚫' },
    };

    const badge = badges[status];
    const animate = status === 'building' ? 'animate-pulse' : '';

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-medium border ${badge.bg} ${badge.text} ${badge.border} ${animate}`}
      >
        {badge.icon} {status.toUpperCase()}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date);
  };

  // Calculate duration
  const getDuration = () => {
    if (deployment.duration) {
      const mins = Math.floor(deployment.duration / 60);
      const secs = deployment.duration % 60;
      return `${mins}m ${secs}s`;
    }

    if (deployment.startedAt && !deployment.finishedAt) {
      const start = new Date(deployment.startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      return `${mins}m ${secs}s (ongoing)`;
    }

    return '-';
  };

  // Get deployment URL
  const getDeploymentUrl = () => {
    if (deployment.project.customDomain) {
      return `https://${deployment.project.customDomain}`;
    }
    return `https://${deployment.project.subdomain}.davinci.app`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/deployments"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Deployments
            </Link>

            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              {deployment.status === 'deployed' && (
                <>
                  <a
                    href={getDeploymentUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    🌐 View Live
                  </a>

                  <fetcher.Form method="post">
                    <input type="hidden" name="action" value="restart" />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      🔄 Restart
                    </button>
                  </fetcher.Form>
                </>
              )}

              <fetcher.Form method="post">
                <input type="hidden" name="action" value="redeploy" />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1488fc] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium"
                >
                  🚀 Redeploy
                </button>
              </fetcher.Form>

              {(deployment.status === 'building' || deployment.status === 'pending') && (
                <fetcher.Form method="post">
                  <input type="hidden" name="action" value="cancel" />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    🚫 Cancel
                  </button>
                </fetcher.Form>
              )}

              <fetcher.Form method="post">
                <input type="hidden" name="action" value="delete" />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this deployment?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              </fetcher.Form>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {deployment.project.name}
            </h1>
            <span className="text-2xl text-gray-500">#{deployment.buildNumber}</span>
            {getStatusBadge(deployment.status)}
          </div>

          {/* Deployment Metadata */}
          <div className="grid grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Branch</div>
              <div className="font-mono font-medium bg-gray-100 px-3 py-1 rounded inline-block">
                {deployment.gitBranch}
              </div>
            </div>

            {deployment.commitSha && (
              <div>
                <div className="text-gray-500 mb-1">Commit</div>
                <div className="font-mono font-medium">
                  {deployment.commitSha.substring(0, 7)}
                </div>
              </div>
            )}

            <div>
              <div className="text-gray-500 mb-1">Duration</div>
              <div className="font-medium">{getDuration()}</div>
            </div>

            <div>
              <div className="text-gray-500 mb-1">Created</div>
              <div className="font-medium">{formatDate(deployment.createdAt)}</div>
            </div>
          </div>

          {deployment.commitMessage && (
            <div className="mt-4 text-sm">
              <div className="text-gray-500 mb-1">Commit Message</div>
              <div className="font-mono text-gray-900 bg-gray-50 p-3 rounded">
                {deployment.commitMessage}
              </div>
            </div>
          )}

          {deployment.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-900 font-medium mb-1">❌ Deployment Failed</div>
              <div className="text-red-700 text-sm font-mono">{deployment.error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Logs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium">📜 Build Logs</span>
              {(deployment.status === 'building' || deployment.status === 'pending') && (
                <span className="px-2 py-1 bg-blue-600 text-xs rounded animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
          </div>

          <div className="bg-gray-950 text-green-400 font-mono text-sm p-6 h-[600px] overflow-y-auto">
            {logs ? (
              <pre className="whitespace-pre-wrap">{logs}</pre>
            ) : (
              <div className="text-gray-500 text-center py-12">
                No logs available yet...
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
