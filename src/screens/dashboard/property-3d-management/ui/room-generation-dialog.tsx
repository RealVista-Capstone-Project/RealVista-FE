'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label/label';
import { Progress } from '@/shared/ui/progress';
import { useGenerate3d, AzimuthImage } from '@/features/world-generation/model/use-generate-3d';
import { MarbleModel, getModelCost } from '@/shared/api/marble-client';
import { useThreeDQuota } from '@/entities/billing/hooks/use-three-d-quota';
import { Upload, X, Box, CheckCircle2, AlertTriangle, RotateCcw, Coins } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const REQUIRED_IMAGES_COUNT = 8;
const REQUIRED_AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315];

// Room names used as storage keys (must match what the backend stores)
const QUICK_FILL_ROOM_VALUES = [
  'Phòng khách',
  'Master',
  'Phòng ngủ',
  'Phòng tắm',
  'Bếp',
  'Phòng ăn',
  'Sảnh',
  'Ban công',
] as const;

// Localized display labels — index matches QUICK_FILL_ROOM_VALUES
const QUICK_FILL_ROOM_LABELS_EN = [
  'Living Room',
  'Master',
  'Bedroom',
  'Bathroom',
  'Kitchen',
  'Dining Room',
  'Entrance',
  'Balcony',
] as const;

const QUICK_FILL_ROOM_LABELS_VI = [
  'Phòng khách',
  'Master',
  'Phòng ngủ',
  'Phòng tắm',
  'Bếp',
  'Phòng ăn',
  'Sảnh',
  'Ban công',
] as const;

interface RoomGenerationDialogProps {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  existingRoomNames?: string[];
  onPreFlight?: () => boolean;
  onOperationCreated?: () => void;
  onInitiationError?: () => void;
}

