/**
 * Da Vinci Workspace Store
 *
 * Manages workspace state, panel visibility, and layout configuration
 * Uses Zustand for lightweight, performant state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type PanelType = 'content' | 'design' | 'code';

export interface WorkspacePanel {
  id: PanelType;
  title: string;
  icon: string;
  visible: boolean;
  order: number;
  width?: number; // percentage for horizontal layout
}

export interface WorkspaceLayout {
  mode: 'single' | 'split' | 'triple';
  orientation: 'horizontal' | 'vertical';
  activePanels: PanelType[];
}

export interface WorkspaceState {
  // Layout
  layout: WorkspaceLayout;

  // Panels
  panels: Record<PanelType, WorkspacePanel>;
  activePanel: PanelType;

  // Content Panel State
  contentEditor: {
    currentFile: string | null;
    unsavedChanges: boolean;
  };

  // Design Panel State
  designEditor: {
    selectedElement: string | null;
    zoom: number;
    gridVisible: boolean;
  };

  // Code Panel State
  codeEditor: {
    currentFile: string | null;
    language: string;
    theme: 'vs-dark' | 'vs-light';
    fontSize: number;
    wordWrap: boolean;
  };

  // Actions
  setLayout: (layout: Partial<WorkspaceLayout>) => void;
  togglePanel: (panelId: PanelType) => void;
  setActivePanel: (panelId: PanelType) => void;
  setPanelWidth: (panelId: PanelType, width: number) => void;

  // Content Panel Actions
  setContentFile: (file: string | null) => void;
  setContentUnsaved: (unsaved: boolean) => void;

  // Design Panel Actions
  setSelectedElement: (elementId: string | null) => void;
  setDesignZoom: (zoom: number) => void;
  toggleGrid: () => void;

  // Code Panel Actions
  setCodeFile: (file: string | null, language?: string) => void;
  setCodeTheme: (theme: 'vs-dark' | 'vs-light') => void;
  setCodeFontSize: (size: number) => void;
  toggleWordWrap: () => void;

  // Workspace Actions
  resetWorkspace: () => void;
  loadWorkspacePreset: (preset: 'content' | 'design' | 'code' | 'full') => void;
}

// ============================================================================
// Default State
// ============================================================================

const defaultPanels: Record<PanelType, WorkspacePanel> = {
  content: {
    id: 'content',
    title: 'Content',
    icon: '📝',
    visible: true,
    order: 1,
    width: 33,
  },
  design: {
    id: 'design',
    title: 'Design',
    icon: '🎨',
    visible: true,
    order: 2,
    width: 34,
  },
  code: {
    id: 'code',
    title: 'Code',
    icon: '💻',
    visible: true,
    order: 3,
    width: 33,
  },
};

const defaultLayout: WorkspaceLayout = {
  mode: 'triple',
  orientation: 'horizontal',
  activePanels: ['content', 'design', 'code'],
};

// ============================================================================
// Store
// ============================================================================

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      // Initial State
      layout: defaultLayout,
      panels: defaultPanels,
      activePanel: 'content',

      contentEditor: {
        currentFile: null,
        unsavedChanges: false,
      },

      designEditor: {
        selectedElement: null,
        zoom: 100,
        gridVisible: true,
      },

      codeEditor: {
        currentFile: null,
        language: 'typescript',
        theme: 'vs-dark',
        fontSize: 14,
        wordWrap: true,
      },

      // Layout Actions
      setLayout: (layout) =>
        set((state) => ({
          layout: { ...state.layout, ...layout },
        })),

      togglePanel: (panelId) =>
        set((state) => {
          const panel = state.panels[panelId];
          const newVisible = !panel.visible;

          // Count visible panels
          const visiblePanels = Object.values(state.panels).filter(
            (p) => p.id === panelId ? newVisible : p.visible
          );

          // Determine new layout mode
          let mode: WorkspaceLayout['mode'] = 'single';
          if (visiblePanels.length === 2) mode = 'split';
          if (visiblePanels.length === 3) mode = 'triple';

          return {
            panels: {
              ...state.panels,
              [panelId]: { ...panel, visible: newVisible },
            },
            layout: {
              ...state.layout,
              mode,
              activePanels: visiblePanels.map((p) => p.id),
            },
          };
        }),

      setActivePanel: (panelId) =>
        set({ activePanel: panelId }),

      setPanelWidth: (panelId, width) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [panelId]: { ...state.panels[panelId], width },
          },
        })),

      // Content Panel Actions
      setContentFile: (file) =>
        set((state) => ({
          contentEditor: { ...state.contentEditor, currentFile: file },
        })),

      setContentUnsaved: (unsaved) =>
        set((state) => ({
          contentEditor: { ...state.contentEditor, unsavedChanges: unsaved },
        })),

      // Design Panel Actions
      setSelectedElement: (elementId) =>
        set((state) => ({
          designEditor: { ...state.designEditor, selectedElement: elementId },
        })),

      setDesignZoom: (zoom) =>
        set((state) => ({
          designEditor: { ...state.designEditor, zoom },
        })),

      toggleGrid: () =>
        set((state) => ({
          designEditor: {
            ...state.designEditor,
            gridVisible: !state.designEditor.gridVisible,
          },
        })),

      // Code Panel Actions
      setCodeFile: (file, language = 'typescript') =>
        set((state) => ({
          codeEditor: { ...state.codeEditor, currentFile: file, language },
        })),

      setCodeTheme: (theme) =>
        set((state) => ({
          codeEditor: { ...state.codeEditor, theme },
        })),

      setCodeFontSize: (size) =>
        set((state) => ({
          codeEditor: { ...state.codeEditor, fontSize: size },
        })),

      toggleWordWrap: () =>
        set((state) => ({
          codeEditor: {
            ...state.codeEditor,
            wordWrap: !state.codeEditor.wordWrap,
          },
        })),

      // Workspace Actions
      resetWorkspace: () =>
        set({
          layout: defaultLayout,
          panels: defaultPanels,
          activePanel: 'content',
        }),

      loadWorkspacePreset: (preset) =>
        set((state) => {
          const presets: Record<string, Partial<WorkspaceState>> = {
            content: {
              panels: {
                ...state.panels,
                content: { ...state.panels.content, visible: true, width: 100 },
                design: { ...state.panels.design, visible: false },
                code: { ...state.panels.code, visible: false },
              },
              layout: {
                mode: 'single',
                orientation: 'horizontal',
                activePanels: ['content'],
              },
              activePanel: 'content',
            },
            design: {
              panels: {
                ...state.panels,
                content: { ...state.panels.content, visible: false },
                design: { ...state.panels.design, visible: true, width: 100 },
                code: { ...state.panels.code, visible: false },
              },
              layout: {
                mode: 'single',
                orientation: 'horizontal',
                activePanels: ['design'],
              },
              activePanel: 'design',
            },
            code: {
              panels: {
                ...state.panels,
                content: { ...state.panels.content, visible: false },
                design: { ...state.panels.design, visible: false },
                code: { ...state.panels.code, visible: true, width: 100 },
              },
              layout: {
                mode: 'single',
                orientation: 'horizontal',
                activePanels: ['code'],
              },
              activePanel: 'code',
            },
            full: {
              panels: defaultPanels,
              layout: defaultLayout,
              activePanel: 'content',
            },
          };

          return { ...state, ...presets[preset] };
        }),
    }),
    {
      name: 'davinci-workspace',
      partialize: (state) => ({
        layout: state.layout,
        panels: state.panels,
        activePanel: state.activePanel,
        codeEditor: {
          theme: state.codeEditor.theme,
          fontSize: state.codeEditor.fontSize,
          wordWrap: state.codeEditor.wordWrap,
        },
        designEditor: {
          zoom: state.designEditor.zoom,
          gridVisible: state.designEditor.gridVisible,
        },
      }),
    }
  )
);
