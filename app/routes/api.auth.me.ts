/**
 * Da Vinci Authentication - Current User Route
 *
 * Returns the currently authenticated user's profile
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getAuthenticatedUser } from '~/lib/services/auth.server';

/**
 * GET /api/auth/me
 *
 * Get current authenticated user
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return json({ authenticated: false, user: null }, { status: 401 });
  }

  return json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      roles: user.roles,
      organizationId: user.organizationId,
    },
  });
}
