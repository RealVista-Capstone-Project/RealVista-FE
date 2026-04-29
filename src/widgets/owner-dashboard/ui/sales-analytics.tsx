'use client';

import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const salesData = [
  { key: 'marketing', value: 5120, color: '#6366f1' },
  { key: 'online', value: 3425, color: '#22c55e' },
  { key: 'offline', value: 3120, color: '#f59e0b' },
  { key: 'agent', value: 2472, color: '#ec4899' },
] as const;

type SalesKey = (typeof salesData)[number]['key'];

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
        <p className='text-sm font-semibold'>${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function SalesAnalytics() {
  const t = useTranslations('OwnerDashboard.salesAnalytics');

  const total = salesData.reduce((sum, d) => sum + d.value, 0);

  const namedData = salesData.map((d) => ({
    ...d,
    name: t(`channels.${d.key}` as `channels.${SalesKey}`),
  }));

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <span className='rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'>
          {t('thisMonth')}
        </span>
      </div>

      <div className='flex items-center gap-4'>
        {/* Pie Chart */}
        <div className='relative h-28 w-28 shrink-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={namedData}
                cx='50%'
                cy='50%'
                innerRadius={34}
                outerRadius={50}
                paddingAngle={3}
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
          {/* Center label */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-xs text-muted-foreground'>{t('total')}</p>
            <p className='text-sm font-bold'>${(total / 1000).toFixed(1)}K</p>
          </div>
        </div>

        {/* Legend */}
        <div className='flex flex-1 flex-col gap-2.5'>
          {namedData.map((item) => (
            <div key={item.key} className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2 min-w-0'>
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-full'
                  style={{ background: item.color }}
                />
                <span className='truncate text-xs text-muted-foreground'>{item.name}</span>
              </div>
              <span className='shrink-0 text-xs font-semibold'>${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
