'use client';

import { useTranslations } from 'next-intl';
import { Phone, Mail, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { useDashboardAgents } from '../api';

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? 'A';
}

const avatarStyles = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
];

export function AgentContact() {
  const t = useTranslations('OwnerDashboard.agentContact');
  const { data: agents = [] } = useDashboardAgents(4);

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <button className='text-xs font-medium text-primary hover:underline'>{t('viewAll')}</button>
      </div>

      <div className='flex flex-col divide-y divide-border'>
        {agents.map((agent, index) => (
          <div key={agent.userId} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
            <Avatar className='h-10 w-10 shrink-0'>
              <AvatarImage src={agent.avatarUrl} alt={agent.fullName} />
              <AvatarFallback className={`text-sm font-bold ${avatarStyles[index % avatarStyles.length]}`}>
                {getInitial(agent.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold truncate'>{agent.fullName}</p>
              <div className='mt-0.5 flex items-center gap-1 text-xs text-muted-foreground'>
                <Users className='h-3 w-3 shrink-0' />
                <span className='truncate'>{t('activeLeads', { count: agent.activeLeads })}</span>
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
