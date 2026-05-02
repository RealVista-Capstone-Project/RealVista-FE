'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthSession } from '@/features/auth/model';
import { AdminDashboard } from '@/widgets/admin-dashboard';
import { OwnerDashboard } from '@/widgets/owner-dashboard';
import { AgentDashboardView } from '@/features/dashboard-agent';

/**
 * Unified Dashboard Page
 * Renders appropriate dashboard based on user role.
 */
export function DashboardPage() {
  const { data: session, status } = useAuthSession();
  const router = useRouter();
  const locale = useLocale();

  const user = session?.user;
  const backendRoles: string[] = user?.backendRoles ?? [];
  const isAgent = user?.role === 'AGENT' || backendRoles.includes('AGENT');
  const isOwner = user?.role === 'owner' || backendRoles.includes('OWNER');
  const isAdmin = user?.role === 'admin' || backendRoles.includes('ADMIN');

  useEffect(() => {
    if (status === 'loading' || !session) return;

    // Redirect if user has no authorized roles for dashboard
    if (!isOwner && !isAgent && !isAdmin) {
      router.replace(`/${locale}/buy`);
    }
  }, [isAdmin, isAgent, isOwner, locale, router, session, status]);

  if (status === 'loading') {
    return (
      <div className='flex h-full min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary dark:border-slate-800 dark:border-t-primary' />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex h-full min-h-screen items-center justify-center'>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Please sign in to access the dashboard
        </p>
      </div>
    );
  }

  // Render dashboard based on prioritized role
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isAgent) {
    return <AgentDashboardView />;
  }

  if (isOwner) {
    return <OwnerDashboard />;
  }

  return null;
}
