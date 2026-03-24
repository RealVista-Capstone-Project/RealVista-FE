'use client';

import { Home, UserCheck, Calendar, Bell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Notification, NotificationType } from '@/entities/notification';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'OPEN_DRAFT':
      return { Icon: Home, bg: 'bg-main-primary' };
    case 'TENANT_APPLICATION':
      return { Icon: UserCheck, bg: 'bg-orange-400' };
    case 'TOUR_REQUEST':
      return { Icon: Calendar, bg: 'bg-emerald-500' };
    default:
      return { Icon: Bell, bg: 'bg-grey-400' };
  }
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
  const { Icon, bg } = getNotificationIcon(notification.type);

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
        <p className='mt-1 text-xs text-grey-500'>
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>

      {/* Right: avatar or icon */}
      <div className='relative shrink-0'>
        {notification.actor?.avatar ? (
          <div className='relative'>
            <img
              src={notification.actor.avatar}
              alt={notification.actor.name}
              className='h-10 w-10 rounded-full object-cover'
            />
            {/* type badge overlay */}
            <span
              className={cn(
                'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full',
                bg
              )}
            >
              <Icon className='h-3 w-3 text-white' strokeWidth={2.5} />
            </span>
          </div>
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              bg
            )}
          >
            <Icon className='h-5 w-5 text-white' strokeWidth={2} />
          </div>
        )}
      </div>
    </button>
  );
}
