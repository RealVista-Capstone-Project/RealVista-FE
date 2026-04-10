'use client';

import { useState } from 'react';
import { Bath, Heart, BedSingle, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
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

export interface ListingAttribute {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  icon: string | null;
  unit: string | null;
  value_number: number | null;
  value_text: string | null;
  value_boolean: boolean | null;
}

export interface RealVistaListingCardProps {
  id: string;
  image: string;
  title: string;
  address: string;
  price: number;
  currency?: string;
  beds?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  isPopular?: boolean;
  isFavorite?: boolean;
  statusTag?: 'SOLD' | 'RENTED';
  attributes?: ListingAttribute[];
  variant?: 'grid' | 'list';
  listingType?: 'RENT' | 'SALE';
  boostTag?: 'FEATURED' | 'HOT_BADGE';
  userType?: 'AGENT' | 'OWNER';
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function RealVistaListingCard({
  id,
  image,
  title,
  address,
  price,
  beds = 0,
  bathrooms = 0,
  area = 0,
  areaUnit = 'm²',
  isPopular = false,
  isFavorite = false,
  statusTag,
  attributes,
  variant = 'grid',
  listingType = 'RENT',
  boostTag,
  userType,
  onToggleFavorite,
  onClick,
  className,
}: RealVistaListingCardProps) {
  const t = useTranslations('PropertyCard');

  const [imgError, setImgError] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isUnavailable = !!statusTag;

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

  // Shared Area Icon component to avoid duplication
  const AreaIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <g clipPath='url(#clip0_272_7379)'>
        <path
          d='M8.83149 15.5437L3.45631 10.1685C2.8479 9.56011 2.8479 8.43989 3.45631 7.83148L8.83149 2.45631C9.43989 1.8479 10.5601 1.8479 11.1685 2.45631L16.5437 7.83148C17.1521 8.43989 17.1521 9.56011 16.5437 10.1685L11.1685 15.5437C10.5601 16.1521 9.43989 16.1521 8.83149 15.5437V15.5437Z'
          stroke='#7065F0'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M2 13.1719L6.36371 17.5356'
          stroke='#7065F0'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.6362 17.5356L17.9999 13.1719'
          stroke='#7065F0'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <defs>
        <clipPath id='clip0_272_7379'>
          <rect width='20' height='20' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );

  // Shared Property Specs row — dynamic attrs when available, fallback to beds/bath/area
  const PropertySpecs = () => {
    if (attributes && attributes.length > 0) {
      const visible = attributes
        .filter((attr) => {
          if (attr.value_boolean !== null && attr.value_boolean !== undefined)
            return attr.value_boolean === true;
          if (attr.value_number !== null && attr.value_number !== undefined) return true;
          if (attr.value_text !== null && attr.value_text !== undefined) return true;
          return false;
        })
        .slice(0, 3);

      return (
        <div className='flex flex-wrap items-center gap-3'>
          {visible.map((attr) => (
            <div key={attr.attribute_id} className='flex items-center gap-1.5'>
              {attr.icon && (
                <AttributeIcon
                  iconName={attr.icon}
                  className='h-5 w-5 text-main-primary'
                  strokeWidth={2.3}
                />
              )}
              <span className='text-sm font-normal leading-[1.4] text-grey-500'>
                {attr.value_boolean === true
                  ? attr.attribute_name
                  : attr.value_text !== null && attr.value_text !== undefined
                    ? attr.value_text
                    : [attr.value_number, attr.attribute_name].filter(Boolean).join(' ')}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: fixed beds / bathrooms / area — only shown when values are explicitly provided
    if (!beds && !bathrooms && !area) return null;
    return (
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-1.5'>
          <BedSingle className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
          <span className='text-sm font-normal leading-[1.4] text-grey-500'>
            {beds} {t('beds')}
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <Bath className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
          <span className='text-sm font-normal leading-[1.4] text-grey-500'>
            {bathrooms} {t('bathrooms')}
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <AreaIcon />
          <span className='text-sm font-normal leading-[1.4] text-grey-500'>
            {area}
            {areaUnit}
          </span>
        </div>
      </div>
    );
  };

  // Shared Favorite Button — red heart when favorited
  const FavoriteButton = () => (
    <Button
      onClick={handleFavoriteClick}
      className='flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-purple-92 bg-white transition-colors hover:bg-purple-98'
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      variant='outline'
      size='icon'
    >
      <Heart
        className={cn('h-5 w-5', isFavorite ? 'fill-red-500 text-red-500' : 'text-main-primary')}
        strokeWidth={2.3}
      />
    </Button>
  );

  // Shared Status Tag (SOLD / RENTED)
  const StatusTag = () => (
    <Badge className='bg-red-600 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full border-none shadow-sm uppercase pointer-events-none'>
       {statusTag ? t(`status.${statusTag}`) : ''}
    </Badge>
  );

  // Boost & Agent Badges
  const BoostBadges = () => {
    if (!boostTag && userType !== 'AGENT') return null;

    return (
      <>
        {/* Left Side: Boost Tags */}
        <div className='absolute top-3 left-3 z-10 flex flex-wrap gap-2'>
          {boostTag === 'FEATURED' && (
            <div className='flex items-center gap-1.5 rounded-full bg-main-primary px-3 py-1.5 text-[10px] font-bold text-white shadow-md'>
              <Sparkles className='h-3 w-3 fill-amber-400 text-amber-400' />
              <span className='tracking-wide uppercase'>{t('featured')}</span>
            </div>
          )}
          {boostTag === 'HOT_BADGE' && (
            <div className='flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-md'>
              <Flame className='h-3 w-3 fill-orange-400 text-orange-400' />
              <span className='tracking-wide uppercase'>{t('hot')}</span>
            </div>
          )}
        </div>

        {/* Right Side: Verification Tags */}
        {userType === 'AGENT' && (
          <div className='absolute top-3 right-3 z-10'>
            <div className='flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-main-primary shadow-sm border border-purple-100'>
              <CheckCircle2 className='h-3.5 w-3.5 text-main-primary' strokeWidth={2.5} />
              <span className='tracking-wide uppercase'>{t('verifiedAgent')}</span>
            </div>
          </div>
        )}
      </>
    );
  };

  // ── Confirm unfavorite dialog (shared between variants) ──
  const confirmDialog = (
    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <DialogContent className='max-w-sm p-8' onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Heart className='h-5 w-5 fill-purple-100 text-main-primary' strokeWidth={2} />
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
            className='flex-1 bg-main-primary hover:bg-main-primary/90 text-white border-0'
          >
            {t('unfavorite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── List variant ──
  if (variant === 'list') {
    return (
      <>
        <div
          className={cn(
            'relative flex rounded-lg border-[1.5px] border-purple-96 bg-white transition-shadow hover:shadow-md overflow-hidden',
            !isUnavailable && onClick && 'cursor-pointer',
            isUnavailable && 'cursor-default',
            className
          )}
          onClick={handleCardClick}
        >
          {/* Unavailable overlay */}
          {isUnavailable && (
            <div className='absolute inset-0 rounded-lg bg-white/60 z-[5] pointer-events-none' />
          )}

          {/* Image – fixed width */}
          <div className='relative w-[280px] min-h-[200px] shrink-0'>
            <Image src={image} alt={title} fill className='object-cover' sizes='280px' />
            <BoostBadges />
          </div>

          {/* Details */}
          <div
            className={cn(
              'flex flex-1 flex-col justify-between p-5',
              isUnavailable && 'relative z-[6]'
            )}
          >
            {/* Top: Price + Favorite */}
            <div>
              <div className='mb-2 flex items-start justify-between'>
                {isUnavailable ? (
                  <StatusTag />
                ) : (
                  <div className='flex items-baseline gap-1'>
                    <span className='text-xl font-bold leading-[1.4] tracking-[-0.5px] text-main-primary'>
                      {formatVND(price)}
                    </span>
                    {listingType === 'RENT' && (
                      <span className='text-sm font-normal leading-[1.5] text-grey-500'>
                        {t('perMonth')}
                      </span>
                    )}
                  </div>
                )}
                <FavoriteButton />
              </div>

              {/* Title */}
              <h3 className='mb-1 text-lg font-bold leading-[1.4] tracking-[-0.5px] text-main-black truncate'>
                {title}
              </h3>

              {/* Address */}
              <p className='text-sm font-normal leading-[1.5] text-grey-500 line-clamp-1'>
                {address}
              </p>
            </div>

            {/* Bottom: Specs */}
            <div className='mt-3 border-t border-purple-92 pt-3'>
              <PropertySpecs />
            </div>
          </div>
        </div>
        {confirmDialog}
      </>
    );
  }

  // ── Grid variant (default) ──
  return (
    <>
      <div
        className={cn(
          'relative rounded-lg border-[1.5px] border-purple-96 bg-white transition-shadow hover:shadow-md flex flex-col h-full',
          !isUnavailable && onClick && 'cursor-pointer',
          isUnavailable && 'cursor-default',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Unavailable overlay */}
        {isUnavailable && (
          <div className='absolute inset-0 rounded-lg bg-white/60 z-[5] pointer-events-none' />
        )}

        {/* Property Image */}
        <div className='relative aspect-[16/10] rounded-t-lg bg-gray-100'>
          <Image
            src={imgError ? 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image' : image}
            alt={title}
            fill
            className='rounded-t-lg object-cover'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            onError={() => setImgError(true)}
          />
          <BoostBadges />
        </div>

        {/* Property Details */}
        <div className={cn('p-6 flex-1 flex flex-col', isUnavailable && 'relative z-[6]')}>
          {/* Price and Favorite */}
          <div className='mb-3 flex items-center justify-between'>
            {isUnavailable ? (
              <StatusTag />
            ) : (
              <div className='flex items-baseline gap-1'>
                <span className='text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-primary'>
                  {formatVND(price)}
                </span>
                {listingType === 'RENT' && (
                  <span className='text-base font-normal leading-[1.5] text-grey-500'>
                    {t('perMonth')}
                  </span>
                )}
              </div>
            )}
            <FavoriteButton />
          </div>

          {/* Title */}
          <h3 className='mb-1 text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-black truncate'>
            {title}
          </h3>

          {/* Address */}
          <p className='mb-4 text-base font-normal leading-[1.5] text-grey-500 line-clamp-2 min-h-[48px]'>
            {address}
          </p>

          {/* Divider Line */}
          <div className='mb-4 h-[1px] bg-purple-92 mt-auto' />

          {/* Property Specs */}
          <div className='flex items-center justify-center'>
            <PropertySpecs />
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
