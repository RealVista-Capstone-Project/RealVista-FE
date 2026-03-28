'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

export interface AiChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AiChatMessageItemProps {
  message: AiChatMessage;
  className?: string;
}

/**
 * AiChatMessageItem - renders a single AI or user message bubble.
 * User messages: right-aligned purple bubble.
 * AI messages: left-aligned with small Sparkles avatar.
 */
export function AiChatMessageItem({ message, className }: AiChatMessageItemProps) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row', className)}>
      {/* AI avatar */}
      {!isUser && (
        <Image
          src='/images/ai-avatar.png'
          alt='AI'
          width={28}
          height={28}
          className='h-7 w-7 shrink-0 rounded-full object-cover'
        />
      )}

      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-md bg-main-primary text-white'
              : 'rounded-bl-md bg-grey-100 text-main-black'
          )}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className='px-1 text-[11px] text-grey-400'>{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  className?: string;
}

/**
 * TypingIndicator - three bouncing dots shown while AI is "thinking".
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <Image
        src='/images/ai-avatar.png'
        alt='AI'
        width={28}
        height={28}
        className='h-7 w-7 shrink-0 rounded-full object-cover'
      />
      <div className='flex items-center gap-1 rounded-2xl rounded-bl-md bg-grey-100 px-4 py-3'>
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-grey-400 [animation-delay:0ms]' />
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-grey-400 [animation-delay:150ms]' />
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-grey-400 [animation-delay:300ms]' />
      </div>
    </div>
  );
}
