'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Calendar,
  ChevronDown,
  Columns,
  FileText,
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  Users,
  Building2,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Separator } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { ChatWindowRenderer } from '@/widgets/floating-chat-window';
import { NotificationDropdownContainer } from '@/widgets/notification-dropdown';
import { useSession } from 'next-auth/react';

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
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  headerTitle?: string;
  headerSubtitle?: string;
  className?: string;
}

const ownerSidebarItems: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: ROUTES.dashboard.root, icon: LayoutDashboard },
  { id: 'insight', label: 'Insight', href: ROUTES.dashboard.insight, icon: TrendingUp },
  { id: 'listings', label: 'My Listings', href: ROUTES.dashboard.managedListings, icon: Calendar },
  { id: 'tenants', label: 'Tenants', href: ROUTES.dashboard.tenants, icon: Users },
  {
    id: 'manage-agent',
    label: 'Manage Agent',
    href: ROUTES.dashboard.manageAgent,
    icon: Users,
  },
  {
    id: 'owner-properties',
    label: 'Owner Properties',
    href: ROUTES.dashboard.ownerProperties,
    icon: Search,
  },

    id: 'rental-contracts',
    label: 'Rental Contracts',
    href: ROUTES.dashboard.rentalContracts,
    icon: FileText,
  },
  { id: 'manage-agent', label: 'Manage Agent', href: ROUTES.dashboard.manageAgent, icon: Users },
  { id: 'messages', label: 'Message', href: ROUTES.dashboard.messages, icon: MessageCircle },
];

const tenantSidebarItems: SidebarMenuItem[] = [
  { id: 'my-contracts', label: 'My Contracts', href: ROUTES.dashboard.myContracts, icon: FileText },
  { id: 'messages', label: 'Message', href: ROUTES.dashboard.messages, icon: MessageCircle },
  { id: 'property', label: 'Property', href: ROUTES.dashboard.property, icon: Building2 },
];

const defaultUser = { name: 'Francis', initials: 'FR' };

export function DashboardLayout({
  children,
  sidebarItems,
  logoHref = ROUTES.homePage,
  user = defaultUser,
  className,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');
  const { data: session } = useSession();

  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const isTenant = backendRoles.includes('TENANT') && !backendRoles.includes('OWNER');
  const resolvedSidebarItems = sidebarItems ?? (isTenant ? tenantSidebarItems : ownerSidebarItems);

  const pageTitle = React.useMemo(() => {
    if (
      pathname === ROUTES.dashboard.managedListings ||
      pathname.startsWith(ROUTES.dashboard.managedListings)
    )
      return t('pageTitle.managedListings');
    if (pathname === ROUTES.dashboard.insight || pathname.startsWith(ROUTES.dashboard.insight))
      return t('pageTitle.insight');
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
    if (pathname === ROUTES.dashboard.root) return t('pageTitle.dashboard');
    return t('pageTitle.default');
  }, [pathname, t]);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === ROUTES.dashboard.root) return pathname === ROUTES.dashboard.root;
    return pathname.startsWith(href);
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
    <div className={cn('flex min-h-screen w-full', className)}>
      <ChatWindowRenderer />
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-purple-92/50 bg-white transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-70'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center border-purple-92/50 p-5',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {isCollapsed ? (
            <button
              type='button'
              onClick={() => setIsCollapsed(false)}
              className='flex size-8 items-center justify-center rounded-xl bg-main-primary transition-opacity hover:opacity-90'
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
              <Link href={logoHref} className='flex items-center gap-3'>
                <div className='flex items-center justify-center rounded-xl bg-main-primary p-2'>
                  <Image
                    src='/logo.png'
                    alt='RealVista Logo'
                    width={32}
                    height={32}
                    className='shrink-0'
                  />
                </div>
                <div className='flex flex-col'>
                  <span className='text-base font-bold leading-tight text-main-black'>
                    Estatery
                  </span>
                  <span className='text-xs text-main-secondary/60'>Property Manager</span>
                </div>
              </Link>
              <button
                type='button'
                onClick={() => setIsCollapsed(true)}
                className='flex size-8 items-center justify-center rounded-lg border border-purple-92 bg-white text-main-secondary/60 transition-colors hover:bg-purple-98 hover:text-main-secondary'
                aria-label='Collapse sidebar'
              >
                <Columns className='h-4 w-4' strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Menu Items */}
        <nav className='flex flex-1 flex-col gap-1 p-3'>
          {resolvedSidebarItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  isActive
                    ? 'bg-purple-96 text-main-primary'
                    : 'text-main-secondary/60 hover:bg-purple-98 hover:text-main-secondary',
                  isCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className='h-5 w-5 shrink-0' strokeWidth={2} />
                {!isCollapsed && <span className='text-sm font-medium'>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className='border-t border-purple-92/50 p-3'>
          <Link
            href={ROUTES.settings}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-main-secondary/60 transition-colors hover:bg-purple-98 hover:text-main-secondary',
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

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top Nav */}
        <header className='flex items-center justify-between bg-white px-10 py-4'>
          <div className='flex items-center gap-4'>
            <span className='font-bold text-[24px] leading-[1.5] tracking-[-0.24px] text-main-black'>
              {pageTitle}
            </span>
          </div>
          <div className='flex items-center gap-6'>
            <NotificationDropdownContainer />
            <div className='flex h-10 items-center'>
              <Separator orientation='vertical' className='h-6 bg-purple-92' />
            </div>
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
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 bg-purple-98 p-4 md:p-6'>{children}</main>
      </div>
    </div>
  );
}
