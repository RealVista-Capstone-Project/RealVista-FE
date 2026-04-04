'use client';

import { DashboardLayout } from '@/widgets/layout';
import { RoleGuard } from '@/shared/lib/auth/role-guard';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={['admin', 'moderator']}
      allowedBackendRoles={['OWNER']}
      redirectPath='/'
    >
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
