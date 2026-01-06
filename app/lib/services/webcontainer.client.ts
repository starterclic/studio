/**
 * WebContainer Service (Client-side only)
 *
 * Manages in-browser code execution using WebContainer API
 * Provides npm, file system, and dev server capabilities
 *
 * ⚠️ CLIENT SIDE ONLY - WebContainer only works in browser
 */

import { WebContainer } from '@webcontainer/api';
import type { FileNode } from './filesystem';

export interface WebContainerInstance {
  container: WebContainer;
  isReady: boolean;
  serverUrl: string | null;
}

export interface WebContainerFile {
  file: {
    contents: string;
  };
}

export interface WebContainerDirectory {
  directory: {
    [key: string]: WebContainerFile | WebContainerDirectory;
  };
}

// Global singleton instance
let containerInstance: WebContainer | null = null;
let serverUrl: string | null = null;
let isBooting = false;

/**
 * Boot WebContainer (singleton)
 * Only one instance can exist per browser tab
 */
export async function bootWebContainer(): Promise<WebContainer> {
  if (containerInstance) {
    return containerInstance;
  }

  if (isBooting) {
    // Wait for boot to complete
    while (isBooting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return containerInstance!;
  }

  try {
    isBooting = true;
    console.log('[WebContainer] Booting...');

    containerInstance = await WebContainer.boot();

    console.log('[WebContainer] Booted successfully');
    isBooting = false;

    return containerInstance;
  } catch (error) {
    isBooting = false;
    console.error('[WebContainer] Boot failed:', error);
    throw error;
  }
}

/**
 * Convert virtual filesystem to WebContainer format
 */
export function convertFilesToWebContainerFormat(
  files: FileNode[]
): WebContainerDirectory {
  const root: any = { directory: {} };

  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    let current = root.directory;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;

      if (isLastPart) {
        if (file.type === 'file') {
          current[part] = {
            file: {
              contents: file.content || '',
            },
          };
        } else {
          current[part] = { directory: {} };
        }
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
    });
  });

  return root;
}

/**
 * Mount files to WebContainer filesystem
 */
export async function mountFiles(
  container: WebContainer,
  files: FileNode[]
): Promise<void> {
  try {
    console.log('[WebContainer] Mounting files...', files.length);

    const fileTree = convertFilesToWebContainerFormat(files);
    await container.mount(fileTree);

    console.log('[WebContainer] Files mounted successfully');
  } catch (error) {
    console.error('[WebContainer] Mount failed:', error);
    throw error;
  }
}

/**
 * Write a single file to WebContainer
 */
export async function writeFile(
  container: WebContainer,
  path: string,
  content: string
): Promise<void> {
  try {
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    await container.fs.writeFile(cleanPath, content);
    console.log('[WebContainer] File written:', cleanPath);
  } catch (error) {
    console.error('[WebContainer] Write failed:', path, error);
    throw error;
  }
}

/**
 * Read a file from WebContainer
 */
export async function readFile(
  container: WebContainer,
  path: string
): Promise<string> {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const content = await container.fs.readFile(cleanPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('[WebContainer] Read failed:', path, error);
    throw error;
  }
}

/**
 * Install NPM dependencies
 */
export async function installDependencies(
  container: WebContainer,
  onOutput?: (data: string) => void
): Promise<void> {
  console.log('[WebContainer] Installing dependencies...');

  const installProcess = await container.spawn('npm', ['install']);

  if (onOutput) {
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }

  const exitCode = await installProcess.exit;

  if (exitCode !== 0) {
    throw new Error(`npm install failed with exit code ${exitCode}`);
  }

  console.log('[WebContainer] Dependencies installed successfully');
}

/**
 * Start development server (Vite/Next/etc)
 */
