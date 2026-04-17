'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, CreditCard, Menu, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import { ProfileDropdown, Separator, useProfileMenuItems, GlobalProfileSwitcher } from '@/shared/ui';
import { ChatDropdownContainer } from '@/widgets/chat-dropdown';
import { NotificationDropdownContainer } from '@/widgets/notification-dropdown';


export interface PublicActionsProps {
  user: { name: string; initials: string; avatar?: string };
  isUserLoggedIn: boolean;
  locale: string;
  t: (key: string) => string;
  router: ReturnType<typeof import('next/navigation').useRouter>;
  isRouteActive: (href: string) => boolean;
  onOpenMobileMenu: () => void;
}

/**
 * Right-side action bar for the public variant of TopNav.
 * Contains: Notifications → Bookmarks → Subscribe → Chat → Divider
 *           → Profile (logged in) or Login/Signup (logged out) → Hamburger.
 * Desktop-only items are gated with `hidden lg:*`.
 */
export function PublicActions({
  user,
  isUserLoggedIn,
  locale,
  t,
  router,
  isRouteActive,
  onOpenMobileMenu,
}: PublicActionsProps) {
  const queryClient = useQueryClient();
  const menuItems = useProfileMenuItems();
  const { status } = useSession();

  const isLoadingSession = status === 'loading';

  return (
    <div className='flex items-center gap-6'>
      {/* Bookmarks — logged-in only, hidden on mobile */}
      {isUserLoggedIn && (
        <button
          type='button'
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            router.push(`/${locale}${ROUTES.favorited}`);
          }}
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
        </button>
      )}

      {/* Subscribe — shown regardless of auth state, hidden on mobile */}
      <button
        type='button'
        onClick={() => router.push(`/${locale}${ROUTES.subscribe}`)}
        className={cn(
          'hidden lg:flex size-10 items-center justify-center rounded-lg transition-colors',
          isRouteActive('/subscribe')
            ? 'bg-main-primary text-white'
            : 'bg-purple-98 text-main-black hover:bg-purple-92'
        )}
        aria-label={t('subscribe')}
        title={t('subscribe')}
      >
        <CreditCard className='h-5 w-5' strokeWidth={2} />
      </button>

      {/* Chat — logged-in only, hidden on mobile */}
      {isUserLoggedIn && (
        <div className='hidden lg:block'>
          <ChatDropdownContainer />
        </div>
      )}

      {/* Notifications — logged-in only, hidden on mobile */}
      {isUserLoggedIn && (
        <div className='hidden lg:block'>
          <NotificationDropdownContainer />
        </div>
      )}

      {/* Profile Switcher — logged-in only, hidden on mobile */}
      {isUserLoggedIn && (
        <div className='hidden lg:block'>
          <GlobalProfileSwitcher />
        </div>
      )}

      {/* Divider — hidden on mobile */}
      <div className='hidden lg:flex h-10 items-center'>
        <Separator orientation='vertical' className='h-6' />
      </div>

      {/* Profile / Auth */}
      {isLoadingSession ? (
        <div className='hidden lg:block w-[100px] h-10 bg-purple-98 animate-pulse rounded-lg' />
      ) : isUserLoggedIn ? (
        <div className='hidden lg:block'>
          <ProfileDropdown user={user} align='end' menuItems={menuItems} />
        </div>
      ) : (
        /* Login + Sign-up — shown only when logged out, hidden on mobile */
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

      {/* Hamburger — mobile only */}
      <button
        type='button'
        onClick={onOpenMobileMenu}
        className='flex lg:hidden size-10 items-center justify-center text-main-black'
        aria-label='Open menu'
      >
        <Menu className='h-6 w-6' strokeWidth={2} />
      </button>
    </div>
  );
}
