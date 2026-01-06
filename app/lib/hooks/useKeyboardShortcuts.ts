/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts management for Da Vinci workspace
 * Handles panel switching, file operations, and editor commands
 */

import { useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '../stores/workspace.store';
import { useFileSystem } from '../services/filesystem';

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Keyboard shortcuts for Da Vinci workspace
 */
export function useKeyboardShortcuts() {
  const workspace = useWorkspaceStore();
  const filesystem = useFileSystem();

  const shortcuts: ShortcutHandler[] = [
    // Panel Navigation
    {
      key: '1',
      ctrl: true,
      description: 'Switch to Content Panel',
      action: () => {
        workspace.setActivePanel('content');
        if (!workspace.panels.content.visible) {
          workspace.togglePanel('content');
        }
      },
    },
    {
      key: '2',
      ctrl: true,
      description: 'Switch to Design Panel',
      action: () => {
        workspace.setActivePanel('design');
        if (!workspace.panels.design.visible) {
          workspace.togglePanel('design');
        }
      },
    },
    {
      key: '3',
      ctrl: true,
      description: 'Switch to Code Panel',
      action: () => {
        workspace.setActivePanel('code');
        if (!workspace.panels.code.visible) {
          workspace.togglePanel('code');
        }
      },
    },

    // Panel Presets
    {
      key: '1',
      ctrl: true,
      shift: true,
      description: 'Content Only Mode',
      action: () => workspace.loadWorkspacePreset('content'),
    },
    {
      key: '2',
      ctrl: true,
      shift: true,
      description: 'Design Only Mode',
      action: () => workspace.loadWorkspacePreset('design'),
    },
    {
      key: '3',
      ctrl: true,
      shift: true,
      description: 'Code Only Mode',
      action: () => workspace.loadWorkspacePreset('code'),
    },
    {
      key: '0',
      ctrl: true,
      shift: true,
      description: 'Full Workspace Mode',
      action: () => workspace.loadWorkspacePreset('full'),
    },

    // File Operations
    {
      key: 's',
      ctrl: true,
      description: 'Save Current File',
      preventDefault: true,
      action: () => {
        const activeFile = filesystem.activeFile;
        if (activeFile) {
          console.log('Save file:', activeFile);
          // TODO: Implement API save
        }
      },
    },
    {
      key: 'o',
      ctrl: true,
      description: 'Open File',
      preventDefault: true,
      action: () => {
        console.log('Open file dialog');
        // TODO: Implement file picker
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New File',
      action: () => {
        console.log('Create new file');
        // TODO: Implement new file dialog
      },
    },
    {
      key: 'w',
      ctrl: true,
      description: 'Close Current File',
      preventDefault: true,
      action: () => {
        const activeFile = filesystem.activeFile;
        if (activeFile) {
          filesystem.closeFile(activeFile);
        }
      },
    },

    // Editor Commands
    {
      key: 'f',
      ctrl: true,
      description: 'Find in File',
      preventDefault: true,
      action: () => {
        console.log('Find in file');
        // Monaco handles this natively
      },
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Find and Replace',
      preventDefault: true,
      action: () => {
        console.log('Find and replace');
        // Monaco handles this natively
      },
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Duplicate Line',
      preventDefault: true,
      action: () => {
        console.log('Duplicate line');
        // Monaco handles this natively
      },
    },
    {
      key: '/',
      ctrl: true,
      description: 'Toggle Comment',
      preventDefault: true,
      action: () => {
        console.log('Toggle comment');
        // Monaco handles this natively
      },
    },

    // View Commands
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle Sidebar',
      preventDefault: true,
      action: () => {
        console.log('Toggle sidebar');
        // TODO: Implement sidebar toggle
      },
    },
    {
      key: '\\',
      ctrl: true,
      description: 'Toggle Panel',
      preventDefault: true,
      action: () => {
        const activePanel = workspace.activePanel;
        workspace.togglePanel(activePanel);
      },
    },
    {
      key: '+',
      ctrl: true,
      description: 'Zoom In',
      preventDefault: true,
      action: () => {
        if (workspace.activePanel === 'code') {
          workspace.setCodeFontSize(
            Math.min(24, workspace.codeEditor.fontSize + 1)
          );
        } else if (workspace.activePanel === 'design') {
          workspace.setDesignZoom(
            Math.min(200, workspace.designEditor.zoom + 10)
          );
        }
      },
    },
    {
      key: '-',
      ctrl: true,
      description: 'Zoom Out',
      preventDefault: true,
      action: () => {
        if (workspace.activePanel === 'code') {
          workspace.setCodeFontSize(
            Math.max(10, workspace.codeEditor.fontSize - 1)
          );
        } else if (workspace.activePanel === 'design') {
          workspace.setDesignZoom(
            Math.max(25, workspace.designEditor.zoom - 10)
          );
        }
      },
    },
    {
      key: '0',
      ctrl: true,
      description: 'Reset Zoom',
      preventDefault: true,
      action: () => {
        if (workspace.activePanel === 'code') {
          workspace.setCodeFontSize(14);
        } else if (workspace.activePanel === 'design') {
          workspace.setDesignZoom(100);
        }
      },
    },

    // Tab Navigation
    {
      key: 'Tab',
      ctrl: true,
      description: 'Next Tab',
      preventDefault: true,
      action: () => {
        const openFiles = filesystem.openFiles;
        const currentIndex = openFiles.indexOf(filesystem.activeFile || '');
        const nextIndex = (currentIndex + 1) % openFiles.length;
        if (openFiles[nextIndex]) {
          filesystem.setActiveFile(openFiles[nextIndex]);
        }
      },
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      description: 'Previous Tab',
      preventDefault: true,
      action: () => {
        const openFiles = filesystem.openFiles;
        const currentIndex = openFiles.indexOf(filesystem.activeFile || '');
        const prevIndex =
          (currentIndex - 1 + openFiles.length) % openFiles.length;
        if (openFiles[prevIndex]) {
          filesystem.setActiveFile(openFiles[prevIndex]);
        }
      },
    },

    // Workspace Commands
    {
      key: 'p',
      ctrl: true,
      shift: true,
      description: 'Command Palette',
      preventDefault: true,
      action: () => {
        console.log('Command palette');
        // TODO: Implement command palette
      },
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Clear Console',
      preventDefault: true,
      action: () => {
        console.clear();
      },
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
  };
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(shortcut: ShortcutHandler): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac() ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac() ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac() ? '⌥' : 'Alt');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Detect macOS
 */
function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
}
