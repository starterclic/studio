/**
 * Da Vinci Deployment Modal
 *
 * Modal component for creating new deployments
 */

import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

interface Project {
  id: string;
  name: string;
  slug: string;
  gitRepository?: string;
  gitBranch: string;
}

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId?: string;
}

export default function DeploymentModal({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
}: DeploymentModalProps) {
  const [projectId, setProjectId] = useState(selectedProjectId || '');
  const [branch, setBranch] = useState('main');
  const [commitSha, setCommitSha] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const fetcher = useFetcher();

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      alert('Please select a project');
      return;
    }

    // Submit to API
    fetcher.submit(
      {
        projectId,
        gitBranch: branch,
        commitSha: commitSha || undefined,
        commitMessage: commitMessage || undefined,
      },
      {
        method: 'POST',
        action: '/api/deployments',
      }
    );

    // Close modal after submission
    setTimeout(() => {
      onClose();
      window.location.href = '/deployments';
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="bg-[#1488fc] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚀 New Deployment</h2>
              <p className="text-sm text-blue-100 mt-1">
                Deploy your project to production
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  const project = projects.find((p) => p.id === e.target.value);
                  if (project) {
                    setBranch(project.gitBranch || 'main');
                  }
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Git Branch */}
            {selectedProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Git Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  placeholder="main"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent font-mono"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The branch to deploy from
                </p>
              </div>
            )}

            {/* Commit SHA (Optional) */}
            {selectedProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commit SHA (Optional)
                </label>
                <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  placeholder="Leave empty to deploy latest commit"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent font-mono text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Specific commit to deploy (e.g., a1b2c3d)
                </p>
              </div>
            )}

            {/* Commit Message (Optional) */}
            {selectedProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deployment Note (Optional)
                </label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Add a note about this deployment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1488fc] focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Project Info */}
            {selectedProject && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Deployment Details
                </h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Project:</span>
                    <span className="font-mono">{selectedProject.name}</span>
                  </div>
                  {selectedProject.gitRepository && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Repository:</span>
                      <span className="font-mono text-xs">
                        {selectedProject.gitRepository}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Branch:</span>
                    <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">
                      {branch}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectId || fetcher.state === 'submitting'}
                className="px-6 py-2.5 bg-[#1488fc] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {fetcher.state === 'submitting' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Deploying...
                  </>
                ) : (
                  <>
                    🚀 Deploy Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
