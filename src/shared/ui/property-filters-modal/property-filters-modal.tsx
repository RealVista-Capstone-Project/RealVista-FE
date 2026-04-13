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

/**
 * Premium Segmented Control for numbers 0-5+
 */
function SegmentedSelector({
  value,
  onChange,
  maxItems = 6, // 0 to 5+
}: {
  value: number;
  onChange: (value: number) => void;
  maxItems?: number;
}) {
  const options = Array.from({ length: maxItems }, (_, i) => i);
  
  return (
    <div className='relative flex h-10 w-full items-center gap-1 rounded-xl bg-purple-96 p-1'>
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            type='button'
            onClick={() => onChange(opt)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center text-sm font-bold transition-all duration-300',
              isActive ? 'text-white' : 'text-grey-500 hover:text-main-black'
            )}
          >
            {opt === 0 ? 'Bất kỳ' : `${opt}${opt === maxItems - 1 ? '+' : ''}`}
            {isActive && (
              <div 
                className='absolute inset-0 -z-10 rounded-lg bg-main-primary shadow-md animate-in fade-in zoom-in-95 duration-200' 
              />
            )}
          </button>
        );
      })}
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
  
  // Categorize attributes for better UX
  const { essentials, comfort } = useMemo(() => {
    const base: PropertyAttribute[] = ['BEDROOMS', 'BATHROOMS', 'FLOORS'];
    const typeSpecific = typeConfig?.attributes || [];
    const all = Array.from(new Set([...base, ...typeSpecific]));
    
    return {
      essentials: all.filter(attr => ATTRIBUTE_TYPES[attr] === 'number').slice(0, 4),
      comfort: all.filter(attr => ATTRIBUTE_TYPES[attr] === 'boolean').slice(0, 8)
    };
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
        className='flex flex-col p-0 gap-0 w-full sm:max-w-[420px] border-none outline-none overflow-hidden'
      >
        <SheetHeader className='px-6 pt-6 pb-4'>
            <SheetTitle className='text-xl font-bold tracking-tight text-main-black'>
                {translations.title}
            </SheetTitle>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto custom-scrollbar'>
          <div className='px-6 py-4 space-y-10'>
            
            {/* 1. Category Picker - More Compact */}
            <section className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-bold uppercase tracking-wider text-grey-400'>{translations.category}</h3>
                    {selectedType && (
                        <button className='text-xs font-bold text-main-primary hover:underline' onClick={() => setSelectedType(undefined)}>Xóa bộ lọc</button>
                    )}
                </div>
                <div className='grid grid-cols-4 gap-3'>
                    {PROPERTY_TYPES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.code] || Home;
                        const isSelected = selectedType && FLAT_PROPERTY_TYPES.find(t => t.code === selectedType)?.categoryCode === cat.code;
                        const label = cat.code === 'RESIDENTIAL' ? 'Nhà ở' : cat.label.replace('Bất động sản ', '');
                        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

                        return (
                            <button
                                key={cat.code}
                                onClick={() => setSelectedType(cat.types[0].code)}
                                className={cn(
                                    'flex flex-col items-center gap-2 transition-all group',
                                    isSelected ? 'scale-105' : 'hover:-translate-y-1'
                                )}
                            >
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-2xl border-1.5 transition-all duration-300',
                                    isSelected ? 'border-main-primary bg-main-primary/5 text-main-primary shadow-sm' : 'border-purple-92 bg-white text-grey-500 group-hover:border-main-primary/50'
                                )}>
                                    <Icon className='h-6 w-6' strokeWidth={isSelected ? 2.5 : 2} />
                                </div>
                                <span className={cn('text-[10px] font-bold uppercase tracking-tight', isSelected ? 'text-main-primary' : 'text-grey-500')}>
                                    {capitalizedLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {selectedType && (
                    <div className='flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-1'>
                        {PROPERTY_TYPES.find(c => c.types.some(t => t.code === selectedType))?.types.map(t => (
                            <button
                                key={t.code}
                                onClick={() => setSelectedType(t.code)}
                                className={cn(
                                    'px-3.5 py-1.5 rounded-lg text-xs font-bold border-1.5 transition-all',
                                    selectedType === t.code
                                        ? 'bg-main-primary text-white border-main-primary shadow-sm'
                                        : 'bg-white text-grey-500 border-purple-92 hover:border-main-primary/30'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Essential Features (Numbers) */}
            <section className='space-y-6'>
                <h3 className='text-sm font-bold uppercase tracking-wider text-grey-400'>{translations.features}</h3>
                <div className='space-y-6'>
                    {essentials.map((attrKey) => {
                        const Icon = ATTRIBUTE_ICONS[attrKey];
                        const label = ATTRIBUTE_LABELS[attrKey];
                        return (
                            <div key={attrKey} className='space-y-3'>
                                <div className='flex items-center gap-2'>
                                    {Icon && <Icon className='h-4 w-4 text-grey-400' />}
                                    <span className='text-[13px] font-bold text-main-black'>{label}</span>
                                </div>
                                <SegmentedSelector 
                                    value={(localFilters.attributes[attrKey] as number) || 0}
                                    onChange={(val) => setLocalFilters({
                                        ...localFilters,
                                        attributes: { ...localFilters.attributes, [attrKey]: val }
                                    })}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Comfort Features (Booleans) */}
            <section className='space-y-4'>
                <h3 className='text-sm font-bold uppercase tracking-wider text-grey-400'>Tiện nghi & Dịch vụ</h3>
                <div className='grid grid-cols-1 gap-2'>
                    {comfort.map((attrKey) => {
                        const Icon = ATTRIBUTE_ICONS[attrKey];
                        const label = ATTRIBUTE_LABELS[attrKey];
                        const isChecked = !!localFilters.attributes[attrKey];
                        return (
                            <div 
                                key={attrKey} 
                                className={cn(
                                    'flex items-center justify-between rounded-xl px-4 py-3 transition-colors',
                                    isChecked ? 'bg-main-primary/[0.03]' : 'hover:bg-grey-50'
                                )}
                            >
                                <div className='flex items-center gap-3'>
                                    {Icon && <Icon className={cn('h-4.5 w-4.5', isChecked ? 'text-main-primary' : 'text-grey-400')} />}
                                    <span className={cn('text-sm font-medium', isChecked ? 'text-main-black font-semibold' : 'text-grey-600')}>{label}</span>
                                </div>
                                <Switch 
                                    checked={isChecked}
                                    onCheckedChange={(checked) => setLocalFilters({
                                        ...localFilters,
                                        attributes: { ...localFilters.attributes, [attrKey]: checked }
                                    })}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 4. Rental Period if RENT */}
            {listingType === 'RENT' && (
                <section className='space-y-4'>
                    <h3 className='text-sm font-bold uppercase tracking-wider text-grey-400'>{translations.rentalPeriod.label}</h3>
                    <div className='grid grid-cols-2 gap-2'>
                        {['any', '1-12', '13-24', '24+'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: period as RentalPeriod })}
                                className={cn(
                                    'flex h-11 items-center justify-center rounded-xl border-1.5 text-sm font-bold transition-all',
                                    localFilters.rentalPeriod === period
                                        ? 'bg-main-primary text-white border-main-primary shadow-sm'
                                        : 'bg-white text-grey-500 border-purple-92 hover:border-main-primary/30'
                                )}
                            >
                                {period === 'any' ? translations.rentalPeriod.any : translations.rentalPeriod[period as '1-12']}
                            </button>
                        ))}
                    </div>
                </section>
            )}
          </div>
        </div>

        <SheetFooter className='p-6 border-t border-purple-92 bg-white flex flex-col gap-3'>
          <Button
            type='button'
            onClick={handleApply}
            className='w-full h-12 rounded-xl bg-main-primary text-sm font-bold text-white shadow-lg shadow-main-primary/20 hover:bg-main-primary/90 transition-all active:scale-95'
          >
            {translations.apply}
          </Button>
          <Button
            type='button'
            onClick={handleReset}
            variant="ghost"
            className='w-full h-10 rounded-xl text-sm font-bold text-grey-500 hover:text-main-black transition-colors'
          >
            {translations.reset}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
