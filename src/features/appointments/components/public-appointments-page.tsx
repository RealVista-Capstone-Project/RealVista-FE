'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { useAppointments, useUpdateAppointmentStatus, useRespondReschedule, useCancelReschedule } from '../api/appointment.queries';
import { SlotModal } from './slot-modal';
import { RescheduleModal } from './reschedule-modal';
import { Availability } from '@/shared/ui/availability';
import type { AppointmentWithListing } from '../types/appointment';
import { Badge } from '@/shared/ui/badge';
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
import { Clock, X, RefreshCw, Check, CalendarRange } from 'lucide-react';
import {
  canCancelAppointment,
  getAppointmentActions,
  getAppointmentStatusInfo,
  hasStarted
} from '../utils/appointment';
import { toast } from 'sonner';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED' | 'RESCHEDULE_PENDING';

export function PublicAppointmentsPage() {
  const t = useTranslations('appointments');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { data: currentUser } = useCurrentUser();
  const updateStatus = useUpdateAppointmentStatus();
  const respondReschedule = useRespondReschedule();
  const cancelReschedule = useCancelReschedule();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithListing | null>(null);

  // Reason dialog for cancellation
  const [pendingAction, setPendingAction] = useState<{
    appointmentId: string;
    action: 'CANCEL' | 'RESCHEDULE_ACCEPT' | 'RESCHEDULE_REJECT';
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
      let matchesStatus = false;
      if (statusFilter === 'ALL') {
        // In "ALL" view, hide CANCELED or REJECTED appointments entirely to keep the calendar clean.
        // Users can still see them by explicitly filtering for those statuses.
        matchesStatus = apt.status !== 'CANCELED' && apt.status !== 'REJECTED';
      } else {
        matchesStatus = apt.status === statusFilter;
      }

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

  const handleOpenReasonDialog = (e: React.MouseEvent, appointmentId: string, action: 'CANCEL' | 'RESCHEDULE_ACCEPT' | 'RESCHEDULE_REJECT') => {
    e.stopPropagation();
    setPendingAction({ appointmentId, action });
    setActionReason('');
  };

  const handleCancelProposal = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    try {
      await cancelReschedule.mutateAsync(appointmentId);
      toast.success(t('rescheduleResponseSuccess'));
    } catch (error) {
      console.error('Failed to cancel proposal:', error);
      toast.error(t('genericError'));
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !actionReason.trim()) return;

    try {
      if (pendingAction.action === 'RESCHEDULE_ACCEPT' || pendingAction.action === 'RESCHEDULE_REJECT') {
        await respondReschedule.mutateAsync({
          id: pendingAction.appointmentId,
          data: {
            action: pendingAction.action === 'RESCHEDULE_ACCEPT' ? 'ACCEPT' : 'REJECT',
            reason: actionReason.trim(),
          }
        });
        toast.success(t('rescheduleResponseSuccess'));
      } else {
        await updateStatus.mutateAsync({
          id: pendingAction.appointmentId,
          data: {
            status: 'CANCELED',
            reason: actionReason
          },
        });
        toast.success(t('canceled'));
      }
      setPendingAction(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('genericError'));
    }
  };

  const renderAppointmentCard = (apt: AppointmentWithListing, dateString: string, startTime: string, endTime: string) => {
    const actions = getAppointmentActions(apt, currentUser?.user_id);
    const statusInfo = getAppointmentStatusInfo(apt, currentUser?.user_id);
    const isStarted = hasStarted(apt.start_time);
    const isCompleted = apt.status === 'COMPLETED';

    return (
      <div className={cn("flex flex-col h-full min-h-0 relative", (isCompleted || (isStarted && apt.status !== 'ACCEPTED')) && "opacity-60")}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="text-[10px] font-bold leading-tight truncate text-slate-900 dark:text-slate-100 pr-1">
            {apt.listing_name || t('tour')}
          </div>
          {apt.appointment_type !== 'BLOCK' && (
            <Badge className={cn('px-1.5 py-0 h-3.5 text-[8px] font-bold uppercase border-0 shadow-none shrink-0', statusInfo.colorClass)}>
              {t(statusInfo.labelKey)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-[8px] text-slate-500 font-medium">
          <Clock className="w-2 h-2" />
          <span>{startTime} – {endTime}</span>
        </div>

        {apt.status === 'RESCHEDULE_PENDING' && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-[8px] font-bold text-orange-700 dark:text-orange-300 w-fit truncate">
            <RefreshCw className="w-2 h-2 animate-spin-slow flex-shrink-0" />
            <span className="truncate">{t('reschedule_pending')}</span>
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
                <SelectValue placeholder={t('statusLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>{t('all')}</SelectItem>
                <SelectItem value='PENDING'>{t('pending')}</SelectItem>
                <SelectItem value='ACCEPTED'>{t('accepted')}</SelectItem>
                <SelectItem value='RESCHEDULE_PENDING'>{t('reschedule_pending')}</SelectItem>
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
              <DialogTitle>
                {pendingAction?.action === 'RESCHEDULE_ACCEPT' ? t('respondReschedule') :
                 pendingAction?.action === 'RESCHEDULE_REJECT' ? t('rejectReason') :
                 t('confirmCancel')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                {pendingAction?.action === 'RESCHEDULE_ACCEPT' ? t('proposedTime') :
                 pendingAction?.action === 'RESCHEDULE_REJECT' ? t('rejectReason') :
                 t('cancelReason')}
              </label>
              <Textarea
                placeholder={
                  pendingAction?.action === 'RESCHEDULE_ACCEPT' ? t('enterReason') :
                  pendingAction?.action === 'RESCHEDULE_REJECT' ? t('enterRejectReason') :
                  t('enterCancelReason')
                }
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

        {/* Modals */}
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

        <RescheduleModal
          appointment={rescheduleTarget}
          open={!!rescheduleTarget}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
        />
      </div>
    </TooltipProvider>
  );
}
