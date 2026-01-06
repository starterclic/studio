/**
 * Visual Builder Store - Ultra Premium
 *
 * State management for the visual page builder
 * Features: Undo/Redo, Auto-save, Component tree, Selection, Viewport modes
 *
 * Architecture: Zustand + Immer for immutability
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * Component instance in the builder canvas
 */
export interface ComponentNode {
  id: string; // Unique ID (UUID)
  type: string; // Component slug from registry (e.g., 'section', 'hero-premium')
  props: Record<string, any>; // Component props
  children: ComponentNode[]; // Nested children
  parentId: string | null; // Parent component ID
  order: number; // Display order within parent
  locked?: boolean; // Prevent editing/moving
  hidden?: boolean; // Hide in canvas
}

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  timestamp: number;
  components: ComponentNode[];
  selectedId: string | null;
}

/**
 * Viewport device mode
 */
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

/**
 * Right panel tab
 */
export type RightPanelTab = 'inspector' | 'preview';

/**
 * Panel visibility state
 */
interface PanelState {
  palette: boolean;
  inspector: boolean;
  layers: boolean;
}

// ============================================================================
// Builder Store State
// ============================================================================

interface BuilderState {
  // === Page Data ===
  pageId: string | null;
  pagePath: string | null;
  isDirty: boolean; // Has unsaved changes
  lastSaved: number | null; // Timestamp

  // === Component Tree ===
  components: ComponentNode[]; // Root-level components
  selectedId: string | null; // Currently selected component
  hoveredId: string | null; // Hovered component (for highlight)
  clipboard: ComponentNode | null; // Copy/paste

  // === History (Undo/Redo) ===
  history: HistoryEntry[]; // Past states
  historyIndex: number; // Current position in history
  maxHistorySize: number; // Limit history entries

  // === UI State ===
  viewportMode: ViewportMode;
  zoom: number; // 25-200%
  panelState: PanelState;
  activeRightPanel: RightPanelTab; // Active tab in right panel
  isDragging: boolean; // Drag & drop in progress
  draggedId: string | null; // ID of dragged component

  // === Actions ===
  // Page
  setPage: (pageId: string, pagePath: string, components: ComponentNode[]) => void;
  save: () => Promise<void>;
  markDirty: () => void;

  // Components
  addComponent: (component: Omit<ComponentNode, 'id' | 'order'>, parentId?: string) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  moveComponent: (id: string, newParentId: string | null, newOrder: number) => void;
  duplicateComponent: (id: string) => void;

  // Selection
  selectComponent: (id: string | null) => void;
  setHovered: (id: string | null) => void;

  // Clipboard
  copyComponent: (id: string) => void;
  pasteComponent: (parentId?: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // UI
  setViewportMode: (mode: ViewportMode) => void;
  setZoom: (zoom: number) => void;
  togglePanel: (panel: keyof PanelState) => void;
  setActiveRightPanel: (tab: RightPanelTab) => void;
  setDragging: (isDragging: boolean, draggedId?: string) => void;

  // Utility
  findComponent: (id: string) => ComponentNode | null;
  getComponentPath: (id: string) => ComponentNode[];
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  pageId: null,
  pagePath: null,
  isDirty: false,
  lastSaved: null,

  components: [],
  selectedId: null,
  hoveredId: null,
  clipboard: null,

  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  viewportMode: 'desktop' as ViewportMode,
  zoom: 100,
  panelState: {
    palette: true,
    inspector: true,
    layers: true,
  },
  activeRightPanel: 'inspector' as RightPanelTab,
  isDragging: false,
  draggedId: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useBuilderStore = create<BuilderState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Page Actions
      // ========================================================================

      setPage: (pageId, pagePath, components) => {
        set((state) => {
          state.pageId = pageId;
          state.pagePath = pagePath;
          state.components = components;
          state.selectedId = null;
          state.isDirty = false;
          state.history = [];
          state.historyIndex = -1;
        });
        get().pushHistory();
      },

      save: async () => {
        const { pageId, components } = get();
        if (!pageId) return;

        try {
          // TODO: Call API to save page
          const response = await fetch('/api/pages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pageId,
              content: { components },
            }),
          });

