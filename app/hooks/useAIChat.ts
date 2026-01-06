/**
 * AI Chat Hook
 *
 * Manages AI assistant chat communication with streaming
 */

import { useState, useCallback, useRef } from 'react';
import { useWorkspaceStore } from '~/lib/stores/workspace.store';
import type { AIMessage } from '~/lib/stores/workspace.store';

interface UseAIChatOptions {
  onError?: (error: Error) => void;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    aiAssistant,
    addAIMessage,
    setAITyping,
  } = useWorkspaceStore();

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Create user message
      const userMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      // Add user message immediately
      addAIMessage(userMessage);
      setIsLoading(true);
      setAITyping(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Prepare messages for API (convert to format expected by /api/chat)
        const messages = [
          ...aiAssistant.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          })),
          {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
          },
        ];

        // Call the chat API with AI assistant mode
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            chatMode: 'discuss', // Use discuss mode for AI assistant
            contextOptimization: aiAssistant.contextMode !== 'none',
            files: aiAssistant.selectedFiles.length > 0 ? {} : undefined, // TODO: Pass actual file content
            maxLLMSteps: 5,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let currentMessageId = crypto.randomUUID();

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              // Text content
              const text = line.substring(2).trim();
              if (text && text !== '"' && !text.startsWith('<div') && !text.startsWith('</div')) {
                assistantContent += text.replace(/^"|"$/g, '') + ' ';
              }
            }
          }
        }

        // Create assistant message
        const assistantMessage: AIMessage = {
          id: currentMessageId,
          role: 'assistant',
          content: assistantContent.trim(),
          timestamp: Date.now(),
        };

        addAIMessage(assistantMessage);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('AI chat error:', error);
          if (options.onError) {
            options.onError(error);
          }

          // Add error message
          const errorMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            timestamp: Date.now(),
          };
          addAIMessage(errorMessage);
        }
      } finally {
        setIsLoading(false);
        setAITyping(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, aiAssistant, addAIMessage, setAITyping, options]
  );

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setAITyping(false);
    }
  }, [setAITyping]);

  return {
    messages: aiAssistant.messages,
    isLoading,
    isTyping: aiAssistant.isTyping,
    sendMessage,
    cancel,
  };
}
