/**
 * Component Registry
 *
 * Central registry for all Astro components with JSON Schema definitions
 * Used by visual builder for component palette and props validation
 */

import { type ComponentCategory } from '@prisma/client';

export interface ComponentDefinition {
  slug: string;
  name: string;
  description: string;
  category: ComponentCategory;
  astroCode: string;
  propsSchema: object;
  thumbnail?: string;
  isGlobal: boolean;
  isPremium: boolean;
  tags: string[];
  version: string;
}

/**
 * Component Registry - All available components
 */
export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  // ============================================================================
  // LAYOUT Components
  // ============================================================================
  {
    slug: 'section',
    name: 'Section',
    description: 'Full-width section container with customizable padding, background, and alignment',
    category: 'LAYOUT',
    astroCode: `---
interface Props {
  id?: string;
  className?: string;
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'dark' | 'primary' | 'transparent';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  textAlign?: 'left' | 'center' | 'right';
}

const {
  id,
  className = '',
  paddingY = 'md',
  background = 'white',
  maxWidth = 'lg',
  textAlign = 'left',
} = Astro.props;

const paddingClasses = {
  none: 'py-0',
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
  xl: 'py-32',
};

const backgroundClasses = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  dark: 'bg-gray-900 text-white',
  primary: 'bg-indigo-600 text-white',
  transparent: 'bg-transparent',
};

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
};

const textAlignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
---

<section
  id={id}
  class={\`
    \${paddingClasses[paddingY]}
    \${backgroundClasses[background]}
    \${className}
  \`.trim()}
>
  <div class={\`
    mx-auto px-4 sm:px-6 lg:px-8
    \${maxWidthClasses[maxWidth]}
    \${textAlignClasses[textAlign]}
  \`.trim()}>
    <slot />
  </div>
</section>`,
    propsSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'HTML ID attribute' },
        className: { type: 'string', description: 'Additional CSS classes' },
        paddingY: {
          type: 'string',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'md',
          description: 'Vertical padding',
        },
        background: {
          type: 'string',
          enum: ['white', 'gray', 'dark', 'primary', 'transparent'],
          default: 'white',
          description: 'Background color',
        },
        maxWidth: {
          type: 'string',
          enum: ['sm', 'md', 'lg', 'xl', 'full'],
          default: 'lg',
          description: 'Maximum content width',
        },
        textAlign: {
          type: 'string',
          enum: ['left', 'center', 'right'],
          default: 'left',
          description: 'Text alignment',
        },
      },
    },
    isGlobal: true,
    isPremium: false,
    tags: ['layout', 'container', 'section'],
    version: '1.0.0',
  },

  {
    slug: 'container',
    name: 'Container',
    description: 'Premium responsive container with fluid design system and visual effects',
    category: 'LAYOUT',
    astroCode: `---
interface Props {
  id?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glassmorphism?: boolean;
  gradient?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  border?: boolean;
  centerContent?: boolean;
}

const {
  id,
  className = '',
  size = 'lg',
  padding = 'md',
  glassmorphism = false,
  gradient = false,
  shadow = 'none',
  rounded = 'none',
  border = false,
  centerContent = false,
} = Astro.props;

const sizeClasses = {
  xs: 'max-w-screen-xs',
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6 lg:p-8',
  lg: 'p-8 lg:p-12',
  xl: 'p-12 lg:p-16',
};

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};
---

<div
  id={id}
  class={\`
    mx-auto w-full
    \${sizeClasses[size]}
    \${paddingClasses[padding]}
    \${shadowClasses[shadow]}
    \${roundedClasses[rounded]}
    \${glassmorphism ? 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/70' : ''}
    \${gradient ? 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900' : ''}
    \${border ? 'border border-gray-200 dark:border-gray-700' : ''}
    \${centerContent ? 'flex items-center justify-center' : ''}
    transition-all duration-300
    \${className}
  \`.trim()}
>
  <slot />
</div>`,
    propsSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        className: { type: 'string' },
        size: {
          type: 'string',
          enum: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
          default: 'lg',
        },
        padding: {
          type: 'string',
          enum: ['none', 'sm', 'md', 'lg', 'xl'],
          default: 'md',
        },
        glassmorphism: { type: 'boolean', default: false },
        gradient: { type: 'boolean', default: false },
        shadow: {
          type: 'string',
          enum: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
          default: 'none',
        },
        rounded: {
          type: 'string',
          enum: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
          default: 'none',
        },
        border: { type: 'boolean', default: false },
        centerContent: { type: 'boolean', default: false },
      },
    },
    isGlobal: true,
    isPremium: true,
    tags: ['layout', 'container', 'responsive', 'premium'],
    version: '1.0.0',
  },

  {
    slug: 'grid',
    name: 'Grid',
    description: 'Advanced CSS Grid layout with responsive breakpoints and dynamic sizing',
    category: 'LAYOUT',
    astroCode: `---
interface Props {
  id?: string;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

const {
  id,
  className = '',
  cols = 1,
  colsMd,
  colsLg,
  gap = 'md',
  alignItems = 'stretch',
  justifyItems = 'stretch',
} = Astro.props;

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
  12: 'grid-cols-12',
};

const colsMdClasses = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  8: 'md:grid-cols-8',
  12: 'md:grid-cols-12',
};

const colsLgClasses = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  8: 'lg:grid-cols-8',
  12: 'lg:grid-cols-12',
};

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const alignItemsClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyItemsClasses = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};
---

<div
  id={id}
  class={\`
    grid
    \${colsClasses[cols]}
    \${colsMd ? colsMdClasses[colsMd] : ''}
    \${colsLg ? colsLgClasses[colsLg] : ''}
    \${gapClasses[gap]}
    \${alignItemsClasses[alignItems]}
    \${justifyItemsClasses[justifyItems]}
    \${className}
  \`.trim()}
>
  <slot />
</div>`,
    propsSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        className: { type: 'string' },
        cols: { type: 'number', enum: [1, 2, 3, 4, 5, 6, 8, 12], default: 1 },
        colsMd: { type: 'number', enum: [1, 2, 3, 4, 5, 6, 8, 12] },
        colsLg: { type: 'number', enum: [1, 2, 3, 4, 5, 6, 8, 12] },
        gap: {
          type: 'string',
          enum: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
          default: 'md',
        },
        alignItems: {
          type: 'string',
          enum: ['start', 'center', 'end', 'stretch'],
          default: 'stretch',
        },
        justifyItems: {
          type: 'string',
          enum: ['start', 'center', 'end', 'stretch'],
          default: 'stretch',
        },
      },
    },
    isGlobal: true,
    isPremium: false,
    tags: ['layout', 'grid', 'responsive'],
    version: '1.0.0',
  },

  // ============================================================================
  // CONTENT Components
  // ============================================================================
  {
    slug: 'hero-premium',
    name: 'Hero Premium',
    description: 'Ultra premium hero section with advanced visual effects, animations, and CTAs',
    category: 'CONTENT',
    astroCode: `--- Component code from Hero.astro ---`,
    propsSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        id: { type: 'string' },
        className: { type: 'string' },
        title: { type: 'string', description: 'Main heading text' },
        subtitle: { type: 'string' },
        description: { type: 'string' },
        ctaPrimary: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            href: { type: 'string' },
          },
        },
        ctaSecondary: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            href: { type: 'string' },
          },
        },
        backgroundImage: { type: 'string', format: 'uri' },
        backgroundVideo: { type: 'string', format: 'uri' },
        overlay: {
          type: 'string',
          enum: ['none', 'light', 'dark', 'gradient'],
          default: 'gradient',
        },
        align: {
          type: 'string',
          enum: ['left', 'center', 'right'],
          default: 'center',
        },
        height: {
          type: 'string',
          enum: ['sm', 'md', 'lg', 'xl', 'screen'],
          default: 'lg',
        },
        pattern: { type: 'boolean', default: false },
        animated: { type: 'boolean', default: true },
      },
    },
    isGlobal: true,
    isPremium: true,
    tags: ['hero', 'landing', 'premium', 'animated', 'cta'],
    version: '1.0.0',
  },

  {
    slug: 'card',
    name: 'Card',
    description: 'Versatile card component with hover effects and multiple variants',
    category: 'CONTENT',
    astroCode: `--- Component code from Card.astro ---`,
    propsSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        className: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string', format: 'uri' },
        imageAlt: { type: 'string' },
        href: { type: 'string', format: 'uri' },
        variant: {
          type: 'string',
          enum: ['default', 'elevated', 'outlined', 'glass', 'gradient'],
          default: 'default',
        },
        hover: {
          type: 'string',
          enum: ['lift', 'glow', 'scale', 'tilt', 'none'],
          default: 'lift',
        },
        padding: {
          type: 'string',
          enum: ['none', 'sm', 'md', 'lg'],
          default: 'md',
        },
        rounded: {
          type: 'string',
          enum: ['sm', 'md', 'lg', 'xl'],
          default: 'lg',
        },
      },
    },
    isGlobal: true,
    isPremium: false,
    tags: ['card', 'content', 'hover', 'image'],
    version: '1.0.0',
  },

  // ============================================================================
  // FORMS Components
  // ============================================================================
  {
    slug: 'button',
    name: 'Button',
    description: 'Premium button with variants, sizes, loading states, and animations',
    category: 'FORMS',
    astroCode: `--- Component code from Button.astro ---`,
    propsSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        className: { type: 'string' },
        type: {
          type: 'string',
          enum: ['button', 'submit', 'reset'],
          default: 'button',
        },
        variant: {
          type: 'string',
          enum: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'gradient'],
          default: 'primary',
        },
        size: {
          type: 'string',
          enum: ['xs', 'sm', 'md', 'lg', 'xl'],
          default: 'md',
        },
        fullWidth: { type: 'boolean', default: false },
        disabled: { type: 'boolean', default: false },
        loading: { type: 'boolean', default: false },
        icon: { type: 'string' },
        iconPosition: {
          type: 'string',
          enum: ['left', 'right'],
          default: 'left',
        },
        rounded: {
          type: 'string',
          enum: ['sm', 'md', 'lg', 'full'],
          default: 'lg',
        },
      },
    },
    isGlobal: true,
    isPremium: false,
    tags: ['button', 'form', 'cta', 'action'],
    version: '1.0.0',
  },

  {
    slug: 'input',
    name: 'Input',
    description: 'Form input with validation, icons, and premium styling',
    category: 'FORMS',
    astroCode: `--- Component code from Input.astro ---`,
    propsSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'Input name attribute' },
        type: {
          type: 'string',
          enum: ['text', 'email', 'password', 'number', 'tel', 'url'],
          default: 'text',
        },
        label: { type: 'string' },
        placeholder: { type: 'string' },
        value: { type: 'string' },
        required: { type: 'boolean', default: false },
        disabled: { type: 'boolean', default: false },
        error: { type: 'string' },
        icon: { type: 'string' },
        size: {
          type: 'string',
          enum: ['sm', 'md', 'lg'],
          default: 'md',
        },
        fullWidth: { type: 'boolean', default: true },
      },
    },
    isGlobal: true,
    isPremium: false,
    tags: ['input', 'form', 'validation'],
    version: '1.0.0',
  },
];

/**
 * Get component by slug
 */
export function getComponentBySlug(slug: string): ComponentDefinition | undefined {
  return COMPONENT_REGISTRY.find((c) => c.slug === slug);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === category);
}

/**
 * Get all global components
 */
export function getGlobalComponents(): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((c) => c.isGlobal);
}

/**
 * Get all premium components
 */
export function getPremiumComponents(): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((c) => c.isPremium);
}
