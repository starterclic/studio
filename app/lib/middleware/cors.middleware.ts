/**
 * CORS & Cross-Origin Isolation Middleware
 *
 * Adds required headers for WebContainer support:
 * - Cross-Origin-Embedder-Policy: require-corp
 * - Cross-Origin-Opener-Policy: same-origin
 *
 * These headers enable SharedArrayBuffer which is required for WebContainer
 */

/**
 * Add cross-origin isolation headers to response
 * Required for WebContainer to work
 */
export function addCrossOriginHeaders(headers: Headers): Headers {
  // Enable SharedArrayBuffer for WebContainer
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Additional security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-XSS-Protection', '1; mode=block');

  // Cache control
  headers.set('Cache-Control', 'public, max-age=3600');

  return headers;
}

/**
 * Get headers object for cross-origin isolation
 */
export function getCrossOriginHeaders(): Record<string, string> {
  return {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
  };
}
