'use client';

import { useMemo } from 'react';
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
  Monitor,
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
  ATTRIBUTE_LABELS,
  ATTRIBUTE_TYPES,
  PropertyAttribute,
} from '@/shared/config/property-types';
import { useAmenities } from '@/entities/property/api/use-amenities';
import { usePropertyAttributes } from '@/entities/property/api/use-property-attributes';
import { locationApi } from '@/entities/location/api/location.api';
import { MapAutocomplete } from './components/map-autocomplete';
import { AmenityMultiSelect } from './components/amenity-multi-select';
import { extractStreetAddress } from '@/shared/lib/location.lib';

export function PropertyInfoStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue } = useFormContext();
  const selectedPropertyType = useWatch({ control, name: 'info.propertyType' });
  const location = useWatch({ control, name: 'info.location' });

  const { data: amenities = [], isLoading: isAmenitiesLoading } = useAmenities();
  const { data: attributeDefinitions = [] } = usePropertyAttributes();

  // Segment dynamic attributes into values and booleans
  const { valueAttributes, booleanAttributes } = useMemo(() => {
    if (!selectedPropertyType) return { valueAttributes: [], booleanAttributes: [] };

    let attrs: PropertyAttribute[] = [];
    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === selectedPropertyType);
      if (type) {
        attrs = type.attributes;
        break;
      }
    }

    const values: PropertyAttribute[] = [];
    const booleans: PropertyAttribute[] = [];

    attrs.forEach((attr) => {
      if (ATTRIBUTE_TYPES[attr] === 'boolean') {
        booleans.push(attr);
      } else {
        values.push(attr);
      }
    });

    return { valueAttributes: values, booleanAttributes: booleans };
  }, [selectedPropertyType]);

  const getAttributeIcon = (attrCode: PropertyAttribute) => {
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

  const renderValueField = (attrCode: PropertyAttribute) => {
    const label = ATTRIBUTE_LABELS[attrCode];
    const type = ATTRIBUTE_TYPES[attrCode];
    const definition = attributeDefinitions.find((d) => d.attribute_code === attrCode);
    const hasRanges = definition?.ranges && definition.ranges.length > 0;

    return (
      <FormField
        key={attrCode}
        control={control}
        name={`info.dynamicAttributes.${attrCode}`}
        render={({ field }) => (
          <FormItem className='flex flex-col gap-1.5'>
            <div className='flex items-center gap-2 mb-0.5'>
              {getAttributeIcon(attrCode)}
              <FormLabel className='text-[13px] font-semibold text-foreground/80'>
                {label}
              </FormLabel>
            </div>
            {hasRanges ? (
              <Select
                onValueChange={(rangeId) => {
                  const selectedRange = definition.ranges?.find((r) => r.range_id === rangeId);
                  if (selectedRange) {
                    const actualValue =
                      type === 'number' ? selectedRange.min_value : selectedRange.label;
                    field.onChange(actualValue);
                  }
                }}
                value={
                  definition.ranges?.find(
                    (r) => (type === 'number' ? r.min_value : r.label) === field.value
                  )?.range_id || ''
                }
              >
                <FormControl>
                  <SelectTrigger className='h-11 rounded-lg border-[#E0DEF7] bg-white transition-all focus:border-main-primary focus:ring-1 focus:ring-main-primary'>
                    <SelectValue
                      placeholder={t('selectOption', { default: 'Select {label}', label })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='rounded-lg border-[#E0DEF7]'>
                  {definition.ranges?.map((range) => (
                    <SelectItem key={range.range_id} value={range.range_id}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                <Input
                  type={type === 'number' ? 'number' : 'text'}
                  min={type === 'number' ? '0' : undefined}
                  placeholder={label}
                  className='h-11 rounded-lg border-[#E0DEF7] bg-white transition-all focus:border-main-primary focus:ring-1 focus:ring-main-primary'
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(
                      type === 'number'
                        ? e.target.value
                          ? Number(e.target.value)
                          : undefined
                        : e.target.value
                    );
                  }}
                />
              </FormControl>
            )}
            <FormMessage className='text-xs' />
          </FormItem>
        )}
      />
    );
  };

  const renderBooleanField = (attrCode: PropertyAttribute) => {
    const label = ATTRIBUTE_LABELS[attrCode];

    return (
      <FormField
        key={attrCode}
        control={control}
        name={`info.dynamicAttributes.${attrCode}`}
        render={({ field }) => (
          <FormItem className='flex items-center justify-between p-3.5 rounded-xl border border-[#E0DEF7] bg-white hover:bg-main-primary/[0.02] transition-colors'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-main-primary/5 text-main-primary font-bold'>
                {getAttributeIcon(attrCode) || <div className='w-4 h-4' />}
              </div>
              <FormLabel className='text-sm font-medium text-foreground cursor-pointer mb-0'>
                {label}
              </FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value === true} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
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
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
        <FormField
          control={control}
          name='info.landSize'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium text-foreground'>
                {t('landSize', { default: 'Land Size' })} (m²)
                <span className='text-destructive ml-1'>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  step='any'
                  placeholder='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
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
              <FormLabel className='text-sm font-medium text-foreground'>
                {t('usableSize', { default: 'Usable Size' })} (m²)
                <span className='text-destructive ml-1'>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  step='any'
                  placeholder='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
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
              <FormLabel className='text-sm font-medium text-foreground'>
                {t('width', { default: 'Width (m)' })}
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  step='any'
                  placeholder='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
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
              <FormLabel className='text-sm font-medium text-foreground'>
                {t('length', { default: 'Length (m)' })}
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  step='any'
                  placeholder='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='w-full h-12 rounded-lg border-[#E0DEF7] bg-white focus:border-[#7065F0] focus:ring-[#7065F0]'>
                    <SelectValue
                      placeholder={t('selectType', { default: 'Select property type' })}
                    />
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
        {(valueAttributes.length > 0 || booleanAttributes.length > 0) && (
          <div className='mt-8 pt-8 border-t border-[#E0DEF7] animate-in fade-in slide-in-from-top-4 duration-500'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-xl bg-main-primary/10 flex items-center justify-center text-main-primary'>
                <Monitor className='w-5 h-5' />
              </div>
              <div>
                <h3 className='text-base font-bold text-foreground'>
                  {t('additionalDetails', { default: 'Additional Details' })}
                </h3>
                <p className='text-xs text-muted-foreground'>
                  {t('additionalDetailsDesc', {
                    default: 'Specify technical details and additional features of the property.',
                  })}
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-8'>
              {/* Value-based Attributes Grid */}
              {valueAttributes.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5'>
                  {valueAttributes.map((attr) => renderValueField(attr))}
                </div>
              )}

              {/* Boolean Features Grid */}
              {booleanAttributes.length > 0 && (
                <div className='space-y-4'>
                  <h4 className='text-sm font-semibold text-foreground/70 uppercase tracking-wider'>
                    {t('featuresAmenities', { default: 'Features & Amenities' })}
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {booleanAttributes.map((attr) => renderBooleanField(attr))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className='pt-8 mt-4'>
          <h3 className='text-base font-bold text-foreground mb-4'>
            {t('amenities', { default: 'Amenities' })}
          </h3>
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
      </div>
    </div>
  );
}
