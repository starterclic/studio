/**
 * Da Vinci Authentication - OAuth2 Callback Route
 *
 * Handles the OAuth2 callback from Authentik
 * Exchanges authorization code for tokens and creates user session
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import {
  exchangeCodeForTokens,
  getUserProfile,
  syncUserToDatabase,
  createUserSession,
  sessionStorage,
} from '~/lib/services/auth.server';

/**
 * GET /api/auth/callback
 *
 * OAuth2 callback endpoint
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Handle OAuth2 errors
  if (error) {
    console.error('[Auth Callback] OAuth2 error:', error, errorDescription);
    return redirect(
      `/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('[Auth Callback] Missing code or state parameter');
    return redirect('/login?error=invalid_request');
  }

  try {
    // Retrieve session with PKCE parameters
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));
    const storedState = session.get('oauth_state');
    const codeVerifier = session.get('oauth_code_verifier');
    const redirectTo = session.get('oauth_redirect_to') || '/';

    // Validate state (CSRF protection)
    if (state !== storedState) {
      console.error('[Auth Callback] State mismatch - possible CSRF attack');
      return redirect('/login?error=invalid_state');
    }

    if (!codeVerifier) {
      console.error('[Auth Callback] Code verifier not found in session');
      return redirect('/login?error=invalid_session');
    }

    console.log('[Auth Callback] Exchanging authorization code for tokens...');

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    console.log('[Auth Callback] Tokens received, fetching user profile...');

    // Fetch user profile from Authentik
    const profile = await getUserProfile(tokens.access_token);

    console.log('[Auth Callback] Profile received:', {
      email: profile.email,
      name: profile.name,
    });

    // Sync user to database
    const user = await syncUserToDatabase(profile);

    console.log('[Auth Callback] User synced to database:', user.id);

    // Clear OAuth session data
    session.unset('oauth_state');
    session.unset('oauth_code_verifier');
    session.unset('oauth_redirect_to');

    // Create user session and redirect
    return await createUserSession(user.id, tokens, redirectTo);
  } catch (error: any) {
    console.error('[Auth Callback] Authentication failed:', error);
    return redirect(
      `/login?error=authentication_failed&error_description=${encodeURIComponent(error.message)}`
    );
  }
}
