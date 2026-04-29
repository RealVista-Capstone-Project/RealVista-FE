'use client';

import { CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

const reminders = [
  {
    id: 1,
    day: '08',
    month: 'Oct',
    title: 'Follow up with client',
    description: 'Follow up with Mr. Aditya about payment status.',
    avatars: ['U', 'U'],
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
  {
    id: 2,
    day: '12',
    month: 'Oct',
    title: 'Upload new photos',
    description: 'Upload new listing photos for the new villa launch.',
    avatars: ['U'],
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  {
    id: 3,
    day: '17',
    month: 'Oct',
    title: 'Review sales contract',
    description: 'Review and sign contract draft for The Somerset sale.',
    avatars: ['U', 'U'],
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
];

export function ReminderCard() {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Reminder</h3>
        <button className='flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'>
          <CalendarDays className='h-3.5 w-3.5' />
          View all
        </button>
      </div>

      <div className='flex flex-col gap-3'>
        {reminders.map((item) => (
          <div key={item.id} className='flex items-start gap-3'>
            {/* Date badge */}
            <div
              className={`flex min-w-[2.75rem] flex-col items-center rounded-xl px-2 py-1.5 ${item.color}`}
            >
              <span className='text-xs font-medium'>{item.month}</span>
              <span className='text-lg font-bold leading-none'>{item.day}</span>
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold truncate'>{item.title}</p>
              <p className='mt-0.5 text-xs text-muted-foreground line-clamp-2'>
                {item.description}
              </p>
            </div>

            {/* Avatars */}
            <div className='flex -space-x-2 shrink-0'>
              {item.avatars.map((initial, i) => (
                <Avatar key={i} className='h-6 w-6 border-2 border-background'>
                  <AvatarFallback className='text-[10px] bg-primary/10 text-primary font-semibold'>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
