'use client';

import { useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Camera, Image as ImageIcon, Video, Box, X, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useUploadMedia } from '@/entities/media/api/use-upload-media';
import type { UploadedMediaItem } from '../model/property-form.schema';

interface UploadingFile {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO';
  previewUrl?: string;
}

function getMediaType(file: File): 'IMAGE' | 'VIDEO' {
  return file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
}

export function PropertyMediaStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadedMedia: UploadedMediaItem[] = useWatch({ control, name: 'media.images' }) || [];

  const uploadMedia = useUploadMedia();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Add all files to uploading state
    const newUploadingFiles: UploadingFile[] = fileArray.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: getMediaType(file),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload files one by one
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadingFile = newUploadingFiles[i];

      try {
        const result = await uploadMedia.mutateAsync({ file, folder: 'properties' });
        const mediaUrl = result.payload.data.media_url;
        const mediaType = getMediaType(file);

        // Get current state of media (avoid stale closure)
        const currentMedia: UploadedMediaItem[] = (
          document.querySelector('[data-media-state]') as HTMLElement
        )?.dataset.mediaState
          ? JSON.parse(
              (document.querySelector('[data-media-state]') as HTMLElement).dataset.mediaState!
            )
          : uploadedMedia;

        setValue('media.images', [...currentMedia, { url: mediaUrl, type: mediaType }]);

        toast.success(t('uploadSuccess'));
      } catch {
        toast.error(t('uploadError'));
      } finally {
        // Remove from uploading state
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id));

        // Revoke object URL to free memory
        if (uploadingFile.previewUrl) {
          URL.revokeObjectURL(uploadingFile.previewUrl);
        }
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = uploadedMedia.filter((_, i) => i !== index);
    setValue('media.images', updated);
  };

  const isUploading = uploadingFiles.length > 0;

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
                <div>
                  {/* Upload Area */}
                  <div
                    className='border-[1.5px] border-dashed border-[#E0DEF7] rounded-lg p-10 flex flex-col items-center justify-center bg-[#F7F7FD] hover:bg-[#F0EFFB] transition-colors cursor-pointer'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className='size-10 text-[#7065F0] animate-spin mb-4' />
                    ) : (
                      <Camera className='size-10 text-[#7065F0] opacity-50 mb-4' />
                    )}
                    <p className='text-sm font-medium text-foreground'>
                      {isUploading ? t('uploading') : t('dragDropDesc')}
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>{t('supportFormats')}</p>
                    <input
                      ref={fileInputRef}
                      type='file'
                      multiple
                      accept='image/*,video/mp4,video/quicktime,video/webm'
                      className='hidden'
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Uploaded + Uploading Thumbnails */}
                  {(uploadedMedia.length > 0 || uploadingFiles.length > 0) && (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4'>
                      {/* Uploaded media */}
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
                            <img
                              src={item.url}
                              alt={`Property media ${index + 1}`}
                              className='size-full object-cover'
                            />
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

                      {/* Currently uploading files */}
                      {uploadingFiles.map((file) => (
                        <div
                          key={file.id}
                          className='relative rounded-lg overflow-hidden border border-[#E0DEF7] aspect-square bg-[#F0EFFB]'
                        >
                          {file.previewUrl ? (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className='size-full object-cover opacity-50'
                            />
                          ) : (
                            <div className='size-full flex items-center justify-center opacity-50'>
                              <Video className='size-8 text-[#7065F0]' />
                            </div>
                          )}
                          {/* Loading overlay */}
                          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/30'>
                            <Loader2 className='size-6 text-white animate-spin' />
                            <span className='text-xs text-white mt-1 px-2 text-center truncate max-w-full'>
                              {file.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Inputs */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E0DEF7]'>
          <FormField
            control={control}
            name='media.videoUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-2 text-sm font-medium text-foreground'>
                  <Video className='size-4 text-[#7065F0]' />
                  {t('videoUrl')}
                </FormLabel>
                <FormControl>
                  <Input
                    type='url'
                    placeholder={t('videoPlaceholder')}
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='media.tour3dUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-2 text-sm font-medium text-foreground'>
                  <Box className='size-4 text-[#7065F0]' />
                  {t('tour3dUrl')}
                </FormLabel>
                <FormControl>
                  <Input
                    type='url'
                    placeholder={t('tourPlaceholder')}
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
