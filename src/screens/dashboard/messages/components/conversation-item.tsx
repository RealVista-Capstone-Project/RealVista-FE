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
        'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors',
        isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
      )}
    >
      <AvatarCircle initials={conv.initials} avatarBg={conv.avatarBg} src={conv.avatar} size='md' />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <span className={cn(
            'truncate text-sm font-semibold',
            isActive ? 'text-slate-800' : 'text-slate-600'
          )}>
            {conv.name}
          </span>
          <span className={cn(
            'shrink-0 text-xs',
            conv.unread ? 'font-bold text-blue-600' : 'text-slate-400'
          )}>
            {conv.time}
          </span>
        </div>
        <div className='flex items-center justify-between gap-2 mt-1'>
          <p
            className={cn(
              'truncate text-xs',
              conv.isTyping ? 'font-medium text-emerald-600' : 'text-slate-400'
            )}
          >
            {conv.lastMessage}
          </p>
          {!!conv.unread && (
            <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white'>
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