export async function startDevServer(
  container: WebContainer,
  command: string = 'npm',
  args: string[] = ['run', 'dev'],
  onOutput?: (data: string) => void
): Promise<string> {
  console.log(`[WebContainer] Starting dev server: ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    let resolved = false;

    container.spawn(command, args).then((process) => {
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            if (onOutput) {
              onOutput(data);
            }

            // Look for server URL in output
            const urlMatch = data.match(/https?:\/\/[^\s]+/);
            if (urlMatch && !resolved) {
              resolved = true;
              serverUrl = urlMatch[0];
              console.log('[WebContainer] Server started:', serverUrl);
              resolve(serverUrl);
            }

            // Alternative pattern for Vite
            if (data.includes('Local:') && !resolved) {
              const localMatch = data.match(/Local:\s+(https?:\/\/[^\s]+)/);
              if (localMatch) {
                resolved = true;
                serverUrl = localMatch[1];
                console.log('[WebContainer] Server started:', serverUrl);
                resolve(serverUrl);
              }
            }
          },
        })
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!resolved) {
          reject(new Error('Dev server start timeout'));
        }
      }, 30000);
    });
  });
}

/**
 * Run arbitrary command in WebContainer
 */
export async function runCommand(
  container: WebContainer,
  command: string,
  args: string[] = [],
  onOutput?: (data: string) => void
): Promise<number> {
  console.log(`[WebContainer] Running: ${command} ${args.join(' ')}`);

  const process = await container.spawn(command, args);

  if (onOutput) {
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }

  return await process.exit;
}

/**
 * Get current server URL
 */
export function getServerUrl(): string | null {
  return serverUrl;
}

/**
 * Check if WebContainer is supported in current browser
 */
export function isWebContainerSupported(): boolean {
  // WebContainer requires:
  // 1. SharedArrayBuffer support
  // 2. Cross-origin isolation
  // 3. Modern browser (Chrome 102+, Edge 102+)

  if (typeof window === 'undefined') {
    return false;
  }

  // Check for SharedArrayBuffer
  if (typeof SharedArrayBuffer === 'undefined') {
    console.warn('[WebContainer] SharedArrayBuffer not available');
    return false;
  }

  // Check cross-origin isolation
  if (!window.crossOriginIsolated) {
    console.warn('[WebContainer] Not cross-origin isolated');
    console.warn('Add these headers to enable WebContainer:');
    console.warn('  Cross-Origin-Embedder-Policy: require-corp');
    console.warn('  Cross-Origin-Opener-Policy: same-origin');
    return false;
  }

  return true;
}

/**
 * Cleanup WebContainer instance
 */
export async function teardownWebContainer(): Promise<void> {
  if (containerInstance) {
    try {
      await containerInstance.teardown();
      containerInstance = null;
      serverUrl = null;
      console.log('[WebContainer] Teardown complete');
    } catch (error) {
      console.error('[WebContainer] Teardown failed:', error);
    }
  }
}

/**
 * Get WebContainer instance (if booted)
 */
export function getWebContainer(): WebContainer | null {
  return containerInstance;
}

/**
 * Create a default Vite + React project
 */
export function createDefaultViteProject(): FileNode[] {
  return [
    {
      id: 'pkg',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      language: 'json',
      created: Date.now(),
      modified: Date.now(),
      content: JSON.stringify({
        name: 'davinci-preview',
        type: 'module',
        version: '1.0.0',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^5.4.11',
        },
      }, null, 2),
    },
    {
      id: 'vite-config',
      name: 'vite.config.js',
      type: 'file',
      path: '/vite.config.js',
      language: 'javascript',
      created: Date.now(),
      modified: Date.now(),
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});`,
    },
    {
      id: 'index-html',
      name: 'index.html',
      type: 'file',
      path: '/index.html',
      language: 'html',
      created: Date.now(),
      modified: Date.now(),
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Da Vinci Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    },
    {
      id: 'src-folder',
      name: 'src',
      type: 'folder',
      path: '/src',
      created: Date.now(),
      modified: Date.now(),
      children: [],
    },
    {
      id: 'main-jsx',
      name: 'main.jsx',
      type: 'file',
      path: '/src/main.jsx',
      language: 'javascript',
      created: Date.now(),
      modified: Date.now(),
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    {
      id: 'app-jsx',
      name: 'App.jsx',
      type: 'file',
      path: '/src/App.jsx',
      language: 'javascript',
      created: Date.now(),
      modified: Date.now(),
      content: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🎨 Da Vinci Live Preview</h1>
      <p>Edit code and see changes instantly!</p>
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            background: '#1488fc',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
          }}
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}

export default App;`,
    },
    {
      id: 'index-css',
      name: 'index.css',
      type: 'file',
      path: '/src/index.css',
      language: 'css',
      created: Date.now(),
      modified: Date.now(),
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

#root {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}`,
    },
  ];
}
