/**
 * Da Vinci Workspace Layout
 *
 * Main workspace container with dynamic panel system
 */

import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import { ContentPanel } from './panels/ContentPanel';
import { DesignPanel } from './panels/DesignPanel';
import { CodePanelOptimized } from './panels/CodePanelOptimized';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { PanelResizer } from './PanelResizer';
import { useKeyboardShortcuts } from '~/lib/hooks/useKeyboardShortcuts';
import { initializeDefaultProject } from '~/lib/services/filesystem';
import { useEffect } from 'react';

export function WorkspaceLayout() {
  const { layout, panels, activePanel } = useWorkspaceStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize default project on first load
  useEffect(() => {
    const hasInitialized = localStorage.getItem('davinci-initialized');
    if (!hasInitialized) {
      initializeDefaultProject();
      localStorage.setItem('davinci-initialized', 'true');
    }
  }, []);

  // Get visible panels in order
  const visiblePanels = Object.values(panels)
    .filter((p) => p.visible)
    .sort((a, b) => a.order - b.order);

  // Render panel component based on type
  const renderPanel = (panelId: string) => {
    const panelComponents = {
      content: ContentPanel,
      design: DesignPanel,
      code: CodePanelOptimized,
    };

    const PanelComponent = panelComponents[panelId as keyof typeof panelComponents];
    return PanelComponent ? <PanelComponent key={panelId} /> : null;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Workspace Toolbar */}
      <WorkspaceToolbar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {visiblePanels.length === 0 ? (
          // No panels visible - show empty state
          <div className="flex-1 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to Da Vinci Workspace
              </h2>
              <p className="text-gray-400 mb-6">
                Enable panels from the toolbar above to start working
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => useWorkspaceStore.getState().loadWorkspacePreset('content')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📝 Content Mode
                </button>
                <button
                  onClick={() => useWorkspaceStore.getState().loadWorkspacePreset('design')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  🎨 Design Mode
                </button>
                <button
                  onClick={() => useWorkspaceStore.getState().loadWorkspacePreset('code')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  💻 Code Mode
                </button>
              </div>
            </div>
          </div>
        ) : layout.mode === 'single' ? (
          // Single panel mode
          <div className="flex-1">
            {renderPanel(visiblePanels[0].id)}
          </div>
        ) : layout.orientation === 'horizontal' ? (
          // Horizontal split
          <div className="flex-1 flex">
            {visiblePanels.map((panel, index) => (
              <div key={panel.id} className="flex">
                <div
                  className="relative"
                  style={{ width: `${panel.width}%` }}
                >
                  {renderPanel(panel.id)}
                </div>
                {index < visiblePanels.length - 1 && (
                  <PanelResizer
                    orientation="vertical"
                    onResize={(delta) => {
                      // Handle resize
                      const currentWidth = panel.width || 50;
                      const nextPanel = visiblePanels[index + 1];
                      const nextWidth = nextPanel.width || 50;

                      useWorkspaceStore.getState().setPanelWidth(
                        panel.id,
                        Math.max(20, Math.min(80, currentWidth + delta))
                      );
                      useWorkspaceStore.getState().setPanelWidth(
                        nextPanel.id,
                        Math.max(20, Math.min(80, nextWidth - delta))
                      );
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          // Vertical split
          <div className="flex-1 flex flex-col">
            {visiblePanels.map((panel, index) => (
              <div key={panel.id} className="flex flex-col">
                <div
                  className="relative"
                  style={{ height: `${panel.width}%` }}
                >
                  {renderPanel(panel.id)}
                </div>
                {index < visiblePanels.length - 1 && (
                  <PanelResizer
                    orientation="horizontal"
                    onResize={(delta) => {
                      const currentHeight = panel.width || 50;
                      const nextPanel = visiblePanels[index + 1];
                      const nextHeight = nextPanel.width || 50;

                      useWorkspaceStore.getState().setPanelWidth(
                        panel.id,
                        Math.max(20, Math.min(80, currentHeight + delta))
                      );
                      useWorkspaceStore.getState().setPanelWidth(
                        nextPanel.id,
                        Math.max(20, Math.min(80, nextHeight - delta))
                      );
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="hidden">
        {/* Hidden for accessibility - shortcuts defined here */}
        <kbd>Ctrl+1</kbd> Content Panel
        <kbd>Ctrl+2</kbd> Design Panel
        <kbd>Ctrl+3</kbd> Code Panel
        <kbd>Ctrl+B</kbd> Toggle Sidebar
        <kbd>Ctrl+\\</kbd> Toggle Panel
      </div>
    </div>
  );
}
