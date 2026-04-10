'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
 * User messages: right-aligned purple bubble (plain text).
 * AI messages: left-aligned with avatar, rendered as markdown.
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
          {isUser ? (
            message.content
          ) : (
            <div className='prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-blockquote:my-1 prose-hr:my-2 prose-table:my-2 prose-a:text-main-primary prose-a:underline prose-code:rounded prose-code:bg-grey-200 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-lg prose-pre:bg-grey-200'>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Open links in a new tab
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  a: ({ children, ...props }: any) => (
                    <a {...props} target='_blank' rel='noopener noreferrer'>
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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
