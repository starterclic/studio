/**
 * Builder Toolbar - Ultra Premium
 *
 * Top toolbar with actions: Save, Undo/Redo, Viewport, Zoom, Preview
 */

import { useBuilderStore, selectCanUndo, selectCanRedo, selectIsDirty } from '~/lib/stores/builder.store';

export function BuilderToolbar() {
  const {
    viewportMode,
    zoom,
    setViewportMode,
    setZoom,
    setActiveRightPanel,
    undo,
    redo,
    save,
    pagePath,
  } = useBuilderStore();

  const canUndo = useBuilderStore(selectCanUndo);
  const canRedo = useBuilderStore(selectCanRedo);
  const isDirty = useBuilderStore(selectIsDirty);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleSave = async () => {
    await save();
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 25));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      {/* Left: Page Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Visual Builder
        </h1>
        {pagePath && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pagePath}
          </div>
        )}
        {isDirty && (
          <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold">
            Unsaved
          </span>
        )}
      </div>

      {/* Center: Viewport Controls */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setViewportMode('desktop')}
          className={`
            px-3 py-2 rounded-md transition-all flex items-center gap-2
            ${
              viewportMode === 'desktop'
                ? 'bg-white dark:bg-gray-600 shadow-md text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
          title="Desktop View"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 11a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
          <span className="text-sm font-medium hidden md:inline">Desktop</span>
        </button>

        <button
          onClick={() => setViewportMode('tablet')}
          className={`
            px-3 py-2 rounded-md transition-all flex items-center gap-2
            ${
              viewportMode === 'tablet'
                ? 'bg-white dark:bg-gray-600 shadow-md text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
          title="Tablet View (768px)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
          </svg>
          <span className="text-sm font-medium hidden md:inline">Tablet</span>
        </button>

        <button
          onClick={() => setViewportMode('mobile')}
          className={`
            px-3 py-2 rounded-md transition-all flex items-center gap-2
            ${
              viewportMode === 'mobile'
                ? 'bg-white dark:bg-gray-600 shadow-md text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
          title="Mobile View (375px)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 2A2.5 2.5 0 003 4.5v11A2.5 2.5 0 005.5 18h9a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0014.5 2h-9zM10 15a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span className="text-sm font-medium hidden md:inline">Mobile</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`
              p-2 rounded-md transition-all
              ${
                canUndo
                  ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className={`
              p-2 rounded-md transition-all
              ${
                canRedo
                  ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            className={`
              p-2 rounded-md transition-all
              ${
                zoom > 25
                  ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }
            `}
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={handleZoomReset}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-all min-w-[60px]"
            title="Reset Zoom"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className={`
              p-2 rounded-md transition-all
              ${
                zoom < 200
                  ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }
            `}
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`
            px-6 py-2 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2
            ${
              isDirty
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </button>

        {/* Preview */}
        <button
          onClick={() => setActiveRightPanel('preview')}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 flex items-center gap-2"
          title="Preview Mode - Switch to preview tab"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
      </div>
    </div>
  );
}
