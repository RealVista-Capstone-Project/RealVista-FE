import { cn } from '@/shared/lib/utils';
import { ChatListingCard } from '@/features/chat-listing-card';
import type { Message } from '../types';
import { AvatarCircle } from './avatar-circle';

interface MessageBubbleProps {
  msg: Message;
  onListingClick?: (listing: import('@/entities/contact').ChatListingData) => void;
}

export function MessageBubble({ msg, onListingClick }: MessageBubbleProps) {
  const isMe = msg.sender.id === 'me';

  return (
    <div className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
      {!isMe && (
        <AvatarCircle initials={msg.sender.initials} avatarBg={msg.sender.avatarBg} src={msg.sender.avatar} size='md' />
      )}

      <div className={cn('flex max-w-[65%] flex-col gap-1', isMe && 'items-end')}>
        {!isMe && <span className='text-xs font-semibold text-main-black'>{msg.sender.name}</span>}

        {msg.text && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isMe
                ? 'rounded-tr-sm bg-main-primary text-white'
                : 'rounded-tl-sm bg-white text-main-black shadow-sm',
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
                  className='text-main-primary underline'
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
            />
          </div>
        )}

        <div className={cn('flex items-center gap-2', isMe && 'flex-row-reverse')}>
          <span className='text-xs text-grey-400'>{msg.time}</span>
          {msg.reactions?.map((r) => (
            <span
              key={r.emoji}
              className='flex items-center gap-1 rounded-full bg-purple-96 px-2 py-0.5 text-xs'
            >
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
