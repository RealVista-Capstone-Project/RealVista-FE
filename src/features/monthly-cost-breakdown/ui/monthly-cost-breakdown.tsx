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
import type { CostBreakdown } from '@/shared/types';

export interface MonthlyCostBreakdownProps {
  costBreakdown?: CostBreakdown | null;
  currency?: string;
  locale?: string;
}

interface ChartItem {
  name: string;
  amount: number;
  category: 'base' | 'required' | 'optional';
}

/**
 * MonthlyCostBreakdown component displays a breakdown of monthly costs
 * with a radial stacked bar chart and colored legend
 */
export function MonthlyCostBreakdown({
  costBreakdown,
  currency = 'VND',
  locale = 'vi-VN',
}: MonthlyCostBreakdownProps) {
  const t = useTranslations('MonthlyCostBreakdown');

  // Guard clause: return null if costBreakdown is not available
  if (!costBreakdown) {
    return null;
  }

  // Format currency with Vietnamese style (e.g., 20.000.000 đ)
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    // Add currency symbol
    return currency === 'VND' ? `${formatted} đ` : formatted;
  };

  // Prepare chart items: base price + required fees + optional fees
  const chartItems: ChartItem[] = [
    {
      name: t('basePrice'),
      amount: costBreakdown.basePrice,
      category: 'base',
    },
    ...(costBreakdown.requiredFees || []).map((fee) => ({
      name: fee.name,
      amount: fee.amount,
      category: 'required' as const,
    })),
    ...(costBreakdown.optionalFees || []).map((fee) => ({
      name: fee.name,
      amount: fee.amount,
      category: 'optional' as const,
    })),
  ];

  // Prepare chart data - stack all items into a single data point
  const chartData = [
    chartItems.reduce(
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
  const chartConfig: ChartConfig = chartItems.reduce((config, item, index) => {
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
        label: item.name,
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
              innerRadius={85}
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
                            {formatCurrency(costBreakdown.totalCost)}
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
              {chartItems.map((item, index) => {
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
        <div className='flex flex-col gap-3 flex-1 w-full'>
          {chartItems.map((item, index) => {
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
                    {item.name}
                  </span>
                </div>
                {/* Amount */}
                <span className='text-main-black text-[14px] sm:text-[16px] font-semibold leading-[1.4] tabular-nums flex-shrink-0'>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            );
          })}

          {/* Disclaimer */}
          {costBreakdown.disclaimer && (
            <p className='text-grey-500 text-xs italic mt-2'>{costBreakdown.disclaimer}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
