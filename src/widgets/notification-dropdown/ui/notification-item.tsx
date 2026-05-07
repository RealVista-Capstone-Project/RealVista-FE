'use client';

import { X, Home, UserCheck, Calendar, Bell, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Notification } from '@/entities/notification';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_ICON_ENTRY = { Icon: Bell as LucideIcon, bg: 'bg-muted-foreground/50' };

function getNotificationIcon(eventType: Notification['eventType']): { Icon: LucideIcon; bg: string } {
  if (eventType.includes('TOUR')) return { Icon: Calendar, bg: 'bg-emerald-500' };
  if (eventType.includes('APPLICATION') || eventType.includes('ENGAGEMENT')) {
    return { Icon: UserCheck, bg: 'bg-orange-400' };
  }
  if (eventType === 'PRICE_CHANGE') return { Icon: TrendingDown, bg: 'bg-violet-600' };
  if (eventType.includes('DRAFT') || eventType.includes('LISTING')) {
    return { Icon: Home, bg: 'bg-primary' };
  }
  return DEFAULT_ICON_ENTRY;
}

function formatNotificationDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const { Icon, bg } = getNotificationIcon(notification.eventType);

  return (
    <div
      className={cn(
        'w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/5 group border-l-4',
        !notification.isRead
          ? 'bg-primary/5 border-primary'
          : 'border-transparent'
      )}
    >
      {/* Clickable content area */}
      <button
        type='button'
        onClick={() => onClick?.(notification)}
        className='flex-1 flex items-start gap-3 min-w-0 text-left'
      >
        {/* Left: text content */}
        <div className='flex-1 min-w-0'>
          <p
            className={cn(
              'text-sm leading-snug text-foreground',
              !notification.isRead ? 'font-semibold' : 'font-medium'
            )}
          >
            {notification.title}
          </p>
          {notification.message && (
            <p className='mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-snug'>
              {notification.message}
            </p>
          )}
          <p className='mt-1 text-xs text-muted-foreground/50'>
            {formatNotificationDate(notification.createdAt)}
          </p>
        </div>

        {/* Right: event-type icon — inside button so click navigates */}
        <div className='shrink-0'>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              bg
            )}
          >
            <Icon className='h-5 w-5 text-white' strokeWidth={2} />
          </div>
        </div>
      </button>

      {/* Far right: delete button — in flow, never overlaps icon */}
      {onDelete && (
        <button
          type='button'
          aria-label='Delete notification'
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className='shrink-0 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10'
        >
          <X className='h-3.5 w-3.5' strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
