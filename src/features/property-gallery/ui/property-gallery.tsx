'use client';

import { Box, Camera, Video } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { PropertyImage } from '@/entities/property';

export interface PropertyGalleryProps {
  images: PropertyImage[];
  onViewAllPhotos?: () => void;
  on3DTour?: () => void;
  onVideo?: () => void;
}

export function PropertyGallery({
  images,
  onViewAllPhotos,
  on3DTour,
  onVideo,
}: PropertyGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0]);
  const thumbnailImages = images.slice(1, 3);

  const photoCount = images.filter((img) => img.type === 'photo').length;
  const tourCount = images.filter((img) => img.type === '3d-tour').length;
  const videoCount = images.filter((img) => img.type === 'video').length;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 h-[400px] lg:h-[500px]'>
      {/* Hero Image */}
      <div className='relative rounded-xl overflow-hidden h-full'>
        <Image src={mainImage.url} alt={mainImage.alt} fill className='object-cover' priority />

        {/* Overlay Action Buttons */}
        <div className='absolute bottom-4 left-4 flex gap-2'>
          {onViewAllPhotos && photoCount > 0 && (
            <button
              onClick={onViewAllPhotos}
              className='
                group flex items-center gap-2 px-3 py-2
                bg-white/95 backdrop-blur-sm rounded-lg
                border-2 border-transparent
                hover:border-purple-92 hover:p-1.5
                transition-all duration-200 ease-out
                shadow-sm hover:shadow-md
              '
            >
              <Camera className='size-4' />
              <span className='text-sm font-medium text-main-black'>
                View all photos ({photoCount})
              </span>
            </button>
          )}

          {on3DTour && tourCount > 0 && (
            <button
              onClick={on3DTour}
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

          {onVideo && videoCount > 0 && (
            <button
              onClick={onVideo}
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

      {/* Thumbnail Sidebar */}
      <div className='flex flex-col gap-3 h-full'>
        {thumbnailImages.map((image) => (
          <button
            key={image.id}
            onClick={() => setMainImage(image)}
            className={`
              group relative rounded-xl overflow-hidden flex-1
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
              className='flex-1 rounded-xl border-2 border-dashed border-grey-300 bg-grey-100 flex items-center justify-center hover:border-main-primary hover:p-1 transition-all duration-200'
            >
              <span className='text-sm text-grey-500'>No image</span>
            </div>
          ))}
      </div>
    </div>
  );
}
