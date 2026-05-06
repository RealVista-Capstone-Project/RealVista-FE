import { MoreHorizontal } from 'lucide-react';
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
    <header className='flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-3 backdrop-blur-sm'>
      {/* Left: Avatar + Name */}
      <div className='flex items-center gap-3'>
        <div className='relative'>
          <AvatarCircle
            initials={conversation.initials}
            avatarBg={conversation.avatarBg}
            src={conversation.avatar}
            size='md'
          />
          <span className='absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-400' />
        </div>
        <div>
          <p className='text-sm font-bold text-slate-800'>{conversation.name}</p>
          {conversation.isTyping ? (
            <p className='text-xs font-semibold text-emerald-600'>{t('typing')}</p>
          ) : (
            <p className='text-xs font-medium text-emerald-500'>Online</p>
          )}
        </div>
      </div>

      {/* Right: Participant Avatars + Action Buttons */}
      <div className='flex items-center gap-1'>
        {/* Stacked participant avatars */}
        {conversation.participants && (
          <div className='hidden sm:flex items-center'>
            {conversation.participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm',
                  p.avatarBg ?? 'bg-muted-foreground/60'
                )}
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {p.initials}
              </div>
            ))}
            {conversation.participants.length > 3 && (
              <div
                className='flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs font-bold text-white shadow-sm'
                style={{ marginLeft: -8 }}
              >
                +{conversation.participants.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
