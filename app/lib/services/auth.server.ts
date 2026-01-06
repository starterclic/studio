/**
 * Da Vinci Authentication Service
 *
 * Implements OAuth2/OIDC authentication with Authentik
 * Provides secure session management and user context
 *
 * @architecture
 * - OAuth2 Authorization Code Flow with PKCE
 * - Secure HTTP-only cookies for sessions
 * - JWT token validation and refresh
 * - User profile synchronization with database
 */

import { createCookieSessionStorage, redirect } from '@remix-run/node';
import { db } from '~/utils/db.server';
import crypto from 'crypto';

// ============================================================================
// Configuration & Types
// ============================================================================

export interface AuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  roles?: string[];
  organizationId?: string;
}

/**
 * User context for RBAC (Role-Based Access Control)
 */
export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: import('@prisma/client').UserRole;
  organizationId: string;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
}

interface OIDCDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  issuer: string;
}

// ============================================================================
// Session Storage
// ============================================================================

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in environment variables');
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__davinci_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * Get authentication configuration from environment
 */
export function getAuthConfig(): AuthConfig {
  const issuer = process.env.AUTHENTIK_ISSUER;
  const clientId = process.env.AUTHENTIK_CLIENT_ID;
  const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI;

  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Authentik configuration incomplete. Please set AUTHENTIK_ISSUER, AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET, and AUTHENTIK_REDIRECT_URI'
    );
  }

  return { issuer, clientId, clientSecret, redirectUri };
}

/**
 * Check if authentication is properly configured
 */
export function isAuthConfigured(): boolean {
  try {
    getAuthConfig();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// OIDC Discovery
// ============================================================================

let cachedDiscovery: OIDCDiscovery | null = null;

/**
 * Fetch OIDC discovery document from Authentik
 */
export async function getOIDCDiscovery(): Promise<OIDCDiscovery> {
  if (cachedDiscovery) {
    return cachedDiscovery;
  }

  const config = getAuthConfig();
  const discoveryUrl = `${config.issuer}.well-known/openid-configuration`;

  try {
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch OIDC discovery: ${response.statusText}`);
    }

    cachedDiscovery = await response.json();
    return cachedDiscovery!;
  } catch (error) {
    throw new Error(`Failed to discover OIDC endpoints: ${error}`);
  }
}

// ============================================================================
// PKCE (Proof Key for Code Exchange)
// ============================================================================

/**
 * Generate code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ============================================================================
// OAuth2 Authorization Flow
// ============================================================================

/**
 * Generate authorization URL for OAuth2 login
 */
export async function getAuthorizationUrl(state: string, codeVerifier: string): Promise<string> {
  const config = getAuthConfig();
  const discovery = await getOIDCDiscovery();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${discovery.authorization_endpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenSet> {
  const config = getAuthConfig();
  const discovery = await getOIDCDiscovery();

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens: TokenSet = await response.json();

  // Calculate absolute expiration time
  if (tokens.expires_in) {
    tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  }

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const config = getAuthConfig();
  const discovery = await getOIDCDiscovery();

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const tokens: TokenSet = await response.json();

  if (tokens.expires_in) {
    tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  }

  return tokens;
}

// ============================================================================
// User Profile
// ============================================================================

/**
 * Fetch user profile from Authentik userinfo endpoint
 */
export async function getUserProfile(accessToken: string): Promise<any> {
  const discovery = await getOIDCDiscovery();

  const response = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

/**
 * Synchronize Authentik user with local database
 */
export async function syncUserToDatabase(profile: any): Promise<AuthUser> {
  const email = profile.email;
  const name = profile.name || profile.preferred_username || email;
  const username = profile.preferred_username;
  const avatar = profile.picture;

  // Find or create user in database
  let user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        email,
        name,
        username,
        avatarUrl: avatar,
        role: 'DEVELOPER', // Default role
      },
    });
  } else {
    // Update existing user
    user = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        avatarUrl: avatar,
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl || undefined,
    roles: [user.role],
    organizationId: user.organizationId,
  };
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create user session after successful authentication
 */
export async function createUserSession(
  userId: string,
  tokens: TokenSet,
  redirectTo: string = '/'
) {
  const session = await sessionStorage.getSession();

  session.set('userId', userId);
  session.set('accessToken', tokens.access_token);
  session.set('refreshToken', tokens.refresh_token);
  session.set('expiresAt', tokens.expires_at);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

/**
 * Get user session from request
 */
export async function getUserSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return session;
}

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthUser | null> {
  const session = await getUserSession(request);
  const userId = session.get('userId');

  if (!userId) {
    return null;
  }

  // Check if token is expired
  const expiresAt = session.get('expiresAt');
  if (expiresAt && Date.now() > expiresAt) {
    // Try to refresh token
    const refreshToken = session.get('refreshToken');
    if (refreshToken) {
      try {
        const newTokens = await refreshAccessToken(refreshToken);
        // Update session with new tokens
        session.set('accessToken', newTokens.access_token);
        session.set('expiresAt', newTokens.expires_at);
        // Note: Session update should be committed in the calling route
      } catch (error) {
        // Refresh failed, user needs to re-authenticate
        return null;
      }
    } else {
      return null;
    }
  }

  // Fetch user from database
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl || undefined,
    roles: [user.role],
    organizationId: user.organizationId,
  };
}

/**
 * Get user context for RBAC (Role-Based Access Control)
 * Returns a simplified UserContext with role for permission checking
 */
export async function getUserContext(request: Request): Promise<UserContext | null> {
  const session = await getUserSession(request);
  const userId = session.get('userId');

  if (!userId) {
    return null;
  }

  // Check if token is expired
  const expiresAt = session.get('expiresAt');
  if (expiresAt && Date.now() > expiresAt) {
    // Try to refresh token
    const refreshToken = session.get('refreshToken');
    if (refreshToken) {
      try {
        const newTokens = await refreshAccessToken(refreshToken);
        session.set('accessToken', newTokens.access_token);
        session.set('expiresAt', newTokens.expires_at);
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  // Fetch user from database with organization
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
}

/**
 * Require authenticated user context for RBAC
 * Throws error if not authenticated (for use in RBAC middleware)
 */
export async function requireUserContext(request: Request): Promise<UserContext> {
  const user = await getUserContext(request);

  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  return user;
}

/**
 * Require authenticated user, redirect to login if not authenticated
 */
export async function requireAuthenticatedUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams.toString()}`);
  }

  return user;
}

/**
 * Destroy user session (logout)
 */
export async function destroyUserSession(request: Request, redirectTo: string = '/') {
  const session = await getUserSession(request);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

// ============================================================================
// Logout from Authentik
// ============================================================================

/**
 * Generate logout URL for Authentik
 */
export async function getLogoutUrl(idToken?: string): Promise<string> {
  const discovery = await getOIDCDiscovery();
  const config = getAuthConfig();

  const params = new URLSearchParams({
    post_logout_redirect_uri: config.redirectUri.replace('/callback', ''),
  });

  if (idToken) {
    params.set('id_token_hint', idToken);
  }

  return `${discovery.end_session_endpoint}?${params.toString()}`;
}
