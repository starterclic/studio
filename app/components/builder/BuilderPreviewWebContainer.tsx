/**
 * Builder Preview with WebContainer - Ultra Premium
 *
 * Live Astro preview using WebContainer for real SSR compilation
 * Features: Real-time rendering, Hot reload, Full Astro dev server
 */

import { useEffect, useState, useRef } from 'react';
import { useBuilderStore } from '~/lib/stores/builder.store';
import {
  getWebContainerManager,
  type WebContainerStatus,
} from '~/lib/builder/webcontainer.service';

interface BuilderPreviewWebContainerProps {
  className?: string;
}

export function BuilderPreviewWebContainer({ className = '' }: BuilderPreviewWebContainerProps) {
  const { components, pagePath } = useBuilderStore();
  const [status, setStatus] = useState<WebContainerStatus>({
    status: 'idle',
    message: 'Click "Start Preview" to begin',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const webContainer = useRef(getWebContainerManager());
  const hasBooted = useRef(false);

  // ========================================================================
  // WebContainer Lifecycle
  // ========================================================================

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = webContainer.current.onStatusChange((newStatus) => {
      setStatus(newStatus);

      if (newStatus.status === 'ready' && newStatus.previewUrl) {
        setPreviewUrl(newStatus.previewUrl);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-boot on mount if components exist
  useEffect(() => {
    if (components.length > 0 && !hasBooted.current && status.status === 'idle') {
      handleStartPreview();
    }
  }, [components.length]);

  // Hot reload when components change
  useEffect(() => {
    if (status.status !== 'ready' || components.length === 0) {
      return;
    }

    // Debounce updates (1 second for WebContainer)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      updatePage();
    }, 1000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [components, status.status]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleStartPreview = async () => {
    if (components.length === 0) {
      return;
    }

    hasBooted.current = true;

    try {
      await webContainer.current.boot(components, {
        title: pagePath || 'Preview',
        description: 'Built with Da Vinci Visual Builder',
      });
    } catch (error) {
      console.error('Failed to start WebContainer:', error);
    }
  };

  const updatePage = async () => {
    try {
      await webContainer.current.updatePage(components, {
        title: pagePath || 'Preview',
        description: 'Built with Da Vinci Visual Builder',
      });
    } catch (error) {
      console.error('Failed to update page:', error);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={`relative bg-white dark:bg-gray-900 ${className}`}>
      {/* Status Bar */}
      <div className="h-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status.status === 'ready'
                  ? 'bg-green-500'
                  : status.status === 'error'
                  ? 'bg-red-500'
                  : status.status === 'idle'
                  ? 'bg-gray-400'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {status.message}
            </span>
          </div>

          {/* Progress for installing/starting */}
          {(status.status === 'installing' || status.status === 'starting') && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {status.status === 'installing' ? 'Installing dependencies...' : 'Starting server...'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Terminal Toggle */}
          {status.status !== 'idle' && status.status !== 'error' && (
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                showTerminal
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Toggle terminal output"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}

          {/* Reload Button */}
          {status.status === 'ready' && (
            <button
              onClick={updatePage}
              className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all flex items-center gap-1"
              title="Reload preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reload
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output (collapsible) */}
      {showTerminal && status.status !== 'idle' && (
        <div className="h-48 bg-gray-900 text-green-400 font-mono text-xs p-4 overflow-auto border-b border-gray-700">
          <div className="space-y-1">
            <div>
              <span className="text-gray-500">[WebContainer]</span> {status.message}
            </div>
            {status.status === 'ready' && (
              <div className="text-green-500">
                <span className="text-gray-500">[Astro]</span> Dev server ready at {previewUrl}
              </div>
            )}
            {status.error && (
              <div className="text-red-400">
                <span className="text-gray-500">[Error]</span> {status.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className={`${showTerminal ? 'h-[calc(100%-12rem)]' : 'h-[calc(100%-3rem)]'}`}>
        {/* Idle State */}
        {status.status === 'idle' && (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start Live Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Boot Astro dev server to see real-time SSR preview with hot reload
              </p>
              <button
                onClick={handleStartPreview}
                disabled={components.length === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 mx-auto ${
                  components.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Start Preview
              </button>
              {components.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Add components from the palette to enable preview
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading States */}
        {(status.status === 'booting' ||
          status.status === 'installing' ||
          status.status === 'starting') && (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {status.status === 'booting'
                  ? 'Booting WebContainer'
                  : status.status === 'installing'
                  ? 'Installing Dependencies'
                  : 'Starting Astro Server'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{status.message}</p>
              {status.status === 'installing' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  This may take 30-60 seconds on first run
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {status.status === 'error' && (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Preview Error</h3>
              <p className="text-red-600 dark:text-red-400 mb-6 font-mono text-sm">
                {status.error || 'Unknown error occurred'}
              </p>
              <button
                onClick={handleStartPreview}
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Ready - Preview iframe */}
        {status.status === 'ready' && previewUrl && (
          <iframe
            key={previewUrl}
            src={previewUrl}
            title="Astro Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          />
        )}
      </div>
    </div>
  );
}
