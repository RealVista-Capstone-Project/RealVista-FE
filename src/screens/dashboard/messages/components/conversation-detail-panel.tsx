'use client';

import { useState } from 'react';
import { X, ChevronUp, Check, Plus, Building2, Clock, Eye } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ConversationDetail } from '../types';

interface ConversationDetailPanelProps {
  detail: ConversationDetail;
  onClose: () => void;
}

export function ConversationDetailPanel({ detail, onClose }: ConversationDetailPanelProps) {
  const [timelineOpen, setTimelineOpen] = useState(true);

  return (
    <div className='flex w-100 shrink-0 flex-col overflow-y-auto border-l border-grey-200 bg-white'>
      {/* Close button */}
      <div className='flex justify-end px-4 pt-4'>
        <button
          onClick={onClose}
          className='flex size-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 hover:text-main-black'
        >
          <X className='size-4' />
        </button>
      </div>

      {/* Profile */}
      <div className='flex flex-col items-center px-6 pb-6 pt-2'>
        {/* Avatar with online dot */}
        <div className='relative mb-4'>
          <div
            className={cn(
              'flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white',
              detail.avatarBg
            )}
          >
            {detail.initials}
          </div>
          {detail.isOnline && (
            <span className='absolute right-1 top-1 size-3 rounded-full border-2 border-white bg-emerald-400' />
          )}
        </div>

        <h2 className='mb-1 text-lg font-bold text-main-black'>{detail.name}</h2>

        <div className='mb-1 flex items-center gap-1.5 text-sm text-grey-500'>
          <Building2 className='size-4 text-grey-400' />
          <span>{detail.company}</span>
        </div>

        <div className='mb-5 flex items-center gap-1.5 text-sm text-grey-500'>
          <Clock className='size-4 text-grey-400' />
          <span>{detail.timezone}</span>
        </div>

        {/* View contract */}
        <button className='flex items-center gap-2 rounded-xl border border-main-primary/30 px-5 py-2 text-sm font-semibold text-main-primary transition-colors hover:bg-purple-98'>
          <Eye className='size-4' />
          View contract
        </button>
      </div>

      <div className='mx-4 h-px bg-grey-200' />

      {/* Activity Timeline */}
      <div className='flex-1 px-4 py-4'>
        {/* Timeline header */}
        <button
          onClick={() => setTimelineOpen((v) => !v)}
          className='mb-4 flex w-full items-center justify-between'
        >
          <div className='flex items-center gap-2'>
            <div className='flex size-6 items-center justify-center rounded-full border-2 border-grey-300'>
              <div className='size-2 rounded-full bg-grey-400' />
            </div>
            <span className='text-sm font-bold text-main-black'>Activity timeline</span>
          </div>
          <ChevronUp
            className={cn(
              'size-4 text-grey-400 transition-transform',
              !timelineOpen && 'rotate-180'
            )}
          />
        </button>

        {timelineOpen && (
          <div className='relative ml-3 space-y-6'>
            {/* Vertical line */}
            <div className='absolute left-3 top-0 h-full w-px bg-grey-200' />

            {detail.timeline.map((event) => (
              <div key={event.id} className='relative flex gap-4 pl-10'>
                {/* Icon */}
                <div
                  className={cn(
                    'absolute left-0 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-white',
                    event.icon === 'check'
                      ? 'border-grey-300 text-grey-500'
                      : 'border-grey-300 text-grey-400'
                  )}
                >
                  {event.icon === 'check' ? (
                    <Check className='size-3.5' />
                  ) : (
                    <Plus className='size-3.5' />
                  )}
                </div>

                {/* Content */}
                <div className='flex flex-col gap-1'>
                  <p className='text-sm font-semibold text-main-black'>{event.title}</p>

                  {event.amount && (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold text-main-black'>{event.amount}</span>
                      {event.badge && (
                        <span className='rounded-full bg-main-primary px-2.5 py-0.5 text-xs font-semibold text-white'>
                          {event.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {event.date && <p className='text-xs text-grey-500'>{event.date}</p>}
                  {event.sub && <p className='text-xs text-grey-400'>{event.sub}</p>}

                  {event.link && (
                    <a
                      href={event.link.href}
                      className='mt-1 text-sm font-semibold text-main-primary underline underline-offset-2 hover:text-main-primary-hover'
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

      {/* End contract button */}
      <div className='px-4 pb-6 pt-2'>
        <button className='w-full rounded-xl bg-main-primary py-3 text-sm font-bold text-white transition-colors hover:bg-main-primary-hover active:bg-main-primary-active'>
          End contract
        </button>
      </div>
    </div>
  );
}
