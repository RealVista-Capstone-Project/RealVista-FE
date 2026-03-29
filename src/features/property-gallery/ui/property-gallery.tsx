'use client';

import { Box, Camera, Video } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
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
  const safeImages = images || [];
  const [mainImage, setMainImage] = useState(safeImages[0]);
  const thumbnailImages = safeImages.slice(1, 3);

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerTab, setMediaViewerTab] = useState<'photos' | '3d-tour' | 'video'>('photos');

  const photoCount = safeImages.filter((img) => img.type === 'photo').length;
  const tourCount = safeImages.filter((img) => img.type === '3d-tour').length;
  const videoCount = safeImages.filter((img) => img.type === 'video').length;

  const handleOpenPhotos = () => {
    if (onViewAllPhotos) {
      onViewAllPhotos();
    }
    setMediaViewerTab('photos');
    setMediaViewerOpen(true);
  };

  const handleOpen3DTour = () => {
    if (on3DTour) {
      on3DTour();
    }
    setMediaViewerTab('3d-tour');
    setMediaViewerOpen(true);
  };

  const handleOpenVideo = () => {
    if (onVideo) {
      onVideo();
    }
    setMediaViewerTab('video');
    setMediaViewerOpen(true);
  };

  if (!mainImage) {
    return (
      <div className='flex items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-grey-300 bg-grey-100'>
        <span className='text-sm text-grey-500'>{t('noImage')}</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3 sm:gap-4 sm:grid sm:grid-cols-[2fr_1fr] sm:h-[400px] lg:h-[500px]'>
      {/* Hero Image */}
      <div className='relative rounded-xl overflow-hidden w-full aspect-[4/3] sm:aspect-auto sm:h-full bg-purple-98'>
        {mainImage.type === 'video' ? (
          <>
            {mainImage.thumbnailUrl ? (
              <Image
                src={mainImage.thumbnailUrl}
                alt={mainImage.alt}
                fill
                className='object-cover'
                priority
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <span className='text-sm text-main-secondary/60'>{t('video')}</span>
              </div>
            )}
            <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
              <div
                onClick={handleOpenVideo}
                className='flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white/90 text-main-primary shadow-xl transition-transform hover:scale-110 active:scale-95'
              >
                <svg
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M8 5V19L19 12L8 5Z' />
                </svg>
              </div>
            </div>
          </>
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
                hover:border-purple-92 hover:p-1.5
                transition-all duration-200 ease-out
                shadow-sm hover:shadow-md
                sm:static sm:bottom-auto sm:right-auto
              '
            >
              <Camera className='size-4' />
              <span className='text-sm font-medium text-main-black'>
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
                  hover:border-main-primary hover:p-1.5
                  transition-all duration-200 ease-out
                  shadow-sm hover:shadow-md
                '
              >
                <Box className='size-4' />
                <span className='text-sm font-medium text-main-black'>
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
                  hover:border-main-primary hover:p-1.5
                  transition-all duration-200 ease-out
                  shadow-sm hover:shadow-md
                '
              >
                <Video className='size-4' />
                <span className='text-sm font-medium text-main-black'>
                  {t('video')} ({videoCount})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='flex flex-row gap-3 mt-2 sm:mt-0 sm:flex-col sm:gap-3 sm:h-full'>
        {thumbnailImages.map((image) => {
          const isVideo = image.type === 'video';
          const displayedUrl = isVideo ? image.thumbnailUrl : image.url;

          return (
            <button
              key={image.id}
              onClick={() => setMainImage(image)}
              className={cn(
                'group relative rounded-xl overflow-hidden w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1 border-2 border-transparent transition-all duration-200 ease-out',
                mainImage.id === image.id
                  ? 'border-main-primary p-1'
                  : 'hover:border-main-primary hover:p-1'
              )}
            >
              <div className='relative w-full h-full rounded-lg overflow-hidden bg-purple-98'>
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
                    <span className='text-[10px] sm:text-xs text-main-secondary/60'>
                      {isVideo ? t('video') : t('noImage')}
                    </span>
                  </div>
                )}
                {isVideo && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-main-primary shadow-sm'>
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
              className='w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1 rounded-xl border-2 border-dashed border-grey-300 bg-grey-100 flex items-center justify-center hover:border-main-primary hover:p-1 transition-all duration-200'
            >
              <span className='text-sm text-grey-500'>{t('noImage')}</span>
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
      />
    </div>
  );
}
