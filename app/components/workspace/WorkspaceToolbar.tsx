/**
 * Da Vinci Workspace Toolbar
 *
 * Top toolbar with panel toggles, presets, and workspace controls
 */

import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import { Link } from '@remix-run/react';

export function WorkspaceToolbar() {
  const { panels, activePanel, togglePanel, setActivePanel, loadWorkspacePreset } =
    useWorkspaceStore();

  return (
    <div className="bg-gray-950 border-b border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Logo & Project Info */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
          >
            🎨 Da Vinci
          </Link>

          <div className="h-6 w-px bg-gray-700" />

          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">My Project</span>
            <span className="mx-2">/</span>
            <span>index.tsx</span>
          </div>
        </div>

        {/* Center: Panel Toggles */}
        <div className="flex items-center gap-2">
          {Object.values(panels).map((panel) => (
            <button
              key={panel.id}
              onClick={() => {
                togglePanel(panel.id);
                if (!panel.visible) {
                  setActivePanel(panel.id);
                }
              }}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${
                  panel.visible
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
                ${activePanel === panel.id && panel.visible ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              <span className="mr-2">{panel.icon}</span>
              {panel.title}
            </button>
          ))}
        </div>

        {/* Right: Presets & Actions */}
        <div className="flex items-center gap-2">
          {/* View Presets */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => loadWorkspacePreset('content')}
              className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Content Only (Ctrl+Shift+1)"
            >
              📝
            </button>
            <button
              onClick={() => loadWorkspacePreset('design')}
              className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Design Only (Ctrl+Shift+2)"
            >
              🎨
            </button>
            <button
              onClick={() => loadWorkspacePreset('code')}
              className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Code Only (Ctrl+Shift+3)"
            >
              💻
            </button>
            <button
              onClick={() => loadWorkspacePreset('full')}
              className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="All Panels (Ctrl+Shift+0)"
            >
              ⚡
            </button>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          {/* User Menu */}
          <Link
            to="/deployments"
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            🚀 Deploy
          </Link>

          <Link
            to="/api/auth/logout"
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}
