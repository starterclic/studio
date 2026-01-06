/**
 * Builder Layout - Ultra Premium
 *
 * Main layout orchestrator for the visual builder
 * Features: Layout management, Keyboard shortcuts, Auto-save
 */

import { useEffect, useCallback, useState } from 'react';
import { useBuilderStore } from '~/lib/stores/builder.store';
import { BuilderToolbar } from './BuilderToolbar';
import { ComponentPalette } from './ComponentPalette';
import { BuilderCanvas } from './BuilderCanvas';
import { BuilderRightPanel } from './BuilderRightPanel';

interface BuilderLayoutProps {
  pageId: string;
  pagePath: string;
  initialComponents?: any[];
}

export function BuilderLayout({ pageId, pagePath, initialComponents = [] }: BuilderLayoutProps) {
  const { setPage, undo, redo, save, selectComponent } = useBuilderStore();

  // ========================================================================
  // Initialize Page
  // ========================================================================

  useEffect(() => {
    setPage(pageId, pagePath, initialComponents);

    return () => {
      // Cleanup on unmount
      useBuilderStore.getState().reset();
    };
  }, [pageId, pagePath, initialComponents, setPage]);

  // ========================================================================
  // Keyboard Shortcuts
  // ========================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl modifier
      const isMod = e.metaKey || e.ctrlKey;

      // Save (Ctrl+S)
      if (isMod && e.key === 's') {
        e.preventDefault();
        save();
      }

      // Undo (Ctrl+Z)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        redo();
      }

      // Deselect (Escape)
      if (e.key === 'Escape') {
        selectComponent(null);
      }

      // Select All (Ctrl+A) - Prevent default
      if (isMod && e.key === 'a') {
        e.preventDefault();
        // Could implement "select all components" here
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, undo, redo, selectComponent]);

  // ========================================================================
  // Auto-save (Every 30 seconds if dirty)
  // ========================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useBuilderStore.getState();
      if (state.isDirty) {
        console.log('[Auto-save] Saving changes...');
        state.save();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // ========================================================================
  // Beforeunload Warning
  // ========================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const state = useBuilderStore.getState();
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <BuilderToolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Palette */}
        <ComponentPalette />

        {/* Center: Canvas */}
        <BuilderCanvas />

        {/* Right: Tabbed Panel (Inspector + Preview) */}
        <BuilderRightPanel />
      </div>

      {/* Keyboard Shortcuts Help (Bottom Toast) */}
      <KeyboardShortcutsHint />
    </div>
  );
}

// ============================================================================
// Keyboard Shortcuts Hint
// ============================================================================

function KeyboardShortcutsHint() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide after 10 seconds
    const timer = setTimeout(() => setIsVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl p-4 max-w-sm border border-gray-700 z-50 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Keyboard Shortcuts
          </h4>
          <div className="text-sm space-y-1 text-gray-300">
            <div><kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Ctrl+S</kbd> Save</div>
            <div><kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Z</kbd> Undo</div>
            <div><kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Y</kbd> Redo</div>
            <div><kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Del</kbd> Delete selected</div>
            <div><kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> Deselect</div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// CSS for animations (injected once)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `;
  if (!document.getElementById('builder-animations')) {
    style.id = 'builder-animations';
    document.head.appendChild(style);
  }
}
