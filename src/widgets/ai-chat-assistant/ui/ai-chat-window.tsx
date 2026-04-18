'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { X, Send, RotateCcw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AiChatMessageItem, TypingIndicator } from './ai-chat-message-item';
import type { AiChatMessage } from './ai-chat-message-item';
import type { AiQuotaStatus } from '../model/use-ai-chat';

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
  onNewChat?: () => void;
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
        'fixed bottom-24 right-6 z-[70] flex h-[520px] w-[380px] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl',
        'transition-all duration-200 ease-out',
        // Mobile: full-screen overlay
        'max-md:inset-0 max-md:bottom-0 max-md:right-0 max-md:h-full max-md:w-full max-md:rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className='flex items-center gap-3 bg-primary px-4 py-3'>
        <Image
          src='/images/ai-avatar.png'
          alt='AI Assistant'
          width={36}
          height={36}
          className='h-9 w-9 rounded-full object-cover'
        />
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-white'>{t('title')}</h3>
          <p className='text-xs text-white/70'>
            {quota && !quota.isUnlimited ? (
              <span>{t('dailyQuotaRemaining', { count: quota.remaining, total: quota.limit })}</span>
            ) : (
              t('subtitle')
            )}
          </p>
        </div>
        {/* New chat button */}
        {onNewChat && messages.length > 0 && (
          <button
            onClick={onNewChat}
            disabled={isClearing}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white',
              isClearing && 'pointer-events-none opacity-50'
            )}
            aria-label={t('newChat')}
            title={t('newChat')}
          >
            {isClearing ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RotateCcw className='h-4 w-4' />
            )}
          </button>
        )}
        <button
          onClick={onClose}
          className='flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white'
          aria-label={t('close')}
        >
          <X className='h-4.5 w-4.5' />
        </button>
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
        className='flex items-end gap-2 border-t border-border px-4 py-3 bg-white'
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          className='flex-1 max-h-32 min-h-[40px] resize-y overflow-y-auto bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground scrollbar-thin'
          disabled={isTyping || isClearing}
        />
        <button
          type='submit'
          disabled={!input.trim() || isTyping || isClearing}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
            input.trim() && !isTyping
              ? 'bg-primary text-white shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95'
              : 'bg-secondary text-muted-foreground'
          )}
          aria-label={t('send')}
        >
          <Send className='h-5 w-5' />
        </button>
      </form>
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
      {/* AI avatar */}
      <Image
        src='/images/ai-avatar.png'
        alt='AI Assistant'
        width={56}
        height={56}
        className='h-14 w-14 rounded-full object-cover'
      />

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
