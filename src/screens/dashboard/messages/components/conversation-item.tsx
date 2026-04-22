import { cn } from '@/shared/lib/utils';
import type { Conversation } from '../types';
import { AvatarCircle } from './avatar-circle';

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conv, isActive, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
        isActive
          ? 'bg-blue-500/5 shadow-sm'
          : 'hover:bg-slate-50/50',
      )}
    >
      <div className='relative shrink-0'>
        <AvatarCircle initials={conv.initials} avatarBg={conv.avatarBg} src={conv.avatar} size='md' />
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white transition-opacity',
          conv.isTyping ? 'size-3 bg-emerald-400' : 'bg-white',
        )} />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2 mb-0.5'>
          <span className={cn(
            'truncate text-[13px] font-semibold',
            isActive ? 'text-slate-900' : 'text-slate-700',
          )}>
            {conv.name}
          </span>
          <span className={cn(
            'shrink-0 text-[11px] tabular-nums',
            (conv.unread ?? 0) > 0 ? 'font-semibold text-blue-600' : 'text-slate-400',
          )}>
            {conv.time}
          </span>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <p
            className={cn(
              'truncate text-xs leading-relaxed',
              conv.isTyping ? 'text-emerald-600' : 'text-slate-500',
            )}
          >
            {conv.lastMessage}
          </p>
          {(conv.unread ?? 0) > 0 && (
            <span className='flex shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white min-w-[20px] h-5 px-1 shadow-sm'>
              {(conv.unread ?? 0) > 99 ? '99+' : conv.unread!}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
