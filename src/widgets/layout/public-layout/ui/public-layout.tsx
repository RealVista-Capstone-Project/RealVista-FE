'use client';

import * as React from 'react';
import { TopNav, type NavItem } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

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
  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      <TopNav navItems={navItems} logoHref={logoHref} user={user} />
      <main className='flex-1'>{children}</main>
    </div>
  );
}
