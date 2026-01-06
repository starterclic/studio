/**
 * Da Vinci Authentication - Login Route
 *
 * Initiates OAuth2 authorization flow with Authentik
 * Generates PKCE parameters and redirects to Authentik login
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import {
  getAuthorizationUrl,
  generateCodeVerifier,
  sessionStorage,
  isAuthConfigured,
} from '~/lib/services/auth.server';
import crypto from 'crypto';

/**
 * GET /api/auth/login
 *
 * Starts the OAuth2 login flow
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if authentication is configured
  if (!isAuthConfigured()) {
    return new Response(
      JSON.stringify({
        error: 'Authentication not configured',
        message: 'Please configure Authentik environment variables',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  // Generate PKCE parameters
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();

  // Store PKCE parameters in session for callback
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  session.set('oauth_state', state);
  session.set('oauth_code_verifier', codeVerifier);
  session.set('oauth_redirect_to', redirectTo);

  // Get authorization URL
  const authUrl = await getAuthorizationUrl(state, codeVerifier);

  // Redirect to Authentik login
  return redirect(authUrl, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}
