/**
 * Preview Panel
 *
 * Live preview of code execution in WebContainer
 * Shows dev server output in iframe with auto-refresh
 */

import { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import { useFileSystem } from '~/lib/services/filesystem';
import {
  bootWebContainer,
  mountFiles,
  installDependencies,
  startDevServer,
  writeFile,
  getServerUrl,
  isWebContainerSupported,
  createDefaultViteProject,
  getWebContainer,
} from '~/lib/services/webcontainer.client';
import { Terminal } from '~/components/terminal/Terminal';

export function PreviewPanel() {
  const workspace = useWorkspaceStore();
  const filesystem = useFileSystem();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isSupported] = useState(() => isWebContainerSupported());

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasBootedRef = useRef(false);

  const addTerminalOutput = (data: string) => {
    setTerminalOutput((prev) => [...prev, data]);
  };

  /**
   * Boot WebContainer and start preview
   */
  const startPreview = async () => {
    if (!isSupported) {
      setError('WebContainer not supported. Enable cross-origin isolation headers.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      addTerminalOutput('🚀 Booting WebContainer...\r\n');

      // Boot WebContainer
      const container = await bootWebContainer();
      addTerminalOutput('✅ WebContainer booted\r\n');

      // Get files from filesystem
      let files = filesystem.getFileTree();

      // If no files, create default Vite project
      if (files.length === 0) {
        addTerminalOutput('📦 Creating default Vite + React project...\r\n');
        files = createDefaultViteProject();

        // Add to filesystem
        files.forEach((file) => {
          if (file.type === 'file') {
            filesystem.createFile(file.path, file.content, file.language);
          } else {
            filesystem.createFolder(file.path);
          }
        });
      }

      // Mount files
      addTerminalOutput('📁 Mounting files...\r\n');
      await mountFiles(container, files);
      addTerminalOutput(`✅ Mounted ${files.length} files\r\n`);

      // Install dependencies
      setIsInstalling(true);
      addTerminalOutput('\r\n📦 Installing dependencies...\r\n');
      await installDependencies(container, (data) => {
        addTerminalOutput(data);
      });
      addTerminalOutput('✅ Dependencies installed\r\n\r\n');
      setIsInstalling(false);

      // Start dev server
      setIsStarting(true);
      addTerminalOutput('🌐 Starting dev server...\r\n');
      const url = await startDevServer(
        container,
        'npm',
        ['run', 'dev'],
        (data) => {
          addTerminalOutput(data);
        }
      );

      setPreviewUrl(url);
      addTerminalOutput(`\r\n✅ Server running at ${url}\r\n`);
      setIsStarting(false);
      setIsLoading(false);
      hasBootedRef.current = true;
    } catch (err: any) {
      console.error('[Preview] Error:', err);
      setError(err.message || 'Failed to start preview');
      addTerminalOutput(`\r\n❌ Error: ${err.message}\r\n`);
      setIsLoading(false);
      setIsInstalling(false);
      setIsStarting(false);
    }
  };

  /**
   * Update file in WebContainer when edited
   */
  const updateFileInContainer = async (path: string, content: string) => {
    const container = getWebContainer();
    if (!container || !hasBootedRef.current) return;

    try {
      await writeFile(container, path, content);
      console.log('[Preview] File updated:', path);
    } catch (err) {
      console.error('[Preview] Failed to update file:', err);
    }
  };

  /**
   * Refresh preview iframe
   */
  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl || '';
    }
  };

  /**
   * Stop preview
   */
  const stopPreview = () => {
    setPreviewUrl(null);
    setTerminalOutput([]);
    hasBootedRef.current = false;
  };

  // Auto-update files in WebContainer when edited
  useEffect(() => {
    if (!hasBootedRef.current || !filesystem.activeFile) return;

    const activeFile = filesystem.getFile(filesystem.activeFile);
    if (activeFile && activeFile.content) {
      updateFileInContainer(activeFile.path, activeFile.content);
    }
  }, [filesystem.activeFile, filesystem.files]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Panel Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔮</span>
          <div>
            <h2 className="text-sm font-semibold">Live Preview</h2>
            <p className="text-xs text-gray-400">
              {previewUrl ? 'Server running' : 'Not started'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              showTerminal
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle Terminal"
          >
            $
          </button>

          {/* Refresh */}
          {previewUrl && (
            <button
              onClick={refreshPreview}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm"
              title="Refresh Preview"
            >
              🔄
            </button>
          )}

          {/* Start/Stop */}
          {previewUrl ? (
            <button
              onClick={stopPreview}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={startPreview}
              disabled={isLoading || !isSupported}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Starting...' : '▶ Start Preview'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isSupported ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center max-w-md p-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">WebContainer Not Supported</h3>
              <p className="text-gray-400 mb-4">
                Your server needs to be configured with cross-origin isolation headers:
              </p>
              <div className="bg-gray-950 p-4 rounded-lg text-left text-xs font-mono mb-4">
                <div className="text-green-400">Cross-Origin-Embedder-Policy: require-corp</div>
                <div className="text-green-400">Cross-Origin-Opener-Policy: same-origin</div>
              </div>
              <p className="text-gray-500 text-sm">
                These headers are required for SharedArrayBuffer support
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-bold mb-2 text-red-400">Error</h3>
              <p className="text-gray-400">{error}</p>
              <button
                onClick={startPreview}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !previewUrl ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-xl font-bold mb-2">Live Preview</h3>
              <p className="text-gray-400 mb-6">
                Run your code in the browser with WebContainer
              </p>
              <button
                onClick={startPreview}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '⏳ Starting...' : '▶ Start Preview'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Preview iframe */}
            <div className={`${showTerminal ? 'flex-1' : 'h-full'} bg-white`}>
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              />
            </div>

            {/* Terminal */}
            {showTerminal && (
              <div className="h-64 border-t border-gray-800 bg-black flex-shrink-0">
                <Terminal
                  output={terminalOutput}
                  theme="dark"
                  className="h-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-purple-600 px-4 py-1.5 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${previewUrl ? 'bg-green-400' : 'bg-gray-400'}`} />
            {previewUrl ? 'Running' : 'Stopped'}
          </span>
          {isInstalling && <span>📦 Installing...</span>}
          {isStarting && <span>🌐 Starting server...</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>WebContainer</span>
          {previewUrl && <span className="text-purple-200">{previewUrl}</span>}
        </div>
      </div>
    </div>
  );
}
