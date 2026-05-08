'use client';

import { ProfileDropdown, Separator, useProfileMenuItems } from '@/shared/ui';
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
    <div className='flex items-center gap-3 lg:gap-4'>
      {/* Notifications — always visible in dashboard */}
      <NotificationDropdownContainer className='size-8 [&_svg]:h-5 [&_svg]:w-5' />

      <div className='hidden lg:flex h-8 items-center'>
        <Separator orientation='vertical' className='h-5' />
      </div>

      {/* Profile — dropdown */}
      <ProfileDropdown
        user={user}
        align='end'
        menuItems={menuItems}
        className='gap-1.5 px-2.5 py-1.5 text-sm shadow-sm [&_svg]:h-3.5 [&_svg]:w-3.5'
      />
    </div>
  );
}
