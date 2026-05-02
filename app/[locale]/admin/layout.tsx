'use client';

import { AdminDashboardLayout } from '@/widgets/layout';
import { RoleGuard } from '@/shared/lib/auth/role-guard';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={['admin']}
      allowedBackendRoles={['ADMIN']}
      redirectPath='/'
    >
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </RoleGuard>
  );
}
