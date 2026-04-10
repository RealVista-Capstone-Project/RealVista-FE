'use client';

import * as React from 'react';
import { TopNavContainer } from '@/shared/ui/top-nav';
import { cn } from '@/shared/lib/utils';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
import { AiChatRenderer } from '@/widgets/ai-chat-assistant';
import { HomeFooter } from '@/features/home';

const FooterContext = React.createContext<(hide: boolean) => void>(() => {});

export function useHideFooter(hide: boolean) {
  const setHide = React.useContext(FooterContext);
  React.useEffect(() => {
    setHide(hide);
    return () => setHide(false);
  }, [hide, setHide]);
}

export interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  const [hideFooter, setHideFooter] = React.useState(false);

  return (
    <FooterContext.Provider value={setHideFooter}>
      <div className={cn('flex min-h-screen flex-col', className)}>
        <TopNavContainer variant='public' />
        <main className='flex-1'>{children}</main>
        <ChatWindowRenderer />
        <AiChatRenderer />
        {!hideFooter && <HomeFooter />}
      </div>
    </FooterContext.Provider>
  );
}
