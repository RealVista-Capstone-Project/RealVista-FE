'use client';

import { DashboardLayout } from '@/widgets/layout';
import { RoleGuard } from '@/shared/lib/auth/role-guard';
import { useRouter } from '@/shared/config/i18n/navigation';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RoleGuard allowedRoles={['admin', 'moderator']} redirectPath='/'>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
