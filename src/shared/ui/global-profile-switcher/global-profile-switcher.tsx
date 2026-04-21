'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, ChevronDown, ChevronRight, Check, Trash2, Loader2 } from 'lucide-react';
import { customerProfileQueries, customerProfileApi } from '@/entities/customer-profile/api';
import type { CustomerProfile } from '@/entities/customer-profile/model/types';
import { savedSearchQueries, useDeleteSavedSearch, savedSearchKeys } from '@/entities/saved-search';
import type { SavedSearchDto } from '@/entities/saved-search';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface GlobalProfileSwitcherProps {
  searchType?: 'BUY' | 'RENT';
}

export function GlobalProfileSwitcher({ searchType }: GlobalProfileSwitcherProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Navigation');

  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    ...customerProfileQueries.me(),
  });

  const profiles: CustomerProfile[] = data?.payload?.data || [];
  const activeProfile = profiles.find((p) => p.is_active);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && activeProfile) {
      setExpandedProfileId(activeProfile.customer_profile_id);
    }
  };

  const { data: savedSearchData } = useQuery({
    ...savedSearchQueries.list(),
    enabled: profiles.length > 0,
  });

  const allSavedSearches: SavedSearchDto[] = savedSearchData?.payload?.data || [];

  // Group saved searches by profile, filtered by searchType
  const searchesByProfile = useMemo(() => {
    const filtered = searchType
      ? allSavedSearches.filter((s) => s.search_type === searchType)
      : allSavedSearches;

    const map = new Map<string, SavedSearchDto[]>();
    for (const s of filtered) {
      if (!s.profile_id) continue;
      const arr = map.get(s.profile_id) || [];
      arr.push(s);
      map.set(s.profile_id, arr);
    }
    // Sort each group by created_at descending (most recent first)
    for (const [key, arr] of map) {
      map.set(
        key,
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    }
    return map;
  }, [allSavedSearches, searchType]);

  const { mutate: switchProfile, isPending } = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.switchActive(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.refresh();
      toast.success('Đã chuyển Profile');
    },
    onError: () => {
      toast.error('Không thể chuyển Profile. Vui lòng thử lại sau.');
    },
  });

  const { mutate: createProfile, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => customerProfileApi.create({ profile_name: name }),
    onSuccess: (res) => {
      toast.success('Tạo Profile mới thành công');
      setShowCreateDialog(false);
      setNewProfileName('');
      const newId = res.payload?.data?.customer_profile_id;
      if (newId) switchProfile(newId);
      else queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
    },
    onError: () => {
      toast.error('Tạo Profile thất bại');
    },
  });

  const { mutate: deleteSearch, isPending: isDeleting } = useDeleteSavedSearch();

  const handleSwitchProfile = (profileId: string) => {
    if (profileId === activeProfile?.customer_profile_id) {
      // Toggle expand for the active profile
      setExpandedProfileId((prev) => (prev === profileId ? null : profileId));
      return;
    }
    switchProfile(profileId);
    setExpandedProfileId(profileId);

    // Auto-apply most recent saved search for the switched profile
    const searches = searchesByProfile.get(profileId);
    if (searches && searches.length > 0) {
      applySearch(searches[0]);
    }
  };

  const applySearch = (search: SavedSearchDto) => {
    setOpen(false);
    const params = new URLSearchParams();
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
    if (criteria.propertyCategory)
      params.set('propertyCategory', criteria.propertyCategory.toString());
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

  const handleDeleteSearch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSearch(id, {
      onSuccess: () => {
        toast.success('Đã xóa tìm kiếm đã lưu');
        queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
      },
      onError: () => toast.error('Xóa thất bại'),
    });
  };

  const generateSearchSummary = (search: SavedSearchDto) => {
    const { criteria, search_type } = search;
    const parts: string[] = [];

    parts.push(search_type === 'RENT' ? 'Thuê' : 'Mua');

    if (criteria.propertyType) parts.push(String(criteria.propertyType));

    if (criteria.location) {
      const locs = Array.isArray(criteria.location)
        ? (criteria.location as string[]).filter(Boolean)
        : [criteria.location as string];
      if (locs.length > 0) {
        parts.push(`tại ${locs.slice(0, 2).join(', ')}${locs.length > 2 ? '...' : ''}`);
      }
    }

    if (criteria.price && (criteria.price[0] !== null || criteria.price[1] !== null)) {
      const min = criteria.price[0];
      const max = criteria.price[1];
      if (min !== null && max !== null) parts.push(`${formatVND(min)} – ${formatVND(max)}`);
      else if (min !== null) parts.push(`trên ${formatVND(min)}`);
      else if (max !== null) parts.push(`dưới ${formatVND(max)}`);
    }

    if (criteria.area && (criteria.area[0] !== null || criteria.area[1] !== null)) {
      const min = criteria.area[0];
      const max = criteria.area[1];
      if (min !== null && max !== null) parts.push(`${min} – ${max} m²`);
      else if (min !== null) parts.push(`> ${min} m²`);
      else if (max !== null) parts.push(`< ${max} m²`);
    }

    if (criteria.bedrooms != null) parts.push(`${criteria.bedrooms} PN`);
    if (criteria.bathrooms != null) parts.push(`${criteria.bathrooms} PT`);

    if (parts.length <= 1) {
      return search_type === 'RENT' ? 'Tìm kiếm thuê' : 'Tìm kiếm mua';
    }

    return parts.join(' · ');
  };

  if (isLoading || profiles.length === 0) return null;

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type='button'
            disabled={isPending}
            className='flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent cursor-pointer'
          >
            <span className='max-w-[140px] truncate'>
              {activeProfile?.profile_name || 'Mặc định'}
            </span>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </button>
        </PopoverTrigger>

        <PopoverContent className='w-80 p-0' align='end'>
          {/* Profiles Section */}
          <div className='p-2'>
            <p className='px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Profile
            </p>
            {profiles.map((profile) => {
              const isActive = profile.customer_profile_id === activeProfile?.customer_profile_id;
              const isExpanded = expandedProfileId === profile.customer_profile_id;
              const profileSearches =
                searchesByProfile.get(profile.customer_profile_id) || [];

              return (
                <div key={profile.customer_profile_id}>
                  {/* Profile row */}
                  <button
                    type='button'
                    onClick={() => handleSwitchProfile(profile.customer_profile_id)}
                    disabled={isPending}
                    className='flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent cursor-pointer'
                  >
                    {isActive ? (
                      <Check className='h-4 w-4 text-primary shrink-0' />
                    ) : (
                      <div className='h-4 w-4 shrink-0' />
                    )}
                    <span className={`flex-1 text-left truncate ${isActive ? 'font-semibold text-primary' : ''}`}>
                      {profile.profile_name || 'Mặc định'}
                    </span>
                    {profileSearches.length > 0 && (
                      <span className='flex items-center gap-0.5 text-xs text-muted-foreground'>
                        {profileSearches.length}
                        {isExpanded ? (
                          <ChevronDown className='h-3 w-3' />
                        ) : (
                          <ChevronRight className='h-3 w-3' />
                        )}
                      </span>
                    )}
                  </button>

                  {/* Saved searches for this profile */}
                  {isExpanded && profileSearches.length > 0 && (
                    <div className='ml-6 mb-1 space-y-0.5'>
                      {profileSearches.map((search) => (
                        <div
                          key={search.saved_search_id}
                          onClick={() => applySearch(search)}
                          className='group/item flex items-start justify-between gap-1 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-primary/5 cursor-pointer'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium text-foreground line-clamp-2 leading-snug'>
                              {generateSearchSummary(search)}
                            </p>
                            <div className='flex items-center gap-1.5 mt-0.5'>
                              {search.board_id && (
                                <span className='inline-flex items-center rounded bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/10'>
                                  {search.board_id}
                                </span>
                              )}
                              <span className='text-[10px] text-muted-foreground'>
                                {formatDistanceToNow(new Date(search.created_at), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </span>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={(e) => handleDeleteSearch(e, search.saved_search_id)}
                            disabled={isDeleting}
                            className='shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover/item:opacity-100'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Create new profile */}
            <div className='border-t border-border mt-1 pt-1'>
              <button
                type='button'
                onClick={() => {
                  setOpen(false);
                  setShowCreateDialog(true);
                }}
                className='flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 cursor-pointer'
              >
                <PlusCircle className='h-4 w-4' />
                <span>Thêm Profile</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Tạo Profile mới</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Input
              autoFocus
              placeholder='Ví dụ: Đầu tư lướt sóng, Mua cho con...'
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProfileName.trim() && !isCreating) {
                  createProfile(newProfileName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button
              disabled={!newProfileName.trim() || isCreating}
              onClick={() => createProfile(newProfileName.trim())}
            >
              {isCreating ? 'Đang tạo...' : 'Tạo ngay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
