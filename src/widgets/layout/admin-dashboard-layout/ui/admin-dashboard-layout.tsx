'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Columns,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Users,
  Building2,
  MapPin,
  Package,
  ShieldCheck,
  Flag,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
import { ROUTES } from '@/shared/config/routes';
import { TopNavContainer } from '@/shared/ui/top-nav/top-nav-container';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@/entities/admin/api';


import { SidebarMenuItem } from '../../types';

export interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  pageTitle?: string;
}

type TFn = ReturnType<typeof useTranslations<'DashboardLayout'>>;

function getAdminSidebarItems(t: TFn, badges: { reports?: number; listings?: number; totalListings?: number } = {}): SidebarMenuItem[] {
  return [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      href: ROUTES.dashboard.root,
      icon: LayoutDashboard,
    },
    { id: 'users', label: t('menu.users'), href: ROUTES.dashboard.manageUsers, icon: Users },
    { id: 'policies', label: t('menu.policies'), href: ROUTES.dashboard.managePolicies, icon: ShieldCheck },
    {
      id: 'reports',
      label: t('menu.reports'),
      href: ROUTES.dashboard.manageReports,
      icon: Flag,
      badge: badges.reports,
      badgeVariant: 'danger'
    },
    { id: 'templates', label: t('menu.templates'), href: ROUTES.dashboard.manageTemplates, icon: FileText },

    {
      id: 'locations',
      label: t('menu.locations'),
      href: ROUTES.dashboard.locations,
      icon: MapPin,
    },
    {
      id: 'packages',
      label: t('menu.packages'),
      href: ROUTES.dashboard.managePackages,
      icon: Package,
    },

    {
      id: 'property',
      label: t('menu.property'),
      href: ROUTES.dashboard.property,
      icon: Building2,
      badge: badges.totalListings,
      badgeVariant: 'info'
    },

    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: MessageCircle,
    },
  ];
}


export function AdminDashboardLayout({
  children,
  className,
  pageTitle: overridePageTitle,
}: AdminDashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');

  const { data: adminOverview } = useQuery({
    ...adminQueries.overview(),
  });

  const sidebarItems = React.useMemo(() => {
    return getAdminSidebarItems(t, {
      reports: adminOverview?.unresolved_reports,
      listings: adminOverview?.pending_listings,
      totalListings: adminOverview?.total_listings,
    });
  }, [t, adminOverview]);


  const pageTitle = React.useMemo(() => {
    if (overridePageTitle) return overridePageTitle;

    // Default mapping logic
    // Specific routes first
    if (pathname === ROUTES.dashboard.manageReports || pathname.startsWith(ROUTES.dashboard.manageReports))
        return t('pageTitle.reports');
    if (pathname === ROUTES.dashboard.managePolicies || pathname.startsWith(ROUTES.dashboard.managePolicies))
        return t('pageTitle.policies');
    if (pathname === ROUTES.dashboard.manageTemplates || pathname.startsWith(ROUTES.dashboard.manageTemplates))
        return t('pageTitle.templates');
    if (pathname === ROUTES.dashboard.locations || pathname.startsWith(ROUTES.dashboard.locations))
        return t('pageTitle.locations');
    if (pathname === ROUTES.dashboard.managePackages || pathname.startsWith(ROUTES.dashboard.managePackages))
        return t('pageTitle.managePackages');
    if (pathname === ROUTES.dashboard.managedListings || pathname.startsWith(ROUTES.dashboard.managedListings))
        return t('pageTitle.listings');
    if (pathname === ROUTES.dashboard.property || pathname.startsWith(ROUTES.dashboard.property))
        return t('pageTitle.property');
    if (pathname === ROUTES.dashboard.root)
        return t('pageTitle.dashboard');

    // General /admin check LAST
    if (pathname === ROUTES.dashboard.manageUsers || pathname.startsWith(ROUTES.dashboard.manageUsers))
      return t('pageTitle.manageUsers');

    return t('pageTitle.default');
  }, [pathname, t, overridePageTitle]);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === ROUTES.dashboard.root) return pathname === ROUTES.dashboard.root;

    // Special handling for the base /admin route to prevent it from matching sub-routes
    if (href === ROUTES.dashboard.manageUsers) {
      return pathname === ROUTES.dashboard.manageUsers;
    }

    return pathname.startsWith(href + '/');
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-muted/50', className)}>
      <ChatWindowRenderer />

      <aside
        className={cn(
          'relative z-20 flex h-screen flex-col border-primary/20 bg-white transition-all duration-300 ease-in-out shrink-0',
          isCollapsed ? 'w-20' : 'w-[280px]'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center border-primary/20 p-5',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {isCollapsed ? (
            <button
              type='button'
              onClick={() => setIsCollapsed(false)}
              className='flex size-8 items-center justify-center rounded-xl bg-primary transition-opacity hover:opacity-90 shadow-sm shadow-primary/10'
            >
              <Image src='/logo.png' alt='Logo' width={32} height={32} />
            </button>
          ) : (
            <>
              <Link href={`/buy`} className='flex items-center gap-3 group'>
                <div className='flex items-center justify-center rounded-xl bg-primary p-2'>
                  <Image src='/logo.png' alt='Logo' width={32} height={32} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-base font-bold leading-tight text-foreground'>RealVista</span>
                  <span className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40'>Admin Panel</span>
                </div>
              </Link>
              <button onClick={() => setIsCollapsed(true)} className='text-muted-foreground/40'>
                <Columns className='h-4 w-4' />
              </button>
            </>
          )}
        </div>

        {/* Menu */}
        <nav className='flex flex-1 flex-col gap-1 p-3 overflow-y-auto'>
          {sidebarItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                isItemActive(item.href) ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground/60 hover:bg-primary/5 hover:text-foreground',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <item.icon className='h-5 w-5' />
              {!isCollapsed && <span className='text-sm'>{item.label}</span>}
              {!isCollapsed && item.badge && Number(item.badge) > 0 && (
                <span className={cn('ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white',
                  item.badgeVariant === 'danger' ? 'bg-red-500' : 'bg-amber-500')}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
        <TopNavContainer variant='dashboard' pageTitle={pageTitle} />
        <main className='flex-1 overflow-y-auto bg-muted/30 p-0'>{children}</main>
      </div>
    </div>
  );
}
