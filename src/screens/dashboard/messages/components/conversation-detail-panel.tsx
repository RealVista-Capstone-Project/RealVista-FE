'use client';

import { useState } from 'react';
import { X, ChevronUp, Check, Plus, Building2, Clock, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { ConversationDetail } from '../types';

interface ConversationDetailPanelProps {
  detail: ConversationDetail;
  onClose: () => void;
}

export function ConversationDetailPanel({ detail, onClose }: ConversationDetailPanelProps) {
  const t = useTranslations('Messages');
  const [timelineOpen, setTimelineOpen] = useState(true);

  return (
    <div className='flex w-80 shrink-0 flex-col overflow-hidden overflow-y-auto border-l border-border bg-card'>
      {/* Header */}
      <div className='flex justify-end px-4 py-3'>
        <button
          onClick={onClose}
          className='flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          aria-label='Close details'
        >
          <X className='size-4' />
        </button>
      </div>

      {/* Profile */}
      <div className='flex flex-col items-center px-6 pb-6 py-4'>
        {/* Avatar with online dot */}
        <div className='relative mb-4'>
          <div
            className={cn(
              'flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg',
              detail.avatarBg
            )}
          >
            {detail.initials}
          </div>
          {detail.isOnline && (
            <span className='absolute right-0 top-1 size-3.5 rounded-full border-2 border-card bg-emerald-400' />
          )}
        </div>

        <h3 className='text-base font-bold text-foreground'>{detail.name}</h3>

        <div className='mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground/70'>
          <Building2 className='size-4 text-muted-foreground/50' />
          <span>{detail.company}</span>
        </div>

        <div className='mt-1 flex items-center gap-1.5 text-sm text-muted-foreground/70'>
          <Clock className='size-4 text-muted-foreground/50' />
          <span>{detail.timezone}</span>
        </div>

        {/* View contract */}
        <button className='mt-4 flex items-center gap-2 rounded-lg border border-border/60 px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent'>
          <Eye className='size-4' />
          {t('viewContract')}
        </button>
      </div>

      <Separator className='my-2' />

      {/* Activity Timeline */}
      <div className='flex-1 px-5 py-4'>
        {/* Timeline header */}
        <button
          onClick={() => setTimelineOpen((v) => !v)}
          className='mb-4 flex w-full items-center justify-between text-sm font-semibold text-foreground'
          aria-expanded={timelineOpen}
        >
          <div className='flex items-center gap-2.5'>
            <div className='flex size-6 items-center justify-center rounded-full ring-1 ring-border'>
              <div className='size-2 rounded-full bg-primary' />
            </div>
            <span>{t('activityTimeline')}</span>
          </div>
          <ChevronUp
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              !timelineOpen && 'rotate-180'
            )}
          />
        </button>

        {timelineOpen && (
          <div className='relative ml-3 space-y-6'>
            {/* Vertical line */}
            <div className='absolute left-3 top-0 h-full w-px bg-border/50' />

            {detail.timeline.map((event) => (
              <div key={event.id} className='relative flex gap-4 pl-10'>
                {/* Icon */}
                <div
                  className={cn(
                    'absolute left-0 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card',
                    event.icon === 'check'
                      ? 'border-emerald-400/60 text-emerald-600'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  {event.icon === 'check' ? (
                    <Check className='size-3.5' />
                  ) : (
                    <Plus className='size-3.5' />
                  )}
                </div>

                {/* Content */}
                <div className='flex flex-col gap-0.5 pt-0.5'>
                  <p className='text-sm font-medium text-foreground'>{event.title}</p>

                  {event.amount && (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold text-foreground'>{event.amount}</span>
                      {event.badge && (
                        <span className='rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground'>
                          {event.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {event.date && <p className='text-xs text-muted-foreground/60'>{event.date}</p>}
                  {event.sub && <p className='text-xs text-muted-foreground/50'>{event.sub}</p>}

                  {event.link && (
                    <a
                      href={event.link.href}
                      className='mt-1 text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80'
                    >
                      {event.link.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className='my-2' />

      {/* End contract button */}
      <div className='px-5 py-4'>
        <button className='w-full rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground transition-all hover:bg-destructive/90 active:bg-destructive/80'>
          {t('endContract')}
        </button>
      </div>
    </div>
  );
}
