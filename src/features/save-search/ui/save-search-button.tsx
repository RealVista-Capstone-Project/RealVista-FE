'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { useSaveSearch, savedSearchQueries } from '@/entities/saved-search';
import { useAuthSession } from '@/features/auth/model';
import { customerProfileQueries, customerProfileApi } from '@/entities/customer-profile/api';
import type { CustomerProfile } from '@/entities/customer-profile/model/types';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import type { SearchType } from '@/entities/saved-search';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog/dialog';
import { Input } from '@/shared/ui/input/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select/select';

interface SaveSearchButtonProps {
  searchType: SearchType;
  criteria: Record<string, unknown>;
}

export function SaveSearchButton({ searchType, criteria }: SaveSearchButtonProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardId, setBoardId] = useState('Mặc định');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const { data: session } = useAuthSession();
  const { mutate: saveSearch, isPending } = useSaveSearch();
  const queryClient = useQueryClient();

  const t = useTranslations('SavedSearch');

  const { mutate: createProfile, isPending: isCreatingProfile } = useMutation({
    mutationFn: (name: string) => customerProfileApi.create({ profile_name: name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
      if (res?.payload?.data) {
        setSelectedProfileId(res.payload.data.customer_profile_id);
      }
      setIsAddingProfile(false);
      setNewProfileName('');
      toast.success('Đã tạo Profile mới thành công');
    },
    onError: () => toast.error('Tạo Profile thất bại'),
  });

  // Fetch available profiles for this user
  const { data: profilesResponse } = useQuery({
    ...customerProfileQueries.me(),
    enabled: !!session?.user,
  });
  const profiles: CustomerProfile[] = profilesResponse?.payload?.data || [];

  // When profiles load, set the default selection to the active profile
  if (!selectedProfileId && profiles.length > 0) {
    const activeProfile = profiles.find((p) => p.is_active);
    if (activeProfile) setSelectedProfileId(activeProfile.customer_profile_id);
    else setSelectedProfileId(profiles[0].customer_profile_id);
  }

  const handleSaveClick = () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    setShowBoardModal(true);
  };

  const submitSaveSearch = () => {
    saveSearch(
      {
        search_type: searchType,
        criteria: criteria as any,
        board_id: boardId.trim() || 'Mặc định',
        profile_id: selectedProfileId || undefined
      },
      {
        onSuccess: () => {
          toast.success(t('success'));
          setShowBoardModal(false);
        },
        onError: (error: any) => {
          const payload = error?.response?.data;
          const errorCode = payload?.payload?.error_code
            ?? payload?.error_code
            ?? payload?.errorCode;

          if (error?.response?.status === 409 || errorCode === 'SAVED_SEARCH_DUPLICATE') {
            toast.error(t('duplicateAlert'));
            return;
          }
          toast.error(t('error'));
        },
      }
    );
  };

  return (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={handleSaveClick}
        disabled={isPending}
        className='px-4 py-2 flex items-center justify-center gap-2 transition-all border-main-primary text-main-primary hover:bg-purple-96'
        title={t('buttonLabel')}
      >
        <Bookmark className='w-4 h-4' />
        <span className='hidden sm:inline'>{t('buttonLabel')}</span>
      </Button>
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <Dialog open={showBoardModal} onOpenChange={setShowBoardModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Lưu tìm kiếm</DialogTitle>
            <DialogDescription>
              Nhập tên nhóm để phân loại mục đích tìm kiếm của bạn (ví dụ: Nhà đầu tư, Thuê cho con học...)
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {profiles.length > 0 && (
              <div className='grid gap-2'>
                <div className='flex items-center justify-between'>
                  <label htmlFor='profileId' className='text-sm font-medium leading-none'>
                    Profile
                  </label>
                  {!isAddingProfile && (
                    <button
                      type='button'
                      onClick={() => setIsAddingProfile(true)}
                      className='text-xs text-main-primary hover:underline flex items-center gap-1 font-medium'
                    >
                      <Plus className='w-3 h-3' /> Thêm Profile
                    </button>
                  )}
                </div>

                {isAddingProfile ? (
                  <div className='flex items-center gap-2 mt-1'>
                    <Input
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder='Tên Profile mới...'
                      className='h-10 text-sm'
                      autoFocus
                    />
                    <Button
                      size='sm'
                      onClick={() => {
                        if (newProfileName.trim()) createProfile(newProfileName.trim());
                      }}
                      disabled={!newProfileName.trim() || isCreatingProfile}
                      className='h-10 shrink-0'
                    >
                      Lưu
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => setIsAddingProfile(false)}
                      className='h-10 shrink-0'
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn Profile' />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.customer_profile_id} value={p.customer_profile_id}>
                          {p.profile_name || 'Mặc định'} {p.is_active ? '(Đang chọn)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div className='grid gap-2 mt-2'>
              <label htmlFor='boardId' className='text-sm font-medium leading-none'>
                Tên nhóm / Tên tìm kiếm
              </label>
              <Input
                id='boardId'
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                placeholder='Nhập tên nhóm...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowBoardModal(false)}>
              Hủy
            </Button>
            <Button onClick={submitSaveSearch} disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu tìm kiếm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
