'use client';

import { DashboardLayout } from '@/widgets/layout';
import { RoleGuard } from '@/shared/lib/auth/role-guard';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={['admin']}
      allowedBackendRoles={['ADMIN']}
      redirectPath='/'
    >
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
