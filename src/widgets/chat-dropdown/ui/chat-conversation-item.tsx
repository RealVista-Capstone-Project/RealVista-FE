'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import type { Conversation } from '@/entities/contact';

interface ChatConversationItemProps {
  /**
   * Conversation data
   */
  conversation: Conversation;
  /**
   * Callback when conversation is clicked
   */
  onClick?: (conversation: Conversation) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatConversationItem component
 * Individual conversation item in the chat dropdown
 */
export function ChatConversationItem({
  conversation,
  onClick,
  className,
}: ChatConversationItemProps) {
  const { participant, lastMessage, lastMessageTime, unreadCount, listing } = conversation;

  return (
    <button
      type='button'
      onClick={() => onClick?.(conversation)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5',
        unreadCount > 0 && 'bg-primary/10',
        className
      )}
    >
      {/* Avatar */}
      <div className='relative flex-shrink-0'>
        {participant.avatar ? (
          <div className='relative h-10 w-10 overflow-hidden rounded-full'>
            <Image
              src={participant.avatar}
              alt={participant.name}
              fill
              className='object-cover'
              sizes='40px'
            />
          </div>
        ) : (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white'>
            <span className='text-sm font-bold'>{participant.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className={cn(
              'truncate text-sm text-foreground',
              unreadCount > 0 ? 'font-semibold' : 'font-medium'
            )}
          >
            {participant.name}
          </span>
          <span className='flex-shrink-0 text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: false })}
          </span>
        </div>

        <p
          className={cn(
            'line-clamp-1 text-sm',
            unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          {lastMessage}
        </p>

        {/* Listing preview (if available) */}
        {listing && (
          <div className='mt-1 flex items-center gap-2 rounded bg-muted/50 px-2 py-1'>
            <div className='relative h-6 w-8 flex-shrink-0'>
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                className='rounded object-cover'
                sizes='32px'
              />
            </div>
            <span className='truncate text-xs text-muted-foreground/80'>{listing.title}</span>
          </div>
        )}
      </div>
    </button>
  );
}
