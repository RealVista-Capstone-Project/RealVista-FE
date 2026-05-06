'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { Check, X, Clock, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useUpdateAppointmentStatus, useRespondReschedule, useCancelReschedule } from '../api/appointment.queries';
import { RescheduleModal } from './reschedule-modal';
import type { AppointmentWithListing } from '../types/appointment';
import {
  canAcceptAppointment,
  canCancelAppointment,
  getAppointmentActions,
  getAppointmentStatusInfo,
  hasStarted,
  getStatusColorClasses
} from '../utils/appointment';

interface SlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  start_time: string;
  end_time: string;
  appointments: AppointmentWithListing[];
}

export function SlotModal({
  open,
  onOpenChange,
  date,
  start_time,
  end_time,
  appointments,
}: SlotModalProps) {
  const t = useTranslations('appointments');
  const { data: currentUser } = useCurrentUser();
  const updateStatus = useUpdateAppointmentStatus();
  const respondReschedule = useRespondReschedule();
  const cancelReschedule = useCancelReschedule();

  const [selectedAptId, setSelectedAptId] = useState<string | null>(
    appointments.length === 1 ? appointments[0].appointment_id : null
  );
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithListing | null>(null);

  useEffect(() => {
    if (appointments.length === 1) {
      setSelectedAptId(appointments[0].appointment_id);
    }
  }, [appointments]);

  const selectedApt = appointments.find((a) => a.appointment_id === selectedAptId);

  const handleAccept = async (appointmentId: string) => {
    await updateStatus.mutateAsync({
      id: appointmentId,
      data: { status: 'ACCEPTED' },
    });
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!selectedAptId || !reason.trim()) return;
    await updateStatus.mutateAsync({
      id: selectedAptId,
      data: { status: 'REJECTED', reason },
    });
    setShowReason(false);
    setReason('');
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (!selectedAptId || !reason.trim()) return;
    await updateStatus.mutateAsync({
      id: selectedAptId,
      data: { status: 'CANCELED', reason },
    });
    setShowReason(false);
    setReason('');
    onOpenChange(false);
  };

  const handleRespondReschedule = async (confirm: boolean) => {
    if (!selectedAptId) return;
    await respondReschedule.mutateAsync({
      id: selectedAptId,
      data: { action: confirm ? 'ACCEPT' : 'REJECT', reason: reason.trim() || undefined }
    });
    setShowReason(false);
    setReason('');
    onOpenChange(false);
  };

  const handleWithdrawReschedule = async (appointmentId: string) => {
    await cancelReschedule.mutateAsync(appointmentId);
    onOpenChange(false);
  };

  const canAccept = (apt: AppointmentWithListing) => canAcceptAppointment(apt, currentUser?.user_id);
  const canCancel = (apt: AppointmentWithListing) => canCancelAppointment(apt, currentUser?.user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {t('appointmentFor')} {date}
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {start_time} - {end_time}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {appointments.map((apt) => {
            const actions = getAppointmentActions(apt, currentUser?.user_id);
            const statusInfo = getAppointmentStatusInfo(apt, currentUser?.user_id);
            const isStarted = hasStarted(apt.start_time);
            const isCompleted = apt.status === 'COMPLETED';

            return (
              <div
                key={apt.appointment_id}
                className={cn(
                  "border-l-[4px] transition-all duration-200 overflow-hidden rounded-md",
                  (isCompleted || (isStarted && apt.status !== 'ACCEPTED'))
                    ? "opacity-60 grayscale-[0.3] border-l-slate-400 bg-slate-50 dark:bg-slate-900/40"
                    : apt.status === 'RESCHEDULE_PENDING'
                      ? "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20"
                      : apt.status === 'ACCEPTED'
                        ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                  selectedAptId === apt.appointment_id
                    ? 'ring-1 ring-primary/20 shadow-md translate-x-1'
                    : 'border-border'
                )}
              >
                  <button
                    className="w-full text-left p-5 cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed"
                    onClick={() => setSelectedAptId(apt.appointment_id)}
                    disabled={showReason || updateStatus.isPending}
                  >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{apt.sender_name}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{apt.appointment_type === 'BLOCK' ? t('block') : t('tour')}</span>
                    </div>
                    <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm", statusInfo.colorClass)}>
                      {t(statusInfo.labelKey)}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{apt.listing_name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{apt.listing_address}</div>
                  </div>

                  {apt.sender_notes && (
                    <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-border/50 text-sm italic text-slate-600 dark:text-slate-400">
                      &quot;{apt.sender_notes}&quot;
                    </div>
                  )}
                </button>

                {selectedAptId === apt.appointment_id && !isCompleted && (
                  <div className="px-5 pb-5 pt-2 flex flex-wrap justify-end gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Accept/Reject */}
                    {actions.canAccept && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition-all"
                          onClick={(e) => { e.stopPropagation(); handleAccept(apt.appointment_id); }}
                          disabled={showReason || updateStatus.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t('accept')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-9 px-4 font-bold shadow-md transition-all"
                          onClick={(e) => { e.stopPropagation(); setShowReason(true); }}
                          disabled={showReason || updateStatus.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('reject')}
                        </Button>
                      </div>
                    )}

                    {/* Reschedule Response */}
                    {actions.canRespondReschedule && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md"
                          onClick={(e) => { e.stopPropagation(); handleRespondReschedule(true); }}
                          disabled={showReason || respondReschedule.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t('acceptReschedule')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-9 px-4 font-bold shadow-md"
                          onClick={(e) => { e.stopPropagation(); setShowReason(true); }}
                          disabled={showReason || respondReschedule.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('reject')}
                        </Button>
                      </div>
                    )}

                    {/* Withdraw Proposal */}
                    {actions.canCancelRescheduleProposal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-6 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 font-bold shadow-sm transition-all"
                        onClick={(e) => { e.stopPropagation(); handleWithdrawReschedule(apt.appointment_id); }}
                        disabled={showReason || cancelReschedule.isPending}
                      >
                        {t('withdrawProposal')}
                      </Button>
                    )}

                    {actions.canComplete && (
                      <Button
                        size="sm"
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ id: apt.appointment_id, data: { status: 'COMPLETED' } });
                          onOpenChange(false);
                        }}
                        disabled={showReason || updateStatus.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('complete')}
                      </Button>
                    )}

                    {/* Cancel Appointment */}
                    {actions.canCancel && !actions.canAccept && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-9 px-4 font-bold shadow-md"
                        onClick={(e) => { e.stopPropagation(); setShowReason(true); }}
                        disabled={showReason || updateStatus.isPending}
                      >
                        {t('cancelAppointment')}
                      </Button>
                    )}

                    {/* Reschedule Button */}
                    {actions.canReschedule && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white font-bold transition-all shadow-sm"
                        onClick={(e) => { e.stopPropagation(); setRescheduleTarget(apt); }}
                        disabled={showReason || updateStatus.isPending}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {t('reschedule')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showReason && (
          <div className="mx-6 mb-6 p-5 rounded-xl border border-red-100 bg-red-50/30 dark:bg-red-950/10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-sm font-bold text-red-800 dark:text-red-300">
              {selectedApt?.status === 'RESCHEDULE_PENDING'
                ? t('reason')
                : selectedApt?.sender_id === currentUser?.user_id
                  ? t('cancelReason')
                  : t('rejectReason')}
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={updateStatus.isPending}
              placeholder={t('enterReason') || 'Enter reason...'}
              className="bg-white dark:bg-slate-900 border-red-200 focus-visible:ring-red-500 min-h-[80px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="font-bold px-6"
                onClick={() => {
                  if (selectedApt?.status === 'RESCHEDULE_PENDING') handleRespondReschedule(false);
                  else if (selectedApt?.status === 'ACCEPTED' || selectedApt?.sender_id === currentUser?.user_id) handleCancel();
                  else handleReject();
                }}
                disabled={!reason.trim() || updateStatus.isPending}
              >
                {t('submit')}
              </Button>
              <Button variant="outline" size="sm" className="font-bold" onClick={() => setShowReason(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        <RescheduleModal
          appointment={rescheduleTarget}
          open={!!rescheduleTarget}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
        />
      </DialogContent>
    </Dialog>
  );
}