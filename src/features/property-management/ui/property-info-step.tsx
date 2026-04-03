'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';

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
import { MapAutocomplete } from './components/map-autocomplete';
import { AmenityMultiSelect } from './components/amenity-multi-select';

export function PropertyInfoStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue } = useFormContext();
  const selectedPropertyType = useWatch({ control, name: 'info.propertyType' });
  const location = useWatch({ control, name: 'info.location' });

  const { data: amenities = [], isLoading: isAmenitiesLoading } = useAmenities();

  // Determine dynamic attributes
  const activeAttributes = useMemo(() => {
    if (!selectedPropertyType) return [];
    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === selectedPropertyType);
      if (type) return type.attributes;
    }
    return [];
  }, [selectedPropertyType]);

  const renderDynamicField = (attrCode: PropertyAttribute) => {
    const label = ATTRIBUTE_LABELS[attrCode];
    const type = ATTRIBUTE_TYPES[attrCode];

    return (
      <FormField
        key={attrCode}
        control={control}
        name={`info.dynamicAttributes.${attrCode}`}
        render={({ field }) => (
          <FormItem className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <FormLabel className='text-sm font-medium text-foreground'>{label}</FormLabel>
              {type === 'boolean' && (
                <FormControl>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                </FormControl>
              )}
            </div>
            {type === 'number' && (
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  placeholder={label}
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
            )}
            {type === 'text' && (
              <FormControl>
                <Input
                  type='text'
                  placeholder={label}
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            )}
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
                </FormLabel>
                <FormControl>
                  <MapAutocomplete
                    value={field.value || ''}
                    onChange={(addr, lat, lng, components) => {
                      if (lat !== 0 && lng !== 0) {
                        setValue('info.location', { lat, lng });

                        if (components) {
                          const streetNumber =
                            components.find((c) => c.types.includes('street_number'))?.long_name ||
                            '';
                          const route =
                            components.find((c) => c.types.includes('route'))?.long_name || '';
                          const displayAddress = streetNumber
                            ? `${streetNumber} ${route}`.trim()
                            : route;
                          field.onChange(displayAddress || addr);
                        } else {
                          field.onChange(addr);
                        }
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
                {t('landSize', { default: 'Land Size (m²)' })}
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
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
                {t('usableSize', { default: 'Usable Size (m²)' })}
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
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
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
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
                  className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
                  {...field}
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
                {t('propertyType', { default: 'Property Type' })}*
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

        {activeAttributes.length > 0 && (
          <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300'>
            <h3 className='text-base font-bold text-foreground'>
              {t('additionalDetails', { default: 'Additional Details' })}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 rounded-lg bg-[#F7F7FD] border border-[#E0DEF7]'>
              {activeAttributes.map((attr) => renderDynamicField(attr))}
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
