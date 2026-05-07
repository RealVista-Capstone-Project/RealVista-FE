'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Calendar,
  ClipboardList,
  Compass,
  ContactRound,
  FileSignature,
  Handshake,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  MapPin,
  Package,
  PanelLeftClose,
  Send,
  ShieldCheck,
  Flag,
  UserCog,
  Building2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
import { useAuthSession } from '@/features/auth/model';
import { ROUTES } from '@/shared/config/routes';
import { TopNavContainer } from '@/shared/ui/top-nav/top-nav-container';
import { DashboardTopNavBadgeContext } from '@/shared/lib/dashboard-top-nav-badge-context';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@/entities/admin/api';


import { SidebarMenuItem } from '../../types';



export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems?: SidebarMenuItem[];
  className?: string;
  pageTitle?: string;
}

type TFn = ReturnType<typeof useTranslations<'DashboardLayout'>>;

function getOwnerSidebarItems(t: TFn): SidebarMenuItem[] {
  return [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      href: ROUTES.dashboard.root,
      icon: LayoutDashboard,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
    {
      id: 'listings',
      label: t('menu.listings'),
      href: ROUTES.dashboard.managedListings,
      icon: ClipboardList,
    },
    {
      id: 'appointments',
      label: t('menu.appointments'),
      href: ROUTES.dashboard.appointments,
      icon: Calendar,
    },
    // { id: 'tenants', label: t('menu.tenants'), href: ROUTES.dashboard.tenants, icon: UserCog },
    {
      id: 'rental-contracts',
      label: t('menu.rentalContracts'),
      href: ROUTES.dashboard.rentalContracts,
      icon: FileSignature,
    },
    {
      id: 'manage-agent',
      label: t('menu.manageAgent'),
      href: ROUTES.dashboard.manageAgent,
      icon: UserCog,
    },
    {
      id: 'my-engagements',
      label: t('menu.myEngagements'),
      href: ROUTES.dashboard.myEngagements,
      icon: Handshake,
    },
    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: Inbox,
    },
  ];
}

function getTenantSidebarItems(t: TFn): SidebarMenuItem[] {
  return [
    {
      id: 'appointments',
      label: t('menu.appointments'),
      href: ROUTES.dashboard.appointments,
      icon: Calendar,
    },
    {
      id: 'my-contracts',
      label: t('menu.myContracts'),
      href: ROUTES.dashboard.myContracts,
      icon: FileSignature,
    },
    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: Inbox,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
  ];
}

function getAgentSidebarItems(t: TFn): SidebarMenuItem[] {
  return [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      href: ROUTES.dashboard.root,
      icon: LayoutDashboard,
    },
    {
      id: 'property-feed',
      label: t('menu.propertyFeed'),
      href: ROUTES.dashboard.propertyFeed,
      icon: Compass,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
    {
      id: 'listings',
      label: t('menu.listings'),
      href: ROUTES.dashboard.managedListings,
      icon: ClipboardList,
    },
    {
      id: 'appointments',
      label: t('menu.appointments'),
      href: ROUTES.dashboard.appointments,
      icon: Calendar,
    },
    {
      id: 'crm',
      label: t('menu.crm'),
      href: ROUTES.dashboard.crm,
      icon: ContactRound,
    },
    {
      id: 'proposals',
      label: t('menu.proposals'),
      href: ROUTES.dashboard.manageProposals,
      icon: Send,
    },
    {
      id: 'my-contracts',
      label: t('menu.myContracts'),
      href: ROUTES.dashboard.myContracts,
      icon: FileSignature,
    },
    {
      id: 'my-engagements',
      label: t('menu.myEngagements'),
      href: ROUTES.dashboard.myEngagements,
      icon: Handshake,
    },
    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: Inbox,
    },
  ];
}

function getAdminSidebarItems(t: TFn, badges: { reports?: number; listings?: number; totalListings?: number } = {}): SidebarMenuItem[] {
  return [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      href: ROUTES.dashboard.root,
      icon: LayoutDashboard,
    },
    { id: 'users', label: t('menu.users'), href: ROUTES.dashboard.manageUsers, icon: UserCog },
    { id: 'policies', label: t('menu.policies'), href: ROUTES.dashboard.managePolicies, icon: ShieldCheck },
    {
      id: 'reports',
      label: t('menu.reports'),
      href: ROUTES.dashboard.manageReports,
      icon: Flag,
      badge: badges.reports,
      badgeVariant: 'danger'
    },
    { id: 'templates', label: t('menu.templates'), href: ROUTES.dashboard.manageTemplates, icon: LayoutTemplate },

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
      id: 'manage-properties',
      label: t('menu.manageProperties'),
      href: ROUTES.dashboard.manageProperties,
      icon: Building2,
    }
  ];
}


