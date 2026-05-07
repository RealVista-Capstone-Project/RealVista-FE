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
          ? 'border-l-primary bg-primary/10'
          : 'border-l-transparent bg-card hover:border-l-primary/25 hover:bg-primary/[0.04]'
      )}
      onClick={() => onClick(agent)}
    >
      {/* Hired Date */}
      <div className='col-span-2'>
        <div className='text-sm font-semibold tabular-nums text-foreground'>
          {formatDate(agent.hired_at, 'dd MMM', locale)}
        </div>
        <div className='mt-0.5 text-xs tabular-nums text-muted-foreground'>
          {formatDate(agent.hired_at, 'yyyy', locale)}
        </div>
      </div>

      {/* Agent Info */}
      <div className='col-span-4 flex items-center gap-3'>
        <Avatar
          className={cn(
            'h-9 w-9 flex-shrink-0 ring-2 ring-offset-1 transition-all duration-150',
            isSelected ? 'ring-primary/30' : 'ring-border'
          )}
        >
          <AvatarImage
            src={agent.agent_avatar_url ?? undefined}
            alt={agent.agent_full_name}
          />
          <AvatarFallback className='bg-primary/15 text-primary text-xs font-bold'>
            {getInitials(agent.agent_full_name)}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <div className='truncate text-sm font-semibold leading-tight text-foreground'>
            {agent.agent_full_name}
          </div>
          <div className='mt-0.5 truncate text-xs text-muted-foreground'>
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
            agent.agent_rating != null ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {agent.agent_rating != null ? agent.agent_rating.toFixed(1) : t('common.na')}
        </span>
      </div>

      {/* Property */}
      <div className='col-span-2 min-w-0'>
        <div className='truncate text-sm font-medium text-foreground'>
          {agent.property_type_name ?? t('common.na')}
        </div>
        {agent.property_location_name && (
          <div className='flex items-center gap-1 mt-0.5'>
            <MapPin className='h-3 w-3 shrink-0 text-muted-foreground/50' />
            <span className='truncate text-xs text-muted-foreground'>
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
              : 'text-muted/30 group-hover:text-muted-foreground'
          )}
        />
      </div>
    </div>
  );
}
