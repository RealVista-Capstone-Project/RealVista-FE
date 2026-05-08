'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { useAuthSession } from '@/features/auth/model';
import { useTranslations } from 'next-intl';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/shared/ui/tooltip';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { RevenueTable } from './revenue-table';

import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@/entities/admin/api';
import { parseISO, format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ShieldAlert, Clock,
  TrendingUp, Home, DollarSign, Package, Users,
  ChevronLeft, ChevronRight,
  Rocket, Building2, Flame,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/shared/ui/badge';
import { cn, formatVND } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/config/routes';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const formatChartDate = (dateStr: unknown): string => {
  try {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const date = parseISO(dateStr);
    return format(date, 'dd/MM', { locale: vi });
  } catch {
    return typeof dateStr === 'string' ? dateStr : '';
  }
};

const formatRevenueAxis = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
};

const CustomTooltip = ({
  active,
  payload,
  label,
  isCurrency,
}: {
  active?: boolean;
  payload?: { color?: string; fill?: string; stroke?: string; name: string; value: number }[];
  label?: string;
  isCurrency?: boolean;
  t?: (key: string) => string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-xl border border-slate-100 bg-white p-3 shadow-lg'>
        <p className='mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400'>
          {formatChartDate(label)}
        </p>
        <div className='space-y-1'>
          {payload.map((entry, index) => (
            <div key={index} className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <div
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
                />
                <span className='text-xs text-slate-600'>{entry.name}:</span>
              </div>
              <span className='text-xs font-bold text-slate-900'>
                {isCurrency ? formatVND(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  action,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-4 mb-6'>
      <div className='flex items-center gap-3'>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconColor)}>
          <Icon className='h-4 w-4' />
        </div>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
          {subtitle && (
            <p className='text-xs text-slate-400 mt-0.5'>{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function AdminDashboard() {
  const { status } = useAuthSession();
  const t = useTranslations('Dashboard');
  const [days, setDays] = useState(7);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, days);
    return {
      startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
    };
  }, [days]);

  const { data: stats, isLoading, error } = useQuery({
    ...adminQueries.stats(startDate),
    refetchInterval: 30000,
  });

  const { data: txPage, isLoading: isTxLoading } = useQuery({
    ...adminQueries.transactions(currentPage, 10, activeTab, startDate, endDate),
    refetchInterval: 30000,
  });

  const translatedPackageInsights = useMemo(() => {
    return (stats?.package_insights ?? []).map((item) => ({
      ...item,
      translatedLabel: item.label,
    }));
  }, [stats?.package_insights]);

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex h-full items-center justify-center py-32'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-primary' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh] gap-4'>
        <ShieldAlert className='h-10 w-10 text-rose-500' />
        <h2 className='text-base font-semibold text-slate-900'>Đã có lỗi xảy ra khi tải dữ liệu</h2>
        <p className='text-sm text-slate-500'>
          {(error as { payload?: { message?: string }; message?: string })?.payload?.message ||
            (error as { message?: string })?.message ||
            'Vui lòng kiểm tra lại kết nối API'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className='px-5 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors'
        >
          Thử lại
        </button>
      </div>
    );
  }

  const userGrowth = stats?.user_growth ?? [];
  const listingGrowth = stats?.listing_growth ?? [];
  const revenueTrend = stats?.revenue_trend ?? [];
  const topAgents = stats?.top_agents ?? [];
  const topListings = stats?.top_listings ?? [];

  const totalTxPages = txPage?.total_pages ?? txPage?.totalPages ?? 1;

  return (
    <div className='space-y-6 p-6'>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-slate-900'>{t('platformOverview')}</h2>
          <p className='mt-0.5 text-sm text-slate-500'>{t('allSystemsOperational')}</p>
        </div>

        {/* Period selector */}
        <div className='flex items-center gap-1 self-start rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:self-auto'>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200',
                days === d
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {t(`days${d}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <DashboardStats days={days} />
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Revenue trend */}
        <SectionCard>
          <SectionHeader
            icon={DollarSign}
            iconColor='bg-emerald-50 text-emerald-600'
            title={t('revenueBreakdown')}
            subtitle={t(`days${days}`)}
          />
          <div className='h-[240px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
                <XAxis
                  dataKey='label'
                  stroke='#cbd5e1'
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatChartDate}
                  dy={8}
                />
                <YAxis
                  stroke='#cbd5e1'
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatRevenueAxis}
                  width={52}
                />
                <RechartsTooltip content={<CustomTooltip isCurrency />} />
                <Legend
                  verticalAlign='top'
                  align='right'
                  iconType='circle'
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: '600' }}
                />
                <Line type='monotone' dataKey='extra.AI'      name={t('revenueAI')}      stroke='#8b5cf6' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type='monotone' dataKey='extra.BOOST'   name={t('revenueBoost')}   stroke='#10b981' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type='monotone' dataKey='extra.LISTING' name={t('revenueListing')} stroke='#f59e0b' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type='monotone' dataKey='extra.TOUR'    name={t('revenueTour')}    stroke='#3b82f6' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* User registrations */}
        <SectionCard>
          <SectionHeader
            icon={TrendingUp}
            iconColor='bg-primary/10 text-primary'
            title={t('userRegistrations')}
            subtitle={t(`days${days}`)}
          />
          <div className='h-[240px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={userGrowth} barCategoryGap='35%'>
                <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
                <XAxis
                  dataKey='label'
                  stroke='#cbd5e1'
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatChartDate}
                  dy={8}
                />
                <YAxis stroke='#cbd5e1' fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar
                  dataKey='value'
                  name={t('newRegistration')}
                  fill='#6366f1'
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Transaction Table ──────────────────────────────────── */}
      <SectionCard>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600'>
              <DollarSign className='h-4 w-4' />
            </div>
            <div>
              <h3 className='text-sm font-semibold text-slate-900'>{t('detailedRevenueAnalysis')}</h3>
              <div className='flex items-center gap-1.5 mt-0.5'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
                <p className='text-xs text-slate-400'>Dữ liệu thời gian thực</p>
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => { setActiveTab(val); setCurrentPage(0); }}
            className='w-full sm:w-auto'
          >
            <TabsList className='h-auto flex-wrap gap-0.5 rounded-xl border border-slate-100 bg-slate-50 p-1'>
              {[
                { value: 'ALL',     label: 'Tất cả' },
                { value: 'BOOST',   label: 'Boosting' },
                { value: 'LISTING', label: 'Tin đăng' },
                { value: '3D_TOUR', label: '3D Tour' },
                { value: 'AI',      label: 'AI' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <RevenueTable transactions={txPage?.content ?? []} isLoading={isTxLoading} />

        {/* Pagination */}
        <div className='mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-50 pt-5 sm:flex-row'>
          <p className='text-xs text-slate-400'>
            Trang {currentPage + 1} / {totalTxPages} · {txPage?.total_elements ?? txPage?.totalElements ?? 0} giao dịch
          </p>
          <div className='flex items-center gap-1.5'>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || isTxLoading}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            {(() => {
              const maxVisible = 5;
              let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
              const endPage = Math.min(totalTxPages - 1, startPage + maxVisible - 1);
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(0, endPage - maxVisible + 1);
              }
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-1 text-xs font-semibold transition-all',
                    currentPage === p
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {p + 1}
                </button>
              ));
            })()}
            <button
              onClick={() => setCurrentPage((p) => (p + 1 < totalTxPages ? p + 1 : p))}
              disabled={currentPage + 1 >= totalTxPages || isTxLoading}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Listing trend ──────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={Home}
          iconColor='bg-rose-50 text-rose-500'
          title={t('listingCreationTrend')}
          subtitle={t(`days${days}`)}
        />
        <div className='h-[220px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={listingGrowth} barCategoryGap='35%'>
              <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
              <XAxis
                dataKey='label'
                stroke='#cbd5e1'
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatChartDate}
                dy={8}
              />
              <YAxis stroke='#cbd5e1' fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar
                dataKey='value'
                name={t('newListing')}
                fill='#f43f5e'
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ── Package Distribution & Top Agents ──────────────────── */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Pie chart */}
        <SectionCard>
          <SectionHeader
            icon={Package}
            iconColor='bg-indigo-50 text-indigo-600'
            title={t('packageInsights')}
            subtitle={t(`days${days}`)}
          />

          <div className='flex flex-col gap-6'>
            <div className='relative h-[200px] w-full'>
              <div className='pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-center'>
                <p className='text-2xl font-bold text-slate-900 leading-tight'>
                  {translatedPackageInsights.reduce((s, i) => s + i.value, 0)}
                </p>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-slate-400'>
                  {t('activePlans')}
                </p>
              </div>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={translatedPackageInsights}
                    cx='50%'
                    cy='50%'
                    innerRadius={64}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey='value'
                    nameKey='translatedLabel'
                  >
                    {translatedPackageInsights.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke='none'
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className='space-y-3'>
              {translatedPackageInsights.map((entry, index) => {
                const total = translatedPackageInsights.reduce((s, i) => s + i.value, 0);
                const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                const color = COLORS[index % COLORS.length];
                return (
                  <div key={entry.id || index} className='flex flex-col gap-1.5'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='h-2.5 w-2.5 shrink-0 rounded-full' style={{ backgroundColor: color }} />
                        <span className='text-xs font-medium text-slate-700'>{entry.translatedLabel}</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-xs font-semibold text-slate-900'>{entry.value}</span>
                        <span className='text-[10px] text-slate-400'>({percent}%)</span>
                      </div>
                    </div>
                    <div className='h-1 w-full overflow-hidden rounded-full bg-slate-100'>
                      <div
                        className='h-full rounded-full transition-all duration-700'
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* Top Agents */}
        <SectionCard className='lg:col-span-2'>
          <SectionHeader
            icon={Users}
            iconColor='bg-indigo-50 text-indigo-600'
            title={t('topAgentsActivity')}
            subtitle={t(`days${days}`)}
            action={
              <Link
                href={ROUTES.dashboard.manageUsers}
                className='text-xs font-semibold text-primary hover:underline'
              >
                {t('viewAllLogs')}
              </Link>
            }
          />

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-slate-50'>
                  <th className='pb-3 text-left text-xs font-semibold text-slate-400'>{t('topPerformer')}</th>
                  <th className='pb-3 text-center text-xs font-semibold text-slate-400'>{t('listingCount')}</th>
                  <th className='pb-3 text-right text-xs font-semibold text-slate-400'>{t('revenueGenerated')}</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-50'>
                {topAgents.map((agent, index) => (
                  <tr key={agent.id} className='group'>
                    <td className='py-3'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold',
                            index === 0
                              ? 'bg-amber-100 text-amber-700'
                              : index === 1
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-indigo-50 text-indigo-500'
                          )}
                        >
                          {agent.avatar_url ? (
                            <Image
                              src={agent.avatar_url}
                              alt={agent.name}
                              width={36}
                              height={36}
                              className='object-cover'
                            />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-slate-900'>{agent.name}</p>
                          <p className='text-xs text-slate-400'>{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='py-3 text-center'>
                      <span className='inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700'>
                        {agent.listing_count ?? 0}
                      </span>
                    </td>
                    <td className='py-3 text-right'>
                      <span className='text-sm font-semibold text-slate-900'>
                        {agent.revenue_generated > 0 ? formatVND(agent.revenue_generated) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ── Top Listings ──────────────────────────────────────── */}
      <SectionCard className='mb-2'>
        <SectionHeader
          icon={Home}
          iconColor='bg-rose-50 text-rose-500'
          title={t('topListings')}
          subtitle={t(`days${days}`)}
        />
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-50'>
                <th className='pb-3 text-left text-xs font-semibold text-slate-400'>{t('trending')}</th>
                <th className='pb-3 text-center text-xs font-semibold text-slate-400'>{t('totalViews')}</th>
                <th className='pb-3 text-right text-xs font-semibold text-slate-400'>{t('revenueBoost')}</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {topListings.map((listing) => (
                <tr key={listing.id} className='group'>
                  <td className='py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='relative h-12 w-18 shrink-0 overflow-hidden rounded-xl bg-slate-100'>
                        {listing.thumbnail_url ? (
                          <Image
                            src={listing.thumbnail_url}
                            alt={listing.title}
                            fill
                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-slate-300'>
                            <Home className='h-5 w-5' />
                          </div>
                        )}
                      </div>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-slate-900'>{listing.title}</p>
                        <p className='text-[10px] text-slate-400'>ID: {listing.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className='py-3 text-center'>
                    <span className='text-sm font-semibold text-slate-700'>{listing.views}</span>
                  </td>
                  <td className='py-3 text-right'>
                    <div className='flex items-center justify-end gap-1.5'>
                      {listing.breakdown?.FEATURED && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600'>
                                <Rocket className='h-3.5 w-3.5' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className='text-xs'>{t('FEATURED')}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {listing.breakdown?.HOT_BADGE && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600'>
                                <Flame className='h-3.5 w-3.5' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className='text-xs'>{t('HOT_BADGE')}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {listing.has3dTour && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='rounded-lg border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-600'>
                                <Building2 className='h-3.5 w-3.5' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className='text-xs'>3D Virtual Tour</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {!listing.breakdown?.FEATURED &&
                        !listing.breakdown?.HOT_BADGE &&
                        !listing.has3dTour && (
                          <span className='text-xs text-slate-400 italic'>{t('none')}</span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
