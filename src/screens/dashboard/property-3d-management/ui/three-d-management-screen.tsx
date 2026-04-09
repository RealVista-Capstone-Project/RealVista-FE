'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  useProperty3dOperations,
  usePropertyDetail,
  useDelete3dRoom,
  useUpdateRoomName,
} from '@/entities/property';
import type { Property3dOperation } from '@/entities/property/api/property-api.types';
import {
  ArrowLeft,
  Plus,
  Box,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sofa,
  BedDouble,
  Bath,
  CookingPot,
  Home,
  DoorOpen,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { SparkViewer } from '@/widgets/spark-viewer/SparkViewer';
import { RoomGenerationDialog } from './room-generation-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

const ROOM_ICONS: Record<string, React.ElementType> = {
  'Living Room': Sofa,
  'Bedroom': BedDouble,
  'Bathroom': Bath,
  'Kitchen': CookingPot,
  'Entrance': DoorOpen,
};

function getRoomIcon(roomName?: string) {
  if (!roomName) return Home;
  for (const [key, Icon] of Object.entries(ROOM_ICONS)) {
    if (roomName.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Layers;
}

function getStatusConfig(status?: string, t?: any) {
  switch (status?.toUpperCase()) {
    case 'SUCCEEDED':
      return {
        label: t ? t('ready') : 'Ready',
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        dotColor: 'bg-emerald-500',
      };
    case 'FAILED':
      return {
        label: t ? t('failed') : 'Failed',
        icon: AlertTriangle,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
        dotColor: 'bg-red-500',
      };
    case 'PENDING':
    case 'GENERATING':
      return {
        label: t ? t('processing') : 'Processing',
        icon: RefreshCw,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        dotColor: 'bg-amber-500 animate-pulse',
      };
    default:
      return {
        label: status || 'Unknown',
        icon: Clock,
        className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
        dotColor: 'bg-slate-400',
      };
  }
}

interface RoomGroup {
  roomName: string;
  operations: Property3dOperation[];
  latestOperation: Property3dOperation;
  hasSuccessful: boolean;
  /** UUID of the PropertyMedia record — present only when status is READY */
  mediaId?: string;
  /** UUID of the Property3DGeneration record (the `id` field, not `operation_id`) */
  operationId?: string;
}

export function ThreeDManagementScreen({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: string;
}) {
  const t = useTranslations('ThreeDManagement');
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

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
      metadata: matching?.metadata || null
    };
  }, [selectedRoom, threeDMediaItems]);

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
                aria-label='Go back to properties'
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
              >
                <Plus className='w-5 h-5' />
                {t('newRoom')}
              </Button>
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
          <EmptyState onCreateRoom={() => setIsDialogOpen(true)} t={t} />
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
                          <Layers className='w-6 h-6 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' />
                        </div>
                        <div className='space-y-0.5'>
                          <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold tracking-tight text-white drop-shadow-md'>
                              {selectedRoom === 'Unnamed Room' ? t('unnamedRoom') : selectedRoom}
                            </h2>
                            <div className='flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md'>
                              <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
                              <span className='text-[10px] font-bold text-primary tracking-wider uppercase'>LIVE 3D</span>
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

                    <div className='aspect-video md:aspect-[21/9] bg-slate-900 overflow-hidden'>
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
                      <div className='w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),1)]' />
                      {t('viewing', { name: '' }).split(':')[0]}
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

function EmptyState({ onCreateRoom, t }: { onCreateRoom: () => void; t: any }) {
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
      >
        <Plus className='w-5 h-5' />
        {t('createFirstRoom')}
      </Button>
    </motion.div>
  );
}

