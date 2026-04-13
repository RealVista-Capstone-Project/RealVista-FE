'use client';

import { useState, useMemo } from 'react';
import { 
  Minus, Plus, Home, Building2, Factory, Map as MapIcon, X,
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

function Stepper({
  label,
  value,
  onChange,
  icon: Icon,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: any;
  min?: number;
  max?: number;
}) {
  return (
    <div className='flex items-center justify-between py-5 border-b border-purple-92/50 last:border-0 hover:bg-main-primary/[0.02] -mx-4 px-4 transition-colors rounded-xl'>
      <div className='flex items-center gap-3'>
        {Icon && (
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-96 text-main-primary'>
            <Icon className='h-5 w-5' strokeWidth={2} />
          </div>
        )}
        <span className='text-base font-semibold text-main-black'>{label}</span>
      </div>
      <div className='flex items-center gap-5'>
        <button
          type='button'
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border border-purple-92 bg-white shadow-sm transition-all active:scale-90',
            value <= min
              ? 'opacity-30 cursor-not-allowed border-grey-200'
              : 'text-main-black hover:border-main-primary hover:text-main-primary cursor-pointer'
          )}
        >
          <Minus className='h-4 w-4' strokeWidth={2.5} />
        </button>
        <span className='min-w-[40px] text-center text-xl font-black text-main-black tabular-nums'>
            {value === 0 ? 'Tất cả' : value}
        </span>
        <button
          type='button'
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border border-purple-92 bg-white shadow-sm transition-all active:scale-90',
            value >= max
              ? 'opacity-30 cursor-not-allowed border-grey-200'
              : 'text-main-black hover:border-main-primary hover:text-main-primary cursor-pointer'
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
    const base: PropertyAttribute[] = ['BEDROOMS', 'BATHROOMS'];
    const typeSpecific = typeConfig?.attributes || [];
    // Only show interesting number/boolean attributes to keep it clean
    return Array.from(new Set([...base, ...typeSpecific])).filter(attr => {
       const type = ATTRIBUTE_TYPES[attr];
       return type === 'number' || type === 'boolean';
    }).slice(0, 10); // Don't overflow
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
        className='flex flex-col p-0 gap-0 w-full sm:max-w-[580px] rounded-l-3xl shadow-2xl border-none outline-none'
      >
        {/* Header */}
        <SheetHeader className='px-10 pt-10 pb-6 border-b border-purple-92'>
            <div className='flex items-center justify-between'>
                <SheetTitle className='text-3xl font-black text-main-black tracking-tight'>
                    {translations.title}
                </SheetTitle>
            </div>
        </SheetHeader>

        {/* Content area */}
        <div className='flex-1 overflow-y-auto px-10 py-8 space-y-12 custom-scrollbar'>
          
          {/* Category Picker */}
          <section className='space-y-6'>
             <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-main-black'>Loại bất động sản</h3>
                {selectedType && (
                    <Button variant='link' className='h-auto p-0 text-main-primary font-bold' onClick={() => setSelectedType(undefined)}>Xóa</Button>
                )}
             </div>
             <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
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
                             'group flex flex-col items-center justify-center gap-3 p-5 rounded-[24px] border-2 transition-all duration-300',
                             isSelected
                                ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-lg shadow-main-primary/5 scale-105' 
                                : 'bg-white border-purple-92 text-grey-500 hover:border-main-primary/40 hover:bg-main-primary/[0.02]'
                           )}
                        >
                           <div className={cn(
                               'p-3 rounded-2xl transition-colors',
                               isSelected ? 'bg-main-primary text-white' : 'bg-purple-96 text-grey-500 group-hover:bg-main-primary/10 group-hover:text-main-primary'
                           )}>
                                <Icon className='h-7 w-7' strokeWidth={2.5} />
                           </div>
                           <span className='text-xs font-black tracking-wide uppercase'>{capitalizedLabel}</span>
                        </button>
                    )
                })}
             </div>

             {/* Sub-type selector if a category is selected */}
             {selectedType && (
                <div className='animate-in fade-in slide-in-from-top-2 duration-300'>
                    <div className='flex flex-wrap gap-2.5 p-1'>
                        {PROPERTY_TYPES.find(c => c.types.some(t => t.code === selectedType))?.types.map(t => (
                            <button
                            key={t.code}
                            onClick={() => setSelectedType(t.code)}
                            className={cn(
                                'px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-300',
                                selectedType === t.code
                                    ? 'bg-main-primary text-white border-main-primary shadow-md'
                                    : 'bg-white text-grey-600 border-purple-92 hover:border-main-primary/30'
                            )}
                            >
                            {t.label}
                            </button>
                        ))}
                    </div>
                </div>
             )}
          </section>

          {/* Features Section */}
          <section className='space-y-6'>
            <h3 className='text-xl font-bold text-main-black'>{translations.features}</h3>
            <div className='space-y-1'>
              {relevantAttributes.map((attrKey) => {
                const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
                const type = ATTRIBUTE_TYPES[attrKey];
                const currentValue = localFilters.attributes[attrKey];
                const Icon = ATTRIBUTE_ICONS[attrKey];

                if (type === 'number') {
                  return (
                    <Stepper
                        key={attrKey}
                        label={attrKey === 'AREA' ? `${label} (m²)` : label}
                        icon={Icon}
                        value={(currentValue as number) || 0}
                        onChange={(value) =>
                        setLocalFilters({
                            ...localFilters,
                            attributes: { ...localFilters.attributes, [attrKey]: value },
                        })
                        }
                        min={0}
                        max={attrKey === 'AREA' ? 1000 : 20}
                    />
                  );
                }

                if (type === 'boolean') {
                  return (
                    <div key={attrKey} className='flex items-center justify-between py-5 border-b border-purple-92/50 last:border-0 hover:bg-main-primary/[0.02] -mx-4 px-4 transition-colors rounded-xl'>
                      <div className='flex items-center gap-3'>
                         {Icon && (
                            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-96 text-main-primary'>
                                <Icon className='h-5 w-5' strokeWidth={2} />
                            </div>
                         )}
                        <span className='text-base font-semibold text-main-black'>{label}</span>
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

          {/* Rental Period - Only for RENT */}
          {listingType === 'RENT' && (
            <section className='space-y-6 pb-4'>
              <h3 className='text-xl font-bold text-main-black'>
                {translations.rentalPeriod.label}
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                {['any', '1-12', '13-24', '24+'].map((period) => (
                    <button
                        key={period}
                        onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: period as RentalPeriod })}
                        className={cn(
                            'flex items-center justify-center px-4 py-4 rounded-2xl border-2 transition-all duration-200',
                            localFilters.rentalPeriod === period
                                ? 'bg-main-primary/5 border-main-primary text-main-primary shadow-sm font-black'
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

        {/* Footer */}
        <SheetFooter className='p-10 border-t border-purple-92 bg-white flex items-center gap-6'>
          <Button
            type='button'
            onClick={handleReset}
            variant="outline"
            className='flex-1 h-14 rounded-2xl text-base font-bold border-purple-92 hover:bg-grey-50 text-grey-600 transition-all active:scale-95'
          >
            {translations.reset}
          </Button>
          <Button
            type='button'
            onClick={handleApply}
            className='flex-[2] h-14 rounded-2xl bg-main-primary py-3 text-base font-bold text-white hover:bg-main-primary/90 shadow-xl shadow-main-primary/30 transition-all active:scale-95'
          >
            {translations.apply}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
