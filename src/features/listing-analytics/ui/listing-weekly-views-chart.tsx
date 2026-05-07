'use client';

import * as React from 'react';
import { addDays, addWeeks, format, parseISO, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslations } from 'next-intl';

import { listingAnalyticsQueries } from '@/entities/listing';
import { cn } from '@/shared/lib/utils';

function mondayOf(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function toYyyyMmDd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

interface ListingWeeklyViewsChartProps {
  listingId: string;
}

export function ListingWeeklyViewsChart({ listingId }: ListingWeeklyViewsChartProps) {
  const t = useTranslations('ListingMetricsCard');
  const todayMondayRef = React.useRef(mondayOf(new Date()));
  const thisMonday = todayMondayRef.current;

  const [weekStartIso, setWeekStartIso] = React.useState(() => toYyyyMmDd(thisMonday));

  const { data, isLoading, isError } = useQuery(
    listingAnalyticsQueries.viewsByWeek(listingId, weekStartIso)
  );

  const canGoNext = weekStartIso < toYyyyMmDd(thisMonday);

  const chartData = React.useMemo(() => {
    if (!data?.days?.length) {
      return [];
    }
    const todayStr = toYyyyMmDd(new Date());
    return data.days.map((d) => ({
      label: format(parseISO(d.date), 'EEE', { locale: vi }),
      sub: format(parseISO(d.date), 'd/M', { locale: vi }),
      views: d.date > todayStr ? null : d.views,
    }));
  }, [data]);

  const rangeText = React.useMemo(() => {
    if (!data?.week_start) {
      return '';
    }
    const start = parseISO(data.week_start);
    const end = addDays(start, 6);
    return t('weeklyViews.range', {
      start: format(start, 'd/M/yyyy', { locale: vi }),
      end: format(end, 'd/M/yyyy', { locale: vi }),
    });
  }, [data?.week_start, t]);

  const maxVal = Math.max(1, ...chartData.map((d) => d.views));

  const goPrev = () => {
    setWeekStartIso((prev) => toYyyyMmDd(addWeeks(parseISO(prev), -1)));
  };

  const goNext = () => {
    setWeekStartIso((prev) => {
      const next = addWeeks(parseISO(prev), 1);
      if (next.getTime() > thisMonday.getTime()) {
        return prev;
      }
      return toYyyyMmDd(next);
    });
  };

  if (isError) {
    return null;
  }

  return (
    <div className='rounded-lg border border-primary/20 p-4 sm:p-5'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
            <BarChart3 className='h-4 w-4 text-primary' strokeWidth={2} />
          </div>
          <div>
            <h3 className='text-base font-bold text-foreground'>{t('weeklyViews.title')}</h3>
            {rangeText ? (
              <p className='text-xs text-muted-foreground'>{rangeText}</p>
            ) : null}
          </div>
        </div>

        <div className='flex items-center gap-1 self-start sm:self-auto'>
          <button
            type='button'
            onClick={goPrev}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium',
              'text-foreground transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
            aria-label={t('weeklyViews.prevWeek')}
          >
            <ChevronLeft className='h-4 w-4' strokeWidth={2} />
          </button>
          <button
            type='button'
            onClick={goNext}
            disabled={!canGoNext}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium',
              'text-foreground transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              !canGoNext && 'pointer-events-none opacity-40'
            )}
            aria-label={t('weeklyViews.nextWeek')}
          >
            <ChevronRight className='h-4 w-4' strokeWidth={2} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className='h-[200px] animate-pulse rounded-md bg-primary/10' aria-hidden />
      ) : chartData.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('weeklyViews.empty')}</p>
      ) : (
        <div className='h-[220px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
              <XAxis
                dataKey='sub'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                allowDecimals={false}
                domain={[0, maxVal]}
              />
              <Tooltip
                cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.2, strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const p = payload[0]?.payload as { sub?: string; views?: number };
                  return (
                    <div className='rounded-lg border border-primary/15 bg-background px-3 py-2 text-xs shadow-md'>
                      <p className='font-medium text-foreground'>
                        {label} {p.sub ? `(${p.sub})` : null}
                      </p>
                      <p className='text-muted-foreground'>
                        {payload[0].value != null ? String(payload[0].value) : '0'}{' '}
                        {t('weeklyViews.tooltipLabel')}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type='monotone'
                dataKey='views'
                stroke='var(--primary)'
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
