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
import { cn } from '@/shared/lib/utils';

export function PropertySearchStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue, clearErrors } = useFormContext();

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<PropertySummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selection, setSelection] = useState<'NEW' | string | null>(null);

  const selectedRole = useWatch({ control, name: 'role.role' });
  const ownerEmail = useWatch({ control, name: 'role.ownerEmail' });
  const ownerId = useWatch({ control, name: 'role.ownerId' });
  const ownerName = useWatch({ control, name: 'role.ownerName' });
  const ownerMaskedPhone = useWatch({ control, name: 'role.ownerMaskedPhone' });
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const {
    data: userSearchResult,
    isFetching: isUserFetching,
    error: userError,
  } = useUserSearch(searchUserEmail);

  const handleAddressChange = (
    newAddress: string,
    lat: number,
    lng: number,
    components?: google.maps.GeocoderAddressComponent[]
  ) => {
    setAddress(newAddress);
    if (lat !== 0 && lng !== 0) {
      setCoords({ lat, lng });
      performSearch(lat, lng);
      setValue('info.location', { lat, lng });

      if (components) {
        const streetNumber =
          components.find((c) => c.types.includes('street_number'))?.long_name || '';
        const route = components.find((c) => c.types.includes('route'))?.long_name || '';
        const displayAddress = streetNumber ? `${streetNumber} ${route}`.trim() : route;
        setValue('info.streetAddress', displayAddress || newAddress);
      } else {
        setValue('info.streetAddress', newAddress);
      }
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
      setValue('role.ownerId', userSearchResult.user_id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('role.ownerName', userSearchResult.full_name, { shouldDirty: true });
      setValue('role.ownerMaskedPhone', userSearchResult.masked_phone, { shouldDirty: true });
      setValue('role.ownerPhone', userSearchResult.phone, { shouldDirty: true });
      setValue('role.ownerEmail', userSearchResult.email, {
        shouldValidate: true,
        shouldDirty: true,
      });
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
    <div className='flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Section Header */}
      <div>
        <h2 className='text-lg font-bold text-foreground tracking-tight'>{t('step0Title')}</h2>
        <p className='text-sm text-muted-foreground mt-1'>{t('step0Desc')}</p>
      </div>

      <div className='flex flex-col gap-6'>
        {/* Address Search */}
        <div className='relative'>
          <MapAutocomplete
            value={address}
            onChange={handleAddressChange}
            className='pl-10 h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
            placeholder={t('searchAddress')}
          />
          <MapPin
            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            size={20}
          />
        </div>

        {/* Search Loading */}
        {isSearching && (
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='animate-spin text-[#7065F0]' size={32} />
          </div>
        )}

        {/* Search Results */}
        {(address || coords) && !isSearching && (
          <div className='flex flex-col gap-4 animate-in slide-in-from-top-2'>
            <h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              {searchResults.length > 0
                ? t('foundExistingProperties', { count: searchResults.length })
                : t('noPropertiesFoundAtLocation')}
            </h3>

            <div className='grid grid-cols-1 gap-3'>
              {searchResults.map((p) => (
                <Card
                  key={p.property_id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md border-[1.5px]',
                    selection === p.property_id
                      ? 'border-[#7065F0] bg-[#F7F7FD]'
                      : 'border-[#E0DEF7] hover:border-[#7065F0]'
                  )}
                  onClick={() => handleSelect(p.property_id)}
                >
                  <CardContent className='p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='size-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#F0EFFB]'>
                        <img
                          src={p.thumbnail_url || '/placeholder-property.jpg'}
                          alt={p.street_address}
                          className='size-full object-cover'
                        />
                      </div>
                      <div>
                        <h4 className='font-semibold text-foreground'>{p.street_address}</h4>
                        <p className='text-sm text-muted-foreground'>
                          {p.owner_name ? `Owner: ${p.owner_name}` : ''}
                        </p>
                      </div>
                    </div>
                    {selection === p.property_id && (
                      <div className='size-8 rounded-full bg-[#7065F0] flex items-center justify-center text-white'>
                        <Check size={20} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card
                className={cn(
                  'cursor-pointer border-[1.5px] border-dashed transition-all hover:bg-[#F7F7FD]',
                  selection === 'NEW' ? 'border-[#7065F0] bg-[#F7F7FD]' : 'border-[#E0DEF7]'
                )}
                onClick={() => handleSelect('NEW')}
              >
                <CardContent className='p-4 flex items-center gap-4'>
                  <div className='size-16 rounded-lg bg-[#F0EFFB] flex items-center justify-center text-[#7065F0]'>
                    <Plus size={32} />
                  </div>
                  <div>
                    <h4 className='font-semibold text-foreground'>
                      {t('createNewPropertyOption')}
                    </h4>
                    <p className='text-sm text-muted-foreground'>{t('step0Desc')}</p>
                  </div>
                  {selection === 'NEW' && (
                    <div className='ml-auto size-8 rounded-full bg-[#7065F0] flex items-center justify-center text-white'>
                      <Check size={20} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Role Selection */}
      {selection && (
        <div className='flex flex-col gap-6 pt-8 border-t border-[#E0DEF7] animate-in fade-in slide-in-from-top-4 duration-500'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Owner Card */}
            <Card
              className={cn(
                'cursor-pointer transition-all border-[1.5px]',
                selectedRole === 'OWNER'
                  ? 'border-[#7065F0] bg-[#F7F7FD] shadow-[0px_4px_20px_0px_rgba(14,8,84,0.08)]'
                  : 'border-[#E0DEF7] hover:border-[#7065F0]'
              )}
              onClick={() => {
                setValue('role.role', 'OWNER', { shouldValidate: true });
                handleClearOwner();
              }}
            >
              <CardContent className='p-6 flex flex-col items-center text-center gap-4'>
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    selectedRole === 'OWNER'
                      ? 'bg-[#7065F0] text-white'
                      : 'bg-[#F0EFFB] text-[#7065F0]'
                  )}
                >
                  <User size={32} />
                </div>
                <h3 className='font-semibold text-lg text-foreground'>{t('iAmOwner')}</h3>
              </CardContent>
            </Card>

            {/* Agent Card */}
            <Card
              className={cn(
                'cursor-pointer transition-all border-[1.5px]',
                selectedRole === 'AGENT'
                  ? 'border-[#7065F0] bg-[#F7F7FD] shadow-[0px_4px_20px_0px_rgba(14,8,84,0.08)]'
                  : 'border-[#E0DEF7] hover:border-[#7065F0]'
              )}
              onClick={() => setValue('role.role', 'AGENT', { shouldValidate: true })}
            >
              <CardContent className='p-6 flex flex-col items-center text-center gap-4'>
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    selectedRole === 'AGENT'
                      ? 'bg-[#7065F0] text-white'
                      : 'bg-[#F0EFFB] text-[#7065F0]'
                  )}
                >
                  <Users size={32} />
                </div>
                <h3 className='font-semibold text-lg text-foreground'>{t('iAmAgent')}</h3>
              </CardContent>
            </Card>
          </div>

          {/* Agent Owner Search */}
          {selectedRole === 'AGENT' && (
            <div className='flex flex-col gap-6 pt-4 border-t border-[#E0DEF7] animate-in fade-in slide-in-from-top-2 duration-300'>
              {!ownerId ? (
                <FormField
                  control={control}
                  name='role.ownerEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-foreground'>
                        {t('ownerEmail')}
                      </FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <Input
                            placeholder={t('ownerEmailPlaceholder')}
                            className='h-12 rounded-lg border-[#E0DEF7] focus:border-[#7065F0] focus:ring-[#7065F0]'
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
                          className='h-12 rounded-lg bg-[#7065F0] hover:bg-[#5B51D9]'
                        >
                          {isUserFetching ? (
                            <Loader2 className='size-4 animate-spin' />
                          ) : (
                            <Search className='size-4 mr-2' />
                          )}
                          {t('searchOwner')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <Card className='border-[1.5px] border-[#7065F0] bg-[#F7F7FD]'>
                  <CardContent className='p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='size-12 rounded-full bg-[#E8E6F9] flex items-center justify-center text-[#7065F0]'>
                        <Check size={24} />
                      </div>
                      <div>
                        <h4 className='font-semibold text-foreground'>{ownerName}</h4>
                        <p className='text-sm text-muted-foreground'>{ownerMaskedPhone}</p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleClearOwner}
                      className='text-muted-foreground hover:text-destructive'
                    >
                      {t('cancel')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {userError && (
                <div className='p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive font-medium'>
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
