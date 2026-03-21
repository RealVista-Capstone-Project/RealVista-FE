import * as React from 'react';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PropertyGallery } from '@/features/property-gallery';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { RentalFeatures } from '@/features/rental-features';
import { ListingMetricsCard } from '@/features/listing-analytics';
import { ListingStatusActions } from '@/features/listing-status';
import type { Property } from '@/entities/property';
import type { Listing } from '@/entities/listing';
import { mapListingToProperty } from '@/entities/listing/lib/listing-to-property.mapper';

interface ListingDetailPanelProps {
  listing: Listing;
}

export function ListingDetailPanel({ listing }: ListingDetailPanelProps) {
  const t = useTranslations('ListingDetailPanel');
  const property: Property = mapListingToProperty(listing);

  // Get dynamic attributes from listing
  const attributes = listing.attributes ?? [];

  return (
    <div className='min-h-full bg-white'>
      {/* Property Gallery - matches listing-detail-screen */}
      <div className='px-12 pt-8'>
        <PropertyGallery images={property.images} />
      </div>

      {/* Content */}
      <div className='px-12 py-8'>
        {/* Listing Analytics Metrics */}
        <div className='mb-8'>
          <ListingMetricsCard listingId={listing.listing_id} />
        </div>

        {/* Header with Title, Status Actions, and Calendar Button */}
        <div className='mb-6 flex flex-col gap-4'>
          <div className='flex items-start justify-between'>
            <div className='flex flex-col gap-2'>
              <h1 className='text-[32px] font-bold leading-[1.25] tracking-[-0.32px] text-main-black'>
                {property.title}
              </h1>
              <p className='text-base font-medium leading-[1.6] text-main-black/50'>
                {property.address || t('addressNotAvailable')}
              </p>
            </div>

            <button
              type='button'
              className='flex items-center gap-2 rounded-lg border border-purple-92 bg-white px-4 py-2.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-98'
            >
              <Calendar className='h-4 w-4' strokeWidth={2} />
              <span>{t('showCalendar')}</span>
            </button>
          </div>

          {/* Status Update Actions */}
          <ListingStatusActions
            listingId={listing.listing_id}
            status={listing.status}
            listingType={listing.listing_type}
          />
        </div>

        {/* Features Stats - Dynamic attributes from server */}
        <div className='mb-8 rounded-lg border border-purple-92 p-6'>
          {attributes.length > 0 ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6'>
              {attributes.map((attribute) => (
                <div key={attribute.attribute_id} className='flex flex-col gap-4'>
                  <p className='text-base font-medium leading-[1.5] text-grey-500'>
                    {attribute.attribute_name}
                  </p>
                  <div className='flex items-center gap-2'>
                    <AttributeIcon
                      iconName={attribute.icon}
                      className='size-6 text-main-black/50'
                      strokeWidth={2}
                    />
                    <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
                      {attribute.display_value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback when no attributes are available
            <div className='grid grid-cols-6 gap-6'>
              <FeatureStat label={t('features.properties')} value={t('features.notAvailable')} icon='🏠' />
              <FeatureStat label={t('features.rooms')} value={t('features.notAvailable')} icon='🛏️' />
              <FeatureStat
                label={t('features.livingSpace')}
                value={`${listing.property?.usable_size_m2 || 0} m²`}
                icon='📐'
              />
              <FeatureStat label={t('features.yearBuilt')} value={t('features.notAvailable')} icon='📅' />
              <FeatureStat label={t('features.tenants')} value='12' icon='👥' />
              <FeatureStat label={t('features.request')} value='12' icon='📄' />
            </div>
          )}
        </div>

        <div className='mb-8 h-px w-full bg-purple-92' />

        {/* Rental Features Section */}
        {property.amenities && property.amenities.length > 0 && (
          <div className='mb-8'>
            <RentalFeatures property={property} />
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-base font-medium leading-[1.5] text-grey-500'>{label}</p>
      <div className='flex items-center gap-2'>
        <span className='text-2xl opacity-50'>{icon}</span>
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
          {value}
        </p>
      </div>
    </div>
  );
}
