'use client';

import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// TODO(integration): wire up to a future /dashboard/appointments/snapshot endpoint backed by AppointmentDashboardSnapshotResponse.
const APPOINTMENT_MOCK = {
  totalAppointments: '48',
  completedAppointments: '36',
  rate: '32.43%',
  weekly: [
    { day: 'Sat', value: 18 },
    { day: 'Sun', value: 32 },
    { day: 'Mon', value: 12 },
  ],
};

const TooltipCard = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold'>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function AppointmentStatistic() {
  const t = useTranslations('OwnerDashboard.appointmentStat');

  return (
    <div className='flex h-full flex-col gap-5 rounded-[24px] border border-black/[0.06] bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <span className='rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'>
          {t('thisWeek')}
        </span>
      </div>

      {/* KPI row — reference: two blocks side by side */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='rounded-2xl bg-muted/35 px-4 py-3'>
          <p className='text-xs text-muted-foreground'>{t('totalAppointments')}</p>
          <p className='text-2xl font-bold tracking-tight'>{APPOINTMENT_MOCK.totalAppointments}</p>
        </div>
        <div className='rounded-2xl bg-muted/35 px-4 py-3'>
          <div className='flex items-center gap-1.5'>
            <p className='text-xs text-muted-foreground'>{t('completedAppointments')}</p>
            <span className='inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500' aria-hidden />
          </div>
          <p className='text-2xl font-bold tracking-tight'>{APPOINTMENT_MOCK.completedAppointments}</p>
        </div>
      </div>

      {/* Chart + inset Rate card (reference: sky pill on the right) */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-stretch'>
        <div className='min-h-[140px] min-w-0 flex-1'>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>{t('visitStatistic')}</p>
          <div className='h-[120px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={APPOINTMENT_MOCK.weekly} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
                <XAxis
                  dataKey='day'
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  width={28}
                />
                <Tooltip content={<TooltipCard />} />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='#eab308'
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#eab308', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='flex shrink-0 flex-col justify-center rounded-2xl bg-sky-100 px-5 py-4 dark:bg-sky-950/40'>
          <p className='text-xs font-medium text-muted-foreground'>{t('rate')}</p>
          <p className='text-3xl font-bold tracking-tight text-sky-900 dark:text-sky-100'>
            {APPOINTMENT_MOCK.rate}
          </p>
        </div>
      </div>
    </div>
  );
}
