'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Listing } from '@/entities/listing/model/types';
import { formatVND } from '@/shared/lib/utils';
import {
  formatAttributeCell,
  formatPublishedAt,
  listingFullAddress,
  listingPrimaryImageUrl,
  mergeAttributeRows,
} from '../lib/compare-listing-format';

const PLACEHOLDER = 'https://placehold.co/400x240/e2e8f0/64748b?text=No+Image';

const tableBorder = 'border-b border-neutral-200';

interface CompareListingsTableProps {
  left: Listing;
  right: Listing;
  locale: string;
  onOpenListing: (listing: Listing) => void;
}

export function CompareListingsTable({
  left,
  right,
  locale,
  onOpenListing,
}: CompareListingsTableProps) {
  const t = useTranslations('Compare');
  const attrRows = mergeAttributeRows(left, right);

  const Row = ({
    label,
    a,
    b,
    valClass = '',
  }: {
    label: string;
    a: React.ReactNode;
    b: React.ReactNode;
    valClass?: string;
  }) => (
    <tr className={tableBorder}>
      <th
        scope='row'
        className='w-[min(28%,200px)] shrink-0 bg-neutral-50/80 py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:py-3.5 sm:text-sm sm:normal-case sm:tracking-normal'
      >
        {label}
      </th>
      <td className={`py-3 pl-3 pr-4 align-top text-foreground sm:py-3.5 ${valClass}`}>{a}</td>
      <td className={`py-3 pl-3 pr-4 align-top text-foreground sm:py-3.5 ${valClass}`}>{b}</td>
    </tr>
  );

  const listingTypeLabel = (type: string) =>
    type === 'SALE' ? t('listingTypeSale') : type === 'RENT' ? t('listingTypeRent') : type || '—';

  const openBtn = (listing: Listing) => (
    <button
      type='button'
      onClick={() => onOpenListing(listing)}
      className='mt-2 border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline'
    >
      {t('viewDetail')}
    </button>
  );

  return (
    <div className='overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm'>
      <table className='w-full min-w-[640px] border-collapse text-sm'>
        <tbody>
          <tr className={tableBorder}>
            <th
              scope='col'
              className='bg-neutral-50/80 py-3 pl-4 pr-3 text-left text-xs font-semibold text-muted-foreground sm:text-sm'
            />
            <td className='py-4 pl-3 pr-4 align-top'>
              <div className='relative mx-auto aspect-[5/3] w-full max-w-[240px] overflow-hidden rounded-md bg-neutral-100'>
                <Image
                  src={listingPrimaryImageUrl(left) || PLACEHOLDER}
                  alt=''
                  fill
                  className='object-cover'
                  sizes='240px'
                  unoptimized={!listingPrimaryImageUrl(left)}
                />
              </div>
              {openBtn(left)}
            </td>
            <td className='py-4 pl-3 pr-4 align-top'>
              <div className='relative mx-auto aspect-[5/3] w-full max-w-[240px] overflow-hidden rounded-md bg-neutral-100'>
                <Image
                  src={listingPrimaryImageUrl(right) || PLACEHOLDER}
                  alt=''
                  fill
                  className='object-cover'
                  sizes='240px'
                  unoptimized={!listingPrimaryImageUrl(right)}
                />
              </div>
              {openBtn(right)}
            </td>
          </tr>

          <Row
            label={t('rowTitle')}
            a={<span className='font-semibold text-foreground'>{left.name}</span>}
            b={<span className='font-semibold text-foreground'>{right.name}</span>}
          />
          <Row
            label={t('rowAddress')}
            a={listingFullAddress(left)}
            b={listingFullAddress(right)}
          />
          <Row
            label={t('rowPrice')}
            a={<span className='font-semibold tabular-nums'>{formatVND(left.price)}</span>}
            b={<span className='font-semibold tabular-nums'>{formatVND(right.price)}</span>}
          />
          <Row
            label={t('rowListingType')}
            a={listingTypeLabel(left.listing_type)}
            b={listingTypeLabel(right.listing_type)}
          />
          <Row
            label={t('rowPropertyType')}
            a={left.property_type?.property_type_name ?? '—'}
            b={right.property_type?.property_type_name ?? '—'}
          />
          <Row
            label={t('rowUsableArea')}
            a={
              left.property?.usable_size_m2 != null
                ? `${left.property.usable_size_m2} m²`
                : '—'
            }
            b={
              right.property?.usable_size_m2 != null
                ? `${right.property.usable_size_m2} m²`
                : '—'
            }
          />
          <Row
            label={t('rowLandSize')}
            a={
              left.property?.land_size_m2 != null ? `${left.property.land_size_m2} m²` : '—'
            }
            b={
              right.property?.land_size_m2 != null ? `${right.property.land_size_m2} m²` : '—'
            }
          />
          <Row
            label={t('rowStatus')}
            a={left.status ?? '—'}
            b={right.status ?? '—'}
          />
          <Row
            label={t('rowNegotiable')}
            a={left.is_negotiable ? t('yes') : t('no')}
            b={right.is_negotiable ? t('yes') : t('no')}
          />
          <Row
            label={t('rowPublished')}
            a={formatPublishedAt(left.published_at, locale)}
            b={formatPublishedAt(right.published_at, locale)}
          />

          {attrRows.map(({ code, label }) => {
            const la = left.attributes?.find((x) => x.attribute_code === code);
            const ra = right.attributes?.find((x) => x.attribute_code === code);
            return (
              <Row key={code} label={label} a={formatAttributeCell(la)} b={formatAttributeCell(ra)} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
