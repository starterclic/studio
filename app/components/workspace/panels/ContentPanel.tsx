/**
 * Content Panel
 *
 * Markdown/MDX editor with Keystatic CMS integration
 * Manages content files, blog posts, and documentation
 */

import { useState } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';

export function ContentPanel() {
  const { contentEditor, setContentFile, setContentUnsaved } = useWorkspaceStore();
  const [content, setContent] = useState('# Welcome to Da Vinci\n\nStart writing your content here...');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setContentUnsaved(true);
  };

  const handleSave = () => {
    // TODO: Implement save to API
    console.log('Saving content...', content);
    setContentUnsaved(false);
  };

  // File tree for content navigation
  const contentFiles = [
    { id: '1', name: 'index.md', type: 'file', path: '/content/index.md' },
    { id: '2', name: 'about.md', type: 'file', path: '/content/about.md' },
    {
      id: '3',
      name: 'blog',
      type: 'folder',
      children: [
        { id: '4', name: 'first-post.md', type: 'file', path: '/content/blog/first-post.md' },
        { id: '5', name: 'second-post.md', type: 'file', path: '/content/blog/second-post.md' },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Panel Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h2 className="text-sm font-semibold">Content Editor</h2>
            <p className="text-xs text-gray-400">
              {contentEditor.currentFile || 'No file selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contentEditor.unsavedChanges && (
            <span className="text-xs text-yellow-400 font-medium">● Unsaved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!contentEditor.unsavedChanges}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">Content Files</h3>
              <button className="text-gray-400 hover:text-white text-sm">
                ➕
              </button>
            </div>

            {/* File Tree */}
            <div className="space-y-1">
              {contentFiles.map((item) =>
                item.type === 'folder' ? (
                  <div key={item.id}>
                    <button className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                      <span>📁</span>
                      <span>{item.name}</span>
                    </button>
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setContentFile(child.path)}
                          className={`
                            w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                            ${
                              contentEditor.currentFile === child.path
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }
                          `}
                        >
                          <span>📄</span>
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => setContentFile(item.path)}
                    className={`
                      w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                      ${
                        contentEditor.currentFile === item.path
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <span>📄</span>
                    <span>{item.name}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Markdown Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                placeholder="Start typing..."
                spellCheck={false}
              />
            </div>

            {/* Toolbar */}
            <div className="bg-gray-950 border-t border-gray-800 px-4 py-2 flex items-center gap-2">
              <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded">
                <strong>B</strong>
              </button>
              <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded">
                <em>I</em>
              </button>
              <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded">
                🔗
              </button>
              <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded">
                📷
              </button>
              <div className="flex-1" />
              <span className="text-xs text-gray-500">
                {content.length} characters • {content.split('\n').length} lines
              </span>
            </div>
          </div>

          {/* Preview Pane */}
          <div className="w-1/2 border-l border-gray-800 overflow-y-auto">
            <div className="bg-gray-950 border-b border-gray-800 px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-400">Preview</h3>
            </div>
            <div className="p-6 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
