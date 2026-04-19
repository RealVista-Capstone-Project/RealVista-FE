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
  ArrowLeft,
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
    <div className='min-h-[calc(100vh-80px)] bg-background'>
      {/* Header Section */}
      <div className='border-b border-border bg-card'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 py-6'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() =>
                  router.push(`/${locale}/dashboard/property`)
                }
                className='p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground'
                aria-label={t('goBackAriaLabel')}
              >
                <ArrowLeft className='w-5 h-5' />
              </button>
              <div className='w-px h-8 bg-border' />
              <div>
                <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                  {t('title')}
                </h1>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {t('subtitle')}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => {
                  refetchOps();
                  refetchDetail();
                }}
                className='rounded-xl'
                disabled={opsLoading || detailLoading}
              >
                <RefreshCw className={detailLoading || opsLoading ? 'animate-spin' : ''} />
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                size='lg'
                className='rounded-xl shadow-md font-semibold gap-2'
                disabled={isLocked}
                title={isLocked ? t('lockedTitle') : undefined}
              >
                {isLocked ? <Lock className='w-5 h-5' /> : <Plus className='w-5 h-5' />}
                {t('newRoom')}
              </Button>
              {!isLocked && !subsLoading && (
                <span className='text-xs text-muted-foreground'>
                  {unlimited
                    ? t('quotaUnlimited')
                    : remaining != null && quotaLimit != null
                      ? t('quotaRemaining', { remaining, total: quotaLimit })
                      : null}
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {!opsLoading && totalRooms > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className='flex items-center gap-6 mt-5 text-sm'
            >
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Box className='w-4 h-4' />
                <span>
                  <strong className='text-foreground'>
                    {t('roomsCount', { count: totalRooms })}
                  </strong>
                </span>
              </div>
              <div className='w-px h-4 bg-border' />
              <div className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                <span className='text-muted-foreground'>
                  {readyRooms} {t('ready')}
                </span>
              </div>
              {pendingRooms > 0 && (
                <>
                  <div className='w-px h-4 bg-border' />
                  <div className='flex items-center gap-1.5'>
                    <span className='w-2 h-2 rounded-full bg-amber-500 animate-pulse' />
                    <span className='text-muted-foreground'>
                      {pendingRooms} {t('processing')}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Subscription Gate Card */}
      {isLocked && !subsLoading && (
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 mt-6'>
          <div className='border border-dashed border-amber-300 rounded-lg bg-amber-50 p-6 text-center'>
            <Lock className='w-8 h-8 text-amber-500 mx-auto mb-3' />
            <h3 className='text-sm font-semibold text-foreground mb-1'>
              {remaining != null ? t('lockedTitle') : t('noSubscriptionTitle')}
            </h3>
            <p className='text-xs text-muted-foreground mb-4'>
              {remaining != null ? t('lockedDescription') : t('noSubscriptionDescription')}
            </p>
            <button
              type='button'
              onClick={() => router.push(`/${locale}/subscribe`)}
              className='inline-flex items-center justify-center rounded-lg bg-foreground text-white text-xs font-semibold px-6 py-2 hover:bg-foreground/80 transition-colors cursor-pointer'
            >
              {remaining != null ? t('lockedCta') : t('noSubscriptionCta')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='container max-w-7xl mx-auto px-4 sm:px-6 py-8'>
        {opsLoading ? (
          <div className='flex flex-col items-center justify-center py-24'>
            <RefreshCw className='w-8 h-8 animate-spin text-primary mb-4' />
            <p className='text-muted-foreground font-medium'>
              {t('loading')}
            </p>
          </div>
        ) : roomGroups.length === 0 ? (
          <EmptyState onCreateRoom={() => setIsDialogOpen(true)} t={t} isLocked={isLocked} />
        ) : (
          <div className='space-y-8'>
            {/* 3D Viewer for selected room */}
            <AnimatePresence mode='wait'>
              {selectedRoom && activeViewerData.url && (
                <motion.div
                  key={selectedRoom}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                  className='relative group/stage'
                >
                  <div className='absolute -inset-2 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 blur-2xl opacity-0 group-hover/stage:opacity-100 transition-opacity duration-700' />

                  <div className='relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl'>
                    <div className='absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none'>
                      <div className='flex items-center gap-4'>
                        <div className='w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10'>
                          <Layers className='w-6 h-6 text-primary shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_50%,transparent)]' />
                        </div>
                        <div className='space-y-0.5'>
                          <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold tracking-tight text-white drop-shadow-md'>
                              {selectedRoom === 'Unnamed Room' ? t('unnamedRoom') : selectedRoom}
                            </h2>
                            <div className='flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md'>
                              <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
                              <span className='text-[10px] font-bold text-primary tracking-wider uppercase'>{t('live3dBadge')}</span>
                            </div>
                          </div>
                          <p className='text-xs text-white/50 font-medium'>
                            {t('interactiveDesc')}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedRoom(null)}
                        className='h-10 px-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 backdrop-blur-md text-white/70 hover:text-white transition-all pointer-events-auto'
                      >
                        {t('closeViewer')}
                      </Button>
                    </div>

                    <div className='aspect-video md:aspect-[21/9] overflow-hidden'>
                      <SparkViewer
                        spzUrl={activeViewerData.url || ''}
                        metadata={activeViewerData.metadata}
                        className='w-full h-full'
                      />
                    </div>
                  </div>

                  <div className='mt-3 flex items-center justify-center gap-4'>
                    <div className='h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent' />
                    <div className='flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest'>
                      <div className='w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]' />
                      {t('viewingLabel')}
                    </div>
                    <div className='h-px flex-1 bg-gradient-to-r from-border via-border to-transparent' />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Room Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
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

function EmptyState({ onCreateRoom, t, isLocked }: { onCreateRoom: () => void; t: any; isLocked?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='flex flex-col items-center justify-center py-20 lg:py-28 text-center'
    >
      <div className='w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-8'>
        <Box className='w-12 h-12 text-primary/60' />
      </div>
      <h3 className='text-2xl font-bold tracking-tight text-foreground mb-3'>
        {t('noRoomsTitle')}
      </h3>
      <p className='text-muted-foreground max-w-md mb-8 leading-relaxed'>
        {t('noRoomsDesc')}
      </p>
      <Button
        onClick={onCreateRoom}
        size='lg'
        className='rounded-xl shadow-md font-semibold gap-2 px-8'
        disabled={isLocked}
      >
        {isLocked ? <Lock className='w-5 h-5' /> : <Plus className='w-5 h-5' />}
        {t('createFirstRoom')}
      </Button>
    </motion.div>
  );
}
