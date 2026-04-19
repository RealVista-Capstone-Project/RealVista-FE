'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { SharePopover } from '@/features/property-header/ui/share-popover';
import { VisuallyHidden } from '@/shared/ui';

import { SparkViewer } from '@/widgets/spark-viewer/SparkViewer';
import type { PropertyImage } from '@/entities/property';

export type MediaType = 'photos' | '3d-tour' | 'video';

export interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media?: PropertyImage[];
  defaultTab?: MediaType;
  onFavorite?: () => void;
  onRequestTour?: () => void;
}

const MediaViewerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn('fixed left-0 right-0 top-0 bottom-0 z-50 bg-foreground/90', className)}
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
    className={cn('fixed inset-0 z-50 bg-foreground/90', className)}
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
  media = [],
  defaultTab = 'photos',
  onFavorite,
  onRequestTour,
}: MediaViewerProps) {
  const t = useTranslations('PropertyGallery');

  const [activeTab, setActiveTab] = React.useState<MediaType>(defaultTab);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Categorize media
  const photos = React.useMemo(() => media.filter((m) => m.type === 'photo'), [media]);
  const videos = React.useMemo(() => media.filter((m) => m.type === 'video'), [media]);
  const tours = React.useMemo(() => media.filter((m) => m.type === '3d-tour'), [media]);

  const currentMediaItems = React.useMemo(() => {
    if (activeTab === 'photos') return photos;
    if (activeTab === 'video') return videos;
    if (activeTab === '3d-tour') return tours;
    return [];
  }, [activeTab, photos, videos, tours]);

  const tabs: { id: MediaType; label: string; count: number }[] = [
    { id: 'photos', label: t('photosTab'), count: photos.length },
    { id: '3d-tour', label: t('tour3DTab'), count: tours.length },
    { id: 'video', label: t('videoTab'), count: videos.length },
  ];

  // Reset index when tab changes
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  const handlePrevious = () => {
    if (currentMediaItems.length > 0) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : currentMediaItems.length - 1));
    }
  };

  const handleNext = () => {
    if (currentMediaItems.length > 0) {
      setCurrentIndex((prev) => (prev < currentMediaItems.length - 1 ? prev + 1 : 0));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onOpenChange(false);
  };

  const currentMedia = currentMediaItems[currentIndex];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <MediaViewerOverlay />
        <MediaViewerContent
          className='fixed left-0 right-0 top-0 bottom-0 z-50 flex flex-col bg-foreground/50'
          onKeyDown={handleKeyDown}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>{t('viewerTitle')}</DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Top Navigation */}
          <div className='relative h-24 px-6 flex items-center justify-between'>
            {/* Navigation Tabs */}
            <div className='flex items-center gap-12'>
              <RealVistaButton
                size='small'
                onClick={() => onOpenChange(false)}
                className={cn('!border-transparent !bg-transparent !text-white')}
              >
                <X className='size-4' />
              </RealVistaButton>
              {tabs.map(
                (tab) =>
                  tab.count > 0 && (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'relative text-base font-medium transition-colors py-3',
                        activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white'
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className='absolute -bottom-[3px] left-0 right-0 h-0.5 bg-primary rounded-full' />
                      )}
                    </button>
                  )
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-3'>
              <RealVistaButton
                variant='secondary'
                size='small'
                onClick={onRequestTour}
                className='!bg-primary !border-primary !text-white hover:!bg-primary/90'
              >
                {t('requestTour')}
              </RealVistaButton>

              <RealVistaButton
                size='small'
                onClick={onFavorite}
                className={cn('!border-transparent !bg-transparent !text-white')}
              >
                <Heart className='size-4' />
                {t('favorite')}
              </RealVistaButton>

              <SharePopover
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title=''
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className='flex-1 relative overflow-hidden'>
            <div className='absolute inset-0 flex items-center justify-center p-4 md:p-8'>
              <div className='relative w-full h-full flex items-center justify-center'>
                {activeTab === 'photos' && currentMedia && (
                  <Image
                    src={currentMedia.url}
                    alt={currentMedia.alt || t('photoAlt', { index: currentIndex + 1 })}
                    fill
                    className='object-contain'
                    priority
                    sizes='100vw'
                  />
                )}

                {activeTab === 'video' && currentMedia && (
                  <video
                    src={currentMedia.url}
                    controls
                    autoPlay
                    className='max-w-full max-h-full rounded-lg shadow-2xl'
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                {activeTab === '3d-tour' && currentMedia && (
                  <div className='relative w-full h-full'>
                    {/* Room name badge — top-left overlay */}
                    {currentMedia.metadata?.room_name && (
                      <div className='absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-4 py-2 text-white text-sm font-semibold pointer-events-none'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-80'
                        >
                          <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
                        </svg>
                        <span>{String(currentMedia.metadata.room_name)}</span>
                        {currentMediaItems.length > 1 && (
                          <span className='opacity-50 text-xs ml-1'>
                            {currentIndex + 1}/{currentMediaItems.length}
                          </span>
                        )}
                      </div>
                    )}
                    <SparkViewer
                      metadata={currentMedia.metadata}
                      className='w-full h-full'
                    />
                  </div>
                )}

                {activeTab === '3d-tour' && !currentMedia && (
                  <div className='text-center text-white'>
                    <p className='text-2xl font-bold mb-2'>{t('tour3DPlaceholder')}</p>
                    <p className='text-white/60'>{t('tour3DPlaceholderDescription')}</p>
                  </div>
                )}

                {!currentMedia && activeTab !== '3d-tour' && (
                  <div className='text-center text-white'>
                    <p className='text-2xl font-bold mb-2'>{t('noMediaTitle') || 'No media available'}</p>
                    <p className='text-white/60'>{t('noMediaDescription') || 'This content is not available.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            {currentMediaItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className='absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors text-white'
                >
                  <ChevronLeft className='size-6' />
                </button>

                <button
                  onClick={handleNext}
                  className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors text-white'
                >
                  <ChevronRight className='size-6' />
                </button>
              </>
            )}

            {/* Counter */}
            {currentMediaItems.length > 1 && (
              <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-white text-sm'>
                <span>{currentIndex + 1}</span>
                <span>/</span>
                <span>{currentMediaItems.length}</span>
              </div>
            )}
          </div>

          {/* Bottom Footer (Optional) */}
          <div className='border-t border-white/10 bg-white/5 backdrop-blur-sm'>
            <div className='px-6 py-4'>
              <p className='text-white/60 text-sm text-center'>{t('navigationHint')}</p>
            </div>
          </div>
        </MediaViewerContent>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
