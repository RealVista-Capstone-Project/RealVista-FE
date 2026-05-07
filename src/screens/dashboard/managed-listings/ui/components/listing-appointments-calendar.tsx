'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useAppointments } from '@/features/appointments/api/appointment.queries';
import { parseAppointmentDate, getStatusColorClasses } from '@/features/appointments/utils/appointment';
import type { AppointmentWithListing } from '@/features/appointments/types';

interface ListingAppointmentsCalendarProps {
  listingId: string;
}

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  ACCEPTED: 'bg-green-500',
  REJECTED: 'bg-red-400',
  CANCELED: 'bg-gray-400',
  COMPLETED: 'bg-blue-400',
};

export function ListingAppointmentsCalendar({ listingId }: ListingAppointmentsCalendarProps) {
  const t = useTranslations('ListingDetailPanel');
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');

  const { data: allAppointments, isLoading } = useAppointments({
    start_date: startDate,
    end_date: endDate,
  });

  // Filter by this listing only
  const appointments = React.useMemo(
    () => (allAppointments ?? []).filter((a) => a.listing_id === listingId),
    [allAppointments, listingId]
  );

  // Map date string → appointments
  const appointmentsByDate = React.useMemo(() => {
    const map = new Map<string, AppointmentWithListing[]>();
    for (const appt of appointments) {
      const key = format(parseAppointmentDate(appt.start_time), 'yyyy-MM-dd');
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, appt]);
    }
    return map;
  }, [appointments]);

  const selectedDayAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return appointmentsByDate.get(key) ?? [];
  }, [selectedDate, appointmentsByDate]);

  // Build calendar grid
  const calendarDays = React.useMemo(() => {
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = gridStart;
    while (cur <= gridEnd) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [monthStart, monthEnd]);

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div>
      <div className='mb-3 flex items-center gap-2'>
        <CalendarDays className='h-4 w-4 text-primary' strokeWidth={2} />
        <h3 className='text-base font-bold text-foreground'>{t('appointments.title')}</h3>
      </div>

      <div className='rounded-xl border border-primary/12 bg-white p-4'>
        {/* Month navigation */}
        <div className='mb-3 flex items-center justify-between'>
          <button
            type='button'
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className='flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary'
          >
            <ChevronLeft className='h-4 w-4' strokeWidth={2} />
          </button>
          <span className='text-sm font-semibold capitalize text-foreground'>
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </span>
          <button
            type='button'
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className='flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary'
          >
            <ChevronRight className='h-4 w-4' strokeWidth={2} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className='mb-1 grid grid-cols-7 text-center'>
          {weekDays.map((d) => (
            <span key={d} className='py-1 text-[11px] font-semibold text-muted-foreground'>
              {d}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className='grid grid-cols-7 gap-0.5'>
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className='mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/8' />
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-7 gap-0.5'>
            {calendarDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDate.get(key) ?? [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDay = isToday(day);
              const hasAppts = dayAppts.length > 0;

              return (
                <button
                  key={key}
                  type='button'
                  onClick={() => {
                    if (!isCurrentMonth) return;
                    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day));
                  }}
                  className={cn(
                    'relative mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-full text-xs transition-colors',
                    !isCurrentMonth && 'cursor-default opacity-30',
                    isCurrentMonth && !isSelected && 'hover:bg-primary/8',
                    isSelected && 'bg-primary text-white',
                    isTodayDay && !isSelected && 'font-bold text-primary ring-1 ring-primary/30',
                    !isSelected && isCurrentMonth && 'text-foreground'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {hasAppts && isCurrentMonth && (
                    <span
                      className={cn(
                        'absolute bottom-0.5 h-1 w-1 rounded-full',
                        isSelected ? 'bg-white' : STATUS_DOT[dayAppts[0].status] ?? 'bg-primary'
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-primary/8 pt-3'>
          {Object.entries(STATUS_DOT).map(([status, dot]) => (
            <span key={status} className='flex items-center gap-1 text-[10px] text-muted-foreground'>
              <span className={cn('h-2 w-2 rounded-full', dot)} />
              {t(`appointments.status.${status.toLowerCase()}` as Parameters<typeof t>[0])}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className='mt-3 rounded-xl border border-primary/12 bg-white p-4'>
          <p className='mb-3 text-sm font-semibold text-foreground capitalize'>
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: vi })}
          </p>

          {selectedDayAppointments.length === 0 ? (
            <p className='text-xs text-muted-foreground'>{t('appointments.noAppointments')}</p>
          ) : (
            <div className='flex flex-col gap-2'>
              {selectedDayAppointments.map((appt) => (
                <div
                  key={appt.appointment_id}
                  className='flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/[0.03] p-3'
                >
                  <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3 shrink-0' strokeWidth={2} />
                        <span>
                          {format(parseAppointmentDate(appt.start_time), 'HH:mm')}
                          {' – '}
                          {format(parseAppointmentDate(appt.end_time), 'HH:mm')}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          getStatusColorClasses(appt.status)
                        )}
                      >
                        {t(`appointments.status.${appt.status.toLowerCase()}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                    {appt.sender_name && (
                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <User className='h-3 w-3 shrink-0' strokeWidth={2} />
                        <span className='truncate'>{appt.sender_name}</span>
                      </div>
                    )}
                    {appt.sender_notes && (
                      <p className='text-xs text-muted-foreground italic truncate'>{appt.sender_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
