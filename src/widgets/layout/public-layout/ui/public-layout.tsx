'use client';

import * as React from 'react';
import { TopNav, type NavItem } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
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
  navItems?: NavItem[];
  logoHref?: string;
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  className?: string;
}

export function PublicLayout({ children, navItems, logoHref, user, className }: PublicLayoutProps) {
  const [hideFooter, setHideFooter] = React.useState(false);

  return (
    <FooterContext.Provider value={setHideFooter}>
      <div className={cn('flex min-h-screen flex-col', className)}>
        <TopNav navItems={navItems} logoHref={logoHref} user={user} />
        <main className='flex-1'>{children}</main>
        <ChatWindowRenderer />
        {!hideFooter && <HomeFooter />}
      </div>
    </FooterContext.Provider>
  );
}
