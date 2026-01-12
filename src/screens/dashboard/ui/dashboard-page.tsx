'use client';

import { UserProfileHeader } from '@/widgets/user-profile-header';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { LogoutButtonNextAuth } from '@/features/auth/ui';
import { useAuthSession } from '@/features/auth/model';

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

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg text-slate-600 dark:text-slate-400'>Please sign in to access the dashboard</p>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'>
      {/* Subtle decorative background elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-slate-200/30 to-transparent dark:from-slate-800/20 blur-3xl' />
        <div className='absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-slate-300/20 to-transparent dark:from-slate-700/10 blur-3xl' />
      </div>

      {/* Main content */}
      <div className='relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header Section */}
        <div className='mb-8 flex items-center justify-between'>
          <div className='mb-2'>
            <h1 className='text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl'>
              Dashboard
            </h1>
            <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
              Welcome back, {user?.name || user?.email?.split('@')[0]}
            </p>
          </div>
          <LogoutButtonNextAuth>Logout</LogoutButtonNextAuth>
        </div>

        {/* User Profile Section */}
        <div className='mb-8'>
          <UserProfileHeader user={user} />
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          <DashboardStats />
        </div>

        {/* Additional Dashboard Content */}
        <div className='mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Activity Card */}
          <div className='group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300/50 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/80 dark:hover:border-slate-600/50'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                Recent Activity
              </h2>
              <div className='h-2 w-2 rounded-full bg-emerald-500' />
            </div>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Your recent account activity and updates will appear here.
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className='group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300/50 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/80 dark:hover:border-slate-600/50'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                Quick Actions
              </h2>
              <div className='h-2 w-2 rounded-full bg-blue-500' />
            </div>
            <div className='flex flex-wrap gap-2'>
              <button className='rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                Profile Settings
              </button>
              <button className='rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                Security
              </button>
              <button className='rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
