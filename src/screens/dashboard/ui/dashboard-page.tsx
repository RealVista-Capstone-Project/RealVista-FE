'use client';

import { useEffect } from 'react';
import { OwnerDashboard } from '@/widgets/owner-dashboard';
import { AgentDashboardView } from '@/features/dashboard-agent';
import { useAuthSession } from '@/features/auth/model';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function DashboardPage() {
  const { data: session } = useAuthSession();
  const router = useRouter();
  const locale = useLocale();
  const user = session?.user;
  const backendRoles: string[] = user?.backendRoles ?? [];
  const isAgent = user?.role === 'AGENT' || backendRoles.includes('AGENT');
  const isOwner = user?.role === 'owner' || backendRoles.includes('OWNER');
  const isAdmin = user?.role === 'admin' || backendRoles.includes('ADMIN');

  useEffect(() => {
    if (!session) return;
    if (!isOwner && !isAgent && !isAdmin) {
      router.replace(`/${locale}/buy`);
    }
  }, [isAdmin, isAgent, isOwner, locale, router, session]);

  if (!session) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Please sign in to access the dashboard
        </p>
      </div>
    );
  }

  if (isOwner) {
    return <OwnerDashboard />;
  }
  if (isAgent) {
    return <AgentDashboardView user={user} />;
  }
  // TODO: Tri return cho role admin o day
  // if (isAdmin) {
  //   return <AdminDashboard />;
  // }
  return null;
}
