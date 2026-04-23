'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { listingQueries } from '@/entities/listing';
import type { Listing } from '@/entities/listing/model/types';
import { ROUTES } from '@/shared/config/routes';
import { CompareListingsTable } from './compare-listings-table';

/** UUID chuẩn dạng 8-4-4-4-12 — không khóa version/variant (regex cũ loại bỏ nhiều UUID hợp lệ từ DB). */
const LISTING_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseComparePair(raw: string | null): [string, string] | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length !== 2 || parts[0] === parts[1]) return null;
  if (!LISTING_ID_RE.test(parts[0]) || !LISTING_ID_RE.test(parts[1])) return null;
  return [parts[0].toLowerCase(), parts[1].toLowerCase()];
}

export function CompareListingsPage() {
  const t = useTranslations('Compare');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const idsParam = searchParams.get('ids');
  const pair = useMemo(() => parseComparePair(idsParam), [idsParam]);

  const results = useQueries({
    queries: (pair ?? []).map((id) => listingQueries.detail(id, false)),
  });

  if (!pair) {
    return (
      <div className='min-h-screen bg-white px-6 py-10'>
        <div className='mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm'>
          <p className='text-muted-foreground'>{t('invalid')}</p>
          <Link
            href={`/${locale}${ROUTES.favorited}`}
            className='mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90'
          >
            {t('backToFavorites')}
          </Link>
        </div>
      </div>
    );
  }

  const loading = results.some((r) => r.isLoading);
  const hasError = results.some((r) => r.isError);
  const listings = results.map((r) => r.data?.payload?.data).filter(Boolean) as Listing[];

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        <span className='sr-only'>{t('loading')}</span>
      </div>
    );
  }

  if (hasError || listings.length !== 2) {
    return (
      <div className='min-h-screen bg-white px-6 py-10'>
        <div className='mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm'>
          <p className='text-muted-foreground'>{t('error')}</p>
          <Link
            href={`/${locale}${ROUTES.favorited}`}
            className='mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90'
          >
            {t('backToFavorites')}
          </Link>
        </div>
      </div>
    );
  }

  const [left, right] = listings;

  return (
    <div className='min-h-screen bg-white'>
      <section className='mx-auto max-w-7xl px-6 py-8'>
        <button
          type='button'
          onClick={() => router.push(`/${locale}${ROUTES.favorited}`)}
          className='mb-6 flex items-center gap-2 border-0 bg-transparent p-0 text-sm font-medium text-primary shadow-none hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-sm'
        >
          <ArrowLeft className='h-4 w-4 shrink-0' />
          {t('backToFavorites')}
        </button>
        <h1 className='mb-8 text-2xl font-bold text-foreground'>{t('title')}</h1>
        <CompareListingsTable
          left={left}
          right={right}
          locale={locale}
          onOpenListing={(listing) =>
            router.push(`/${locale}/listing/${listing.slug || listing.listing_id}`)
          }
        />
      </section>
    </div>
  );
}
