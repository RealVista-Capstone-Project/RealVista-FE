'use client';

import { useTranslations } from 'next-intl';
import { BanknoteIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  Label,
} from '@/shared/ui/chart';

export interface CostItem {
  labelKey: string;
  amount: number;
  description?: string;
}

export interface MonthlyCostBreakdownProps {
  items: CostItem[];
  total: number;
  currency?: string;
  locale?: string;
}

/**
 * MonthlyCostBreakdown component displays a breakdown of monthly costs
 * with a radial stacked bar chart and colored legend
 */
export function MonthlyCostBreakdown({
  items,
  total,
  currency = 'VND',
  locale = 'vi-VN',
}: MonthlyCostBreakdownProps) {
  const t = useTranslations('MonthlyCostBreakdown');

  // Format currency with Vietnamese style (e.g., 20.000.000 đ)
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    // Add currency symbol
    return currency === 'VND' ? `${formatted} đ` : formatted;
  };

  // Prepare chart data - stack all items into a single data point
  const chartData = [
    items.reduce(
      (acc, item, index) => {
        const key = `item${index}`;
        return {
          ...acc,
          [key]: item.amount,
        };
      },
      { month: 'total' }
    ),
  ];

  // Build chart config dynamically
  const chartConfig: ChartConfig = items.reduce((config, item, index) => {
    const key = `item${index}`;
    const colors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ];
    return {
      ...config,
      [key]: {
        label: t(item.labelKey),
        color: colors[index % colors.length],
      },
    };
  }, {} as ChartConfig);

  // Direct hex colors for legend (outside ChartContainer scope)
  const legendColors = [
    '#7065f0', // chart-1
    '#100a55', // chart-2
    '#6c727f', // chart-3
    '#d8d6f5', // chart-4
    '#e8e6f9', // chart-5
  ];
  const getDirectColor = (index: number) => {
    return legendColors[index % legendColors.length];
  };

  return (
    <Card className='border-purple-92 gap-3'>
      <CardHeader className='items-center gap-0'>
        <div className='flex items-center gap-2'>
          <BanknoteIcon className='w-5 h-5 sm:w-6 sm:h-6 text-main-primary' />
          <CardTitle className='text-main-black text-[20px] sm:text-[24px] font-bold leading-[1.6]'>
            {t('title')}
          </CardTitle>
        </div>
        <CardDescription className='pl-4'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col sm:flex-row items-center'>
        {/* Radial Stacked Bar Chart - Left side */}
        <div className='flex-shrink-0'>
          <ChartContainer config={chartConfig} className='aspect-square w-[200px] sm:w-[250px]'>
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={-270}
              innerRadius={80}
              outerRadius={130}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle'>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className='fill-main-primary text-2xl font-bold'
                          >
                            {formatCurrency(total)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className='fill-grey-500 text-sm'
                          >
                            {t('totalMonthlyPayment')}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              {items.map((item, index) => {
                const key = `item${index}`;
                return (
                  <RadialBar
                    key={key}
                    dataKey={key}
                    stackId='a'
                    cornerRadius={5}
                    fill={`var(--color-${key})`}
                    className='stroke-transparent stroke-2'
                  />
                );
              })}
            </RadialBarChart>
          </ChartContainer>
        </div>

        {/* Legend Items - Right side */}
        <div className='flex flex-col gap-2 flex-1 w-full'>
          {items.map((item, index) => {
            const key = `item${index}`;
            const color = getDirectColor(index);

            return (
              <div key={index} className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  {/* Color dot */}
                  <div
                    className='w-3 h-3 rounded-full flex-shrink-0'
                    style={{ backgroundColor: color }}
                  />
                  {/* Label */}
                  <span className='text-main-black text-[14px] sm:text-[16px] font-medium leading-[1.5] truncate'>
                    {t(item.labelKey)}
                  </span>
                </div>
                {/* Amount */}
                <span className='text-main-black text-[14px] sm:text-[16px] font-semibold leading-[1.4] tabular-nums flex-shrink-0'>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
