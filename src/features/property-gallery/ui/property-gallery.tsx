'use client';

import { Box, Camera, Video } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { PropertyImage } from '@/entities/property';
import { MediaViewer } from './media-viewer';

export interface PropertyGalleryProps {
  images: PropertyImage[];
  onViewAllPhotos?: () => void;
  on3DTour?: () => void;
  onVideo?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
}

export function PropertyGallery({
  images,
  onViewAllPhotos,
  on3DTour,
  onVideo,
  onFavorite,
  onShare,
  isFavorite = false,
}: PropertyGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0]);
  const thumbnailImages = images.slice(1, 3);

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerTab, setMediaViewerTab] = useState<'photos' | '3d-tour' | 'video'>('photos');

  const photoCount = images.filter((img) => img.type === 'photo').length;
  const tourCount = images.filter((img) => img.type === '3d-tour').length;
  const videoCount = images.filter((img) => img.type === 'video').length;

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

  const imageUrls = images.map((img) => img.url);

  return (
    <div className='flex flex-col gap-3 sm:gap-4 sm:grid sm:grid-cols-[2fr_1fr] sm:h-[400px] lg:h-[500px]'>
      {/* Hero Image */}
      <div className='relative rounded-xl overflow-hidden w-full aspect-[4/3] sm:aspect-auto sm:h-full'>
        <Image src={mainImage.url} alt={mainImage.alt} fill className='object-cover' priority />

        {/* Overlay Action Buttons */}
        <div className='absolute bottom-4 right-4 flex gap-2'>
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
                View all photos ({photoCount})
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
                <span className='text-sm font-medium text-main-black'>3D Tour ({tourCount})</span>
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
                <span className='text-sm font-medium text-main-black'>Video ({videoCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail row on mobile, sidebar on desktop */}
      <div className='flex flex-row gap-3 mt-2 sm:mt-0 sm:flex-col sm:gap-3 sm:h-full'>
        {thumbnailImages.map((image) => (
          <button
            key={image.id}
            onClick={() => setMainImage(image)}
            className={`
              group relative rounded-xl overflow-hidden w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1
              border-2 border-transparent
              hover:border-main-primary hover:p-1
              transition-all duration-200 ease-out
              ${mainImage.id === image.id ? 'border-main-primary p-1' : ''}
            `}
          >
            <div className='relative w-full h-full rounded-lg overflow-hidden'>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className='object-cover transition-transform duration-200 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 400px'
              />
            </div>
          </button>
        ))}

        {/* Fill remaining space if less than 2 thumbnails */}
        {thumbnailImages.length < 2 &&
          Array.from({ length: 2 - thumbnailImages.length }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className='w-[48%] aspect-[4/3] sm:w-full sm:aspect-auto sm:flex-1 rounded-xl border-2 border-dashed border-grey-300 bg-grey-100 flex items-center justify-center hover:border-main-primary hover:p-1 transition-all duration-200'
            >
              <span className='text-sm text-grey-500'>No image</span>
            </div>
          ))}
      </div>

      {/* Fullscreen Media Viewer */}
      <MediaViewer
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
        images={imageUrls}
        defaultTab={mediaViewerTab}
        onFavorite={onFavorite}
        onShare={onShare}
        isFavorite={isFavorite}
      />
    </div>
  );
}
