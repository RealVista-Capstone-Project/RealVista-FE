'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { User, HelpCircle, LogOut, LayoutDashboard, Home, FileText } from 'lucide-react';
import type { ProfileMenuItem } from './profile-dropdown';
import { ROUTES } from '@/shared/config/routes';

const DASHBOARD_ROLES = ['admin', 'moderator', 'owner'] as const;
type DashboardRole = (typeof DASHBOARD_ROLES)[number];

function hasDashboardAccess(role?: string | null): role is DashboardRole {
  return DASHBOARD_ROLES.includes(role as DashboardRole);
}

/**
 * Returns the full ProfileMenuItem[] for the profile dropdown,
 * including an optional context-aware swap button for dashboard-access users.
 */
export function useProfileMenuItems(): ProfileMenuItem[] {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();

  return useMemo(() => {
    const role = session?.user?.role;
    const isDashboard = pathname?.includes('/dashboard') ?? false;

    const defaultItems: ProfileMenuItem[] = [
      { id: 'profile', label: 'profile', icon: User, href: `/${locale}${ROUTES.settings}` },
      { id: 'my-contracts', label: 'myContracts', icon: FileText, href: `/${locale}${ROUTES.myContracts}` },
      { id: 'help', label: 'help', icon: HelpCircle },
      { id: 'logout', label: 'logout', icon: LogOut },
    ];

    if (!hasDashboardAccess(role)) return defaultItems;

    const swapItem: ProfileMenuItem = isDashboard
      ? { id: 'go-home', label: 'home', icon: Home, href: `/${locale}${ROUTES.buy}` }
      : { id: 'go-dashboard', label: 'dashboard', icon: LayoutDashboard, href: `/${locale}${ROUTES.dashboard.root}` };

    return [swapItem, ...defaultItems];
  }, [session?.user?.role, pathname, locale]);
}
