import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'Da Vinci - AI-Powered Web Studio' },
    { name: 'description', content: 'Create, edit and deploy websites with Claude AI - The white-label web development platform' }
  ];
};

export const loader = () => json({});

/**
 * Landing page component for Da Vinci
 * AI-powered web development studio with Claude integration.
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
