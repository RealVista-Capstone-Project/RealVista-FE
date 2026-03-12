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
    color: 'var(--main-primary)',
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

  // Transform data for the chart with 3 price lines
  const chartData = sortedHistory.map((entry) => ({
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

  // Calculate min and max for Y axis (considering all 3 lines)
  const allPrices = sortedHistory.flatMap((e) => [e.price, e.min_price, e.max_price]);
  const minPriceValue = Math.min(...allPrices);
  const maxPriceValue = Math.max(...allPrices);
  const priceRange = maxPriceValue - minPriceValue;
  const yMin = Math.max(0, minPriceValue - priceRange * 0.1);
  const yMax = maxPriceValue + priceRange * 0.1;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h2 className='text-main-black text-[24px] font-bold leading-[1.5] tracking-[-0.24px]'>
          {t('title')}
        </h2>
        <p className='text-main-black/70 text-[16px] font-medium leading-[1.6]'>
          {t('description')}
        </p>
      </div>

      <Card className='border-purple-92 bg-white'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-main-black text-lg font-bold'>
                {t('priceHistory')}
              </CardTitle>
              <CardDescription className='text-main-black/50'>
                {chartData.length} {t('priceChanges')}
              </CardDescription>
            </div>
            {hasPriceChange && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  isIncrease
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isIncrease ? (
                  <TrendingUp className='h-4 w-4' />
                ) : (
                  <TrendingDown className='h-4 w-4' />
                )}
                {isIncrease ? '+' : '-'}
                {Math.abs(priceChangePercent).toFixed(1)}%
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-64 w-full'>
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke='#e8e6f9'
                strokeDasharray='4 4'
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: '#6c727f', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: '#6c727f', fontSize: 12 }}
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
                      <span className='text-main-black/50 text-xs font-medium'>
                        {data.fullDate}
                      </span>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--main-primary)' }}
                          />
                          <span className='text-main-black/70'>{t('price')}:</span>
                          <span className='text-main-black font-bold'>{data.formattedPrice}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--chart-2)' }}
                          />
                          <span className='text-main-black/70'>{t('minPrice')}:</span>
                          <span className='text-main-black font-medium'>
                            {data.formattedMinPrice}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: 'var(--chart-3)' }}
                          />
                          <span className='text-main-black/70'>{t('maxPrice')}:</span>
                          <span className='text-main-black font-medium'>
                            {data.formattedMaxPrice}
                          </span>
                        </div>
                      </div>
                      {data.changeType !== 'UNCHANGED' && (
                        <span
                          className={`text-xs font-medium ${
                            data.changeType === 'INCREASED' ? 'text-green-600' : 'text-red-600'
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
                stroke='var(--main-primary)'
                strokeWidth={3}
                dot={{
                  fill: 'var(--main-primary)',
                  strokeWidth: 2,
                  stroke: '#fff',
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 2,
                  stroke: '#fff',
                  fill: 'var(--main-primary)',
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
