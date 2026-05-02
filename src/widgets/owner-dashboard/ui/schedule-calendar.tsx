'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Calendar } from '@/shared/ui/calendar';
import { MapPin, User, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useDashboardSchedules } from '../api';
import type { ScheduleType } from '../api';

type TabKey = ScheduleType;

function formatDateToApi(date?: Date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(time: string) {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

export function ScheduleCalendar() {
  const t = useTranslations('OwnerDashboard.schedule');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab] = useState<TabKey>('all');

  const selectedDate = useMemo(() => formatDateToApi(date), [date]);
  const { data: schedules } = useDashboardSchedules({ date: selectedDate, type: activeTab });

  return (
    <div className='flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm'>
      <h3 className='text-base font-semibold'>{t('title')}</h3>

      {/* Calendar */}
      <div className='flex justify-center'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate as (date: Date | undefined) => void}
          className='w-full'
        />
      </div>


      {/* Schedule Items */}
      <div className='flex flex-col gap-3'>
        {(schedules?.items ?? []).map((item, index) => (
          <div
            key={item.appointment_id}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border bg-muted/20 px-4 py-3 border-l-4',
              index % 2 === 0 ? 'border-l-indigo-500' : 'border-l-emerald-500',
            )}
          >
            <p className='text-sm font-semibold leading-snug'>{item.title}</p>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <MapPin className='h-3 w-3 shrink-0' />
              <span className='truncate'>{item.address}</span>
            </div>
            <div className='flex items-center gap-3 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>{formatTime(item.time)}</span>
              </div>
              <div className='flex items-center gap-1'>
                <User className='h-3 w-3' />
                <span>{item.type === 'mySchedule' ? t('myScheduleLabel') : t('assignedLabel')}</span>
              </div>
              <span className='ml-auto text-primary font-medium'>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
