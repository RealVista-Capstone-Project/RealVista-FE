'use client';

import { useState, useMemo } from 'react';
import { 
  Home, Building2, Factory, Map as MapIcon,
  BedSingle, Bath, Maximize, Layers, Trees, Car, Waves, 
  Wind, Wifi, ChefHat, Dumbbell, Compass, Sun, ShieldCheck, 
  Warehouse, Layout, Star
} from 'lucide-react';
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

const ATTRIBUTE_ICONS: Record<string, any> = {
  BEDROOMS: BedSingle,
  BATHROOMS: Bath,
  AREA: Maximize,
  FLOORS: Layers,
  FLOOR: Layers,
  TOTAL_FLOORS: Layout,
  BALCONY: Warehouse,
  DIRECTION: Compass,
  AC: Wind,
  GARDEN: Trees,
  GARAGE: Car,
  PARKING: Car,
  POOL: Waves,
  TENNIS: Star,
  TOP_FLOOR: ShieldCheck,
  VIEW: Sun,
  GYM: Dumbbell,
  WIFI: Wifi,
  KITCHEN: ChefHat,
  WIDTH: Maximize,
  DEPTH: Maximize,
  FRONTAGE: Maximize,
  LAND_DEPTH: Maximize,
};

function NumberSelector({
  value,
  onChange,
  maxLevels = 5,
}: {
  value: number;
  onChange: (value: number) => void;
  maxLevels?: number;
}) {
  const options = [0, ...Array.from({ length: maxLevels }, (_, i) => i + 1)];
  
  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((opt) => (
        <button
          key={opt}
          type='button'
          onClick={() => onChange(opt)}
          className={cn(
            'flex h-10 min-w-[3rem] items-center justify-center rounded-full border-1.5 px-3 text-sm font-bold transition-all duration-200',
            value === opt
              ? 'bg-main-primary text-white border-main-primary'
              : 'bg-white text-main-black border-purple-92 hover:border-main-primary/50'
          )}
        >
          {opt === 0 ? 'Bất kỳ' : `${opt}+`}
        </button>
      ))}
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

  const typeConfig = useMemo(() => 
    PROPERTY_TYPES.flatMap((cat) => cat.types).find((t) => t.code === selectedType),
    [selectedType]
  );
  
  const relevantAttributes = useMemo(() => {
    const base: PropertyAttribute[] = ['BEDROOMS', 'BATHROOMS'];
    const typeSpecific = typeConfig?.attributes || [];
    return Array.from(new Set([...base, ...typeSpecific])).filter(attr => {
       const type = ATTRIBUTE_TYPES[attr];
       return type === 'number' || type === 'boolean';
    }).slice(0, 10);
  }, [typeConfig]);

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
        className='flex flex-col p-0 gap-0 w-full sm:max-w-[440px] border-none outline-none'
      >
        <SheetHeader className='px-6 pt-6 pb-4 border-b border-purple-92'>
            <div className='flex items-center justify-between'>
                <SheetTitle className='text-xl font-bold text-main-black'>
                    {translations.title}
                </SheetTitle>
            </div>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar'>
          
          {/* Category Section */}
          <section className='space-y-4'>
             <div className='flex items-center justify-between'>
                <h3 className='text-base font-bold text-main-black'>Loại bất động sản</h3>
                {selectedType && (
                    <button className='text-xs font-bold text-main-primary' onClick={() => setSelectedType(undefined)}>Xóa</button>
                )}
             </div>
             <div className='grid grid-cols-4 gap-2'>
                {PROPERTY_TYPES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.code] || Home;
                    const displayLabel = cat.code === 'RESIDENTIAL' ? 'Nhà ở' : cat.label.replace('Bất động sản ', '');
                    const capitalizedLabel = displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1);
                    const isSelected = selectedType && FLAT_PROPERTY_TYPES.find(t => t.code === selectedType)?.categoryCode === cat.code;
                    
                    return (
                        <button
                           key={cat.code}
                           onClick={() => setSelectedType(cat.types[0].code)}
                           className={cn(
                             'flex flex-col items-center justify-center gap-2 p-2 rounded-xl border-1.5 transition-all duration-200',
                             isSelected
                                ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-sm' 
                                : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/40'
                           )}
                        >
                           <Icon className='h-5 w-5' strokeWidth={2.5} />
                           <span className='text-[10px] font-bold text-center uppercase tracking-tight'>{capitalizedLabel}</span>
                        </button>
                    )
                })}
             </div>

             {selectedType && (
                <div className='flex flex-wrap gap-1.5'>
                    {PROPERTY_TYPES.find(c => c.types.some(t => t.code === selectedType))?.types.map(t => (
                        <button
                          key={t.code}
                          onClick={() => setSelectedType(t.code)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold border-1.5 transition-all',
                            selectedType === t.code
                                ? 'bg-main-primary text-white border-main-primary'
                                : 'bg-white text-grey-600 border-purple-92 hover:border-main-primary/30'
                          )}
                        >
                          {t.label}
                        </button>
                    ))}
                </div>
             )}
          </section>

          {/* Features Section */}
          <section className='space-y-6'>
            <h3 className='text-base font-bold text-main-black'>{translations.features}</h3>
            <div className='space-y-6'>
              {relevantAttributes.map((attrKey) => {
                const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
                const type = ATTRIBUTE_TYPES[attrKey];
                const currentValue = localFilters.attributes[attrKey];
                const Icon = ATTRIBUTE_ICONS[attrKey];

                if (type === 'number') {
                  const labelWithUnit = attrKey === 'AREA' ? `${label} (m²)` : label;
                  return (
                    <div key={attrKey} className='space-y-3'>
                        <div className='flex items-center gap-2 text-main-black'>
                            {Icon && <Icon className='h-4 w-4 text-grey-400' />}
                            <span className='text-sm font-bold'>{labelWithUnit}</span>
                        </div>
                        <NumberSelector
                            value={(currentValue as number) || 0}
                            onChange={(value) =>
                            setLocalFilters({
                                ...localFilters,
                                attributes: { ...localFilters.attributes, [attrKey]: value },
                            })
                            }
                            maxLevels={attrKey === 'BEDROOMS' || attrKey === 'BATHROOMS' ? 5 : 4}
                        />
                    </div>
                  );
                }

                if (type === 'boolean') {
                  return (
                    <div key={attrKey} className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-main-black'>
                         {Icon && <Icon className='h-4 w-4 text-grey-400' />}
                         <span className='text-sm font-bold'>{label}</span>
                      </div>
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

          {/* Rental Period */}
          {listingType === 'RENT' && (
            <section className='space-y-4'>
              <h3 className='text-base font-bold text-main-black'>
                {translations.rentalPeriod.label}
              </h3>
              <div className='grid grid-cols-2 gap-2'>
                {['any', '1-12', '13-24', '24+'].map((period) => (
                    <button
                        key={period}
                        onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: period as RentalPeriod })}
                        className={cn(
                            'flex items-center justify-center px-4 py-2.5 rounded-xl border-1.5 text-sm transition-all',
                            localFilters.rentalPeriod === period
                                ? 'bg-main-primary text-white border-main-primary font-bold'
                                : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/40'
                        )}
                    >
                        {period === 'any' ? translations.rentalPeriod.any : translations.rentalPeriod[period as '1-12']}
                    </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <SheetFooter className='p-6 border-t border-purple-92 bg-white flex flex-col gap-3'>
          <Button
            type='button'
            onClick={handleApply}
            className='w-full h-11 rounded-xl bg-main-primary py-3 text-sm font-bold text-white hover:bg-main-primary/90'
          >
            {translations.apply}
          </Button>
          <Button
            type='button'
            onClick={handleReset}
            variant="outline"
            className='w-full h-11 rounded-xl text-sm font-bold border-purple-92 text-grey-600'
          >
            {translations.reset}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
