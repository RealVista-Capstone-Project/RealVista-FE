'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, addDays, startOfWeek } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import { useAppointments, useUpdateAppointmentStatus, useSyncBlocks, useDeleteAppointment } from '../api/appointment.queries';
import { Button } from '@/shared/ui/button';
import { SlotModal } from './slot-modal';
import { Availability } from '@/shared/ui/availability';
import type { AppointmentWithListing } from '../types/appointment';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { Check, X, Clock, Settings2, Save, RepeatIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { canCancelAppointment, isValidUUID, toLocalIso } from '../utils/appointment';
import { toast } from 'sonner';
import { TimeSpan } from '@/shared/ui/availability';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog';
import { Switch } from '@/shared/ui/switch/switch';
import { Textarea } from '@/shared/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listingQueries } from '@/entities/listing/api';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

export function AppointmentsPage() {
  const t = useTranslations('appointments');
  const locale = useLocale();
  const { data: currentUser } = useCurrentUser();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [listingFilter, setListingFilter] = useState<string>(() => searchParams.get('listing') ?? 'ALL');
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Fetch agent's managed listings for the filter dropdown
  const { data: managedListingsPage } = useQuery(listingQueries.managed({ page: 0, size: 100 }));
  const managedListings = managedListingsPage?.content ?? [];

  const [isEditingBlocks, setIsEditingBlocks] = useState(false);
  const [editableBlocks, setEditableBlocks] = useState<TimeSpan<AppointmentWithListing>[]>([]);
  const [originalBlockIds, setOriginalBlockIds] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(false);
  const [repeatCount, setRepeatCount] = useState<number>(1);

  // Quick reject/cancel reason dialog
  const [pendingAction, setPendingAction] = useState<{
    appointmentId: string;
    action: 'REJECT' | 'CANCEL';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Per-week block cache: saves drawn blocks when navigating between weeks in edit-blocks mode.
  // Key = week start timestamp (ms), Value = blocks array for that week.
  const weekBlocksCache = useRef<Map<number, TimeSpan<AppointmentWithListing>[]>>(new Map());
  const prevWeekStartMs = useRef<number>(currentWeekStart.getTime());
  // Always-current ref so the week-change effect can read the latest blocks without being in the dep array
  const editableBlocksRef = useRef(editableBlocks);
  useEffect(() => { editableBlocksRef.current = editableBlocks; }, [editableBlocks]);

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

      // Listing filter
      const matchesListing = listingFilter === 'ALL' || apt.listing_id === listingFilter;

      return matchesStatus && matchesListing;
    });
  }, [appointments, statusFilter, listingFilter]);

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
    setSelectedSlot({ date, start_time: startTime, end_time: endTime, appointments: slotAppointments });
  };

  const syncBlocks = useSyncBlocks();

  const buildBlocksForWeek = (weekStart: Date) => {
    const weekEnd = addDays(weekStart, 6);
    return appointments
      .filter((apt) => {
        if (apt.appointment_type !== 'BLOCK') return false;
        const aptDate = new Date(apt.start_time);
        return aptDate >= weekStart && aptDate <= weekEnd;
      })
      .map((apt) => {
        const start = new Date(apt.start_time);
        const end = new Date(apt.end_time);
        const dayIndex = start.getDay();
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        return {
          id: apt.appointment_id,
          week_day: dayIndex === 0 ? 6 : dayIndex - 1,
          start_time: `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`,
          end_time: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
          appointment: apt,
        };
      });
  };

  const handleStartEditingBlocks = () => {
    weekBlocksCache.current.clear();
    prevWeekStartMs.current = currentWeekStart.getTime();
    const initialBlocks = buildBlocksForWeek(currentWeekStart);
    setEditableBlocks(initialBlocks);
    setOriginalBlockIds(new Set(initialBlocks.map((b) => b.id)));
    setIsEditingBlocks(true);
  };

  const stopEditingBlocks = () => {
    weekBlocksCache.current.clear();
    setIsEditingBlocks(false);
  };

  // When week changes while in edit-blocks mode:
  //   1. Save the outgoing week's blocks into the cache (keyed by week timestamp).
  //   2. Restore from cache if we've visited the new week before, otherwise load from API.
  const currentWeekStartMs = currentWeekStart.getTime();
  useEffect(() => {
    if (!isEditingBlocks) return;

    const prevMs = prevWeekStartMs.current;
    // Save outgoing week's blocks to cache before switching
    if (prevMs !== currentWeekStartMs) {
      weekBlocksCache.current.set(prevMs, editableBlocksRef.current);
    }
    prevWeekStartMs.current = currentWeekStartMs;

    // Restore cached blocks if we've been here before, otherwise load from API.
    // IMPORTANT: always recompute originalBlockIds from the API data (real UUIDs only),
    // never from the cache — cache may contain newly-drawn blocks with nanoid IDs.
    const apiBlocks = buildBlocksForWeek(currentWeekStart);
    setOriginalBlockIds(new Set(apiBlocks.map((b) => b.id)));

    const cached = weekBlocksCache.current.get(currentWeekStartMs);
    if (cached !== undefined) {
      setEditableBlocks(cached);
    } else {
      setEditableBlocks(apiBlocks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStartMs]);

  const handleSaveBlocks = async (shouldRepeat: boolean, repeatCount: number) => {
    setShowSaveDialog(false);

    // All weeks to sync: current week + optional future weeks
    const weeksToSync = [0, ...(shouldRepeat ? Array.from({ length: repeatCount }, (_, i) => i + 1) : [])];

    const skippedDetails: string[] = [];

    try {
      for (const weekOffset of weeksToSync) {
        const weekStart = addDays(currentWeekStart, weekOffset * 7);
        const weekEnd = addDays(weekStart, 6);

        // Collect TOUR appointments for this target week to detect conflicts
        const toursThisWeek = appointments.filter((apt) => {
          if (apt.appointment_type !== 'TOUR') return false;
          const aptDate = new Date(apt.start_time);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });

        // Build blocks for this week, skipping any that overlap a TOUR
        const blocksData: { start_time: string; end_time: string; appointment_id?: string }[] = [];

        for (const block of editableBlocks) {
          const blockDate = addDays(weekStart, block.week_day);
          const blockStartIso = toLocalIso(blockDate, block.start_time);
          const blockEndIso = toLocalIso(blockDate, block.end_time);
          const blockStartMs = new Date(blockStartIso).getTime();
          const blockEndMs = new Date(blockEndIso).getTime();

          // Check overlap with any TOUR on the same day
          const hasConflict = toursThisWeek.some((tour) => {
            const tourStart = new Date(tour.start_time).getTime();
            const tourEnd = new Date(tour.end_time).getTime();
            return blockStartMs < tourEnd && blockEndMs > tourStart;
          });

          if (hasConflict) {
            // Record day + time for display
            const dateFnsLocale = locale === 'vi' ? viLocale : enUS;
            const dayLabel = format(blockDate, locale === 'vi' ? 'EEEE dd/MM' : 'EEE MM/dd', { locale: dateFnsLocale });
            skippedDetails.push(`${dayLabel} ${block.start_time}–${block.end_time}`);
            continue;
          }

          blocksData.push({
            start_time: blockStartIso,
            end_time: blockEndIso,
            // Only pass appointment_id for existing DB records (real UUID), not newly drawn blocks
            appointment_id: weekOffset === 0 && originalBlockIds.has(block.id) && isValidUUID(block.id) ? block.id : undefined,
          });
        }

        // Format week range as ISO datetimes
        const startDateIso = `${format(weekStart, 'yyyy-MM-dd')}T00:00:00`;
        const endDateIso = `${format(weekEnd, 'yyyy-MM-dd')}T23:59:59`;

        await syncBlocks.mutateAsync({
          blocks: blocksData,
          start_date: startDateIso,
          end_date: endDateIso,
        });
      }

      if (skippedDetails.length > 0) {
        const isVi = locale === 'vi';
        const warningMsg = isVi
          ? `${skippedDetails.length} khung giờ bị bỏ qua do trùng với lịch tham quan.`
          : `${skippedDetails.length} block(s) skipped due to conflicts with existing tours.`;
        const detailsMsg = isVi
          ? `Bị bỏ qua: ${skippedDetails.join(', ')}`
          : `Skipped: ${skippedDetails.join(', ')}`;
        toast.warning(`${warningMsg}\n${detailsMsg}`, { duration: 6000 });
      } else {
        toast.success(t('blocksSavedSuccess') || 'Blocks saved successfully');
      }
      stopEditingBlocks();
    } catch (error) {
      console.error('Failed to sync blocks:', error);
      toast.error(t('genericError') || 'An error occurred. Please try again.');
    }
  };

  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  const handleQuickAccept = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    try {
      await updateStatus.mutateAsync({
        id: appointmentId,
        data: { status: 'ACCEPTED' },
      });
      toast.success(t('acceptedSuccess') || 'Appointment accepted');
    } catch (error) {
      console.error('Failed to accept appointment:', error);
      toast.error(t('genericError') || 'Failed to accept appointment');
    }
  };

  const handleOpenReasonDialog = (e: React.MouseEvent, appointmentId: string, action: 'REJECT' | 'CANCEL') => {
    e.stopPropagation();
    setActionReason('');
    setPendingAction({ appointmentId, action });
  };

  const handleSubmitReason = async () => {
    if (!pendingAction || !actionReason.trim()) return;
    const status = pendingAction.action === 'REJECT' ? 'REJECTED' : 'CANCELED';
    try {
      await updateStatus.mutateAsync({
        id: pendingAction.appointmentId,
        data: { status, reason: actionReason.trim() },
      });
      toast.success(status === 'REJECTED' ? t('rejectedSuccess') : t('canceled'));
      setPendingAction(null);
      setActionReason('');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('genericError'));
    }
  };

  const handleDeleteBlock = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    if (originalBlockIds.has(appointmentId)) {
      try {
        await deleteAppointment.mutateAsync(appointmentId);
        setOriginalBlockIds((prev) => {
          const next = new Set(prev);
          next.delete(appointmentId);
          return next;
        });
      } catch (error) {
        console.error('Failed to delete block from server:', error);
        toast.error("Failed to delete block from server");
        return;
      }
    }
    setEditableBlocks((prev) => prev.filter((b) => b.id !== appointmentId));
  };

  const renderAppointmentCard = (apt: AppointmentWithListing, dateString: string, startTime: string, endTime: string) => {
    const isReceiver = currentUser?.user_id === apt.receiver_id;
    const isPending = apt.status === 'PENDING';
    const isAccepted = apt.status === 'ACCEPTED';

    const canCancel = canCancelAppointment(apt, currentUser?.user_id);

    return (
      <div
        className="flex h-full flex-col p-1 text-inherit overflow-hidden"
        title={`${apt.listing_name || apt.appointment_type || 'Appointment'}${apt.rejection_reason ? `\n${t('rejectReason')}: ${apt.rejection_reason}` : ''}${apt.cancellation_reason ? `\n${t('cancelReason')}: ${apt.cancellation_reason}` : ''}`}
      >
        <div className={`font-semibold text-xs leading-none truncate`} title={apt.listing_name || apt.appointment_type || 'Appointment'}>
          {apt.listing_name || (apt.appointment_type === 'BLOCK' ? t('block') : t('tour') || 'Appointment')}
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-80">
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="text-[10px] uppercase leading-none truncate">{startTime.split(':')[0]}:{startTime.split(':')[1]} - {endTime.split(':')[0]}:{endTime.split(':')[1]}</span>
        </div>

        {(apt.rejection_reason || apt.cancellation_reason) && (
          <div className="mt-1 text-[10px] leading-tight text-red-600 dark:text-red-400 line-clamp-1 italic">
            {apt.rejection_reason || apt.cancellation_reason}
          </div>
        )}

        {apt.appointment_type === 'BLOCK' && isEditingBlocks && (
          <div className="absolute bottom-1 right-1 flex items-center justify-end gap-1 shrink-0 z-20 pointer-events-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm pl-1 rounded-sm">
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-sm"
              onClick={(e) => handleDeleteBlock(e, apt.appointment_id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {apt.appointment_type !== 'BLOCK' && (isPending || (isAccepted && canCancel)) && (
          <div className="absolute bottom-1 right-1 flex items-center justify-end gap-1 shrink-0 z-20 pointer-events-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm pl-1 rounded-sm">
            {isReceiver && isPending && (
              <>
                <button
                  onClick={(e) => handleQuickAccept(e, apt.appointment_id)}
                  disabled={updateStatus.isPending}
                  className="rounded bg-green-500/20 p-1 text-green-700 hover:bg-green-500/30 dark:text-green-300"
                  title={t('accept')}
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenReasonDialog(e, apt.appointment_id, 'REJECT');
                  }}
                  className="rounded bg-red-500/20 p-1 text-red-700 hover:bg-red-500/30 dark:text-red-300"
                  title={t('reject')}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
            {isReceiver && isAccepted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus.mutate({
                    id: apt.appointment_id,
                    data: { status: 'COMPLETED' }
                  }, {
                    onSuccess: () => toast.success(t('completeSuccess'))
                  });
                }}
                disabled={updateStatus.isPending}
                className="rounded bg-blue-500/20 p-1 text-blue-700 hover:bg-blue-500/30 dark:text-blue-300"
                title={t('complete')}
              >
                <CheckCircle2 className="h-3 w-3" />
              </button>
            )}
            {canCancel && !(isReceiver && isPending) && (
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
            )}
          </div>
        )}
      </div>
    );
  };

   return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

        <Availability
          mode={isEditingBlocks ? 'edit-blocks' : 'view'}
          value={isEditingBlocks ? editableBlocks : undefined}
          onValueChange={isEditingBlocks ? setEditableBlocks : undefined}
          appointments={filteredAppointments as AppointmentWithListing[]}
          onAppointmentClick={isEditingBlocks ? undefined : handleAppointmentClick}
          renderAppointmentCard={renderAppointmentCard as any}
          currentWeekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          locale={locale as 'vi' | 'en'}
          isLoading={isLoading}
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue placeholder={t('statusLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('all')}</SelectItem>
                  <SelectItem value="PENDING">{t('pending')}</SelectItem>
                  <SelectItem value="ACCEPTED">{t('accepted')}</SelectItem>
                  <SelectItem value="REJECTED">{t('rejected')}</SelectItem>
                  <SelectItem value="CANCELED">{t('canceled')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Listing Filter */}
              {managedListings.length > 0 && (
                <Select value={listingFilter} onValueChange={setListingFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder={t('listing')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t('allListings')}</SelectItem>
                    {managedListings.map((l) => (
                      <SelectItem key={l.listing_id} value={l.listing_id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Reload Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
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
          }
          actions={
            !isEditingBlocks ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditingBlocks}
                className="h-8 gap-1.5 text-xs"
              >
                <Settings2 className="h-3.5 w-3.5" />
                {t('manageBlocks') || 'Manage Blocks'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => stopEditingBlocks()}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={syncBlocks.isPending}
                  className="h-8 gap-1.5 text-xs bg-main-primary text-white border-0 hover:bg-main-primary-hover shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t('save') || 'Save'}
                </Button>
              </div>
            )
          }
        />

      <SlotModal
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        date={selectedSlot?.date || ''}
        start_time={selectedSlot?.start_time || ''}
        end_time={selectedSlot?.end_time || ''}
        appointments={selectedSlot?.appointments || []}
      />

      {/* Quick reject/cancel reason dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'REJECT' ? t('rejectReason') : t('cancelReason')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                pendingAction?.action === 'REJECT'
                  ? t('enterRejectReason')
                  : t('enterCancelReason')
              }
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t('cancel')}</Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleSubmitReason}
              disabled={!actionReason.trim() || updateStatus.isPending}
              className="bg-main-primary text-white border-0 hover:bg-main-primary-hover shadow-sm"
            >
              {updateStatus.isPending ? t('saving') || 'Saving...' : t('submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save blocks dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('saveBlocks') || 'Save Busy Blocks'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t('saveBlocksDesc') || 'Save the current busy blocks for this week.'}
            </p>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <RepeatIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('repeatToNextWeeks') || 'Repeat to next weeks'}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('repeatDesc') || 'Copy these blocks to future weeks. Conflicts with tours are skipped.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={repeatWeeks}
                onCheckedChange={setRepeatWeeks}
              />
            </div>

            {repeatWeeks && (
              <div className="flex items-center gap-3 pl-1">
                <span className="text-sm text-muted-foreground">{t('repeatFor') || 'Repeat for'}</span>
                <Select
                  value={String(repeatCount)}
                  onValueChange={(v) => setRepeatCount(Number(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? (t('week') || 'week') : (t('weeks') || 'weeks')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{t('afterThisWeek') || 'after this week'}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t('cancel') || 'Cancel'}</Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={() => handleSaveBlocks(repeatWeeks, repeatCount)}
              disabled={syncBlocks.isPending}
              className="gap-2 bg-main-primary text-white border-0 hover:bg-main-primary-hover shadow-sm"
            >
              <Save className="h-4 w-4" />
              {syncBlocks.isPending ? (t('saving') || 'Saving...') : (t('confirm') || 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}