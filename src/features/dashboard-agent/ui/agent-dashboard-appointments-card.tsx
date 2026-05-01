'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar, CalendarDayButton } from '@/shared/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { enUS, vi as viLocale } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useState } from 'react';
import { useAgentAppointmentsSnapshot } from '../api/use-agent-dashboard';
import type {
  AgentAppointmentTabFilter,
  AppointmentItem,
} from '../model/agent-dashboard.types';

function formatDashboardDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toAppointmentStatus(
  status: string
): 'confirmed' | 'pending' | 'completed' | 'rejected' | 'canceled' {
  if (status === 'ACCEPTED') return 'confirmed';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'CANCELED') return 'canceled';
  return 'pending';
}

function toDateKey(value: Date, timezone: string) {
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function toIsoDateKey(value: string, timezone: string) {
  if (!value) return '';
  return toDateKey(new Date(value), timezone);
}

function toSafeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatCalendarHeaderDate(value: Date, locale: string) {
  return value.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function statusPillClass(status: AppointmentItem['status']) {
  if (status === 'ACCEPTED')
    return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'COMPLETED')
    return 'text-sky-700 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300';
  if (status === 'REJECTED')
    return 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300';
  if (status === 'CANCELED')
    return 'text-zinc-700 bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300';
  return 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';
}

export const AgentDashboardAppointmentsCard = memo(function AgentDashboardAppointmentsCard() {
  const t = useTranslations('AgentDashboard');
  const locale = useLocale();
  const calendarLocale = locale === 'vi' ? viLocale : enUS;
  const appointmentsQuery = useAgentAppointmentsSnapshot();

  const appointmentSnapshot = appointmentsQuery.data?.data;
  const appointments = useMemo(
    () => appointmentSnapshot?.appointments ?? [],
    [appointmentSnapshot?.appointments]
  );
  const calendarDays = useMemo(
    () => appointmentSnapshot?.calendarDays ?? [],
    [appointmentSnapshot?.calendarDays]
  );
  const snapshotTimezone = appointmentSnapshot?.range.timezone || 'UTC';

  const [appointmentFilter, setAppointmentFilter] = useState<AgentAppointmentTabFilter>('all');
  const [selectedAppointmentDay, setSelectedAppointmentDay] = useState<Date | undefined>(
    new Date()
  );
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState<Date>(new Date());

  const calendarDayMap = useMemo(() => {
    const map = new Map<string, (typeof calendarDays)[number]>();
    calendarDays.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarDays]);

  useEffect(() => {
    if (!calendarDays.length) {
      const now = new Date();
      setSelectedAppointmentDay(now);
      setVisibleCalendarMonth(now);
      return;
    }

    const todayKey = toDateKey(new Date(), snapshotTimezone);
    const todayMatch = calendarDayMap.get(todayKey);
    if (todayMatch?.hasItems) {
      const day = toSafeDate(todayMatch.date);
      if (day) {
        setSelectedAppointmentDay(day);
        setVisibleCalendarMonth(day);
        return;
      }
    }

    const firstWithItems = calendarDays.find((day) => day.hasItems);
    if (firstWithItems) {
      const day = toSafeDate(firstWithItems.date);
      if (day) {
        setSelectedAppointmentDay(day);
        setVisibleCalendarMonth(day);
        return;
      }
    }

    const firstDay = toSafeDate(calendarDays[0].date);
    if (firstDay) {
      setSelectedAppointmentDay(firstDay);
      setVisibleCalendarMonth(firstDay);
    }
  }, [calendarDayMap, calendarDays, snapshotTimezone]);

  const selectedDayKey = selectedAppointmentDay
    ? toDateKey(selectedAppointmentDay, snapshotTimezone)
    : '';
  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (toIsoDateKey(appointment.startTime, snapshotTimezone) !== selectedDayKey) return false;
        if (appointmentFilter === 'tour') return appointment.appointmentType === 'TOUR';
        if (appointmentFilter === 'block') return appointment.appointmentType === 'BLOCK';
        return true;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointmentFilter, appointments, selectedDayKey, snapshotTimezone]);

  const tourCount = selectedDayAppointments.filter(
    (item) => item.appointmentType === 'TOUR'
  ).length;
  const blockCount = selectedDayAppointments.filter(
    (item) => item.appointmentType === 'BLOCK'
  ).length;

  return (
    <Card className='xl:col-span-5'>
      <CardHeader>
        <CardTitle>{t('sections.appointments.title')}</CardTitle>
        <CardDescription>{t('sections.appointments.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm'>
          <div className='bg-muted/5 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4'>
            <Calendar
              mode='single'
              navLayout='around'
              locale={calendarLocale}
              selected={selectedAppointmentDay}
              onSelect={(day) => {
                setSelectedAppointmentDay(day);
                if (day) setVisibleCalendarMonth(day);
              }}
              month={visibleCalendarMonth}
              onMonthChange={setVisibleCalendarMonth}
              className='w-full !p-0'
              classNames={{
                root: 'w-full p-0',
                months: 'w-full',
                month:
                  'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3',
                month_caption:
                  'col-start-2 row-start-1 flex w-full items-center justify-center self-center',
                button_previous:
                  'col-start-1 row-start-1 justify-self-start h-7 w-7 rounded-full border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted/40',
                button_next:
                  'col-start-3 row-start-1 justify-self-end h-7 w-7 rounded-full border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted/40',
                caption_label: 'text-base font-semibold tracking-tight',
                month_grid: 'col-span-3 row-start-2 w-full',
                table: 'w-full border-collapse',
                weekdays: 'flex w-full',
                weekday:
                  'flex-1 text-center text-xs font-medium text-muted-foreground select-none',
                week: 'mt-1 flex w-full',
                day: 'flex-1 p-0.5',
                outside: 'text-muted-foreground/50 aria-selected:text-muted-foreground/50',
                today: 'bg-transparent text-foreground',
              }}
              components={{
                DayButton: ({ day, className, ...props }) => {
                  const key = toDateKey(day.date, snapshotTimezone);
                  const dayStats = calendarDayMap.get(key);
                  const tour = dayStats?.tourCount ?? 0;
                  const block = dayStats?.blockCount ?? 0;
                  const total = dayStats?.total ?? 0;
                  const hasItemsDay = Boolean(
                    dayStats && (dayStats.hasItems || total > 0 || tour > 0 || block > 0)
                  );
                  const isTourDay = Boolean(dayStats && tour > 0);
                  const isBlockDay = Boolean(dayStats && block > 0);
                  const showNeutralDot = hasItemsDay && !isTourDay && !isBlockDay;

                  return (
                    <CalendarDayButton
                      day={day}
                      className={cn(
                        className,
                        'relative h-9 w-full min-w-0 rounded-md border-0 bg-transparent pb-1 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted/40 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-none data-[selected-single=true]:[&_.dot-indicator]:!bg-primary-foreground/90'
                      )}
                      {...props}
                    >
                      <span className='relative z-10 leading-none'>{props.children}</span>
                      {(isTourDay || isBlockDay || showNeutralDot) && (
                        <span className='pointer-events-none absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5'>
                          {isTourDay && (
                            <span className='dot-indicator h-1.5 w-1.5 shrink-0 rounded-full bg-foreground ring-1 ring-foreground/25' />
                          )}
                          {isBlockDay && (
                            <span className='dot-indicator h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground ring-1 ring-muted-foreground/30' />
                          )}
                          {showNeutralDot && (
                            <span className='dot-indicator h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-1 ring-primary/30' />
                          )}
                        </span>
                      )}
                    </CalendarDayButton>
                  );
                },
              }}
            />
          </div>

          <div className='border-t border-border/70 bg-card/80 px-4 py-3 sm:px-5 sm:py-4'>
            <div className='inline-flex w-full rounded-xl border border-border/70 bg-muted/40 p-1'>
              {(['all', 'tour', 'block'] as const).map((tab) => (
                <Button
                  key={tab}
                  size='sm'
                  variant='ghost'
                  className={cn(
                    'h-9 flex-1 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:text-foreground',
                    appointmentFilter === tab &&
                      'bg-background text-foreground shadow-sm hover:bg-background'
                  )}
                  onClick={() => setAppointmentFilter(tab)}
                >
                  {t(`sections.appointments.tabs.${tab}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className='border-t border-border/70 bg-card'>
            <div className='flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-3 sm:px-5'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                {selectedAppointmentDay
                  ? t('sections.appointments.selectedDate', {
                      date: formatCalendarHeaderDate(selectedAppointmentDay, locale),
                    })
                  : t('sections.appointments.noDateSelected')}
              </p>
              <p className='rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground'>
                {t('sections.appointments.summary', {
                  total: selectedDayAppointments.length,
                  tour: tourCount,
                  block: blockCount,
                })}
              </p>
            </div>

            <div className='max-h-[336px] space-y-0 overflow-y-auto'>
              {selectedAppointmentDay ? null : (
                <div className='px-4 pb-4 sm:px-5'>
                  <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                    {t('sections.appointments.noDateSelected')}
                  </div>
                </div>
              )}

              {selectedAppointmentDay &&
                (selectedDayAppointments.length === 0 ? (
                  <div className='px-4 pb-4 sm:px-5'>
                    <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                      {t('sections.appointments.emptyForFilter')}
                    </div>
                  </div>
                ) : (
                  selectedDayAppointments.map((appointment: AppointmentItem) => (
                    <div
                      key={appointment.appointmentId}
                      className='flex items-start justify-between gap-3 border-t border-border/60 px-4 py-3.5 transition-colors first:border-t-0 hover:bg-muted/20 sm:px-5'
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-base font-semibold leading-6 text-foreground'>
                          {appointment.listingName || 'Listing'}
                        </p>
                        <p className='mt-1 truncate text-sm text-muted-foreground'>
                          {appointment.listingAddress || '-'}
                        </p>
                        <p className='mt-1 text-xs font-medium text-muted-foreground'>
                          {formatDashboardDate(appointment.startTime, locale)}
                        </p>
                      </div>
                      <div className='flex shrink-0 flex-col items-end gap-1.5'>
                        <span
                          className={
                            appointment.appointmentType === 'BLOCK'
                              ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
                          }
                        >
                          {appointment.appointmentType === 'BLOCK'
                            ? t('sections.appointments.types.block')
                            : t('sections.appointments.types.tour')}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(appointment.status)}`}
                        >
                          {t(`status.${toAppointmentStatus(appointment.status)}`)}
                        </span>
                      </div>
                    </div>
                  ))
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
