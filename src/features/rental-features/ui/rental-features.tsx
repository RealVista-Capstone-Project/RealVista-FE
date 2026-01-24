import type { Property } from '@/entities/property';

export interface RentalFeaturesProps {
  property: Property;
}

export interface FeatureItem {
  label: string;
  value: string;
  showLogo?: boolean;
}

/**
 * RentalFeatures component displays property rental features
 * in a single-column layout with label-value pairs
 */
export function RentalFeatures({ property }: RentalFeaturesProps) {
  const features: FeatureItem[] = [
    { label: 'Listed on', value: 'Estatery', showLogo: true },
    { label: 'Date available', value: 'Available now' },
    { label: 'Type', value: 'Home' },
    { label: 'Laundry', value: 'In unit' },
    { label: 'Cooling', value: 'Air Conditioner' },
    { label: 'Heating', value: 'Forced Air' },
    { label: 'City', value: 'Houston' },
    { label: 'Year Built', value: '2018' },
    { label: 'Size', value: '2,173 sqft' },
    { label: 'Lot Size', value: '9,060 sqft' },
    { label: 'Parking Area', value: 'Yes' },
    { label: 'Deposit & Fees', value: '$2,700' },
  ];

  return (
    <div className='flex flex-col gap-8'>
      <h2 className='text-main-black text-[20px] font-bold leading-[1.6] tracking-[-0.1px]'>
        Rental features
      </h2>
      <div className='flex flex-col gap-5'>
        {features.map((feature) => (
          <div
            key={feature.label}
            className='flex items-center justify-between gap-4'
          >
            <div className='flex items-center gap-4'>
              <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                {feature.label}
              </p>
              {feature.showLogo && (
                <div className='flex items-center gap-1'>
                  {/* Estatery Logo */}
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <rect
                      width='16'
                      height='16'
                      rx='4'
                      fill='#7065F0'
                    />
                    <path
                      d='M4 8H12M8 4V12'
                      stroke='white'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                  </svg>
                  <span className='text-main-secondary text-[16px] font-bold leading-[1.5]'>
                    {feature.value}
                  </span>
                </div>
              )}
            </div>
            {!feature.showLogo && (
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-right'>
                {feature.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
