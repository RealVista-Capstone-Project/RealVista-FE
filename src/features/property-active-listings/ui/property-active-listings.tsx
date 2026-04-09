import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { ListingSummaryDTO } from '@/entities/property/api/property-api.types';
import { Badge } from '@/shared/ui/badge';
import { ExternalLink, User } from 'lucide-react';

interface PropertyActiveListingsProps {
  listings: ListingSummaryDTO[];
  locale: string;
}

export const PropertyActiveListings: React.FC<PropertyActiveListingsProps> = ({ listings, locale }) => {
  const t = useTranslations('PropertyDetail');

  if (!listings || listings.length === 0) {
    return (
      <div className='bg-grey-50 rounded-xl p-8 text-center border border-dashed border-grey-300'>
        <p className='text-grey-500'>{t('noActiveListings') || 'No active listings for this property yet.'}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-xl font-bold'>{t('marketActivity') || 'Market Activity'}</h3>
        <Badge variant='outline' className='text-purple-600 border-purple-200 bg-purple-50'>
          {listings.length} {t('activeListingsCount') || 'Active Listings'}
        </Badge>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {listings.map((listing) => (
          <div
            key={listing.listing_id}
            className='flex items-start sm:items-center gap-4 p-4 bg-white border border-grey-100 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all group'
          >
            {/* Thumbnail */}
            <div className='relative size-20 sm:size-24 rounded-lg overflow-hidden shrink-0 bg-grey-100'>
              <Image
                src={listing.thumbnail_url || '/images/property-placeholder.jpg'}
                alt={listing.name}
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-300'
              />
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <Badge variant={listing.listing_type === 'SALE' ? 'default' : 'secondary'}>
                  {listing.listing_type}
                </Badge>
              </div>
              <h4 className='font-semibold text-grey-900 truncate mb-1' title={listing.name}>
                {listing.name}
              </h4>
              <div className='flex items-center gap-4 text-sm text-grey-500'>
                <span className='font-bold text-main-primary'>
                  {formatVND(listing.price)}
                  {listing.listing_type === 'RENT' && <span className='font-normal'> / month</span>}
                </span>
                {listing.agent_name && (
                  <div className='flex items-center gap-1'>
                    <User className='size-3' />
                    <span className='truncate'>{listing.agent_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <Link
              href={`/${locale}/listing/${listing.slug}`}
              target='_blank'
              className='shrink-0'
            >
              <RealVistaButton variant='secondary' size='small' className='flex items-center gap-2'>
                <span className='hidden sm:inline'>{t('viewListing') || 'View'}</span>
                <ExternalLink className='size-4' />
              </RealVistaButton>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
