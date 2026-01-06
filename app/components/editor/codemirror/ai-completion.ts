/**
 * AI Code Completion Extension for CodeMirror
 *
 * Provides inline AI-powered code suggestions
 */

import {
  StateEffect,
  StateField,
  Annotation,
  Facet,
  type Extension,
} from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  type DecorationSet,
  type ViewUpdate,
  type PluginValue,
} from '@codemirror/view';

/**
 * Configuration for AI completion
 */
export interface AICompletionConfig {
  enabled: boolean;
  filePath?: string;
  language?: string;
  debounceMs?: number;
}

// Facet to store AI completion config
const aiCompletionConfig = Facet.define<AICompletionConfig, AICompletionConfig>({
  combine(configs) {
    return configs[0] || { enabled: false };
  },
});

// State effect to set AI completion suggestion
const setAISuggestion = StateEffect.define<string | null>();

// State field to store current AI suggestion
const aiSuggestionField = StateField.define<string | null>({
  create() {
    return null;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setAISuggestion)) {
        return effect.value;
      }
    }

    // Clear suggestion if document changed (user typed something)
    if (transaction.docChanged && !transaction.annotation(acceptingSuggestion)) {
      return null;
    }

    return value;
  },
});

// Annotation to mark transactions that accept suggestions
const acceptingSuggestion = Annotation.define<boolean>();

/**
 * Fetch AI completion from API
 */
async function fetchAICompletion(params: {
  prefix: string;
  suffix: string;
  filePath: string;
  language: string;
  cursorPosition: { line: number; column: number };
}): Promise<string | null> {
  try {
    const response = await fetch('/api/ai/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('AI completion API error:', response.statusText);
      return null;
    }

    const data = await response.json() as { success: boolean; completion?: string };
    return data.success && data.completion ? data.completion : null;
  } catch (error) {
    console.error('AI completion fetch error:', error);
    return null;
  }
}

/**
 * Debounce helper
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * View plugin to handle AI completion logic
 */
class AICompletionPlugin implements PluginValue {
  private requestCompletion: () => void;
  private abortController: AbortController | null = null;
  private config: AICompletionConfig;

  constructor(view: EditorView) {
    // Get config from view state (will be set via facet)
    this.config = view.state.facet(aiCompletionConfig);
    this.requestCompletion = debounce(() => {
      this.fetchCompletion(view);
    }, this.config.debounceMs || 500);
  }

  update(update: ViewUpdate) {
    // Skip if AI completion is disabled
    if (!this.config.enabled) {
      return;
    }

    // Skip if document didn't change
    if (!update.docChanged) {
      return;
    }

    // Skip if we're accepting a suggestion
    if (update.transactions.some(tr => tr.annotation(acceptingSuggestion))) {
      return;
    }

    // Request new completion
    this.requestCompletion();
  }

  private async fetchCompletion(view: EditorView) {
    const state = view.state;
    const cursor = state.selection.main.head;

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    // Get code before and after cursor
    const doc = state.doc;
    const prefix = doc.sliceString(0, cursor);
    const suffix = doc.sliceString(cursor);

    // Get cursor position (line and column)
    const line = doc.lineAt(cursor);
    const cursorPosition = {
      line: line.number - 1,
      column: cursor - line.from,
    };

    // Get file info from config or defaults
    const filePath = this.config.filePath || 'untitled.ts';
    const language = this.config.language || 'typescript';

    // Fetch completion
    const completion = await fetchAICompletion({
      prefix,
      suffix,
      filePath,
      language,
      cursorPosition,
    });

    // Update state with completion
    view.dispatch({
      effects: setAISuggestion.of(completion),
    });
  }

  destroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

/**
 * Decoration to show ghost text for AI suggestion
 */
function aiSuggestionDecorations(state: any): DecorationSet {
  const suggestion = state.field(aiSuggestionField, false);

  if (!suggestion) {
    return Decoration.none;
  }

  const cursor = state.selection.main.head;

  // Create ghost text decoration
  const decoration = Decoration.widget({
    widget: new GhostTextWidget(suggestion),
    side: 1,
  });

  return Decoration.set([decoration.range(cursor)]);
}

/**
 * Widget to render ghost text
 */
class GhostTextWidget extends WidgetType {
  constructor(private suggestion: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-ai-suggestion';
    span.textContent = this.suggestion;
    span.style.opacity = '0.5';
    span.style.color = '#888';
    span.style.fontStyle = 'italic';
    return span;
  }
}

/**
 * Accept AI suggestion command
 */
function acceptAISuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(aiSuggestionField, false);

  if (!suggestion) {
    return false;
  }

  const cursor = view.state.selection.main.head;

  view.dispatch({
    changes: { from: cursor, insert: suggestion },
    effects: setAISuggestion.of(null),
    annotations: acceptingSuggestion.of(true),
  });

  return true;
}

/**
 * Reject AI suggestion command
 */
function rejectAISuggestion(view: EditorView): boolean {
  const suggestion = view.state.field(aiSuggestionField, false);

  if (!suggestion) {
    return false;
  }

  view.dispatch({
    effects: setAISuggestion.of(null),
  });

  return true;
}

/**
 * Create AI completion extension
 */
export function aiCompletion(config: AICompletionConfig): Extension {
  return [
    aiCompletionConfig.of(config),
    aiSuggestionField,
    ViewPlugin.fromClass(AICompletionPlugin),
    EditorView.decorations.compute([aiSuggestionField], (state) => {
      return aiSuggestionDecorations(state);
    }),
    keymap.of([
      {
        key: 'Ctrl-Space',
        run: acceptAISuggestion,
      },
      {
        key: 'Escape',
        run: rejectAISuggestion,
      },
    ]),
    // CSS for ghost text
    EditorView.baseTheme({
      '.cm-ai-suggestion': {
        opacity: '0.5',
        color: '#888',
        fontStyle: 'italic',
      },
    }),
  ];
}