          if (response.ok) {
            set((state) => {
              state.isDirty = false;
              state.lastSaved = Date.now();
            });
          }
        } catch (error) {
          console.error('Failed to save page:', error);
        }
      },

      markDirty: () => {
        set((state) => {
          state.isDirty = true;
        });
      },

      // ========================================================================
      // Component Actions
      // ========================================================================

      addComponent: (component, parentId) => {
        set((state) => {
          const newComponent: ComponentNode = {
            ...component,
            id: crypto.randomUUID(),
            order: parentId
              ? get()
                  .findComponent(parentId)
                  ?.children.length ?? 0
              : state.components.length,
          };

          if (parentId) {
            const parent = get().findComponent(parentId);
            if (parent) {
              parent.children.push(newComponent);
            }
          } else {
            state.components.push(newComponent);
          }

          state.selectedId = newComponent.id;
          state.isDirty = true;
        });
        get().pushHistory();
      },

      removeComponent: (id) => {
        set((state) => {
          const removeFromArray = (components: ComponentNode[]): boolean => {
            const index = components.findIndex((c) => c.id === id);
            if (index !== -1) {
              components.splice(index, 1);
              return true;
            }
            for (const component of components) {
              if (removeFromArray(component.children)) {
                return true;
              }
            }
            return false;
          };

          removeFromArray(state.components);
          if (state.selectedId === id) {
            state.selectedId = null;
          }
          state.isDirty = true;
        });
        get().pushHistory();
      },

      updateComponent: (id, updates) => {
        set((state) => {
          const component = get().findComponent(id);
          if (component) {
            Object.assign(component, updates);
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      moveComponent: (id, newParentId, newOrder) => {
        set((state) => {
          // Remove from current location
          const removeFromArray = (components: ComponentNode[]): ComponentNode | null => {
            const index = components.findIndex((c) => c.id === id);
            if (index !== -1) {
              const [removed] = components.splice(index, 1);
              return removed;
            }
            for (const component of components) {
              const removed = removeFromArray(component.children);
              if (removed) return removed;
            }
            return null;
          };

          const component = removeFromArray(state.components);
          if (!component) return;

          // Update component
          component.parentId = newParentId;
          component.order = newOrder;

          // Insert at new location
          if (newParentId) {
            const parent = get().findComponent(newParentId);
            if (parent) {
              parent.children.splice(newOrder, 0, component);
            }
          } else {
            state.components.splice(newOrder, 0, component);
          }

          state.isDirty = true;
        });
        get().pushHistory();
      },

      duplicateComponent: (id) => {
        const component = get().findComponent(id);
        if (!component) return;

        const duplicate: ComponentNode = {
          ...structuredClone(component),
          id: crypto.randomUUID(),
          order: component.order + 1,
        };

        set((state) => {
          if (component.parentId) {
            const parent = get().findComponent(component.parentId);
            if (parent) {
              parent.children.splice(duplicate.order, 0, duplicate);
            }
          } else {
            state.components.splice(duplicate.order, 0, duplicate);
          }
          state.selectedId = duplicate.id;
          state.isDirty = true;
        });
        get().pushHistory();
      },

      // ========================================================================
      // Selection
      // ========================================================================

      selectComponent: (id) => {
        set((state) => {
          state.selectedId = id;
        });
      },

      setHovered: (id) => {
        set((state) => {
          state.hoveredId = id;
        });
      },

      // ========================================================================
      // Clipboard
      // ========================================================================

      copyComponent: (id) => {
        const component = get().findComponent(id);
        if (component) {
          set((state) => {
            state.clipboard = structuredClone(component);
          });
        }
      },

      pasteComponent: (parentId) => {
        const { clipboard } = get();
        if (!clipboard) return;

        const paste = structuredClone(clipboard);
        const assignNewIds = (node: ComponentNode) => {
          node.id = crypto.randomUUID();
          node.children.forEach(assignNewIds);
        };
        assignNewIds(paste);

        get().addComponent(paste, parentId);
      },

      // ========================================================================
      // History (Undo/Redo)
      // ========================================================================

      pushHistory: () => {
        set((state) => {
          const { components, selectedId } = state;
          const entry: HistoryEntry = {
            timestamp: Date.now(),
            components: structuredClone(components),
            selectedId,
          };

          // Remove future history if we're not at the end
          if (state.historyIndex < state.history.length - 1) {
            state.history.splice(state.historyIndex + 1);
          }

          // Add new entry
          state.history.push(entry);

          // Limit history size
          if (state.history.length > state.maxHistorySize) {
            state.history.shift();
          } else {
            state.historyIndex++;
          }
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          set((state) => {
            state.historyIndex--;
            const entry = history[state.historyIndex];
            state.components = structuredClone(entry.components);
            state.selectedId = entry.selectedId;
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          set((state) => {
            state.historyIndex++;
            const entry = history[state.historyIndex];
            state.components = structuredClone(entry.components);
            state.selectedId = entry.selectedId;
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // ========================================================================
      // UI Actions
      // ========================================================================

      setViewportMode: (mode) => {
        set((state) => {
          state.viewportMode = mode;
        });
      },

      setZoom: (zoom) => {
        set((state) => {
          state.zoom = Math.max(25, Math.min(200, zoom));
        });
      },

      togglePanel: (panel) => {
        set((state) => {
          state.panelState[panel] = !state.panelState[panel];
        });
      },

      setActiveRightPanel: (tab) => {
        set((state) => {
          state.activeRightPanel = tab;
        });
      },

      setDragging: (isDragging, draggedId) => {
        set((state) => {
          state.isDragging = isDragging;
          state.draggedId = draggedId || null;
        });
      },

      // ========================================================================
      // Utility Functions
      // ========================================================================

      findComponent: (id) => {
        const search = (components: ComponentNode[]): ComponentNode | null => {
          for (const component of components) {
            if (component.id === id) return component;
            const found = search(component.children);
            if (found) return found;
          }
          return null;
        };
        return search(get().components);
      },

      getComponentPath: (id) => {
        const path: ComponentNode[] = [];
        const search = (components: ComponentNode[]): boolean => {
          for (const component of components) {
            if (component.id === id) {
              path.unshift(component);
              return true;
            }
            if (search(component.children)) {
              path.unshift(component);
              return true;
            }
          }
          return false;
        };
        search(get().components);
        return path;
      },

      reset: () => {
        set(initialState);
      },
    })),
    { name: 'BuilderStore' }
  )
);

// ============================================================================
// Selectors (Memoized)
// ============================================================================

export const selectSelectedComponent = (state: BuilderState) =>
  state.selectedId ? state.findComponent(state.selectedId) : null;

export const selectCanUndo = (state: BuilderState) => state.canUndo();
export const selectCanRedo = (state: BuilderState) => state.canRedo();
export const selectIsDirty = (state: BuilderState) => state.isDirty;
