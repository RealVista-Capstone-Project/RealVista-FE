'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { DashboardActions } from './top-nav-dashboard-actions';
import { PublicActions } from './top-nav-public-actions';

export type NavItem = {
  id: string;
  translationKey: string;
  href: string;
  authOnly?: boolean; // only render when user is logged in
};

export interface TopNavProps {
  variant?: 'public' | 'dashboard';
  navItems?: NavItem[];
  logoHref?: string;
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  pageTitle?: string;
  startContent?: React.ReactNode;
  /** Shown after the dashboard page title (inline). Prefer dashboardEndActions for actions on the right of the top bar. */
  dashboardTitleActions?: React.ReactNode;
  /** Shown on the top nav right, before notifications/profile (e.g. primary page action). */
  dashboardEndActions?: React.ReactNode;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'buy', translationKey: 'buy', href: ROUTES.buy },
  { id: 'rent', translationKey: 'rent', href: ROUTES.rent },
  { id: 'sell', translationKey: 'sell', href: ROUTES.sell },
  { id: 'subscribe', translationKey: 'subscribe', href: ROUTES.subscribe },
  { id: 'appointments', translationKey: 'appointments', href: ROUTES.appointments, authOnly: true },
  { id: 'my-contracts', translationKey: 'myContracts', href: ROUTES.myContracts, authOnly: true },
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
  pageTitle = 'RealVista',
  startContent,
  dashboardTitleActions,
  dashboardEndActions,
  className,
}: TopNavProps) {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const showNavItems = variant === 'public' && navItems && navItems.length > 0;
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
        'flex items-center justify-between bg-white',
        variant === 'public' && 'border-b border-border px-6 py-4 lg:px-8',
        variant === 'dashboard' && 'px-4 py-2 lg:px-6',
        className
      )}
    >
      {/* Left Section */}
      <div
        className={cn(
          'flex min-w-0 items-center gap-4',
          variant === 'dashboard' && 'flex-1 pr-2',
          showNavItems && 'gap-8'
        )}
      >
        {/* Start Content (e.g., SidebarTrigger) */}
        {startContent && <div className='flex items-center'>{startContent}</div>}

        {/* Logo and Nav Items */}
        <div className={cn('flex min-w-0 items-center', showNavItems ? 'gap-8' : 'gap-4')}>
          {/* Logo - hide logo text for dashboard variant */}
          {variant === 'dashboard' ? (
            <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
              <span className='min-w-0 truncate font-bold text-base lg:text-lg leading-snug tracking-tight text-foreground'>
                {pageTitle}
              </span>
              {dashboardTitleActions}
            </div>
          ) : (
            <Link href={`/${locale}${logoHref}`} className='flex items-center gap-[2px]'>
              <RealVistaLogo />
              <span className='text-lg lg:text-xl font-bold leading-[1.5] tracking-[-0.24px] text-foreground'>
                RealVista
              </span>
            </Link>
          )}

          {/* Nav Items */}
          {showNavItems && (
            <nav className='hidden lg:flex items-center gap-6' aria-label='Main navigation'>
              {navItems.map((item) => {
                // Hide auth-only items when user is not logged in
                if (item.authOnly && !isUserLoggedIn) return null;

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
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'text-[15px] leading-[1.5] transition-colors hover:text-primary',
                      isActive ? 'font-bold text-primary' : 'font-medium text-foreground'
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

      {/* Right Actions — split per variant for clear, isolated logic */}
      {variant === 'dashboard' ? (
        <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
          {dashboardEndActions}
          <DashboardActions
            user={user}
            isUserLoggedIn={isUserLoggedIn}
            locale={locale}
            t={t}
            router={router}
            isRouteActive={isRouteActive}
          />
        </div>
      ) : (
        <PublicActions
          user={user}
          isUserLoggedIn={isUserLoggedIn}
          locale={locale}
          t={t}
          router={router}
          isRouteActive={isRouteActive}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
      )}

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
              <span className='text-lg font-bold text-foreground'>Menu</span>
              <button
                type='button'
                onClick={() => setIsMobileMenuOpen(false)}
                className='flex size-10 items-center justify-center text-foreground'
                aria-label='Close menu'
              >
                <X className='h-6 w-6' strokeWidth={2} />
              </button>
            </div>

            {/* Navigation Links */}
            {showNavItems && navItems && (
              <nav className='flex flex-col px-6 py-6' aria-label='Mobile navigation'>
                {navItems.map((item) => {
                  // Hide auth-only items when user is not logged in
                  if (item.authOnly && !isUserLoggedIn) return null;

                  const isActive = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                      'py-3 text-[15px] leading-[1.5] transition-colors',
                        isActive
                          ? 'font-bold text-primary'
                          : 'font-medium text-foreground hover:text-primary'
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
                <div className='flex size-10 items-center justify-center rounded-full bg-primary text-white'>
                  <span className='text-sm font-bold leading-[1.5]'>{user.initials}</span>
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium leading-[1.4] text-foreground'>
                    {user.name}
                  </span>
                  <span className='text-xs leading-[1.4] text-muted-foreground'>View Profile</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

// ─── Nav Item Dropdown ────────────────────────────────────────────────────────

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
          'text-[15px] leading-[1.5] transition-colors hover:text-primary',
          isActive ? 'font-bold text-primary' : 'font-medium text-foreground'
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
          'flex items-center gap-1 text-[15px] leading-[1.5] transition-colors hover:text-primary outline-none',
            isActive ? 'font-bold text-primary' : 'font-medium text-foreground',
            open && 'text-primary'
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
            'z-50 w-[600px] rounded-xl border border-primary/20 bg-white p-6 shadow-xl',
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
                  className='flex items-center gap-2 pb-2 border-b border-primary/20 hover:border-primary transition-colors group'
                  onClick={() => setOpen(false)}
                >
                  <span className='text-sm font-bold uppercase tracking-wider text-primary/80 group-hover:text-primary transition-colors'>
                    {category.label}
                  </span>
                </Link>
                <div className='grid grid-cols-2 gap-2'>
                  {category.types.map((type) => (
                    <Link
                      key={type.code}
                      href={`/${locale}${item.href}?propertyType=${type.code}`}
                      className='text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors capitalize'
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
