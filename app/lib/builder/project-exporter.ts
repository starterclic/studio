/**
 * Project Exporter - Ultra Premium
 *
 * Export visual builder pages as complete Astro projects
 * Features: Full project structure, Dependencies, Component files, Ready to deploy
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ComponentNode } from '~/lib/stores/builder.store';
import { renderAstroPage, slugToPascalCase } from './astro-renderer';
import { getComponentBySlug } from '~/lib/components/registry';

// ============================================================================
// Types
// ============================================================================

interface ExportOptions {
  projectName: string;
  pagePath: string;
  pageTitle: string;
  pageDescription?: string;
  includeExampleComponents?: boolean;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export page as downloadable Astro project
 */
export async function exportAstroProject(
  components: ComponentNode[],
  options: ExportOptions
): Promise<void> {
  const {
    projectName,
    pagePath,
    pageTitle,
    pageDescription,
    includeExampleComponents = false,
  } = options;

  const zip = new JSZip();

  // ========================================================================
  // 1. Package.json
  // ========================================================================

  const packageJson = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: pageDescription || `${projectName} - Built with Da Vinci Visual Builder`,
    type: 'module',
    scripts: {
      dev: 'astro dev',
      start: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
    },
    dependencies: {
      astro: '^4.16.0',
      '@astrojs/tailwind': '^5.1.0',
      tailwindcss: '^3.4.0',
    },
  };

  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // ========================================================================
  // 2. Astro Config
  // ========================================================================

  const astroConfig = `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  build: {
    format: 'file',
  },
});
`;

  zip.file('astro.config.mjs', astroConfig);

  // ========================================================================
  // 3. TypeScript Config
  // ========================================================================

  const tsConfig = {
    extends: 'astro/tsconfigs/strict',
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '~/*': ['./src/*'],
      },
    },
  };

  zip.file('tsconfig.json', JSON.stringify(tsConfig, null, 2));

  // ========================================================================
  // 4. Tailwind Config
  // ========================================================================

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
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
          'from': {
            opacity: '0',
            transform: 'translateY(2rem)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'blob': {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
      },
    },
  },
  plugins: [],
};
`;

  zip.file('tailwind.config.mjs', tailwindConfig);

  // ========================================================================
  // 5. README
  // ========================================================================

  const readme = `# ${projectName}

${pageDescription || 'Built with Da Vinci Visual Builder - Ultra Premium Edition'}

## 🚀 Getting Started

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Start development server:

\`\`\`bash
npm run dev
\`\`\`

Build for production:

\`\`\`bash
npm run build
\`\`\`

Preview production build:

\`\`\`bash
npm run preview
\`\`\`

## 📁 Project Structure

\`\`\`
/
├── src/
│   ├── components/
│   │   └── astro/        # Visual builder components
│   ├── layouts/          # Page layouts
│   └── pages/            # Your pages
├── public/               # Static assets
├── astro.config.mjs      # Astro configuration
└── package.json
\`\`\`

## 🎨 Built With

- **Astro** - Modern web framework
- **Tailwind CSS** - Utility-first CSS
- **TypeScript** - Type safety

---

Generated with ❤️ by [Da Vinci Visual Builder](https://davinci.dev)
`;

  zip.file('README.md', readme);

  // ========================================================================
  // 6. Git Ignore
  // ========================================================================

  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
.astro/

# Environment
.env
.env.*
!.env.example

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

  zip.file('.gitignore', gitignore);

  // ========================================================================
  // 7. Component Files
  // ========================================================================

  // Collect unique component types used in the page
  const componentTypes = new Set<string>();
  const collectComponentTypes = (node: ComponentNode) => {
    componentTypes.add(node.type);
    node.children.forEach(collectComponentTypes);
  };
  components.forEach(collectComponentTypes);

  // Generate component files
  const componentsSrc = zip.folder('src')!.folder('components')!.folder('astro')!;

  for (const componentSlug of Array.from(componentTypes)) {
    const componentDef = getComponentBySlug(componentSlug);
    if (!componentDef) continue;

    const pascalName = slugToPascalCase(componentSlug);
    const categoryFolder = getCategoryFolder(componentDef.category);
    const categoryDir = componentsSrc.folder(categoryFolder)!;

    // Write component file
    categoryDir.file(`${pascalName}.astro`, componentDef.astroCode);
  }

  // ========================================================================
  // 8. Base Layout
  // ========================================================================

  const baseLayout = `---
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
    <meta name="description" content={description || "${projectName}"} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`;

  zip.folder('src')!.folder('layouts')!.file('BaseLayout.astro', baseLayout);

  // ========================================================================
  // 9. Page File
  // ========================================================================

  const pageContent = renderAstroPage(components, {
    title: pageTitle,
    description: pageDescription,
    layout: '~/layouts/BaseLayout.astro',
  });

  const pageFileName = pagePath === '/' ? 'index.astro' : `${pagePath.replace(/^\//, '')}.astro`;
  zip.folder('src')!.folder('pages')!.file(pageFileName, pageContent);

  // ========================================================================
  // 10. Public Folder (placeholder)
  // ========================================================================

  zip.folder('public')!.file('.gitkeep', '');

  // ========================================================================
  // Generate & Download
  // ========================================================================

  const blob = await zip.generateAsync({ type: 'blob' });
  const fileName = `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  saveAs(blob, fileName);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map component category to folder name
 */
function getCategoryFolder(category: string): string {
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

/**
 * Create a sample Astro project (for testing)
 */
export async function exportSampleProject(): Promise<void> {
  const sampleComponents: ComponentNode[] = [
    {
      id: 'hero-1',
      type: 'hero-premium',
      props: {
        title: 'Welcome to Your New Website',
        subtitle: 'Built with Da Vinci',
        description: 'This is a sample page generated by the visual builder.',
        ctaPrimary: {
          text: 'Get Started',
          href: '#',
        },
      },
      children: [],
      parentId: null,
      order: 0,
    },
  ];

  await exportAstroProject(sampleComponents, {
    projectName: 'Sample Project',
    pagePath: '/',
    pageTitle: 'Home',
    pageDescription: 'A sample Astro project built with Da Vinci Visual Builder',
  });
}
