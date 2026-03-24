'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronsUpDown, Loader2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox/checkbox';
import { cn } from '@/shared/lib/utils';
import type { PropertyApiAmenity } from '@/entities/property/api/use-amenities';

interface AmenityMultiSelectProps {
  amenities: PropertyApiAmenity[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
  t: (key: string, options?: Record<string, string | number | Date>) => string;
}

export function AmenityMultiSelect({
  amenities,
  selectedIds,
  onChange,
  isLoading = false,
  t,
}: AmenityMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredAmenities = useMemo(() => {
    if (!search.trim()) return amenities;
    const term = search.toLowerCase();
    return amenities.filter((a) => a.amenity_name.toLowerCase().includes(term));
  }, [amenities, search]);

  const selectedAmenities = useMemo(
    () => amenities.filter((a) => selectedIds.includes(a.amenity_id)),
    [amenities, selectedIds]
  );

  const toggleAmenity = (amenityId: string) => {
    if (selectedIds.includes(amenityId)) {
      onChange(selectedIds.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedIds, amenityId]);
    }
  };

  const removeAmenity = (amenityId: string) => {
    onChange(selectedIds.filter((id) => id !== amenityId));
  };

  return (
    <div className='space-y-3'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            role='combobox'
            aria-expanded={open}
            aria-controls='amenity-listbox'
            className={cn(
              'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'cursor-pointer transition-colors'
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('loadingAmenities', { default: 'Loading amenities...' })}
              </span>
            ) : selectedIds.length > 0 ? (
              <span className='text-foreground'>
                {t('selectedAmenities', {
                  count: selectedIds.length,
                  default: `${selectedIds.length} amenities selected`,
                })}
              </span>
            ) : (
              <span className='text-muted-foreground'>
                {t('selectAmenities', { default: 'Select amenities' })}
              </span>
            )}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          align='start'
          sideOffset={4}
        >
          {/* Search input */}
          <div className='flex items-center border-b px-3 py-2'>
            <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
            <input
              type='text'
              placeholder={t('searchAmenities', { default: 'Search amenities...' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                className='ml-1 rounded-sm opacity-50 hover:opacity-100'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>

          {/* Checkbox list */}
          <div id='amenity-listbox' className='max-h-[250px] overflow-y-auto p-1'>
            {filteredAmenities.length === 0 ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                {t('noAmenitiesFound', { default: 'No amenities found' })}
              </div>
            ) : (
              filteredAmenities.map((amenity) => {
                const isSelected = selectedIds.includes(amenity.amenity_id);
                return (
                  <div
                    key={amenity.amenity_id}
                    onClick={() => toggleAmenity(amenity.amenity_id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className='pointer-events-none'
                      aria-hidden='true'
                    />
                    <span className='truncate'>{amenity.amenity_name}</span>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selectedAmenities.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {selectedAmenities.map((amenity) => (
            <Badge
              key={amenity.amenity_id}
              variant='secondary'
              className='gap-1 pr-1 cursor-pointer'
            >
              <span className='max-w-[150px] truncate'>{amenity.amenity_name}</span>
              <button
                type='button'
                onClick={() => removeAmenity(amenity.amenity_id)}
                className='ml-0.5 rounded-full p-0.5 hover:bg-foreground/20 transition-colors'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
