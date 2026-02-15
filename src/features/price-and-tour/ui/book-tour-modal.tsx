import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Calendar } from '@/shared/ui/calendar';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentQueries, appointmentKeys, useBookTour } from '@/features/price-and-tour/api';
import { toast } from 'sonner';

interface BookTourModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BookTourModal({ listingId, isOpen, onClose }: BookTourModalProps) {
  const t = useTranslations('BookTour');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const { mutate: bookTour, isPending: submitting } = useBookTour();
  const queryClient = useQueryClient();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(new Date());
      setSelectedSlots([]);
    }
  }, [isOpen]);

  // Query for slots
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
  const { data: response, isLoading: loading } = useQuery(
    appointmentQueries.slots(listingId, formattedDate)
  );

  const slots = useMemo(() => response?.payload?.data || [], [response]);

  // Derived state for display
  const availableSlots = useMemo(() => {
    return slots.map((s: string) => s.substring(0, 5));
  }, [slots]);

  useEffect(() => {
    if (date && isOpen) {
      if (selectedSlots.length > 0) {
        setSelectedSlots([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, isOpen]);

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots((prev) => prev.filter((s) => s !== slot));
    } else {
      if (selectedSlots.length >= 3) {
        toast.warning(t('maxSlotsReached'));
        return;
      }
      setSelectedSlots((prev) => [...prev, slot]);
    }
  };

  const handleBook = () => {
    if (!date || selectedSlots.length === 0) return;

    const formattedDateForBooking = format(date, 'yyyy-MM-dd');
    const fullTimestamps = selectedSlots.map((time) => {
      // time is "HH:mm", we need to append ":00" for seconds if backend expects it
      // or standard ISO format. Previous implementation used T${time}:00
      return `${formattedDateForBooking}T${time}:00`;
    });

    bookTour(
      {
        listing_id: listingId,
        selected_slots: fullTimestamps,
        notes: '',
      },
      {
        onSuccess: () => {
          toast.success(t('bookingSuccess'));
          queryClient.invalidateQueries({
            queryKey: appointmentKeys.slots(listingId, formattedDateForBooking),
          });
          onClose(); // Close modal on success
          setSelectedSlots([]);
        },
        onError: (error) => {
          console.error(error);
          toast.error(t('bookingError'));
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('scheduleTour')}</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          {/* Date Selection */}
          <div className='flex justify-center'>
            <Calendar
              mode='single'
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className='rounded-md border'
            />
          </div>

          {/* Slots Selection */}
          {date && (
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>
                {t('availableSlots')} ({format(date, 'MMM dd')})
              </h4>
              {loading ? (
                <div className='text-center text-sm py-4 text-muted-foreground'>
                  {t('loadingSlots')}...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className='grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1'>
                  {availableSlots.map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`
                                        text-xs py-2 px-1 rounded-md border transition-colors
                                        ${
                                          selectedSlots.includes(slot)
                                            ? 'bg-main-primary text-white border-main-primary'
                                            : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
                                        }
                                    `}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='text-center text-sm py-4 text-muted-foreground'>
                  {t('noSlotsAvailable')}
                </div>
              )}

              {selectedSlots.length > 0 && (
                <div className='text-xs text-muted-foreground text-center'>
                  {t('selectedCount', { count: selectedSlots.length, max: 3 })}
                </div>
              )}
            </div>
          )}

          <RealVistaButton
            onClick={handleBook}
            disabled={submitting || selectedSlots.length === 0}
            className='w-full mt-2'
          >
            {submitting ? t('booking') : t('confirmBooking')}
          </RealVistaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
