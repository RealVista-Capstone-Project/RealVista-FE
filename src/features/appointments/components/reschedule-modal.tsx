'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { vi, enUS } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { format, addMinutes } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { appointmentQueries } from '@/features/price-and-tour/api';
import { useRescheduleAppointment } from '../api/appointment.queries';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, Hourglass, Check, ChevronDown, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Textarea } from '@/shared/ui/textarea';
import type { AppointmentWithListing } from '../types/appointment';

interface RescheduleModalProps {
  appointment: AppointmentWithListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleModal({ appointment, open, onOpenChange }: RescheduleModalProps) {
  const t = useTranslations('appointments');
  const tTour = useTranslations('BookTour');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

  const { mutate: reschedule, isPending } = useRescheduleAppointment();

  useEffect(() => {
    if (open && appointment) {
      const currentStart = new Date(appointment.start_time);
      const currentEnd = new Date(appointment.end_time);
      const duration = Math.round((currentEnd.getTime() - currentStart.getTime()) / (60 * 1000));

      setDate(currentStart);
      setSelectedStartTime(format(currentStart, 'HH:mm'));
      setSelectedDuration(duration > 0 ? duration : 30);
      setReason('');
      setStep('selection');
    }
  }, [open, appointment]);

  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
  const { data: response, isLoading: loadingSlots } = useQuery({
    ...appointmentQueries.slots(appointment?.listing_id || '', formattedDate, appointment?.appointment_id),
    enabled: !!appointment?.listing_id && !!formattedDate && open,
  });

  const slots: string[] = useMemo(() => response?.payload?.data || [], [response]);

  const availableSlots: string[] = useMemo(() => {
    const allSlots = slots.map((s: string) => s.substring(0, 5));
    if (!date) return allSlots;

    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return allSlots;

    const now = new Date();
    const currentHourMin = format(now, 'HH:mm');

    return allSlots.filter((slot) => slot > currentHourMin);
  }, [slots, date]);

  const availableDurations = useMemo(() => {
    if (!selectedStartTime || !slots.length) return [30];

    const durations = [30];
    const cleanSlots = slots.map((s) => s.substring(0, 5));

    const isSameStart = appointment &&
      format(new Date(appointment.start_time), 'HH:mm') === selectedStartTime &&
      format(new Date(appointment.start_time), 'yyyy-MM-dd') === formattedDate;

    const originalDuration = appointment
      ? Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000)
      : 0;

    const nextSlotDate = addMinutes(new Date(`2000-01-01T${selectedStartTime}`), 30);
    const nextSlot = format(nextSlotDate, 'HH:mm');
    if (cleanSlots.includes(nextSlot)) {
      durations.push(60);

      const afterNextSlotDate = addMinutes(nextSlotDate, 30);
      const afterNextSlot = format(afterNextSlotDate, 'HH:mm');
      if (cleanSlots.includes(afterNextSlot)) {
        durations.push(90);
      }
    }

    // Filter out the current duration if it's the same start time
    return durations.filter((d) => !(isSameStart && d === originalDuration));
  }, [selectedStartTime, slots, appointment, formattedDate]);

  // Automatically adjust duration if it's no longer available for the selected start time
  useEffect(() => {
    if (selectedStartTime && availableDurations.length > 0) {
      if (!availableDurations.includes(selectedDuration)) {
        // Fallback to the largest available duration that is less than or equal to current,
        // or just the last available one
        const fallback = [...availableDurations]
          .reverse()
          .find((d) => d <= selectedDuration) || availableDurations[0];
        setSelectedDuration(fallback);
      }
    }
  }, [availableDurations, selectedDuration, selectedStartTime]);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const hUnit = tTour('hour') || 'h';
    const mUnit = tTour('minute') || 'm';

