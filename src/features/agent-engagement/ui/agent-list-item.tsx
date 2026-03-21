'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { formatDate, getInitials, getStatusColor } from '../lib/utils';
import { Star, MoreHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useTranslations, useLocale } from 'next-intl';

interface AgentListItemProps {
  agent: AgentEngagement;
  isSelected: boolean;
  onClick: (agent: AgentEngagement) => void;
}

export function AgentListItem({ agent, isSelected, onClick }: AgentListItemProps) {
  const t = useTranslations('AgentEngagement');
  const locale = useLocale();

  const statusKey = `status.${agent.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : agent.status;

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 cursor-pointer transition-all duration-200 group border-l-4 border-l-transparent',
        isSelected ? 'bg-indigo-50/60 border-l-indigo-500' : 'bg-white'
      )}
      onClick={() => onClick(agent)}
    >
      {/* Hired Date */}
      <div className='col-span-2'>
        <div className='text-sm font-semibold text-gray-700'>
          {formatDate(agent.hired_at, 'dd MMM', locale)}
        </div>
        <div className='text-xs text-gray-400 mt-1'>
          {formatDate(agent.hired_at, 'yyyy', locale)}
        </div>
      </div>

      {/* Agent Info */}
      <div className='col-span-4 flex items-center gap-3'>
        <Avatar className='h-10 w-10 flex-shrink-0 border border-gray-100'>
          <AvatarImage src={agent.agent_avatar_url ?? undefined} alt={agent.agent_full_name} />
          <AvatarFallback className='bg-indigo-100 text-indigo-700 text-xs font-semibold'>
            {getInitials(agent.agent_full_name)}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <div className='font-semibold text-gray-900 truncate text-sm'>
            {agent.agent_full_name}
          </div>
          <div className='text-xs text-gray-500 truncate'>
            {agent.agent_email ?? t('listItem.noEmail')}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className='col-span-2 flex items-center gap-1'>
        <Star className='h-3.5 w-3.5 text-yellow-400 fill-yellow-400' />
        <span className='text-sm font-medium text-gray-700'>
          {agent.agent_rating != null ? agent.agent_rating.toFixed(1) : t('common.na')}
        </span>
      </div>

      {/* Property */}
      <div className='col-span-2'>
        <div className='text-sm text-gray-700 truncate'>
          {agent.property_type_name ?? t('common.na')}
        </div>
        <div className='text-xs text-gray-400 truncate'>
          {agent.property_location_name ?? ''}
        </div>
      </div>

      {/* Status + Action */}
      <div className='col-span-2 flex items-center justify-between'>
        <Badge
          variant='secondary'
          className={cn(
            'text-[10px] h-5 px-2 font-medium pointer-events-none',
            getStatusColor(agent.status)
          )}
        >
          {statusLabel}
        </Badge>
        <Button
          variant='ghost'
          size='sm'
          className='text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={(e) => {
            e.stopPropagation();
            onClick(agent);
          }}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
