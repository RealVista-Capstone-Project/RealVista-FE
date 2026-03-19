import * as React from 'react';
import { Calendar } from 'lucide-react';
import { PropertyGallery } from '@/features/property-gallery';
import type { PropertyImage } from '@/entities/property';
import type { Listing } from '@/entities/listing';

interface ListingDetailPanelProps {
  listing: Listing;
}

export function ListingDetailPanel({ listing }: ListingDetailPanelProps) {
  const bedrooms =
    listing.attributes?.find((a) => a.attribute_name?.toLowerCase() === 'bedrooms')?.display_value || '0';

  // Map MediaItem to PropertyImage format for PropertyGallery component
  const images: PropertyImage[] = React.useMemo(() => {
    if (!listing.media || listing.media.length === 0) return [];

    return listing.media
      .sort((a, b) => a.display_order - b.display_order)
      .map((media) => ({
        id: media.media_id,
        url: media.media_url,
        alt: listing.name,
        type: media.media_type === 'IMAGE'
          ? 'photo'
          : media.media_type === 'VIDEO'
          ? 'video'
          : '3d-tour',
        isPrimary: media.is_primary,
      }));
  }, [listing.media, listing.name]);

  return (
    <div className='min-h-full bg-white'>
      {/* Property Gallery - matches listing-detail-screen */}
      <div className='px-12 pt-8'>
        <PropertyGallery images={images} />
      </div>

      {/* Content */}
      <div className='px-12 py-8'>
        {/* Header with Title and Calendar Button */}
        <div className='mb-6 flex items-start justify-between'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-[32px] font-bold leading-[1.25] tracking-[-0.32px] text-main-black'>
              {listing.name}
            </h1>
            <p className='text-base font-medium leading-[1.6] text-main-black/50'>
              {listing.property?.street_address || 'Address not available'}
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

        {/* Features Stats - Aligned with Figma design */}
        <div className='mb-8 rounded-lg border border-purple-92 p-6'>
          <div className='grid grid-cols-6 gap-6'>
            <FeatureStat
              label='Properties'
              value='46'
              icon='🏠'
            />
            <FeatureStat label='Rooms' value={bedrooms} icon='🛏️' />
            <FeatureStat
              label='Living Space'
              value={`${listing.property?.usable_size_m2 || 0} m²`}
              icon='📐'
            />
            <FeatureStat
              label='Year Built'
              value='N/A'
              icon='📅'
            />
            <FeatureStat label='Tenants' value='12' icon='👥' />
            <FeatureStat label='Request' value='12' icon='📄' />
          </div>
        </div>

        {/* Total Applicants Section */}
        <div className='mb-6 flex flex-col gap-3'>
          <p className='text-sm font-medium leading-[1.4] text-main-black'>Total Applicants</p>
          <div className='flex items-center gap-2'>
            <p className='text-[32px] font-bold leading-[1.25] tracking-[-0.32px] text-main-black'>
              394
            </p>
            <div className='flex items-center rounded-xl bg-[rgba(111,207,151,0.1)] px-2.5 py-1.5'>
              <p className='text-sm font-bold leading-[1.4] text-[#27ae60]'>
                +7.1% <span className='font-normal'>from last month</span>
              </p>
            </div>
          </div>
        </div>

        <div className='mb-8 h-px w-full bg-purple-92' />

        {/* Applications Table */}
        <div className='flex flex-col gap-6'>
          <h2 className='text-xl font-bold leading-[1.6] tracking-[-0.1px] text-main-black'>
            Applications
          </h2>

          {/* Table Content - Placeholder for now */}
          <div className='rounded-lg border border-purple-92 p-6'>
            <p className='text-center text-main-black/50'>Application list will be displayed here</p>
          </div>
        </div>
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
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>{value}</p>
      </div>
    </div>
  );
}
