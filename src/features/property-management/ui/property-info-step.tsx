'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';
import {
  Bed,
  Bath,
  ArrowUpCircle,
  Layers,
  Wind,
  Trees,
  CarFront,
  Wifi,
  Waves,
  Dumbbell,
  Maximize,
  ShieldCheck,
  Zap,
  Droplets,
  Construction,
  Sprout,
  Building2,
  SquareSplitVertical,
  Compass,
  ParkingCircle,
  CircleDot,
  ArrowUpToLine,
  Eye,
  Home,
  Briefcase,
  Users,
  BellRing,
  ArrowUpDown,
  MoveHorizontal,
  MoveVertical,
  Store,
  Presentation,
  Film,
  Utensils,
  Table,
  ChefHat,
  Hotel,
  Star,
  ArrowUpFromLine,
  Truck,
  DoorClosed,
  TrainFront,
  DoorOpen,
  Snowflake,
  Ruler,
  Map,
  Target,
  MapPin,
  Route,
  Container,
} from 'lucide-react';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import {
  PROPERTY_TYPES,
} from '@/shared/config/property-types';
import type { PropertyAttributeDefinition } from '@/entities/property/api/property-api.types';
import { useAmenities } from '@/entities/property/api/use-amenities';
import { usePropertyAttributes } from '@/entities/property/api/use-property-attributes';
import { locationApi } from '@/entities/location/api/location.api';
import { MapAutocomplete } from './components/map-autocomplete';
import { AmenityMultiSelect } from './components/amenity-multi-select';
import { extractStreetAddress } from '@/shared/lib/location.lib';

function PositiveNumberInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(() => (value != null ? String(value) : ''));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setDisplay(value != null ? String(value) : '');
    }
  }, [value]);

  return (
    <Input
      type='text'
      inputMode='decimal'
      placeholder={placeholder}
      className={className}
      value={display}
      onFocus={() => { isEditing.current = true; }}
      onBlur={() => { isEditing.current = false; onBlur?.(); }}
      onChange={(e) => {
        let raw = e.target.value;
        raw = raw.replace(/[^\d.]/g, '');
        const dot = raw.indexOf('.');
        if (dot !== -1) raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, '');
        raw = raw.replace(/^0+(\d)/, '$1');
        setDisplay(raw);
        const num = parseFloat(raw);
        onChange(raw === '' || raw === '.' || isNaN(num) ? undefined : num);
      }}
    />
  );
}

function toVietnameseWords(n: number): string {
  if (!n || n <= 0) return '';
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(num: number, isFirst: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    let s = '';
    if (h > 0) {
      s = ones[h] + ' trăm';
    } else if (!isFirst) {
      s = 'không trăm';
    }
    if (t === 0) {
      if (u > 0) s += (s ? ' linh ' : '') + ones[u];
    } else if (t === 1) {
      s += ' mười' + (u === 5 ? ' lăm' : u > 0 ? ' ' + ones[u] : '');
    } else {
      s += ' ' + ones[t] + ' mươi' + (u === 1 ? ' mốt' : u === 5 ? ' lăm' : u > 0 ? ' ' + ones[u] : '');
    }
    return s.trim();
  }

  const ty = Math.floor(n / 1_000_000_000);
  const trieu = Math.floor((n % 1_000_000_000) / 1_000_000);
  const nghin = Math.floor((n % 1_000_000) / 1_000);
  const con = n % 1_000;
  const parts: string[] = [];
  let isFirst = true;

  if (ty > 0) { parts.push(readGroup(ty, isFirst) + ' tỷ'); isFirst = false; }
  if (trieu > 0) { parts.push(readGroup(trieu, isFirst) + ' triệu'); isFirst = false; }
  if (nghin > 0) { parts.push(readGroup(nghin, isFirst) + ' nghìn'); isFirst = false; }
  if (con > 0) { parts.push(readGroup(con, isFirst)); }

  const result = parts.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}

function PriceInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}) {
  const fmt = (n: number | undefined) =>
    n != null ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

  const [display, setDisplay] = useState(() => fmt(value));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setDisplay(fmt(value));
    }
  }, [value]);

  const rawNum = Number(display.replace(/\./g, ''));
  const words = display && !isNaN(rawNum) && rawNum > 0 ? toVietnameseWords(rawNum) : '';

  return (
    <div className='flex flex-col gap-1'>
      <Input
        type='text'
        inputMode='numeric'
        placeholder={placeholder}
        className={className}
        value={display}
        onFocus={() => { isEditing.current = true; }}
        onBlur={() => { isEditing.current = false; onBlur?.(); }}
        onChange={(e) => {
          let raw = e.target.value.replace(/\D/g, '');
          raw = raw.replace(/^0+(\d)/, '$1');
          setDisplay(raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
          onChange(raw === '' ? undefined : Number(raw));
        }}
      />
      {words && (
        <span className='text-xs text-muted-foreground italic'>{words}</span>
      )}
    </div>
  );
}

export function PropertyInfoStep({ onErrorChange }: { onErrorChange?: (hasError: boolean) => void }) {
  const t = useTranslations('PropertyManagement');
  const { control, setValue, setError, clearErrors } = useFormContext();
  const selectedPropertyType = useWatch({ control, name: 'info.propertyType' });
  const location = useWatch({ control, name: 'info.location' });
  const landSize = useWatch({ control, name: 'info.landSize' });
  const usableSize = useWatch({ control, name: 'info.usableSize' });
  const rentMin = useWatch({ control, name: 'info.priceRange.rent.min' });
  const rentMax = useWatch({ control, name: 'info.priceRange.rent.max' });
  const buyMin = useWatch({ control, name: 'info.priceRange.buy.min' });
  const buyMax = useWatch({ control, name: 'info.priceRange.buy.max' });

  const usableSizeError = usableSize != null && landSize != null && usableSize > landSize;
  const rentMaxError   = rentMin != null && rentMax != null && rentMax <= rentMin;
  const buyMaxError    = buyMin != null && buyMax != null && buyMax <= buyMin;

  useEffect(() => {
    if (usableSizeError) {
      setError('info.usableSize', { type: 'custom', message: t('validation.usableSizeLtLandSize') });
    } else {
      clearErrors('info.usableSize');
    }
  }, [usableSizeError]);

  useEffect(() => {
    if (rentMaxError) {
      setError('info.priceRange.rent.max', { type: 'custom', message: t('validation.priceMaxGtMin') });
    } else {
      clearErrors('info.priceRange.rent.max');
    }
  }, [rentMaxError]);

  useEffect(() => {
    if (buyMaxError) {
      setError('info.priceRange.buy.max', { type: 'custom', message: t('validation.priceMaxGtMin') });
    } else {
      clearErrors('info.priceRange.buy.max');
    }
  }, [buyMaxError]);

  useEffect(() => {
    onErrorChange?.(usableSizeError || rentMaxError || buyMaxError);
  }, [usableSizeError, rentMaxError, buyMaxError]);

  const { data: amenities = [], isLoading: isAmenitiesLoading } = useAmenities();
  const { data: attributeDefinitions = [] } = usePropertyAttributes(selectedPropertyType || undefined);

  const getAttributeIcon = (attrCode: string) => {
    const iconMap: Record<string, React.ElementType> = {
      // Common & Residential
      BEDROOMS: Bed,
      BATHROOMS: Bath,
      FLOOR: ArrowUpCircle,
      TOTAL_FLOORS: Building2,
      BALCONY: SquareSplitVertical,
      DIRECTION: Compass,
      AC: Wind,
      GARDEN: Trees,
      GARAGE: CarFront,
      FLOORS: Layers,
      PARKING: ParkingCircle,
      POOL: Waves,
      TENNIS: CircleDot,
      TOP_FLOOR: ArrowUpToLine,
      LARGE_BALCONY: Maximize,
      VIEW: Eye,
      GYM: Dumbbell,
      ROOMS: Home,
      WIFI: Wifi,
      KITCHEN: Utensils,

      // Commercial & Office
      OFFICE_ROOMS: Briefcase,
      MEETING_ROOMS: Users,
      RESTROOMS: Bath,
      INDIVIDUAL_AC: Wind,
      RECEPTION: BellRing,
      ELEVATOR: ArrowUpDown,

      // Retail & Building info
      WIDTH: MoveHorizontal,
      DEPTH: MoveVertical,
      UPPER_BEDROOMS: Bed,
      UPPER_BATHROOMS: Bath,
      SHOP: Store,
      DISPLAY_WINDOW: Presentation,
      HIGH_TRAFFIC: Users,
      SHOPS: Store,
      CINEMA: Film,
      FOOD_COURT: Utensils,

      // Restaurant & Hotel
      TABLES: Table,
      RESTAURANT_KITCHEN: ChefHat,
      ROOMS_HOTEL: Hotel,
      STARS: Star,
      RESTAURANT: Utensils,

      // Industrial & Logistics
      HEIGHT: ArrowUpFromLine,
      TRUCK_PARKING: Truck,
      GATES: DoorClosed,
      RAILWAY: TrainFront,
      WATER: Droplets,
      POWER: Zap,
      DRAINAGE: Waves,
      ENTRANCES: DoorOpen,
      SECURITY: ShieldCheck,
      COLD_STORAGE: Snowflake,
      LOADING_DOCKS: Container,
      CRANE: Construction,

      // Land
      FRONTAGE: Ruler,
      LAND_DEPTH: Ruler,
      PLANNING: Map,
      PURPOSE: Target,
      HEIGHT_PLANNING: Construction,
      ZONE: MapPin,
      CROP_TYPE: Sprout,
      WATER_SOURCE: Waves,
      IRRIGATION: Sprout,
      ACCESS_ROAD: Route,
    };

    const IconComponent = iconMap[attrCode];
    if (!IconComponent) return null;

    return <IconComponent className='w-4 h-4 text-main-primary/70' />;
  };

  const renderField = (attr: PropertyAttributeDefinition) => {
    const attrCode = attr.attribute_code;
    const label = attr.attribute_name;

    if (attr.data_type === 'BOOLEAN') {
      return (
        <FormField
          key={attrCode}
          control={control}
          name={`info.dynamicAttributes.${attrCode}`}
          render={({ field }) => (
            <FormItem className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                {getAttributeIcon(attrCode)}
                <FormLabel className='text-sm font-medium text-foreground cursor-pointer mb-0'>
                  {label}
                </FormLabel>
              </div>
              <FormControl>
                <div className='flex items-center justify-between h-12 px-3 rounded-lg border border-[#E0DEF7] bg-white'>
                  <span className='text-sm text-muted-foreground'>
                    {field.value ? 'Có' : 'Không'}
                  </span>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      );
    }

    if (attr.data_type === 'NUMBER') {
      return (
        <FormField
          key={attrCode}
          control={control}
          name={`info.dynamicAttributes.${attrCode}`}
          render={({ field }) => (
            <FormItem className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                {getAttributeIcon(attrCode)}
                <FormLabel className='text-sm font-medium text-foreground'>{label}</FormLabel>
              </div>
              <FormControl>
                <PositiveNumberInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder='0'
                  className='h-12 rounded-lg border-[#E0DEF7] bg-white transition-all focus:border-main-primary focus:ring-1 focus:ring-main-primary'
                />
              </FormControl>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />
      );
    }

    // TEXT → dropdown with ranges
    const hasRanges = attr.ranges && attr.ranges.length > 0;
    return (
      <FormField
        key={attrCode}
        control={control}
        name={`info.dynamicAttributes.${attrCode}`}
        render={({ field }) => (
          <FormItem className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              {getAttributeIcon(attrCode)}
              <FormLabel className='text-sm font-medium text-foreground'>{label}</FormLabel>
            </div>
            {hasRanges ? (
              <Select
                onValueChange={(rangeId) => {
                  const selectedRange = attr.ranges?.find((r) => r.range_id === rangeId);
                  if (selectedRange) field.onChange(selectedRange.label);
                }}
                value={attr.ranges?.find((r) => r.label === field.value)?.range_id || ''}
              >
                <FormControl>
                  <SelectTrigger className='h-12 rounded-lg border-[#E0DEF7] bg-white transition-all focus:border-main-primary focus:ring-1 focus:ring-main-primary'>
                    <SelectValue
                      placeholder={t('selectOption', { default: 'Select {label}', label })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='rounded-lg border-[#E0DEF7]'>
                  {attr.ranges?.map((range) => (
                    <SelectItem key={range.range_id} value={range.range_id}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                <Input
                  type='text'
                  placeholder={label}
                  className='h-12 rounded-lg border-[#E0DEF7] bg-white transition-all focus:border-main-primary focus:ring-1 focus:ring-main-primary'
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
            )}
            <FormMessage className='text-xs' />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className='flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Section Header */}
      <div>
        <h2 className='text-lg font-bold text-foreground tracking-tight'>
          {t('step1Title', { default: 'Property Information' })}
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          {t('step1Desc', { default: 'Tell us about the property location and details' })}
        </p>
      </div>

      {/* Street Address + Map */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='flex flex-col gap-3'>
          <FormField
            control={control}
            name='info.streetAddress'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium text-foreground'>
                  {t('address', { default: 'Street Address' })}
                  <span className='text-destructive ml-1'>*</span>
                </FormLabel>
                <FormControl>
                  <MapAutocomplete
                    value={field.value || ''}
                    onChange={async (addr, lat, lng, components) => {
                      if (lat !== 0 && lng !== 0) {
                        setValue('info.location', { lat, lng });

                        // Part 2: Resolve Location ID from Coordinates
                        try {
                          const locationRes = await locationApi.searchByCoordinates(lat, lng);
                          if (locationRes.payload.success && locationRes.payload.data) {
                            setValue('info.locationId', locationRes.payload.data.location_id, {
                              shouldValidate: true,
                            });
                          }
                        } catch (error) {
                          console.error('Failed to resolve location from coordinates:', error);
                        }

                        // Extract short street address using robust utility
                        const displayAddress = extractStreetAddress(addr, components);
                        field.onChange(displayAddress);
                      } else {
                        field.onChange(addr);
                      }
                    }}
                    placeholder={t('addressPlaceholder', { default: '123 Main St' })}
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className='text-xs text-muted-foreground'>
            {t('mapHelp', {
              default: 'Search for an address to automatically pin the location on the map.',
            })}
          </p>
        </div>

        <div className='h-48 overflow-hidden rounded-lg bg-[#F0EFFB] relative border border-[#E0DEF7]'>
          {location && location.lat && location.lng ? (
            <GoogleMap
              defaultZoom={15}
              center={{ lat: location.lat, lng: location.lng }}
              disableDefaultUI={true}
              gestureHandling='greedy'
            >
              <Marker position={{ lat: location.lat, lng: location.lng }} />
            </GoogleMap>
          ) : (
            <div className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
              {t('noLocation', { default: 'Pin will appear here after searching for address' })}
            </div>
          )}
        </div>
      </div>

      {/* Size Fields */}
      <div className='flex flex-col gap-2'>
        {/* Labels row */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='text-sm font-medium text-foreground'>
            {t('landSize', { default: 'Land Size (m²)' })}
            <span className='text-destructive ml-1'>*</span>
          </div>
          <div className='text-sm font-medium text-foreground'>
            {t('usableSize', { default: 'Usable Size (m²)' })}
            <span className='text-destructive ml-1'>*</span>
          </div>
          <div className='text-sm font-medium text-foreground'>
            {t('width', { default: 'Width (m)' })}
          </div>
          <div className='text-sm font-medium text-foreground'>
            {t('length', { default: 'Length (m)' })}
          </div>
        </div>

        {/* Inputs row */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
          <FormField
            control={control}
            name='info.landSize'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PositiveNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder='0'
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='info.usableSize'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PositiveNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder='0'
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='info.width'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PositiveNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder='0'
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='info.length'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PositiveNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder='0'
                    className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Property Type & Dynamic Attributes */}
      <div className='pt-4 border-t border-[#E0DEF7]'>
        <FormField
          control={control}
          name='info.propertyType'
          render={({ field }) => (
            <FormItem className='mb-6'>
              <FormLabel className='text-sm font-medium text-foreground'>
                {t('propertyType', { default: 'Property Type' })}
                <span className='text-destructive ml-1'>*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => { field.onChange(value); field.onBlur(); }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className='w-full h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'>
                    <SelectValue
                      placeholder={t('selectType', { default: 'Select property type' })}
                    >
                      {PROPERTY_TYPES.flatMap((cat) => cat.types).find(
                        (type) => type.code === field.value
                      )?.label || undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='rounded-lg border-[#E0DEF7] shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'>
                  {PROPERTY_TYPES.map((cat) => (
                    <SelectGroup key={cat.code}>
                      <SelectLabel>{cat.label}</SelectLabel>
                      {cat.types.map((type) => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Attributes Section */}
        {attributeDefinitions.length > 0 && (
          <div className='mt-8 pt-8 border-t border-[#E0DEF7] animate-in fade-in slide-in-from-top-4 duration-500'>
            <p className='text-sm font-medium text-foreground mb-4'>
              {t('propertyCharacteristics', { default: 'Đặc trưng của bất động sản' })}
            </p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-5'>
              {attributeDefinitions.map((attr) => renderField(attr))}
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className='mt-8 pt-8 border-t border-[#E0DEF7]'>
          <p className='text-sm font-medium text-foreground mb-4'>
            {t('amenities', { default: 'Amenities' })}
          </p>
          <FormField
            control={control}
            name='info.amenityIds'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <AmenityMultiSelect
                    amenities={amenities}
                    selectedIds={field.value || []}
                    onChange={field.onChange}
                    isLoading={isAmenitiesLoading}
                    t={t}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Range */}
        <div className='mt-8 pt-8 border-t border-[#E0DEF7]'>
          <p className='text-sm font-medium text-foreground mb-4'>
            {t('priceRange')}
          </p>
          <div className='grid grid-cols-1 gap-6'>
            {/* Rent price range */}
            <div>
              <p className='text-xs font-semibold text-foreground/70 mb-3 tracking-wide'>
                {t('priceRangeRent')}
              </p>
              <div className='grid grid-cols-2 gap-4 items-start'>
                <FormField
                  control={control}
                  name='info.priceRange.rent.min'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-foreground/60'>{t('priceMin')}</FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='0'
                          className='h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'
                        />
                      </FormControl>
                      <div className='min-h-5'><FormMessage /></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='info.priceRange.rent.max'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-foreground/60 data-[error=true]:text-foreground/60'>{t('priceMax')}</FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='0'
                          className='h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'
                        />
                      </FormControl>
                      <div className='min-h-5'><FormMessage /></div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Buy price range */}
            <div>
              <p className='text-xs font-semibold text-foreground/70 mb-3 tracking-wide'>
                {t('priceRangeBuy')}
              </p>
              <div className='grid grid-cols-2 gap-4 items-start'>
                <FormField
                  control={control}
                  name='info.priceRange.buy.min'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-foreground/60'>{t('priceMin')}</FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='0'
                          className='h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'
                        />
                      </FormControl>
                      <div className='min-h-5'><FormMessage /></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='info.priceRange.buy.max'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-foreground/60 data-[error=true]:text-foreground/60'>{t('priceMax')}</FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder='0'
                          className='h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'
                        />
                      </FormControl>
                      <div className='min-h-5'><FormMessage /></div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
