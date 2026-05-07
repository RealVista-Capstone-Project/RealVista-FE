'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Sparkles, Info, Zap } from 'lucide-react';

import type { Listing } from '@/entities/listing';
import {
  listingBoostQueries,
  useApplyBoost,
  useRemoveBoost,
} from '@/entities/listing/api/listing-boost.queries';
import { billingQueries } from '@/entities/billing/api';
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

  const packageQueryOptions = React.useMemo(() => billingQueries.myBoosts(), []);
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
    <div className='pb-2'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <Zap className='h-4 w-4 text-primary' strokeWidth={2} />
        <h3 className='text-base font-bold text-foreground'>{t('boost.title')}</h3>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className='mt-2 grid grid-cols-2 gap-3'>
          <div className='h-28 animate-pulse rounded-xl bg-primary/10' />
          <div className='h-28 animate-pulse rounded-xl bg-primary/10' />
        </div>
      ) : !activePackage ? (
        <div className='mt-2 flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] py-6 text-center'>
          <p className='text-sm font-semibold text-foreground'>{t('boost.noPackage')}</p>
          <p className='text-xs text-muted-foreground'>{t('boost.noPackageDescription')}</p>
          <Link
            href='/subscribe'
            className='group relative mt-1 inline-flex items-center gap-1.5 overflow-hidden rounded-2xl px-5 py-2 text-xs font-semibold transition-all hover:scale-105'
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(186,230,255,0.7) 40%, rgba(125,211,252,0.6) 100%)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 0 0 1px rgba(125,211,252,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
              animation: 'borderBlink 2.5s ease-in-out infinite',
            }}
          >
            <style>{`
              @keyframes borderBlink {
                0%, 100% {
                  box-shadow: 0 0 0 1px rgba(125,211,252,0.3), 0 0 8px 2px rgba(125,211,252,0.2), inset 0 1px 0 rgba(255,255,255,0.8);
                  border-color: rgba(255,255,255,0.7);
                }
                50% {
                  box-shadow: 0 0 0 1.5px rgba(56,189,248,0.7), 0 0 16px 4px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.9);
                  border-color: rgba(186,230,255,0.95);
                }
              }
              @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-15deg); }
                100% { transform: translateX(300%) skewX(-15deg); }
              }
              @keyframes iconBlink {
                0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
                50% { opacity: 0.6; transform: scale(1.2) rotate(15deg); }
              }
            `}</style>

            {/* shimmer sweep */}
            <span
              className='pointer-events-none absolute inset-0 w-1/4'
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                animation: 'shimmer 2.4s ease-in-out infinite',
              }}
            />

            <Sparkles
              className='relative h-3.5 w-3.5 shrink-0 text-sky-600'
              style={{ animation: 'iconBlink 1.6s ease-in-out infinite' }}
            />
            <span className='relative text-sky-700'>{t('boost.buyPackage')}</span>
          </Link>
        </div>
      ) : (
        <div className='mt-1 grid grid-cols-2 gap-3'>
          <BoostCard
            label={t('boost.featured')}
            tooltip={t('boost.featuredTooltip')}
            remaining={activePackage.remaining_featured_quota ?? 0}
            total={activePackage.featured_quota}
            isActive={activeBoostTypes.has('FEATURED')}
            isPendingApply={
              applyBoost.isPending && applyBoost.variables?.boostType === 'FEATURED'
            }
            isPendingRemove={
              removeBoost.isPending && removeBoost.variables?.boostType === 'FEATURED'
            }
            onApply={() => handleApply('FEATURED')}
            onRemove={() => handleRemoveClick('FEATURED')}
            t={t}
          />
          <BoostCard
            label={t('boost.hotBadge')}
            tooltip={t('boost.hotBadgeTooltip')}
            remaining={activePackage.remaining_hot_badge_quota ?? 0}
            total={activePackage.hot_badge_quota}
            isActive={activeBoostTypes.has('HOT_BADGE')}
            isPendingApply={
              applyBoost.isPending && applyBoost.variables?.boostType === 'HOT_BADGE'
            }
            isPendingRemove={
              removeBoost.isPending && removeBoost.variables?.boostType === 'HOT_BADGE'
            }
            onApply={() => handleApply('HOT_BADGE')}
            onRemove={() => handleRemoveClick('HOT_BADGE')}
            t={t}
          />
        </div>
      )}

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('boost.removeConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('boost.removeConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={() => setRemoveDialogOpen(false)}
              className='flex h-11 items-center justify-center rounded-lg border border-primary/20 bg-white px-6 text-sm font-bold text-foreground transition-colors hover:bg-primary/5'
              disabled={removeBoost.isPending}
            >
              {t('boost.removeConfirmCancel')}
            </button>
            <button
              type='button'
              onClick={handleRemoveConfirm}
              className='flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={removeBoost.isPending}
            >
              {removeBoost.isPending ? t('boost.removing') : t('boost.removeConfirmApprove')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoostCard({
  label,
  tooltip,
  remaining,
  total,
  isActive,
  isPendingApply,
  isPendingRemove,
  onApply,
  onRemove,
  t,
}: {
  label: string;
  tooltip: string;
  remaining: number;
  total: number;
  isActive: boolean;
  isPendingApply: boolean;
  isPendingRemove: boolean;
  onApply: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations<'ListingDetailPanel'>>;
}) {
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-primary/12 bg-white p-4'>
      {/* Name + active badge */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1'>
          <span className='text-sm font-semibold text-foreground'>{label}</span>
          <div className='group relative'>
            <Info className='h-3.5 w-3.5 cursor-pointer text-muted-foreground/60 hover:text-primary' />
            <div className='pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-48 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-[11px] leading-snug text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
              {tooltip}
              <span className='absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground' />
            </div>
          </div>
        </div>
        {isActive && (
          <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700'>
            {t('boost.active')}
          </span>
        )}
      </div>

      {/* Progress bar + count */}
      <div className='space-y-1'>
        <div className='relative h-1.5 w-full overflow-hidden rounded-full bg-primary/15'>
          <div
            className='h-full rounded-full bg-primary transition-all'
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className='flex justify-end'>
          <p className='text-xs text-muted-foreground'>{t('boost.remaining', { count: remaining })}</p>
        </div>
      </div>

      {/* Button */}
      {isActive ? (
        <div className='mt-auto flex justify-end'>
          <button
            type='button'
            onClick={onRemove}
            disabled={isPendingRemove}
            className='rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isPendingRemove ? t('boost.removing') : t('boost.remove')}
          </button>
        </div>
      ) : (
        <div className='mt-auto flex justify-end'>
          <button
            type='button'
            onClick={onApply}
            disabled={remaining <= 0 || isPendingApply}
            className='rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isPendingApply ? t('boost.applying') : t('boost.apply')}
          </button>
        </div>
      )}
    </div>
  );
}
