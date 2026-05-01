'use client';

import * as React from 'react';
import { useAuthSession } from '@/features/auth/model';
import { useFCMToken } from '@/features/auth/hooks/use-fcm-token';
import { AdminDashboard } from '@/widgets/admin-dashboard';
import { OwnerDashboard } from '@/widgets/owner-dashboard';

/**
 * Unified Dashboard Page
 * Renders appropriate dashboard based on user role.
 */
export function DashboardPage() {
  const { data: session, status } = useAuthSession();
  useFCMToken();

  if (status === 'loading') {
    return (
      <div className='flex h-full min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary dark:border-slate-800 dark:border-t-primary' />
      </div>
    );
  }

  // Determine which dashboard to show based on role
  const role = session?.user?.role;

  if (role === 'admin' || role === 'moderator') {
    return <AdminDashboard />;
  }

  // Default to OwnerDashboard for owners or others who should see the main dashboard
  // This maintains the logic from the develop branch
  return <OwnerDashboard />;
}
