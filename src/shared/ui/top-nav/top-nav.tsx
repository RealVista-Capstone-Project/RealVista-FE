'use client';

import { Bell, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { ProfileDropdown } from '@/shared/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

interface TopNavProps {
  navItems?: NavItem[];
  logoHref?: string;
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'explore', label: 'Explore', href: '/', isActive: true },
  { id: 'sell', label: 'Sell', href: '/sell' },
  { id: 'favorited', label: 'Favorited', href: '/favorited' },
  { id: 'appointments', label: 'Appointments', href: '/appointments' },
];

const defaultUser = {
  name: 'Giovanni',
  initials: 'GI',
};

export function TopNav({
  navItems = defaultNavItems,
  logoHref = '/',
  user = defaultUser,
  className,
}: TopNavProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-border bg-white px-8 py-4',
        className
      )}
    >
      {/* Logo and Nav Items */}
      <div className='flex items-center gap-8'>
        {/* Logo */}
        <Link href={logoHref} className='flex items-center gap-2'>
          {/* TODO: Replace with actual logo component */}
          <RealVistaLogo />
          <span className='text-xl font-bold leading-[1.4] text-main-secondary'>RealVista</span>
        </Link>

        {/* Nav Items */}
        <nav className='flex items-center gap-12' aria-label='Main navigation'>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'text-base leading-[1.5] transition-colors hover:text-main-primary',
                item.isActive ? 'font-bold text-main-primary' : 'font-medium text-main-black'
              )}
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right Actions */}
      <div className='flex items-center gap-6'>
        {/* Notification Button */}
        <button
          type='button'
          className='flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92'
          aria-label='Notifications'
        >
          <Bell className='h-5 w-5' />
        </button>

        {/* Message Button */}
        <button
          type='button'
          className='flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92'
          aria-label='Messages'
        >
          <Mail className='h-5 w-5' />
        </button>

        {/* Divider */}
        <div className='h-10 w-px border-r border-border' aria-hidden='true' />

        {/* Profile Dropdown */}
        <ProfileDropdown user={user} align='end' />
      </div>
    </header>
  );
}
