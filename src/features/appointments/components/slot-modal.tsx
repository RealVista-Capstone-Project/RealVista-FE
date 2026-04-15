'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useUpdateAppointmentStatus } from '../api/appointment.queries';
import type { AppointmentWithListing, AppointmentStatus } from '../types/appointment';

interface SlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  startTime: string;
  endTime: string;
  appointments: AppointmentWithListing[];
}

const statusConfig: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  ACCEPTED: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  CANCELED: 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
  COMPLETED: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
};

export function SlotModal({
  open,
  onOpenChange,
  date,
  startTime,
  endTime,
  appointments,
}: SlotModalProps) {
  const t = useTranslations('appointments');
  const { data: currentUser } = useCurrentUser();
  const updateStatus = useUpdateAppointmentStatus();

  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');

  const selectedApt = appointments.find((a) => a.appointmentId === selectedAptId);

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
    currentUser?.userId === apt.receiverId && apt.status === 'PENDING';

  const canCancel = (apt: AppointmentWithListing) =>
    currentUser?.userId === apt.senderId && apt.status === 'PENDING';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('appointmentFor')} {date} {startTime} - {endTime}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.appointmentId}
              className={`rounded-lg border p-4 ${
                selectedAptId === apt.appointmentId ? 'border-primary' : ''
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setSelectedAptId(apt.appointmentId)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{apt.senderName}</span>
                  <Badge className={statusConfig[apt.status]}>
                    {t(apt.status.toLowerCase())}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-gray-500">{apt.listingName}</div>
                <div className="text-sm text-gray-500">{apt.listingAddress}</div>
                {apt.senderNotes && (
                  <div className="mt-2 text-sm">{apt.senderNotes}</div>
                )}
              </button>

              {selectedAptId === apt.appointmentId && (
                <div className="mt-3 flex gap-2">
                  {canAccept(apt) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(apt.appointmentId)}
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
                  {canCancel(apt) && (
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
              {selectedApt?.senderId === currentUser?.userId
                ? t('cancelReason')
                : t('rejectReason')}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                selectedApt?.senderId === currentUser?.userId
                  ? t('enterCancelReason')
                  : t('enterRejectReason')
              }
            />
            <div className="flex gap-2">
              <Button
                onClick={
                  selectedApt?.senderId === currentUser?.userId
                    ? handleCancel
                    : handleReject
                }
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