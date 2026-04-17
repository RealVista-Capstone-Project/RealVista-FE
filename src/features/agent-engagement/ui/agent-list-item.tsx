'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { formatDate, getInitials, getStatusColor } from '../lib/utils';
import { Star, MapPin, ChevronRight } from 'lucide-react';
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
        'grid grid-cols-12 gap-4 px-5 py-3.5 items-center cursor-pointer transition-all duration-150 group relative border-l-[3px]',
        isSelected
          ? 'bg-indigo-50/70 border-l-primary'
          : 'bg-white border-l-transparent hover:bg-gray-50/80 hover:border-l-gray-200'
      )}
      onClick={() => onClick(agent)}
    >
      {/* Hired Date */}
      <div className='col-span-2'>
        <div className='text-sm font-semibold text-gray-800 tabular-nums'>
          {formatDate(agent.hired_at, 'dd MMM', locale)}
        </div>
        <div className='text-xs text-gray-400 mt-0.5 tabular-nums'>
          {formatDate(agent.hired_at, 'yyyy', locale)}
        </div>
      </div>

      {/* Agent Info */}
      <div className='col-span-4 flex items-center gap-3'>
        <Avatar
          className={cn(
            'h-9 w-9 flex-shrink-0 ring-2 ring-offset-1 transition-all duration-150',
            isSelected ? 'ring-primary/30' : 'ring-gray-100'
          )}
        >
          <AvatarImage
            src={agent.agent_avatar_url ?? undefined}
            alt={agent.agent_full_name}
          />
          <AvatarFallback className='bg-indigo-100 text-indigo-700 text-xs font-bold'>
            {getInitials(agent.agent_full_name)}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <div className='font-semibold text-gray-900 truncate text-sm leading-tight'>
            {agent.agent_full_name}
          </div>
          <div className='text-xs text-gray-400 truncate mt-0.5'>
            {agent.agent_email ?? t('listItem.noEmail')}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className='col-span-2 flex items-center gap-1.5'>
        <Star className='h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0' />
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            agent.agent_rating != null ? 'text-gray-800' : 'text-gray-400'
          )}
        >
          {agent.agent_rating != null ? agent.agent_rating.toFixed(1) : t('common.na')}
        </span>
      </div>

      {/* Property */}
      <div className='col-span-2 min-w-0'>
        <div className='text-sm text-gray-700 font-medium truncate'>
          {agent.property_type_name ?? t('common.na')}
        </div>
        {agent.property_location_name && (
          <div className='flex items-center gap-1 mt-0.5'>
            <MapPin className='h-3 w-3 text-gray-300 flex-shrink-0' />
            <span className='text-xs text-gray-400 truncate'>
              {agent.property_location_name}
            </span>
          </div>
        )}
      </div>

      {/* Status + Arrow */}
      <div className='col-span-2 flex items-center justify-between'>
        <Badge
          variant='secondary'
          className={cn(
            'text-[10px] h-5 px-2 font-semibold pointer-events-none rounded-full',
            getStatusColor(agent.status)
          )}
        >
          {statusLabel}
        </Badge>
        <ChevronRight
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-all duration-150',
            isSelected
              ? 'text-primary'
              : 'text-gray-200 group-hover:text-gray-400'
          )}
        />
      </div>
    </div>
  );
}
