'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from 'recharts';

const VERVE_MOCK = {
  highlight: '$2.2k',
  highlightIndex: 3,
  bars: [
    { label: 'Jul', value: 1200 },
    { label: 'Aug', value: 900 },
    { label: 'Sep', value: 800 },
    { label: 'Oct', value: 2200 },
    { label: 'Nov', value: 1500 },
    { label: 'All', value: 1100 },
  ],
};

export function VerveMiniCard() {
  const t = useTranslations('OwnerDashboard.verve');

  return (
    <div className='flex h-full flex-col gap-4 rounded-[24px] border border-black/[0.06] bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex items-center justify-between'>
        <button
          type='button'
          className='flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted'
        >
          <ChevronDown className='h-3 w-3' />
          {t('label')}
        </button>
      </div>

      <div className='relative h-24 w-full'>
        {/* Floating tooltip pill above the highlighted bar */}
        <div className='pointer-events-none absolute -top-1 left-[58%] -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold text-background shadow-md'>
          {VERVE_MOCK.highlight}
        </div>

        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={VERVE_MOCK.bars} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              interval={0}
            />
            <Bar dataKey='value' radius={[4, 4, 4, 4]} barSize={14}>
              {VERVE_MOCK.bars.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={idx === VERVE_MOCK.highlightIndex ? '#0ea5e9' : 'var(--muted)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className='mt-auto flex flex-col gap-2'>
        <p className='text-sm font-semibold leading-snug'>{t('title')}</p>
        <p className='text-xs leading-relaxed text-muted-foreground'>{t('description')}</p>
      </div>
    </div>
  );
}
