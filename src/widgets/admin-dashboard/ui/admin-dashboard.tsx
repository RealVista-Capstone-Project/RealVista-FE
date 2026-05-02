'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { useAuthSession } from '@/features/auth/model';
import { useTranslations } from 'next-intl';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/shared/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { RevenueTable } from './revenue-table';

import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@/entities/admin/api';
import { parseISO, format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ShieldAlert, User as UserIcon, Clock,
  TrendingUp, Home, DollarSign, Package, Users,
  ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight,
  Rocket, Building2, Flame
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/shared/ui/badge';
import { cn, formatVND } from '@/shared/lib/utils';

const COLORS = ['#0f172a', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

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
  return new Intl.NumberFormat('vi-VN').format(val) + ' vnđ';
};

const CustomTooltip = ({ active, payload, label, t, isCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">{formatChartDate(label)}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill || entry.stroke }} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{entry.name}:</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {typeof entry.value === 'number' && (isCurrency || entry.name.toLowerCase().includes('doanh thu') || entry.name.toLowerCase().includes('revenue'))
                  ? formatVND(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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
      endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss")
    };
  }, [days]);

  // Don't pass endDate to keep it always up to the current moment on every refetch
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
      translatedLabel: item.label
    }));
  }, [stats?.package_insights]);

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary dark:border-slate-800 dark:border-t-primary' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh] gap-4'>
        <ShieldAlert className='h-12 w-12 text-rose-500' />
        <h2 className='text-xl font-black text-slate-900'>Đã có lỗi xảy ra khi tải dữ liệu</h2>
        <p className='text-sm text-slate-500'>{(error as any)?.payload?.message || (error as any)?.message || 'Vui lòng kiểm tra lại kết nối API'}</p>
        <button
          onClick={() => window.location.reload()}
          className='px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all'
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

  return (
    <div className='flex-1 space-y-8 p-8 pt-6 bg-[#f8fafc] dark:bg-slate-950 min-h-screen'>
      {/* Header section */}
      <div className='flex flex-col gap-2'>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {t('allSystemsOperational')}
          </Badge>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className='text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50'>
            {t('platformOverview')}
          </h2>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all duration-300",
                  days === d
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {t(`days${d}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <DashboardStats days={days} />
      </div>

      {/* Main Analytics Row: Revenue Breakdown & User Growth */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Revenue Breakdown Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
        >
          <div className='flex items-center justify-between mb-8'>
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <DollarSign className='h-5 w-5 text-emerald-500' />
                {t('revenueBreakdown')}
                <Clock className="h-3 w-3 text-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
          </div>
          <div className='h-[350px] w-full'>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatChartDate}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatRevenueAxis}
                  width={60}
                />
                <RechartsTooltip content={<CustomTooltip t={t} isCurrency={true} />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="extra.AI"
                  name={t('revenueAI')}
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="extra.BOOST"
                  name={t('revenueBoost')}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="extra.LISTING"
                  name={t('revenueListing')}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="extra.TOUR"
                  name={t('revenueTour')}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Growth Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
        >
          <div className='flex items-center justify-between mb-8'>
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <TrendingUp className='h-5 w-5 text-primary' />
                {t('userRegistrations')}
                <Clock className="h-3 w-3 text-primary animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
          </div>
          <div className='h-[350px] w-full'>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatChartDate}
                  dy={10}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip t={t} />} />
                <Bar
                  dataKey="value"
                  name={t('newRegistration')}
                  fill="#0f172a"
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Revenue Analysis Table - Moved Up and Improved UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
      >
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className="flex flex-col gap-1">
              <h3 className='text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white'>
                <DollarSign className='h-6 w-6 text-emerald-500' />
                {t('detailedRevenueAnalysis')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu giao dịch thời gian thực</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(0); }} className="w-full sm:w-auto">
              <TabsList className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 h-auto flex flex-wrap justify-start sm:justify-center">
                {[
                  { value: 'ALL', label: 'Tất cả' },
                  { value: 'BOOST', label: 'Boosting' },
                  { value: 'LISTING', label: 'Tin đăng' },
                  { value: '3D_TOUR', label: '3D Tour' },
                  { value: 'AI', label: 'AI Request' }
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-5 py-2 rounded-xl text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-4">
            <RevenueTable
              transactions={txPage?.content ?? []}
              isLoading={isTxLoading}
            />

            {/* Premium Pagination Controls */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100 dark:border-slate-800 pt-8">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
                  Trang {currentPage + 1} / {txPage?.total_pages ?? txPage?.totalPages ?? 1}
                </p>
                <p className="text-[11px] font-bold text-slate-500 text-center sm:text-left">
                  Hiển thị {txPage?.content?.length || 0} trên tổng số {txPage?.total_elements ?? txPage?.totalElements ?? 0} giao dịch
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentPage === 0 || isTxLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('previous')}
                </button>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                  {(() => {
                    const totalPages = txPage?.total_pages ?? txPage?.totalPages ?? 1;
                    const maxVisible = 5;
                    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
                    const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(0, endPage - maxVisible + 1);
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={cn(
                            "min-w-[32px] h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all",
                            currentPage === i
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg scale-110"
                              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {i + 1}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => (prev + 1 < (txPage?.total_pages ?? txPage?.totalPages ?? 1) ? prev + 1 : prev))}
                  disabled={currentPage + 1 >= (txPage?.total_pages ?? txPage?.totalPages ?? 1) || isTxLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Listing Creation Trend */}
      <div className='grid grid-cols-1 mb-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
        >
          <div className='flex items-center justify-between mb-8'>
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <Home className='h-5 w-5 text-rose-500' />
                {t('listingCreationTrend')}
                <Clock className="h-3 w-3 text-rose-500 animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
          </div>
          <div className='h-[350px] w-full'>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={listingGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatChartDate}
                  dy={10}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip t={t} />} />
                <Bar
                  dataKey="value"
                  name={t('newListing')}
                  fill="#f43f5e"
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Insights Row: Package Distribution & Top Agents */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Package Distribution (Pie Chart) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
        >
          <div className='flex items-center justify-between mb-8'>
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <Package className='h-5 w-5 text-indigo-500' />
                {t('packageInsights')}
                <Clock className="h-3 w-3 text-indigo-500 animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
          </div>

          <div className='flex flex-col gap-8'>
            {/* Donut Chart */}
            <div className='h-[240px] w-full relative'>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
                <p className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                  {translatedPackageInsights.reduce((sum, item) => sum + item.value, 0)}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('activePlans')}</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={translatedPackageInsights}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="translatedLabel"
                  >
                    {translatedPackageInsights.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                        className="hover:opacity-80 transition-opacity outline-none"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={<CustomTooltip isCurrency={false} />}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Premium Legend with Progress Bars */}
            <div className='space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'>
              {translatedPackageInsights.map((entry, index) => {
                const total = translatedPackageInsights.reduce((sum, item) => sum + item.value, 0);
                const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                const color = COLORS[index % COLORS.length];

                return (
                  <div key={entry.id || index} className='flex flex-col gap-2'>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          {entry.translatedLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{entry.value}</span>
                        <span className="text-[10px] font-black text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Top Active Agents */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className='lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 flex flex-col'
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <Users className='h-5 w-5 text-indigo-500' />
                {t('topAgentsActivity')}
                <Clock className="h-3 w-3 text-indigo-500 animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
            <Link href="/admin/users" className="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">
              {t('viewAllLogs')}
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full h-full">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('topPerformer')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('listingCount')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('revenueGenerated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {topAgents.map((agent, index) => (
                  <tr key={agent.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black text-lg overflow-hidden ${
                             index === 0 ? 'bg-amber-100 text-amber-600' :
                             index === 1 ? 'bg-slate-100 text-slate-600' :
                             'bg-indigo-50 text-indigo-400'
                           }`}>
                             {agent.avatar_url ? (
                               <Image src={agent.avatar_url} alt={agent.name} width={48} height={48} className="object-cover" />
                             ) : (
                               index + 1
                             )}
                           </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{agent.name}</span>
                          <span className="text-xs text-slate-400">{agent.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <Badge className="bg-slate-900 text-white border-none font-black px-3 py-1">
                        {agent.listing_count ?? 0}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {agent.revenue_generated > 0 ? formatVND(agent.revenue_generated) : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Detail Section: Top Listings Table */}
      <div className='grid grid-cols-1 gap-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900'
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className='text-xl font-black flex items-center gap-2'>
                <Home className='h-5 w-5 text-rose-500' />
                {t('topListings')}
                <Clock className="h-3 w-3 text-rose-500 animate-pulse" />
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t(`days${days}`)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('trending')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('totalViews')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('revenueBoost')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {topListings.map((listing) => (
                  <tr key={listing.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-24 relative rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                          {listing.thumbnail_url ? (
                            <Image
                              src={listing.thumbnail_url}
                              alt={listing.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <Home className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-slate-900 dark:text-white truncate">{listing.title}</span>
                          <span className="text-[10px] text-slate-400">ID: {listing.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                       <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                         {listing.views}
                       </span>
                    </td>
                    <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {listing.breakdown?.FEATURED && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                          <Rocket className="h-4 w-4" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-slate-900 text-white border-slate-800 text-[10px] font-black uppercase tracking-widest">
                                        {t('FEATURED')}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {listing.breakdown?.HOT_BADGE && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                          <Flame className="h-4 w-4" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-slate-900 text-white border-slate-800 text-[10px] font-black uppercase tracking-widest">
                                        {t('HOT_BADGE')}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {listing.has3dTour && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                          <Building2 className="h-4 w-4" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-slate-900 text-white border-slate-800 text-[10px] font-black uppercase tracking-widest">
                                        3D Virtual Tour
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {(!listing.breakdown?.FEATURED && !listing.breakdown?.HOT_BADGE && !listing.has3dTour) && (
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('none')}</span>
                                )}
                              </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
