/**
 * Da Vinci Deployments Dashboard
 *
 * View and manage all project deployments
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { db } from '~/utils/db.server';

// Types
interface Deployment {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'pending' | 'building' | 'deployed' | 'failed' | 'cancelled';
  commitSha?: string;
  commitMessage?: string;
  gitBranch: string;
  buildNumber: number;
  deployedAt?: string;
  createdAt: string;
  duration?: number;
  error?: string;
}

// Loader: Fetch all deployments
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const status = url.searchParams.get('status');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;

  const deployments = await db.deployment.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Get unique projects for filter
  const projects = await db.project.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  return json({ deployments, projects });
}

// Component
export default function DeploymentsPage() {
  const { deployments: initialDeployments, projects } = useLoaderData<typeof loader>();
  const [deployments, setDeployments] = useState<Deployment[]>(initialDeployments);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const fetcher = useFetcher();

  // Auto-refresh for active deployments
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActive = deployments.some(d =>
        d.status === 'pending' || d.status === 'building'
      );

      if (hasActive) {
        // Refresh data
        window.location.reload();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [deployments]);

  // Status badge styling
  const getStatusBadge = (status: Deployment['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      building: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
      deployed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    const icons = {
      pending: '⏳',
      building: '🔄',
      deployed: '✅',
      failed: '❌',
      cancelled: '🚫',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {icons[status]} {status.toUpperCase()}
      </span>
    );
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 Deployments</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor and manage all project deployments
              </p>
            </div>

            <Link
              to="/projects"
              className="px-4 py-2 bg-[#1488fc] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium"
            >
              New Deployment
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set('projectId', e.target.value);
                  } else {
                    url.searchParams.delete('projectId');
                  }
                  window.location.href = url.toString();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set('status', e.target.value);
                  } else {
                    url.searchParams.delete('status');
                  }
                  window.location.href = url.toString();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="deployed">Deployed</option>
                <option value="building">Building</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Deployments List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deployments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No deployments yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start by deploying your first project
            </p>
            <Link
              to="/projects"
              className="inline-block px-6 py-3 bg-[#1488fc] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium"
            >
              View Projects
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <Link
                key={deployment.id}
                to={`/deployments/${deployment.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Project & Commit Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {deployment.project.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        #{deployment.buildNumber}
                      </span>
                      {getStatusBadge(deployment.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {deployment.gitBranch}
                        </span>
                        {deployment.commitSha && (
                          <span className="font-mono text-xs text-gray-500">
                            {deployment.commitSha.substring(0, 7)}
                          </span>
                        )}
                      </div>

                      {deployment.commitMessage && (
                        <p className="text-gray-600 truncate max-w-md">
                          {deployment.commitMessage}
                        </p>
                      )}
                    </div>

                    {deployment.error && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ {deployment.error}
                      </div>
                    )}
                  </div>

                  {/* Right: Stats */}
                  <div className="flex items-center gap-8 text-sm text-gray-600">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                      <div className="font-medium">
                        {formatDuration(deployment.duration)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Created</div>
                      <div className="font-medium">
                        {formatDate(deployment.createdAt)}
                      </div>
                    </div>

                    {deployment.deployedAt && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Deployed</div>
                        <div className="font-medium text-green-600">
                          {formatDate(deployment.deployedAt)}
                        </div>
                      </div>
                    )}

                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {deployments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Summary</h3>
            <div className="grid grid-cols-5 gap-4">
              {['deployed', 'building', 'pending', 'failed', 'cancelled'].map((status) => {
                const count = deployments.filter(d => d.status === status).length;
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500 uppercase">{status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
