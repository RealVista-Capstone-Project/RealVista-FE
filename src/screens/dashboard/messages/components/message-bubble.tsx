import { cn } from '@/shared/lib/utils';
import { ChatListingCard } from '@/features/chat-listing-card';
import type { Message } from '../types';
import type { ChatListingData } from '@/entities/contact';
import { AvatarCircle } from './avatar-circle';

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
    <div className={cn('group/message', isMe ? 'flex justify-end' : 'flex justify-start')}>
      {/* Received message: avatar left, content right */}
      {!isMe && (
        <div className='flex items-end gap-2.5 max-w-[75%]'>
          <div className='shrink-0'>
            <AvatarCircle initials={msg.sender.initials} avatarBg={msg.sender.avatarBg} src={msg.sender.avatar} size='md' />
          </div>

          <div className='flex flex-col gap-1'>
            <span className='ml-0.5 text-[13px] font-semibold text-slate-700'>{msg.sender.name}</span>

            <div className='flex flex-col gap-1.5'>
              {msg.text && (
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words bg-white text-slate-800 shadow-sm border border-slate-100',
                    msg.text.length <= 3 && 'px-3 py-1.5 text-base'
                  )}
                >
                  {msg.isLink ? (
                    <>
                      {msg.text.split('https://')[0]}
                      <a
                        href={`https://${msg.text.split('https://')[1]}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-blue-600 underline underline-offset-2 hover:opacity-80'
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
                <div className='w-full max-w-xs'>
                  <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md'>
                    <ChatListingCard
                      listing={msg.listing}
                      onClick={(l) => onListingClick?.(l)}
                      onCreateContract={
                        canCreateContractForListing(msg.listing) ? onCreateContract : undefined
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-[11px] font-medium text-slate-400'>{msg.time}</span>
              {msg.reactions?.map((r) => (
                <span
                  key={r.emoji}
                  className='flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600'
                >
                  {r.emoji} {r.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sent message: content left, avatar placeholder */}
      {isMe && (
        <div className='flex items-end gap-2.5 max-w-[75%]'>
          <div className='shrink-0 w-[44px]'>
            <AvatarCircle initials='ME' avatarBg='bg-blue-500' size='md' />
          </div>

          <div className='flex flex-col gap-1 items-end'>
            <div className='flex flex-col gap-1.5 items-end'>
              {msg.text && (
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words max-w-full bg-blue-500 text-white shadow-md shadow-blue-500/20',
                    msg.text.length <= 3 && 'px-3 py-1.5 text-base',
                    msg.text.length <= 3 ? 'whitespace-nowrap' : ''
                  )}
                >
                  {msg.isLink ? (
                    <>
                      {msg.text.split('https://')[0]}
                      <a
                        href={`https://${msg.text.split('https://')[1]}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-white/90 underline underline-offset-2 hover:opacity-80'
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
                <div className='w-full max-w-xs'>
                  <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md'>
                    <ChatListingCard
                      listing={msg.listing}
                      onClick={(l) => onListingClick?.(l)}
                      onCreateContract={
                        canCreateContractForListing(msg.listing) ? onCreateContract : undefined
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-[11px] font-medium text-blue-400/70'>{msg.time}</span>
              {msg.reactions?.map((r) => (
                <span
                  key={r.emoji}
                  className='flex items-center gap-0.5 rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-100'
                >
                  {r.emoji} {r.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
