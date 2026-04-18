'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, addDays, startOfWeek } from 'date-fns';
import { useAppointments } from '../api/appointment.queries';
import { SlotModal } from './slot-modal';
import { Availability } from '@/shared/ui/availability';
import type { AppointmentWithListing } from '../types/appointment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Textarea,
  Button
} from '@/shared/ui';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { Clock, X, RefreshCw } from 'lucide-react';
import { canCancelAppointment } from '../utils/appointment';
import { useUpdateAppointmentStatus } from '../api/appointment.queries';
import { toast } from 'sonner';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

export function PublicAppointmentsPage() {
  const t = useTranslations('appointments');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { data: currentUser } = useCurrentUser();
  const updateStatus = useUpdateAppointmentStatus();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Reason dialog for cancellation
  const [pendingAction, setPendingAction] = useState<{
    appointmentId: string;
    action: 'CANCEL';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const start_date = format(currentWeekStart, 'yyyy-MM-dd');
  const end_date = format(addDays(currentWeekStart, 29), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading, refetch } = useAppointments({
    start_date,
    end_date,
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
      // Note: We don't have listingFilter here because public users only see their own requests
      return matchesStatus;
    });
  }, [appointments, statusFilter]);

  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    start_time: string;
    end_time: string;
    appointments: AppointmentWithListing[];
  } | null>(null);

  const handleAppointmentClick = (
    appointment: AppointmentWithListing,
    date: string,
    startTime: string,
    endTime: string
  ) => {
    const slotAppointments = filteredAppointments.filter(
      (apt: AppointmentWithListing): boolean =>
        apt.start_time.startsWith(date) &&
        apt.start_time.slice(11, 16) === startTime
    );
    setSelectedSlot({
      date,
      start_time: startTime,
      end_time: endTime,
      appointments: slotAppointments
    });
  };

  const handleOpenReasonDialog = (e: React.MouseEvent, appointmentId: string, action: 'CANCEL') => {
    e.stopPropagation();
    setPendingAction({ appointmentId, action });
    setActionReason('');
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !actionReason.trim()) return;

    try {
      await updateStatus.mutateAsync({
        id: pendingAction.appointmentId,
        data: {
          status: 'CANCELED',
          reason: actionReason
        },
      });
      toast.success(t('canceled'));
      setPendingAction(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('genericError'));
    }
  };

  const renderAppointmentCard = (apt: AppointmentWithListing, dateString: string, startTime: string, endTime: string) => {
    const isPending = apt.status === 'PENDING';
    const isAccepted = apt.status === 'ACCEPTED';
    const canCancel = canCancelAppointment(apt, currentUser?.user_id);

    return (
      <div
        className="flex h-full flex-col p-1 text-inherit overflow-hidden"
        title={`${apt.listing_name || t('tour')}${apt.rejection_reason ? `\n${t('rejectReason')}: ${apt.rejection_reason}` : ''}${apt.cancellation_reason ? `\n${t('cancelReason')}: ${apt.cancellation_reason}` : ''}`}
      >
        <div className="font-semibold text-xs leading-none truncate" title={apt.listing_name || t('tour')}>
          {apt.listing_name || t('tour')}
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-80">
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="text-[10px] uppercase leading-none truncate">
            {startTime.split(':')[0]}:{startTime.split(':')[1]} - {endTime.split(':')[0]}:{endTime.split(':')[1]}
          </span>
        </div>

        {(apt.rejection_reason || apt.cancellation_reason) && (
          <div className="mt-1 text-[10px] leading-tight text-red-600 dark:text-red-400 line-clamp-1 italic">
            {apt.rejection_reason || apt.cancellation_reason}
          </div>
        )}

        {/* Quick Cancel button for Buyer/Tenant */}
        {canCancel && (isPending || isAccepted) && (
          <div className="absolute bottom-1 right-1 flex items-center justify-end gap-1 shrink-0 z-20 pointer-events-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm pl-1 rounded-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => handleOpenReasonDialog(e, apt.appointment_id, 'CANCEL')}
                  className="rounded bg-gray-500/20 p-1 text-gray-700 hover:bg-gray-500/30 dark:text-gray-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('cancelRuleTooltip')}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className='flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8'>
        {/* Header Section */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground'>{t('publicSubtitle') || 'View and manage your tour requests'}</p>
          </div>

          <div className='flex items-center gap-2'>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            >
              <SelectTrigger className='w-[160px] bg-white'>
                <SelectValue placeholder={t('statusFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>{t('all')}</SelectItem>
                <SelectItem value='PENDING'>{t('pending')}</SelectItem>
                <SelectItem value='ACCEPTED'>{t('accepted')}</SelectItem>
                <SelectItem value='REJECTED'>{t('rejected')}</SelectItem>
                <SelectItem value='CANCELED'>{t('canceled')}</SelectItem>
                <SelectItem value='COMPLETED'>{t('completed')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Reload Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-white"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('reload')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Section */}
        <div className='flex-1 min-h-0 rounded-2xl border border-primary/20 bg-white shadow-sm overflow-hidden'>
          <Availability
            appointments={filteredAppointments}
            onWeekChange={setCurrentWeekStart}
            onAppointmentClick={handleAppointmentClick}
            mode='view'
            isLoading={isLoading}
            locale={(locale as any) === 'vi' ? 'vi' : 'en'}
            renderAppointmentCard={renderAppointmentCard}
          />
        </div>

        {/* Reason Dialog */}
        <Dialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirmCancel')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">{t('cancelReason')}</label>
              <Textarea
                placeholder={t('enterCancelReason')}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t('cancel')}</Button>
              </DialogClose>
              <Button
                onClick={handleConfirmAction}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!actionReason.trim() || updateStatus.isPending}
              >
                {t('submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal */}
        {selectedSlot && (
          <SlotModal
            open={!!selectedSlot}
            onOpenChange={(open) => !open && setSelectedSlot(null)}
            date={selectedSlot.date}
            start_time={selectedSlot.start_time}
            end_time={selectedSlot.end_time}
            appointments={selectedSlot.appointments}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
