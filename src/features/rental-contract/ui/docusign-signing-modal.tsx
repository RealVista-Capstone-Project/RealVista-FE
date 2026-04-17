'use client';

import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Copy, ExternalLink, FileSignature, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

interface DocuSignSigningModalProps {
  open: boolean;
  signingUrl: string;
  /** 'landlord' | 'renter' */
  signerRole: 'landlord' | 'renter';
  onClose: () => void;
}

export function DocuSignSigningModal({
  open,
  signingUrl,
  signerRole,
  onClose,
}: DocuSignSigningModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text in the input
    }
  };

  const handleOpenDocuSign = () => {
    window.open(signingUrl, '_blank', 'noopener,noreferrer');
  };

  const isLandlord = signerRole === 'landlord';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
            'overflow-hidden rounded-3xl border border-primary/20 bg-white p-0',
            'shadow-primary/20',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
          )}
        >
          {/* Header */}
          <div className='relative rounded-t-3xl bg-linear-to-br from-primary to-primary-active px-6 pb-5 pt-6'>
            <button
              type='button'
              onClick={onClose}
              className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25 hover:text-white'
            >
              <X className='h-4 w-4' />
            </button>

            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm'>
              <FileSignature className='h-6 w-6 text-white' />
            </div>

            <DialogHeader className='mt-4 space-y-1 text-left'>
              <DialogTitle className='text-lg font-semibold text-white'>
                {isLandlord ? 'Ký hợp đồng (Chủ nhà)' : 'Ký hợp đồng (Người thuê)'}
              </DialogTitle>
              <DialogDescription className='text-sm leading-6 text-white/75'>
                {isLandlord
                  ? 'Đường dẫn DocuSign đã sẵn sàng. Bạn có thể mở ngay hoặc lưu lại để ký sau.'
                  : 'Gửi đường dẫn này cho người thuê, hoặc mở để bắt đầu phiên ký.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className='space-y-4 px-6 py-5'>
            {/* URL display */}
            <div className='space-y-1.5'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70'>
                Đường dẫn ký
              </p>
              <div className='flex items-center gap-2 overflow-hidden rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5'>
                <span className='flex-1 truncate text-xs text-muted-foreground font-mono'>
                  {signingUrl}
                </span>
                <button
                  type='button'
                  onClick={handleCopy}
                  className='flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/30 transition-colors hover:bg-primary/10'
                >
                  {copied ? (
                    <>
                      <Check className='h-3.5 w-3.5 text-green-500' />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className='h-3.5 w-3.5' />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
              <p className='text-[11px] text-muted-foreground/70'>
                Lưu ý: Đường dẫn này có hiệu lực trong khoảng 5 phút.
              </p>
            </div>

            {/* Divider */}
            <div className='flex items-center gap-3'>
              <div className='h-px flex-1 bg-primary/15' />
              <span className='text-xs text-muted-foreground/60'>hoặc</span>
              <div className='h-px flex-1 bg-primary/15' />
            </div>

            {/* Actions */}
            <div className='flex flex-col gap-2.5'>
              <Button
                type='button'
                className='h-11 w-full rounded-xl bg-primary text-white shadow-primary/30 hover:bg-primary-hover'
                onClick={handleOpenDocuSign}
              >
                <ExternalLink className='h-4 w-4' />
                Mở DocuSign ngay
              </Button>

              <Button
                type='button'
                variant='outline'
                className='h-11 w-full rounded-xl border-primary/30 bg-white text-muted-foreground hover:bg-primary/5'
                onClick={onClose}
              >
                Ký sau
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
