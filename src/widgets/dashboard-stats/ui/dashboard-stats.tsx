'use client';

import { Clock, Folder, Database } from 'lucide-react';

/**
 * DashboardStats Widget
 *
 * Displays key metrics and statistics in an elegant card layout.
 * Features:
 * - Animated stat cards
 * - Icon-based visual hierarchy
 * - Hover effects
 * - Trend indicators
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description: string;
  delay: number;
}

function StatCard({ title, value, icon: Icon, trend, description, delay }: StatCardProps) {
  return (
    <div
      className='group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300/50 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/80 dark:hover:border-slate-600/50'
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      }}
    >
      {/* Decorative gradient background on hover */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-100/0 transition-opacity duration-300 group-hover:from-slate-50/50 group-hover:to-slate-100/50 dark:from-slate-800/0 dark:to-slate-700/0 dark:group-hover:from-slate-800/30 dark:group-hover:to-slate-700/30' />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div className='rounded-xl bg-slate-100 p-2.5 transition-colors duration-200 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700'>
            <Icon className='h-5 w-5 text-slate-600 dark:text-slate-400' />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? (
                <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 10l7-7m0 0l7 7m-7-7v18' />
                </svg>
              ) : (
                <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
                </svg>
              )}
              {trend.value}
            </div>
          )}
        </div>

        {/* Value */}
        <div className='mb-1'>
          <h3 className='text-3xl font-semibold text-slate-900 dark:text-slate-50'>{value}</h3>
        </div>

        {/* Title and Description */}
        <div>
          <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>{title}</p>
          <p className='mt-1 text-xs text-slate-500 dark:text-slate-500'>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  return (
    <>
      <StatCard
        title='Total Sessions'
        value='128'
        icon={Clock}
        trend={{ value: '12%', isPositive: true }}
        description='Active sessions this month'
        delay={0}
      />

      <StatCard
        title='Projects'
        value='24'
        icon={Folder}
        trend={{ value: '8%', isPositive: true }}
        description='Active projects'
        delay={0.1}
      />

      <StatCard
        title='Storage Used'
        value='2.4 GB'
        icon={Database}
        trend={{ value: '3%', isPositive: false }}
        description='of 10 GB total storage'
        delay={0.2}
      />
    </>
  );
}
