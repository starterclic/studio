/**
 * WebContainer Service - Ultra Premium
 *
 * Manages in-browser Astro dev server using WebContainer API
 * Features: Real Astro compilation, Hot reload, SSR preview, Terminal output
 */

import { WebContainer } from '@webcontainer/api';
import type { ComponentNode } from '~/lib/stores/builder.store';
import { renderAstroPage, slugToPascalCase } from './astro-renderer';
import { getComponentBySlug } from '~/lib/components/registry';

// ============================================================================
// Types
// ============================================================================

export interface WebContainerStatus {
  status: 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';
  message: string;
  previewUrl?: string;
  error?: string;
}

export type WebContainerCallback = (status: WebContainerStatus) => void;

// ============================================================================
// WebContainer Manager
// ============================================================================

export class WebContainerManager {
  private container: WebContainer | null = null;
  private callbacks: Set<WebContainerCallback> = new Set();
  private currentStatus: WebContainerStatus = {
    status: 'idle',
    message: 'Not started',
  };

  // ========================================================================
  // Lifecycle
  // ========================================================================

  /**
   * Boot WebContainer and start Astro dev server
   */
  async boot(
    components: ComponentNode[],
    pageMetadata: { title: string; description?: string }
  ): Promise<void> {
    try {
      this.updateStatus({
        status: 'booting',
        message: 'Booting WebContainer...',
      });

      // Boot WebContainer
      this.container = await WebContainer.boot();

      this.updateStatus({
        status: 'installing',
        message: 'Generating project files...',
      });

      // Generate and mount file system
      const files = this.generateProjectFiles(components, pageMetadata);
      await this.container.mount(files);

      this.updateStatus({
        status: 'installing',
        message: 'Installing dependencies (this may take a minute)...',
      });

      // Install dependencies
      const installProcess = await this.container.spawn('npm', ['install']);
      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error('npm install failed');
      }

      this.updateStatus({
        status: 'starting',
        message: 'Starting Astro dev server...',
      });

      // Start Astro dev server
      const devProcess = await this.container.spawn('npm', ['run', 'dev']);

      // Listen for server ready
      devProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            const output = data.toString();
            console.log('[Astro Dev]:', output);

            // Detect when server is ready
            if (output.includes('Local:') || output.includes('localhost')) {
              this.onServerReady();
            }
          },
        })
      );
    } catch (error) {
      this.updateStatus({
        status: 'error',
        message: 'Failed to start WebContainer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update page content (hot reload)
   */
  async updatePage(
    components: ComponentNode[],
    pageMetadata: { title: string; description?: string }
  ): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    try {
      // Regenerate page file
      const pageContent = renderAstroPage(components, {
        ...pageMetadata,
        layout: '~/layouts/BaseLayout.astro',
      });

      // Write to file system
      await this.container.fs.writeFile('/src/pages/index.astro', pageContent);

      console.log('[WebContainer] Page updated, hot reload triggered');
    } catch (error) {
      console.error('[WebContainer] Failed to update page:', error);
      throw error;
    }
  }

  /**
   * Shutdown WebContainer
   */
  async teardown(): Promise<void> {
    if (this.container) {
      // WebContainer doesn't have explicit teardown, but we can clean up
      this.container = null;
      this.updateStatus({
        status: 'idle',
        message: 'WebContainer stopped',
      });
    }
  }

  // ========================================================================
  // Status Management
  // ========================================================================

  /**
   * Subscribe to status updates
   */
  onStatusChange(callback: WebContainerCallback): () => void {
    this.callbacks.add(callback);

    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current status
   */
  getStatus(): WebContainerStatus {
    return this.currentStatus;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private updateStatus(status: WebContainerStatus): void {
    this.currentStatus = status;
    this.callbacks.forEach((callback) => callback(status));
  }

  private async onServerReady(): Promise<void> {
    if (!this.container) return;

    // Get server URL
    this.container.on('server-ready', (port, url) => {
      this.updateStatus({
        status: 'ready',
        message: 'Astro dev server ready',
        previewUrl: url,
      });
    });

    // Fallback: assume port 4321 (Astro default)
    setTimeout(() => {
      if (this.currentStatus.status === 'starting') {
        this.updateStatus({
          status: 'ready',
          message: 'Astro dev server ready',
          previewUrl: `http://localhost:4321`,
        });
      }
    }, 3000);
  }

  // ========================================================================
  // File System Generation
  // ========================================================================

  private generateProjectFiles(
    components: ComponentNode[],
    pageMetadata: { title: string; description?: string }
  ): Record<string, any> {
    const files: Record<string, any> = {
      // package.json
      'package.json': {
        file: {
          contents: JSON.stringify(
            {
              name: 'astro-preview',
              version: '0.0.1',
              type: 'module',
              scripts: {
                dev: 'astro dev --host 0.0.0.0',
                build: 'astro build',
              },
              dependencies: {
                astro: '^4.16.0',
                '@astrojs/tailwind': '^5.1.0',
                tailwindcss: '^3.4.0',
              },
            },
            null,
            2
          ),
        },
      },

      // astro.config.mjs
      'astro.config.mjs': {
        file: {
          contents: `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
`,
        },
      },

      // tsconfig.json
      'tsconfig.json': {
        file: {
          contents: JSON.stringify(
            {
              extends: 'astro/tsconfigs/strict',
              compilerOptions: {
                baseUrl: '.',
                paths: {
                  '~/*': ['./src/*'],
                },
              },
            },
            null,
            2
          ),
        },
      },

      // tailwind.config.mjs
      'tailwind.config.mjs': {
        file: {
          contents: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(2rem)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'blob': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
      },
    },
  },
  plugins: [],
};
`,
        },
      },

      // src directory
      src: {
        directory: {
          // layouts
          layouts: {
            directory: {
              'BaseLayout.astro': {
                file: {
                  contents: `---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description || "Built with Da Vinci"} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`,
                },
              },
            },
          },

          // components
          components: {
            directory: {
              astro: {
                directory: this.generateComponentFiles(components),
              },
            },
          },

          // pages
          pages: {
            directory: {
              'index.astro': {
                file: {
                  contents: renderAstroPage(components, {
                    ...pageMetadata,
                    layout: '~/layouts/BaseLayout.astro',
                  }),
                },
              },
            },
          },
        },
      },

      // public directory
      public: {
        directory: {},
      },
    };

    return files;
  }

  private generateComponentFiles(components: ComponentNode[]): Record<string, any> {
    const componentFiles: Record<string, any> = {};

    // Collect unique component types
    const componentTypes = new Set<string>();
    const collectTypes = (node: ComponentNode) => {
      componentTypes.add(node.type);
      node.children.forEach(collectTypes);
    };
    components.forEach(collectTypes);

    // Generate component files by category
    const categoriesMap: Record<string, Set<string>> = {};

    for (const componentSlug of Array.from(componentTypes)) {
      const componentDef = getComponentBySlug(componentSlug);
      if (!componentDef) continue;

      const pascalName = slugToPascalCase(componentSlug);
      const category = this.getCategoryFolder(componentDef.category);

      if (!categoriesMap[category]) {
        categoriesMap[category] = new Set();
      }
      categoriesMap[category].add(componentSlug);

      // Ensure category directory exists
      if (!componentFiles[category]) {
        componentFiles[category] = { directory: {} };
      }

      // Add component file
      componentFiles[category].directory[`${pascalName}.astro`] = {
        file: {
          contents: componentDef.astroCode,
        },
      };
    }

    return componentFiles;
  }

  private getCategoryFolder(category: string): string {
    const categoryMap: Record<string, string> = {
      LAYOUT: 'layout',
      NAVIGATION: 'navigation',
      CONTENT: 'content',
      FORMS: 'forms',
      DATA: 'data',
      INTERACTIVE: 'interactive',
      ECOMMERCE: 'ecommerce',
      CUSTOM: 'custom',
    };

    return categoryMap[category] || 'custom';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let webContainerInstance: WebContainerManager | null = null;

/**
 * Get or create WebContainer manager instance
 */
export function getWebContainerManager(): WebContainerManager {
  if (!webContainerInstance) {
    webContainerInstance = new WebContainerManager();
  }
  return webContainerInstance;
}
