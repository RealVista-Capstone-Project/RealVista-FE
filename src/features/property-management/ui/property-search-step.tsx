'use client';

import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Plus, Check, Loader2, User, Users, AlertCircle } from 'lucide-react';

import { MapAutocomplete } from './components/map-autocomplete';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { propertyApi } from '@/entities/property/api/property.api';
import type { PropertySummary } from '@/entities/property/api/property-api.types';
import { useUserSearch } from '@/entities/user/api/use-user-search';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useCities, useChildrenLocations } from '@/entities/location/api/use-locations';

export function PropertySearchStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue, clearErrors } = useFormContext();

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<PropertySummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selection, setSelection] = useState<'NEW' | string | null>(null);

  // Location selectors for pre-filling
  const selectedCity = useWatch({ control, name: 'info.city' });
  const selectedDistrict = useWatch({ control, name: 'info.district' });

  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useChildrenLocations(selectedCity);
  const { data: wards = [] } = useChildrenLocations(selectedDistrict);

  const selectedRole = useWatch({ control, name: 'role.role' });
  const ownerEmail = useWatch({ control, name: 'role.ownerEmail' });
  const ownerId = useWatch({ control, name: 'role.ownerId' });
  const ownerName = useWatch({ control, name: 'role.ownerName' });
  const ownerMaskedPhone = useWatch({ control, name: 'role.ownerMaskedPhone' });
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const { data: userSearchResult, isFetching: isUserFetching, error: userError } = useUserSearch(searchUserEmail);

  const handleAddressChange = (newAddress: string, lat: number, lng: number) => {
    setAddress(newAddress);
    if (lat !== 0 && lng !== 0) {
      setCoords({ lat, lng });
      performSearch(lat, lng);
      setValue('info.location', { lat, lng });
      setValue('info.streetAddress', newAddress);
    } else {
      setCoords(null);
    }
  };

  const performSearch = async (lat: number | null, lng: number | null, addr?: string) => {
    setIsSearching(true);
    try {
      const params: Record<string, string | number> = {};
      if (lat !== null && lng !== null) {
        const delta = 0.0005;
        params.north_lat = lat + delta;
        params.south_lat = lat - delta;
        params.east_lng = lng + delta;
        params.west_lng = lng - delta;
      } else if (addr) {
        params.address = addr;
      }

      if (Object.keys(params).length === 0) return;

      const response = await propertyApi.search(params);
      setSearchResults(response.payload.data || []);
    } catch (error) {
      console.error('Failed to search properties:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!address || coords) return;

    const timer = setTimeout(() => {
      if (address.length >= 3) {
        performSearch(null, null, address);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [address, coords]);

  const handleSelect = (id: 'NEW' | string) => {
    setSelection(id);
    if (id === 'NEW') {
      setValue('isExistingProperty', false);
      setValue('selectedPropertyId', null);
      setValue('info.streetAddress', address);
      setValue('info.location', coords);
    } else {
      setValue('isExistingProperty', true);
      setValue('selectedPropertyId', id);
    }
  };

  const handleUserSearch = () => {
    if (ownerEmail && ownerEmail.includes('@')) {
      setSearchUserEmail(ownerEmail);
    }
  };

  useEffect(() => {
    if (userSearchResult) {
      setValue('role.ownerId', userSearchResult.user_id, { shouldValidate: true, shouldDirty: true });
      setValue('role.ownerName', userSearchResult.full_name, { shouldDirty: true });
      setValue('role.ownerMaskedPhone', userSearchResult.masked_phone, { shouldDirty: true });
      setValue('role.ownerPhone', userSearchResult.phone, { shouldDirty: true });
      setValue('role.ownerEmail', userSearchResult.email, { shouldValidate: true, shouldDirty: true });
      clearErrors('role.ownerEmail');
    }
  }, [userSearchResult, setValue, clearErrors]);

  const handleClearOwner = () => {
    setValue('role.ownerId', '');
    setValue('role.ownerName', '');
    setValue('role.ownerMaskedPhone', '');
    setValue('role.ownerEmail', '');
    setSearchUserEmail('');
  };

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div>
        <h2 className='text-2xl font-semibold mb-2'>{t('step0Title')}</h2>
        <p className='text-muted-foreground'>{t('step0Desc')}</p>
      </div>

      <div className='space-y-6'>
        {/* Step 0: Unified Location & Address Search */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <FormField
            control={control}
            name='info.city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('city')}</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue('info.district', '');
                    setValue('info.ward', '');
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCity')} />
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
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='info.district'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('district')}</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue('info.ward', '');
                  }}
                  value={field.value}
                  disabled={!selectedCity}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDistrict')} />
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
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='info.ward'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ward')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedDistrict}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectWard')} />
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
              </FormItem>
            )}
          />
        </div>

        <div className='relative'>
          <MapAutocomplete
            value={address}
            onChange={handleAddressChange}
            className='pl-10 h-12'
            placeholder={t('searchAddress')}
          />
          <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
        </div>

        {isSearching && (
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='animate-spin text-primary' size={32} />
          </div>
        )}

        {(address || coords) && !isSearching && (
          <div className='space-y-4 animate-in slide-in-from-top-2'>
            <h3 className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
              {searchResults.length > 0
                ? t('foundExistingProperties', { count: searchResults.length })
                : t('noPropertiesFoundAtLocation')}
            </h3>

            <div className='grid grid-cols-1 gap-3'>
              {searchResults.map((p) => (
                <Card
                  key={p.property_id}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${selection === p.property_id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => handleSelect(p.property_id)}
                >
                  <CardContent className='p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100'>
                        <img
                          src={p.thumbnail_url || '/placeholder-property.jpg'}
                          alt={p.street_address}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div>
                        <h4 className='font-semibold'>{p.street_address}</h4>
                        <p className='text-sm text-muted-foreground'>{p.owner_name ? `Owner: ${p.owner_name}` : ''}</p>
                      </div>
                    </div>
                    {selection === p.property_id && (
                      <div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white'>
                        <Check size={20} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card
                className={`cursor-pointer border-2 border-dashed transition-all hover:bg-slate-50 ${selection === 'NEW' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}
                onClick={() => handleSelect('NEW')}
              >
                <CardContent className='p-4 flex items-center gap-4'>
                  <div className='w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400'>
                    <Plus size={32} />
                  </div>
                  <div>
                    <h4 className='font-semibold'>{t('createNewPropertyOption')}</h4>
                    <p className='text-sm text-muted-foreground'>{t('step0Desc')}</p>
                  </div>
                  {selection === 'NEW' && (
                    <div className='ml-auto w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white'>
                      <Check size={20} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {selection && (
        <div className='space-y-6 pt-8 border-t animate-in fade-in slide-in-from-top-4 duration-500'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card
              className={`cursor-pointer transition-all border-2 ${selectedRole === 'OWNER' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
              onClick={() => {
                setValue('role.role', 'OWNER', { shouldValidate: true });
                handleClearOwner();
              }}
            >
              <CardContent className='p-6 flex flex-col items-center text-center space-y-4'>
                <div className={`p-4 rounded-full ${selectedRole === 'OWNER' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <User size={32} />
                </div>
                <div>
                  <h3 className='font-semibold text-lg'>{t('iAmOwner')}</h3>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all border-2 ${selectedRole === 'AGENT' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
              onClick={() => setValue('role.role', 'AGENT', { shouldValidate: true })}
            >
              <CardContent className='p-6 flex flex-col items-center text-center space-y-4'>
                <div className={`p-4 rounded-full ${selectedRole === 'AGENT' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Users size={32} />
                </div>
                <div>
                  <h3 className='font-semibold text-lg'>{t('iAmAgent')}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedRole === 'AGENT' && (
            <div className='space-y-6 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300'>
              {!ownerId ? (
                <FormField
                  control={control}
                  name='role.ownerEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ownerEmail')}</FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <Input
                            placeholder={t('ownerEmailPlaceholder')}
                            {...field}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUserSearch();
                              }
                            }}
                          />
                        </FormControl>
                        <Button
                          type='button'
                          onClick={handleUserSearch}
                          disabled={isUserFetching || !field.value?.includes('@')}
                        >
                          {isUserFetching ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <Search className='w-4 h-4 mr-2' />
                          )}
                          {t('searchOwner')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <Card className='bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'>
                  <CardContent className='p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600'>
                        <Check size={24} />
                      </div>
                      <div>
                        <h4 className='font-semibold'>{ownerName}</h4>
                        <p className='text-sm text-slate-500'>{ownerMaskedPhone}</p>
                      </div>
                    </div>
                    <Button variant='ghost' size='sm' onClick={handleClearOwner} className='text-slate-500 hover:text-red-500'>
                      {t('cancel')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {userError && (
                <div className='p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 font-medium'>
                  <AlertCircle size={20} />
                  <p>{t('ownerNotFound')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
