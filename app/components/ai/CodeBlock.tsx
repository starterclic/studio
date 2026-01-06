/**
 * AI Code Block Component
 *
 * Renders code blocks with syntax highlighting and actions
 */

import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';

// Register languages
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
  onApply?: (code: string) => void;
}

export function CodeBlock({ language, code, filename, onApply }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(code);
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="i-ph:code text-gray-400" />
          <span className="text-sm text-gray-300">
            {filename || language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onApply && (
            <button
              onClick={handleApply}
              className="px-3 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
            >
              <div className="i-ph:check-circle" />
              Apply
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <div className="i-ph:check text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <div className="i-ph:copy" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          showLineNumbers={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
