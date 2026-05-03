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
    <div className='flex items-center gap-6'>
      {/* Notifications — always visible in dashboard */}
      <NotificationDropdownContainer />

      <div className='hidden lg:flex h-10 items-center'>
        <Separator orientation='vertical' className='h-6' />
      </div>

      {/* Profile — dropdown */}
      <ProfileDropdown user={user} align='end' menuItems={menuItems} />
    </div>
  );
}