function RoomCard({
  room,
  index,
  isSelected,
  onSelect,
  onDelete,
  threeDMedia,
  propertyId,
  t,
  locale,
}: {
  room: RoomGroup;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  threeDMedia: Array<{ media_url: string; metadata?: any }>;
  propertyId: string;
  t: any;
  locale: string;
}) {
  const statusConfig = getStatusConfig(room.latestOperation.status, t);
  const RoomIcon = getRoomIcon(room.roomName);
  const updateMutation = useUpdateRoomName(propertyId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(room.roomName);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasModel = threeDMedia.some(
    (m) => {
      const rName = m.metadata?.room_name || 'Unnamed Room';
      return rName === room.roomName;
    }
  );

  const createdDate = room.latestOperation.created_at
    ? new Date(room.latestOperation.created_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(room.roomName === 'Unnamed Room' ? '' : room.roomName);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsRenaming(false);
    setRenameValue(room.roomName);
  };

  const saveRename = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === room.roomName || !room.operationId) {
      cancelRename();
      return;
    }
    try {
      await updateMutation.mutateAsync({ operationId: room.operationId, roomName: trimmed });
      setIsRenaming(false);
    } catch {
      // keep rename mode open on error so user can retry
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card
        className={`
          group relative overflow-hidden transition-all duration-200 cursor-pointer
          hover:shadow-md hover:border-primary/30
          ${isSelected ? 'ring-2 ring-primary/40 border-primary/30 shadow-md' : ''}
          ${!hasModel && room.latestOperation.status === 'SUCCEEDED' ? 'opacity-80' : ''}
        `}
        onClick={!isRenaming && hasModel ? onSelect : undefined}
      >
        {/* Room Header */}
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex items-center gap-3 min-w-0 flex-1'>
              <div
                className={`
                  shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200
                  ${room.hasSuccessful
                    ? 'bg-primary/10 text-primary group-hover:bg-primary/15'
                    : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                <RoomIcon className='w-5 h-5' />
              </div>
              <div className='min-w-0 flex-1'>
                {isRenaming ? (
                  <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className='flex-1 min-w-0 text-sm font-semibold border border-primary rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background'
                      disabled={updateMutation.isPending}
                    />
                    <button
                      onClick={saveRename}
                      disabled={updateMutation.isPending}
                      className='shrink-0 p-1 rounded-md hover:bg-emerald-50 text-emerald-600 disabled:opacity-50'
                      aria-label={t('saveRename')}
                    >
                      <Check className='w-3.5 h-3.5' />
                    </button>
                    <button
                      onClick={cancelRename}
                      disabled={updateMutation.isPending}
                      className='shrink-0 p-1 rounded-md hover:bg-red-50 text-red-500 disabled:opacity-50'
                      aria-label={t('cancelRename')}
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center gap-1.5'>
                    <CardTitle className='text-base truncate'>
                      {room.roomName === 'Unnamed Room' ? t('unnamedRoom') : room.roomName}
                    </CardTitle>
                    {room.operationId && (
                      <button
                        onClick={startRename}
                        className='shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-all'
                        aria-label={t('renameRoom')}
                      >
                        <Pencil className='w-3 h-3' />
                      </button>
                    )}
                  </div>
                )}
                {!isRenaming && createdDate && (
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {createdDate}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center gap-1 shrink-0'>
              <Badge
                variant='outline'
                className={`text-[11px] ${statusConfig.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`} />
                {statusConfig.label}
              </Badge>
              {room.operationId && !isRenaming && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className='p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-all'
                  aria-label={t('deleteRoom')}
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          {room.latestOperation.status === 'FAILED' && (
            <div className='text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/5 rounded-lg px-3 py-2.5 leading-relaxed'>
              {room.latestOperation.error_message || t('failed')}
            </div>
          )}

          {(room.latestOperation.status === 'PENDING' ||
            room.latestOperation.status === 'GENERATING') && (
              <div className='space-y-2.5'>
                <div className='w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden'>
                  <div className='bg-primary h-1.5 rounded-full animate-pulse w-2/3' />
                </div>
                <p className='text-xs text-muted-foreground flex items-center gap-1.5'>
                  <RefreshCw className='w-3 h-3 animate-spin' />
                  {t('processing')}...
                </p>
              </div>
            )}

          {room.hasSuccessful && hasModel && (
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground flex items-center gap-1.5'>
                <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500' />
                {t('modelAvailable')}
              </p>
              <Button
                variant='ghost'
                size='xs'
                className='text-primary hover:text-primary hover:bg-primary/10 font-medium'
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {t('view')}
              </Button>
            </div>
          )}

          {room.hasSuccessful && !hasModel && (
            <div className='space-y-2.5'>
              <div className='w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden'>
                <div className='bg-emerald-500 h-1.5 rounded-full w-full' />
              </div>
              <p className='text-xs text-muted-foreground flex items-center gap-1.5'>
                <Clock className='w-3.5 h-3.5 animate-pulse' />
                {t('syncing')}
              </p>
            </div>
          )}

          {!room.hasSuccessful &&
            room.latestOperation.status !== 'PENDING' &&
            room.latestOperation.status !== 'GENERATING' &&
            room.latestOperation.status !== 'FAILED' && (
              <p className='text-xs text-muted-foreground'>
                {room.operations.length} {t('processing')}
              </p>
            )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
