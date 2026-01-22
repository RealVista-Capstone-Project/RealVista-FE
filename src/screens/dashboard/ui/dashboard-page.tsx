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
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-main-black sm:text-3xl'>
            Dashboard
          </h1>
          <p className='mt-1 text-sm text-main-secondary/60'>
            Welcome back, {user?.name || user?.email?.split('@')[0]}
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className='mb-4'>
        <UserProfileHeader user={user} />
      </div>

      {/* Stats Section */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <DashboardStats />
      </div>

      {/* Additional Dashboard Content */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Activity Card */}
        <div className='group relative overflow-hidden rounded-xl border border-purple-92/50 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-main-black'>Recent Activity</h2>
            <div className='h-2 w-2 rounded-full bg-emerald-500' />
          </div>
          <p className='text-sm text-main-secondary/60'>
            Your recent account activity and updates will appear here.
          </p>
        </div>

        {/* Quick Actions Card */}
        <div className='group relative overflow-hidden rounded-xl border border-purple-92/50 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-main-black'>Quick Actions</h2>
            <div className='h-2 w-2 rounded-full bg-main-primary' />
          </div>
          <div className='flex flex-wrap gap-2'>
            <button className='rounded-lg bg-purple-98 px-3 py-1.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-96'>
              Profile Settings
            </button>
            <button className='rounded-lg bg-purple-98 px-3 py-1.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-96'>
              Security
            </button>
            <button className='rounded-lg bg-purple-98 px-3 py-1.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-96'>
              Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
