'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Bell, ChevronDown, Heart, Mail, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { ProfileDropdown, Separator } from '@/shared/ui';
import { ChatDropdownContainer } from '@/widgets/chat-dropdown';
import { bookmarkKeys } from '@/entities/bookmark';

export type NavItem = {
  id: string;
  translationKey: string;
  href: string;
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
  { id: 'buy', translationKey: 'buy', href: ROUTES.buy },
  { id: 'rent', translationKey: 'rent', href: ROUTES.rent },
  { id: 'sell', translationKey: 'sell', href: ROUTES.sell },
  { id: 'appointments', translationKey: 'appointments', href: ROUTES.appointments },
];

const defaultUser = {
  name: 'Giovanni',
  initials: 'GI',
};

export function TopNav({
  variant = 'public',
  navItems = variant === 'public' ? defaultNavItems : undefined,
  logoHref = ROUTES.buy,
  user = defaultUser,
  profileVariant = variant === 'dashboard' ? 'inline' : 'dropdown',
  startContent,
  className,
}: TopNavProps) {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const showNavItems = variant === 'public' && navItems && navItems.length > 0;
  const showMessageButton = variant === 'public';
  const isUserLoggedIn = !!session?.user;

  // Helper function to check if a route is active
  const isRouteActive = (href: string): boolean => {
    if (!pathname) return false;
    // Remove locale prefix (e.g., /vi or /en) from pathname for comparison
    const cleanPathname = pathname.replace(/^\/(vi|en)/, '') || '/';
    return cleanPathname === href;
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between bg-white px-6 py-4 lg:px-8',
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
            <span className='font-bold text-xl lg:text-[24px] leading-[1.5] tracking-[-0.24px] text-main-black'>
              RealVista
            </span>
          ) : (
            <Link href={`/${locale}${logoHref}`} className='flex items-center gap-2'>
              <RealVistaLogo />
              <span className='text-lg lg:text-xl font-bold leading-[1.5] tracking-[-0.24px] text-main-black'>
                RealVista
              </span>
            </Link>
          )}

          {/* Nav Items */}
          {showNavItems && (
            <nav className='hidden lg:flex items-center gap-6' aria-label='Main navigation'>
              {navItems.map((item) => {
                const isActive = isRouteActive(item.href);
                // Check if item has dropdown
                const hasDropdown = item.id === 'buy' || item.id === 'rent';

                if (hasDropdown) {
                  return (
                    <NavItemDropdown
                      key={item.id}
                      item={item}
                      isActive={isActive}
                      t={t}
                      locale={locale}
                    />
                  );
                }
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'text-base leading-[1.5] transition-colors hover:text-main-primary',
                      isActive ? 'font-bold text-main-primary' : 'font-medium text-main-black'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {t(item.translationKey)}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className='flex items-center gap-6'>
        {/* Notification Button - only shown when logged in, hidden on mobile for public variant */}
        {isUserLoggedIn && (
          <button
            type='button'
            className={cn(
              'flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92',
              variant === 'public' && 'hidden lg:flex'
            )}
            aria-label='Notifications'
            title='Notifications'
          >
            <Bell className='h-6 w-6' strokeWidth={2} />
          </button>
        )}

        {/* Bookmark Button - only for public variant, shown when user is logged in, hidden on mobile */}
        {showMessageButton && isUserLoggedIn && (
          <Link
            href={`/${locale}${ROUTES.favorited}`}
            onClick={() => queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() })}
            className={cn(
              'hidden lg:flex size-10 items-center justify-center rounded-lg transition-colors',
              isRouteActive('/favorited')
                ? 'bg-main-primary text-white'
                : 'bg-purple-98 text-main-black hover:bg-purple-92'
            )}
            aria-label='Bookmarks'
            title='View bookmarks'
          >
            <Heart
              className='h-5 w-5'
              fill={isRouteActive('/favorited') ? 'currentColor' : 'none'}
            />
          </Link>
        )}

        {/* Chat Dropdown - only for public variant, hidden on mobile */}
        {showMessageButton && (
          <div className='hidden lg:block'>
            <ChatDropdownContainer />
          </div>
        )}

        {/* Divider - hidden on mobile for public variant */}
        <div className={cn('flex h-10 items-center', variant === 'public' && 'hidden lg:flex')}>
          <Separator orientation='vertical' className='h-6' />
        </div>

        {/* Profile - Dropdown or Inline when logged in, hidden on mobile for public variant */}
        {isUserLoggedIn ? (
          profileVariant === 'dropdown' ? (
            <div className='hidden lg:block'>
              <ProfileDropdown user={user} align='end' />
            </div>
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
          )
        ) : (
          /* Login and Sign up buttons - shown only when not logged in, public variant */
          <div className='hidden lg:flex items-center gap-3'>
            <Link
              href={`/${locale}${ROUTES.login}`}
              className='flex h-12 items-center justify-center px-6 rounded-lg border border-purple-92 bg-white font-medium text-main-primary transition-colors hover:bg-purple-98'
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}${ROUTES.register}`}
              className='flex h-12 items-center justify-center px-6 rounded-lg bg-main-primary text-white font-medium transition-colors hover:bg-main-primary-hover'
            >
              {t('signup')}
            </Link>
          </div>
        )}

        {/* Hamburger Menu - only for public variant, visible on mobile */}
        {variant === 'public' && (
          <button
            type='button'
            onClick={() => setIsMobileMenuOpen(true)}
            className='flex lg:hidden size-10 items-center justify-center text-main-black'
            aria-label='Open menu'
          >
            <Menu className='h-6 w-6' strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {variant === 'public' && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-40 bg-black/50 lg:hidden'
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden='true'
          />

          {/* Mobile Menu Panel */}
          <div className='fixed inset-y-0 right-0 z-50 w-[280px] bg-white shadow-xl lg:hidden'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-border px-6 py-4'>
              <span className='text-lg font-bold text-main-black'>Menu</span>
              <button
                type='button'
                onClick={() => setIsMobileMenuOpen(false)}
                className='flex size-10 items-center justify-center text-main-black'
                aria-label='Close menu'
              >
                <X className='h-6 w-6' strokeWidth={2} />
              </button>
            </div>

            {/* Navigation Links */}
            {showNavItems && navItems && (
              <nav className='flex flex-col px-6 py-6' aria-label='Mobile navigation'>
                {navItems.map((item) => {
                  const isActive = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'py-3 text-base leading-[1.5] transition-colors',
                        isActive
                          ? 'font-bold text-main-primary'
                          : 'font-medium text-main-black hover:text-main-primary'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {t(item.translationKey)}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Profile Section */}
            <div className='border-t border-border px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-main-primary text-white'>
                  <span className='text-sm font-bold leading-[1.5]'>{user.initials}</span>
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium leading-[1.4] text-main-black'>
                    {user.name}
                  </span>
                  <span className='text-xs leading-[1.4] text-grey-500'>View Profile</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function NavItemDropdown({
  item,
  isActive,
  t,
  locale,
}: {
  item: NavItem;
  isActive: boolean;
  t: any;
  locale: string;
}) {
  const [open, setOpen] = useState(false);

  if (item.id !== 'buy' && item.id !== 'rent') {
    return (
      <Link
        href={`/${locale}${item.href}`}
        className={cn(
          'text-base leading-[1.5] transition-colors hover:text-main-primary',
          isActive ? 'font-bold text-main-primary' : 'font-medium text-main-black'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {t(item.translationKey)}
      </Link>
    );
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        asChild
      >
        <Link
          href={`/${locale}${item.href}`}
          className={cn(
            'flex items-center gap-1 text-base leading-[1.5] transition-colors hover:text-main-primary outline-none',
            isActive ? 'font-bold text-main-primary' : 'font-medium text-main-black',
            open && 'text-main-primary'
          )}
        >
          {t(item.translationKey)}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={2}
          />
        </Link>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align='start'
          sideOffset={20}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={cn(
            'z-50 w-[600px] rounded-xl border border-purple-92 bg-white p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          <div className='grid grid-cols-2 gap-8'>
            {PROPERTY_TYPES.map((category) => (
              <div key={category.code} className='space-y-4'>
                <Link
                  href={`/${locale}${item.href}?propertyCategory=${category.code}`}
                  className='flex items-center gap-2 pb-2 border-b border-purple-92 hover:border-main-primary transition-colors group'
                  onClick={() => setOpen(false)}
                >
                  <span className='text-sm font-bold uppercase tracking-wider text-main-primary/80 group-hover:text-main-primary transition-colors'>
                    {category.label}
                  </span>
                </Link>
                <div className='grid grid-cols-2 gap-2'>
                  {category.types.map((type) => (
                    <Link
                      key={type.code}
                      href={`/${locale}${item.href}?propertyType=${type.code}`}
                      className='text-sm text-grey-600 hover:text-main-primary hover:bg-purple-98 px-3 py-2 rounded-lg transition-colors capitalize'
                      onClick={() => setOpen(false)}
                    >
                      {type.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
