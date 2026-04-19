'use client';

import Image from 'next/image';
import { ChevronDown, CreditCard } from 'lucide-react';
import { ProfileDropdown, Separator, useProfileMenuItems, GlobalProfileSwitcher } from '@/shared/ui';
import { NotificationDropdownContainer } from '@/widgets/notification-dropdown';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/config/routes';


export interface DashboardActionsProps {
  user: { name: string; initials: string; avatar?: string };
  isUserLoggedIn: boolean;
  locale: string;
  t: (key: string) => string;
  router: ReturnType<typeof import('next/navigation').useRouter>;
  isRouteActive: (href: string) => boolean;
}

/**
 * Right-side action bar for the dashboard variant of TopNav.
 * Contains: Subscribe → Notifications → Divider → Profile button/dropdown.
 */
export function DashboardActions({
  user,
  isUserLoggedIn,
  locale,
  t,
  router,
  isRouteActive,
}: DashboardActionsProps) {
  const menuItems = useProfileMenuItems();

  if (!isUserLoggedIn) return null;

  return (
    <div className='flex items-center gap-6'>
      {/* Subscribe — logically before notifications or after? Placed before notifications usually */}
      <button
        type='button'
        onClick={() => router.push(`/${locale}${ROUTES.subscribe}`)}
        className={cn(
          'hidden lg:flex size-10 items-center justify-center rounded-lg transition-colors',
          isRouteActive('/subscribe')
            ? 'bg-primary text-white'
            : 'bg-primary/5 text-foreground hover:bg-primary/10'
        )}
        aria-label={t('subscribe')}
        title={t('subscribe')}
      >
        <CreditCard className='h-5 w-5' strokeWidth={2} />
      </button>

      {/* Notifications — always visible in dashboard */}
      <NotificationDropdownContainer />

      <div className='hidden lg:block'>
        <GlobalProfileSwitcher />
      </div>

      <div className='hidden lg:flex h-10 items-center'>
        <Separator orientation='vertical' className='h-6' />
      </div>

      {/* Profile — dropdown */}
      <ProfileDropdown user={user} align='end' menuItems={menuItems} />
    </div>
  );
}
