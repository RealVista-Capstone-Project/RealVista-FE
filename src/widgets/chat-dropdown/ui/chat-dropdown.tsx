'use client';

import { useState } from 'react';
import { MessageSquare, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/utils';
import { ChatConversationItem } from './chat-conversation-item';
import type { Conversation } from '@/entities/contact';

interface ChatDropdownProps {
  /**
   * List of conversations to display
   */
  conversations: Conversation[];
  /**
   * Total unread count for badge
   */
  unreadCount?: number;
  /**
   * Callback when conversation is clicked
   */
  onConversationClick?: (conversation: Conversation) => void;
  /**
   * Callback when "View all" is clicked
   */
  onViewAll?: () => void;
  /**
   * Callback when "Mark all as read" is clicked
   */
  onMarkAllRead?: () => void;
  /**
   * Dropdown alignment
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Additional CSS classes for trigger button
   */
  className?: string;
}

/**
 * ChatDropdown component
 * Header dropdown showing list of chat conversations (following notification dropdown pattern)
 */
export function ChatDropdown({
  conversations,
  unreadCount = 0,
  onConversationClick,
  onViewAll,
  onMarkAllRead,
  align = 'end',
  className,
}: ChatDropdownProps) {
  const t = useTranslations('Chat');
  const [open, setOpen] = useState(false);

  const displayedConversations = conversations.slice(0, 5);
  const hasMore = conversations.length > 5;

  const handleConversationClick = (conversation: Conversation) => {
    onConversationClick?.(conversation);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type='button'
          className={cn(
            'relative flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92',
            className
          )}
          aria-label={t('messages')}
        >
          <MessageSquare className='h-5 w-5' strokeWidth={2} />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 w-[360px] rounded-lg border border-purple-92 bg-white shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          {/* Header */}
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <div className='flex items-center gap-2'>
              <h3 className='text-base font-semibold text-main-black'>{t('messages')}</h3>
              {unreadCount > 0 && (
                <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white'>
                  {unreadCount} {t('new')}
                </span>
              )}
            </div>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type='button'
                onClick={onMarkAllRead}
                className='flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80'
              >
                <CheckCheck className='h-4 w-4' />
                {t('markAsRead')}
              </button>
            )}
          </div>

          {/* Conversations List */}
          <div className='max-h-[400px] overflow-y-auto'>
            {displayedConversations.length > 0 ? (
              <div className='flex flex-col divide-y divide-border'>
                {displayedConversations.map((conversation) => (
                  <ChatConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    onClick={handleConversationClick}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center gap-2 py-8 text-grey-500'>
                <MessageSquare className='h-10 w-10 opacity-50' />
                <p className='text-sm'>{t('noMessages')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasMore && (
            <div className='border-t border-border px-4 py-3'>
              <button
                type='button'
                onClick={() => {
                  onViewAll?.();
                  setOpen(false);
                }}
                className='text-sm font-medium text-primary transition-colors hover:text-primary/80'
              >
                {t('viewAllMessages')}
              </button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
