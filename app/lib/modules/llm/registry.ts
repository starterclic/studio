/**
 * Da Vinci LLM Provider Registry
 *
 * This application only supports Claude (Anthropic) as the AI provider.
 * All other providers have been removed to simplify the configuration.
 */
import AnthropicProvider from './providers/anthropic';

// Da Vinci: Only Anthropic/Claude is supported
export {
  AnthropicProvider,
};
