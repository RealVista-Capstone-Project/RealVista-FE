'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { usePriceHistory } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart';
import { Skeleton } from '@/shared/ui/skeleton';

export interface PriceHistoryChartProps {
  listingId: string;
}

/**
 * Formats a date string to a shorter display format using the provided locale
 */
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Formats full date using the provided locale
 */
function formatFullDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a price value to a readable format (e.g., 1.5B, 500M)
 */
function formatPrice(value: number, locale: string): string {
  if (value >= 1_000_000_000) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (value >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toString();
}

/**
 * Formats full price with currency
 */
function formatFullPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

const chartConfig = {
  price: {
    label: 'Price',
    color: 'var(--primary)',
  },
  minPrice: {
    label: 'Min Price',
    color: 'var(--chart-2)',
  },
  maxPrice: {
    label: 'Max Price',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

/**
 * PriceHistoryChart component displays a line chart of price history
 * for a listing using the RealVista brand theme with 3 lines:
 * - Main price
 * - Min price
 * - Max price
 */
export function PriceHistoryChart({ listingId }: PriceHistoryChartProps) {
  const t = useTranslations('PriceHistoryChart');
  const locale = useLocale();
  const { data, isLoading, error } = usePriceHistory(listingId);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (error || !data?.payload?.data) {
    return null;
  }

  const priceHistoryData = data.payload.data;
  const historyEntries = priceHistoryData.price_history ?? [];

  // Sort by date ascending (oldest first) for the chart
  const sortedHistory = [...historyEntries].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  );

  // Only show last 5 entries to prevent right-side overload
  const recentHistory = sortedHistory.slice(-5);

  // Transform data for the chart with 3 price lines
  const chartData = recentHistory.map((entry) => ({
    date: formatDate(entry.changed_at, locale),
    fullDate: formatFullDate(entry.changed_at, locale),
    price: entry.price,
    minPrice: entry.min_price,
    maxPrice: entry.max_price,
    formattedPrice: formatFullPrice(entry.price, locale),
    formattedMinPrice: formatFullPrice(entry.min_price, locale),
    formattedMaxPrice: formatFullPrice(entry.max_price, locale),
    changeType: entry.change_type,
    changePercent: entry.price_change_percent,
  }));

  // Get the latest change info
  const latestEntry = historyEntries[0];
  const hasPriceChange = latestEntry && latestEntry.change_type !== 'UNCHANGED';
  const isIncrease = latestEntry?.change_type === 'INCREASED';
  const priceChangePercent = latestEntry?.price_change_percent ?? 0;

  // Calculate min and max for Y axis (considering only the last 5 entries shown)
  const allPrices = recentHistory.flatMap((e) => [e.price, e.min_price, e.max_price]);
  const minPriceValue = Math.min(...allPrices);
  const maxPriceValue = Math.max(...allPrices);
  const priceRange = maxPriceValue - minPriceValue;
  const yMin = Math.max(0, minPriceValue - priceRange * 0.02);
  const yMax = maxPriceValue + priceRange * 0.02;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className='border-primary/20 bg-white p-0'>
      <CardHeader className='pb-0 pt-5 px-5'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-foreground text-sm font-bold'>
              {t('priceHistory')}
            </CardTitle>
            <CardDescription className='text-muted-foreground text-xs'>
              {chartData.length} {t('priceChanges')}
            </CardDescription>
          </div>
          {hasPriceChange && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${isIncrease
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                }`}
            >
              {isIncrease ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              {isIncrease ? '+' : '-'}
              {Math.abs(priceChangePercent).toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='px-5 pb-5 pt-0'>
        <ChartContainer config={chartConfig} className='h-44 w-full'>
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 12,
                top: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke='var(--border)'
                strokeDasharray='4 4'
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={40}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                tickFormatter={(value) => formatPrice(value, locale)}
                domain={[yMin, yMax]}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const data = payload[0]?.payload;
                  if (!data) return null;

                  return (
                    <div className='border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-3 py-2 text-xs shadow-xl'>
                      <span className='text-muted-foreground text-xs font-medium'>
                        {data.fullDate}
                      </span>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                          <span className='text-foreground/70'>{t('price')}:</span>
                          <span className='text-foreground font-bold'>{data.formattedPrice}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--chart-2)' }}
                          />
                          <span className='text-foreground/70'>{t('minPrice')}:</span>
                          <span className='text-foreground font-medium'>
                            {data.formattedMinPrice}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--chart-3)' }}
                          />
                          <span className='text-foreground/70'>{t('maxPrice')}:</span>
                          <span className='text-foreground font-medium'>
                            {data.formattedMaxPrice}
                          </span>
                        </div>
                      </div>
                      {data.changeType !== 'UNCHANGED' && (
                        <span
                          className={`text-xs font-medium ${data.changeType === 'INCREASED' ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {data.changeType === 'INCREASED' ? '+' : '-'}
                          {Math.abs(data.changePercent).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                }}
              />
              {/* Max Price Line - drawn first (bottom layer) */}
              <Line
                dataKey='maxPrice'
                type='monotone'
                stroke='var(--chart-3)'
                strokeWidth={2}
                strokeDasharray='5 5'
                dot={{
                  fill: 'var(--chart-3)',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: 'var(--chart-3)',
                }}
              />
              {/* Min Price Line - drawn second (middle layer) */}
              <Line
                dataKey='minPrice'
                type='monotone'
                stroke='var(--chart-2)'
                strokeWidth={2}
                strokeDasharray='3 3'
                dot={{
                  fill: 'var(--chart-2)',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: 'var(--chart-2)',
                }}
              />
              {/* Main Price Line - drawn last (top layer) */}
              <Line
                dataKey='price'
                type='monotone'
                stroke='var(--primary)'
                strokeWidth={3}
                dot={{
                  fill: 'var(--primary)',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: 'var(--primary)',
                }}
              />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
