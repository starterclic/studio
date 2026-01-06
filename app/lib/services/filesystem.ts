/**
 * Virtual File System
 *
 * In-memory file system for workspace with persistence
 * Supports file operations, search, and Git-like versioning
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: string;
  children?: FileNode[];
  parent?: string;
  created: number;
  modified: number;
  size?: number;
}

export interface FileSystemState {
  files: Map<string, FileNode>;
  openFiles: string[];
  activeFile: string | null;
  rootPath: string;

  // File operations
  createFile: (path: string, content?: string, language?: string) => void;
  createFolder: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  moveFile: (path: string, newPath: string) => void;

  // File navigation
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;

  // Search & query
  getFile: (path: string) => FileNode | undefined;
  getFolder: (path: string) => FileNode[];
  searchFiles: (query: string) => FileNode[];
  getFileTree: () => FileNode[];

  // Utility
  getFileLanguage: (path: string) => string;
  exists: (path: string) => boolean;
  reset: () => void;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate unique file ID
 */
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get file extension
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Determine language from file extension
 */
function detectLanguage(path: string): string {
  const ext = getExtension(path);
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
  };

  return languageMap[ext] || 'plaintext';
}

/**
 * Parse path into segments
 */
function parsePath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Get parent path
 */
function getParentPath(path: string): string {
  const segments = parsePath(path);
  segments.pop();
  return '/' + segments.join('/');
}

/**
 * Calculate file size
 */
function calculateSize(content: string): number {
  return new Blob([content]).size;
}

// ============================================================================
// Store
// ============================================================================

