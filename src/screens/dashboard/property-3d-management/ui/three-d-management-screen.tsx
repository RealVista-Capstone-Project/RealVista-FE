'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  useProperty3dOperations,
  usePropertyDetail,
  useDelete3dRoom,
} from '@/entities/property';
import type { Property3dOperation } from '@/entities/property/api/property-api.types';
import {
  ChevronLeft,
  Plus,
  Box,
  RefreshCw,
  Layers,
  Lock,
} from 'lucide-react';
import { useThreeDQuota } from '@/entities/billing';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { SparkViewer } from '@/widgets/spark-viewer/SparkViewer';
import { RoomGenerationDialog } from './room-generation-dialog';
import { RoomCard, RoomGroup } from './room-card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';



export function ThreeDManagementScreen({
  propertyId,
  locale,
  initialRoomName,
}: {
  propertyId: string;
  locale: string;
  /** When set (e.g. from a notification deep-link ?roomName=…), auto-select
   *  and open the viewer for this room once the room list is loaded. */
  initialRoomName?: string;
}) {
  const t = useTranslations('ThreeDManagement');
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // 3D Tour subscription gate & quota
  const {
    remaining,
    quotaLimit,
    unlimited,
    isLocked,
    isLoading: subsLoading,
    decrementQuota,
    invalidateQuota,
  } = useThreeDQuota();

  const handleQuotaPreFlight = useCallback((): boolean => {
    if (isLocked) {
      toast.error(t('quotaExhausted'));
      return false;
    }
    return true;
  }, [isLocked, t]);

  const handleOperationCreated = useCallback(() => {
    decrementQuota();
    invalidateQuota();
  }, [decrementQuota, invalidateQuota]);

  const handleInitiationError = useCallback(() => {
    // Quota may have changed on the server (e.g. race condition exhausted it).
    // Invalidate so the display reflects the real server state.
    invalidateQuota();
  }, [invalidateQuota]);

  // Delete state
  const [roomToDelete, setRoomToDelete] = useState<RoomGroup | null>(null);
  const deleteMutation = useDelete3dRoom(propertyId);

  const {
    data: operations,
    isLoading: opsLoading,
    refetch: refetchOps,
  } = useProperty3dOperations(propertyId);

  const { data: propertyDetail, isLoading: detailLoading, refetch: refetchDetail } = usePropertyDetail(propertyId);

  const roomGroups = useMemo<RoomGroup[]>(() => {
    if (!operations || !Array.isArray(operations)) return [];

    const grouped = new Map<string, Property3dOperation[]>();

    for (const op of (operations as Property3dOperation[])) {
      const roomName = op.room_name || 'Unnamed Room';
      if (!grouped.has(roomName)) grouped.set(roomName, []);
      grouped.get(roomName)!.push(op);
    }

    const threeDMedia = propertyDetail?.media?.filter((m) => m.media_type === 'THREE_D') || [];

    return Array.from(grouped.entries()).map(([roomName, ops]) => {
      const sorted = ops.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      const latestOp = sorted[0];

      const matchedMedia = threeDMedia.find((m) => {
        const rName = m.metadata?.room_name || 'Unnamed Room';
        return rName === roomName;
      });

      return {
        roomName,
        operations: sorted,
        latestOperation: latestOp,
        hasSuccessful: sorted.some((op) => op.status === 'SUCCEEDED'),
        mediaId: matchedMedia ? (matchedMedia as any).media_id : undefined,
        operationId: (latestOp as any).id as string | undefined,
        thumbnailUrl: matchedMedia?.thumbnail_url ?? null,
      };
    });
  }, [operations, propertyDetail]);

  const threeDMediaItems = useMemo(() => {
    return propertyDetail?.media?.filter((m) => m.media_type === 'THREE_D') || [];
  }, [propertyDetail]);

  const activeViewerData = useMemo(() => {
    if (!selectedRoom || threeDMediaItems.length === 0) return { url: null, metadata: null };
    const matching = threeDMediaItems.find(
      (m) => {
        const rName = m.metadata?.room_name || 'Unnamed Room';
        return rName === selectedRoom;
      }
    );
    return {
      url: matching?.media_url || null,
      metadata: matching?.metadata || undefined
    };
  }, [selectedRoom, threeDMediaItems]);

  // Auto-select room from deep-link param (e.g. notification tap → ?roomName=Kitchen)
  useEffect(() => {
    if (!initialRoomName || roomGroups.length === 0) return;
    const match = roomGroups.find((r) => r.roomName === initialRoomName);
    if (match) setSelectedRoom(match.roomName);
  }, [initialRoomName, roomGroups]);

  // Auto-refetch detail when any operation succeeds
  useEffect(() => {
    if (Array.isArray(operations) && (operations as Property3dOperation[]).some((op: Property3dOperation) => op.status === 'SUCCEEDED')) {
      const ops = operations as Property3dOperation[];
      const successfulCount = ops.filter((op) => op.status === 'SUCCEEDED').length;
      const mediaCount = threeDMediaItems.length;

      if (successfulCount > mediaCount) {
        refetchDetail();
      }
    }
  }, [operations, threeDMediaItems.length, refetchDetail]);

  const handleGenerationComplete = () => {
    refetchOps();
    refetchDetail();
    setIsDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete?.operationId) return;
    try {
      await deleteMutation.mutateAsync(roomToDelete.operationId);
      if (selectedRoom === roomToDelete.roomName) setSelectedRoom(null);
    } finally {
      setRoomToDelete(null);
    }
  };

  const totalRooms = roomGroups.length;
  const readyRooms = roomGroups.filter((r) => r.hasSuccessful).length;
  const pendingRooms = roomGroups.filter(
    (r) =>
      r.latestOperation.status === 'PENDING' ||
      r.latestOperation.status === 'GENERATING'
  ).length;

  return (
    <div className='min-h-full w-full flex-1 bg-[#e8f2fb]'>
      <div className='mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6'>
        <div className='w-full overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm'>
          {/* Row 1: Back */}
          <div className='px-4 py-3 sm:px-6'>
            <button
              type='button'
              onClick={() => router.push(`/${locale}/dashboard/property`)}
              className='flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              aria-label={t('goBackAriaLabel')}
            >
              <ChevronLeft className='h-4 w-4 shrink-0' strokeWidth={2.5} />
              <span>{t('backToList')}</span>
            </button>
          </div>

          {/* Row 2: Heading + subtitle | add room + quota */}
          <div className='flex items-start justify-between gap-4 border-b border-primary/10 px-4 py-4 sm:px-6'>
            <div className='min-w-0 flex-1'>
              <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>{t('title')}</h1>
              <p className='mt-1 text-sm text-muted-foreground'>{t('subtitle')}</p>
            </div>
            <div className='flex shrink-0 flex-col items-end gap-1.5 sm:items-center'>
              <Button
                type='button'
                onClick={() => setIsDialogOpen(true)}
                disabled={isLocked}
                title={isLocked ? t('lockedTitle') : undefined}
                size='lg'
                variant='default'
                className='gap-2 rounded-xl px-5 font-semibold shadow-sm'
              >
                {isLocked ? (
                  <Lock className='h-4 w-4 shrink-0' strokeWidth={2.25} />
                ) : (
                  <Box className='h-4 w-4 shrink-0' strokeWidth={2.25} />
                )}
                <span>{t('newRoom')}</span>
              </Button>
              {!subsLoading && unlimited ? (
                <span className='max-w-[7rem] text-center text-[11px] leading-tight text-muted-foreground'>
                  {t('quotaUnlimited')}
                </span>
              ) : !subsLoading && remaining != null && quotaLimit != null ? (
                <span className='max-w-[7rem] text-center text-[11px] leading-tight text-muted-foreground'>
                  {t('quotaRemaining', { remaining, total: quotaLimit })}
                </span>
              ) : null}
            </div>
          </div>

          {/* Row 3: Uppercase label + stats hint | reload */}
          <div className='flex items-start justify-between gap-3 border-b border-primary/10 px-4 py-2.5 sm:items-center sm:px-6'>
            <div className='min-w-0 flex-1'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                {t('listSectionLabel')}
              </p>
              {!opsLoading && totalRooms > 0 ? (
                <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
                  <span className='inline-flex items-center gap-1.5'>
                    <Box className='h-3.5 w-3.5 shrink-0' />
                    <strong className='font-medium text-foreground'>{t('roomsCount', { count: totalRooms })}</strong>
                  </span>
                  <span className='text-muted-foreground/40'>·</span>
                  <span>
                    {readyRooms} {t('ready')}
                  </span>
                  {pendingRooms > 0 ? (
                    <>
                      <span className='text-muted-foreground/40'>·</span>
                      <span className='text-amber-700'>
                        {pendingRooms} {t('processing')}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
            <Button
              variant='outline'
              type='button'
              size='icon'
              onClick={() => {
                refetchOps();
                refetchDetail();
              }}
              className='h-9 w-9 shrink-0 rounded-lg'
              disabled={opsLoading || detailLoading}
            >
              <RefreshCw className={`h-4 w-4 ${detailLoading || opsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Body */}
          <div className='px-4 py-6 sm:px-6'>
            {isLocked && !subsLoading ? (
              <div className='mb-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center'>
                <Lock className='mx-auto mb-3 h-8 w-8 text-amber-500' />
                <h3 className='mb-1 text-sm font-semibold text-foreground'>
                  {remaining != null ? t('lockedTitle') : t('noSubscriptionTitle')}
                </h3>
                <p className='mb-4 text-xs text-muted-foreground'>
                  {remaining != null ? t('lockedDescription') : t('noSubscriptionDescription')}
                </p>
                <button
                  type='button'
                  onClick={() => router.push(`/${locale}/subscribe`)}
                  className='inline-flex cursor-pointer items-center justify-center rounded-lg bg-foreground px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-foreground/80'
                >
                  {remaining != null ? t('lockedCta') : t('noSubscriptionCta')}
                </button>
              </div>
            ) : null}

            {opsLoading ? (
              <div className='flex flex-col items-center justify-center py-16'>
                <RefreshCw className='mb-4 h-8 w-8 animate-spin text-primary' />
                <p className='font-medium text-muted-foreground'>{t('loading')}</p>
              </div>
            ) : roomGroups.length === 0 ? (
              <EmptyState onCreateRoom={() => setIsDialogOpen(true)} t={t} isLocked={isLocked} />
            ) : (
              <div className='space-y-8'>
                <AnimatePresence mode='wait'>
                  {selectedRoom && activeViewerData.url && (
                    <motion.div
                      key={selectedRoom}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                      className='group/stage relative'
                    >
                      <div className='absolute -inset-2 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-0 blur-2xl transition-opacity duration-700 group-hover/stage:opacity-100' />

                      <div className='relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl'>
                        <div className='pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent px-6 py-5'>
                          <div className='flex items-center gap-4'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md'>
                              <Layers className='h-6 w-6 text-primary shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_50%,transparent)]' />
                            </div>
                            <div className='space-y-0.5'>
                              <div className='flex items-center gap-2'>
                                <h2 className='text-xl font-bold tracking-tight text-white drop-shadow-md'>
                                  {selectedRoom === 'Unnamed Room' ? t('unnamedRoom') : selectedRoom}
                                </h2>
                                <div className='flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-2.5 py-0.5 backdrop-blur-md'>
                                  <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-primary' />
                                  <span className='text-[10px] font-bold uppercase tracking-wider text-primary'>
                                    {t('live3dBadge')}
                                  </span>
                                </div>
                              </div>
                              <p className='text-xs font-medium text-white/50'>{t('interactiveDesc')}</p>
                            </div>
                          </div>

                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setSelectedRoom(null)}
                            className='pointer-events-auto h-10 rounded-xl border border-white/5 bg-white/5 px-4 text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white'
                          >
                            {t('closeViewer')}
                          </Button>
                        </div>

                        <div className='aspect-video overflow-hidden md:aspect-[21/9]'>
                          <SparkViewer
                            spzUrl={activeViewerData.url || ''}
                            metadata={activeViewerData.metadata}
                            className='h-full w-full'
                          />
                        </div>
                      </div>

                      <div className='mt-3 flex items-center justify-center gap-4'>
                        <div className='h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent' />
                        <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground'>
                          <div className='h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]' />
                          {t('viewingLabel')}
                        </div>
                        <div className='h-px flex-1 bg-gradient-to-r from-border via-border to-transparent' />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                  <AnimatePresence>
                    {roomGroups.map((room, index) => (
                      <RoomCard
                        key={index}
                        room={room}
                        index={index}
                        isSelected={selectedRoom === room.roomName}
                        onSelect={() => setSelectedRoom(room.roomName)}
                        onDelete={() => setRoomToDelete(room)}
                        threeDMedia={threeDMediaItems}
                        propertyId={propertyId}
                        t={t}
                        locale={locale}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Dialog */}
      <RoomGenerationDialog
        propertyId={propertyId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={handleGenerationComplete}
        existingRoomNames={roomGroups.map((r) => r.roomName)}
        onPreFlight={handleQuotaPreFlight}
        onOperationCreated={handleOperationCreated}
        onInitiationError={handleInitiationError}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!roomToDelete} onOpenChange={(open) => { if (!open) setRoomToDelete(null); }}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('deleteConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
            <button
              onClick={() => setRoomToDelete(null)}
              className='inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50'
              disabled={deleteMutation.isPending}
            >
              {t('deleteConfirmCancel')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className='inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('deleteConfirmApprove')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  onCreateRoom,
  t,
  isLocked,
}: {
  onCreateRoom: () => void;
  t: ReturnType<typeof useTranslations<'ThreeDManagement'>>;
  isLocked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='flex flex-col items-center justify-center py-10 text-center sm:py-12'
    >
      <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5'>
        <Box className='h-7 w-7 text-primary/60' strokeWidth={1.75} />
      </div>
      <h3 className='mb-2 text-lg font-bold tracking-tight text-foreground'>
        {t('noRoomsTitle')}
      </h3>
      <p className='mb-6 max-w-sm px-2 text-sm leading-relaxed text-muted-foreground'>
        {t('noRoomsDesc')}
      </p>
      <Button
        onClick={onCreateRoom}
        size='default'
        className='gap-1.5 rounded-lg px-5 font-semibold shadow-sm'
        disabled={isLocked}
      >
        {isLocked ? <Lock className='h-4 w-4' /> : <Plus className='h-4 w-4' />}
        {t('createFirstRoom')}
      </Button>
    </motion.div>
  );
}