    if (hours > 0) {
      return remainingMins > 0 ? `${hours}${hUnit} ${remainingMins}${mUnit}` : `${hours}${hUnit}`;
    }
    return `${mins}${mUnit}`;
  };

  const handleReschedule = () => {
    if (!appointment || !date || !selectedStartTime || !reason.trim()) return;

    const formattedDateStr = format(date, 'yyyy-MM-dd');
    const newStartIso = `${formattedDateStr}T${selectedStartTime}:00`;
    const newStartDate = new Date(newStartIso);
    const newEndDate = addMinutes(newStartDate, selectedDuration);
    const newEndIso = format(newEndDate, "yyyy-MM-dd'T'HH:mm:ss");

    reschedule(
      {
        id: appointment.appointment_id,
        data: {
          start_time: newStartIso,
          end_time: newEndIso,
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          const successMsg = appointment.status === 'PENDING'
            ? t('rescheduleSuccess')
            : t('rescheduleProposedSuccess');
          toast.success(successMsg);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('genericError'));
        },
      }
    );
  };

  const [timeOpen, setTimeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2 font-bold">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {t('rescheduleTitle') || 'Propose Reschedule'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {step === 'selection' ? (
            <div className="px-6 pb-6 space-y-5">
              {/* Date Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">
                  {tTour('selectedDate')}
                </label>
                <DatePickerInput
                  value={date ? date.toISOString() : ''}
                  onChange={(_, d) => {
                    setDate(d);
                    setSelectedStartTime(null);
                  }}
                  variant="tour"
                  minDate={new Date()}
                  className="w-full"
                  locale={dateLocale}
                />
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">{tTour('startTime')}</label>
                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!date}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border border-primary/20 bg-white px-4 py-3.5 text-sm ring-offset-background hover:border-primary/50 transition-colors',
                        !selectedStartTime && 'text-muted-foreground'
                      )}
                    >
                      <span className={cn('flex items-center gap-2', !selectedStartTime && 'opacity-50')}>
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-[14px] font-medium leading-[1.4]">
                          {selectedStartTime || tTour('availableSlots')}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[350px]" align="center">
                    <div className="p-2 max-h-[200px] overflow-y-auto">
                      {loadingSlots ? (
                        <div className="flex py-6 items-center justify-center text-sm text-muted-foreground">
                          <div className="animate-pulse">{tTour('loadingSlots')}...</div>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => {
                                setSelectedStartTime(slot);
                                setTimeOpen(false);
                              }}
                              className={cn(
                                'text-sm py-2 px-1 rounded-md border transition-all duration-200 font-medium',
                                selectedStartTime === slot
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/50'
                              )}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex py-6 items-center justify-center text-sm text-muted-foreground">
                          {tTour('noSlotsAvailable')}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">{tTour('duration')}</label>
                <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!selectedStartTime}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border border-primary/20 bg-white px-4 py-3.5 text-sm ring-offset-background hover:border-primary/50 transition-colors',
                        !selectedDuration && 'text-muted-foreground'
                      )}
                    >
                      <span className={cn('flex items-center gap-2', !selectedDuration && 'opacity-50')}>
                        <Hourglass className="w-5 h-5 text-primary" />
                        <span className="text-[14px] font-medium leading-[1.4]">
                          {selectedDuration ? formatDuration(selectedDuration) : tTour('selectDuration')}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-1 w-[350px]" align="center">
                    <div className="space-y-1">
                      {[30, 60, 90].map((duration) => {
                        const isAvailable = availableDurations.includes(duration);
                        return (
                          <button
                            key={duration}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedDuration(duration);
                                setDurationOpen(false);
                              }
                            }}
                            disabled={!isAvailable}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors',
                              selectedDuration === duration
                                ? 'bg-secondary/10 text-primary font-medium'
                                : isAvailable
                                  ? 'hover:bg-gray-100 text-gray-900'
                                  : 'text-gray-400 cursor-not-allowed opacity-50'
                            )}
                          >
                            <span>{formatDuration(duration)}</span>
                            {selectedDuration === duration && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="pt-2">
                <RealVistaButton
                  onClick={() => setStep('confirmation')}
                  disabled={!date || !selectedStartTime || !availableDurations.includes(selectedDuration)}
                  className="w-full shadow-md"
                  size="large"
                >
                  {tTour('reviewBooking') || 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </RealVistaButton>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-gray-50/80 rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-center text-lg text-gray-800 pb-2 border-b border-gray-200/60">
                  {tTour('confirmDetails') || 'Confirm Details'}
                </h4>

                <div className="grid grid-cols-1 gap-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary/60" />
                      {tTour('selectedDate')}
                    </span>
                    <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm text-sm">
                      {date ? format(date, 'PP', { locale: dateLocale }) : ''}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary/60" />
                      {tTour('startTime')}
                    </span>
                    <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm text-sm">
                      {selectedStartTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Hourglass className="w-4 h-4 text-primary/60" />
                      {tTour('duration')}
                    </span>
                    <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm text-sm">
                      {formatDuration(selectedDuration)}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-1"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                      {tTour('endTime')}
                    </span>
                    <span className="font-black text-primary bg-secondary/10 px-3 py-1 rounded-lg border border-secondary/20 shadow-sm">
                      {selectedStartTime && format(addMinutes(new Date(`2000-01-01T${selectedStartTime}:00`), selectedDuration), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  {t('rescheduleReason') || 'Reason for Reschedule'}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('enterRescheduleReason') || 'Tell them why you need to change...'}
                  rows={3}
                  className="resize-none rounded-xl border-primary/10 focus:border-primary transition-all text-sm p-4 bg-white shadow-inner"
                  disabled={isPending}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <RealVistaButton
                  variant="secondary"
                  onClick={() => setStep('selection')}
                  disabled={isPending}
                  className="flex-1"
                >
                  {tTour('back') || 'Back'}
                </RealVistaButton>
                <RealVistaButton
                  onClick={handleReschedule}
                  disabled={!reason.trim() || isPending}
                  className="flex-1 shadow-lg"
                >
                  {isPending ? t('sending') || '...' : (appointment?.status === 'PENDING' ? t('updateSchedule') : t('submitProposal'))}
                </RealVistaButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
