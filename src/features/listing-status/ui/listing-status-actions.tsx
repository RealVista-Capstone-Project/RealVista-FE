'use client';

import * as React from 'react';
import { Globe, EyeOff, CheckCircle, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useUpdateListingStatus,
  executeStatusUpdate,
  type ListingStatusAction,
} from '../api/use-update-listing-status';
import { LISTING_STATUS_CONFIG } from '@/screens/dashboard/managed-listings/types/managed-listing';
import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface ListingStatusActionsProps {
  listingId: string;
  status: string;
  listingType: 'RENT' | 'SALE';
}

type ActionConfig = {
  action: ListingStatusAction;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  enabled: boolean;
};

/**
 * Returns all status actions with enabled/disabled state based on current status.
 * - DRAFT: Publish = enabled; Unpublish, Mark as Sold/Rented = disabled
 * - PENDING: Publish = enabled; others = disabled
 * - PUBLISHED: Unpublish, Mark as Sold/Rented = enabled; Publish = disabled
 * - SOLD/RENTED: All disabled (final state)
 */
function getAllActions(
  status: string,
  listingType: 'RENT' | 'SALE',
  t: (key: string) => string
): ActionConfig[] {
  const isDraft = status === 'DRAFT';
  const isPending = status === 'PENDING';
  const isPublished = status === 'PUBLISHED';

  return [
    {
      action: 'publish' as const,
      label: t('actions.publish'),
      icon: <Globe className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: isDraft || isPending,
    },
    {
      action: 'unpublish' as const,
      label: t('actions.unpublish'),
      icon: <EyeOff className='h-4 w-4' strokeWidth={2} />,
      enabled: isPublished,
    },
    {
      action: 'mark-as-sold' as const,
      label: t('actions.markAsSold'),
      icon: <CheckCircle className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: isPublished && listingType === 'SALE',
    },
    {
      action: 'mark-as-rented' as const,
      label: t('actions.markAsRented'),
      icon: <Home className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: isPublished && listingType === 'RENT',
    },
  ].filter((a) => {
    // Hide Mark as Sold for RENT listings, Mark as Rented for SALE listings
    if (a.action === 'mark-as-sold' && listingType === 'RENT') return false;
    if (a.action === 'mark-as-rented' && listingType === 'SALE') return false;
    return true;
  }) as ActionConfig[];
}

export function ListingStatusActions({
  listingId,
  status,
  listingType,
}: ListingStatusActionsProps) {
  const t = useTranslations('ListingStatus');
  const { mutateAsync, isPending } = useUpdateListingStatus();
  const [confirmingAction, setConfirmingAction] = React.useState<ListingStatusAction | null>(null);

  const actions = getAllActions(status, listingType, t);
  const config =
    LISTING_STATUS_CONFIG[status as keyof typeof LISTING_STATUS_CONFIG] ??
    LISTING_STATUS_CONFIG.DRAFT;
  const hasAnyEnabledAction = actions.some((a) => a.enabled);
  const isFinalState = status === 'SOLD' || status === 'RENTED';

  const handleConfirm = async () => {
    if (confirmingAction) {
      await executeStatusUpdate(mutateAsync, listingId, confirmingAction, t);
      setConfirmingAction(null);
    }
  };

  // When SOLD/RENTED, show only the status badge (no action buttons)
  if (isFinalState || !hasAnyEnabledAction) {
    return (
      <div className='flex items-center gap-3'>
        <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', config.className)}>
          {t(config.labelKey)}
        </span>
      </div>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', config.className)}>
        {t(config.labelKey)}
      </span>
      <div className='flex flex-wrap gap-2'>
        {actions.map(({ action, label, icon, variant, enabled }) => {
          const isDisabled = !enabled || isPending;
          return (
            <button
              key={action}
              type='button'
              disabled={isDisabled}
              onClick={() => {
                if (enabled && !isPending) {
                  if (action === 'mark-as-sold' || action === 'mark-as-rented' || action === 'unpublish') {
                    setConfirmingAction(action);
                  } else {
                    executeStatusUpdate(mutateAsync, listingId, action, t);
                  }
                }
              }}
              title={!enabled ? t('tooltips.notAvailable') : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isDisabled && 'cursor-not-allowed opacity-50',
                !isDisabled &&
                (variant === 'primary'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary/20 bg-white text-foreground hover:bg-primary/5')
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!confirmingAction} onOpenChange={(open) => !open && setConfirmingAction(null)}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>
              {confirmingAction === 'mark-as-sold'
                ? t('confirm.markAsSold.title')
                : confirmingAction === 'mark-as-rented'
                  ? t('confirm.markAsRented.title')
                  : t('confirm.unpublish.title')}
            </DialogTitle>
            <DialogDescription>
              {confirmingAction === 'mark-as-sold'
                ? t('confirm.markAsSold.description')
                : confirmingAction === 'mark-as-rented'
                  ? t('confirm.markAsRented.description')
                  : t('confirm.unpublish.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
            <button
              type='button'
              onClick={() => setConfirmingAction(null)}
              className='flex h-11 items-center justify-center rounded-lg border border-primary/20 bg-white px-6 text-sm font-bold text-foreground transition-colors hover:bg-primary/5'
              disabled={isPending}
            >
              {t('confirm.cancel')}
            </button>
            <button
              type='button'
              onClick={handleConfirm}
              className='flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition-all hover:bg-primary/90 shadow-[0px_4px_12px_0px_color-mix(in_oklch,var(--primary)_20%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isPending}
            >
              {isPending ? t('common.processing', { fallback: 'Processing...' }) : t('confirm.proceed')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
