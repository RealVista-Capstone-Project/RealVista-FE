'use client';

import * as React from 'react';
import { Globe, CheckCircle, Home, Clock, EyeOff } from 'lucide-react';
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
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface ListingStatusActionsProps {
  listingId: string;
  status: string;
  listingType: 'RENT' | 'SALE';
  /** Resolved street + ward + district + city when available */
  propertyAddress?: string | null;
  /** Fallback line in the confirmation dialog when address is empty */
  listingTitle?: string | null;
  /** Published listing countdown (e.g. "Còn 13 ngày"); shown next to status when set */
  publishedLifetimeChipLabel?: string | null;
  /** Raw hours remaining; used to apply urgent styling when < 3 days */
  publishedLifetimeHoursLeft?: number | null;
}

type ConfirmableListingAction = Extract<ListingStatusAction, 'unpublish' | 'mark-as-sold' | 'mark-as-rented'>;

type ActionConfig = {
  action: ListingStatusAction;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  enabled: boolean;
};

/**
 * Actions actually shown in the toolbar (not unpublish).
 * Only enabled entries are returned — no hidden disabled buttons.
 */
function getVisibleActions(
  status: string,
  listingType: 'RENT' | 'SALE',
  t: (key: string) => string
): ActionConfig[] {
  const out: ActionConfig[] = [];

  if (status === 'DRAFT') {
    out.push({
      action: 'publish' as const,
      label: t('actions.publish'),
      icon: <Globe className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: true,
    });
  }

  if (status === 'PENDING') {
    out.push({
      action: 'unpublish' as const,
      label: t('actions.unpublish'),
      icon: <EyeOff className='h-4 w-4' strokeWidth={2} />,
      variant: 'secondary' as const,
      enabled: true,
    });
  }

  if (status === 'PUBLISHED') {
    out.push({
      action: 'unpublish' as const,
      label: t('actions.unpublish'),
      icon: <EyeOff className='h-4 w-4' strokeWidth={2} />,
      variant: 'secondary' as const,
      enabled: true,
    });
    if (listingType === 'SALE') {
      out.push({
        action: 'mark-as-sold' as const,
        label: t('actions.markAsSold'),
        icon: <CheckCircle className='h-4 w-4' strokeWidth={2} />,
        variant: 'primary' as const,
        enabled: true,
      });
    } else {
      out.push({
        action: 'mark-as-rented' as const,
        label: t('actions.markAsRented'),
        icon: <Home className='h-4 w-4' strokeWidth={2} />,
        variant: 'primary' as const,
        enabled: true,
      });
    }
  }

  return out;
}

