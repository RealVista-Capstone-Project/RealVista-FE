'use client';

import { useState } from 'react';
import { Heart, Flame, MapPin, Box } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn, formatVND } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { AttributeIcon } from '@/shared/ui/attribute-icon/attribute-icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog/dialog';
import type { ListingAttribute } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

export interface HorizontalListingCardProps {
  id: string;
  image: string;
  title: string;
  address: string;
  price: number;
  isFavorite?: boolean;
  statusTag?: 'SOLD' | 'RENTED';
  attributes?: ListingAttribute[];
  boostTags?: string[];
  userType?: 'AGENT' | 'OWNER';
  listingType?: 'RENT' | 'SALE';
  has3D?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function HorizontalListingCard({
  id,
  image,
  title,
  address,
  price,
  isFavorite = false,
  statusTag,
  attributes,
  boostTags,
  userType,
  listingType = 'RENT',
  has3D = false,
  onToggleFavorite,
  onClick,
  className,
}: HorizontalListingCardProps) {
  const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  const resolvedImage = image || PLACEHOLDER_IMAGE;
  const t = useTranslations('PropertyCard');

  const [imgError, setImgError] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isUnavailable = !!statusTag;

  const isHot = boostTags?.some((tag) => {
    const upper = tag.toUpperCase();
    return upper === 'HOT_BADGE' || upper === 'HOT';
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      setIsConfirmOpen(true);
    } else {
      onToggleFavorite?.(id);
    }
  };

  const handleConfirmUnfavorite = () => {
    setIsConfirmOpen(false);
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => {
    if (isUnavailable) return;
    onClick?.(id);
  };

  const visibleAttributes = attributes
    ?.filter((attr) => {
      if (attr.value_boolean !== null && attr.value_boolean !== undefined)
        return attr.value_boolean === true;
      if (attr.value_number !== null && attr.value_number !== undefined) return true;
      if (attr.value_text !== null && attr.value_text !== undefined) return true;
      return false;
    })
    .slice(0, 4);

  return (
    <>
      <div
        className={cn(
          'group relative flex rounded-xl border border-border bg-white transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1',
          !isUnavailable && onClick && 'cursor-pointer',
          isUnavailable && 'cursor-default',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Unavailable overlay */}
        {isUnavailable && (
          <div className='absolute inset-0 rounded-xl bg-white/40 backdrop-blur-[2px] z-[5] pointer-events-none' />
        )}

        {/* Image Section */}
        <div className='relative w-[260px] min-h-[180px] shrink-0 overflow-hidden rounded-l-xl'>
          <Image
            src={imgError ? PLACEHOLDER_IMAGE : resolvedImage}
            alt={title}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            onError={() => setImgError(true)}
            sizes='260px'
          />

          {/* Status Tag */}
          {isUnavailable && (
            <div className='absolute left-0 top-3 z-[6]'>
              <div className='rounded-r-md bg-red-500 px-3 py-1'>
                <span className='text-sm font-bold text-white'>
                  {statusTag ? t(`status.${statusTag}`) : ''}
                </span>
              </div>
            </div>
          )}

          {/* Agent/Owner badge */}
        </div>

        {/* Hot Badge Container - Outside overflow-hidden to allow ribbon fold */}
        <div className='absolute left-0 top-0 h-full w-[260px] pointer-events-none z-10'>
          {isHot && !isUnavailable && (
            <div className='absolute top-3 -left-2'>
              <div className='relative h-8 rounded-br-lg rounded-tl-lg rounded-tr-lg bg-gradient-to-r from-red-600 via-red-500 to-orange-400 px-4 py-2 shadow-[0_2px_8px_rgba(239,68,68,0.45)]'>
                <div className='flex items-center gap-1.5'>
                  <Flame className='h-4 w-4 fill-white text-white' strokeWidth={2.5} />
                  <span
                    className='text-xs font-bold uppercase leading-4 tracking-[0.5px] text-white'
                    style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
                  >
                    HOT
                  </span>
                </div>
                <div className='absolute left-0 top-full h-1 w-1'>
                  <svg
                    width='8'
                    height='8'
                    viewBox='0 0 8 8'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    preserveAspectRatio='none'
                    className='block'
                    style={{ overflow: 'visible' }}
                  >
                    <path d='M8 8L0 0H8V8Z' fill='#991b1b' />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* 3D Badge - Bottom right corner */}
          {has3D && !isUnavailable && (
            <div
              className='absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 shadow-lg backdrop-blur-md border border-white/50'
              title='3D Virtual Tour available'
            >
              <Box className='h-3.5 w-3.5 text-gray-700' strokeWidth={2} />
              <span className='text-xs font-bold uppercase leading-3 tracking-[0.5px] text-gray-700'>
                3D
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={cn(
          'flex flex-1 flex-col justify-between p-4',
          isUnavailable && 'relative z-[6]'
        )}>
          {/* Top */}
          <div>
            {/* Price + Favorite */}
            <div className='mb-1.5 flex items-start justify-between'>
              <div className='flex items-baseline gap-1'>
                <span className='text-xl font-bold tracking-tight text-primary'>
                  {formatVND(price)}
                </span>
                <span className='text-xs font-semibold text-muted-foreground'>VNĐ</span>
                {listingType === 'RENT' && (
                  <span className='text-sm text-muted-foreground'>
                    {t('perMonth')}
                  </span>
                )}
              </div>
              <Button
                onClick={handleFavoriteClick}
                className='flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-accent'
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                variant='outline'
                size='icon'
              >
                <Heart
                  className={cn('h-4 w-4', isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground')}
                  strokeWidth={2}
                />
              </Button>
            </div>

            {/* Title */}
            <h3 className='mb-1 text-base font-semibold leading-snug text-foreground line-clamp-1'>
              {title}
            </h3>

            {/* Address */}
            <div className='mb-3 flex items-center gap-1 text-sm text-muted-foreground'>
              <MapPin className='h-3.5 w-3.5 shrink-0' />
              <span className='line-clamp-1'>{address}</span>
            </div>
          </div>

          {/* Bottom: Attributes */}
          {visibleAttributes && visibleAttributes.length > 0 && (
            <div className='flex flex-wrap items-center gap-3 border-t border-border pt-3'>
              {visibleAttributes.map((attr) => (
                <div key={attr.attribute_id} className='flex items-center gap-1'>
                  {attr.icon && (
                    <AttributeIcon
                      iconName={attr.icon}
                      className='h-4 w-4 text-primary'
                      strokeWidth={2}
                    />
                  )}
                  <span className='text-sm text-muted-foreground'>
                    {attr.value_boolean === true
                      ? attr.attribute_name
                      : attr.value_text !== null && attr.value_text !== undefined
                        ? attr.value_text
                        : [attr.value_number, attr.attribute_name].filter(Boolean).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm unfavorite dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className='max-w-sm p-8' onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Heart className='h-5 w-5 fill-primary/20 text-primary' strokeWidth={2} />
              {t('confirmUnfavoriteTitle')}
            </DialogTitle>
            <DialogDescription>{t('confirmUnfavoriteMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 gap-2'>
            <DialogClose asChild>
              <Button variant='outline' className='flex-1 pt-2'>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirmUnfavorite}
              className='flex-1 bg-primary hover:bg-primary/90 text-white border-0'
            >
              {t('unfavorite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
