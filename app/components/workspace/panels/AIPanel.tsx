/**
 * AI Assistant Panel
 *
 * Interactive AI chat panel powered by Claude
 */

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import { useAIChat } from '~/hooks/useAIChat';
import { ChatMessage } from '~/components/ai/ChatMessage';
import { toast } from 'react-toastify';

export function AIPanel() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    aiAssistant,
    setAIContextMode,
    setAIModel,
    clearAIMessages,
  } = useWorkspaceStore();

  const { messages, isLoading, isTyping, sendMessage, cancel } = useAIChat({
    onError: (error) => {
      toast.error(`AI Error: ${error.message}`);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleApplyCode = (code: string, filename?: string) => {
    // TODO: Implement code application to active file
    toast.success(`Code ${filename ? `for ${filename}` : ''} ready to apply`);
    console.log('Apply code:', { code, filename });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <p className="text-xs text-gray-400">Powered by Claude Sonnet 4</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Context Mode Selector */}
          <select
            value={aiAssistant.contextMode}
            onChange={(e) => setAIContextMode(e.target.value as any)}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Context Mode"
          >
            <option value="none">No Context</option>
            <option value="selected">Selected Files</option>
            <option value="full">Full Project</option>
          </select>

          {/* Clear Chat */}
          <button
            onClick={clearAIMessages}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Clear chat history"
          >
            <div className="i-ph:trash text-lg" />
          </button>

          {/* Settings */}
          <button
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <div className="i-ph:gear text-lg" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              AI Assistant Ready
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Ask me anything about your code, request features, debug issues, or get help with your project.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              <button
                onClick={() => {
                  setInputValue('Help me understand this codebase structure');
                  inputRef.current?.focus();
                }}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors border border-gray-700"
              >
                <div className="text-blue-400 mb-1">📁 Explore</div>
                <div className="text-sm text-gray-300">Understand codebase structure</div>
              </button>

              <button
                onClick={() => {
                  setInputValue('Generate a React component for user profile');
                  inputRef.current?.focus();
                }}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors border border-gray-700"
              >
                <div className="text-green-400 mb-1">✨ Generate</div>
                <div className="text-sm text-gray-300">Create new components</div>
              </button>

              <button
                onClick={() => {
                  setInputValue('Help me fix bugs in my code');
                  inputRef.current?.focus();
                }}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors border border-gray-700"
              >
                <div className="text-red-400 mb-1">🐛 Debug</div>
                <div className="text-sm text-gray-300">Find and fix issues</div>
              </button>

              <button
                onClick={() => {
                  setInputValue('Refactor this code to improve performance');
                  inputRef.current?.focus();
                }}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors border border-gray-700"
              >
                <div className="text-purple-400 mb-1">🔄 Refactor</div>
                <div className="text-sm text-gray-300">Optimize and improve</div>
              </button>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="divide-y divide-gray-800">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onApplyCode={handleApplyCode}
              />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 p-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-gray-800/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '200px',
                height: 'auto',
              }}
              disabled={isLoading}
            />

            {/* Character Count */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {inputValue.length}
            </div>
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={cancel}
              className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2"
            >
              <div className="i-ph:stop-circle text-xl" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <div className="i-ph:paper-plane-tilt text-xl" />
              Send
            </button>
          )}
        </form>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-2">
          <div className="text-xs text-gray-500">Quick actions:</div>
          <div className="flex gap-1">
            <button
              onClick={() => setInputValue('Explain this code: ')}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              💡 Explain
            </button>
            <button
              onClick={() => setInputValue('Optimize this code: ')}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              ⚡ Optimize
            </button>
            <button
              onClick={() => setInputValue('Add tests for: ')}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              🧪 Test
            </button>
            <button
              onClick={() => setInputValue('Document this code: ')}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              📝 Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
