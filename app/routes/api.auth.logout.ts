/**
 * Da Vinci Authentication - Logout Route
 *
 * Destroys user session and redirects to Authentik logout
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import {
  destroyUserSession,
  getUserSession,
  getLogoutUrl,
  isAuthConfigured,
} from '~/lib/services/auth.server';

/**
 * GET /api/auth/logout
 *
 * Logs out the user and destroys the session
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if authentication is configured
  if (!isAuthConfigured()) {
    return redirect('/');
  }

  try {
    // Get ID token for Authentik logout
    const session = await getUserSession(request);
    const idToken = session.get('idToken');

    // Get Authentik logout URL
    const logoutUrl = await getLogoutUrl(idToken);

    // Destroy local session
    await destroyUserSession(request, '/');

    // Redirect to Authentik logout
    return redirect(logoutUrl);
  } catch (error) {
    console.error('[Auth Logout] Error during logout:', error);
    // Even if Authentik logout fails, destroy local session
    return await destroyUserSession(request, '/');
  }
}

/**
 * POST /api/auth/logout
 *
 * Alternative logout endpoint for POST requests (e.g., from forms)
 */
export async function action({ request }: LoaderFunctionArgs) {
  return loader({ request, params: {}, context: {} });
}
