/**
 * Component Renderer - Ultra Premium
 *
 * Renders a component node in the builder canvas
 * Features: Selection, Hover, Nested children, Drag handle
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type ComponentNode } from '~/lib/stores/builder.store';
import { DropZone } from './DropZone';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ComponentRendererProps {
  component: ComponentNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

export function ComponentRenderer({
  component,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onHoverEnd,
}: ComponentRendererProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // ========================================================================
  // Component Rendering
  // ========================================================================

  // For now, render a placeholder (will integrate with Astro components later)
  const renderComponentContent = () => {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
          &lt;{component.type}&gt;
        </div>
        {Object.keys(component.props).length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
            Props: {JSON.stringify(component.props, null, 2).substring(0, 100)}...
          </div>
        )}
        {component.children.length > 0 && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {component.children.length} child component(s)
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        onHover();
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        onHoverEnd();
      }}
      className="relative group"
    >
      {/* Selection/Hover Outline */}
      <div
        className={`
          absolute inset-0 pointer-events-none rounded-lg transition-all duration-150
          ${
            isSelected
              ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 z-20'
              : ''
          }
          ${
            isHovered && !isSelected
              ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 z-10'
              : ''
          }
        `}
      />

      {/* Component Label (on hover/select) */}
      {(isSelected || isHovered) && (
        <div
          className={`
            absolute -top-7 left-0 px-3 py-1 rounded-md text-xs font-semibold z-30
            ${
              isSelected
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-blue-400 text-white shadow-md'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span>{component.type}</span>
            {component.locked && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Drag Handle (visible on hover/select) */}
      {!component.locked && (isSelected || isHovered) && (
        <button
          {...attributes}
          {...listeners}
          className={`
            absolute -left-10 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-lg shadow-lg z-30
            flex items-center justify-center cursor-grab active:cursor-grabbing
            transition-all duration-150 hover:scale-110
            ${
              isSelected
                ? 'bg-indigo-500 text-white'
                : 'bg-blue-400 text-white'
            }
          `}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      )}

      {/* Component Content */}
      <div className={component.hidden ? 'opacity-30' : ''}>
        {renderComponentContent()}
      </div>

      {/* Nested Children */}
      {component.children.length > 0 && (
        <div className="ml-6 mt-4 space-y-4 border-l-2 border-gray-300 dark:border-gray-600 pl-6">
          <SortableContext
            items={component.children.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {component.children.map((child, index) => (
              <div key={child.id}>
                <DropZone parentId={component.id} order={index} />
                <ComponentRenderer
                  component={child}
                  isSelected={child.id === useBuilderStore.getState().selectedId}
                  isHovered={child.id === useBuilderStore.getState().hoveredId}
                  onSelect={() => useBuilderStore.getState().selectComponent(child.id)}
                  onHover={() => useBuilderStore.getState().setHovered(child.id)}
                  onHoverEnd={() => useBuilderStore.getState().setHovered(null)}
                />
              </div>
            ))}
            <DropZone parentId={component.id} order={component.children.length} />
          </SortableContext>
        </div>
      )}
    </div>
  );
}
