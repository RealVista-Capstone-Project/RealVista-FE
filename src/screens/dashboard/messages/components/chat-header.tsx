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
    <header className='border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3.5 sm:px-6'>
      <div className='flex items-center justify-between gap-4'>
        {/* Left: Avatar + Name */}
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <AvatarCircle
              initials={conversation.initials}
              avatarBg={conversation.avatarBg}
              src={conversation.avatar}
              size='sm'
            />
            {conversation.isTyping && (
              <span className='absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-400' />
            )}
          </div>
          <div>
            <p className='text-[13px] font-bold text-slate-800 leading-tight'>{conversation.name}</p>
            {conversation.isTyping && (
              <p className='text-xs font-medium text-emerald-600'>
                {t('typing')}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className='flex items-center gap-1 shrink-0'>
          {/* Stacked participant avatars - hidden on mobile */}
          {conversation.participants && (
            <div className='hidden sm:flex items-center mr-1'>
              {conversation.participants.slice(0, 3).map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm',
                    p.avatarBg ?? 'bg-slate-400',
                    i > 0 && '-ml-2'
                  )}
                >
                  {p.initials}
                </div>
              ))}
              {conversation.participants.length > 3 && (
                <div
                  className='flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-bold text-white shadow-sm'
                >
                  +{conversation.participants.length - 3}
                </div>
              )}
            </div>
          )}
          <div className='mx-1 h-5 w-px bg-slate-200' />
          <button className='flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600' aria-label='Call'>
            <Phone className='size-4' />
          </button>
          <button className='flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600' aria-label='Video call'>
            <Video className='size-4' />
          </button>
          <button
            onClick={onToggleDetail}
            className={cn(
              'flex size-9 items-center justify-center rounded-xl transition-all',
              showDetail
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            )}
            aria-label='Conversation details'
          >
            <MoreHorizontal className='size-4' />
          </button>
        </div>
      </div>
    </header>
  );
}
