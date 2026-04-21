'use client';

import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AgentEngagement } from '@/entities/agent-engagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { formatDate, getInitials, getStatusColor } from '../lib/utils';
import { CheckCircle2, Clock, Star, MapPin, Trophy, XCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function useAgentColumns(): ColumnDef<AgentEngagement, unknown>[] {
  const t = useTranslations('AgentEngagement');
  const tManage = useTranslations('ManageAgent');
  const locale = useLocale();

  return [
    {
      id: 'hiredDate',
      header: () => tManage('table.hiredDate'),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div>
            <div className='text-sm font-semibold text-foreground tabular-nums'>
              {formatDate(agent.hired_at, 'dd MMM', locale)}
            </div>
            <div className='text-xs text-muted-foreground mt-0.5 tabular-nums'>
              {formatDate(agent.hired_at, 'yyyy', locale)}
            </div>
          </div>
        );
      },
    },
    {
      id: 'agent',
      header: () => tManage('table.agent'),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className='flex items-center gap-3'>
            <Avatar className='h-9 w-9 flex-shrink-0 ring-2 ring-offset-1 ring-primary/20'>
              <AvatarImage
                src={agent.agent_avatar_url ?? undefined}
                alt={agent.agent_full_name}
              />
              <AvatarFallback className='bg-primary/10 text-primary text-xs font-bold'>
                {getInitials(agent.agent_full_name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='font-semibold text-foreground truncate text-sm leading-tight'>
                {agent.agent_full_name}
              </div>
              <div className='text-xs text-muted-foreground truncate mt-0.5'>
                {agent.agent_email ?? t('listItem.noEmail')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'rating',
      header: () => tManage('table.rating'),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className='flex items-center gap-1.5'>
            <Star className='h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0' />
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                agent.agent_rating != null ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {agent.agent_rating != null
                ? agent.agent_rating.toFixed(1)
                : t('common.na')}
            </span>
          </div>
        );
      },
    },
    {
      id: 'property',
      header: () => tManage('table.property'),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className='min-w-0'>
            <div className='text-sm text-foreground font-medium truncate'>
              {agent.property_type_name ?? t('common.na')}
            </div>
            {agent.property_location_name && (
              <div className='flex items-center gap-1 mt-0.5'>
                <MapPin className='h-3 w-3 text-muted-foreground/50 flex-shrink-0' />
                <span className='text-xs text-muted-foreground truncate'>
                  {agent.property_location_name}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: () => tManage('table.status'),
      cell: ({ row }) => {
        const agent = row.original;
        const statusKey = `status.${agent.status.toLowerCase()}` as const;
        const statusLabel = t.has(statusKey) ? t(statusKey) : agent.status;

        const statusIconMap: Record<string, React.ReactNode> = {
          ACTIVE:    <CheckCircle2 className='h-3.5 w-3.5' />,
          PENDING:   <Clock className='h-3.5 w-3.5' />,
          ACCEPTED:  <CheckCircle2 className='h-3.5 w-3.5' />,
          COMPLETED: <Trophy className='h-3.5 w-3.5' />,
          CANCELLED: <XCircle className='h-3.5 w-3.5' />,
          REJECTED:  <XCircle className='h-3.5 w-3.5' />,
          EXPIRED:   <XCircle className='h-3.5 w-3.5' />,
        };
        const icon = statusIconMap[(agent.status ?? '').toUpperCase()];

        return (
          <Badge
            variant='secondary'
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 border whitespace-nowrap w-fit',
              getStatusColor(agent.status)
            )}
          >
            {icon}
            {statusLabel}
          </Badge>
        );
      },
    },
  ];
}
