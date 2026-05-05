'use client';

import { Box, Camera, Video } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { PropertyImage } from '@/entities/property';
import { MediaViewer } from './media-viewer';

export interface PropertyGalleryProps {
  images: PropertyImage[];
  onViewAllPhotos?: () => void;
  on3DTour?: () => void;
  onVideo?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PropertyGallery({
  images,
  onViewAllPhotos,
  on3DTour,
  onVideo,
  onFavorite,
  isFavorite = false,
}: PropertyGalleryProps) {
  const t = useTranslations('PropertyGallery');
  const safeImages = (images || []).filter((img) => img.url);
  const [mainImage, setMainImage] = useState(safeImages[0]);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerTab, setMediaViewerTab] = useState<'photos' | '3d-tour' | 'video'>('photos');

  // Reset state when images change (e.g. navigating between listings)
  useEffect(() => {
    if (safeImages.length > 0) {
      setMainImage(safeImages[0]);
      setMediaViewerTab('photos');
    }
  }, [images]);

  const thumbnailImages = safeImages.slice(1, 3);

  const photoCount = safeImages.filter((img) => img.type === 'photo').length;
  const tourCount = safeImages.filter((img) => img.type === '3d-tour').length;
  const videoCount = safeImages.filter((img) => img.type === 'video').length;

  const handleOpenMedia = (type?: 'photos' | '3d-tour' | 'video', mediaId?: string) => {
    const targetType = type || (mainImage?.type === 'photo' ? 'photos' : mainImage?.type as any);
    setMediaViewerTab(targetType);
    setMediaViewerOpen(true);

    // Call external handlers if provided
    if (targetType === 'photos' && onViewAllPhotos) onViewAllPhotos();
    if (targetType === '3d-tour' && on3DTour) on3DTour();
    if (targetType === 'video' && onVideo) onVideo();
  };

  const handleOpenPhotos = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    handleOpenMedia('photos');
  };

  const handleOpen3DTour = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    handleOpenMedia('3d-tour');
  };

  const handleOpenVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    handleOpenMedia('video');
  };

  if (!mainImage) {
    return (
      <div className='flex items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-muted'>
        <span className='text-sm text-muted-foreground'>{t('noImage')}</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2 sm:gap-2 sm:grid sm:grid-cols-[3fr_1fr] sm:h-[320px] lg:h-[380px]'>
      {/* Hero Image */}
      <div
        className='relative rounded-xl overflow-hidden w-full aspect-[16/9] sm:aspect-auto sm:h-full bg-primary/5 cursor-pointer group/hero'
        onClick={() => handleOpenMedia()}
      >
        {mainImage.type === 'video' ? (
          <video
            src={mainImage.url}
            poster={mainImage.thumbnailUrl || undefined}
            controls
            playsInline
            preload='metadata'
            className='h-full w-full object-cover rounded-xl'
          />
        ) : mainImage.type === '3d-tour' ? (
          <Image
            src={mainImage.thumbnailUrl || mainImage.url}
            alt={mainImage.alt}
            fill
            className='object-cover'
            priority
          />
        ) : (
          <Image src={mainImage.url} alt={mainImage.alt} fill className='object-cover' priority />
        )}

        {/* Overlay Action Buttons */}
        <div className='absolute bottom-4 right-4 md:left-4 md:right-auto flex gap-2'>
          {photoCount > 0 && (
            <button
              onClick={handleOpenPhotos}
              className='
                group flex items-center gap-2 px-3 py-2
                bg-white/95 backdrop-blur-sm rounded-lg
                border-2 border-transparent
                hover:border-primary/20 hover:p-1.5
                transition-all duration-200 ease-out
                shadow-sm hover:shadow-md
                sm:static sm:bottom-auto sm:right-auto
              '
            >
              <Camera className='size-4' />
              <span className='text-sm font-medium text-foreground'>
                {t('viewAllPhotos')} ({photoCount})
              </span>
            </button>
          )}

          {/* 3D Tour và Video chỉ hiện trên sm trở lên */}
          <div className='hidden sm:flex gap-2'>
            {tourCount > 0 && (
              <button
                onClick={handleOpen3DTour}
                className='
                  group flex items-center gap-2 px-3 py-2
                  bg-white/95 backdrop-blur-sm rounded-lg
                  border-2 border-transparent
                  hover:border-primary hover:p-1.5
                  transition-all duration-200 ease-out
                  shadow-sm hover:shadow-md
                '
              >
                <Box className='size-4' />
                <span className='text-sm font-medium text-foreground'>
                  {t('tour3D')} ({tourCount})
                </span>
              </button>
            )}

            {videoCount > 0 && (
              <button
                onClick={handleOpenVideo}
                className='
                  group flex items-center gap-2 px-3 py-2
                  bg-white/95 backdrop-blur-sm rounded-lg
                  border-2 border-transparent
                  hover:border-primary hover:p-1.5
                  transition-all duration-200 ease-out
                  shadow-sm hover:shadow-md
                '
              >
                <Video className='size-4' />
                <span className='text-sm font-medium text-foreground'>
                  {t('video')} ({videoCount})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='flex flex-row gap-2 mt-2 sm:mt-0 sm:flex-col sm:gap-2 sm:h-full'>
        {thumbnailImages.map((image) => {
          const isVideo = image.type === 'video';
          const is3D = image.type === '3d-tour';
          const displayedUrl = (isVideo || is3D) ? image.thumbnailUrl : image.url;

          return (
            <button
              key={image.id}
              onClick={() => setMainImage(image)}
              className={cn(
                'group relative rounded-xl overflow-hidden w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1 border-2 border-transparent transition-all duration-200 ease-out',
                mainImage.id === image.id
                  ? 'border-primary p-1'
                  : 'hover:border-primary hover:p-1'
              )}
            >
              <div className='relative w-full h-full rounded-lg overflow-hidden bg-primary/5'>
                {displayedUrl ? (
                  <Image
                    src={displayedUrl}
                    alt={image.alt}
                    fill
                    className='object-cover transition-transform duration-200 group-hover:scale-105'
                    sizes='(max-width: 768px) 100vw, 400px'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <span className='text-[10px] sm:text-xs text-muted-foreground'>
                      {isVideo ? t('video') : t('noImage')}
                    </span>
                  </div>
                )}
                {isVideo && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path d='M8 5V19L19 12L8 5Z' />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Fill remaining space if less than 2 thumbnails */}
        {thumbnailImages.length < 2 &&
          Array.from({ length: 2 - thumbnailImages.length }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className='w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center hover:border-primary hover:p-1 transition-all duration-200'
            >
              <span className='text-sm text-muted-foreground'>{t('noImage')}</span>
            </div>
          ))}
      </div>

      {/* Fullscreen Media Viewer */}
      <MediaViewer
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
        media={safeImages}
        defaultTab={mediaViewerTab}
        onFavorite={onFavorite}
        initialMediaId={mainImage?.id}
      />
    </div>
  );
}
