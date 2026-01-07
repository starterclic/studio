/**
 * Visual Builder Demo - Ultra Premium
 *
 * Demo route for testing the visual builder with sample components
 * Route: /builder/demo
 */

import type { MetaFunction } from '@remix-run/node';
import { BuilderLayout } from '~/components/builder/BuilderLayout';
import type { ComponentNode } from '~/lib/stores/builder.store';

export const meta: MetaFunction = () => {
  return [
    { title: 'Visual Builder Demo - Da Vinci' },
    { name: 'description', content: 'Test the ultra premium visual page builder' },
  ];
};

// ============================================================================
// Sample Components for Demo
// ============================================================================

const sampleComponents: ComponentNode[] = [
  {
    id: 'hero-1',
    type: 'hero-premium',
    props: {
      title: 'Welcome to Da Vinci',
      subtitle: 'Ultra Premium Edition',
      description: 'Build stunning websites with our drag & drop visual builder. No coding required.',
      ctaPrimary: {
        text: 'Get Started',
        href: '#get-started',
      },
      ctaSecondary: {
        text: 'View Demo',
        href: '#demo',
      },
      overlay: 'gradient',
      animated: true,
      pattern: true,
    },
    children: [],
    parentId: null,
    order: 0,
  },
  {
    id: 'section-1',
    type: 'section',
    props: {
      background: 'gray',
      maxWidth: 'xl',
      textAlign: 'center',
    },
    children: [
      {
        id: 'container-1',
        type: 'container',
        props: {
          size: 'lg',
          padding: 'lg',
        },
        children: [
          {
            id: 'grid-1',
            type: 'grid',
            props: {
              cols: 3,
              gap: 'lg',
            },
            children: [
              {
                id: 'card-1',
                type: 'card',
                props: {
                  title: 'Drag & Drop',
                  description: 'Intuitive visual editor with drag and drop components.',
                  variant: 'elevated',
                  hover: 'lift',
                },
                children: [],
                parentId: 'grid-1',
                order: 0,
              },
              {
                id: 'card-2',
                type: 'card',
                props: {
                  title: 'Live Preview',
                  description: 'See your changes in real-time with instant preview.',
                  variant: 'elevated',
                  hover: 'lift',
                },
                children: [],
                parentId: 'grid-1',
                order: 1,
              },
              {
                id: 'card-3',
                type: 'card',
                props: {
                  title: 'Export Ready',
                  description: 'Download complete Astro projects ready to deploy.',
                  variant: 'elevated',
                  hover: 'lift',
                },
                children: [],
                parentId: 'grid-1',
                order: 2,
              },
            ],
            parentId: 'container-1',
            order: 0,
          },
        ],
        parentId: 'section-1',
        order: 0,
      },
    ],
    parentId: null,
    order: 1,
  },
];

// ============================================================================
// Demo Page Component
// ============================================================================

export default function BuilderDemo() {
  return (
    <BuilderLayout
      pageId="demo-page-1"
      pagePath="/demo"
      initialComponents={sampleComponents}
    />
  );
}
