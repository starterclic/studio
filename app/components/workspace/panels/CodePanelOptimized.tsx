/**
 * Code Panel - Optimized with Monaco Editor
 *
 * Full-featured code editor with:
 * - Monaco Editor integration
 * - Virtual File System
 * - Keyboard shortcuts
 * - Multi-tab support
 * - Terminal integration
 */

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import { useFileSystem } from '~/lib/services/filesystem';
import { useMonaco, configureMonacoTypeScript } from '~/lib/hooks/useMonaco';
import type { FileNode } from '~/lib/services/filesystem';

export function CodePanelOptimized() {
  const workspace = useWorkspaceStore();
  const filesystem = useFileSystem();

  const [showFileTree, setShowFileTree] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ Da Vinci Terminal v1.0.0',
    '$ Type "help" for available commands',
  ]);

  // Get active file content
  const activeFile = filesystem.activeFile
    ? filesystem.getFile(filesystem.activeFile)
    : null;

  // Monaco Editor Integration
  const { containerRef, monaco, editor, isLoading } = useMonaco({
    value: activeFile?.content || '',
    language: activeFile?.language || 'typescript',
    theme: workspace.codeEditor.theme,
    fontSize: workspace.codeEditor.fontSize,
    wordWrap: workspace.codeEditor.wordWrap ? 'on' : 'off',
    onChange: (value) => {
      if (filesystem.activeFile) {
        filesystem.updateFile(filesystem.activeFile, value);
      }
    },
  });

  // Configure Monaco TypeScript when loaded
  useEffect(() => {
    if (monaco) {
      configureMonacoTypeScript(monaco);
    }
  }, [monaco]);

  // Update editor when active file changes
  useEffect(() => {
    if (editor && activeFile) {
      const currentValue = editor.getValue();
      if (currentValue !== activeFile.content) {
        editor.setValue(activeFile.content || '');
      }

      // Update language model
      const model = editor.getModel();
      if (model) {
        monaco?.editor.setModelLanguage(model, activeFile.language || 'plaintext');
      }
    }
  }, [activeFile, editor, monaco]);

  // File Tree Rendering
  const renderFileTree = (files: FileNode[], depth = 0) => {
    return files.map((file) => (
      <div key={file.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <button
          onClick={() => {
            if (file.type === 'file') {
              filesystem.openFile(file.path);
            }
          }}
          className={`
            w-full text-left px-2 py-1 text-sm hover:bg-gray-800 rounded
            flex items-center gap-2
            ${filesystem.activeFile === file.path ? 'bg-gray-800 text-blue-400' : 'text-gray-300'}
          `}
        >
          <span className="text-base">
            {file.type === 'folder' ? '📁' : getFileIcon(file.language || '')}
          </span>
          <span className="truncate">{file.name}</span>
        </button>
        {file.type === 'folder' && file.children && renderFileTree(file.children, depth + 1)}
      </div>
    ));
  };

  const handleTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    setTerminalOutput((prev) => [...prev, `$ ${trimmed}`]);

    switch (trimmed) {
      case 'help':
        setTerminalOutput((prev) => [
          ...prev,
          'Available commands:',
          '  help     - Show this help',
          '  clear    - Clear terminal',
          '  ls       - List files',
          '  tree     - Show file tree',
          '  version  - Show version',
        ]);
        break;
      case 'clear':
        setTerminalOutput(['$ Da Vinci Terminal v1.0.0']);
        break;
      case 'ls':
        const files = filesystem.getFileTree();
        setTerminalOutput((prev) => [
          ...prev,
          files.map((f) => f.name).join('  '),
        ]);
        break;
      case 'tree':
        const tree = filesystem.getFileTree();
        const treeStr = tree.map((f) => `├── ${f.name}`).join('\n');
        setTerminalOutput((prev) => [...prev, treeStr]);
        break;
      case 'version':
        setTerminalOutput((prev) => [...prev, 'Da Vinci v1.0.0 - AI Web Studio']);
        break;
      default:
        setTerminalOutput((prev) => [...prev, `Command not found: ${trimmed}`]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Panel Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">💻</span>
          <div>
            <h2 className="text-sm font-semibold">Code Editor</h2>
            <p className="text-xs text-gray-400">
              {activeFile?.name || 'No file selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* File Tree Toggle */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm"
            title="Toggle File Tree"
          >
            📂
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() =>
              workspace.setCodeTheme(
                workspace.codeEditor.theme === 'vs-dark' ? 'vs-light' : 'vs-dark'
              )
            }
            className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm"
            title="Toggle Theme"
          >
            {workspace.codeEditor.theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          {/* Font Size Controls */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
            <button
              onClick={() =>
                workspace.setCodeFontSize(Math.max(10, workspace.codeEditor.fontSize - 1))
              }
              className="text-gray-400 hover:text-white px-1 text-sm"
            >
              −
            </button>
            <span className="text-xs font-medium min-w-[2.5rem] text-center">
              {workspace.codeEditor.fontSize}px
            </span>
            <button
              onClick={() =>
                workspace.setCodeFontSize(Math.min(24, workspace.codeEditor.fontSize + 1))
              }
              className="text-gray-400 hover:text-white px-1 text-sm"
            >
              +
            </button>
          </div>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => workspace.toggleWordWrap()}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              workspace.codeEditor.wordWrap
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle Word Wrap"
          >
            ⏎
          </button>

          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm"
            title="Toggle Terminal"
          >
            $
          </button>
        </div>
      </div>

      {/* Open Files Tabs */}
      {filesystem.openFiles.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800 px-2 py-1 flex items-center gap-1 overflow-x-auto flex-shrink-0">
          {filesystem.openFiles.map((filePath) => {
            const file = filesystem.getFile(filePath);
            if (!file) return null;

            return (
              <div
                key={filePath}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm
                  ${
                    filesystem.activeFile === filePath
                      ? 'bg-gray-950 text-white border-t-2 border-blue-500'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }
                `}
              >
                <button
                  onClick={() => filesystem.setActiveFile(filePath)}
                  className="flex items-center gap-2"
                >
                  <span>{getFileIcon(file.language || '')}</span>
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    filesystem.closeFile(filePath);
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        {showFileTree && (
          <div className="w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto flex-shrink-0">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase">Files</h3>
                <button
                  onClick={() => {
                    const name = prompt('File name (e.g., app.tsx):');
                    if (name) {
                      filesystem.createFile(`/${name}`, '// New file\n');
                      filesystem.openFile(`/${name}`);
                    }
                  }}
                  className="text-gray-400 hover:text-white text-lg"
                  title="New File"
                >
                  +
                </button>
              </div>
              <div className="space-y-0.5">{renderFileTree(filesystem.getFileTree())}</div>
            </div>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-2">⚙️</div>
                  <p className="text-gray-400">Loading Monaco Editor...</p>
                </div>
              </div>
            ) : activeFile ? (
              <div ref={containerRef} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg font-medium mb-2">No file selected</p>
                  <p className="text-sm">Select a file from the sidebar or create a new one</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-black border-t border-gray-800 flex flex-col flex-shrink-0">
              <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
                {terminalOutput.map((line, i) => (
                  <div key={i} className="text-green-400">
                    {line}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-800 p-2 flex items-center gap-2">
                <span className="text-green-400 font-mono text-sm">$</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
                  placeholder="Enter command..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTerminalCommand(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-600 px-4 py-1.5 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>
            {activeFile?.language?.toUpperCase() || 'PLAINTEXT'}
          </span>
          {activeFile && (
            <>
              <span>UTF-8</span>
              <span>LF</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Monaco Editor</span>
          {editor && <span>Ln 1, Col 1</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Get file icon based on language
 */
function getFileIcon(language: string): string {
  const icons: Record<string, string> = {
    typescript: '🔷',
    javascript: '💛',
    json: '📋',
    html: '🌐',
    css: '🎨',
    markdown: '📝',
    python: '🐍',
    go: '🔵',
    rust: '🦀',
    java: '☕',
  };

  return icons[language] || '📄';
}
