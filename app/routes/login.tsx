/**
 * Da Vinci Login Page
 *
 * OAuth2 login page with Authentik integration
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useSearchParams, Link } from '@remix-run/react';
import { getAuthenticatedUser, isAuthConfigured } from '~/lib/services/auth.server';
import { useEffect } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Login - Da Vinci' },
    { name: 'description', content: 'Sign in to Da Vinci with your Authentik account' },
  ];
};

// Loader: Check if user is already authenticated
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getAuthenticatedUser(request);
  const authConfigured = isAuthConfigured();

  return json({
    isAuthenticated: !!user,
    authConfigured,
    user: user
      ? {
          name: user.name,
          email: user.email,
        }
      : null,
  });
}

export default function LoginPage() {
  const { isAuthenticated, authConfigured, user } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !error) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, redirectTo, error]);

  // Error messages mapping
  const getErrorMessage = (errorCode: string | null, description: string | null) => {
    if (!errorCode) return null;

    const errorMessages: Record<string, string> = {
      access_denied: 'Access was denied. Please try again.',
      invalid_request: 'Invalid authentication request.',
      invalid_state: 'Invalid session state. Please try again.',
      invalid_session: 'Your session has expired. Please try again.',
      authentication_failed: description || 'Authentication failed. Please try again.',
    };

    return errorMessages[errorCode] || description || 'An unknown error occurred.';
  };

  const errorMessage = getErrorMessage(error, errorDescription);

  // If already authenticated, show loading state
  if (isAuthenticated && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1488fc] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md w-full mx-4">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#1488fc] text-white p-4 rounded-2xl mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 Da Vinci
          </h1>
          <p className="text-gray-600">
            AI-Powered Web Studio
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    Authentication Error
                  </p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Status */}
          {!authConfigured ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    Configuration Required
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Authentik authentication is not configured. Please contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Login Button */}
              <a
                href={`/api/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#1488fc] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign in with Authentik
              </a>

              {/* Info Text */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>You will be redirected to</p>
                <p className="font-mono text-xs text-gray-500 mt-1">
                  auth.cybtek.fr
                </p>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Secured with OAuth2 / OpenID Connect
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-xs text-gray-600">Fast Deploy</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs text-gray-600">Secure SSO</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🎨</div>
            <p className="text-xs text-gray-600">AI-Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
