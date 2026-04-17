'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, PlusCircle } from 'lucide-react';
import { customerProfileQueries, customerProfileApi } from '@/entities/customer-profile/api';
import type { CustomerProfile } from '@/entities/customer-profile/model/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function GlobalProfileSwitcher() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations('Navigation');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const { data, isLoading } = useQuery({
    ...customerProfileQueries.me(),
  });

  const profiles: CustomerProfile[] = data?.payload?.data || [];
  const activeProfile = profiles.find((p) => p.is_active);

  const { mutate: switchProfile, isPending } = useMutation({
    mutationFn: (profileId: string) => customerProfileApi.switchActive(profileId),
    onSuccess: () => {
      // Soft refresh: Invalidate all queries and refresh server components
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
      // Auto switch to newly created profile
      const newId = res.payload?.data?.customer_profile_id;
      if (newId) switchProfile(newId);
      else queryClient.invalidateQueries({ queryKey: customerProfileQueries.me().queryKey });
    },
    onError: () => {
      toast.error('Tạo Profile thất bại');
    },
  });

  if (isLoading || profiles.length === 0) return null;

  return (
    <>
      <div className='flex items-center gap-1 rounded-lg border border-purple-92 px-2 hover:bg-purple-98 transition-colors group'>
        <Sparkles className='h-4 w-4 text-main-primary animate-pulse group-hover:scale-110 transition-transform' />
        <Select
          value={activeProfile?.customer_profile_id || ''}
          onValueChange={(val) => {
            if (val === 'CREATE_NEW') {
              setShowCreateDialog(true);
              return;
            }
            if (val === activeProfile?.customer_profile_id) return;
            switchProfile(val);
          }}
          disabled={isPending}
        >
          <SelectTrigger className='h-9 min-w-[140px] border-none bg-transparent font-medium shadow-none outline-none focus:ring-0 focus:ring-offset-0 px-2'>
            <SelectValue placeholder={t('switchPersona')} />
          </SelectTrigger>
          <SelectContent align='end'>
            {profiles.map((p) => (
              <SelectItem key={p.customer_profile_id} value={p.customer_profile_id}>
                {p.profile_name || 'Mặc định'}
              </SelectItem>
            ))}
            <div className='border-t border-purple-92 my-1' />
            <SelectItem value='CREATE_NEW' className='text-main-primary font-bold focus:bg-purple-98 focus:text-main-primary'>
              <div className='flex items-center gap-2'>
                <PlusCircle className='h-4 w-4' />
                <span>Thêm Profile</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            <Button variant='outline' onClick={() => setShowCreateDialog(false)}>Hủy</Button>
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