export function DashboardLayout({
  children,
  sidebarItems,
  className,
  pageTitle: overridePageTitle,
}: DashboardLayoutProps) {
  const { data: session } = useAuthSession();
  const backendRoles: string[] = React.useMemo(() => session?.user?.backendRoles ?? [], [session?.user?.backendRoles]);
  const isAgent = session?.user?.role === 'AGENT' || backendRoles.includes('AGENT');
  const isAdmin =
    session?.user?.role === 'admin' || backendRoles.includes('ADMIN') || backendRoles.includes('moderator');
  const isTenant = backendRoles.includes('TENANT') && !backendRoles.includes('OWNER');
  /** Owner home dashboard uses full pastel blue in main — avoids gray main vs blue content mismatch */
  const isOwnerPastelShell =
    (session?.user?.role === 'owner' || backendRoles.includes('OWNER')) && !isAgent && !isAdmin;

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [pageCountBadge, setPageCountBadgeState] = React.useState<number | null>(null);
  const setPageCountBadge = React.useCallback((n: number | null) => {
    setPageCountBadgeState(n);
  }, []);
  const badgeContextValue = React.useMemo(
    () => ({ setPageCountBadge }),
    [setPageCountBadge]
  );

  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');

  const { data: adminOverview } = useQuery({
    ...adminQueries.overview(),
    enabled: backendRoles.includes('ADMIN'),
  });

  const resolvedSidebarItems = React.useMemo(() => {
    if (sidebarItems) return sidebarItems;
    if (backendRoles.includes('ADMIN')) {
      return getAdminSidebarItems(t, {
        reports: adminOverview?.unresolved_reports,
        listings: adminOverview?.pending_listings,
        totalListings: adminOverview?.total_listings,
      });

    }
    if (isAgent) return getAgentSidebarItems(t);
    if (isTenant) return getTenantSidebarItems(t);
    return getOwnerSidebarItems(t);
  }, [sidebarItems, isAgent, isTenant, backendRoles, t, adminOverview]);


  const pageTitle = React.useMemo(() => {
    if (overridePageTitle) return overridePageTitle;

    if (
      pathname === ROUTES.dashboard.managedListings ||
      pathname.startsWith(ROUTES.dashboard.managedListings)
    )
      return t('pageTitle.managedListings');
    if (pathname === ROUTES.dashboard.insight || pathname.startsWith(ROUTES.dashboard.insight))
      return t('pageTitle.insight');
    if (
      pathname === ROUTES.dashboard.appointments ||
      pathname.startsWith(ROUTES.dashboard.appointments)
    )
      return t('pageTitle.appointments');
    if (pathname === ROUTES.dashboard.tenants || pathname.startsWith(ROUTES.dashboard.tenants))
      return t('pageTitle.tenants');
    if (
      pathname === ROUTES.dashboard.rentalContracts ||
      pathname.startsWith(ROUTES.dashboard.rentalContracts)
    )
      return t('pageTitle.rentalContracts');
    if (
      pathname === ROUTES.dashboard.myContracts ||
      pathname.startsWith(ROUTES.dashboard.myContracts)
    )
      return t('pageTitle.myContracts');
    if (pathname === ROUTES.dashboard.messages || pathname.startsWith(ROUTES.dashboard.messages))
      return t('pageTitle.messages');
    if (
      pathname === ROUTES.dashboard.manageProposals ||
      pathname.startsWith(ROUTES.dashboard.manageProposals)
    ) {
      return t('pageTitle.manageProposals');
    }
    if (
      pathname === ROUTES.dashboard.propertyFeed ||
      pathname.startsWith(ROUTES.dashboard.propertyFeed)
    ) {
      return t('pageTitle.propertyFeed');
    }
    if (
      pathname === ROUTES.dashboard.myEngagements ||
      pathname.startsWith(ROUTES.dashboard.myEngagements)
    ) {
      return t('pageTitle.myEngagements');
    }
    if (pathname === ROUTES.dashboard.property || pathname.startsWith(ROUTES.dashboard.property)) {
      return t('pageTitle.property');
    }
    if (
      pathname === ROUTES.dashboard.manageAgent ||
      pathname.startsWith(ROUTES.dashboard.manageAgent)
    ) {
      return t('pageTitle.manageAgent');
    }
    if (
      pathname === ROUTES.dashboard.managePackages ||
      pathname.startsWith(ROUTES.dashboard.managePackages)
    ) {
      return t('pageTitle.managePackages');
    }
    if (
      pathname === ROUTES.dashboard.manageProperties ||
      pathname.startsWith(ROUTES.dashboard.manageProperties)
    ) {
      return t('pageTitle.manageProperties');
    }
    if (
      pathname === ROUTES.dashboard.manageUsers ||
      pathname.startsWith(ROUTES.dashboard.manageUsers)
    ) {
      return t('pageTitle.manageUsers');
    }
    if (
      pathname === ROUTES.dashboard.locations ||
      pathname.startsWith(ROUTES.dashboard.locations)
    ) {
      return t('pageTitle.locations');
    }
    if (
      pathname === ROUTES.dashboard.propertyFeed ||
      pathname.startsWith(ROUTES.dashboard.propertyFeed)
    ) {
      return t('pageTitle.propertyFeed');
    }
    if (pathname === ROUTES.dashboard.root) {
      return t('pageTitle.dashboard');
    }
    if (pathname === ROUTES.dashboard.crm || pathname.startsWith(ROUTES.dashboard.crm)) {
      return t('pageTitle.crm');
    }
    return t('pageTitle.default');
  }, [pathname, t, overridePageTitle]);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === ROUTES.dashboard.root) return pathname === ROUTES.dashboard.root;
    if (href === ROUTES.dashboard.manageUsers) return pathname === ROUTES.dashboard.manageUsers;
    return pathname.startsWith(href + '/');
  };

  React.useEffect(() => {
    setPageCountBadgeState(null);
  }, [pathname]);

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

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-muted/50', className)}>
      <ChatWindowRenderer />

      {/* Sidebar - Now part of the flex flow on desktop */}
      <aside
        className={cn(
          'relative z-20 flex h-screen flex-col border-r border-primary/20 bg-white transition-all duration-300 ease-in-out shrink-0',
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
              className='flex size-8 items-center justify-center transition-opacity hover:opacity-90'
              aria-label='Expand sidebar'
            >
              <RealVistaLogo />
            </button>
          ) : (
            <>
              <Link href={`/buy`} className='flex items-center gap-3 group'>
                <div className='transition-transform group-hover:scale-105'>
                  <RealVistaLogo />
                </div>
                <div className='flex flex-col'>
                  <span className='text-base font-bold leading-tight text-foreground'>
                    {t('pageTitle.default')}
                  </span>
                  <span className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40'>
                    {t('pageTitle.dashboardManager')}
                  </span>
                </div>
              </Link>
              <button
                type='button'
                onClick={() => setIsCollapsed(true)}
                className='flex size-8 items-center justify-center rounded-lg border-primary/20 bg-background text-muted-foreground/40 transition-all hover:bg-muted/50 hover:text-foreground hover:border-border hover:shadow-sm'
                aria-label='Collapse sidebar'
              >
                <PanelLeftClose className='h-4 w-4' strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Menu Items */}
        <nav className='flex flex-1 flex-col gap-1 p-3 overflow-y-auto'>
          {resolvedSidebarItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                  isActive
                    ? 'bg-primary/5 text-primary font-semibold ring-1 ring-primary/10'
                    : 'text-muted-foreground/60 hover:bg-primary/5 hover:text-foreground',
                  isCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn('h-5 w-5 shrink-0 transition-transform', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!isCollapsed && <span className='text-sm'>{item.label}</span>}
                {!isCollapsed && Number(item.badge) > 0 && (
                  <span className={cn(
                    'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm transition-all',
                    item.badgeVariant === 'danger' && 'bg-red-500 text-white',
                    item.badgeVariant === 'warning' && 'bg-amber-500 text-white',
                    item.badgeVariant === 'info' && 'bg-blue-500 text-white',
                    item.badgeVariant === 'success' && 'bg-emerald-500 text-white',
                    !item.badgeVariant && 'bg-primary text-primary-foreground'
                  )}>
                    {item.badge}
                  </span>
                )}
                {isCollapsed && Number(item.badge) > 0 && (
                  <div className={cn(
                    'absolute right-3 top-2.5 h-2 w-2 rounded-full ring-2 ring-white animate-pulse',
                    item.badgeVariant === 'danger' && 'bg-red-500',
                    item.badgeVariant === 'warning' && 'bg-amber-500',
                    item.badgeVariant === 'info' && 'bg-blue-500',
                    item.badgeVariant === 'success' && 'bg-emerald-500',
                    !item.badgeVariant && 'bg-primary'
                  )} />
                )}
              </Link>


            );
          })}
        </nav>
      </aside>

      {/* Main Content Area - Properly fills space without margin hacks */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
        <DashboardTopNavBadgeContext.Provider value={badgeContextValue}>
          {/* Top Nav */}
          <TopNavContainer
            variant='dashboard'
            pageTitle={pageTitle}
            dashboardTitleActions={
              pageCountBadge != null ? (
                <span className='inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-2 py-0.5'>
                  <span className='text-xs font-bold tabular-nums text-white sm:text-sm'>
                    {formatNumber(pageCountBadge)}
                  </span>
                </span>
              ) : undefined
            }
          />

          {/* Page Content - fills remaining height, scrollable */}
          <main
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-y-auto p-0',
              isOwnerPastelShell
                ? 'bg-[#e8f2fb] dark:bg-background lg:min-h-[calc(100svh-3.5rem)]'
                : 'bg-muted/30 dark:bg-background',
            )}
          >
            {children}
          </main>
        </DashboardTopNavBadgeContext.Provider>
      </div>
    </div>
  );
}
