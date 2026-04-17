'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ImageIcon, Video, X, Play } from 'lucide-react';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useMediaAnalysis } from '@/shared/lib/hooks/use-media-analysis';
import { NewFilesGrid, MediaUploadZone } from '@/shared/ui/listing-form';
import type { UploadedMediaItem } from '../model/property-form.schema';

export function PropertyMediaStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue, watch, setError, clearErrors } = useFormContext();

  const uploadedMedia: UploadedMediaItem[] = watch('media.images') || [];
  const watchedNewFiles = watch('media.newFiles');
  const newFiles = useMemo(() => watchedNewFiles || [], [watchedNewFiles]);

  const [selectedNewFileIndices, setSelectedNewFileIndices] = useState<Set<number>>(new Set());
  const [primaryMediaId, setPrimaryMediaId] = useState<string | null>(null);

  const { analysisStatus, analyzeFile, appendEntries, removeEntry, QUALITY_THRESHOLD } =
    useMediaAnalysis();

  const handleFilesSelected = (files: File[]) => {
    const startIndex = newFiles.length;
    const updatedFiles = [...newFiles, ...files];
    setValue('media.newFiles', updatedFiles);

    // Automatically select newly added files
    setSelectedNewFileIndices((prev) => {
      const next = new Set(prev);
      files.forEach((_, i) => next.add(startIndex + i));
      return next;
    });

    appendEntries(files.length);
    files.forEach((file, i) => {
      // Only call AI analysis for image files
      if (file.type.startsWith('image/')) {
        analyzeFile(file, startIndex + i);
      }
    });
  };

  const handleToggleNewFile = (index: number) => {
    setSelectedNewFileIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSetNewPrimary = (id: string, index: number) => {
    setPrimaryMediaId(id);
    setSelectedNewFileIndices((prev) => new Set(prev).add(index));
  };

  const handleRemoveMedia = (index: number) => {
    const updated = uploadedMedia.filter((_, i) => i !== index);
    setValue('media.images', updated);
  };

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = newFiles.filter((_: File, i: number) => i !== index);
    setValue('media.newFiles', updatedFiles);
    removeEntry(index);
  };

  const mediaLabels = {
    primary: t('primary', { fallback: 'Primary' }),
    makePrimary: t('makePrimary', { fallback: 'Make Primary' }),
    newUpload: t('newUpload', { fallback: 'New' }),
    analyzing: t('aiAnalysis.analyzing', { fallback: 'Analyzing...' }),
    error: t('aiAnalysis.error', { fallback: 'Analysis failed' }),
    notAllowed: t('aiAnalysis.notAllowed', { fallback: 'Not allowed' }),
    passed: t('aiAnalysis.passed', { score: '{score}', fallback: 'Score: {score}%' }),
    feedbackLabel: t('aiAnalysis.feedbackLabel', { fallback: 'AI Feedback' }),
  };

  // Enforce quality check by setting form error if any image fails
  useEffect(() => {
    const hasRejectedFile = analysisStatus.some((entry, index) => {
      // Only check images that have finished loading
      const file = newFiles[index];
      if (!file || !file.type.startsWith('image/')) return false;

      if (!entry.isLoading && entry.result && entry.result.finalScore !== undefined) {
        return entry.result.finalScore < QUALITY_THRESHOLD;
      }
      return false;
    });

    if (hasRejectedFile) {
      setError('media.newFiles', {
        type: 'manual',
        message: t('validation.mediaQualityFail', {
          default: 'Some images do not meet quality standards',
        }),
      });
    } else {
      clearErrors('media.newFiles');
    }
  }, [analysisStatus, QUALITY_THRESHOLD, setError, clearErrors, newFiles, t]);

  return (
    <div className='flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Section Header */}
      <div>
        <h2 className='text-lg font-bold text-foreground tracking-tight flex items-center gap-2'>
          {t('step2Title')}
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>{t('step2Desc')}</p>
      </div>

      <div className='flex flex-col gap-6'>
        <FormField
          control={control}
          name='media.images'
          render={() => (
            <FormItem>
              <FormLabel className='flex items-center gap-2 text-sm font-medium text-foreground'>
                <ImageIcon className='size-4 text-[#7065F0]' />
                {t('propertyMedia')}
              </FormLabel>
              <FormControl>
                <div className='flex flex-col gap-4'>
                  {/* Existing media */}
                  {uploadedMedia.length > 0 && (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                      {uploadedMedia.map((item, index) => (
                        <div
                          key={`${item.url}-${index}`}
                          className='relative group rounded-lg overflow-hidden border border-[#E0DEF7] aspect-square'
                        >
                          {item.type === 'VIDEO' ? (
                            <div className='size-full bg-[#100A55] flex items-center justify-center'>
                              <Play className='size-10 text-white/80' />
                              <span className='absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-0.5 rounded'>
                                Video
                              </span>
                            </div>
                          ) : (
                            <div className='relative size-full'>
                              <Image
                                src={item.url}
                                alt={`Property media ${index + 1}`}
                                fill
                                className='object-cover'
                              />
                            </div>
                          )}
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            className='absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity'
                            onClick={() => handleRemoveMedia(index)}
                          >
                            <X className='size-3' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Files Grid with AI analysis */}
                  <NewFilesGrid
                    files={newFiles}
                    selectedIndices={selectedNewFileIndices}
                    primaryId={primaryMediaId}
                    analysisStatus={analysisStatus}
                    qualityThreshold={QUALITY_THRESHOLD}
                    onToggle={handleToggleNewFile}
                    onRemove={handleRemoveNewFile}
                    onSetPrimary={handleSetNewPrimary}
                    labels={mediaLabels}
                  />

                  {/* Upload Zone */}
                  <MediaUploadZone
                    onFilesSelected={handleFilesSelected}
                    labels={{
                      dragAndDrop: t('dragDropDesc'),
                      uploadHint: t('supportFormats'),
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>
    </div>
  );
}
