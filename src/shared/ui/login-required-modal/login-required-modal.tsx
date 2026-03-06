'use client';

import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog/dialog';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { ROUTES } from '@/shared/config/routes';

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ open, onClose }: LoginRequiredModalProps) {
  const locale = useLocale();
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push(`/${locale}${ROUTES.login}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-w-sm'>
        <DialogHeader className='items-center text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-96 mx-auto'>
            <LogIn className='h-7 w-7 text-main-primary' />
          </div>
          <DialogTitle className='text-center text-[18px]'>Đăng nhập để tiếp tục</DialogTitle>
          <DialogDescription className='text-center'>
            Bạn cần đăng nhập để sử dụng tính năng này.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='mt-2 flex flex-col gap-2 sm:flex-col'>
          <RealVistaButton variant='primary' size='medium' className='w-full' onClick={handleLogin}>
            Đăng nhập
          </RealVistaButton>
          <RealVistaButton variant='secondary' size='medium' className='w-full' onClick={onClose}>
            Hủy
          </RealVistaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
