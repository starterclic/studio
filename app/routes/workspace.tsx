/**
 * Da Vinci Workspace Route
 *
 * Main workspace page with all panels
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { protectRoute } from '~/lib/middleware/auth.middleware';
import { WorkspaceLayout } from '~/components/workspace/WorkspaceLayout';

export const meta: MetaFunction = () => {
  return [
    { title: 'Workspace - Da Vinci' },
    { name: 'description', content: 'Da Vinci AI-powered workspace' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Require authentication
  const user = await protectRoute(request);

  return json({ user });
}

export default function WorkspacePage() {
  return <WorkspaceLayout />;
}
