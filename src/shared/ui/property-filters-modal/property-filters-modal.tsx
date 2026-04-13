'use client';

import { useState, useMemo } from 'react';
import { Minus, Plus, Home, Building2, Factory, Map as MapIcon, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/ui/sheet';
import {
  PROPERTY_TYPES,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_TYPES,
  PropertyAttribute,
  FLAT_PROPERTY_TYPES
} from '@/shared/config/property-types';
import { Switch } from '@/shared/ui/switch/switch';

export type RentalPeriod = 'any' | '1-12' | '13-24' | '24+';

export interface PropertyFilters {
  priceRange: {
    min: number;
    max: number;
  };
  rentalPeriod: RentalPeriod;
  attributes: Record<string, number | boolean | string | undefined>;
}

export interface PropertyFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  propertyType?: string;
  listingType?: 'RENT' | 'SALE';
  onApply: (filters: PropertyFilters, newPropertyType?: string) => void;
  onReset: () => void;
  translations: {
    title: string;
    category: string;
    priceRange: string;
    features: string;
    rentalPeriod: {
      label: string;
      any: string;
      '1-12': string;
      '13-24': string;
      '24+': string;
    };
    reset: string;
    apply: string;
  };
}

const CATEGORY_ICONS: Record<string, any> = {
  RESIDENTIAL: Home,
  COMMERCIAL: Building2,
  INDUSTRIAL: Factory,
  LAND: MapIcon,
};

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className='flex items-center justify-between py-4 border-b border-purple-92 last:border-0'>
      <span className='text-base font-medium text-main-black'>{label}</span>
      <div className='flex items-center gap-4'>
        <button
          type='button'
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border border-purple-92 transition-all',
            value <= min
              ? 'bg-transparent text-grey-300 cursor-not-allowed border-grey-200'
              : 'bg-white text-main-black hover:border-main-primary hover:text-main-primary cursor-pointer'
          )}
        >
          <Minus className='h-4 w-4' strokeWidth={2.5} />
        </button>
        <span className='min-w-[60px] text-center text-base font-bold text-main-black'>
            {value === 0 ? 'Tất cả' : `${value}+`}
        </span>
        <button
          type='button'
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border border-purple-92 transition-all',
            value >= max
              ? 'bg-transparent text-grey-300 cursor-not-allowed border-grey-200'
              : 'bg-white text-main-black hover:border-main-primary hover:text-main-primary cursor-pointer'
          )}
        >
          <Plus className='h-4 w-4' strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export function PropertyFiltersModal({
  open,
  onOpenChange,
  filters,
  propertyType,
  listingType,
  onApply,
  onReset,
  translations,
}: PropertyFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [selectedType, setSelectedType] = useState<string | undefined>(propertyType);

  // Find the selected property type configuration
  const typeConfig = useMemo(() => 
    PROPERTY_TYPES.flatMap((cat) => cat.types).find((t) => t.code === selectedType),
    [selectedType]
  );
  
  // Dynamic features to show
  const relevantAttributes = useMemo(() => {
    const base: PropertyAttribute[] = ['BEDROOMS', 'BATHROOMS', 'AREA'];
    const typeSpecific = typeConfig?.attributes || [];
    return Array.from(new Set([...base, ...typeSpecific]));
  }, [typeConfig]);

  // Reset local state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalFilters(filters);
      setSelectedType(propertyType);
    }
    onOpenChange(newOpen);
  };

  const handleApply = () => {
    onApply(localFilters, selectedType);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    setSelectedType(undefined);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side='right'
        className='flex flex-col p-0 gap-0 w-full sm:max-w-[540px] rounded-l-3xl shadow-2xl border-none'
      >
        {/* Header */}
        <SheetHeader className='px-8 pt-8 pb-4 border-b border-purple-92'>
            <div className='flex items-center justify-between'>
                <SheetTitle className='text-2xl font-black text-main-black'>
                    {translations.title}
                </SheetTitle>
                <button 
                  onClick={() => onOpenChange(false)}
                  className='rounded-full p-2 hover:bg-grey-100 transition-colors'
                >
                    <X className='h-6 w-6 text-main-black' />
                </button>
            </div>
        </SheetHeader>

        {/* Content area */}
        <div className='flex-1 overflow-y-auto px-8 py-6 space-y-10 custom-scrollbar'>
          
          {/* Category Picker */}
          <section className='space-y-4'>
             <h3 className='text-lg font-bold text-main-black'>Loại bất động sản</h3>
             <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <button
                   onClick={() => setSelectedType(undefined)}
                   className={cn(
                     'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-[1.5px] transition-all duration-200',
                     !selectedType 
                        ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-sm' 
                        : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/50'
                   )}
                >
                   <div className='p-2 rounded-xl bg-purple-96'>
                        <Building2 className='h-6 w-6' />
                   </div>
                   <span className='text-xs font-bold text-center'>Tất cả</span>
                </button>
                {PROPERTY_TYPES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.code] || Home;
                    return cat.types.slice(0, 1).map(type => (
                        <button
                           key={cat.code}
                           onClick={() => setSelectedType(type.code)}
                           className={cn(
                             'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-[1.5px] transition-all duration-200',
                             selectedType === type.code || (selectedType && FLAT_PROPERTY_TYPES.find(t => t.code === selectedType)?.categoryCode === cat.code)
                                ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-sm' 
                                : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/50'
                           )}
                        >
                           <div className='p-2 rounded-xl bg-purple-96'>
                                <Icon className='h-6 w-6' />
                           </div>
                           <span className='text-xs font-bold text-center truncate w-full'>{cat.label.replace('Bất động sản ', '')}</span>
                        </button>
                    ))
                })}
             </div>

             {/* Sub-type selector if a category is selected */}
             {selectedType && (
                <div className='mt-4 flex flex-wrap gap-2'>
                    {PROPERTY_TYPES.find(c => c.types.some(t => t.code === selectedType))?.types.map(t => (
                        <button
                          key={t.code}
                          onClick={() => setSelectedType(t.code)}
                          className={cn(
                            'px-4 py-2 rounded-full text-xs font-medium border-1.5 transition-all',
                            selectedType === t.code
                                ? 'bg-main-primary text-white border-main-primary'
                                : 'bg-white text-grey-600 border-purple-92 hover:border-main-primary/50'
                          )}
                        >
                          {t.label}
                        </button>
                    ))}
                </div>
             )}
          </section>

          {/* Features Section */}
          <section className='space-y-4'>
            <h3 className='text-lg font-bold text-main-black'>{translations.features}</h3>
            <div className='bg-white rounded-3xl border border-purple-92 p-2 divide-y divide-purple-92'>
              {relevantAttributes.map((attrKey) => {
                const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
                const type = ATTRIBUTE_TYPES[attrKey];
                const currentValue = localFilters.attributes[attrKey];

                if (type === 'number') {
                  return (
                    <div key={attrKey} className='px-4'>
                        <Stepper
                            label={attrKey === 'AREA' ? `${label} (m²)` : label}
                            value={(currentValue as number) || 0}
                            onChange={(value) =>
                            setLocalFilters({
                                ...localFilters,
                                attributes: { ...localFilters.attributes, [attrKey]: value },
                            })
                            }
                            min={0}
                            max={attrKey === 'AREA' ? 1000 : 10}
                        />
                    </div>
                  );
                }

                if (type === 'boolean') {
                  return (
                    <div key={attrKey} className='flex items-center justify-between px-4 py-4'>
                      <span className='text-base font-medium text-main-black'>{label}</span>
                      <Switch
                        checked={!!currentValue}
                        onCheckedChange={(checked) =>
                          setLocalFilters({
                            ...localFilters,
                            attributes: { ...localFilters.attributes, [attrKey]: checked },
                          })
                        }
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </section>

          {/* Rental Period - Only for RENT */}
          {listingType === 'RENT' && (
            <section className='space-y-4 pb-4'>
              <h3 className='text-lg font-bold text-main-black'>
                {translations.rentalPeriod.label}
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                {['any', '1-12', '13-24', '24+'].map((period) => (
                    <button
                        key={period}
                        onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: period as RentalPeriod })}
                        className={cn(
                            'flex items-center justify-center px-4 py-3 rounded-2xl border-[1.5px] transition-all',
                            localFilters.rentalPeriod === period
                                ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-sm font-bold'
                                : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/50'
                        )}
                    >
                        {period === 'any' ? translations.rentalPeriod.any : translations.rentalPeriod[period as '1-12']}
                    </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className='p-8 border-t border-purple-92 bg-white/80 backdrop-blur-lg flex gap-4'>
          <Button
            type='button'
            onClick={handleReset}
            variant="ghost"
            className='flex-1 h-14 rounded-2xl text-base font-bold text-grey-500 hover:bg-grey-100'
          >
            {translations.reset}
          </Button>
          <Button
            type='button'
            onClick={handleApply}
            className='flex-[2] h-14 rounded-2xl bg-main-primary py-3 text-base font-bold text-white hover:bg-main-primary/90 shadow-lg shadow-main-primary/20'
          >
            {translations.apply}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
