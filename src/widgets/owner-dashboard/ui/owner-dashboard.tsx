'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { HeroPanel } from './hero-panel';
import { ListingBoard } from './listing-board';
import { OwnerContactInsightsCard } from './owner-contact-insights-card';
import { OwnerContractsListCard } from './owner-contracts-list-card';
import { OwnerConversationsCard } from './owner-conversations-card';
import { OwnerDailyViewsChart } from './owner-daily-views-chart';
import { OwnerPurchasedPackagesCard } from './owner-purchased-packages-card';

import { useAuthSession } from '@/features/auth/model';
import { cn } from '@/shared/lib/utils';

/** Main detail column content cap; actual width = min(this, available flex space). */
const OWNER_DASHBOARD_DETAIL_MAX_WIDTH_PX = 1180;
/** Fixed listing rail width on lg; exposed as --owner-listing-rail on the dashboard root. */
const OWNER_DASHBOARD_LISTING_RAIL_PX = 380;

const LG_MEDIA = '(min-width: 1024px)';

function useListingRailMaxHeight() {
  const leftStackRef = useRef<HTMLDivElement>(null);
  const [isLg, setIsLg] = useState(false);
  const [leftHeightPx, setLeftHeightPx] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(LG_MEDIA);
    const onChange = () => setIsLg(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isLg) {
      setLeftHeightPx(null);
      return;
    }
    const el = leftStackRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setLeftHeightPx(h > 0 ? Math.ceil(h) : null);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLg]);

  return { leftStackRef, listingMaxHeightPx: isLg ? leftHeightPx : null };
}

export function OwnerDashboard() {
  const { data: session } = useAuthSession();
  const { leftStackRef, listingMaxHeightPx } = useListingRailMaxHeight();

  const isOwner =
    session?.user?.role === 'owner' || (session?.user?.backendRoles ?? []).includes('OWNER');

  if (!isOwner) {
    return (
      <div className='flex h-full min-h-[50vh] items-center justify-center p-5 text-muted-foreground'>
        current not working
      </div>
    );
  }

  return (
    <div
      className='flex w-full flex-col gap-5 bg-[#e8f2fb] pb-12 pl-5 pr-5 pt-5 dark:bg-background lg:gap-5 lg:pb-0 lg:pr-0 lg:pt-5'
      style={
        {
          // Mirrors max-w and rail width for reference in DevTools; gap on row is gap-6 (24px).
          ['--owner-detail-max' as string]: `${OWNER_DASHBOARD_DETAIL_MAX_WIDTH_PX}px`,
          ['--owner-listing-rail' as string]: `${OWNER_DASHBOARD_LISTING_RAIL_PX}px`,
        } as CSSProperties
      }
    >
      {/*
        lg: listing rail max-height tracks left column (ResizeObserver). List scrolls inside the card.
        items-start so the rail does not stretch with long listing content.
      */}
      <div className='flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-6'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div
            ref={leftStackRef}
            className='flex w-full flex-col gap-6 overflow-x-hidden pb-10 lg:gap-7 lg:pb-6'
            style={{ maxWidth: OWNER_DASHBOARD_DETAIL_MAX_WIDTH_PX }}
          >
            <div className='shrink-0'>
              <HeroPanel />
            </div>
            <div className='grid shrink-0 grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch md:gap-5 [&>*]:min-h-0'>
              <OwnerDailyViewsChart />
              <OwnerContactInsightsCard />
            </div>
            <div className='grid shrink-0 grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch md:gap-5 [&>*]:min-h-0'>
              <OwnerConversationsCard />
              <OwnerPurchasedPackagesCard />
            </div>
            <div className='flex min-w-0 flex-col'>
              <OwnerContractsListCard />
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex w-full min-w-0 flex-col pb-10 lg:min-h-0 lg:min-w-[280px] lg:max-w-[var(--owner-listing-rail)] lg:w-[var(--owner-listing-rail)] lg:flex-shrink-0 lg:pb-6 lg:self-start',
            listingMaxHeightPx != null && 'lg:overflow-hidden',
          )}
          style={
            listingMaxHeightPx != null
              ? ({ maxHeight: listingMaxHeightPx } as CSSProperties)
              : undefined
          }
        >
          <ListingBoard capHeightToParent={listingMaxHeightPx != null} />
        </div>
      </div>
    </div>
  );
}
