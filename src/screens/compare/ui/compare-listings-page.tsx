'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { listingQueries } from '@/entities/listing';
import type { ListingCompareData } from '@/entities/listing/model/types';
import { ROUTES } from '@/shared/config/routes';
import { CompareListingsTable } from './compare-listings-table';

const LISTING_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCompareIds(raw: string | null): string[] | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((id) => LISTING_ID_RE.test(id))
    .map((id) => id.toLowerCase());
  if (parts.length === 0) return null;
  // Remove duplicates
  return [...new Set(parts)].slice(0, 3);
}

export function CompareListingsPage() {
  const t = useTranslations('Compare');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const idsParam = searchParams.get('ids');
  const ids = useMemo(() => parseCompareIds(idsParam), [idsParam]);

  const { data, isLoading, isError } = useQuery(
    listingQueries.compare(ids ?? [])
  );

  const listings = useMemo(() => {
    if (!data) return [];
    return data as ListingCompareData[];
  }, [data]);

  if (!ids || ids.length === 0) {
    return (
      <div className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-muted-foreground">{t('invalid')}</p>
          <Link
            href={`/${locale}${ROUTES.favorited}`}
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t('backToFavorites')}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (isError || listings.length === 0) {
    return (
      <div className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-muted-foreground">{t('error')}</p>
          <Link
            href={`/${locale}${ROUTES.favorited}`}
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t('backToFavorites')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center">
          <button
            type="button"
            onClick={() => router.push(`/${locale}${ROUTES.favorited}`)}
            className="flex items-center gap-2 border-0 bg-transparent p-0 text-sm font-medium text-primary shadow-none hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-sm"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {t('backToFavorites')}
          </button>
        </div>
        <h1 className="mb-8 text-2xl font-bold text-foreground">{t('title')}</h1>
        <CompareListingsTable
          listings={listings}
          locale={locale}
          onOpenListing={(listing) =>
            router.push(`/${locale}/listing/${listing.slug || listing.listing_id}`)
          }
        />
      </section>
    </div>
  );
}
