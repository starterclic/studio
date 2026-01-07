/**
 * Builder Canvas - Ultra Premium
 *
 * Main canvas for drag & drop visual editing
 * Features: Nested components, Drop zones, Selection, Hover, Viewport modes, Zoom
 */

import { useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBuilderStore, type ComponentNode } from '~/lib/stores/builder.store';
import { ComponentRenderer } from './ComponentRenderer';
import { DropZone } from './DropZone';

export function BuilderCanvas() {
  const {
    components,
    selectedId,
    hoveredId,
    viewportMode,
    zoom,
    isDragging,
    selectComponent,
    setHovered,
    moveComponent,
    setDragging,
  } = useBuilderStore();

  // ========================================================================
  // Drag & Drop Sensors
  // ========================================================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ========================================================================
  // Drag Handlers
  // ========================================================================

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setDragging(true, active.id as string);
    },
    [setDragging]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setDragging(false);

      if (!over || active.id === over.id) return;

      // Parse drop zone ID: "dropzone-{parentId}-{order}"
      const overIdStr = over.id as string;
      if (overIdStr.startsWith('dropzone-')) {
        const [, parentId, orderStr] = overIdStr.split('-');
        const order = parseInt(orderStr, 10);
        moveComponent(active.id as string, parentId === 'root' ? null : parentId, order);
      }
    },
    [moveComponent, setDragging]
  );

  // ========================================================================
  // Viewport Dimensions
  // ========================================================================

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const viewportWidth = viewportWidths[viewportMode];

  // ========================================================================
  // Keyboard Shortcuts
  // ========================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected component
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          useBuilderStore.getState().removeComponent(selectedId);
        }
      }

      // Deselect (Escape)
      if (e.key === 'Escape') {
        selectComponent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectComponent]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto relative">
      {/* Canvas Container */}
      <div className="min-h-full flex items-start justify-center p-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Viewport Container */}
          <div
            className="bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 relative"
            style={{
              width: viewportWidth,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Canvas Header (Viewport Indicator) */}
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-t-lg">
              <span className="flex items-center gap-2">
                {viewportMode === 'desktop' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 11a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                    Desktop
                  </>
                )}
                {viewportMode === 'tablet' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                    </svg>
                    Tablet (768px)
                  </>
                )}
                {viewportMode === 'mobile' && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 2A2.5 2.5 0 003 4.5v11A2.5 2.5 0 005.5 18h9a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0014.5 2h-9zM10 15a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                    Mobile (375px)
                  </>
                )}
              </span>
              <span className="text-gray-400">{zoom}%</span>
            </div>

            {/* Main Canvas Area */}
            <div className="min-h-screen">
              {components.length === 0 ? (
                // Empty State
                <div className="flex items-center justify-center min-h-screen p-12">
                  <div className="text-center max-w-md">
                    <div className="mb-6">
                      <svg
                        className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Start Building
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Drag components from the palette to begin creating your page
                    </p>
                    <DropZone parentId={null} order={0} />
                  </div>
                </div>
              ) : (
                // Component Tree
                <SortableContext
                  items={components.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.map((component, index) => (
                    <div key={component.id}>
                      <DropZone parentId={null} order={index} />
                      <ComponentRenderer
                        component={component}
                        isSelected={component.id === selectedId}
                        isHovered={component.id === hoveredId}
                        onSelect={() => selectComponent(component.id)}
                        onHover={() => setHovered(component.id)}
                        onHoverEnd={() => setHovered(null)}
                      />
                    </div>
                  ))}
                  <DropZone parentId={null} order={components.length} />
                </SortableContext>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {isDragging && (
              <div className="bg-white dark:bg-gray-800 shadow-2xl p-4 rounded-lg border-2 border-indigo-500 opacity-90">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Moving component...
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #9CA3AF 1px, transparent 1px),
            linear-gradient(to bottom, #9CA3AF 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
}
