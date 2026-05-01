'use client';

import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSalesAnalytics } from '../api';
import { formatVND } from '@/shared/lib/utils';

const chartColors = {
  direct: '#6366f1',
  agent: '#22c55e',
} as const;

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
        <p className='text-xs text-muted-foreground'>{payload[0].name}</p>
        <p className='text-sm font-semibold'>{formatVND(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function SalesAnalytics() {
  const t = useTranslations('OwnerDashboard.salesAnalytics');
  const { data } = useSalesAnalytics('month');

  const directValue = data?.direct.value ?? 0;
  const agentValue = data?.agent.value ?? 0;
  const total = data?.total.value ?? 0;

  const namedData = [
    { key: 'direct', value: directValue, color: chartColors.direct, name: t('channels.direct') },
    { key: 'agent', value: agentValue, color: chartColors.agent, name: t('channels.agent') },
  ];

  const directPercent = total > 0 ? Math.round((directValue / total) * 100) : 0;
  const agentPercent = total > 0 ? 100 - directPercent : 0;

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <span className='rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'>
          {t('thisMonth')}
        </span>
      </div>

      {/* Chart + Legend */}
      <div className='items-center gap-5'>
        {/* Donut */}
        <div className='relative h-28 w-28 shrink-0 mx-auto'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={namedData}
                cx='50%'
                cy='50%'
                innerRadius={34}
                outerRadius={50}
                paddingAngle={4}
                dataKey='value'
                strokeWidth={0}
              >
                {namedData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-[10px] text-muted-foreground'>{t('total')}</p>
            <p className='text-sm font-bold'>{formatVND(total)}</p>
          </div>
        </div>

        {/* Legend + bars */}
        <div className='flex flex-1 flex-col gap-4'>
          {namedData.map((item, i) => {
            const pct = i === 0 ? directPercent : agentPercent;
            return (
              <div key={item.key} className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span
                      className='h-2.5 w-2.5 shrink-0 rounded-full'
                      style={{ background: item.color }}
                    />
                    <span className='text-xs font-medium'>{item.name}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold'>{formatVND(item.value)}</span>
                    <span className='text-[10px] text-muted-foreground'>({pct}%)</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className='h-1.5 w-full rounded-full bg-muted'>
                  <div
                    className='h-1.5 rounded-full transition-all'
                    style={{ width: `${pct}%`, background: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
