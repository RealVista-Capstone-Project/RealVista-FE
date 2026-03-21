import * as React from 'react';
import Image from 'next/image';
import { Calendar, Mail, Phone, Building2, BadgeCheck } from 'lucide-react';
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
  console.log(`Listing user: ${listing.user_id}`);

  // Get dynamic attributes from listing
  const attributes = listing.attributes ?? [];

  // Check if listing is created by someone other than the property owner
  const showAgentInfo = listing.is_created_by_owner === false && listing.agent;

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

        {/* Agent Information Card - Show when listing is created by agent (not property owner) */}
        {showAgentInfo && (
          <div className='mb-8 overflow-hidden rounded-xl border border-purple-92 bg-gradient-to-br from-purple-98 to-white shadow-sm'>
            <div className='p-6'>
              {/* Header */}
              <div className='mb-4 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-main-primary/10'>
                  <Building2 className='h-4 w-4 text-main-primary' strokeWidth={2} />
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-main-black'>{t('agent.title')}</h3>
                  <p className='text-xs text-main-secondary/60'>{t('agent.subtitle')}</p>
                </div>
              </div>

              {/* Agent Card */}
              <div className='flex items-start gap-4 rounded-lg border border-purple-92 bg-white p-4'>
                {/* Avatar */}
                <div className='relative shrink-0'>
                  {listing.agent.avatar_url ? (
                    <Image
                      src={listing.agent.avatar_url}
                      alt={listing.agent.full_name}
                      width={56}
                      height={56}
                      className='h-14 w-14 rounded-full object-cover'
                    />
                  ) : (
                    <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-main-primary to-purple-600'>
                      <span className='text-lg font-bold text-white'>
                        {listing.agent.first_name?.[0]}
                        {listing.agent.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  {listing.agent.is_verified && (
                    <div className='absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white'>
                      <BadgeCheck className='h-4 w-4 fill-blue-500 text-white' strokeWidth={2} />
                    </div>
                  )}
                </div>

                {/* Agent Details */}
                <div className='flex-1 space-y-3'>
                  {/* Name and verification */}
                  <div>
                    <h4 className='text-lg font-bold text-main-black'>
                      {listing.agent.business_name || listing.agent.full_name}
                    </h4>
                    {listing.agent.business_name && listing.agent.full_name && (
                      <p className='text-sm text-main-secondary/70'>{listing.agent.full_name}</p>
                    )}
                    {listing.agent.is_verified && (
                      <div className='mt-1 flex items-center gap-1.5'>
                        <BadgeCheck className='h-3.5 w-3.5 text-blue-500' strokeWidth={2} />
                        <span className='text-xs font-medium text-blue-600'>
                          {t('agent.verified')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    {listing.agent.phone && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2'>
                        <Phone className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.phone')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    {listing.agent.email && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2'>
                        <Mail className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.email')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {listing.agent.company && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2 sm:col-span-2'>
                        <Building2 className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.company')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.company}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Button */}
                  <button
                    type='button'
                    className='w-full rounded-lg bg-main-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-main-primary/90 hover:shadow-md'
                  >
                    {t('agent.contact')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <FeatureStat
                label={t('features.properties')}
                value={t('features.notAvailable')}
                icon='🏠'
              />
              <FeatureStat
                label={t('features.rooms')}
                value={t('features.notAvailable')}
                icon='🛏️'
              />
              <FeatureStat
                label={t('features.livingSpace')}
                value={`${listing.property?.usable_size_m2 || 0} m²`}
                icon='📐'
              />
              <FeatureStat
                label={t('features.yearBuilt')}
                value={t('features.notAvailable')}
                icon='📅'
              />
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
