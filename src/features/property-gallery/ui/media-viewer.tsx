'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Heart, Share2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import RealVistaLogo from '@/shared/assets/logo/logo';

export type MediaType = 'photos' | '3d-tour' | 'video';

export interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images?: string[];
  defaultTab?: MediaType;
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
}

const MediaViewerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn('fixed left-0 right-0 top-0 bottom-0 z-50 bg-main-black/90', className)}
    {...props}
  />
));
MediaViewerContent.displayName = DialogPrimitive.Content.displayName;

const MediaViewerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-main-black/90', className)}
    {...props}
  />
));
MediaViewerOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * MediaViewer component displays a fullscreen overlay for viewing property media
 * with tabbed navigation between Photos, 3D Tour, and Video
 */
export function MediaViewer({
  open,
  onOpenChange,
  images = [],
  defaultTab = 'photos',
  onFavorite,
  onShare,
  isFavorite = false,
}: MediaViewerProps) {
  const [activeTab, setActiveTab] = React.useState<MediaType>(defaultTab);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const tabs: { id: MediaType; label: string }[] = [
    { id: 'photos', label: 'Photos' },
    { id: '3d-tour', label: '3D Tour' },
    { id: 'video', label: 'Video' },
  ];

  const handlePrevious = () => {
    if (activeTab === 'photos' && images.length > 0) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
  };

  const handleNext = () => {
    if (activeTab === 'photos' && images.length > 0) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <MediaViewerOverlay />
        <MediaViewerContent
          className='fixed left-0 right-0 top-0 bottom-0 z-50 flex flex-col bg-main-black/40'
          onKeyDown={handleKeyDown}
        >
          {/* Top Navigation */}
          <div className='relative px-6 py-4 border-b border-white/10'>
            <div className='flex items-center justify-between'>
              {/* Logo */}
              <div className='flex items-center gap-2'>
                <RealVistaLogo className='h-8 w-8' />
                <span className='text-white text-xl font-bold'>RealVista</span>
              </div>

              {/* Navigation Tabs */}
              <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-12'>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative text-base font-medium transition-colors',
                      activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white'
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className='absolute -right-6 top-0 bottom-0 w-1 bg-main-primary rounded-full' />
                    )}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className='flex items-center gap-3'>
                <RealVistaButton
                  variant='secondary'
                  size='small'
                  onClick={onShare}
                  className='!bg-main-primary !border-main-primary !text-white hover:!bg-main-primary-hover'
                >
                  Share
                </RealVistaButton>

                <RealVistaButton
                  variant='secondary'
                  size='small'
                  onClick={onFavorite}
                  className={cn(isFavorite && 'bg-main-primary !border-main-primary !text-white')}
                >
                  Favorite
                </RealVistaButton>

                <button
                  onClick={() => onOpenChange(false)}
                  className='flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 p-2 transition-colors'
                >
                  <X className='size-5 text-white' />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='flex-1 relative overflow-hidden'>
            {activeTab === 'photos' && images.length > 0 && (
              <>
                {/* Image */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <img
                    src={images[currentIndex]}
                    alt={`Property photo ${currentIndex + 1}`}
                    className='max-w-full max-h-full object-contain'
                  />
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className='absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors'
                    >
                      <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='white'
                        strokeWidth='2'
                      >
                        <path d='M15 18l-6-6 6-6' />
                      </svg>
                    </button>

                    <button
                      onClick={handleNext}
                      className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors'
                    >
                      <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='white'
                        strokeWidth='2'
                      >
                        <path d='M9 18l6-6-6-6' />
                      </svg>
                    </button>
                  </>
                )}

                {/* Counter */}
                {images.length > 1 && (
                  <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-main-black px-4 py-2 text-white text-sm'>
                    <span>{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{images.length}</span>
                  </div>
                )}
              </>
            )}

            {activeTab === '3d-tour' && (
              <div className='absolute inset-0 flex items-center justify-center text-white'>
                <div className='text-center'>
                  <p className='text-2xl font-bold mb-2'>3D Tour</p>
                  <p className='text-white/60'>3D tour content will be displayed here</p>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className='absolute inset-0 flex items-center justify-center text-white'>
                <div className='text-center'>
                  <p className='text-2xl font-bold mb-2'>Video Tour</p>
                  <p className='text-white/60'>Video content will be displayed here</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer (Optional) */}
          <div className='border-t border-white/10 bg-white/5 backdrop-blur-sm'>
            <div className='px-6 py-4'>
              <p className='text-white/60 text-sm text-center'>
                Press ESC or click X to close • Use arrow keys to navigate
              </p>
            </div>
          </div>
        </MediaViewerContent>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
