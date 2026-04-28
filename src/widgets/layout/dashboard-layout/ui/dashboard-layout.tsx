'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Calendar,
  Columns,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Users,
  Building2,
  Search,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
import { useAuthSession } from '@/features/auth/model';
import { ROUTES } from '@/shared/config/routes';
import { TopNavContainer } from '@/shared/ui/top-nav/top-nav-container';

export interface SidebarMenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems?: SidebarMenuItem[];
  logoHref?: string;
  className?: string;
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
    {
      id: 'listings',
      label: t('menu.listings'),
      href: ROUTES.dashboard.managedListings,
      icon: Columns,
    },
    {
      id: 'appointments',
      label: t('menu.appointments'),
      href: ROUTES.dashboard.appointments,
      icon: Calendar,
    },
    // { id: 'tenants', label: t('menu.tenants'), href: ROUTES.dashboard.tenants, icon: Users },
    {
      id: 'rental-contracts',
      label: t('menu.rentalContracts'),
      href: ROUTES.dashboard.rentalContracts,
      icon: FileText,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
    {
      id: 'manage-agent',
      label: t('menu.manageAgent'),
      href: ROUTES.dashboard.manageAgent,
      icon: Users,
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
      icon: MessageCircle,
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
      icon: FileText,
    },
    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: MessageCircle,
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
      icon: Search,
    },
    {
      id: 'listings',
      label: t('menu.listings'),
      href: ROUTES.dashboard.managedListings,
      icon: Columns,
    },
    {
      id: 'appointments',
      label: t('menu.appointments'),
      href: ROUTES.dashboard.appointments,
      icon: Calendar,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
    {
      id: 'proposals',
      label: t('menu.proposals'),
      href: ROUTES.dashboard.manageProposals,
      icon: FileText,
    },
    {
      id: 'my-contracts',
      label: t('menu.myContracts'),
      href: ROUTES.dashboard.myContracts,
      icon: FileText,
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
      icon: MessageCircle,
    },
  ];
}

function getAdminSidebarItems(t: TFn): SidebarMenuItem[] {
  return [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      href: ROUTES.dashboard.root,
      icon: LayoutDashboard,
    },
    { id: 'users', label: t('menu.users'), href: ROUTES.dashboard.manageUsers, icon: Users },
    { id: 'packages', label: t('menu.packages'), href: ROUTES.dashboard.managePackages, icon: Package },
    {
      id: 'listings',
      label: t('menu.listings'),
      href: ROUTES.dashboard.managedListings,
      icon: Columns,
    },
    { id: 'property', label: t('menu.property'), href: ROUTES.dashboard.property, icon: Building2 },
    {
      id: 'messages',
      label: t('menu.messages'),
      href: ROUTES.dashboard.messages,
      icon: MessageCircle,
    },
  ];
}

export function DashboardLayout({
  children,
  sidebarItems,
  logoHref = ROUTES.homePage,
  className,
}: DashboardLayoutProps) {
  const { data: session } = useAuthSession();
  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const isAgent = session?.user?.role === 'AGENT' || backendRoles.includes('AGENT');
  const isTenant = backendRoles.includes('TENANT') && !backendRoles.includes('OWNER');

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');
  const locale = useLocale();

  const resolvedSidebarItems = React.useMemo(() => {
    if (sidebarItems) return sidebarItems;
    if (backendRoles.includes('ADMIN')) return getAdminSidebarItems(t);
    if (isAgent) return getAgentSidebarItems(t);
    if (isTenant) return getTenantSidebarItems(t);
    return getOwnerSidebarItems(t);
  }, [sidebarItems, isAgent, isTenant, backendRoles, t]);

  const pageTitle = React.useMemo(() => {
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
      pathname === ROUTES.dashboard.agentSetting ||
      pathname.startsWith(ROUTES.dashboard.agentSetting)
    ) {
      return t('pageTitle.agentSetting');
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
      pathname === ROUTES.dashboard.manageUsers ||
      pathname.startsWith(ROUTES.dashboard.manageUsers)
    ) {
      return t('pageTitle.manageUsers');
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
    return t('pageTitle.default');
  }, [pathname, t]);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === ROUTES.dashboard.root) return pathname === ROUTES.dashboard.root;
    if (href === ROUTES.dashboard.manageUsers) return pathname === ROUTES.dashboard.manageUsers;
    return pathname.startsWith(href + '/');
  };

  const settingsHref = backendRoles.includes('AGENT')
    ? ROUTES.dashboard.agentSetting
    : ROUTES.settings;
  const isSettingsFooterActive = isItemActive(settingsHref);

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
              aria-label='Expand sidebar'
            >
              <Image
                src='/logo.png'
                alt='RealVista Logo'
                width={32}
                height={32}
                className='shrink-0'
              />
            </button>
          ) : (
            <>
              <Link href={`/buy`} className='flex items-center gap-3 group'>
                <div className='flex items-center justify-center rounded-xl bg-primary p-2 transition-transform group-hover:scale-105 shadow-sm shadow-primary/10'>
                  <Image
                    src='/logo.png'
                    alt='RealVista Logo'
                    width={32}
                    height={32}
                    className='shrink-0'
                  />
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
                <Columns className='h-4 w-4' strokeWidth={2} />
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
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className='border-t border-primary/20 p-3'>
          <Link
            href={settingsHref}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
              isSettingsFooterActive
                ? 'bg-primary/5 text-primary font-semibold ring-1 ring-primary/10'
                : 'text-muted-foreground/60 hover:bg-primary/5 hover:text-foreground',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <svg
              className='h-5 w-5 shrink-0'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
            {!isCollapsed && <span className='text-sm font-medium'>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area - Properly fills space without margin hacks */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
        {/* Top Nav */}
        <TopNavContainer variant='dashboard' pageTitle={pageTitle} />

        {/* Page Content - fills remaining height, scrollable */}
        <main className='flex-1 overflow-y-auto bg-muted/30 p-0'>{children}</main>
      </div>
    </div>
  );
}
