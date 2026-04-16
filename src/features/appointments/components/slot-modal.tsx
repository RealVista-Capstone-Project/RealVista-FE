'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useUpdateAppointmentStatus } from '../api/appointment.queries';
import type { AppointmentWithListing } from '../types/appointment';
import { canCancelAppointment, getStatusColorClasses } from '../utils/appointment';

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

  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');

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

  const canAccept = (apt: AppointmentWithListing) =>
    currentUser?.user_id === apt.receiver_id && apt.status === 'PENDING';

  const canCancel = (apt: AppointmentWithListing) => canCancelAppointment(apt, currentUser?.user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('appointmentFor')} {date} {start_time} - {end_time}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.appointment_id}
              className={`rounded-lg border p-4 ${selectedAptId === apt.appointment_id ? 'border-primary' : ''
                }`}
            >
              <button
                className="w-full text-left focus:outline-none"
                onClick={() => setSelectedAptId(apt.appointment_id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{apt.sender_name}</span>
                  <Badge className={getStatusColorClasses(apt.status)}>
                    {t(apt.status.toLowerCase())}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-gray-500">{apt.listing_name}</div>
                <div className="text-sm text-gray-500">{apt.listing_address}</div>
                {apt.sender_notes && (
                  <div className="mt-2 text-sm">{apt.sender_notes}</div>
                )}
              </button>

              {selectedAptId === apt.appointment_id && (canAccept(apt) || canCancel(apt)) && (
                <div className="mt-4 flex justify-end gap-2">
                  {canAccept(apt) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(apt.appointment_id)}
                        disabled={updateStatus.isPending}
                      >
                        {t('accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowReason(true)}
                      >
                        {t('reject')}
                      </Button>
                    </>
                  )}
                  {canCancel(apt) && !canAccept(apt) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowReason(true)}
                    >
                      {t('cancel')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {showReason && (
          <div className="mt-4 space-y-2">
            <label>
              {selectedApt?.sender_id === currentUser?.user_id
                ? t('cancelReason')
                : t('rejectReason')}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                selectedApt?.sender_id === currentUser?.user_id
                  ? t('enterCancelReason')
                  : t('enterRejectReason')
              }
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedApt?.status === 'ACCEPTED') {
                    handleCancel();
                  } else if (selectedApt?.sender_id === currentUser?.user_id) {
                    handleCancel();
                  } else {
                    handleReject();
                  }
                }}
                disabled={!reason.trim() || updateStatus.isPending}
              >
                {t('submit')}
              </Button>
              <Button variant="outline" onClick={() => setShowReason(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}