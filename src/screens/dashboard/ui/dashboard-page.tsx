'use client';

import React from 'react';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { useAuthSession } from '@/features/auth/model';
import { useFCMToken } from '@/features/auth/hooks/use-fcm-token';
import { useTranslations } from 'next-intl';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@/entities/admin/api';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ShieldAlert, User as UserIcon, Clock, CheckCircle2, TrendingUp, Home, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/features/tenant-application/lib/utils';

const COLORS = ['#0f172a', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const formatChartDate = (dateStr: any) => {
  try {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const date = parseISO(dateStr);
    return format(date, 'dd/MM', { locale: vi });
  } catch {
    return dateStr;
  }
};

const formatRevenueAxis = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
};

export function DashboardPage() {
  const { status } = useAuthSession();
  useFCMToken();
  const t = useTranslations('Dashboard');

  const { data: stats, isLoading } = useQuery(adminQueries.stats());

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  const recentActivities = stats?.recent_activities ?? [];
  const topUrgentReports = stats?.top_urgent_reports ?? [];
  const userGrowth = stats?.user_growth ?? [];
  const listingStatus = stats?.listing_status ?? [];
  const revenueTrend = stats?.revenue_trend ?? [];
  const topAgents = stats?.top_agents ?? [];
  const systemHealth = stats?.system_health ?? {};

  return (
    <div className='flex-1 space-y-8 p-8 pt-6 bg-slate-50/50 dark:bg-slate-950 min-h-screen'>
      <div className='flex flex-col gap-2'>
        <h2 className='text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50'>
          {t('platformOverview')}
        </h2>
        <p className='text-slate-500 dark:text-slate-400'>
          {t('realTimeInsights')}
        </p>
      </div>

      {/* Stats - Top Row */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <DashboardStats />
      </div>

      {/* Main Charts Row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* User Growth Chart */}
        <div className='rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-bold flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-primary' />
              {t('userRegistrations')}
            </h3>
          </div>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowth}>
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatChartDate}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [value, t('userRegistrations')]}
                  labelFormatter={formatChartDate}
                />
                <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className='rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-bold flex items-center gap-2'>
              <DollarSign className='h-5 w-5 text-emerald-600' />
              {t('revenueTrend')}
            </h3>
          </div>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatChartDate}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatRevenueAxis}
                  width={80}
                />

                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [formatCurrency(Number(value)), t('totalRevenue')]}
                  labelFormatter={formatChartDate}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribution & Activity Row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-7'>
        {/* Listing Distribution & Top Agents */}
        <div className='col-span-1 lg:col-span-3 space-y-6'>
          {/* Listing Distribution */}
          <div className='rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-bold mb-6 flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-primary' />
              {t('listingDistribution')}
            </h3>
            <div className='h-[200px] w-full'>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={listingStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    minAngle={15}
                    dataKey="value"
                    nameKey="label"
                  >
                    {listingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value, name) => [value, t(name as string)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-2'>
              {listingStatus.map((entry, index) => (
                <div key={entry.label} className='flex items-center gap-2'>
                  <div className='h-3 w-3 rounded-full' style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className='text-[10px] font-medium text-slate-600 dark:text-slate-400'>
                    {t(entry.label)}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Agents */}
          <div className='rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
             <h3 className='text-lg font-bold mb-6 flex items-center gap-2'>
              <UserIcon className='h-5 w-5 text-indigo-600' />
              {t('topAgents')}
            </h3>
            <div className='space-y-3'>
              {topAgents.length === 0 ? (
                <div className='text-sm text-slate-500 text-center py-4 italic'>{t('empty')}</div>
              ) : topAgents.map((agent: any, index: number) => (
                <div key={agent.label} className='flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50'>
                   <div className='flex items-center gap-2'>
                    <div className='flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold'>
                      {index + 1}
                    </div>
                    <span className='text-xs font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]'>{agent.label}</span>
                  </div>
                  <span className='text-sm font-bold'>{agent.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className='col-span-1 lg:col-span-4 rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[750px]'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-bold flex items-center gap-2'>
              <Clock className='h-5 w-5 text-primary' />
              {t('recentActivities')}
            </h3>
          </div>
          <div className='space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1'>
            {recentActivities.length === 0 ? (
              <div className='text-sm text-slate-500 text-center py-8'>{t('empty')}</div>
            ) : recentActivities.map((activity: any) => (
              <div key={activity.id} className='relative flex gap-4 p-2 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group'>
                <div className='flex flex-col items-center'>
                  <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-slate-800 ${
                    activity.type === 'REPORT' ? 'border-rose-200 text-rose-600' :
                    activity.type === 'LISTING' ? 'border-amber-200 text-amber-600' :
                    activity.type === 'TRANSACTION' ? 'border-emerald-200 text-emerald-600' :
                    'border-blue-200 text-blue-600'
                  }`}>
                    {activity.type === 'REPORT' ? <ShieldAlert className='h-4 w-4' /> :
                     activity.type === 'LISTING' ? <Home className='h-4 w-4' /> :
                     activity.type === 'TRANSACTION' ? <DollarSign className='h-4 w-4' /> :
                     <UserIcon className='h-4 w-4' />}
                  </div>

                  <div className='h-full w-px bg-slate-100 dark:bg-slate-800 group-last:hidden' />
                </div>
                <div className='flex flex-col gap-1 pb-2'>
                  <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
                    {activity.description
                      .replace('Người dùng mới đăng ký:', 'Người dùng mới đăng ký:')
                      .replace('Tin đăng được cập nhật:', 'Tin đăng được cập nhật:')
                      .replace('New report:', 'Báo cáo mới:')
                    }
                  </p>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-slate-500'>
                      {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      activity.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      activity.status === 'RESOLVED' || activity.status === 'SUCCESS' || activity.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t(activity.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div className='rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <h3 className='text-lg font-bold mb-6 flex items-center gap-2'>
          <ShieldAlert className='h-5 w-5 text-emerald-600' />
          {t('moderationPerformance')}
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {Object.entries(systemHealth).map(([key, value]) => (
            <div key={key} className='space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium text-slate-600 dark:text-slate-400'>{t(key)}</span>
                <span className='font-bold text-slate-900 dark:text-slate-100'>{value as any}</span>
              </div>
              <div className='h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden'>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (Number(value) / 100) * 100)}%` }}
                  className='h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Urgent Issues - Quick Actions */}
      <div className='rounded-2xl border-2 border-rose-100 bg-rose-50/30 p-6 dark:border-rose-900/20 dark:bg-rose-950/10'>
        <div className='flex items-center justify-between mb-6'>
           <h3 className='text-lg font-bold flex items-center gap-2 text-rose-600'>
            <ShieldAlert className='h-5 w-5' />
            {t('topUrgentReports')}
          </h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
           {topUrgentReports.map((report: any) => (
              <div key={report.id} className='group rounded-xl border border-white bg-white/80 p-4 transition-all hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'>
                <p className='text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2'>
                  {report.description
                    .replace('New report:', 'Báo cáo mới:')
                  }
                </p>
                <div className='flex items-center justify-between'>
                  <span className='text-[10px] text-slate-500'>
                    {report.timestamp ? formatDistanceToNow(new Date(report.timestamp), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                  </span>
                  <Link
                    href={`/admin/manage-reports?id=${report.target_id}`}
                    className='text-[10px] font-bold text-rose-600 hover:underline'
                  >
                    {t('resolve')}
                  </Link>
                </div>
              </div>
            ))}
            {topUrgentReports.length === 0 && (
               <div className='col-span-4 py-8 text-center text-slate-500 italic'>
                  {t('noUrgentIssues')}
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
