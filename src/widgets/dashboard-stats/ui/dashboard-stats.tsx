'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Home, 
  AlertOctagon, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

import { adminApi } from '@/entities/admin/api';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, trend, description, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className='group relative bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden'
    >
      <div className='absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors' />
      
      <div className='relative flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='p-4 bg-slate-50 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500'>
            <Icon className='h-6 w-6 text-slate-600 group-hover:text-primary transition-colors' />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
              trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
              {trend.isPositive ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
              {trend.value}
            </div>
          )}
        </div>

        <div>
          <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2'>
            {title}
          </p>
          <h3 className='text-3xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors'>
            {value}
          </h3>
          {description && (
            <p className='mt-2 text-xs font-bold text-slate-500'>
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className='bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4'>
          <div className='flex justify-between items-center'>
            <Skeleton className='h-12 w-12 rounded-2xl' />
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      ))}
    </>
  );
}

export function DashboardStats() {
  const t = useTranslations('AdminDashboard');
  
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (isLoading) return <StatsSkeleton />;

  return (
    <>
      <StatCard
        title={t('totalActiveUsers')}
        value={overview?.total_users ?? 0}
        icon={Users}
        trend={{ value: '+12.5%', isPositive: true }}
        description={t('platformGrowth')}
        delay={0}
      />

      <StatCard
        title={t('newestPendingListings')}
        value={overview?.pending_listings ?? 0}
        icon={Home}
        description={t('awaitingModeration')}
        delay={0.1}
      />

      <StatCard
        title={t('topUrgentReports')}
        value={overview?.unresolved_reports ?? 0}
        icon={AlertOctagon}
        trend={{ value: t('highPriority'), isPositive: false }}
        description={t('requiresImmediateResolution')}
        delay={0.2}
      />

      <StatCard
        title={t('totalRevenue')}
        value={formatCurrency(overview?.total_revenue ?? 0)}
        icon={Activity}
        trend={{ value: '+5.4%', isPositive: true }}
        description={t('revenueGrowth')}
        delay={0.3}
      />
    </>
  );
}
