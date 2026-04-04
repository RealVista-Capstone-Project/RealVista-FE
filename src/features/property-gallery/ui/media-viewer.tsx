'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Heart } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { SharePopover } from '@/features/property-header/ui/share-popover';

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
  media = [],
  defaultTab = 'photos',
  onFavorite,
  onRequestTour,
}: MediaViewerProps) {
  const [activeTab, setActiveTab] = React.useState<MediaType>(defaultTab);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Filter media by type with support for both client-side and API structure
  const photos = React.useMemo(() => {
    return media
      .filter((m: any) => m.type === 'photo' || m.media_type === 'IMAGE')
      .map((m) => ({
        ...m,
        url: m.url || m.media_url,
        type: 'photo',
      }));
  }, [media]);

  const video = React.useMemo(() => {
    const item = media.find((m: any) => m.type === 'video' || m.media_type === 'VIDEO');
    return item ? { ...item, url: item.url || item.media_url, type: 'video' } : null;
  }, [media]);

  const tour3d = React.useMemo(() => {
    const item = media.find(
      (m: any) =>
        m.type === '3d-tour' || m.media_type === 'THREE_D' || m.media_type === 'VIRTUAL_TOUR'
    );
    if (item) {
      return {
        ...item,
        url: item.url || item.media_url,
        metadata: item.metadata,
        type: '3d-tour',
      };
    }
    return null;
  }, [media]);

  const tabs: { id: MediaType; label: string; count: number }[] = [
    { id: 'photos' as MediaType, label: 'Photos', count: photos.length },
    { id: '3d-tour' as MediaType, label: '3D Tour', count: tour3d ? 1 : 0 },
    { id: 'video' as MediaType, label: 'Video', count: video ? 1 : 0 },
  ].filter((tab) => tab.count > 0);

  // If active tab's count becomes 0 (due to media update), switch to first available
  React.useEffect(() => {
    if (open && tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [open, tabs, activeTab]);

  const handlePrevious = () => {
    if (activeTab === 'photos' && photos.length > 0) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }
  };

  const handleNext = () => {
    if (activeTab === 'photos' && photos.length > 0) {
      setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
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
          className='fixed left-0 right-0 top-0 bottom-0 z-50 flex flex-col bg-main-black/50'
          onKeyDown={handleKeyDown}
        >
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
              {tabs.map((tab) => (
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
                    <div className='absolute -bottom-[3px] left-0 right-0 h-0.5 bg-main-primary rounded-full' />
                  )}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-3'>
              <RealVistaButton
                variant='secondary'
                size='small'
                onClick={onRequestTour}
                className='!bg-main-primary !border-main-primary !text-white hover:!bg-main-primary-hover'
              >
                Request a tour
              </RealVistaButton>

              <RealVistaButton
                size='small'
                onClick={onFavorite}
                className={cn('!border-transparent !bg-transparent !text-white')}
              >
                <Heart className='size-4' />
                Favorite
              </RealVistaButton>

              <SharePopover
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title=''
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className='flex-1 relative overflow-hidden'>
            {activeTab === 'photos' && photos.length > 0 && (
              <>
                {/* Image */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <img
                    src={photos[currentIndex].url}
                    alt={`Property photo ${currentIndex + 1}`}
                    className='max-w-full max-h-full object-contain'
                  />
                </div>

                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className='absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors z-10'
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
                      className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-3 transition-colors z-10'
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
                {photos.length > 1 && (
                  <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-main-black px-4 py-2 text-white text-sm'>
                    <span>{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{photos.length}</span>
                  </div>
                )}
              </>
            )}

            {activeTab === '3d-tour' && tour3d && (
              <div className='absolute inset-0 p-6 flex items-center justify-center'>
                <SparkViewer
                  metadata={tour3d.metadata}
                  spzUrl={tour3d.url}
                  className='max-w-[1200px] max-h-full'
                />
              </div>
            )}

            {activeTab === 'video' && video && (
              <div className='absolute inset-0 p-6 flex items-center justify-center'>
                <video
                  src={video.url}
                  controls
                  className='max-w-full max-h-full rounded-xl shadow-2xl'
                  autoPlay
                />
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
