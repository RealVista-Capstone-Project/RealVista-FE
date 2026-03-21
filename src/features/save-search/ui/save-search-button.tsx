'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { useSaveSearch, savedSearchQueries } from '@/entities/saved-search';
import { useAuthSession } from '@/features/auth/model';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import type { SearchType } from '@/entities/saved-search';
import { toast } from 'sonner';

interface SaveSearchButtonProps {
  searchType: SearchType;
  criteria: Record<string, unknown>;
}

export function SaveSearchButton({ searchType, criteria }: SaveSearchButtonProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useAuthSession();
  const { mutate: saveSearch, isPending } = useSaveSearch();

  // Fetch saved searches from server — isAlreadySaved is authoritative from server state
  const { data: queryData } = useQuery({
    ...savedSearchQueries.list(),
    enabled: !!session?.user,
  });

  const savedSearches = queryData?.payload?.data || [];

  // Stable stringify for comparison (shows correct initial state before user interacts)
  const stableStringify = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return JSON.stringify(obj);
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = obj[key] && typeof obj[key] === 'object' ? stableStringify(obj[key]) : obj[key];
          return acc;
        }, {})
    );
  };

  const isAlreadySaved = savedSearches.some((s) => {
    if (s.search_type !== searchType) return false;
    return stableStringify(s.criteria) === stableStringify(criteria);
  });

  const handleSave = () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }

    // Always call BE — if duplicate, useSaveSearch.onError intercepts 409 and refreshes cache silently
    saveSearch(
      { search_type: searchType, criteria: criteria as any },
      {
        onSuccess: () => {
          toast.success('Đã lưu tìm kiếm thành công');
        },
        onError: (error: any) => {
          // 409 is handled by the mutation hook (cache sync) — no toast needed
          const errorCode = error?.response?.data?.payload?.errorCode
            ?? error?.response?.data?.errorCode;
          if (error?.response?.status === 409 || errorCode === 'SAVED_SEARCH_DUPLICATE') return;
          toast.error('Lưu tìm kiếm thất bại. Vui lòng thử lại sau.');
        },
      }
    );
  };

  return (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={handleSave}
        disabled={isPending}
        className={`px-4 py-2 flex items-center justify-center gap-2 transition-all ${
          isAlreadySaved
            ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-50'
            : 'border-main-primary text-main-primary hover:bg-purple-96'
        }`}
        title={isAlreadySaved ? 'Tìm kiếm này đã được lưu' : 'Lưu tìm kiếm'}
      >
        {isAlreadySaved ? <CheckCircle2 className='w-4 h-4' /> : <Bookmark className='w-4 h-4' />}
        <span className='hidden sm:inline'>{isAlreadySaved ? 'Đã lưu' : 'Lưu tìm kiếm'}</span>
      </Button>
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
