'use client';

import { MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

const leads = [
  {
    id: 1,
    name: 'Jessica Chen',
    location: 'New York, Albany',
    phone: '+1 (555) 234-5678',
    email: 'jessica@email.com',
    initial: 'J',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    badge: 'New',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    id: 2,
    name: 'John Doe',
    location: 'California, LA',
    phone: '+1 (555) 345-6789',
    email: 'john@email.com',
    initial: 'J',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    badge: 'Hot',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  },
  {
    id: 3,
    name: 'Hailee S.',
    location: 'New York, Troy',
    phone: '+1 (555) 456-7890',
    email: 'hailee@email.com',
    initial: 'H',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
    badge: 'Warm',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    id: 4,
    name: 'Evan Chris',
    location: 'Ohio, Columbus',
    phone: '+1 (555) 567-8901',
    email: 'evan@email.com',
    initial: 'E',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    badge: 'New',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
];

export function LeadsContact() {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Leads Contact</h3>
        <button className='text-xs font-medium text-primary hover:underline'>View all</button>
      </div>

      <div className='flex flex-col divide-y divide-border'>
        {leads.map((lead) => (
          <div key={lead.id} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
            <Avatar className='h-10 w-10 shrink-0'>
              <AvatarFallback className={`text-sm font-bold ${lead.color}`}>
                {lead.initial}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-semibold truncate'>{lead.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${lead.badgeColor}`}
                >
                  {lead.badge}
                </span>
              </div>
              <div className='mt-0.5 flex items-center gap-1 text-xs text-muted-foreground'>
                <MapPin className='h-3 w-3 shrink-0' />
                <span className='truncate'>{lead.location}</span>
              </div>
            </div>

            <div className='flex gap-2 shrink-0'>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors'>
                <Phone className='h-3.5 w-3.5 text-muted-foreground' />
              </button>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors'>
                <Mail className='h-3.5 w-3.5 text-muted-foreground' />
              </button>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors'>
                <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
