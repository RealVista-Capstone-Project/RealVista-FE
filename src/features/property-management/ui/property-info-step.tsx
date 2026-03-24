'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Map, Marker } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';

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
import { useCities, useChildrenLocations } from '@/entities/location/api/use-locations';
import { useAmenities } from '@/entities/property/api/use-amenities';
import { MapAutocomplete } from './components/map-autocomplete';
import { AmenityMultiSelect } from './components/amenity-multi-select';

export function PropertyInfoStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue } = useFormContext();

  const selectedCity = useWatch({ control, name: 'info.city' });
  const selectedDistrict = useWatch({ control, name: 'info.district' });
  const selectedPropertyType = useWatch({ control, name: 'info.propertyType' });
  const location = useWatch({ control, name: 'info.location' });

  // Fetch real location data from backend
  const { data: cities = [], isLoading: isCitiesLoading } = useCities();
  const { data: districts = [], isLoading: isDistrictsLoading } = useChildrenLocations(
    selectedCity || undefined
  );
  const { data: wards = [], isLoading: isWardsLoading } = useChildrenLocations(
    selectedDistrict || undefined
  );

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
          <FormItem className='flex flex-col space-y-2'>
            <div className='flex items-center justify-between'>
              <FormLabel className='text-sm font-medium'>{label}</FormLabel>
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
                <Input type='text' placeholder={label} {...field} value={field.value || ''} />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div>
        <h2 className='text-2xl font-semibold mb-2'>
          {t('step1Title', { default: 'Property Information' })}
        </h2>
        <p className='text-muted-foreground'>
          {t('step1Desc', { default: 'Tell us about the property location and details' })}
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <FormField
          control={control}
          name='info.city'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('city', { default: 'City / Province' })}</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue('info.district', '');
                  setValue('info.ward', '');
                }}
                value={field.value}
                disabled={isCitiesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    {isCitiesLoading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <SelectValue placeholder={t('selectCity', { default: 'Select city' })} />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.location_id} value={c.location_id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='info.district'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('district', { default: 'District' })}</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue('info.ward', '');
                }}
                value={field.value}
                disabled={!selectedCity || isDistrictsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    {isDistrictsLoading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <SelectValue
                        placeholder={t('selectDistrict', { default: 'Select district' })}
                      />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.location_id} value={d.location_id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='info.ward'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ward', { default: 'Ward' })}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedDistrict || isWardsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    {isWardsLoading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <SelectValue placeholder={t('selectWard', { default: 'Select ward' })} />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.location_id} value={w.location_id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <FormField
            control={control}
            name='info.streetAddress'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('address', { default: 'Street Address' })}</FormLabel>
                <FormControl>
                  <MapAutocomplete
                    value={field.value || ''}
                    onChange={(addr, lat, lng) => {
                      field.onChange(addr);
                      if (lat !== 0 && lng !== 0) {
                        setValue('info.location', { lat, lng });
                      }
                    }}
                    placeholder={t('addressPlaceholder', { default: '123 Main St' })}
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

        <div className='h-48 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 relative shadow-sm border border-slate-200 dark:border-slate-700'>
          {location && location.lat && location.lng ? (
            <Map
              defaultZoom={15}
              center={{ lat: location.lat, lng: location.lng }}
              disableDefaultUI={true}
              gestureHandling='greedy'
            >
              <Marker position={{ lat: location.lat, lng: location.lng }} />
            </Map>
          ) : (
            <div className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
              {t('noLocation', { default: 'Pin will appear here after searching for address' })}
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <FormField
          control={control}
          name='info.landSize'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('landSize', { default: 'Land Size (m²)' })}</FormLabel>
              <FormControl>
                <Input type='number' min='0' {...field} />
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
              <FormLabel>{t('usableSize', { default: 'Usable Size (m²)' })}</FormLabel>
              <FormControl>
                <Input type='number' min='0' {...field} />
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
              <FormLabel>{t('width', { default: 'Width (m)' })}</FormLabel>
              <FormControl>
                <Input type='number' min='0' {...field} />
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
              <FormLabel>{t('length', { default: 'Length (m)' })}</FormLabel>
              <FormControl>
                <Input type='number' min='0' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='pt-4 border-t'>
        <FormField
          control={control}
          name='info.propertyType'
          render={({ field }) => (
            <FormItem className='mb-6'>
              <FormLabel>{t('propertyType', { default: 'Property Type' })}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='w-full md:w-[350px]'>
                    <SelectValue
                      placeholder={t('selectType', { default: 'Select property type' })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
          <div className='space-y-4 animate-in fade-in slide-in-from-top-2 duration-300'>
            <h3 className='text-lg font-medium'>
              {t('additionalDetails', { default: 'Additional Details' })}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800'>
              {activeAttributes.map((attr) => renderDynamicField(attr))}
            </div>
          </div>
        )}

        <div className='pt-8 mt-4'>
          <h3 className='text-lg font-medium mb-4'>{t('amenities', { default: 'Amenities' })}</h3>
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
