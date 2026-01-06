/**
 * Astro Component Renderer - Ultra Premium
 *
 * Transforms ComponentNode tree into executable Astro code
 * Features: Props serialization, Nested children, Type-safe rendering
 */

import { type ComponentNode } from '~/lib/stores/builder.store';
import { getComponentBySlug } from '~/lib/components/registry';

// ============================================================================
// Types
// ============================================================================

interface RenderOptions {
  indent?: number;
  includeWrapper?: boolean;
}

// ============================================================================
// Main Renderer
// ============================================================================

/**
 * Render a component tree to Astro code
 */
export function renderAstroComponent(
  component: ComponentNode,
  options: RenderOptions = {}
): string {
  const { indent = 0, includeWrapper = false } = options;
  const componentDef = getComponentBySlug(component.type);

  if (!componentDef) {
    return `<!-- Component not found: ${component.type} -->`;
  }

  // Get component tag name (PascalCase from slug)
  const tagName = slugToPascalCase(component.type);

  // Serialize props
  const propsString = serializeProps(component.props);

  // Render children
  const childrenContent = component.children.length > 0
    ? component.children.map((child) => renderAstroComponent(child, { indent: indent + 2 })).join('\n')
    : '';

  // Build opening tag
  const openTag = `<${tagName}${propsString}${childrenContent ? '>' : ' />'}`;

  // Build complete element
  if (childrenContent) {
    const closeTag = `</${tagName}>`;
    return includeWrapper
      ? `${indentString(indent)}${openTag}\n${childrenContent}\n${indentString(indent)}${closeTag}`
      : `${openTag}\n${childrenContent}\n${closeTag}`;
  }

  return includeWrapper ? `${indentString(indent)}${openTag}` : openTag;
}

/**
 * Render entire component tree as complete Astro page
 */
export function renderAstroPage(
  components: ComponentNode[],
  metadata: {
    title?: string;
    description?: string;
    layout?: string;
  } = {}
): string {
  const { title = 'Untitled Page', description, layout } = metadata;

  // Collect all unique component types
  const componentTypes = new Set<string>();
  const collectTypes = (node: ComponentNode) => {
    componentTypes.add(node.type);
    node.children.forEach(collectTypes);
  };
  components.forEach(collectTypes);

  // Generate imports
  const imports = Array.from(componentTypes)
    .map((slug) => {
      const pascalCase = slugToPascalCase(slug);
      return `import ${pascalCase} from '~/components/astro/${getCategoryPath(slug)}/${pascalCase}.astro';`;
    })
    .join('\n');

  // Generate component tree
  const body = components.map((c) => renderAstroComponent(c, { indent: 0, includeWrapper: true })).join('\n');

  // Complete Astro page
  return `---
${layout ? `import Layout from '${layout}';\n` : ''}${imports}
${description ? `\nconst description = "${description}";` : ''}
---

${layout ? `<Layout title="${title}"${description ? ` description={description}` : ''}>` : ''}
${body}
${layout ? '</Layout>' : ''}
`.trim();
}

// ============================================================================
// Props Serialization
// ============================================================================

/**
 * Serialize component props to Astro attribute syntax
 */
function serializeProps(props: Record<string, any>): string {
  if (!props || Object.keys(props).length === 0) {
    return '';
  }

  const attributes = Object.entries(props)
    .filter(([key, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      // Boolean props
      if (typeof value === 'boolean') {
        return value ? ` ${key}` : '';
      }

      // Number props
      if (typeof value === 'number') {
        return ` ${key}={${value}}`;
      }

      // String props
      if (typeof value === 'string') {
        // Escape quotes
        const escaped = value.replace(/"/g, '\\"');
        return ` ${key}="${escaped}"`;
      }

      // Object/Array props (use JSON expression)
      if (typeof value === 'object') {
        const jsonString = JSON.stringify(value).replace(/"/g, '\\"');
        return ` ${key}={${JSON.stringify(value)}}`;
      }

      return '';
    })
    .filter(Boolean)
    .join('');

  return attributes;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert slug to PascalCase
 * hero-premium → HeroPremium
 */
function slugToPascalCase(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Get category path from component slug
 */
function getCategoryPath(slug: string): string {
  const componentDef = getComponentBySlug(slug);
  if (!componentDef) return 'custom';

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

  return categoryMap[componentDef.category] || 'custom';
}

/**
 * Generate indentation string
 */
function indentString(level: number): string {
  return '  '.repeat(level);
}

// ============================================================================
// Component Tree to File System
// ============================================================================

/**
 * Generate file system structure for Astro project
 */
export function generateAstroProject(
  pagePath: string,
  components: ComponentNode[],
  metadata: {
    title?: string;
    description?: string;
  } = {}
): Record<string, string> {
  const files: Record<string, string> = {};

  // Generate page file
  const pageContent = renderAstroPage(components, {
    ...metadata,
    layout: '~/layouts/BaseLayout.astro',
  });

  // Convert path: /about → src/pages/about.astro
  const astroPath = pagePath === '/' ? 'index' : pagePath.replace(/^\//, '');
  files[`src/pages/${astroPath}.astro`] = pageContent;

  return files;
}

/**
 * Generate standalone component file
 */
export function generateComponentFile(
  component: ComponentNode,
  standalone: boolean = false
): string {
  if (standalone) {
    // Export as standalone Astro component
    const pascalName = slugToPascalCase(component.type);
    const componentDef = getComponentBySlug(component.type);

    if (!componentDef) {
      return '<!-- Component not found -->';
    }

    return `---
${componentDef.propsSchema ? `// Props interface from JSON Schema\ninterface Props {\n  // TODO: Generate from schema\n}\n\nconst props = Astro.props;` : ''}
---

${componentDef.astroCode}
`;
  }

  return renderAstroComponent(component);
}
