import { cn } from '@/shared/lib/utils';
import { ChatListingCard } from '@/features/chat-listing-card';
import type { Message } from '../types';
import type { ChatListingData } from '@/entities/contact';

interface MessageBubbleProps {
  msg: Message;
  onListingClick?: (listing: ChatListingData) => void;
  onCreateContract?: (listing: ChatListingData) => void;
  /** Current user's ID — used to gate "Create Contract" to listing owner/agent only */
  currentUserId?: string;
}

export function MessageBubble({ msg, onListingClick, onCreateContract, currentUserId }: MessageBubbleProps) {
  const isMe = msg.sender.id === 'me';

  /**
   * Show "Create Contract" when:
   * 1. The current user owns or manages this listing (ownerId / agentId match)
   *    — if the card has no ownership data (legacy messages), fall back to showing the button
   * 2. Listing status is PUBLISHED (available) — or unknown (legacy fallback)
   *
   * Note: role-gating (owner/agent only) is handled upstream in messages-page.tsx
   * by passing onCreateContract={undefined} for buyers/tenants, so no isMe check needed.
   */
  const canCreateContractForListing = (listing: ChatListingData): boolean => {
    if (!currentUserId) return false;

    // If the card carries ownership data, at least one field must match.
    // Only a field that is explicitly set (non-empty) can disqualify the user.
    const ownerSet = !!listing.ownerId;
    const agentSet = !!listing.agentId;
    if (ownerSet || agentSet) {
      const ownerMatch = ownerSet && listing.ownerId === currentUserId;
      const agentMatch = agentSet && listing.agentId === currentUserId;
      if (!ownerMatch && !agentMatch) return false;
    }
    // No ownership data at all (legacy card) → allowed; role gate is upstream.

    if (listing.listingStatus && listing.listingStatus !== 'PUBLISHED') return false;
    return true;
  };

  return (
    <div className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
      <div className={cn('flex max-w-[65%] flex-col gap-1', isMe && 'items-end')}>
        {msg.text && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed transition-shadow hover:shadow-md',
              isMe
                ? 'rounded-tr-sm bg-blue-500 text-white shadow-sm'
                : 'rounded-tl-sm bg-white text-slate-800 shadow-sm border border-slate-100',
              msg.isLink && 'break-all'
            )}
          >
            {msg.isLink ? (
              <>
                {msg.text.split('https://')[0]}
                <a
                  href={`https://${msg.text.split('https://')[1]}`}
                  target='_blank'
                  rel='noreferrer'
                  className={cn('underline', isMe ? 'text-white/90' : 'text-blue-600')}
                >
                  https://{msg.text.split('https://')[1]}
                </a>
              </>
            ) : (
              msg.text
            )}
          </div>
        )}

        {/* Embedded property listing card */}
        {msg.listing && (
          <div className={cn('mt-1', isMe ? 'mr-0' : 'ml-0')}>
            <ChatListingCard
              listing={msg.listing}
              onClick={(l) => onListingClick?.(l)}
              onCreateContract={
                canCreateContractForListing(msg.listing) ? onCreateContract : undefined
              }
            />
          </div>
        )}

        <div className={cn('flex items-center gap-2', isMe && 'flex-row-reverse')}>
          <span className={cn('text-xs', isMe ? 'text-blue-200' : 'text-slate-400')}>{msg.time}</span>
          {msg.reactions?.map((r) => (
            <span
              key={r.emoji}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-shadow hover:shadow-sm',
                isMe ? 'bg-blue-400/30 text-white' : 'bg-slate-50 border border-slate-100 text-slate-600'
              )}
            >
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
