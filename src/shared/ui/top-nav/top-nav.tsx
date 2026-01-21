'use client';

import { Bell, ChevronDown, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { ProfileDropdown } from '@/shared/ui';
import { Separator } from '@/shared/ui';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
};

type ProfileVariant = 'dropdown' | 'inline';

interface TopNavProps {
  variant?: 'public' | 'dashboard';
  navItems?: NavItem[];
  logoHref?: string;
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  profileVariant?: ProfileVariant;
  startContent?: React.ReactNode;
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
  variant = 'public',
  navItems = variant === 'public' ? defaultNavItems : undefined,
  logoHref = '/',
  user = defaultUser,
  profileVariant = variant === 'dashboard' ? 'inline' : 'dropdown',
  startContent,
  className,
}: TopNavProps) {
  const showNavItems = variant === 'public' && navItems && navItems.length > 0;
  const showMessageButton = variant === 'public';

  return (
    <header
      className={cn(
        'flex items-center justify-between bg-white px-8 py-4',
        variant === 'public' && 'border-b border-border',
        className
      )}
    >
      {/* Left Section */}
      <div className={cn('flex items-center gap-4', showNavItems && 'gap-8')}>
        {/* Start Content (e.g., SidebarTrigger) */}
        {startContent && <div className='flex items-center'>{startContent}</div>}

        {/* Logo and Nav Items */}
        <div className={cn('flex items-center', showNavItems ? 'gap-8' : 'gap-4')}>
          {/* Logo - hide logo text for dashboard variant */}
          {variant === 'dashboard' ? (
            <span className='font-bold text-[24px] leading-[1.5] tracking-[-0.24px] text-main-black'>
              RealVista
            </span>
          ) : (
            <Link href={logoHref} className='flex items-center gap-2'>
              <RealVistaLogo />
              <span className='text-xl font-bold leading-[1.5] tracking-[-0.24px] text-main-black'>
                RealVista
              </span>
            </Link>
          )}

          {/* Nav Items - only for public variant */}
          {showNavItems && (
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
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className='flex items-center gap-6'>
        {/* Notification Button */}
        <button
          type='button'
          className='flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92'
          aria-label='Notifications'
        >
          <Bell className='h-6 w-6' strokeWidth={2} />
        </button>

        {/* Message Button - only for public variant */}
        {showMessageButton && (
          <button
            type='button'
            className='flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92'
            aria-label='Messages'
          >
            <Mail className='h-5 w-5' />
          </button>
        )}

        {/* Divider */}
        <div className='flex h-10 items-center'>
          <Separator orientation='vertical' className='h-6' />
        </div>

        {/* Profile - Dropdown or Inline */}
        {profileVariant === 'dropdown' ? (
          <ProfileDropdown user={user} align='end' />
        ) : (
          <button
            type='button'
            className='flex h-12 w-[143px] items-center gap-2 rounded-lg border border-purple-92 bg-white px-3 py-2.5 shadow-[0px_0px_40px_0px_rgba(112,101,240,0.1)] transition-shadow hover:shadow-md'
            aria-label='Profile menu'
          >
            <div className='flex size-8 items-center justify-center rounded-full bg-main-primary text-white'>
              <span className='text-base font-bold leading-[1.5]'>{user.initials}</span>
            </div>
            <span className='text-base font-medium leading-[1.5] text-main-black'>
              {user.name}
            </span>
            <ChevronDown className='h-4 w-4 shrink-0 text-main-black' strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
}
