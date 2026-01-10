'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import type { Session } from 'next-auth';

interface UserProfileHeaderProps {
  user?: Session['user'];
}

/**
 * UserProfileHeader Widget
 *
 * Displays user profile information with avatar and details.
 * Features:
 * - Elegant avatar with fallback
 * - User name and email display
 * - Role badge
 * - Hover effects
 */
export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || '?';
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      case 'moderator':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';
    }
  };

  return (
    <div className='group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300/50 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-900/80 dark:hover:border-slate-600/50'>
      {/* Decorative gradient accent */}
      <div className='absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 dark:from-slate-400 dark:via-slate-300 dark:to-slate-400' />

      <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
        {/* Avatar Section */}
        <div className='flex-shrink-0'>
          <div className='relative'>
            <Avatar className='h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-slate-200 ring-offset-2 transition-all duration-300 group-hover:ring-slate-300 dark:ring-slate-700 dark:ring-offset-slate-900 group-hover:dark:ring-slate-600'>
              {user?.image ? (
                <AvatarImage src={user.image} alt={user.name || user.email || 'User'} />
              ) : (
                <AvatarFallback className='bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-semibold text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200'>
                  {getInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            {/* Status indicator */}
            <div className='absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900' />
          </div>
        </div>

        {/* User Info Section */}
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          {/* Name and Role */}
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-50 truncate'>
              {user?.name || 'User'}
            </h2>
            {user?.role && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor()} whitespace-nowrap`}>
                {user.role}
              </span>
            )}
          </div>

          {/* Email */}
          <p className='text-sm text-slate-600 dark:text-slate-400 truncate font-mono'>
            {user?.email}
          </p>

          {/* Additional Info */}
          <div className='flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-500 mt-1'>
            <div className='flex items-center gap-1.5'>
              <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
              <span>Active</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className='flex-shrink-0'>
          <button className='rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
