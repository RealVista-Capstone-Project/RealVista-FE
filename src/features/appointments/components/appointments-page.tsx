'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, addDays, startOfWeek } from 'date-fns';
import { useAppointments } from '../api/appointment.queries';
import { AvailabilityCalendar } from './availability-calendar';
import { SlotModal } from './slot-modal';

type FilterType = 'all' | 'sent' | 'received';

export function AppointmentsPage() {
  const t = useTranslations('appointments');
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const startDate = format(currentWeekStart, 'yyyy-MM-dd');
  const endDate = format(addDays(currentWeekStart, 29), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading } = useAppointments({
    startDate,
    endDate,
    filter: filter === 'all' ? undefined : filter,
  });

  const filteredAppointments = useMemo(() => {
    if (filter === 'all') return appointments;
    return appointments;
  }, [appointments, filter]);

  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const slotAppointments = useMemo(() => {
    if (!selectedSlot) return [];
    return filteredAppointments.filter(
      (apt) =>
        apt.startTime.startsWith(selectedSlot.date) &&
        apt.startTime.slice(11, 16) === selectedSlot.startTime
    );
  }, [filteredAppointments, selectedSlot]);

  const handleSlotClick = (date: string, startTime: string, endTime: string) => {
    setSelectedSlot({ date, startTime, endTime });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <div className="mb-4 flex gap-2">
        {(['all', 'sent', 'received'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 ${
              filter === f ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <AvailabilityCalendar
          appointments={filteredAppointments}
          onSlotClick={handleSlotClick}
        />
      )}

      <SlotModal
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        date={selectedSlot?.date || ''}
        startTime={selectedSlot?.startTime || ''}
        endTime={selectedSlot?.endTime || ''}
        appointments={slotAppointments}
      />
    </div>
  );
}