'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronsUpDown, Loader2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
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
    <div className='flex flex-col gap-3'>
      {/* Selected amenities as Figma-style chips */}
      {selectedAmenities.length > 0 && (
        <div className='rounded-lg border border-primary/20 bg-white p-4'>
          <div className='flex flex-wrap gap-3'>
            {selectedAmenities.map((amenity) => (
              <button
                key={amenity.amenity_id}
                type='button'
                onClick={() => removeAmenity(amenity.amenity_id)}
                className='flex items-center gap-1 rounded-md border-[1.5px] border-primary bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20 cursor-pointer'
              >
                <span className='truncate max-w-[150px]'>{amenity.amenity_name}</span>
                <X className='size-3.5 shrink-0' />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amenity picker trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            role='combobox'
            aria-expanded={open}
            aria-controls='amenity-listbox'
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm',
              'hover:bg-primary/5',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'cursor-pointer transition-colors'
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='size-4 animate-spin' />
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
            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border-primary/20 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
          align='start'
          sideOffset={4}
        >
          {/* Search input */}
          <div className='flex items-center border-b border-primary/20 px-3 py-2'>
            <Search className='mr-2 size-4 shrink-0 opacity-50' />
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
                <X className='size-3.5' />
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
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                      'hover:bg-primary/5',
                      isSelected && 'bg-primary/5 text-primary font-semibold'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className='pointer-events-none border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
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
    </div>
  );
}
