'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Minus, Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ChatMessageItem } from './chat-message-item';
import type { ConversationParticipant, ChatMessageData, ChatListingData } from '@/entities/contact';

interface FloatingChatWindowProps {
  /**
   * Unique window ID
   */
  id: string;
  /**
   * Chat participant info
   */
  participant: ConversationParticipant;
  /**
   * Messages in the conversation
   */
  messages: ChatMessageData[];
  /**
   * Optional listing context for the conversation
   */
  listing?: ChatListingData;
  /**
   * Whether the window is minimized
   */
  isMinimized?: boolean;
  /**
   * Window position from right edge
   */
  position?: number;
  /**
   * Callback when window is closed
   */
  onClose?: () => void;
  /**
   * Callback when window is minimized/maximized
   */
  onMinimize?: () => void;
  /**
   * Callback when message is sent
   */
  onSendMessage?: (content: string) => void | Promise<void>;
  /**
   * Callback when listing card is clicked
   */
  onListingClick?: (listingId: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FloatingChatWindow component
 * Facebook Messenger-style floating chat window
 */
export function FloatingChatWindow({
  participant,
  messages,
  isMinimized = false,
  position = 0,
  onClose,
  onMinimize,
  onSendMessage,
  onListingClick,
  className,
}: FloatingChatWindowProps) {
  const t = useTranslations('Chat');
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Focus input when window is expanded
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage?.(inputValue.trim());
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate position offset (each window is 338px wide + 10px gap)
  const rightOffset = 20 + position * 348;

  return (
    <div
      className={cn(
        'fixed bottom-0 z-[80] flex flex-col rounded-t-xl border border-b-0 border-border bg-white shadow-xl',
        'transition-all duration-200',
        isMinimized ? 'h-12' : 'h-[420px]',
        'bottom-0 md:bottom-0 max-md:bottom-0',
        'max-md:hidden',
        className
      )}
      style={{
        width: '328px',
        right: `${rightOffset}px`,
      }}
    >
      {/* Header */}
      <div
        className={cn(
          'flex h-12 flex-shrink-0 items-center justify-between gap-3 rounded-t-xl border-b border-border px-3',
          'cursor-pointer bg-background hover:bg-muted'
        )}
        onClick={onMinimize}
      >
        <div className='flex items-center gap-2 overflow-hidden'>
          {/* Avatar */}
          {participant.avatar ? (
            <div className='relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full'>
              <Image
                src={participant.avatar}
                alt={participant.name}
                fill
                className='object-cover'
                sizes='28px'
              />
            </div>
          ) : (
            <div className='flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white'>
              <span className='text-xs font-bold'>{participant.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className='truncate text-sm font-semibold text-foreground'>{participant.name}</span>
        </div>

        {/* Window controls */}
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onMinimize?.();
            }}
            className='flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label={isMinimized ? t('expand') : t('minimize')}
          >
            <Minus className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className='flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            aria-label={t('close')}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Body (hidden when minimized) */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className='flex-1 overflow-y-auto p-3'>
            {messages.length > 0 ? (
              <div className='flex flex-col gap-3'>
                {messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onListingClick={onListingClick}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className='flex h-full items-center justify-center text-sm text-muted-foreground/50'>
                {t('startConversation')}
              </div>
            )}
          </div>

          {/* Input */}
          <div className='flex-shrink-0 p-2'>
            <div className='flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 via-yellow-50 to-sky-100 px-3 py-1.5 shadow-sm'>
              <input
                ref={inputRef}
                type='text'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessage')}
                disabled={isSending}
                className='flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50'
              />
              <button
                type='button'
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                  'bg-primary/10 hover:bg-primary/15',
                  !inputValue.trim() && !isSending && 'opacity-40'
                )}
                aria-label={t('send')}
              >
                {isSending ? (
                  <Loader2 className='h-4 w-4 animate-spin text-primary' />
                ) : (
                  <Send className='h-4 w-4 text-primary' />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
