'use client';

import { useRef, useState, useEffect } from 'react';
import { Plus, FileText, Mic, Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useAuthSession } from '@/features/auth/model';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTyping?: () => void;
  isSending?: boolean;
  isConnected?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  onTyping,
  isSending = false,
  isConnected = false,
}: MessageInputProps) {
  const t = useTranslations('Messages');
  const { data: session } = useAuthSession();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // Only owner and AGENT may see contract creation
  const canCreateContract =
    session?.user?.role === 'owner' || session?.user?.backendRoles?.includes('AGENT');

  // Close popover when clicking outside
  useEffect(() => {
    if (!popoverOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        plusBtnRef.current &&
        !plusBtnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popoverOpen]);

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <div className='border-t border-purple-92/50 bg-white px-6 py-4'>
      {/* Offline banner */}
      {!isConnected && (
        <p className='mb-2 text-center text-xs text-grey-400'>{t('connecting')}</p>
      )}
      <div className='flex items-center gap-3 rounded-2xl border border-purple-92 bg-white px-4 py-3 shadow-sm focus-within:border-main-primary/50 focus-within:ring-2 focus-within:ring-main-primary/10'>
        {/* Plus button with popover — only rendered for owner / AGENT */}
        {canCreateContract && (
          <div className='relative shrink-0'>
            <button
              ref={plusBtnRef}
              onClick={() => setPopoverOpen((v) => !v)}
              className={cn(
                'flex size-5 items-center justify-center rounded-full transition-colors',
                popoverOpen ? 'bg-main-primary text-white' : 'text-grey-400 hover:text-main-primary'
              )}
              aria-label='More actions'
            >
              <Plus className='size-4' />
            </button>

            {popoverOpen && (
              <div
                ref={popoverRef}
                className='absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-xl border border-purple-92 bg-white shadow-lg'
              >
                <button
                  onClick={() => {
                    setPopoverOpen(false);
                    router.push(ROUTES.dashboard.createRentalContract);
                  }}
                  className='flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-main-black transition-colors hover:bg-purple-98'
                >
                  <FileText className='size-4 shrink-0 text-main-primary' />
                  {t('createContract')}
                </button>
              </div>
            )}
          </div>
        )}

        <input
          type='text'
          placeholder={t('typeYourMessage')}
          value={value}
          disabled={isSending}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSend) {
              onSubmit();
            }
          }}
          className='flex-1 bg-transparent text-sm text-main-black placeholder:text-grey-400 focus:outline-none disabled:opacity-50'
        />

        {/* Send / Mic button */}
        {canSend ? (
          <button
            onClick={onSubmit}
            disabled={isSending}
            className='shrink-0 text-main-primary transition-colors hover:text-main-primary/70 disabled:opacity-50'
            aria-label='Send message'
          >
            {isSending ? <Loader2 className='size-5 animate-spin' /> : <Send className='size-5' />}
          </button>
        ) : (
          <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
            <Mic className='size-5' />
          </button>
        )}
      </div>
    </div>
  );
}
