'use client';

import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/utils';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/entities/notification';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount?: number;
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
  onMarkAllRead?: () => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function NotificationDropdown({
  notifications,
  unreadCount = 0,
  onNotificationClick,
  onViewAll,
  onMarkAllRead,
  align = 'end',
  className,
}: NotificationDropdownProps) {
  const t = useTranslations('Notifications');
  const [open, setOpen] = useState(false);

  const displayed = notifications.slice(0, 5);

  const handleClick = (n: Notification) => {
    onNotificationClick?.(n);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type='button'
          className={cn(
            'relative flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black transition-colors hover:bg-purple-92',
            className
          )}
          aria-label={t('notifications')}
          title={t('notifications')}
        >
          <Bell className='h-6 w-6' strokeWidth={2} />
          {unreadCount > 0 && (
            <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 w-[400px] rounded-xl border border-purple-92 bg-white shadow-[0px_10px_40px_0px_rgba(16,10,85,0.12)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3.5 border-b border-border'>
            <div className='flex items-center gap-2.5'>
              <h3 className='text-base font-semibold text-main-black'>{t('notifications')}</h3>
              {unreadCount > 0 && (
                <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-main-primary px-1.5 text-xs font-bold text-white'>
                  {unreadCount} {t('new')}
                </span>
              )}
            </div>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type='button'
                onClick={() => {
                  onMarkAllRead();
                  setOpen(false);
                }}
                className='flex items-center gap-1 text-sm font-medium text-main-primary transition-colors hover:text-main-primary/80'
              >
                <CheckCheck className='h-4 w-4' />
                {t('markAsRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className='max-h-[400px] overflow-y-auto'>
            {displayed.length > 0 ? (
              <div className='flex flex-col divide-y divide-border'>
                {displayed.map((n) => (
                  <NotificationItem key={n.id} notification={n} onClick={handleClick} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center gap-2 py-10 text-grey-500'>
                <Bell className='h-10 w-10 opacity-40' />
                <p className='text-sm'>{t('noNotifications')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='border-t border-border px-4 py-3'>
            <button
              type='button'
              onClick={() => {
                onViewAll?.();
                setOpen(false);
              }}
              className='text-sm font-semibold text-main-primary transition-colors hover:text-main-primary/80'
            >
              {t('viewAll')}
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