export function RoomGenerationDialog({
  propertyId,
  open,
  onOpenChange,
  onComplete,
  existingRoomNames = [],
  onPreFlight,
  onOperationCreated,
  onInitiationError,
}: RoomGenerationDialogProps) {
  const t = useTranslations('ThreeDManagement');
  const locale = useLocale();
  const quickFillLabels = locale === 'vi' ? QUICK_FILL_ROOM_LABELS_VI : QUICK_FILL_ROOM_LABELS_EN;
  const {
    phase,
    progressDescription,
    error,
    uploadedCount,
    generate,
    reset,
  } = useGenerate3d(propertyId, t as any);

  const { remaining, unlimited, isLoading: quotaLoading } = useThreeDQuota();

  const [roomName, setRoomName] = useState('');
  const [roomDisplayName, setRoomDisplayName] = useState('');
  const [images, setImages] = useState<AzimuthImage[]>([]);
  const [selectedModel, setSelectedModel] = useState<MarbleModel>('marble-1.0-draft');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRoomName('');
      setRoomDisplayName('');
      setImages([]);
      setSelectedModel('marble-1.0-draft');
      reset();
    }
  }, [open, reset]);

  const handleFiles = (files: FileList | null | File[]) => {
    if (!files) return;
    const newImages: AzimuthImage[] = [];
    const availableSlots = REQUIRED_IMAGES_COUNT - images.length;
    const fileArray = Array.from(files).slice(0, availableSlots);

    fileArray.forEach((file) => {
      const usedAzimuths = new Set(
        images.map((img) => img.azimuth).concat(newImages.map((img) => img.azimuth))
      );
      const nextAzimuth = REQUIRED_AZIMUTHS.find((azi) => !usedAzimuths.has(azi)) || 0;

      newImages.push({
        file,
        previewUrl: URL.createObjectURL(file), // Potential memory leak if not revoked
        azimuth: nextAzimuth,
      });
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const removed = prev[indexToRemove];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleGenerate = () => {
    if (!roomName.trim()) {
      // In a real app, use a toast here
      return;
    }
    if (images.length === REQUIRED_IMAGES_COUNT) {
      // Pass the room name as both display name and room name
      generate(images, selectedModel, roomName.trim(), roomName.trim(), {
        onPreFlight,
        onOperationCreated,
        onInitiationError,
      });
    }
  };

  const handleCompleteAndClose = () => {
    onComplete();
  };

  const isFormValid = roomName.trim().length > 0 && images.length === REQUIRED_IMAGES_COUNT
    && (unlimited || (remaining ?? 0) >= getModelCost(selectedModel));

  const renderUploadForm = () => (
    <div className='space-y-6'>
      {/* Room Name Input */}
      <div className='space-y-3'>
        <Label htmlFor='room-name' className='text-foreground font-semibold'>
          {t('roomNameLabel')}
        </Label>
        <Input
          id='room-name'
          placeholder={t('roomNamePlaceholder')}
          value={roomDisplayName || roomName}
          onChange={(e) => {
            setRoomName(e.target.value);
            setRoomDisplayName('');
          }}
          className='bg-muted/50 border-border focus-visible:ring-primary'
        />

        {/* Chips for suggestions */}
        <div className='flex flex-wrap gap-2 pt-1'>
          {QUICK_FILL_ROOM_VALUES
            .map((value, index) => ({ value, label: quickFillLabels[index] }))
            .filter(({ value }) => !existingRoomNames.includes(value))
            .slice(0, 5)
            .map(({ value, label }) => (
            <button
              key={value}
              type='button'
              onClick={() => {
                setRoomName(value);
                setRoomDisplayName(label);
              }}
              className='text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors'
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload Zone */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label className='text-foreground font-semibold'>
            {t('capturesLabel')}
          </Label>
          <span className='text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full'>
            {t('requiredImages', { count: images.length, total: REQUIRED_IMAGES_COUNT })}
          </span>
        </div>

        <div
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-200 bg-muted/30 overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {images.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 px-4 text-center cursor-pointer' onClick={() => fileInputRef.current?.click()}>
              <div className='w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
                <Upload className='w-6 h-6 text-primary' />
              </div>
              <h4 className='text-sm font-semibold text-foreground mb-1'>
                {t('dragDrop')}
              </h4>
              <p className='text-xs text-muted-foreground max-w-[250px] leading-relaxed'>
                {t('uploadDesc', { count: REQUIRED_IMAGES_COUNT })}
              </p>
            </div>
          ) : (
            <div className='p-4 grid grid-cols-4 gap-3'>
              {REQUIRED_AZIMUTHS.map((azimuth) => {
                const capturedImg = images.find((img) => img.azimuth === azimuth);
                return (
                  <div
                    key={azimuth}
                    className={cn(
                      "relative aspect-square rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all",
                      capturedImg
                        ? "border border-border shadow-sm ring-1 ring-black/5"
                        : "border border-dashed border-border bg-background"
                    )}
                  >
                    {capturedImg ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedImg.previewUrl}
                          alt={`${roomName || t('roomNamePlaceholder')} ${t('angleLabel')} ${azimuth}`}
                          className='absolute inset-0 w-full h-full object-cover'
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = images.findIndex((img) => img.azimuth === azimuth);
                            if (idx !== -1) removeImage(idx);
                          }}
                          className='absolute top-1 right-1 p-1 bg-black/50 hover:bg-destructive rounded-md text-white backdrop-blur-sm transition-colors'
                        >
                          <X className='w-3 h-3' />
                        </button>
                        <div className='absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded shadow-sm'>
                          {azimuth}&deg;
                        </div>
                      </>
                    ) : (
                      <button
                        className='w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors hover:bg-primary/5'
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className='text-sm md:text-base font-bold tracking-tight'>{azimuth}&deg;</span>
                        <span className='text-[10px] uppercase font-medium tracking-wider mt-0.5 opacity-70'>{t('angleLabel')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <input
            type='file'
            multiple
            accept='image/*'
            ref={fileInputRef}
            className='hidden'
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Model Selection & Actions */}
      <div className='flex flex-col sm:flex-row items-end gap-4 pt-4 border-t border-border'>
        <div className='w-full sm:flex-1 space-y-2'>
          <Label className='text-foreground text-xs font-semibold uppercase tracking-wider'>{t('qualityLabel')}</Label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as MarbleModel)}
            className='w-full h-10 px-3 text-sm border-border bg-background rounded-lg shadow-sm focus:border-primary focus:ring-primary outline-none transition-colors'
          >
            <option value='marble-1.0-draft'>{t('draftQuality')}</option>
            <option value='marble-1.0'>{t('standardQuality')}</option>
            <option value='marble-1.1'>{t('marble11Quality')}</option>
            <option value='marble-1.1-plus'>{t('marble11PlusQuality')}</option>
          </select>
        </div>

        {!quotaLoading && !unlimited && (
          <div className='flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground shrink-0'>
            <Coins className='w-3.5 h-3.5' />
            <span className='font-semibold'>{remaining ?? 0} {t('credits')}</span>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!isFormValid}
          className='w-full sm:w-auto h-10 px-8 rounded-lg font-semibold shadow-md'
        >
          {t('generateBtn')}
        </Button>
      </div>
    </div>
  );

  const renderActiveState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='flex flex-col items-center justify-center py-10'
    >
      {phase === 'succeeded' ? (
        <div className='text-center w-full max-w-sm mx-auto'>
          <div className='w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle2 className='w-10 h-10 text-emerald-600 dark:text-emerald-400' />
          </div>
          <h3 className='text-2xl font-bold tracking-tight text-foreground mb-3'>{t('genSucceeded')}</h3>
          <p className='text-muted-foreground mb-8 text-sm leading-relaxed'>
            {t('genSucceededDesc', { name: roomName })}
          </p>
          <Button onClick={handleCompleteAndClose} className='w-full h-11 text-base font-semibold rounded-xl'>
            {t('viewRoomBtn')}
          </Button>
        </div>
      ) : phase === 'failed' ? (
        <div className='text-center w-full max-w-sm mx-auto'>
          <div className='w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertTriangle className='w-10 h-10 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='text-2xl font-bold tracking-tight text-foreground mb-3'>{t('genFailed')}</h3>
          <p className='text-muted-foreground mb-8 text-sm leading-relaxed'>
            {error || t('failed')}
          </p>
          <div className='flex gap-3 w-full'>
            <Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1 h-11'>
              {t('closeBtn')}
            </Button>
            <Button onClick={reset} className='flex-1 h-11 gap-2'>
              <RotateCcw className='w-4 h-4' /> {t('tryAgainBtn')}
            </Button>
          </div>
        </div>
      ) : (
        <div className='w-full max-w-sm text-center mx-auto space-y-8'>
          <div className='relative w-28 h-28 mx-auto'>
            <div className='absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75' />
            <div className='absolute inset-2 bg-primary/20 rounded-full animate-ping' style={{ animationDelay: '300ms' }} />
            <div className='relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/25'>
              <Box className='w-12 h-12 animate-bounce' />
            </div>
          </div>

          <div>
            <h3 className='text-xl font-bold tracking-tight text-foreground mb-2 capitalize'>
              {phase === 'polling'
                ? t('processing')
                : phase === 'uploading'
                  ? t('phaseUploading')
                  : phase === 'requesting'
                    ? t('phaseRequesting')
                    : phase}...
            </h3>
            <p className='text-sm text-muted-foreground font-medium min-h-[2.5rem]'>
              {progressDescription}
            </p>
          </div>

          <div className='space-y-3'>
            <Progress
              value={
                phase === 'uploading'
                  ? (uploadedCount / REQUIRED_IMAGES_COUNT) * 100
                  : phase === 'requesting' ? 10
                  : phase === 'polling' ? 60 : 10
              }
              className='h-2'
            />

            <div className='grid grid-cols-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
              <span className={cn('text-left', phase === 'uploading' ? 'text-primary' : 'text-emerald-500')}>{t('phaseUploading')}</span>
              <span className={cn('text-center', phase === 'requesting' ? 'text-primary' : phase === 'polling' ? 'text-emerald-500' : '')}>{t('phaseRequesting')}</span>
              <span className={cn('text-right', phase === 'polling' ? 'text-primary animate-pulse' : '')}>{t('phaseProcessing')}</span>
            </div>
          </div>

          <div className='pt-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20'>
            <p className='text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-center gap-1.5 text-center leading-relaxed'>
              <CheckCircle2 className='w-3.5 h-3.5' />
              {phase === 'polling'
                ? t('safeToClose')
                : t('keepOpenWarning')}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing by clicking outside during upload or request phase
      if (!val && (phase === 'uploading' || phase === 'requesting')) {
        return;
      }
      onOpenChange(val);
    }}>
      <DialogContent className='sm:max-w-xl p-0 overflow-hidden bg-background border-border shadow-2xl'>
        <DialogHeader className='px-6 pt-6 pb-4 border-b border-border bg-card/50'>
          <DialogTitle className='text-xl font-bold'>{t('dialogTitle')}</DialogTitle>
          <DialogDescription className='text-muted-foreground mt-1.5'>
            {t('dialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className='p-6'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={phase === 'idle' ? 'upload' : 'active'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {phase === 'idle' ? renderUploadForm() : renderActiveState()}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
