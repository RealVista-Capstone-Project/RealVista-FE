import * as React from 'react';
import Image from 'next/image';
import { Calendar, MessageCircle, ChevronRight } from 'lucide-react';
import type { ListingDetail } from '../../types/listing-detail';

interface ListingDetailPanelProps {
  listing: ListingDetail;
}

export function ListingDetailPanel({ listing }: ListingDetailPanelProps) {
  const primaryImage = listing.media?.find((m) => m.is_primary) || listing.media?.[0];
  const bedrooms =
    listing.attributes?.find((a) => a.name?.toLowerCase() === 'bedrooms')?.value || '0';

  return (
    <div className='min-h-full bg-white'>
      {/* Hero Image */}
      <div className='relative h-[251px] w-full'>
        {primaryImage?.url ? (
          <Image src={primaryImage.url} alt={listing.name} fill className='object-cover' priority />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-purple-98'>
            <span className='text-main-secondary/60'>No image available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='px-12 py-8'>
        {/* Header */}
        <div className='mb-6 flex items-start justify-between'>
          <div className='space-y-2'>
            <h1 className='text-[32px] font-bold leading-tight tracking-[-0.32px] text-main-black'>
              {listing.name}
            </h1>
            <p className='text-base font-medium leading-relaxed text-main-black/50'>
              {listing.location?.address || 'Address not available'}
            </p>
          </div>

          <button
            type='button'
            className='flex items-center gap-2 rounded-lg border border-purple-92 bg-white px-4 py-2.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-98'
          >
            <Calendar className='h-4 w-4' strokeWidth={2} />
            <span>Show Property Calendar</span>
          </button>
        </div>

        {/* Features Stats */}
        <div className='mb-8 rounded-lg border border-purple-92 p-6'>
          <div className='grid grid-cols-6 gap-6'>
            <FeatureStat
              label='Properties'
              value={listing.property?.floors?.toString() || '46'}
              icon='🏠'
            />
            <FeatureStat label='Rooms' value={bedrooms} icon='🛏️' />
            <FeatureStat
              label='Living Space'
              value={`${listing.property?.total_area || 0} m²`}
              icon='📐'
            />
            <FeatureStat
              label='Year Built'
              value={listing.property?.year_built?.toString() || 'N/A'}
              icon='📅'
            />
            <FeatureStat label='Tenants' value='12' icon='👥' />
            <FeatureStat label='Request' value='12' icon='📄' />
          </div>
        </div>

        <div className='grid grid-cols-[1fr_299px] gap-12'>
          {/* Left Column */}
          <div className='space-y-8'>
            {/* Available Rooms */}
            <div>
              <h2 className='mb-6 text-xl font-bold leading-relaxed tracking-[-0.1px] text-main-black'>
                Available rooms
              </h2>
              <div className='space-y-4'>
                <p className='text-base font-normal leading-normal text-main-black/70'>
                  Total rooms available
                </p>
                <div className='relative h-6 w-full overflow-hidden rounded border border-purple-92 bg-purple-98'>
                  <div className='absolute inset-y-0 left-0 w-[50%] rounded bg-main-primary' />
                </div>
                <div className='flex items-center justify-between'>
                  <p className='text-base font-medium leading-normal text-main-secondary'>
                    2 rooms available of 4 rooms
                  </p>
                  <p className='text-base font-medium leading-normal text-main-secondary'>50%</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className='mb-6 text-xl font-bold leading-relaxed tracking-[-0.1px] text-main-black'>
                Description
              </h2>
              <p className='text-base font-normal leading-relaxed text-main-black/70'>
                {listing.property?.description ||
                  'Check out that Custom Backyard Entertaining space! 3237sqft, 4 Bedrooms, 2 Bathrooms house on a Lake Villa street in the Palm Harbor neighborhood of Texas.'}
              </p>
              <button
                type='button'
                className='mt-4 text-sm font-bold leading-snug text-main-primary underline'
              >
                Show more
              </button>
            </div>

            {/* Equipment */}
            <div>
              <h2 className='mb-6 text-xl font-bold leading-relaxed tracking-[-0.1px] text-main-black'>
                Equipment
              </h2>
              <div className='flex flex-wrap gap-4'>
                {listing.amenities && listing.amenities.length > 0 ? (
                  listing.amenities.map((amenity) => (
                    <div key={amenity.amenity_id} className='rounded-lg bg-purple-98 px-4 py-2'>
                      <span className='text-base font-medium leading-normal text-main-primary'>
                        {amenity.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <AmenityTag label='Fitted Kitchen' />
                    <AmenityTag label='Garden' />
                    <AmenityTag label='Stepless Access' />
                    <AmenityTag label='Suitable for flat sharing' />
                    <AmenityTag label='Guest Toilet' />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            {/* Tenant Card */}
            <div className='overflow-hidden rounded-lg bg-main-secondary'>
              <div className='p-6'>
                {/* Tenant Profile */}
                <div className='mb-6 flex items-start gap-4'>
                  <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20'>
                    {listing.agent?.avatar_url ? (
                      <Image
                        src={listing.agent.avatar_url}
                        alt={listing.agent?.full_name || 'Agent'}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-sm font-bold text-white'>
                        {listing.agent?.full_name?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className='text-base font-bold leading-normal text-white'>
                      {listing.agent?.full_name || 'Agent'}
                    </h3>
                    <p className='text-sm font-medium leading-snug text-white/70'>Tenants</p>
                  </div>
                </div>

                {/* Divider */}
                <div className='mb-6 h-px w-full bg-white/20' />

                {/* Tenant Info */}
                <div className='mb-6 space-y-4 text-sm leading-snug text-white'>
                  <div className='flex items-center justify-between'>
                    <span className='text-white/70'>Move-in Date</span>
                    <span className='font-bold'>Dec 1, 2021</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-white/70'>Contact</span>
                    <span className='font-bold'>{listing.agent?.phone || '(+1) 324-5329'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-white/70'>Price per month</span>
                    <span className='font-bold'>${listing.price?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                {/* Send Message Button */}
                <button
                  type='button'
                  className='flex w-full items-center justify-center gap-2 rounded-lg bg-main-primary px-6 py-3 text-base font-bold leading-normal text-white transition-colors hover:bg-main-primary/90'
                >
                  <MessageCircle className='h-5 w-5' strokeWidth={2} />
                  <span>Send message</span>
                </button>
              </div>
            </div>

            {/* Rents Collected Card */}
            <div className='overflow-hidden rounded-lg border border-purple-92 bg-white'>
              <div className='p-8'>
                <p className='mb-2 text-lg font-medium leading-snug tracking-[-0.09px] text-main-black'>
                  Rents collected this month:
                </p>
                <p className='mb-4 text-2xl font-bold leading-normal tracking-[-0.24px] text-main-secondary'>
                  83%
                </p>
                <div className='flex items-center justify-between text-base font-medium leading-normal text-main-primary'>
                  <span>60 tenants</span>
                  <ChevronRight className='h-6 w-6' strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className='space-y-4'>
      <p className='text-base font-medium leading-normal text-main-secondary/60'>{label}</p>
      <div className='flex items-center gap-2'>
        <span className='text-2xl opacity-50'>{icon}</span>
        <p className='text-lg font-bold leading-snug tracking-[-0.09px] text-main-black'>{value}</p>
      </div>
    </div>
  );
}

function AmenityTag({ label }: { label: string }) {
  return (
    <div className='rounded-lg bg-purple-98 px-4 py-2'>
      <span className='text-base font-medium leading-normal text-main-primary'>{label}</span>
    </div>
  );
}
