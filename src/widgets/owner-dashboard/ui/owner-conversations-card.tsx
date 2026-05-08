'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { conversationQueries } from '@/entities/conversation';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

export function OwnerConversationsCard() {
  const t = useTranslations('OwnerDashboard.messages');
  const { data, isLoading } = useQuery(conversationQueries.list());

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className='flex min-h-[280px] flex-col gap-4 rounded-[24px] border border-sky-200/60 bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex shrink-0 items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <Link
          href={ROUTES.dashboard.messages}
          className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          aria-label={t('openFull')}
        >
          <Menu className='h-4 w-4' />
        </Link>
      </div>

      <div className='flex flex-col overflow-x-hidden'>
        {isLoading ? (
          <div className='flex flex-col gap-3'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-14 w-full rounded-xl' />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className='flex min-h-[160px] flex-col items-center justify-center'>
            <p className='text-center text-sm text-muted-foreground'>{t('empty')}</p>
          </div>
        ) : (
          <div className='flex flex-col divide-y divide-border'>
            {rows.slice(0, 8).map((msg) => (
            <Link
              key={msg.conversation_id}
              href={`${ROUTES.dashboard.messages}?conversation=${msg.conversation_id}`}
              className='flex items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-muted/40'
            >
              <Avatar className='h-10 w-10 shrink-0'>
                <AvatarImage src={msg.other_user.avatar_url} alt={msg.other_user.name} />
                <AvatarFallback className='text-sm font-bold'>
                  {getInitial(msg.other_user.name)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold'>{msg.other_user.name}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {msg.last_message ?? t('noPreview')}
                </p>
              </div>
              {(msg.unread_count ?? 0) > 0 && (
                <span
                  className={cn(
                    'flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white',
                    'bg-emerald-500',
                  )}
                >
                  {msg.unread_count > 99 ? '99+' : msg.unread_count}
                </span>
              )}
            </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
