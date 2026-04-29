'use client';

import { useState } from 'react';
import { Calendar } from '@/shared/ui/calendar';
import { MapPin, User, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';


type ScheduleTab = 'All' | 'Assigned' | 'My Schedule';

const scheduleItems = [
  {
    id: 1,
    title: 'Visit Client Michael Reynolds',
    address: '742 Oak Street, Denver, CO 80220',
    date: 'Jun 2, 2025',
    time: '10:00 AM',
    type: 'my schedule' as const,
    color: 'border-l-indigo-500',
  },
  {
    id: 2,
    title: 'Visit Client Sarah Thompson',
    address: '1256 Maple Ave, Austin, TX 78704',
    date: 'Jun 2, 2025',
    time: '2:00 PM',
    type: 'my schedule' as const,
    color: 'border-l-emerald-500',
  },
  {
    id: 3,
    title: 'Follow Up Aaliyah Lovato',
    address: 'aaliyah123@listify.com | (512) 555-0398',
    date: 'Jun 2, 2025',
    time: '4:30 PM',
    type: 'assigned' as const,
    color: 'border-l-amber-500',
  },
  {
    id: 4,
    title: 'Property Inspection - Maison Sterling',
    address: 'New York, Albany',
    date: 'Jun 5, 2025',
    time: '9:00 AM',
    type: 'assigned' as const,
    color: 'border-l-rose-500',
  },
];

const tabs: ScheduleTab[] = ['All', 'Assigned', 'My Schedule'];

export function ScheduleCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<ScheduleTab>('All');

  const filtered = scheduleItems.filter((item) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Assigned') return item.type === 'assigned';
    if (activeTab === 'My Schedule') return item.type === 'my schedule';
    return true;
  });

  return (
    <div className='flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm'>
      {/* Calendar */}
      <div className='flex justify-center'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate as (date: Date | undefined) => void}
          className='w-full'
        />
      </div>

      {/* Tabs */}
      <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-all',
              activeTab === tab
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Schedule Items */}
      <div className='flex flex-col gap-3'>
        {filtered.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border bg-muted/20 px-4 py-3 border-l-4',
              item.color,
            )}
          >
            <p className='text-sm font-semibold leading-snug'>{item.title}</p>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <MapPin className='h-3 w-3 shrink-0' />
              <span className='truncate'>{item.address}</span>
            </div>
            <div className='flex items-center gap-3 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>{item.time}</span>
              </div>
              <div className='flex items-center gap-1'>
                <User className='h-3 w-3' />
                <span className='capitalize'>{item.type}</span>
              </div>
              <span className='ml-auto text-primary font-medium'>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
