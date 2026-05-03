'use client';

import { FacebookIcon, LinkIcon } from '@/shared/ui/share-icons';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover/popover';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { useMemo } from 'react';
import { FacebookShareButton } from 'react-share';
import { RealVistaButton } from '@/shared/ui/realvista-button';

interface SharePopoverProps {
  url: string;
  title?: string;
  variant?: 'default' | 'icon';
}

export function SharePopover({ url, title, variant = 'default' }: SharePopoverProps) {
  const t = useTranslations('SharePopover');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ensure URL is available on client side
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined' && !url) {
      return window.location.href;
    }
    return url;
  }, [url]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('copySuccess'));
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <button
            type='button'
            className='flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background hover:bg-muted transition-colors'
          >
            <Share2 className='size-5' />
          </button>
        ) : (
          <RealVistaButton variant={'secondary'}>
            <Share2 className='size-4' />
            {t('share')}
          </RealVistaButton>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-44 p-2' align='end' sideOffset={8}>
        <div className='flex flex-col gap-1'>
          {/* Facebook */}
          <FacebookShareButton url={shareUrl} className='w-full' onClick={() => setOpen(false)}>
            <button
              type='button'
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left'
            >
              <FacebookIcon className='size-5 text-[#1877F2]' />
              <span className='text-sm font-medium text-foreground/80'>{t('facebook')}</span>
            </button>
          </FacebookShareButton>

          {/* Copy Link */}
          <button
            type='button'
            onClick={handleCopyLink}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left',
              copied && 'text-primary'
            )}
          >
            <LinkIcon className='size-5' />
            <span className='text-sm font-medium'>{copied ? t('copied') : t('copyLink')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
