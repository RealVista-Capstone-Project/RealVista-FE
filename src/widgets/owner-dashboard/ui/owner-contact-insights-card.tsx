'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { useOwnerHeroInsights } from '../api';

function formatCount(value?: number) {
  if (value === undefined) return '--';
  return value.toLocaleString();
}

export function OwnerContactInsightsCard() {
  const t = useTranslations('OwnerDashboard.hero');
  const { data: hero, isLoading } = useOwnerHeroInsights();

  const chats = hero?.chat_messages_on_listings ?? 0;
  const appts = hero?.appointments_on_owner_listings ?? 0;
  const contactTotal = chats + appts;

  return (
    <div className='flex h-full min-h-[240px] flex-col gap-4 rounded-[24px] border border-sky-200/60 bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex items-center justify-between'>
        <p className='text-base font-bold text-foreground'>{t('contactBreakdownTitle')}</p>
        <div className='flex items-center gap-2'>
          {isLoading ? (
            <Skeleton className='h-7 w-12' />
          ) : (
            <p className='text-2xl font-bold tracking-tight'>{formatCount(contactTotal)}</p>
          )}
        </div>
      </div>

      {!isLoading && (
        <div className='flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-foreground'>
          <span className='flex items-center gap-2'>
            <MessageSquare className='h-3.5 w-3.5 shrink-0 text-sky-600' />
            {t('chatMessagesLine', { count: chats })}
          </span>
          <span className='flex items-center gap-2'>
            <CalendarDays className='h-3.5 w-3.5 shrink-0 text-emerald-600' />
            {t('appointmentsLine', { count: appts })}
          </span>
        </div>
      )}
      {isLoading && (
        <div className='flex flex-col gap-2 pt-1'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
        </div>
      )}
    </div>
  );
}
