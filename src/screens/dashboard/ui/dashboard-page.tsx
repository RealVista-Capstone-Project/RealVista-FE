'use client';

import { UserProfileHeader } from '@/widgets/user-profile-header';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { LogoutButtonNextAuth } from '@/features/auth/ui';
import { useAuthSession } from '@/features/auth/model';
import { useFCMToken } from '@/features/auth/hooks/use-fcm-token';

/**
 * Dashboard Page
 *
 * Main dashboard interface displaying user information and key metrics.
 * Features:
 * - User profile header with avatar and email
 * - Interactive stat cards
 * - Responsive layout
 * - Smooth animations
 */
export function DashboardPage() {
  const { data: session, status } = useAuthSession();
  const { token, error } = useFCMToken();

  if (status === 'loading') {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Please sign in to access the dashboard
        </p>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
            Dashboard
          </h1>
          <p className='mt-1 text-sm text-secondary/60'>
            Welcome back, {user?.name || user?.email?.split('@')[0]}
          </p>
        </div>

        <LogoutButtonNextAuth>Logout</LogoutButtonNextAuth>
      </div>

      {/* User Profile */}
      <UserProfileHeader user={user} />

      {/* Stats */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <DashboardStats />
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Activity Card */}
        <div className='group relative overflow-hidden rounded-xl border border-primary/20/50 bg-white p-6 shadow-sm transition-all hover:shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Recent Activity</h2>
            <span className='h-2 w-2 rounded-full bg-emerald-500' />
          </div>

          <p className='mb-4 text-sm text-secondary/60'>
            Your recent account activity and updates will appear here.
          </p>

          {/* FCM Token */}
          <div className='rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60'>
            <p className='mb-1 font-semibold text-slate-900 dark:text-slate-50'>
              Push Notification (FCM)
            </p>

            {error ? (
              <p className='text-red-600'>FCM Error: {error}</p>
            ) : token ? (
              <p className='break-all text-emerald-700 dark:text-emerald-400'>Token: {token}</p>
            ) : (
              <p className='text-slate-600 dark:text-slate-400'>Getting token...</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='group relative overflow-hidden rounded-xl border border-primary/20/50 bg-white p-6 shadow-sm transition-all hover:shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Quick Actions</h2>
            <span className='h-2 w-2 rounded-full bg-primary' />
          </div>

          <div className='flex flex-wrap gap-2'>
            {['Profile Settings', 'Security', 'Billing'].map((label) => (
              <button
                key={label}
                className='rounded-lg bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5'
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
