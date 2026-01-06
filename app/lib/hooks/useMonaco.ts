/**
 * Monaco Editor Hook
 *
 * Custom hook for Monaco Editor integration with lazy loading
 * Provides TypeScript support, themes, and advanced features
 */

import { useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';

export interface MonacoEditorOptions {
  value?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light';
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  wordWrap?: 'on' | 'off';
  automaticLayout?: boolean;
  onChange?: (value: string) => void;
}

/**
 * Monaco Editor Hook with lazy loading
 */
export function useMonaco(options: MonacoEditorOptions = {}) {
  const [monaco, setMonaco] = useState<typeof Monaco | null>(null);
  const [editor, setEditor] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Monaco Editor
  useEffect(() => {
    let mounted = true;

    const loadMonaco = async () => {
      try {
        // Dynamic import for code splitting
        const monacoEditor = await import('monaco-editor');

        if (mounted) {
          setMonaco(monacoEditor);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load Monaco Editor:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadMonaco();

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!monaco || !containerRef.current || editor) return;

    try {
      const newEditor = monaco.editor.create(containerRef.current, {
        value: options.value || '',
        language: options.language || 'typescript',
        theme: options.theme || 'vs-dark',
        readOnly: options.readOnly || false,
        minimap: {
          enabled: options.minimap !== false,
        },
        fontSize: options.fontSize || 14,
        wordWrap: options.wordWrap || 'on',
        automaticLayout: options.automaticLayout !== false,
        // Advanced features
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        parameterHints: {
          enabled: true,
        },
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: 'full',
        folding: true,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        tabSize: 2,
        insertSpaces: true,
      });

      // Setup change listener
      if (options.onChange) {
        newEditor.onDidChangeModelContent(() => {
          options.onChange?.(newEditor.getValue());
        });
      }

      setEditor(newEditor);
    } catch (err) {
      console.error('Failed to initialize Monaco Editor:', err);
      setError(err as Error);
    }

    return () => {
      editor?.dispose();
    };
  }, [monaco, options.value, options.language, options.theme]);

  // Update editor value
  useEffect(() => {
    if (editor && options.value !== undefined) {
      const currentValue = editor.getValue();
      if (currentValue !== options.value) {
        editor.setValue(options.value);
      }
    }
  }, [editor, options.value]);

  // Update editor options
  useEffect(() => {
    if (!editor) return;

    editor.updateOptions({
      theme: options.theme,
      readOnly: options.readOnly,
      fontSize: options.fontSize,
      wordWrap: options.wordWrap,
    });
  }, [editor, options.theme, options.readOnly, options.fontSize, options.wordWrap]);

  return {
    containerRef,
    monaco,
    editor,
    isLoading,
    error,
  };
}

/**
 * Configure Monaco Editor TypeScript defaults
 */
export function configureMonacoTypeScript(monaco: typeof Monaco) {
  // TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // Diagnostics options
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // Add React types
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    declare module 'react' {
      export function useState<T>(initialState: T): [T, (value: T) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
      export function useRef<T>(initialValue: T): { current: T };
      // Add more React types as needed
    }
    `,
    'file:///node_modules/@types/react/index.d.ts'
  );
}

/**
 * Custom Monaco themes
 */
export const monacoThemes = {
  daVinciDark: {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2a2a',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#ffffff',
      'editorWhitespace.foreground': '#404040',
    },
  },
  daVinciLight: {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#add6ff',
    },
  },
};
