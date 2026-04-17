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
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        isActive ? 'bg-primary/5' : 'hover:bg-primary/5'
      )}
    >
      <AvatarCircle initials={conv.initials} avatarBg={conv.avatarBg} src={conv.avatar} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between'>
          <span className='truncate text-sm font-semibold text-foreground'>{conv.name}</span>
          <span className='ml-2 shrink-0 text-xs text-muted-foreground/60'>{conv.time}</span>
        </div>
        <p
          className={cn(
            'truncate text-xs',
            conv.isTyping ? 'font-medium text-primary' : 'text-muted-foreground'
          )}
        >
          {conv.lastMessage}
        </p>
      </div>
      {!!conv.unread && (
        <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white'>
          {conv.unread}
        </span>
      )}
    </button>
  );
}
