'use client';

import { Users } from 'lucide-react';
import { DashboardLayout } from '@/widgets/layout';
import { RoleGuard } from '@/shared/lib/auth/role-guard';
import { ROUTES } from '@/shared/config/routes';
import { useTranslations } from 'next-intl';

export default function ManageAgentRouteLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('ManageAgent');

  const sidebarItems = [
    {
      id: 'manage-agent',
      label: t('sidebar.manageAgents'),
      href: ROUTES.manageAgent.root,
      icon: Users,
      isActive: true,
    },
  ];

  return (
    <RoleGuard allowedRoles={['owner']} redirectPath='/'>
      <DashboardLayout
        sidebarItems={sidebarItems}
        headerTitle={t('title')}
        headerSubtitle={t('subtitle')}
      >
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
