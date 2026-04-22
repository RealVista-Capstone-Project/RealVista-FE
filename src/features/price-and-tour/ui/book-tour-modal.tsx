import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { vi, enUS } from 'date-fns/locale';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { format, addMinutes, addDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentQueries, appointmentKeys, useBookTour } from '@/features/price-and-tour/api';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, Hourglass, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

interface BookTourModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BookTourModal({ listingId, isOpen, onClose }: BookTourModalProps) {
  const t = useTranslations('BookTour');
  const tGlobal = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;
  const [date, setDate] = useState<Date | undefined>(() => {
    const now = new Date();
    return now.getHours() >= 17 ? addDays(now, 1) : now;
  });

  // New state for duration-based booking
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

  const { mutate: bookTour, isPending: submitting } = useBookTour();
  const queryClient = useQueryClient();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.getHours() >= 17 ? addDays(now, 1) : now);
      setSelectedStartTime(null);
      setSelectedDuration(null);
      setStep('selection');
    }
  }, [isOpen]);

  // Query for slots
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
  const { data: response, isLoading: loading } = useQuery(
    appointmentQueries.slots(listingId, formattedDate)
  );

  const slots: string[] = useMemo(() => response?.payload?.data || [], [response]);

  // Derived state for display
  const availableSlots: string[] = useMemo(() => {
    const allSlots = slots.map((s: string) => s.substring(0, 5));
    if (!date) return allSlots;

    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return allSlots;

    const now = new Date();
    const currentHourMin = format(now, 'HH:mm');

    return allSlots.filter((slot) => slot > currentHourMin);
  }, [slots, date]);

  // Reset selection when date changes
  useEffect(() => {
    if (date && isOpen) {
      setSelectedStartTime(null);
      setSelectedDuration(null);
    }
  }, [date, isOpen]);

  // Calculate available durations for the selected start time
  const availableDurations = useMemo(() => {
    if (!selectedStartTime) return [];

    const durations = [30]; // 30 mins is always an option if the slot exists (which it does if selected)

    // Helper to check if a specific time slot exists in available slots
    const isSlotAvailable = (timeStr: string) => availableSlots.includes(timeStr);

    // Parse start time to add minutes
    const baseDate = new Date(`2000-01-01T${selectedStartTime}:00`);

    // Check for 60 mins (needs start + 30m)
    const nextSlot30 = format(addMinutes(baseDate, 30), 'HH:mm');
    if (isSlotAvailable(nextSlot30)) {
      durations.push(60);

      // Check for 90 mins (needs start + 30m AND start + 60m)
      const nextSlot60 = format(addMinutes(baseDate, 60), 'HH:mm');
      if (isSlotAvailable(nextSlot60)) {
        durations.push(90);
      }
    }

    return durations;
  }, [selectedStartTime, availableSlots]);

  // Handler for selecting a start time
  const handleStartTimeSelect = (time: string, setOpen: (open: boolean) => void) => {
    setSelectedStartTime(time);
    setSelectedDuration(null); // Reset duration when changing start time
    setOpen(false);
  };

  const handleReview = () => {
    if (!date || !selectedStartTime || !selectedDuration) return;
    setStep('confirmation');
  };

  const handleBack = () => {
    setStep('selection');
  };

  const handleBook = () => {
    if (!date || !selectedStartTime || !selectedDuration) return;

    const formattedDateForBooking = format(date, 'yyyy-MM-dd');

    // Generate the list of slots based on duration
    const slotsToBook: string[] = [];
    const baseDate = new Date(`${formattedDateForBooking}T${selectedStartTime}:00`);

    // Add start slot
    slotsToBook.push(`${formattedDateForBooking}T${selectedStartTime}:00`);

    // Add additional slots based on duration
    if (selectedDuration >= 60) {
      const nextSlot1 = format(addMinutes(baseDate, 30), 'HH:mm');
      slotsToBook.push(`${formattedDateForBooking}T${nextSlot1}:00`);
    }

    if (selectedDuration >= 90) {
      const nextSlot2 = format(addMinutes(baseDate, 60), 'HH:mm');
      slotsToBook.push(`${formattedDateForBooking}T${nextSlot2}:00`);
    }

    bookTour(
      {
        listing_id: listingId,
        selected_slots: slotsToBook,
        notes: '',
      },
      {
        onSuccess: () => {
          toast.success(t('bookingSuccess'));
          queryClient.invalidateQueries({
            queryKey: appointmentKeys.slots(listingId, formattedDateForBooking),
          });
          onClose();
          setSelectedStartTime(null);
          setSelectedDuration(null);
          setStep('selection');
        },
        onError: (error) => {
          handleErrorApi({ error, t: tGlobal });
        },
      }
    );
  };

  // Helper to format duration display
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const hUnit = t('hour');
    const mUnit = t('minute');

    if (hours > 0) {
      return remainingMins > 0 ? `${hours}${hUnit} ${remainingMins}${mUnit}` : `${hours}${hUnit}`;
    }
    return `${mins}${mUnit}`;
  };

  const [timeOpen, setTimeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[400px] p-0 overflow-hidden'>
        <DialogHeader className='px-6 pt-6 pb-2'>
          <DialogTitle className='text-xl flex items-center gap-2'>
            <CalendarIcon className='w-5 h-5 text-primary' />
            {t('scheduleTour')}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col'>
          {step === 'selection' ? (
            <div className='px-6 pb-6 space-y-5'>
              {/* Date Selection */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-gray-700 block'>
                  {t('selectedDate')}
                </label>
                <DatePickerInput
                  value={date ? date.toISOString() : ''}
                  onChange={(_, d) => setDate(d)}
                  variant='tour'
                  placeholder={t('selectedDate')}
                  minDate={new Date()}
                  className='w-full'
                  locale={dateLocale}
                />
              </div>

              {/* Time Slot Selection */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-gray-700 block'>{t('startTime')}</label>
                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      disabled={!date}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border border-primary/20 bg-white px-4 py-3.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/20-hover transition-colors',
                        !selectedStartTime && 'text-muted-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center gap-2',
                          !selectedStartTime && 'opacity-50'
                        )}
                      >
                        <Clock className='w-5 h-5' />
                        <span className='text-[14px] font-medium leading-[1.4]'>
                          {selectedStartTime || t('availableSlots')}
                        </span>
                      </span>
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='p-0 w-[350px]' align='center'>
                    <div className='p-2 max-h-[200px] overflow-y-auto'>
                      {loading ? (
                        <div className='flex py-6 items-center justify-center text-sm text-muted-foreground'>
                          <div className='animate-pulse'>{t('loadingSlots')}...</div>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className='grid grid-cols-4 gap-2'>
                          {availableSlots.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => handleStartTimeSelect(slot, setTimeOpen)}
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
                        <div className='flex py-6 items-center justify-center text-sm text-muted-foreground'>
                          {t('noSlotsAvailable')}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration Selection */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-gray-700 block'>{t('duration')}</label>
                <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      disabled={!selectedStartTime}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border border-primary/20 bg-white px-4 py-3.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/20-hover transition-colors',
                        !selectedDuration && 'text-muted-foreground'
                      )}
                    >
                      <span
                        className={cn('flex items-center gap-2', !selectedDuration && 'opacity-50')}
                      >
                        <Hourglass className='w-5 h-5' />
                        <span className='text-[14px] font-medium leading-[1.4]'>
                          {selectedDuration
                            ? formatDuration(selectedDuration)
                            : t('selectDuration')}
                        </span>
                      </span>
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='p-1 w-[350px]' align='center'>
                    <div className='space-y-1'>
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
                            {selectedDuration === duration && (
                              <Check className='w-4 h-4 text-primary' />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className='pt-2'>
                <RealVistaButton
                  onClick={handleReview}
                  disabled={!date || !selectedStartTime || !selectedDuration}
                  className='w-full shadow-md'
                  size='large'
                >
                  {t('reviewBooking')}
                </RealVistaButton>
              </div>
            </div>
          ) : (
            <div className='space-y-4 px-6 pb-6'>
              <div className='bg-gray-50/80 rounded-xl border border-gray-100 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300'>
                <h4 className='font-semibold text-center text-lg text-gray-800 pb-2 border-b border-gray-200'>
                  {t('confirmDetails')}
                </h4>

                <div className='grid grid-cols-1 gap-4'>
                  <div className='flex justify-between items-center group'>
                    <span className='text-muted-foreground flex items-center gap-2'>
                      <CalendarIcon className='w-4 h-4 text-gray-400' />
                      {t('selectedDate')}
                    </span>
                    <span className='font-medium text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm'>
                      {date ? format(date, 'PP', { locale: dateLocale }) : ''}
                    </span>
                  </div>

                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-gray-400' />
                      {t('startTime')}
                    </span>
                    <span className='font-medium text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm'>
                      {selectedStartTime}
                    </span>
                  </div>

                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground flex items-center gap-2'>
                      <Hourglass className='w-4 h-4 text-gray-400' />
                      {t('duration')}
                    </span>
                    <span className='font-medium text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm'>
                      {selectedDuration ? formatDuration(selectedDuration) : '-'}
                    </span>
                  </div>

                  <div className='border-t border-dashed border-gray-200 my-1'></div>

                  <div className='flex justify-between items-center'>
                    <span className='text-primary font-medium flex items-center gap-2'>
                      {t('endTime')}
                    </span>
                    <span className='font-bold text-primary bg-secondary/10 px-3 py-1 rounded-md border border-secondary/20'>
                      {selectedStartTime && selectedDuration
                        ? format(
                          addMinutes(
                            new Date(`2000-01-01T${selectedStartTime}:00`),
                            selectedDuration
                          ),
                          'HH:mm'
                        )
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <RealVistaButton
                  variant='secondary'
                  onClick={handleBack}
                  disabled={submitting}
                  className='flex-1'
                >
                  {t('back')}
                </RealVistaButton>
                <RealVistaButton onClick={handleBook} disabled={submitting} className='flex-1'>
                  {submitting ? t('booking') : t('confirmBooking')}
                </RealVistaButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
