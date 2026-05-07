'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, addDays, startOfWeek } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { useAppointments, useUpdateAppointmentStatus, useSyncBlocks, useDeleteAppointment, useRespondReschedule, useRescheduleAppointment, useCancelReschedule } from '../api/appointment.queries';
import { Button } from '@/shared/ui/button';
import { SlotModal } from './slot-modal';
import { RescheduleModal } from './reschedule-modal';
import { Badge } from '@/shared/ui/badge';
import { Availability } from '@/shared/ui/availability';
import type { AppointmentWithListing } from '../types/appointment';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { Check, X, Clock, Settings2, Save, RepeatIcon, CheckCircle2, RefreshCw, CalendarRange } from 'lucide-react';
import {
  getAppointmentActions,
  getAppointmentStatusInfo,
  hasStarted,
  isValidUUID,
  toLocalIso
} from '../utils/appointment';
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

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED' | 'RESCHEDULE_PENDING';

export function AppointmentsPage() {
  const t = useTranslations('appointments');
  const locale = useLocale();
  const { data: currentUser } = useCurrentUser();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [listingFilter, setListingFilter] = useState<string>(() => searchParams.get('listing') ?? 'ALL');
  const [userFilter, setUserFilter] = useState<string>(() => searchParams.get('user') ?? 'ALL');
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Fetch agent's managed listings for the filter dropdown
  const { data: managedListingsPage } = useQuery(listingQueries.managed({ page: 0, size: 100 }));
  const managedListings = managedListingsPage?.content ?? [];

  useEffect(() => {
    setListingFilter(searchParams.get('listing') ?? 'ALL');
    setUserFilter(searchParams.get('user') ?? 'ALL');
  }, [searchParams]);

  const [isEditingBlocks, setIsEditingBlocks] = useState(false);
  const [editableBlocks, setEditableBlocks] = useState<TimeSpan<any>[]>([]);
  const [originalBlockIds, setOriginalBlockIds] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(false);
  const [repeatCount, setRepeatCount] = useState<number>(1);

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithListing | null>(null);

  // Quick reject/cancel reason dialog
  const [pendingAction, setPendingAction] = useState<{
    appointmentId: string;
    action: 'REJECT' | 'CANCEL' | 'RESCHEDULE_ACCEPT' | 'RESCHEDULE_REJECT';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Per-week block cache: saves drawn blocks when navigating between weeks in edit-blocks mode.
  // Key = week start timestamp (ms), Value = blocks array for that week.
  const weekBlocksCache = useRef<Map<number, TimeSpan<any>[]>>(new Map());
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
      let matchesStatus = false;
      if (statusFilter === 'ALL') {
        // In "ALL" view, hide CANCELED or REJECTED appointments entirely to keep the calendar clean.
        // Users can still see them by explicitly filtering for those statuses.
        matchesStatus = apt.status !== 'CANCELED' && apt.status !== 'REJECTED';
      } else {
        matchesStatus = apt.status === statusFilter;
      }

      // Listing filter
      const matchesListing = listingFilter === 'ALL' || apt.listing_id === listingFilter;

      // User filter from CRM lead detail redirect
      const matchesUser =
        userFilter === 'ALL' || apt.sender_id === userFilter || apt.receiver_id === userFilter;

      return matchesStatus && matchesListing && matchesUser;
    });
  }, [appointments, statusFilter, listingFilter, userFilter]);

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
          if (apt.status === 'CANCELED' || apt.status === 'REJECTED') return false;
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
  const respondReschedule = useRespondReschedule();
  const cancelReschedule = useCancelReschedule();
  const rescheduleAppointment = useRescheduleAppointment();

  const handleCancelProposal = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    try {
      await cancelReschedule.mutateAsync(appointmentId);
      toast.success(t('rescheduleResponseSuccess') || 'Proposal withdrawn');
    } catch (error) {
      console.error('Failed to cancel proposal:', error);
      toast.error(t('genericError'));
    }
  };

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

  const handleOpenReasonDialog = (e: React.MouseEvent, appointmentId: string, action: 'REJECT' | 'CANCEL' | 'RESCHEDULE_ACCEPT' | 'RESCHEDULE_REJECT') => {
    e.stopPropagation();
    setActionReason('');
    setPendingAction({ appointmentId, action });
  };

  const handleSubmitReason = async () => {
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
        const status = pendingAction.action === 'REJECT' ? 'REJECTED' : 'CANCELED';
        await updateStatus.mutateAsync({
          id: pendingAction.appointmentId,
          data: { status, reason: actionReason.trim() },
        });
        toast.success(status === 'REJECTED' ? t('rejectedSuccess') : t('canceled'));
      }
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
    const actions = getAppointmentActions(apt, currentUser?.user_id);
    const statusInfo = getAppointmentStatusInfo(apt, currentUser?.user_id);
    const isStarted = hasStarted(apt.start_time);
    const isCompleted = apt.status === 'COMPLETED';

    return (
      <div className={cn("flex flex-col h-full min-h-0 relative", (isCompleted || (isStarted && apt.status !== 'ACCEPTED')) && "opacity-60")}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="text-[10px] font-bold leading-tight truncate text-slate-900 dark:text-slate-100 pr-1">
            {apt.listing_name || (apt.appointment_type === 'BLOCK' ? t('block') : t('tour'))}
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
    <>
      <div className="m-4 bg-white rounded-md border overflow-hidden">
      <Availability
        className="h-[calc(100vh-6rem)] min-h-[500px] bg-white"
        mode={isEditingBlocks ? 'edit-blocks' : 'view'}
        value={isEditingBlocks ? editableBlocks : undefined}
        onValueChange={isEditingBlocks ? setEditableBlocks : undefined}
        mergeAdjacent={false}
        appointments={filteredAppointments as any[]}
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
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder={t('statusLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('all')}</SelectItem>
                <SelectItem value="PENDING">{t('pending')}</SelectItem>
                <SelectItem value="RESCHEDULE_PENDING">{t('reschedule_pending')}</SelectItem>
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
                className="h-8 gap-1.5 text-xs bg-primary text-white border-0 hover:bg-primary/90 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                {t('save') || 'Save'}
              </Button>
            </div>
          )
        }
      />
      </div>

      <SlotModal
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        date={selectedSlot?.date || ''}
        start_time={selectedSlot?.start_time || ''}
        end_time={selectedSlot?.end_time || ''}
        appointments={selectedSlot?.appointments || []}
      />

      <RescheduleModal
        appointment={rescheduleTarget}
        open={!!rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      />

      {/* Quick reject/cancel reason dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'REJECT' ? t('rejectReason') :
               pendingAction?.action === 'CANCEL' ? t('cancelReason') :
               pendingAction?.action === 'RESCHEDULE_ACCEPT' ? t('respondReschedule') : t('rejectReason')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                pendingAction?.action === 'REJECT' || pendingAction?.action === 'RESCHEDULE_REJECT'
                  ? t('enterRejectReason')
                  : pendingAction?.action === 'RESCHEDULE_ACCEPT'
                  ? t('enterReason')
                  : t('enterCancelReason')
              }
              rows={3}
              className="resize-none"
              disabled={updateStatus.isPending || respondReschedule.isPending}
            />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t('cancel')}</Button>
            </DialogClose>
            <Button
              size="sm"
              variant={pendingAction?.action === 'RESCHEDULE_ACCEPT' ? 'default' : 'destructive'}
              onClick={handleSubmitReason}
              disabled={!actionReason.trim() || updateStatus.isPending || respondReschedule.isPending}
            >
              {(updateStatus.isPending || respondReschedule.isPending) ? t('saving') || 'Saving...' : t('submit')}
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

            <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3">
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
            </label>

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
              className="gap-2 bg-primary text-white border-0 hover:bg-primary/90 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {syncBlocks.isPending ? (t('saving') || 'Saving...') : (t('confirm') || 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