export function ListingStatusActions({
  listingId,
  status,
  listingType,
  propertyAddress,
  listingTitle,
  publishedLifetimeChipLabel,
  publishedLifetimeHoursLeft,
}: ListingStatusActionsProps) {
  const t = useTranslations('ListingStatus');
  const tGlobal = useTranslations();
  const { mutateAsync, isPending } = useUpdateListingStatus();
  const [confirmingAction, setConfirmingAction] = React.useState<ConfirmableListingAction | null>(null);

  const actions = getVisibleActions(status, listingType, t);
  const config =
    LISTING_STATUS_CONFIG[status as keyof typeof LISTING_STATUS_CONFIG] ??
    LISTING_STATUS_CONFIG.DRAFT;
  const hasVisibleActions = actions.length > 0;
  const isFinalState = status === 'SOLD' || status === 'RENTED';

  const confirmDisplayLine =
    propertyAddress?.trim() || listingTitle?.trim() || t('confirm.addressUnknown');

  const handleConfirm = async () => {
    if (confirmingAction) {
      await executeStatusUpdate(mutateAsync, listingId, confirmingAction, tGlobal);
      setConfirmingAction(null);
    }
  };

  const isLifetimeUrgent =
    publishedLifetimeHoursLeft !== null &&
    publishedLifetimeHoursLeft !== undefined &&
    publishedLifetimeHoursLeft < 72;

  // When SOLD/RENTED, show only the status badge (no action buttons)
  const lifetimeChip =
    publishedLifetimeChipLabel && publishedLifetimeChipLabel.length > 0 ? (
      <span
        className={cn(
          'inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-none',
          isLifetimeUrgent
            ? 'bg-amber-100 text-amber-700'
            : 'bg-primary/10 text-primary'
        )}
        role='status'
        aria-live='polite'
      >
        <Clock
          className={cn('h-3.5 w-3.5 shrink-0', isLifetimeUrgent ? 'text-amber-600' : 'text-primary')}
          strokeWidth={2}
        />
        <span className='min-w-0 truncate'>{publishedLifetimeChipLabel}</span>
      </span>
    ) : null;

  if (isFinalState || !hasVisibleActions) {
    return (
      <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
        <span
          className={cn(
            'inline-flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 py-1.5 leading-none',
            config.className
          )}
        >
          {t(config.labelKey)}
        </span>
        {lifetimeChip}
      </div>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
      <span
        className={cn(
          'inline-flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 py-1.5 leading-none',
          config.className
        )}
      >
        {t(config.labelKey)}
      </span>
      {lifetimeChip}
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
                  if (action === 'unpublish' || action === 'mark-as-sold' || action === 'mark-as-rented') {
                    setConfirmingAction(action);
                  } else {
                    executeStatusUpdate(mutateAsync, listingId, action, tGlobal);
                  }
                }
              }}
              title={!enabled ? t('tooltips.notAvailable') : undefined}
              className={cn(
                'flex min-h-8 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold leading-none transition-colors',
                isDisabled && 'cursor-not-allowed opacity-50',
                !isDisabled &&
                (variant === 'primary'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-primary/20 bg-white text-primary hover:bg-primary/5')
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!confirmingAction} onOpenChange={(open) => !open && setConfirmingAction(null)}>
        <DialogContent
          showCloseButton
          className={cn(
            'gap-0 overflow-hidden rounded-2xl border border-primary/15 p-0 shadow-2xl shadow-black/10 ring-1 ring-primary/5',
            'sm:max-w-[440px]'
          )}
        >
          <div className='relative border-b border-primary/10 bg-primary/[0.06] px-6 pb-5 pt-6'>
            <div className='flex gap-4 pr-10'>
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  'bg-background/90 text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm'
                )}
              >
                {confirmingAction === 'mark-as-sold' ? (
                  <CheckCircle className='h-6 w-6' strokeWidth={2} />
                ) : confirmingAction === 'mark-as-rented' ? (
                  <Home className='h-6 w-6' strokeWidth={2} />
                ) : (
                  <EyeOff className='h-6 w-6' strokeWidth={2} />
                )}
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-left text-lg font-semibold leading-snug tracking-tight text-foreground'>
                  {confirmingAction === 'mark-as-sold'
                    ? t('confirm.markAsSold.title')
                    : confirmingAction === 'mark-as-rented'
                      ? t('confirm.markAsRented.title')
                      : t('confirm.unpublish.title')}
                </DialogTitle>
                <DialogDescription className='text-left text-sm font-normal leading-normal text-muted-foreground'>
                  {confirmingAction === 'mark-as-sold'
                    ? t('confirm.markAsSold.intro')
                    : confirmingAction === 'mark-as-rented'
                      ? t('confirm.markAsRented.intro')
                      : t('confirm.unpublish.description')}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className='space-y-3 px-6 py-5'>
            <div className='rounded-xl border border-primary/12 bg-primary/[0.07] px-4 py-3.5'>
              <p className='text-[11px] font-semibold uppercase tracking-wide text-primary/80'>
                {t('confirm.detailLabel')}
              </p>
              <p className='mt-1.5 text-sm font-medium leading-snug text-foreground'>
                {confirmDisplayLine}
              </p>
            </div>
            {confirmingAction === 'unpublish' && (
              <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5'>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-amber-600'>
                  {t('confirm.unpublish.noteLabel')}
                </p>
                <p className='mt-1.5 text-sm font-medium leading-snug text-amber-900'>
                  {t('confirm.unpublish.note')}
                </p>
              </div>
            )}
            {confirmingAction !== 'unpublish' && (
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {confirmingAction === 'mark-as-sold'
                  ? t('confirm.markAsSold.consequence')
                  : t('confirm.markAsRented.consequence')}
              </p>
            )}
          </div>

          <DialogFooter className='flex-col-reverse gap-2 border-t border-primary/10 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3'>
            <Button
              type='button'
              variant='outline'
              size='lg'
              className='w-full rounded-xl border-primary/20 sm:w-auto'
              onClick={() => setConfirmingAction(null)}
              disabled={isPending}
            >
              {t('confirm.cancel')}
            </Button>
            <Button
              type='button'
              size='lg'
              className='w-full rounded-xl shadow-sm sm:w-auto'
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? t('common.processing', { fallback: 'Processing...' }) : t('confirm.proceed')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
