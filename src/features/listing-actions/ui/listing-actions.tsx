'use client';

import { useState } from 'react';
import { Heart, MoreHorizontal, Flag, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu/dropdown-menu';
import { SharePopover } from '@/features/property-header/ui/share-popover';
import { ReportDialog } from '@/features/listing-report';

export interface ListingActionsProps {
  listingId: string;
  listingName: string;
  shareUrl: string;
  isFavorite: boolean;
  onFavorite: () => void;
  onReport?: () => void;
}

export function ListingActions({
  listingId,
  listingName,
  shareUrl,
  isFavorite,
  onFavorite,
}: ListingActionsProps) {
  const t = useTranslations('ListingActions');
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className='flex items-center gap-2'>
      {/* Share Button */}
      <SharePopover url={shareUrl} title={listingName} />

      {/* Favorite Button */}
      <RealVistaButton
        variant='secondary'
        size='medium'
        onClick={onFavorite}
        className={`gap-2 ${isFavorite ? 'bg-primary/15-hover' : ''}`}
      >
        <Heart
          className={`size-4 ${isFavorite ? 'fill-current text-red-500' : ''}`}
        />
        <span className='hidden sm:inline'>
          {isFavorite ? t('saved') : t('save')}
        </span>
      </RealVistaButton>

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <RealVistaButton variant='secondary' size='medium' className='px-2.5'>
            <MoreHorizontal className='size-4' />
          </RealVistaButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem
            onClick={() => setIsReportOpen(true)}
            className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
          >
            <Flag className='size-4 mr-2' />
            {t('report')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <ReportDialog
        targetType='LISTING'
        targetId={listingId}
        targetName={listingName}
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
      />
    </div>
  );
}
