'use client';

import { RoleGuard } from '@/shared/lib/auth/role-guard';

export default function AgentDashboardSettingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[]} allowedBackendRoles={['AGENT']} redirectPath='/'>
      {children}
    </RoleGuard>
  );
}