export const useFileSystem = create<FileSystemState>()(
  persist(
    (set, get) => ({
      files: new Map(),
      openFiles: [],
      activeFile: null,
      rootPath: '/',

      // Create file
      createFile: (path, content = '', language) => {
        const state = get();
        if (state.files.has(path)) {
          console.warn(`File already exists: ${path}`);
          return;
        }

        const segments = parsePath(path);
        const filename = segments[segments.length - 1];
        const detectedLanguage = language || detectLanguage(path);

        const file: FileNode = {
          id: generateId(),
          name: filename,
          type: 'file',
          path,
          content,
          language: detectedLanguage,
          parent: getParentPath(path),
          created: Date.now(),
          modified: Date.now(),
          size: calculateSize(content),
        };

        set((state) => {
          const newFiles = new Map(state.files);
          newFiles.set(path, file);
          return { files: newFiles };
        });
      },

      // Create folder
      createFolder: (path) => {
        const state = get();
        if (state.files.has(path)) {
          console.warn(`Folder already exists: ${path}`);
          return;
        }

        const segments = parsePath(path);
        const foldername = segments[segments.length - 1];

        const folder: FileNode = {
          id: generateId(),
          name: foldername,
          type: 'folder',
          path,
          children: [],
          parent: getParentPath(path),
          created: Date.now(),
          modified: Date.now(),
        };

        set((state) => {
          const newFiles = new Map(state.files);
          newFiles.set(path, folder);
          return { files: newFiles };
        });
      },

      // Update file content
      updateFile: (path, content) => {
        set((state) => {
          const newFiles = new Map(state.files);
          const file = newFiles.get(path);

          if (file && file.type === 'file') {
            newFiles.set(path, {
              ...file,
              content,
              modified: Date.now(),
              size: calculateSize(content),
            });
          }

          return { files: newFiles };
        });
      },

      // Delete file/folder
      deleteFile: (path) => {
        set((state) => {
          const newFiles = new Map(state.files);
          const node = newFiles.get(path);

          if (!node) return state;

          // If folder, delete all children recursively
          if (node.type === 'folder') {
            Array.from(newFiles.keys()).forEach((key) => {
              if (key.startsWith(path + '/')) {
                newFiles.delete(key);
              }
            });
          }

          newFiles.delete(path);

          // Remove from open files
          const newOpenFiles = state.openFiles.filter((f) => f !== path);
          const newActiveFile =
            state.activeFile === path
              ? newOpenFiles[0] || null
              : state.activeFile;

          return {
            files: newFiles,
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
          };
        });
      },

      // Rename file/folder
      renameFile: (oldPath, newPath) => {
        const state = get();
        const node = state.files.get(oldPath);
        if (!node) return;

        // Create new file with new path
        set((state) => {
          const newFiles = new Map(state.files);
          const oldNode = newFiles.get(oldPath);

          if (!oldNode) return state;

          const segments = parsePath(newPath);
          const newName = segments[segments.length - 1];

          newFiles.delete(oldPath);
          newFiles.set(newPath, {
            ...oldNode,
            name: newName,
            path: newPath,
            parent: getParentPath(newPath),
            modified: Date.now(),
          });

          // Update open files
          const newOpenFiles = state.openFiles.map((f) =>
            f === oldPath ? newPath : f
          );
          const newActiveFile =
            state.activeFile === oldPath ? newPath : state.activeFile;

          return {
            files: newFiles,
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
          };
        });
      },

      // Move file/folder
      moveFile: (path, newPath) => {
        get().renameFile(path, newPath);
      },

      // Open file
      openFile: (path) => {
        set((state) => {
          if (!state.files.has(path)) return state;
          if (state.openFiles.includes(path)) {
            return { activeFile: path };
          }

          return {
            openFiles: [...state.openFiles, path],
            activeFile: path,
          };
        });
      },

      // Close file
      closeFile: (path) => {
        set((state) => {
          const newOpenFiles = state.openFiles.filter((f) => f !== path);
          const newActiveFile =
            state.activeFile === path
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFile;

          return {
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
          };
        });
      },

      // Set active file
      setActiveFile: (path) => {
        set({ activeFile: path });
      },

      // Get file
      getFile: (path) => {
        return get().files.get(path);
      },

      // Get folder contents
      getFolder: (path) => {
        const state = get();
        const children: FileNode[] = [];

        state.files.forEach((node) => {
          if (node.parent === path) {
            children.push(node);
          }
        });

        return children.sort((a, b) => {
          // Folders first, then files
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      },

      // Search files
      searchFiles: (query) => {
        const state = get();
        const results: FileNode[] = [];

        state.files.forEach((node) => {
          if (
            node.name.toLowerCase().includes(query.toLowerCase()) ||
            (node.content &&
              node.content.toLowerCase().includes(query.toLowerCase()))
          ) {
            results.push(node);
          }
        });

        return results;
      },

      // Get file tree
      getFileTree: () => {
        return get().getFolder('/');
      },

      // Get file language
      getFileLanguage: (path) => {
        const file = get().files.get(path);
        return file?.language || detectLanguage(path);
      },

      // Check if file exists
      exists: (path) => {
        return get().files.has(path);
      },

      // Reset file system
      reset: () => {
        set({
          files: new Map(),
          openFiles: [],
          activeFile: null,
        });
      },
    }),
    {
      name: 'davinci-filesystem',
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          files: Array.from(state.files.entries()),
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          files: new Map(parsed.files),
        };
      },
    }
  )
);

// ============================================================================
// Default Project Template
// ============================================================================

export function initializeDefaultProject() {
  const fs = useFileSystem.getState();

  // Create folders
  fs.createFolder('/src');
  fs.createFolder('/public');

  // Create files
  fs.createFile(
    '/src/index.tsx',
    `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
    'typescript'
  );

  fs.createFile(
    '/src/App.tsx',
    `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>🎨 Da Vinci</h1>
      <p>AI-Powered Web Studio</p>
      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}`,
    'typescript'
  );

  fs.createFile(
    '/src/styles.css',
    `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.counter {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

button {
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: white;
  color: #667eea;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.1);
}

span {
  font-size: 3rem;
  font-weight: bold;
  min-width: 4rem;
  text-align: center;
}`,
    'css'
  );

  fs.createFile(
    '/package.json',
    JSON.stringify(
      {
        name: 'davinci-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/react': '^18.3.0',
          '@types/react-dom': '^18.3.0',
          typescript: '^5.6.0',
          vite: '^5.4.0',
        },
      },
      null,
      2
    ),
    'json'
  );

  fs.createFile(
    '/README.md',
    `# Da Vinci Project

Created with 🎨 Da Vinci AI-Powered Web Studio

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- ⚡ Vite for fast development
- ⚛️ React 18 with TypeScript
- 🎨 Modern CSS styling

Built with love using Da Vinci 💙
`,
    'markdown'
  );

  // Open default file
  fs.openFile('/src/App.tsx');
}
