'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { MapPin, Home, CalendarDays, Award } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatDate, getStatusColor, getEngagementTypeLabel } from '../lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface EngagementSummaryCardProps {
  agent: AgentEngagement;
}

interface ParsedContent {
  title?: string;
  message?: string;
  pitchContent?: string;
  commissionRate?: number;
  experienceYears?: number;
}

export function EngagementSummaryCard({ agent }: EngagementSummaryCardProps) {
  const t = useTranslations('AgentEngagement');
  const locale = useLocale();

  const statusKey = `status.${(agent.status ?? '').toLowerCase()}` as const;
  const statusLabel = agent.status && t.has(statusKey) ? t(statusKey) : (agent.status ?? '');

  const parsedContent: ParsedContent | null = (() => {
    if (!agent.content) return null;
    if (typeof agent.content === 'object') return agent.content as unknown as ParsedContent;
    try {
      const parsed = JSON.parse(agent.content);
      // Handle potential double-serialization from older data or Hibernate quirks
      if (typeof parsed === 'string') {
        return JSON.parse(parsed) as ParsedContent;
      }
      return parsed as ParsedContent;
    }
    catch { return null; }
  })();

  const displayMessage = parsedContent?.message || parsedContent?.pitchContent;

  return (
    <Card className='overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm'>
      {/* Property Image Banner */}
      <div className='relative h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-blue-50/30 flex items-center justify-center overflow-hidden'>
        {/* Decorative blobs */}
        <div className='absolute top-3 left-6 h-28 w-28 rounded-full bg-indigo-200/20' />
        <div className='absolute bottom-2 right-8 h-20 w-20 rounded-full bg-primary/10' />
        <div className='absolute top-8 right-16 h-12 w-12 rounded-full bg-blue-200/20' />
        {/* Icon */}
        <div className='relative flex flex-col items-center gap-2'>
          <div className='h-14 w-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/80'>
            <Home className='h-7 w-7 text-primary/70' />
          </div>
          {agent.property_type_name && (
            <span className='text-xs font-semibold bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-primary border border-white/80 shadow-sm'>
              {agent.property_type_name}
            </span>
          )}
        </div>
        {/* Status badge */}
        <div className='absolute top-3 right-3'>
          <Badge
            variant='secondary'
            className={cn(
              'text-xs font-semibold pointer-events-none rounded-full shadow-sm',
              getStatusColor(agent.status)
            )}
          >
            {statusLabel}
          </Badge>
        </div>
      </div>

      <CardContent className='p-5'>
        {/* Title + message */}
        <div className='mb-5'>
          <h3 className='text-sm font-bold text-foreground'>
            {parsedContent?.title || t('detailPage.summaryTitle')}
          </h3>
          {displayMessage && (
            <p className='mt-1.5 text-sm leading-relaxed text-muted-foreground'>
              {displayMessage}
            </p>
          )}
        </div>

        {/* Address rows */}
        <div className='space-y-3 mb-4'>
          {agent.property_address && (
            <div className='flex items-start gap-3'>
              <div className='h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <MapPin className='h-3.5 w-3.5 text-primary/80' />
              </div>
              <div>
                <p className='mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                  {t('detailPage.propertyAddress')}
                </p>
                <p className='text-sm font-semibold text-foreground'>{agent.property_address}</p>
              </div>
            </div>
          )}

          {agent.property_location_name && (
            <div className='flex items-start gap-3'>
              <div className='h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <MapPin className='h-3.5 w-3.5 text-orange-500' />
              </div>
              <div>
                <p className='mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                  {t('detailPage.propertyLocation')}
                </p>
                <p className='text-sm font-semibold text-foreground'>{agent.property_location_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info tiles */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3.5'>
            <div className='mb-1.5 flex items-center gap-1.5'>
              <Award className='h-3.5 w-3.5 text-primary/60' />
              <span className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                {t('detailPage.engagementType')}
              </span>
            </div>
            <p className='text-sm font-bold text-foreground'>{getEngagementTypeLabel(agent.engagement_type, t)}</p>
          </div>

          <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3.5'>
            <div className='mb-1.5 flex items-center gap-1.5'>
              <CalendarDays className='h-3.5 w-3.5 text-sky-500' />
              <span className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                {t('detailPage.hiredDate')}
              </span>
            </div>
            <p className='text-sm font-bold text-foreground'>
              {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
