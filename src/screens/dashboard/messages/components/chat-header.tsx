import { Phone, Video, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { Conversation } from '../types';
import { AvatarCircle } from './avatar-circle';

interface ChatHeaderProps {
  conversation: Conversation;
  showDetail: boolean;
  onToggleDetail: () => void;
}

export function ChatHeader({ conversation, showDetail, onToggleDetail }: ChatHeaderProps) {
  const t = useTranslations('Messages');
  return (
    <div className='flex items-center justify-between border-b border-primary/20/50 bg-white px-6 py-3'>
      {/* Left: Avatar + Name */}
      <div className='flex items-center gap-3'>
        <AvatarCircle
          initials={conversation.initials}
          avatarBg={conversation.avatarBg}
          src={conversation.avatar}
          size='md'
        />
        <div>
          <p className='text-sm font-bold text-foreground'>{conversation.name}</p>
          {conversation.isTyping && (
            <p className='text-xs font-medium text-primary'>{t('typing')}</p>
          )}
        </div>
      </div>

      {/* Right: Participant Avatars + Action Buttons */}
      <div className='flex items-center gap-4'>
        {/* Stacked participant avatars */}
        {conversation.participants && (
          <div className='flex items-center'>
            {conversation.participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white',
                  p.avatarBg ?? 'bg-muted-foreground/60'
                )}
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {p.initials}
              </div>
            ))}
            {conversation.participants.length > 3 && (
              <div
                className='flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-bold text-white'
                style={{ marginLeft: -8 }}
              >
                +{conversation.participants.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className='flex items-center gap-1'>
          <button className='flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary'>
            <Phone className='size-4' />
          </button>
          <button className='flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary'>
            <Video className='size-4' />
          </button>
          <button
            onClick={onToggleDetail}
            className={cn(
              'flex size-9 items-center justify-center rounded-xl transition-colors',
              showDetail
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
            )}
          >
            <MoreHorizontal className='size-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
