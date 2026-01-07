/**
 * Builder Preview - Ultra Premium
 *
 * Live Astro preview using WebContainer
 * Features: Real-time rendering, Hot reload, SSR preview
 */

import { useEffect, useState, useRef } from 'react';
import { useBuilderStore } from '~/lib/stores/builder.store';
import { renderAstroPage, generateAstroProject } from '~/lib/builder/astro-renderer';

interface BuilderPreviewProps {
  className?: string;
}

export function BuilderPreview({ className = '' }: BuilderPreviewProps) {
  const { components, pagePath } = useBuilderStore();
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // ========================================================================
  // Generate Preview
  // ========================================================================

  useEffect(() => {
    // Debounce preview generation (500ms)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [components]);

  const generatePreview = async () => {
    if (components.length === 0) {
      setPreviewHtml('<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; color: #666;">Add components to see preview</div>');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate Astro code
      const astroCode = renderAstroPage(components, {
        title: pagePath || 'Preview',
      });

      // For now, render static preview (will integrate WebContainer later)
      // This generates a simplified HTML preview
      const htmlPreview = await convertAstroToHtml(astroCode, components);
      setPreviewHtml(htmlPreview);
    } catch (err) {
      console.error('Preview generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={`relative bg-white dark:bg-gray-900 ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generating preview...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Preview error: {error}</span>
          </div>
        </div>
      )}

      {/* Preview Frame */}
      <iframe
        srcDoc={previewHtml}
        title="Builder Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

// ============================================================================
// Astro to HTML Converter (Simplified)
// ============================================================================

/**
 * Convert Astro code to static HTML for preview
 * This is a simplified version - full version would use WebContainer
 */
async function convertAstroToHtml(
  astroCode: string,
  components: any[]
): Promise<string> {
  // For now, generate a simple HTML preview
  // In production, this would compile actual Astro with WebContainer

  const componentsHtml = components
    .map((component) => renderComponentToHtml(component))
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* Hero animations */
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(2rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes blob {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -50px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }

    .animate-fade-in-up {
      animation: fade-in-up 0.8s ease-out forwards;
    }

    .animate-blob {
      animation: blob 7s infinite;
    }

    .animation-delay-200 { animation-delay: 200ms; }
    .animation-delay-300 { animation-delay: 300ms; }
    .animation-delay-400 { animation-delay: 400ms; }
  </style>
</head>
<body>
  ${componentsHtml}
</body>
</html>
  `.trim();
}

/**
 * Render a single component to HTML (simplified)
 */
function renderComponentToHtml(component: Record<string, any>, depth = 0): string {
  const { type, props, children } = component;

  // Map component types to HTML
  switch (type) {
    case 'section':
      return renderSection(props, children);
    case 'container':
      return renderContainer(props, children);
    case 'grid':
      return renderGrid(props, children);
    case 'hero-premium':
      return renderHero(props, children);
    case 'card':
      return renderCard(props, children);
    case 'button':
      return renderButton(props, children);
    case 'input':
      return renderInput(props, children);
    default:
      return `<div class="p-4 bg-gray-100 border border-gray-300 rounded">${type}</div>`;
  }
}

// Component HTML renderers
function renderSection(props: Record<string, any>, children: Record<string, any>[]) {
  const childrenHtml = children.map((c) => renderComponentToHtml(c)).join('');
  return `<section class="py-16 ${props.background === 'dark' ? 'bg-gray-900 text-white' : props.background === 'gray' ? 'bg-gray-50' : 'bg-white'}">
    <div class="max-w-screen-${props.maxWidth || 'lg'} mx-auto px-4 ${props.textAlign === 'center' ? 'text-center' : ''}">
      ${childrenHtml}
    </div>
  </section>`;
}

function renderContainer(props: Record<string, any>, children: Record<string, any>[]) {
  const childrenHtml = children.map((c) => renderComponentToHtml(c)).join('');
  return `<div class="max-w-screen-${props.size || 'lg'} mx-auto p-${props.padding === 'lg' ? '12' : '6'} ${props.glassmorphism ? 'backdrop-blur-xl bg-white/70' : ''} ${props.rounded ? `rounded-${props.rounded}` : ''} ${props.shadow ? `shadow-${props.shadow}` : ''}">
    ${childrenHtml}
  </div>`;
}

function renderGrid(props: Record<string, any>, children: Record<string, any>[]) {
  const childrenHtml = children.map((c) => renderComponentToHtml(c)).join('');
  return `<div class="grid grid-cols-${props.cols || 1} gap-${props.gap === 'lg' ? '8' : '6'}">
    ${childrenHtml}
  </div>`;
}

function renderHero(props: Record<string, any>, children: Record<string, any>[]) {
  return `<section class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
    ${props.pattern ? '<div class="absolute inset-0 opacity-10 bg-grid-white/10"></div>' : ''}
    <div class="relative z-10 max-w-4xl mx-auto px-4 text-center">
      ${props.subtitle ? `<p class="text-sm font-semibold uppercase tracking-widest text-indigo-300 mb-4">${props.subtitle}</p>` : ''}
      <h1 class="text-6xl font-bold mb-6 animate-fade-in-up animation-delay-200">${props.title || 'Hero Title'}</h1>
      ${props.description ? `<p class="text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-300">${props.description}</p>` : ''}
      ${props.ctaPrimary ? `<a href="${props.ctaPrimary.href || '#'}" class="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all animate-fade-in-up animation-delay-400">${props.ctaPrimary.text || 'Get Started'}</a>` : ''}
    </div>
  </section>`;
}

function renderCard(props: Record<string, any>, children: Record<string, any>[]) {
  return `<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-${props.variant === 'elevated' ? 'xl' : 'md'} ${props.hover === 'lift' ? 'hover:-translate-y-2' : ''} transition-all">
    ${props.image ? `<img src="${props.image}" alt="${props.imageAlt || ''}" class="w-full aspect-video object-cover rounded-lg mb-4" />` : ''}
    ${props.title ? `<h3 class="text-xl font-bold mb-2">${props.title}</h3>` : ''}
    ${props.description ? `<p class="text-gray-600 dark:text-gray-300">${props.description}</p>` : ''}
  </div>`;
}

function renderButton(props: Record<string, any>, children: Record<string, any>[]) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'bg-transparent border-2 border-indigo-600 text-indigo-600',
    gradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white',
  };
  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  return `<button class="${variantClasses[props.variant || 'primary']} ${sizeClasses[props.size || 'md']} rounded-lg font-semibold transition-all hover:scale-105 shadow-lg">${children[0]?.props?.text || 'Button'}</button>`;
}

function renderInput(props: Record<string, any>, children: Record<string, any>[]) {
  return `<div>
    ${props.label ? `<label class="block text-sm font-medium text-gray-700 mb-2">${props.label}${props.required ? '<span class="text-red-500 ml-1">*</span>' : ''}</label>` : ''}
    <input type="${props.type || 'text'}" placeholder="${props.placeholder || ''}" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
    ${props.error ? `<p class="mt-2 text-sm text-red-600">${props.error}</p>` : ''}
  </div>`;
}
