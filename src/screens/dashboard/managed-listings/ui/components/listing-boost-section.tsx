'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';

import type { Listing } from '@/entities/listing';
import {
  listingBoostQueries,
  useApplyBoost,
  useRemoveBoost,
} from '@/entities/listing/api/listing-boost.queries';
import { billingQueries } from '@/entities/billing/api/billing.queries';
import { Link } from '@/shared/config/i18n/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';


interface ListingBoostSectionProps {
  listing: Listing;
}

export function ListingBoostSection({ listing }: ListingBoostSectionProps) {
  const t = useTranslations('ListingDetailPanel');

  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [pendingRemoveType, setPendingRemoveType] = React.useState<
    'FEATURED' | 'HOT_BADGE' | null
  >(null);

  const isPublished = listing.status === 'PUBLISHED';

  const boostQueryOptions = React.useMemo(
    () => listingBoostQueries.byListing(listing.listing_id),
    [listing.listing_id]
  );
  boostQueryOptions.enabled = isPublished;
  const { data: boosts, isLoading: boostsLoading } = useQuery(boostQueryOptions);

  const packageQueryOptions = React.useMemo(
    () => billingQueries.myBoosts(),
    []
  );
  packageQueryOptions.enabled = isPublished;
  const { data: boostPackages, isLoading: packagesLoading } = useQuery(packageQueryOptions);

  const applyBoost = useApplyBoost();
  const removeBoost = useRemoveBoost();

  const activeBoostTypes = React.useMemo(() => {
    const set = new Set<string>();
    if (boosts) {
      for (const b of boosts) {
        if (b.status === 'ACTIVE') set.add(b.boost_type);
      }
    }
    return set;
  }, [boosts]);

  React.useEffect(() => {
    if (applyBoost.isError) {
      const error = applyBoost.error as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to apply boost');
    }
  }, [applyBoost.isError, applyBoost.error]);

  React.useEffect(() => {
    if (removeBoost.isError) {
      const error = removeBoost.error as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to remove boost');
    }
  }, [removeBoost.isError, removeBoost.error]);

  if (!isPublished) {
    return null;
  }

  const isLoading = boostsLoading || packagesLoading;
  const activePackage = boostPackages?.[0] ?? null;

  const handleApply = (boostType: 'FEATURED' | 'HOT_BADGE') => {
    applyBoost.mutate({ listingId: listing.listing_id, boostType });
  };

  const handleRemoveClick = (boostType: 'FEATURED' | 'HOT_BADGE') => {
    setPendingRemoveType(boostType);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (!pendingRemoveType) return;
    removeBoost.mutate(
      { listingId: listing.listing_id, boostType: pendingRemoveType },
      {
        onSettled: () => {
          setRemoveDialogOpen(false);
          setPendingRemoveType(null);
        },
      }
    );
  };

  return (
    <>
      <div className='flex gap-4'>
        {/* Boost Card */}
        <div className='flex flex-col rounded-lg border border-purple-92 bg-purple-98/50 p-4 w-full'>
          <div className='mb-3 flex items-center gap-2'>
            <div className='flex h-7 w-7 items-center justify-center rounded-md bg-main-primary/10'>
              <Zap className='h-3.5 w-3.5 text-main-primary' strokeWidth={2.5} />
            </div>
            <h3 className='text-sm font-semibold text-main-black'>{t('boost.title')}</h3>
          </div>

          {isLoading ? (
            <div className='space-y-2'>
              <div className='h-10 animate-pulse rounded-md bg-gray-200' />
              <div className='h-10 animate-pulse rounded-md bg-gray-200' />
            </div>
          ) : !activePackage ? (
            <div className='rounded-md border border-purple-92 bg-white p-3 text-center'>
              <p className='text-sm font-semibold text-main-black'>{t('boost.noPackage')}</p>
              <p className='mt-1 text-xs text-main-secondary/60'>{t('boost.noPackageDescription')}</p>
              <Link href='/subscribe' className='mt-2 inline-flex items-center justify-center rounded-md bg-main-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-main-primary/90'>
                {t('boost.buyPackage')}
              </Link>
            </div>
          ) : (
            <div className='space-y-2'>
              <BoostRow
                label={t('boost.featured')}
                remaining={activePackage.remaining_featured_quota ?? 0}
                isActive={activeBoostTypes.has('FEATURED')}
                isPendingApply={applyBoost.isPending && applyBoost.variables?.boostType === 'FEATURED'}
                isPendingRemove={removeBoost.isPending && removeBoost.variables?.boostType === 'FEATURED'}
                onApply={() => handleApply('FEATURED')}
                onRemove={() => handleRemoveClick('FEATURED')}
                t={t}
              />
              <BoostRow
                label={t('boost.hotBadge')}
                remaining={activePackage.remaining_hot_badge_quota ?? 0}
                isActive={activeBoostTypes.has('HOT_BADGE')}
                isPendingApply={applyBoost.isPending && applyBoost.variables?.boostType === 'HOT_BADGE'}
                isPendingRemove={removeBoost.isPending && removeBoost.variables?.boostType === 'HOT_BADGE'}
                onApply={() => handleApply('HOT_BADGE')}
                onRemove={() => handleRemoveClick('HOT_BADGE')}
                t={t}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('boost.removeConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('boost.removeConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
            <button type='button' onClick={() => setRemoveDialogOpen(false)} className='flex h-11 items-center justify-center rounded-lg border border-purple-92 bg-white px-6 text-sm font-bold text-main-black transition-colors hover:bg-purple-98' disabled={removeBoost.isPending}>
              {t('boost.removeConfirmCancel')}
            </button>
            <button type='button' onClick={handleRemoveConfirm} className='flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-[0px_4px_12px_0px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed' disabled={removeBoost.isPending}>
              {removeBoost.isPending ? t('boost.removing') : t('boost.removeConfirmApprove')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BoostRow({
  label,
  remaining,
  isActive,
  isPendingApply,
  isPendingRemove,
  onApply,
  onRemove,
  t,
}: {
  label: string;
  remaining: number;
  isActive: boolean;
  isPendingApply: boolean;
  isPendingRemove: boolean;
  onApply: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations<'ListingDetailPanel'>>;
}) {
  return (
    <div className='flex items-center justify-between rounded-md border border-purple-92 bg-white px-3 py-2'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium text-main-black'>{label}</span>
        <span className='text-xs text-main-secondary/60'>{t('boost.remaining', { count: remaining })}</span>
        {isActive && (
          <span className='inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700'>
            {t('boost.active')}
          </span>
        )}
      </div>
      <div>
        {isActive ? (
          <button type='button' onClick={onRemove} disabled={isPendingRemove} className='rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed'>
            {isPendingRemove ? t('boost.removing') : t('boost.remove')}
          </button>
        ) : (
          <button type='button' onClick={onApply} disabled={remaining <= 0 || isPendingApply} className='rounded-md bg-main-primary px-2 py-1 text-xs font-medium text-white transition-all hover:bg-main-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'>
            {isPendingApply ? t('boost.applying') : t('boost.apply')}
          </button>
        )}
      </div>
    </div>
  );
}
