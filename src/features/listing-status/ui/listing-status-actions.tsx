'use client';

import * as React from 'react';
import { Send, Globe, EyeOff, CheckCircle, Home } from 'lucide-react';
import {
  useUpdateListingStatus,
  executeStatusUpdate,
  type ListingStatusAction,
} from '../api/use-update-listing-status';
import { LISTING_STATUS_CONFIG } from '@/screens/dashboard/managed-listings/types/managed-listing';
import { cn } from '@/shared/lib/utils';

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
 * - DRAFT: Submit for Review, Publish = enabled; Unpublish, Mark as Sold/Rented = disabled
 * - PENDING: Publish = enabled; others = disabled
 * - PUBLISHED: Unpublish, Mark as Sold/Rented = enabled; Submit, Publish = disabled
 * - SOLD/RENTED: All disabled (final state)
 */
function getAllActions(status: string, listingType: 'RENT' | 'SALE'): ActionConfig[] {
  const isDraft = status === 'DRAFT';
  const isPending = status === 'PENDING';
  const isPublished = status === 'PUBLISHED';

  return [
    {
      action: 'submit-for-review' as const,
      label: 'Submit for Review',
      icon: <Send className='h-4 w-4' strokeWidth={2} />,
      enabled: isDraft,
    },
    {
      action: 'publish' as const,
      label: 'Publish',
      icon: <Globe className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: isDraft || isPending,
    },
    {
      action: 'unpublish' as const,
      label: 'Unpublish',
      icon: <EyeOff className='h-4 w-4' strokeWidth={2} />,
      enabled: isPublished,
    },
    {
      action: 'mark-as-sold' as const,
      label: 'Mark as Sold',
      icon: <CheckCircle className='h-4 w-4' strokeWidth={2} />,
      variant: 'primary' as const,
      enabled: isPublished && listingType === 'SALE',
    },
    {
      action: 'mark-as-rented' as const,
      label: 'Mark as Rented',
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
  console.log(`status in ListingStatusActions is: ${JSON.stringify(status)}`);
  const { mutateAsync, isPending } = useUpdateListingStatus();
  const actions = getAllActions(status, listingType);
  const config =
    LISTING_STATUS_CONFIG[status as keyof typeof LISTING_STATUS_CONFIG] ??
    LISTING_STATUS_CONFIG.DRAFT;
  const hasAnyEnabledAction = actions.some((a) => a.enabled);
  const isFinalState = status === 'SOLD' || status === 'RENTED';

  // When SOLD/RENTED, show only the status badge (no action buttons)
  if (isFinalState || !hasAnyEnabledAction) {
    return (
      <div className='flex items-center gap-3'>
        <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', config.className)}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', config.className)}>
        {config.label}
      </span>
      <div className='flex flex-wrap gap-2'>
        {actions.map(({ action, label, icon, variant, enabled }) => {
          const isDisabled = !enabled || isPending;
          return (
            <button
              key={action}
              type='button'
              disabled={isDisabled}
              onClick={() =>
                enabled && !isPending && executeStatusUpdate(mutateAsync, listingId, action)
              }
              title={!enabled ? 'Not available for current status' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isDisabled && 'cursor-not-allowed opacity-50',
                !isDisabled &&
                  (variant === 'primary'
                    ? 'bg-main-primary text-white hover:bg-main-primary/90'
                    : 'border border-purple-92 bg-white text-main-black hover:bg-purple-98')
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
