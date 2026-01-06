/**
 * AI Code Completion API
 *
 * Provides intelligent code suggestions using Claude
 */

import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.ai.complete');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');
    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const {
      prefix,
      suffix,
      filePath,
      language,
      cursorPosition,
    } = await request.json<{
      prefix: string; // Code before cursor
      suffix: string; // Code after cursor
      filePath: string; // Current file path
      language: string; // Programming language
      cursorPosition: { line: number; column: number };
    }>();

    logger.debug('Completion request:', { filePath, language, cursorPosition });

    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
    const providerSettings = JSON.parse(parseCookies(cookieHeader || '').providers || '{}');

    // Build context-aware prompt for code completion
    const prompt = buildCompletionPrompt(prefix, suffix, language, filePath);

    // Use streamText to get completion from Claude
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      env: context.cloudflare?.env,
      options: {
        toolChoice: undefined, // No tools for completion
        maxSteps: 1, // Single response
      },
      apiKeys,
      files: undefined,
      providerSettings,
      promptId: undefined,
      contextOptimization: false,
      chatMode: 'discuss',
    });

    // Collect the streamed response
    let completion = '';
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        completion += part.textDelta;
      }
    }

    // Extract code from completion (remove markdown if present)
    const cleanCompletion = extractCode(completion);

    logger.debug('Completion generated:', { length: cleanCompletion.length });

    return json({
      success: true,
      completion: cleanCompletion,
    });
  } catch (error) {
    logger.error('Completion error:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build a context-aware prompt for code completion
 */
function buildCompletionPrompt(
  prefix: string,
  suffix: string,
  language: string,
  filePath: string
): string {
  return `You are an expert ${language} code completion assistant.

File: ${filePath}
Language: ${language}

Complete the code at the cursor position. Provide ONLY the completion text, no explanations.

Code before cursor:
\`\`\`${language}
${prefix}
\`\`\`

Code after cursor:
\`\`\`${language}
${suffix}
\`\`\`

IMPORTANT:
- Provide only the text that should be inserted at the cursor
- Match the existing code style and indentation
- Keep completions concise (1-3 lines typically)
- Do NOT repeat the prefix code
- Do NOT include markdown code blocks
- Do NOT include explanations

Completion:`;
}

/**
 * Extract code from completion, removing markdown if present
 */
function extractCode(completion: string): string {
  // Remove markdown code blocks if present
  const codeBlockMatch = completion.match(/```[\w]*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Return trimmed completion
  return completion.trim();
}
