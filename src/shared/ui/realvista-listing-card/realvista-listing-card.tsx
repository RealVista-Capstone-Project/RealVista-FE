'use client';

import { useState } from 'react';
import { Bath, Heart, BedSingle, Flame } from 'lucide-react';
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
  isFavorite?: boolean;
  statusTag?: 'SOLD' | 'RENTED';
  attributes?: ListingAttribute[];
  boostTags?: string[];
  userType?: 'AGENT' | 'OWNER';
  variant?: 'grid' | 'list';
  compact?: boolean;
  listingType?: 'RENT' | 'SALE';
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
  isFavorite = false,
  statusTag,
  attributes,
  boostTags,
  variant = 'grid',
  compact = false,
  listingType = 'RENT',
  onToggleFavorite,
  onClick,
  className,
}: RealVistaListingCardProps) {
  const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  const resolvedImage = image || PLACEHOLDER_IMAGE;
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
          stroke='var(--primary)'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M2 13.1719L6.36371 17.5356'
          stroke='var(--primary)'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.6362 17.5356L17.9999 13.1719'
          stroke='var(--primary)'
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
          if (attr.value_number !== null && attr.value_number !== undefined)
            return attr.value_number !== 0;
          if (attr.value_text !== null && attr.value_text !== undefined)
            return attr.value_text.trim() !== '';
          return false;
        })
        .slice(0, 3);

      if (visible.length === 0) return null;

      return (
        <div className={cn('flex flex-wrap items-center', compact ? 'gap-2' : 'gap-3')}>
          {visible.map((attr) => (
            <div key={attr.attribute_id} className='flex items-center gap-1'>
              {attr.icon && (
                <AttributeIcon
                  iconName={attr.icon}
                  className={cn('text-primary', compact ? 'h-3.5 w-3.5' : 'h-5 w-5')}
                  strokeWidth={2.3}
                />
              )}
              <span className={cn('font-normal leading-[1.4] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
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

    // Fallback: render each spec individually — skip any spec with a falsy (0 / undefined) value
    const hasBeds = !!beds;
    const hasBathrooms = !!bathrooms;
    const hasArea = !!area;
    if (!hasBeds && !hasBathrooms && !hasArea) return null;

    return (
      <div className={cn('flex items-center', compact ? 'gap-2.5' : 'gap-4')}>
        {hasBeds && (
          <div className='flex items-center gap-1'>
            <BedSingle className={cn('text-primary', compact ? 'h-3.5 w-3.5' : 'h-5 w-5')} strokeWidth={2.3} />
            <span className={cn('font-normal leading-[1.4] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {beds} {t('beds')}
            </span>
          </div>
        )}
        {hasBathrooms && (
          <div className='flex items-center gap-1'>
            <Bath className={cn('text-primary', compact ? 'h-3.5 w-3.5' : 'h-5 w-5')} strokeWidth={2.3} />
            <span className={cn('font-normal leading-[1.4] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {bathrooms} {t('bathrooms')}
            </span>
          </div>
        )}
        {hasArea && (
          <div className='flex items-center gap-1'>
            <AreaIcon />
            <span className={cn('font-normal leading-[1.4] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {area}
              {areaUnit}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Shared Favorite Button — red heart when favorited
  const FavoriteButton = () => (
    <Button
      onClick={handleFavoriteClick}
      className='flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary/20 bg-white transition-colors hover:bg-primary/5'
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      variant='outline'
      size='icon'
    >
      <Heart
        className={cn('h-5 w-5', isFavorite ? 'fill-red-500 text-red-500' : 'text-primary')}
        strokeWidth={2.3}
      />
    </Button>
  );

  // Shared Status Tag (SOLD / RENTED) — primary blue, compact sizing when `compact`
  const StatusTag = ({
    marginClass,
    paddingClass,
  }: {
    marginClass: string;
    paddingClass: string;
  }) => (
    <div className={cn('relative', marginClass)}>
      <div
        className={cn(
          'rounded-tl-lg rounded-tr-lg rounded-br-lg bg-primary font-semibold text-primary-foreground',
          compact ? 'py-1.5 pl-2 pr-3 text-xs' : 'py-1.5 pr-4 pl-3 text-sm',
          paddingClass
        )}
      >
        {statusTag ? t(`status.${statusTag}`) : ''}
      </div>
      <div className='absolute left-0 top-full h-1 w-1'>
        <svg
          width='8'
          height='8'
          viewBox='0 0 8 8'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'
          className='block fill-primary'
          style={{ overflow: 'visible' }}
        >
          <path d='M8 8L0 0H8V8Z' />
        </svg>
      </div>
    </div>
  );

  // Shared Hot Badge (Premium Ribbon style) - High energy red theme
  const HotBadge = () => {
    const isHot = boostTags?.some((t) => {
      const upper = t.toUpperCase();
      return upper === 'HOT_BADGE' || upper === 'HOT';
    });

    if (!isHot || isUnavailable) return null;

    return (
      <div className='absolute -bottom-2 -left-2 z-10'>
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
    );
  };

  // ── Confirm unfavorite dialog (shared between variants) ──
  const confirmDialog = (
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
  );

  // ── List variant ──
  if (variant === 'list') {
    return (
      <>
        <div
          className={cn(
            'relative flex rounded-xl border-[1.5px] border-primary/10 bg-white transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1',
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

          {/* Image – fixed width */}
          <div className='relative w-[280px] min-h-[200px] shrink-0 overflow-hidden rounded-l-xl'>
            <Image src={resolvedImage} alt={title} fill className='object-cover' sizes='280px' />
          </div>

          {/* Badges Container - Outside overflow-hidden to allow ribbon fold */}
          <div className='absolute left-0 top-0 h-full w-[280px] pointer-events-none z-10'>
            <HotBadge />
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
                  <StatusTag
                    marginClass={compact ? '-ml-4' : '-ml-5'}
                    paddingClass={compact ? 'pl-4' : 'pl-6'}
                  />
                ) : (
                  <div className='flex items-baseline gap-1'>
                    <span className='text-xl font-bold leading-[1.4] tracking-[-0.5px] text-primary'>
                      {formatVND(price)}
                    </span>
                    <span className='text-xs font-semibold text-muted-foreground'>VNĐ</span>
                    {listingType === 'RENT' && (
                      <span className='text-sm font-normal leading-[1.5] text-muted-foreground'>
                        {t('perMonth')}
                      </span>
                    )}
                  </div>
                )}
                <FavoriteButton />
              </div>

              {/* Title */}
              <h3 className='mb-1 text-lg font-bold leading-[1.4] tracking-[-0.5px] text-foreground truncate'>
                {title}
              </h3>

              {/* Address */}
              <p className='text-sm font-normal leading-[1.5] text-muted-foreground line-clamp-1'>
                {address}
              </p>
            </div>

            {/* Bottom: Specs */}
            <div className='mt-3 border-t border-primary/20 pt-3'>
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
          'relative rounded-xl border-[1.5px] border-primary/10 bg-white flex flex-col h-full transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1',
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

        {/* Property Image Container */}
        <div className={cn('relative w-full overflow-hidden rounded-t-xl', compact ? 'aspect-[5/3]' : 'aspect-[4/3]')}>
          <Image
            src={imgError ? PLACEHOLDER_IMAGE : resolvedImage}
            alt={title}
            fill
            className='object-cover transition-transform duration-700 group-hover:scale-110'
            onError={() => setImgError(true)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            priority={false}
          />
        </div>

        {/* Badges Container - Outside overflow-hidden to allow ribbon fold */}
        <div className={cn('absolute left-0 top-0 w-full pointer-events-none z-10', compact ? 'aspect-[5/3]' : 'aspect-[4/3]')}>
          <HotBadge />
        </div>

        {/* Property Details */}
        <div className={cn('flex-1 flex flex-col', compact ? 'p-3.5' : 'p-6', isUnavailable && 'relative z-[6]')}>
          {/* Price and Favorite */}
          <div className={cn('flex items-center justify-between', compact ? 'mb-1.5' : 'mb-3')}>
            {isUnavailable ? (
              <StatusTag
                marginClass={compact ? '-ml-6' : '-ml-8'}
                paddingClass={compact ? 'pl-6' : 'pl-9'}
              />
            ) : (
              <div className='flex items-baseline gap-1'>
                <span className={cn('font-bold tracking-[-0.5px] text-primary', compact ? 'text-base leading-[1.4]' : 'text-2xl leading-[1.5] tracking-[-1px]')}>
                  {formatVND(price)}
                </span>
                <span className={cn('font-semibold text-muted-foreground', compact ? 'text-[11px]' : 'text-sm')}>VNĐ</span>
                {listingType === 'RENT' && (
                  <span className={cn('font-normal leading-[1.5] text-muted-foreground', compact ? 'text-xs' : 'text-base')}>
                    {t('perMonth')}
                  </span>
                )}
              </div>
            )}
            {compact ? (
              <Button
                onClick={handleFavoriteClick}
                className='flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white transition-colors hover:bg-primary/5'
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                variant='outline'
                size='icon'
              >
                <Heart
                  className={cn('h-3.5 w-3.5', isFavorite ? 'fill-red-500 text-red-500' : 'text-primary')}
                  strokeWidth={2.3}
                />
              </Button>
            ) : (
              <FavoriteButton />
            )}
          </div>

          {/* Title */}
          <h3 className={cn('font-bold text-foreground truncate', compact ? 'mb-0.5 text-sm leading-[1.4] tracking-[-0.25px]' : 'mb-1 text-2xl leading-[1.5] tracking-[-1px]')}>
            {title}
          </h3>

          {/* Address */}
          <p className={cn('font-normal leading-[1.5] text-muted-foreground', compact ? 'mb-2.5 text-xs line-clamp-1' : 'mb-4 text-base line-clamp-2 min-h-[48px]')}>
            {address}
          </p>

          {/* Divider Line */}
          <div className={cn('h-[1px] bg-primary/10 mt-auto', compact ? 'mb-2.5' : 'mb-4')} />

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
