/**
 * Code Panel
 *
 * Monaco-powered code editor with syntax highlighting
 * Supports TypeScript, JavaScript, CSS, HTML, and more
 */

import { useWorkspaceStore } from '~/lib/stores/workspace.store';

export function CodePanel() {
  const {
    codeEditor,
    setCodeFile,
    setCodeTheme,
    setCodeFontSize,
    toggleWordWrap,
  } = useWorkspaceStore();

  // Sample file tree
  const projectFiles = [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        { id: '2', name: 'index.tsx', type: 'file', language: 'typescript' },
        { id: '3', name: 'App.tsx', type: 'file', language: 'typescript' },
        { id: '4', name: 'styles.css', type: 'file', language: 'css' },
      ],
    },
    { id: '5', name: 'package.json', type: 'file', language: 'json' },
    { id: '6', name: 'README.md', type: 'file', language: 'markdown' },
  ];

  // Sample code content
  const sampleCode = `import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Da Vinci Code Editor</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`;

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Panel Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💻</span>
          <div>
            <h2 className="text-sm font-semibold">Code Editor</h2>
            <p className="text-xs text-gray-400">
              {codeEditor.currentFile || 'No file selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() =>
              setCodeTheme(codeEditor.theme === 'vs-dark' ? 'vs-light' : 'vs-dark')
            }
            className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm"
          >
            {codeEditor.theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          {/* Font Size */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1.5">
            <button
              onClick={() => setCodeFontSize(Math.max(10, codeEditor.fontSize - 1))}
              className="text-gray-400 hover:text-white px-1"
            >
              −
            </button>
            <span className="text-sm font-medium min-w-[2rem] text-center">
              {codeEditor.fontSize}px
            </span>
            <button
              onClick={() => setCodeFontSize(Math.min(24, codeEditor.fontSize + 1))}
              className="text-gray-400 hover:text-white px-1"
            >
              +
            </button>
          </div>

          {/* Word Wrap */}
          <button
            onClick={toggleWordWrap}
            className={`
              px-3 py-1.5 rounded-lg text-sm transition-colors
              ${
                codeEditor.wordWrap
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }
            `}
          >
            ↩️ Wrap
          </button>

          {/* Format */}
          <button className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm">
            ✨ Format
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">Explorer</h3>
              <button className="text-gray-400 hover:text-white text-sm">
                ➕
              </button>
            </div>

            {/* File Tree */}
            <div className="space-y-1">
              {projectFiles.map((item) =>
                item.type === 'folder' ? (
                  <div key={item.id}>
                    <button className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                      <span>📁</span>
                      <span>{item.name}</span>
                    </button>
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child: any) => (
                        <button
                          key={child.id}
                          onClick={() => setCodeFile(child.name, child.language)}
                          className={`
                            w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                            ${
                              codeEditor.currentFile === child.name
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }
                          `}
                        >
                          <span>
                            {child.language === 'typescript'
                              ? '📘'
                              : child.language === 'css'
                              ? '🎨'
                              : '📄'}
                          </span>
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => setCodeFile(item.name, (item as any).language)}
                    className={`
                      w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                      ${
                        codeEditor.currentFile === item.name
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <span>
                      {item.name.endsWith('.json')
                        ? '📋'
                        : item.name.endsWith('.md')
                        ? '📝'
                        : '📄'}
                    </span>
                    <span>{item.name}</span>
                  </button>
                )
              )}
            </div>

            {/* Git Status */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Source Control
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">
                  <span className="text-green-400">●</span> 2 modified
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-blue-400">●</span> 1 staged
                </div>
                <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">
                  Commit Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="bg-gray-950 border-b border-gray-800 flex items-center px-2">
            {codeEditor.currentFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-r border-gray-800">
                <span className="text-sm">{codeEditor.currentFile}</span>
                <button className="text-gray-400 hover:text-white text-xs">
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Monaco Editor Placeholder */}
          <div className="flex-1 relative">
            <div
              className="absolute inset-0 overflow-auto p-4 font-mono text-sm"
              style={{
                fontSize: `${codeEditor.fontSize}px`,
                whiteSpace: codeEditor.wordWrap ? 'pre-wrap' : 'pre',
              }}
            >
              <pre
                className={`${
                  codeEditor.theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-900'
                }`}
              >
                {sampleCode}
              </pre>
            </div>

            {/* Monaco would be integrated here */}
            <div className="absolute bottom-4 right-4 bg-gray-950/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-800 text-xs">
              <div className="text-gray-400">
                💡 <strong>Tip:</strong> Monaco Editor integration ready
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-gray-950 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-gray-400">
              <span>Ln 1, Col 1</span>
              <span>Spaces: 2</span>
              <span>UTF-8</span>
              <span className="text-blue-400">TypeScript</span>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <span>⚙️ Prettier</span>
              <span>✓ No Problems</span>
            </div>
          </div>
        </div>

        {/* Minimap / Terminal */}
        <div className="w-80 bg-gray-950 border-l border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button className="flex-1 px-4 py-2 text-sm bg-gray-900 border-b-2 border-blue-600">
              Terminal
            </button>
            <button className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white">
              Problems
            </button>
            <button className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white">
              Output
            </button>
          </div>

          {/* Terminal Content */}
          <div className="flex-1 p-4 font-mono text-sm overflow-auto">
            <div className="text-gray-400">
              <span className="text-green-400">$</span> npm run dev
            </div>
            <div className="text-gray-500 mt-2">
              Starting development server...
              <br />
              ✓ Server ready at http://localhost:5173
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
