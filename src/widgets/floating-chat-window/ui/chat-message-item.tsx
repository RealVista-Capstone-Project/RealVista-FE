'use client';

import { cn } from '@/shared/lib/utils';
import { ChatListingCard } from '@/features/chat-listing-card';
import type { ChatMessageData } from '@/entities/contact';

interface ChatMessageItemProps {
  /**
   * Message data
   */
  message: ChatMessageData;
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
 * ChatMessageItem component
 * Individual message bubble with optional embedded listing card
 */
export function ChatMessageItem({ message, onListingClick, className }: ChatMessageItemProps) {
  const { content, senderName, timestamp, isOwn, listing } = message;

  const formatTime = (date: Date | string | number) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start', className)}>
      {/* Sender name (only for received messages) */}
      {!isOwn && <span className='px-1 text-xs font-medium text-grey-500'>{senderName}</span>}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2',
          isOwn
            ? 'rounded-br-md bg-main-primary text-white'
            : 'rounded-bl-md bg-grey-100 text-main-black'
        )}
      >
        <p className='text-sm leading-relaxed'>{content}</p>
      </div>

      {/* Embedded listing card */}
      {listing && (
        <div className={cn('mt-1', isOwn ? 'mr-0' : 'ml-0')}>
          <ChatListingCard listing={listing} onClick={(l) => onListingClick?.(l.id)} />
        </div>
      )}

      {/* Timestamp */}
      <span className={cn('px-1 text-xs text-grey-400', isOwn ? 'text-right' : 'text-left')}>
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
