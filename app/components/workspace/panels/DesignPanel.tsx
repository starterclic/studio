/**
 * Design Panel
 *
 * Visual page builder with drag-and-drop components
 * Live preview and style editing
 */

import { useState } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';

interface Component {
  id: string;
  type: 'container' | 'text' | 'image' | 'button';
  label: string;
  icon: string;
}

export function DesignPanel() {
  const { designEditor, setSelectedElement, setDesignZoom, toggleGrid } = useWorkspaceStore();
  const [components] = useState<Component[]>([
    { id: '1', type: 'container', label: 'Container', icon: '📦' },
    { id: '2', type: 'text', label: 'Text', icon: '📝' },
    { id: '3', type: 'image', label: 'Image', icon: '🖼️' },
    { id: '4', type: 'button', label: 'Button', icon: '🔘' },
  ]);

  // Sample page elements
  const [pageElements] = useState([
    { id: 'header', type: 'container', label: 'Header', children: ['logo', 'nav'] },
    { id: 'logo', type: 'image', label: 'Logo' },
    { id: 'nav', type: 'container', label: 'Navigation' },
    { id: 'hero', type: 'container', label: 'Hero Section' },
  ]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Panel Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎨</span>
          <div>
            <h2 className="text-sm font-semibold">Design Editor</h2>
            <p className="text-xs text-gray-400">Visual Page Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Control */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <button
              onClick={() => setDesignZoom(Math.max(25, designEditor.zoom - 10))}
              className="text-gray-400 hover:text-white"
            >
              ➖
            </button>
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {designEditor.zoom}%
            </span>
            <button
              onClick={() => setDesignZoom(Math.min(200, designEditor.zoom + 10))}
              className="text-gray-400 hover:text-white"
            >
              ➕
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={toggleGrid}
            className={`
              px-3 py-1.5 rounded-lg text-sm transition-colors
              ${
                designEditor.gridVisible
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }
            `}
          >
            🔲 Grid
          </button>

          {/* Preview Mode */}
          <button className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm">
            👁️ Preview
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Components Library */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Components</h3>

            <div className="space-y-2">
              {components.map((component) => (
                <button
                  key={component.id}
                  draggable
                  className="w-full text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center gap-3 cursor-move"
                >
                  <span className="text-xl">{component.icon}</span>
                  <span>{component.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Layers</h3>
              <div className="space-y-1">
                {pageElements.map((element) => (
                  <button
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={`
                      w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                      ${
                        designEditor.selectedElement === element.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <span>
                      {element.type === 'container' ? '📦' : element.type === 'image' ? '🖼️' : '📝'}
                    </span>
                    <span>{element.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-800">
          <div
            className="flex-1 overflow-auto p-8"
            style={{
              backgroundImage: designEditor.gridVisible
                ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
                : 'none',
              backgroundSize: '20px 20px',
            }}
          >
            <div
              className="mx-auto bg-white shadow-2xl"
              style={{
                width: `${(1200 * designEditor.zoom) / 100}px`,
                minHeight: `${(800 * designEditor.zoom) / 100}px`,
              }}
            >
              {/* Canvas Content - Simulated webpage */}
              <div className="p-8 text-gray-900">
                <div className="border-2 border-dashed border-blue-400 p-4 rounded-lg">
                  <h1 className="text-3xl font-bold mb-2">Your Page Title</h1>
                  <p className="text-gray-600">
                    Drop components here to start building your page
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="bg-gray-950 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
            <div>Canvas: 1200 × 800px</div>
            <div className="flex gap-4">
              <button className="hover:text-white">Desktop</button>
              <button className="hover:text-white">Tablet</button>
              <button className="hover:text-white">Mobile</button>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-950 border-l border-gray-800 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-4">Properties</h3>

            {designEditor.selectedElement ? (
              <div className="space-y-4">
                {/* Size */}
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-2 block">Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Width"
                        className="w-full px-3 py-2 bg-gray-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Height"
                        className="w-full px-3 py-2 bg-gray-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-2 block">Position</label>
                  <select className="w-full px-3 py-2 bg-gray-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Static</option>
                    <option>Relative</option>
                    <option>Absolute</option>
                    <option>Fixed</option>
                  </select>
                </div>

                {/* Spacing */}
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-2 block">Spacing</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Top"
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Right"
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Bottom"
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Left"
                        className="w-full px-2 py-1 bg-gray-800 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-2 block">Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 bg-gray-800 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm">Select an element to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
