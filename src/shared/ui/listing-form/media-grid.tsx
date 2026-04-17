'use client';

import * as React from 'react';
import { Play, ImageIcon, Box, X, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { MediaAnalysisEntry } from '@/shared/lib/hooks/use-media-analysis';

/* ═══════════════════════════════════════════════════════════
   Existing Media Grid
   ═══════════════════════════════════════════════════════════ */

export interface ExistingMediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: 'IMAGE' | 'VIDEO' | string;
  roomName?: string | null;
}

interface ExistingMediaGridProps {
  items: ExistingMediaItem[];
  selectedIds: Set<string>;
  primaryId: string | null;
  onToggle: (id: string) => void;
  onSetPrimary: (id: string) => void;
  labels: {
    primary: string;
    makePrimary: string;
  };
}

export function ExistingMediaGrid({
  items,
  selectedIds,
  primaryId,
  onToggle,
  onSetPrimary,
  labels,
}: ExistingMediaGridProps) {
  if (items.length === 0) return null;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
      {items.map((media) => {
        const isSelected = selectedIds.has(media.id);
        const isVideo = media.type === 'VIDEO';
        const is3D = media.type === 'THREE_D';

        return (
          <div
            key={media.id}
            role='button'
            tabIndex={0}
            onClick={() => onToggle(media.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(media.id);
              }
            }}
            className={cn(
              'group relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all cursor-pointer text-left',
              isSelected
                ? 'border-primary shadow-[0px_0px_12px_0px_rgba(112,101,240,0.25)]'
                : 'border-purple-92 opacity-70 hover:opacity-100 hover:border-primary/40'
            )}
          >
            {/* Thumbnail */}
            {isVideo ? (
              media.thumbnailUrl && media.thumbnailUrl !== 'null' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.thumbnailUrl} alt='' className='absolute inset-0 h-full w-full object-cover' />
              ) : (
                <video src={media.url} className='h-full w-full object-cover' muted playsInline />
              )
            ) : is3D ? (
              media.thumbnailUrl && media.thumbnailUrl !== 'null' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.thumbnailUrl} alt='' className='absolute inset-0 h-full w-full object-cover' />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-purple-96'>
                  <Box className='h-8 w-8 text-secondary/30' />
                </div>
              )
            ) : media.url && media.url !== 'null' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.url} alt='' className='absolute inset-0 h-full w-full object-cover' />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-purple-96'>
                <ImageIcon className='h-8 w-8 text-secondary/30' />
              </div>
            )}

            {/* Video indicator */}
            {isVideo && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-black/50'>
                  <Play className='h-4 w-4 text-white' fill='white' />
                </div>
              </div>
            )}

            {/* 3D indicator */}
            {is3D && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-black/50'>
                  <Box className='h-4 w-4 text-white' />
                </div>
              </div>
            )}

            {/* 3D badge */}
            {is3D && (
              <div className='absolute left-1.5 top-1.5 z-10 rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-semibold text-white'>
                3D
              </div>
            )}

            {/* Selected overlay */}
            <div
              className={cn(
                'absolute inset-0 bg-primary/10 transition-opacity',
                isSelected ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Checkmark */}
            <div
              className={cn(
                'absolute right-1.5 top-1.5 transition-all',
                isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              )}
            >
              <CheckCircle2 className='h-5 w-5 text-primary drop-shadow' fill='white' />
            </div>

            {/* Primary badge/button */}
            {!is3D && (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onSetPrimary(media.id);
                }}
                className={cn(
                  'absolute left-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors z-10',
                  media.roomName ? 'bottom-7' : 'bottom-1.5',
                  primaryId === media.id
                    ? 'bg-primary text-white'
                    : 'bg-black/40 text-white/80 hover:bg-primary/80 opacity-0 group-hover:opacity-100'
                )}
              >
                {primaryId === media.id ? labels.primary : labels.makePrimary}
              </button>
            )}

            {/* Room name bar */}
            {media.roomName && (
              <div className='absolute inset-x-0 bottom-0 z-10 truncate bg-black/50 px-2 py-1 text-[10px] font-medium text-white'>
                {media.roomName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   New Files Grid
   ═══════════════════════════════════════════════════════════ */

interface NewFilesGridProps {
  files: File[];
  selectedIndices: Set<number>;
  primaryId: string | null;
  analysisStatus?: MediaAnalysisEntry[];
  qualityThreshold?: number;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (id: string, index: number) => void;
  labels: {
    primary: string;
    makePrimary: string;
    newUpload: string;
    analyzing: string;
    error: string;
    notAllowed: string;
    passed: string;
    feedbackLabel: string;
  };
}

export function NewFilesGrid({
  files,
  selectedIndices,
  primaryId,
  analysisStatus = [],
  qualityThreshold = 50,
  onToggle,
  onRemove,
  onSetPrimary,
  labels,
}: NewFilesGridProps) {
  if (files.length === 0) return null;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
      {files.map((file, index) => {
        const isSelected = selectedIndices.has(index);
        const isPrimary = primaryId === `new:${index}`;
        const status = analysisStatus[index];
        const score = status?.result?.finalScore;
        const isRejected = score !== undefined && score < qualityThreshold;
        const feedback = status?.result?.analysis?.feedback;

        return (
          <div
            key={`new-${index}`}
            role='button'
            tabIndex={0}
            onClick={() => onToggle(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(index);
              }
            }}
            className={cn(
              'group relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all cursor-pointer text-left',
              isPrimary
                ? 'border-primary shadow-[0px_0px_12px_0px_rgba(112,101,240,0.25)]'
                : isSelected
                  ? 'border-primary/60'
                  : isRejected
                    ? 'border-red-400'
                    : 'border-purple-92 opacity-70 hover:opacity-100 hover:border-primary/40'
            )}
          >
            {file.type.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className={cn(
                  'h-full w-full object-cover',
                  isRejected && 'grayscale-[0.5] blur-[1px]',
                  !isSelected && 'opacity-40'
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center gap-1 px-2 bg-purple-96 transition-opacity',
                  !isSelected && 'opacity-40'
                )}
              >
                <Play className='h-6 w-6 text-primary/60' />
                <span className='truncate text-[10px] text-secondary/60 w-full text-center'>
                  {file.name}
                </span>
              </div>
            )}

            {/* AI Status Overlay */}
            {status && (
              <div className='absolute inset-x-0 top-0 z-20 flex flex-col gap-1 p-1'>
                {status.isLoading ? (
                  <div className='flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white'>
                    <Loader2 className='h-3 w-3 animate-spin' />
                    {labels.analyzing}
                  </div>
                ) : status.error ? (
                  <div className='flex items-center gap-1 rounded bg-red-500/80 px-1.5 py-0.5 text-[10px] text-white'>
                    <AlertCircle className='h-3 w-3' />
                    {labels.error}
                  </div>
                ) : isRejected ? (
                  <div className='flex flex-col gap-0.5 rounded bg-red-500/90 p-1.5 text-[10px] text-white'>
                    <div className='flex items-center gap-1 font-bold italic underline'>
                      <AlertCircle className='h-3 w-3' />
                      {labels.notAllowed}
                    </div>
                    {feedback && (
                      <div className='line-clamp-2 italic opacity-90'>{feedback}</div>
                    )}
                  </div>
                ) : score !== undefined ? (
                  <div className='flex items-center gap-1 rounded bg-emerald-500/80 px-1.5 py-0.5 text-[10px] text-white'>
                    <CheckCircle2 className='h-3 w-3' />
                    {labels.passed.replace('{score}', String(score))}
                  </div>
                ) : null}
              </div>
            )}

            {/* Selected overlay */}
            <div
              className={cn(
                'absolute inset-0 bg-primary/10 transition-opacity',
                isSelected ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Checkmark */}
            <div
              className={cn(
                'absolute right-1.5 top-1.5 transition-all z-20',
                isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              )}
            >
              <CheckCircle2 className='h-5 w-5 text-primary drop-shadow' fill='white' />
            </div>

            {/* Feedback Tooltip on Hover */}
            {!status?.isLoading && feedback && !isRejected && (
              <div className='absolute inset-x-0 bottom-8 z-20 px-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
                <div className='rounded bg-black/80 p-1.5 text-[10px] leading-tight text-white shadow-lg'>
                  <p className='font-bold text-primary/40'>{labels.feedbackLabel}</p>
                  <p className='mt-0.5 line-clamp-3 italic'>{feedback}</p>
                </div>
              </div>
            )}

            {/* Remove button */}
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className='absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 z-30'
            >
              <X className='h-3 w-3' />
            </button>

            {/* Primary badge/button */}
            {!isRejected && (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onSetPrimary(`new:${index}`, index);
                }}
                className={cn(
                  'absolute left-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all z-10',
                  isPrimary
                    ? 'bg-primary text-white'
                    : 'bg-black/40 text-white/80 hover:bg-primary/80 opacity-0 group-hover:opacity-100'
                )}
              >
                {isPrimary
                  ? labels.primary
                  : `${labels.newUpload} - ${labels.makePrimary}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Media Upload Zone
   ═══════════════════════════════════════════════════════════ */

interface MediaUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  labels: {
    dragAndDrop: string;
    uploadHint: string;
  };
  accept?: string;
}

export function MediaUploadZone({
  onFilesSelected,
  labels,
  accept = 'image/*,video/*',
}: MediaUploadZoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        multiple
        className='hidden'
        onChange={handleFileChange}
      />
      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files).filter(
            (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
          );
          if (files.length > 0) {
            onFilesSelected(files);
          }
        }}
        className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-92 bg-purple-98/30 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-purple-98/60 cursor-pointer w-full'
      >
        <Upload className='mb-2 h-7 w-7 text-primary/50' />
        <p className='text-sm font-medium text-secondary/60'>{labels.dragAndDrop}</p>
        <p className='mt-0.5 text-xs text-secondary/40'>{labels.uploadHint}</p>
      </button>
    </>
  );
}
