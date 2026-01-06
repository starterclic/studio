/**
 * Component Palette - Ultra Premium
 *
 * Sidebar palette with all available components
 * Features: Search, Categories, Drag to canvas, Premium badges
 */

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { COMPONENT_REGISTRY, type ComponentDefinition } from '~/lib/components/registry';
import { useBuilderStore } from '~/lib/stores/builder.store';
import { type ComponentCategory } from '@prisma/client';

const CATEGORIES: { value: ComponentCategory; label: string; icon: string }[] = [
  { value: 'LAYOUT', label: 'Layout', icon: '📐' },
  { value: 'NAVIGATION', label: 'Navigation', icon: '🧭' },
  { value: 'CONTENT', label: 'Content', icon: '📝' },
  { value: 'FORMS', label: 'Forms', icon: '📋' },
  { value: 'DATA', label: 'Data', icon: '📊' },
  { value: 'INTERACTIVE', label: 'Interactive', icon: '⚡' },
  { value: 'ECOMMERCE', label: 'E-commerce', icon: '🛒' },
  { value: 'CUSTOM', label: 'Custom', icon: '✨' },
];

export function ComponentPalette() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'ALL'>('ALL');
  const { panelState, togglePanel } = useBuilderStore();

  // ========================================================================
  // Filtered Components
  // ========================================================================

  const filteredComponents = useMemo(() => {
    return COMPONENT_REGISTRY.filter((component) => {
      // Category filter
      if (selectedCategory !== 'ALL' && component.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          component.name.toLowerCase().includes(searchLower) ||
          component.description.toLowerCase().includes(searchLower) ||
          component.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [search, selectedCategory]);

  // Group by category
  const groupedComponents = useMemo(() => {
    const groups: Record<ComponentCategory, ComponentDefinition[]> = {
      LAYOUT: [],
      NAVIGATION: [],
      CONTENT: [],
      FORMS: [],
      DATA: [],
      INTERACTIVE: [],
      ECOMMERCE: [],
      CUSTOM: [],
    };

    filteredComponents.forEach((component) => {
      groups[component.category].push(component);
    });

    return groups;
  }, [filteredComponents]);

  if (!panelState.palette) {
    return null;
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Components</h2>
          <button
            onClick={() => togglePanel('palette')}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5
                ${
                  selectedCategory === category.value
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedCategory === 'ALL' ? (
          // Show all categories
          CATEGORIES.map((category) => {
            const components = groupedComponents[category.value];
            if (components.length === 0) return null;

            return (
              <div key={category.value}>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.label}
                </h3>
                <div className="space-y-2">
                  {components.map((component) => (
                    <ComponentCard key={component.slug} component={component} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Show selected category only
          <div className="space-y-2">
            {groupedComponents[selectedCategory].map((component) => (
              <ComponentCard key={component.slug} component={component} />
            ))}
          </div>
        )}

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No components found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Component Card
// ============================================================================

function ComponentCard({ component }: { component: ComponentDefinition }) {
  const addComponent = useBuilderStore((state) => state.addComponent);

  const handleClick = () => {
    addComponent({
      type: component.slug,
      props: {},
      children: [],
      parentId: null,
    });
  };

  return (
    <div
      onClick={handleClick}
      className="
        group relative p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700
        hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20
        cursor-pointer transition-all duration-200
        bg-white dark:bg-gray-750
      "
    >
      {/* Premium Badge */}
      {component.isPremium && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-lg">
          PRO
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon/Thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {component.name[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {component.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {component.description}
          </p>

          {/* Tags */}
          {component.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {component.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Action */}
      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-lg transition-all pointer-events-none" />
    </div>
  );
}
