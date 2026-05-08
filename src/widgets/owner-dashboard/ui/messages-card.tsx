'use client';

import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';

interface MockMessage {
  id: string;
  name: string;
  preview: string;
  unread: number;
  tone: 'rose' | 'amber' | 'emerald' | 'sky';
}

// TODO(integration): replace with real conversations from the messaging feature.
const MOCK_MESSAGES: MockMessage[] = [
  {
    id: '1',
    name: 'Kianna George',
    preview: "Not too bad, just trying to keep up...",
    unread: 4,
    tone: 'rose',
  },
  {
    id: '2',
    name: 'Jaydon Mango',
    preview: "That's a good idea. I'll have a look.",
    unread: 2,
    tone: 'amber',
  },
  {
    id: '3',
    name: 'Kianna Vetrovs',
    preview: 'Thanks, I appreciate it. Hey,',
    unread: 3,
    tone: 'emerald',
  },
  {
    id: '4',
    name: 'Mira Mango',
    preview: 'Sounds great! Talk soon.',
    unread: 1,
    tone: 'sky',
  },
];

const toneClasses: Record<MockMessage['tone'], { avatar: string; badge: string }> = {
  rose: {
    avatar: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    badge: 'bg-rose-500 text-white',
  },
  amber: {
    avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    badge: 'bg-amber-500 text-white',
  },
  emerald: {
    avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    badge: 'bg-emerald-500 text-white',
  },
  sky: {
    avatar: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    badge: 'bg-sky-500 text-white',
  },
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

export function MessagesCard() {
  const t = useTranslations('OwnerDashboard.messages');

  return (
    <div className='flex h-full flex-col gap-4 rounded-[24px] border border-black/[0.06] bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <button
          type='button'
          className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          aria-label={t('menu')}
        >
          <Menu className='h-4 w-4' />
        </button>
      </div>

      <div className='flex flex-col divide-y divide-border'>
        {MOCK_MESSAGES.map((msg) => {
          const tones = toneClasses[msg.tone];
          return (
            <button
              key={msg.id}
              type='button'
              className='flex items-center gap-3 py-3 text-left transition-colors hover:bg-muted/30 first:pt-0 last:pb-0'
            >
              <Avatar className='h-10 w-10 shrink-0'>
                <AvatarFallback className={cn('text-sm font-bold', tones.avatar)}>
                  {getInitial(msg.name)}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold'>{msg.name}</p>
                <p className='truncate text-xs text-muted-foreground'>{msg.preview}</p>
              </div>

              <span
                className={cn(
                  'flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                  tones.badge,
                )}
              >
                {msg.unread}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
