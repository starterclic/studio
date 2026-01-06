/**
 * AI Chat Message Component
 *
 * Displays a single message in the AI chat
 */

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import type { AIMessage } from '~/lib/stores/workspace.store';

interface ChatMessageProps {
  message: AIMessage;
  onApplyCode?: (code: string, filename?: string) => void;
}

export function ChatMessage({ message, onApplyCode }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString();

  // Parse code blocks from content
  const { text, codeBlocks } = useMemo(() => {
    const blocks: { language: string; code: string; filename?: string }[] = [];
    let content = message.content;

    // Extract code blocks (```language\ncode\n```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const textParts: string[] = [];

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        textParts.push(message.content.substring(lastIndex, match.index));
      }

      const language = match[1] || 'text';
      const code = match[2].trim();

      blocks.push({ language, code });
      textParts.push(`\n[Code Block: ${language}]\n`);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.content.length) {
      textParts.push(message.content.substring(lastIndex));
    }

    return {
      text: textParts.join(''),
      codeBlocks: blocks,
    };
  }, [message.content]);

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-gray-800/50' : 'bg-transparent'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
        isUser ? 'bg-blue-600' : 'bg-purple-600'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm">
            {isUser ? 'You' : 'Claude'}
          </span>
          <span className="text-xs text-gray-500">
            {timestamp}
          </span>
        </div>

        {/* Message Text */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              // Custom rendering for paragraphs
              p: ({ children }) => (
                <p className="text-gray-300 mb-2 leading-relaxed">{children}</p>
              ),
              // Custom rendering for lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1">{children}</ol>
              ),
              // Custom rendering for code (inline)
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-gray-800 text-blue-400 text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>

        {/* Code Blocks */}
        {codeBlocks.length > 0 && (
          <div className="space-y-2">
            {codeBlocks.map((block, index) => (
              <CodeBlock
                key={index}
                language={block.language}
                code={block.code}
                filename={block.filename}
                onApply={onApplyCode ? (code) => onApplyCode(code, block.filename) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
