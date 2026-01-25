import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';
import RealVistaLogo from '@/shared/assets/logo/logo';

export interface RentalFeaturesProps {
  property: Property;
}

export interface FeatureItem {
  label: string;
  value: string;
  showLogo?: boolean;
  logoText?: string;
}

/**
 * RentalFeatures component displays property rental features
 * in a responsive layout with label-value pairs
 * - Mobile: single column with 20px title
 * - Desktop: two columns with 24px title
 */
export function RentalFeatures({ property }: RentalFeaturesProps) {
  const t = useTranslations('RentalFeatures');

  const allFeatures: FeatureItem[] = [
    {
      label: t('listedOn'),
      value: t('oneWeek'),
      showLogo: true,
      logoText: t('estatery'),
    },
    {
      label: t('dateAvailable'),
      value: t('availableNow'),
    },
    { label: t('type'), value: t('home') },
    { label: t('laundry'), value: t('inUnit') },
    { label: t('cooling'), value: t('airConditioner') },
    { label: t('heating'), value: t('forcedAir') },
    { label: t('city'), value: 'Miami' },
    { label: t('yearBuilt'), value: '2018' },
    { label: t('size'), value: '2,173 sqft' },
    { label: t('lotSize'), value: '9,060 sqft' },
    { label: t('parkingArea'), value: t('yes') },
    { label: t('depositAndFees'), value: '$2,700' },
  ];

  // Split features for desktop view (6 items each column)
  const leftColumnFeatures = allFeatures.slice(0, 6);
  const rightColumnFeatures = allFeatures.slice(6);

  return (
    <div className='flex flex-col gap-8'>
      {/* Title: 20px on mobile, 24px on desktop */}
      <h2 className='text-main-black text-[20px] sm:text-[24px] font-bold leading-[1.6] sm:leading-[1.5] tracking-[-0.1px] sm:tracking-[-0.24px]'>
        {t('title')}
      </h2>

      {/* Mobile: single column, Desktop: two columns */}
      <div className='flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-20'>
        {/* Mobile: all features in one column */}
        <div className='flex flex-col gap-5 sm:hidden'>
          {allFeatures.map((feature) => (
            <div key={feature.label} className='flex items-center justify-between'>
              <div className='flex gap-1'>
                <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                  {feature.label}
                </p>
                {feature.showLogo && feature.logoText && (
                  <div className='flex items-center gap-1'>
                    {/* Estatery Logo */}
                    <RealVistaLogo className='size-4' />
                    <span className='text-main-secondary text-[16px] font-bold leading-[1.5]'>
                      {feature.logoText}
                    </span>
                  </div>
                )}
              </div>
              <p className='text-main-black text-[16px] font-bold leading-[1.5] text-right'>
                {feature.value}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: left column */}
        <div className='hidden sm:flex sm:flex-col sm:gap-5'>
          {leftColumnFeatures.map((feature) => (
            <div key={feature.label} className='flex items-start gap-4'>
              <div className='flex gap-1'>
                <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                  {feature.label}
                </p>
                {feature.showLogo && feature.logoText && (
                  <div className='flex items-center gap-1'>
                    {/* Estatery Logo */}
                    <RealVistaLogo className='size-4' />
                    <span className='text-main-secondary text-[16px] font-bold leading-[1.5]'>
                      {feature.logoText}
                    </span>
                  </div>
                )}
              </div>
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-right ml-auto'>
                {feature.value}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: right column */}
        <div className='hidden sm:flex sm:flex-col sm:gap-5'>
          {rightColumnFeatures.map((feature) => (
            <div key={feature.label} className='flex items-center gap-4'>
              <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                {feature.label}
              </p>
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-right ml-auto'>
                {feature.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
