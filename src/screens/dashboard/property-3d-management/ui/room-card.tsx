'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
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
import { useUpdateRoomName } from '@/entities/property';
import type { Property3dOperation } from '@/entities/property/api/property-api.types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { motion } from 'framer-motion';
import { CardContainer, CardBody } from '@/shared/ui/3d-card';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomGroup {
  roomName: string;
  operations: Property3dOperation[];
  latestOperation: Property3dOperation;
  hasSuccessful: boolean;
  /** UUID of the PropertyMedia record — present only when status is READY */
  mediaId?: string;
  /** UUID of the Property3DGeneration record (the `id` field, not `operation_id`) */
  operationId?: string;
  /** Thumbnail image URL for this room's 3D model, if available */
  thumbnailUrl?: string | null;
}

// ─── Room Icon Map ─────────────────────────────────────────────────────────────

const ROOM_ICONS: Record<string, React.ElementType> = {
  'Living Room': Sofa,
  'Bedroom': BedDouble,
  'Bathroom': Bath,
  'Kitchen': CookingPot,
  'Entrance': DoorOpen,
};

export function getRoomIcon(roomName?: string) {
  if (!roomName) return Home;
  for (const [key, Icon] of Object.entries(ROOM_ICONS)) {
    if (roomName.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Layers;
}

// ─── Status Config ─────────────────────────────────────────────────────────────

export function getStatusConfig(status?: string, t?: any) {
  switch (status?.toUpperCase()) {
    case 'SUCCEEDED':
      return {
        label: t ? t('ready') : 'Ready',
        icon: CheckCircle2,
        className:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        dotColor: 'bg-emerald-500',
      };
    case 'FAILED':
      return {
        label: t ? t('failed') : 'Failed',
        icon: AlertTriangle,
        className:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
        dotColor: 'bg-red-500',
      };
    case 'PENDING':
    case 'GENERATING':
      return {
        label: t ? t('processing') : 'Processing',
        icon: RefreshCw,
        className:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        dotColor: 'bg-amber-500 animate-pulse',
      };
    default:
      return {
        label: status || (t ? t('unknownStatus') : 'Unknown'),
        icon: Clock,
        className:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
        dotColor: 'bg-slate-400',
      };
  }
}

// ─── RoomCard ──────────────────────────────────────────────────────────────────

export interface RoomCardProps {
  room: RoomGroup;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  threeDMedia: Array<{ media_url: string; metadata?: any }>;
  propertyId: string;
  t: any;
  locale: string;
}

export function RoomCard({
  room,
  index,
  isSelected,
  onSelect,
  onDelete,
  threeDMedia,
  propertyId,
  t,
  locale,
}: RoomCardProps) {
  const statusConfig = getStatusConfig(room.latestOperation.status, t);
  const RoomIcon = getRoomIcon(room.roomName);
  const updateMutation = useUpdateRoomName(propertyId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(room.roomName);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasModel = threeDMedia.some((m) => {
    const rName = m.metadata?.room_name || 'Unnamed Room';
    return rName === room.roomName;
  });

  const createdDate = room.latestOperation.created_at
    ? new Date(room.latestOperation.created_at).toLocaleDateString(
      locale === 'vi' ? 'vi-VN' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    )
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
    <CardContainer
      className='w-full'
      containerClassName='py-0'
    >
      <CardBody className='w-full'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
          className='w-full'
        >
      <Card
        className={`
          group relative overflow-hidden transition-all duration-200 cursor-pointer
          hover:shadow-xl hover:border-primary/30 pt-0
          ${isSelected ? 'ring-2 ring-primary/40 border-primary/30 shadow-xl' : ''}
          ${!hasModel && room.latestOperation.status === 'SUCCEEDED' ? 'opacity-80' : ''}
        `}
        onClick={!isRenaming && hasModel ? onSelect : undefined}
      >
        {/* Glossy shine overlay */}
        <motion.div
          className='pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10) 0%, transparent 60%)' }}
        />
        {/* Thumbnail / Skeleton */}
        {room.thumbnailUrl ? (
          <div className='relative w-full h-36 overflow-hidden bg-muted'>
            <Image
              src={room.thumbnailUrl}
              alt={room.roomName}
              fill
              className='object-cover transition-transform duration-500 group-hover:scale-105'
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            />
            {/* Gradient overlay for readability */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent' />
          </div>
        ) : (
          <div className='relative w-full h-36 overflow-hidden bg-muted animate-pulse'>
            {/* Subtle shimmer sweep */}
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]' />
            {/* Centered icon */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <RoomIcon className='w-10 h-10 text-muted-foreground/30' />
            </div>
          </div>
        )}

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
                  <p className='text-xs text-muted-foreground mt-0.5'>{createdDate}</p>
                )}
              </div>
            </div>

            {/* Status pill + delete — delete is absolutely overlaid so it never shifts the badge */}
            <div className='relative flex items-center shrink-0'>
              <Badge
                variant='outline'
                className={`text-[11px] transition-all duration-200 ease-out ${statusConfig.className} ${room.operationId && !isRenaming ? 'group-hover:-translate-x-7' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`} />
                {statusConfig.label}
              </Badge>

              {/* Delete button — fades + slides in from right on group hover */}
              {room.operationId && !isRenaming && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className='absolute right-0 p-1.5 rounded-md opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-all duration-200 ease-out'
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
      </CardBody>
    </CardContainer>
  );
}
