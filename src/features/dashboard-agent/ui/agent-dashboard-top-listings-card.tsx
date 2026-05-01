'use client';

import type { AgentListingAnalyticsRow, AgentListingAnalyticsSort } from '../model/agent-dashboard.types';
import { useAgentTopListings } from '../api/use-agent-dashboard';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { CalendarDays, Eye, Home, MessageSquare, Percent } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';

const SORT_OPTIONS = ['views', 'inquiries', 'tours'] as const satisfies readonly AgentListingAnalyticsSort[];

function metricForSort(row: AgentListingAnalyticsRow, sort: AgentListingAnalyticsSort): number {
  if (sort === 'inquiries') return row.inquiries;
  if (sort === 'tours') return row.tourBookings;
  return row.totalViews;
}

export function AgentDashboardTopListingsCard() {
  const t = useTranslations('AgentDashboard');
  const [sortBy, setSortBy] = useState<AgentListingAnalyticsSort>('views');
  const query = useAgentTopListings(sortBy);

  const rows = query.data?.data ?? [];
  const isLoading = query.isLoading && !query.data;
  const maxMetric = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => metricForSort(r, sortBy)), 0);
  }, [rows, sortBy]);

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle>{t('sections.topListings.title')}</CardTitle>
            <CardDescription>{t('sections.topListings.description')}</CardDescription>
          </div>
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {SORT_OPTIONS.map((key) => (
              <button
                key={key}
                type='button'
                onClick={() => setSortBy(key)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  sortBy === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`sections.topListings.sort.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className='pointer-events-none'>
        {query.isError && !query.data ? (
          <div className='flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground'>
            {t('error.partialDescription')}
          </div>
        ) : isLoading ? (
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex gap-3'>
                <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
                <Skeleton className='h-12 w-12 shrink-0 rounded-lg' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/5 max-w-xs' />
                  <Skeleton className='h-2 w-full max-w-md' />
                  <Skeleton className='h-3 w-full max-w-lg' />
                </div>
                <Skeleton className='hidden h-10 w-52 shrink-0 sm:block' />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className='flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground'>
            {t('sections.topListings.empty')}
          </div>
        ) : (
          <ul className='space-y-5'>
            {rows.map((row, index) => (
              <TopListingRow
                key={row.listingId}
                rank={index + 1}
                row={row}
                sortBy={sortBy}
                maxMetric={maxMetric}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopListingRow({
  rank,
  row,
  sortBy,
  maxMetric,
}: {
  rank: number;
  row: AgentListingAnalyticsRow;
  sortBy: AgentListingAnalyticsSort;
  maxMetric: number;
}) {
  const t = useTranslations('AgentDashboard');
  const activeValue = metricForSort(row, sortBy);
  const barPct = maxMetric > 0 ? Math.round((activeValue / maxMetric) * 100) : 0;

  return (
    <li className='flex flex-col gap-3 border-b border-border/40 pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-start'>
      <div className='flex min-w-0 flex-1 gap-3'>
        <div className='flex w-8 shrink-0 justify-center pt-1'>
          <span className='text-xs font-semibold tabular-nums text-muted-foreground'>#{rank}</span>
        </div>
        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30'>
          {row.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- external URLs from API
            <img src={row.thumbnail} alt='' className='size-full object-cover' />
          ) : (
            <div className='flex size-full items-center justify-center text-muted-foreground'>
              <Home className='h-5 w-5' />
            </div>
          )}
        </div>
        <div className='min-w-0 flex-1 space-y-1.5'>
          <p className='truncate text-sm font-semibold leading-tight text-foreground'>{row.name}</p>
          <div className='h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-primary/80 transition-[width]'
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className='truncate text-xs text-muted-foreground'>{row.fullAddress || '—'}</p>
        </div>
      </div>
      <div className='grid w-full shrink-0 grid-cols-2 gap-2 text-xs sm:ml-auto sm:w-[260px]'>
        <MetricCell
          icon={<Eye className='h-3.5 w-3.5' />}
          label={t('sections.topListings.metrics.views')}
          value={row.totalViews}
          highlight={sortBy === 'views'}
        />
        <MetricCell
          icon={<MessageSquare className='h-3.5 w-3.5' />}
          label={t('sections.topListings.metrics.inquiries')}
          value={row.inquiries}
          highlight={sortBy === 'inquiries'}
        />
        <MetricCell
          icon={<CalendarDays className='h-3.5 w-3.5' />}
          label={t('sections.topListings.metrics.tours')}
          value={row.tourBookings}
          highlight={sortBy === 'tours'}
        />
        <MetricCell
          icon={<Percent className='h-3.5 w-3.5' />}
          label={t('sections.topListings.metrics.conversion')}
          value={`${Number(row.conversionRate).toFixed(1)}%`}
          highlight={false}
        />
      </div>
    </li>
  );
}

function MetricCell({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md px-1 py-0.5 tabular-nums',
        highlight && 'bg-primary/10 font-semibold text-primary',
      )}
    >
      <span className='text-muted-foreground'>{icon}</span>
      <span className='min-w-0 truncate'>
        <span className='sr-only'>{label}: </span>
        <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
      </span>
    </div>
  );
}
