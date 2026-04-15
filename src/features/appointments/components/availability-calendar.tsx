'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';

import { cn } from '@/shared/lib/utils';
import type { AppointmentWithListing } from '../types/appointment';

interface AvailabilityCalendarProps {
  appointments: AppointmentWithListing[];
  onSlotClick?: (date: string, startTime: string, endTime: string) => void;
  locale?: 'vi' | 'en';
}

const DAY_NAMES_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendar({
  appointments,
  onSlotClick,
  locale = 'vi',
}: AvailabilityCalendarProps) {
  const t = useTranslations('appointments');
  const dayNames = locale === 'vi' ? DAY_NAMES_VI : DAY_NAMES_EN;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const getDaySlots = useMemo(() => {
    return weekDays.map((day) => {
      const dayAppointments = appointments.filter((apt) =>
        isSameDay(parseISO(apt.startTime), day)
      );

      const slotMap = new Map<string, AppointmentWithListing[]>();
      dayAppointments.forEach((apt) => {
        const key = `${apt.startTime}-${apt.endTime}`;
        const existing = slotMap.get(key) || [];
        slotMap.set(key, [...existing, apt]);
      });

      const slots = Array.from(slotMap.entries()).map(([, appts]) => {
        const apt = appts[0];
        return {
          date: format(day, 'yyyy-MM-dd'),
          startTime: apt.startTime.slice(11, 16),
          endTime: apt.endTime.slice(11, 16),
          appointments: appts,
        };
      });

      return {
        date: format(day, 'yyyy-MM-dd'),
        dayName: dayNames[day.getDay()],
        dayNumber: day.getDate(),
        monthNumber: day.getMonth() + 1,
        slots,
      };
    });
  }, [weekDays, appointments, dayNames]);

  const goToPreviousWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const goToNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getStatusColors = (apts: AppointmentWithListing[]) => {
    const hasPending = apts.some((a) => a.status === 'PENDING');
    const hasAccepted = apts.some((a) => a.status === 'ACCEPTED');
    const hasRejected = apts.some((a) => a.status === 'REJECTED');
    const hasCanceled = apts.some((a) => a.status === 'CANCELED');

    if (hasPending) return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (hasAccepted) return 'bg-green-50 border-l-4 border-green-400';
    if (hasRejected) return 'bg-red-50 border-l-4 border-red-400';
    if (hasCanceled) return 'bg-gray-50 border-l-4 border-gray-400';
    return 'bg-blue-50 border-l-4 border-blue-400';
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={goToPreviousWeek} className="rounded-lg border p-2 hover:bg-gray-50">
          ← {t('previousWeek')}
        </button>
        <button onClick={goToToday} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
          {t('today')}
        </button>
        <button onClick={goToNextWeek} className="rounded-lg border p-2 hover:bg-gray-50">
          {t('nextWeek')} →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {getDaySlots.map((day) => (
          <div key={day.date} className="min-h-[200px]">
            <div className="mb-2 text-center">
              <div className="font-medium">{day.dayName}</div>
              <div className="text-sm text-gray-500">
                {String(day.dayNumber).padStart(2, '0')}/{String(day.monthNumber).padStart(2, '0')}
              </div>
            </div>

            <div className="space-y-1">
              {day.slots.map((slot, slotIdx) => {
                const hasMultiple = slot.appointments.length > 1;
                const statusColors = getStatusColors(slot.appointments);

                return (
                  <button
                    key={`${slot.date}-${slot.startTime}-${slotIdx}`}
                    onClick={() => onSlotClick?.(slot.date, slot.startTime, slot.endTime)}
                    className={cn(
                      'w-full rounded-md p-2 text-left text-xs transition-colors hover:opacity-80',
                      statusColors
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {hasMultiple && (
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold">
                          +{slot.appointments.length - 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-[10px]">
                      {slot.appointments[0].listingName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}