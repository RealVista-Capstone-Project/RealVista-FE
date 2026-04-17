'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover/popover';
import { savedSearchQueries, useDeleteSavedSearch, savedSearchKeys } from '@/entities/saved-search';
import { useAuthSession } from '@/features/auth/model';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { SavedSearchDto } from '@/entities/saved-search';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';

interface SavedSearchesPopoverProps {
  searchType?: 'BUY' | 'RENT';
}

export function SavedSearchesPopover({ searchType }: SavedSearchesPopoverProps) {
  const { data: session } = useAuthSession();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: queryData, isLoading } = useQuery({
    ...savedSearchQueries.list(),
    enabled: !!session?.user,
  });

  const allSavedSearches = queryData?.payload?.data || [];
  const savedSearches = searchType
    ? allSavedSearches.filter((s) => s.search_type === searchType)
    : allSavedSearches;

  const queryClient = useQueryClient();
  const { mutate: deleteSearch, isPending: isDeleting } = useDeleteSavedSearch();

  const generateSearchSummary = (search: SavedSearchDto) => {
    const { criteria, search_type } = search;
    const parts: string[] = [];

    // Search type label
    parts.push(search_type === 'RENT' ? 'Thuê' : 'Mua');

    // Property type
    if (criteria.propertyType) {
      parts.push(String(criteria.propertyType));
    }

    // Location — handle both string and array
    if (criteria.location) {
      const locs = Array.isArray(criteria.location)
        ? (criteria.location as string[]).filter(Boolean)
        : [criteria.location as string];
      if (locs.length > 0) {
        parts.push(`tại ${locs.slice(0, 2).join(', ')}${locs.length > 2 ? '...' : ''}`);
      }
    }

    // Price range — criteria.price stores raw VND values (e.g. 2_000_000_000 = 2 tỷ)
    if (criteria.price && (criteria.price[0] !== null || criteria.price[1] !== null)) {
      const min = criteria.price[0];
      const max = criteria.price[1];
      if (min !== null && max !== null) parts.push(`${formatVND(min)} – ${formatVND(max)}`);
      else if (min !== null) parts.push(`trên ${formatVND(min)}`);
      else if (max !== null) parts.push(`dưới ${formatVND(max)}`);
    }

    // Area range (m²)
    if (criteria.area && (criteria.area[0] !== null || criteria.area[1] !== null)) {
      const min = criteria.area[0];
      const max = criteria.area[1];
      if (min !== null && max !== null) parts.push(`${min} – ${max} m²`);
      else if (min !== null) parts.push(`> ${min} m²`);
      else if (max !== null) parts.push(`< ${max} m²`);
    }

    // Bedrooms
    if (criteria.bedrooms != null) {
      parts.push(`${criteria.bedrooms} phòng ngủ`);
    }

    // Bathrooms
    if (criteria.bathrooms != null) {
      parts.push(`${criteria.bathrooms} phòng tắm`);
    }

    // Notable dynamic attributes (show first 2 boolean=true ones)
    if (criteria.dynamicAttributes && typeof criteria.dynamicAttributes === 'object') {
      const trueAttrs = Object.entries(criteria.dynamicAttributes)
        .filter(([, v]) => v === true || v === 'true')
        .slice(0, 2)
        .map(([k]) => k);
      if (trueAttrs.length > 0) parts.push(trueAttrs.join(', '));
    }

    // Fallback
    if (parts.length <= 1) {
      return search_type === 'RENT' ? 'Tìm kiếm thuê' : 'Tìm kiếm mua';
    }

    return parts.join(' · ');
  };

  // Fallback if user is not logged in
  if (!session?.user) {
    return null;
  }

  const handleApplySearch = (search: SavedSearchDto) => {
    setOpen(false);
    const params = new URLSearchParams();

    // Convert criteria back to URL params
    const criteria = search.criteria;

    if (criteria.location) {
      const loc = Array.isArray(criteria.location) ? criteria.location[0] : criteria.location;
      if (loc) params.set('location', loc);
    }

    if (criteria.price) {
      if (criteria.price[0] !== null) params.set('minPrice', criteria.price[0].toString());
      if (criteria.price[1] !== null) params.set('maxPrice', criteria.price[1].toString());
    }

    if (criteria.area) {
      if (criteria.area[0] !== null) params.set('minArea', criteria.area[0].toString());
      if (criteria.area[1] !== null) params.set('maxArea', criteria.area[1].toString());
    }

    if (criteria.propertyType) params.set('propertyType', criteria.propertyType.toString());
    if (criteria.propertyCategory) params.set('propertyCategory', criteria.propertyCategory.toString());

    if (criteria.hasVideo) params.set('hasVideo', 'true');
    if (criteria.has3D) params.set('has3D', 'true');
    if (criteria.sortBy && criteria.sortBy !== 'PRIORITY') params.set('sortBy', criteria.sortBy);

    if (criteria.dynamicAttributes) {
      Object.entries(criteria.dynamicAttributes).forEach(([key, value]) => {
        if (value) params.set(`attr_${key.toLowerCase()}`, String(value));
      });
    }

    const route = search.search_type === 'RENT' ? 'rent' : 'buy';
    router.push(`/${locale}/${route}?${params.toString()}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSearch(id, {
      onSuccess: () => {
        toast.success('Đã xóa tìm kiếm đã lưu');
        queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
      },
      onError: () => toast.error('Xóa thất bại'),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' className='flex items-center gap-2 border-primary text-primary hover:bg-primary/5'>
          <Bookmark className='w-4 h-4' />
          <span className='hidden sm:inline'>
            {searchType === 'RENT' ? 'Tìm kiếm thuê' : searchType === 'BUY' ? 'Tìm kiếm mua' : 'Tìm kiếm'} đã lưu ({savedSearches.length || 0})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
          <h3 className='font-semibold text-foreground'>Tìm kiếm đã lưu</h3>
        </div>
        <div className='max-h-80 overflow-y-auto p-2'>
          {isLoading ? (
            <div className='flex justify-center p-4'>
              <Loader2 className='w-5 h-5 animate-spin text-primary' />
            </div>
          ) : savedSearches.length === 0 ? (
            <p className='text-sm text-gray-500 text-center p-4'>
              Bạn chưa có tìm kiếm {searchType === 'RENT' ? 'thuê' : searchType === 'BUY' ? 'mua' : ''} nào được lưu.
            </p>
          ) : (
            savedSearches.map((search) => (
              <div
                key={search.saved_search_id}
                onClick={() => handleApplySearch(search)}
                className='flex items-start justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer group transition-colors'
              >
                <div>
                  <p className='text-sm font-medium text-foreground line-clamp-2 leading-snug'>
                    {generateSearchSummary(search)}
                  </p>
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/10'>
                      {search.board_id || 'Mặc định'}
                    </span>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider font-semibold'>
                      {formatDistanceToNow(new Date(search.created_at), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                  onClick={(e) => handleDelete(e, search.saved_search_id)}
                  disabled={isDeleting}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
