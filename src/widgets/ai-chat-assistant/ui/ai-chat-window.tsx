'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { ChevronLeft, RefreshCw, Send, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AiChatMessageItem, TypingIndicator } from './ai-chat-message-item';
import type { AiChatMessage } from './ai-chat-message-item';
import type { AiQuotaStatus } from '../model/use-ai-chat';
import { Button } from '@/shared/ui/button';

interface AiChatWindowProps {
  messages: AiChatMessage[];
  isTyping: boolean;
  isLoadingHistory?: boolean;
  isClearing?: boolean;
  error?: string | null;
  quota?: AiQuotaStatus | null;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  onQuickAction: (text: string) => void;
  /** Clears conversation and resets history (reload / new chat). */
  onNewChat?: () => void | Promise<void>;
  className?: string;
}

/**
 * AiChatWindow - The main chat panel.
 * 380x520px, header with AI branding, scrollable messages area,
 * welcome state with quick-action chips, and an input bar.
 */
export function AiChatWindow({
  messages,
  isTyping,
  isLoadingHistory,
  isClearing,
  error,
  quota,
  onSendMessage,
  onClose,
  onQuickAction,
  onNewChat,
  className,
}: AiChatWindowProps) {
  const t = useTranslations('AiAssistant');
  const [input, setInput] = React.useState('');
  const [refreshConfirmOpen, setRefreshConfirmOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = React.useRef(false);
  const locale = useLocale();

  const showWelcome = messages.length === 0;

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, error]);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-grow textarea up to 5 lines based on content
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const paddingY = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
    const maxHeight = lineHeight * 5 + paddingY;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    onSendMessage(trimmed);
    setInput('');

    // Reset submission lock after a short delay or when message area updates
    setTimeout(() => { isSubmittingRef.current = false; }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  React.useEffect(() => {
    if (!refreshConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClearing) setRefreshConfirmOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [refreshConfirmOpen, isClearing]);

  const handleConfirmRefresh = async () => {
    if (!onNewChat) return;
    try {
      await onNewChat();
    } finally {
      setRefreshConfirmOpen(false);
    }
  };

  const quickActions = [
    { key: 'chipFindProperties', text: t('chipFindProperties') },
    { key: 'chipAverageRent', text: t('chipAverageRent') },
    { key: 'chipCompareListings', text: t('chipCompareListings') },
    { key: 'chipMarketTrend', text: t('chipMarketTrend') },
    { key: 'chipInvestment', text: t('chipInvestment') },
  ];

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-[90] flex h-[520px] w-[380px] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl',
        'transition-all duration-200 ease-out',
        // Mobile: full-screen overlay
        'max-md:inset-0 max-md:bottom-0 max-md:right-0 max-md:h-full max-md:w-full max-md:rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className='flex items-center gap-3 border-b border-border bg-white px-3 py-3'>
        <button
          onClick={onClose}
          className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground'
          aria-label={t('close')}
        >
          <ChevronLeft className='h-5 w-5' />
        </button>
        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-semibold text-foreground'>{t('title')}</h3>
          <p className='truncate text-xs text-muted-foreground'>
            {quota && !quota.isUnlimited ? (
              <span>{t('dailyQuotaRemaining', { count: quota.remaining, total: quota.limit })}</span>
            ) : (
              t('subtitle')
            )}
          </p>
        </div>
        {onNewChat && (
          <button
            type='button'
            onClick={() => setRefreshConfirmOpen(true)}
            disabled={isTyping || isClearing || isLoadingHistory}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150',
              'hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-40'
            )}
            aria-label={t('refreshChat')}
            title={t('refreshChat')}
          >
            {isClearing ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
          </button>
        )}
        {/* AI avatar - top right */}
        <div className='relative shrink-0'>
          <Image
            src='/assistant.jpg'
            alt='AI Assistant'
            width={32}
            height={32}
            className='h-8 w-8 rounded-full object-contain p-0.5'
          />
          <span className='absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500' />
        </div>
      </div>

      {/* Messages area */}
      <div className='flex-1 overflow-y-auto px-4 py-3'>
        {isLoadingHistory ? (
          <LoadingState message={t('loadingHistory')} />
        ) : showWelcome ? (
          <WelcomeState
            welcomeMessage={t('welcomeMessage')}
            quickActions={quickActions}
            onQuickAction={onQuickAction}
          />
        ) : (
          <div className='flex flex-col gap-3'>
            {messages.map((msg) => (
              <AiChatMessageItem key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            {error && (
              <ErrorBanner
                message={error}
                isQuota={error === 'QUOTA_EXCEEDED'}
                subscribeUrl={`/${locale}/subscribe`}
                t={t}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className='bg-white px-4 py-3'
      >
        <div className='flex items-end gap-2 rounded-full bg-gradient-to-r from-violet-100 via-sky-50 to-sky-100 px-2 py-1.5 shadow-sm ring-1 ring-black/5'>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            className='flex-1 resize-none bg-transparent px-3 py-1.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground scrollbar-thin'
            disabled={isTyping || isClearing}
          />
          <button
            type='submit'
            disabled={!input.trim() || isTyping || isClearing}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all duration-200',
              input.trim() && !isTyping
                ? 'hover:bg-primary/90 hover:scale-105 active:scale-95'
                : 'opacity-60'
            )}
            aria-label={t('send')}
          >
            <Send className='h-4 w-4' />
          </button>
        </div>
      </form>

      {refreshConfirmOpen && onNewChat && (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='ai-chat-refresh-title'
          className='absolute inset-0 z-[80] flex items-center justify-center bg-black/45 p-4'
          onClick={() => !isClearing && setRefreshConfirmOpen(false)}
        >
          <div
            className='w-full max-w-sm rounded-xl border border-border bg-white p-4 shadow-lg'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id='ai-chat-refresh-title' className='text-base font-semibold text-foreground'>
              {t('confirmRefreshTitle')}
            </h2>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
              {t('confirmRefreshDescription')}
            </p>
            <div className='mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='ghost'
                disabled={isClearing}
                onClick={() => setRefreshConfirmOpen(false)}
              >
                {t('confirmRefreshCancel')}
              </Button>
              <Button
                type='button'
                disabled={isClearing}
                onClick={() => void handleConfirmRefresh()}
              >
                {isClearing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('confirmRefreshConfirm')}
                  </>
                ) : (
                  t('confirmRefreshConfirm')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Loading state sub-component ---------- */

function LoadingState({ message }: { message: string }) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3'>
      <Loader2 className='h-6 w-6 animate-spin text-primary' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}

/* ---------- Error banner sub-component ---------- */

function ErrorBanner({
  message,
  isQuota,
  subscribeUrl,
  t
}: {
  message: string;
  isQuota?: boolean;
  subscribeUrl?: string;
  t: (key: string) => string;
}) {
  if (isQuota) {
    return (
      <div className='flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2'>
        <div className='flex items-start gap-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Sparkles className='h-5 w-5' />
          </div>
          <div className='flex-1'>
            <h4 className='text-sm font-bold text-primary'>{t('quotaExceeded')}</h4>
            <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
              {t('quotaExceededDesc')}
            </p>
          </div>
        </div>
        <Link
          href={subscribeUrl || '/subscribe'}
          className='group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95'
        >
          <span className='z-10'>{t('buyMore')}</span>
          <div className='absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer' />
        </Link>
      </div>
    );
  }

  return (
    <div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2'>
      <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-red-500' />
      <p className='text-xs leading-relaxed text-red-700'>{message}</p>
    </div>
  );
}

/* ---------- Welcome sub-component ---------- */

interface WelcomeStateProps {
  welcomeMessage: string;
  quickActions: { key: string; text: string }[];
  onQuickAction: (text: string) => void;
}

function WelcomeState({ welcomeMessage, quickActions, onQuickAction }: WelcomeStateProps) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-5 px-2'>
      <p className='text-center text-sm leading-relaxed text-muted-foreground'>{welcomeMessage}</p>

      {/* Quick-action chips */}
      <div className='flex flex-col gap-2 self-stretch'>
        {quickActions.map((action) => (
          <button
            key={action.key}
            onClick={() => onQuickAction(action.text)}
            className='cursor-pointer rounded-xl border border-border px-4 py-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:border-primary hover:bg-primary/5 hover:text-primary'
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  );
}
