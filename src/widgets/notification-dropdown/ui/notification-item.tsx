'use client';

import { Home, UserCheck, Calendar, Bell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Notification } from '@/entities/notification';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

function getNotificationIcon(eventType: string) {
  if (eventType.includes('TOUR')) return { Icon: Calendar, bg: 'bg-emerald-500' };
  if (eventType.includes('APPLICATION')) return { Icon: UserCheck, bg: 'bg-orange-400' };
  if (eventType.includes('DRAFT') || eventType.includes('LISTING')) {
    return { Icon: Home, bg: 'bg-main-primary' };
  }
  return { Icon: Bell, bg: 'bg-grey-400' };
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

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { Icon, bg } = getNotificationIcon(notification.eventType);

  return (
    <button
      type='button'
      onClick={() => onClick?.(notification)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-purple-98',
        !notification.isRead && 'bg-purple-98/40'
      )}
    >
      {/* Left: text content */}
      <div className='flex-1 min-w-0'>
        <p
          className={cn(
            'text-sm leading-snug text-main-black',
            !notification.isRead ? 'font-semibold' : 'font-medium'
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className='mt-0.5 text-xs text-grey-500 line-clamp-2 leading-snug'>
            {notification.message}
          </p>
        )}
        <p className='mt-1 text-xs text-grey-400'>
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>

      {/* Right: event-type icon */}
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
  );
}
