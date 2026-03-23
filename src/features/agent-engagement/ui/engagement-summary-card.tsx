'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { MapPin, Home, CalendarDays, Award } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatDate, getStatusColor } from '../lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface EngagementSummaryCardProps {
  agent: AgentEngagement;
}

interface ParsedContent {
  message?: string;
  offeredCommission?: string;
}

export function EngagementSummaryCard({ agent }: EngagementSummaryCardProps) {
  const t = useTranslations('AgentEngagement');
  const locale = useLocale();

  const statusKey = `status.${(agent.status ?? '').toLowerCase()}` as const;
  const statusLabel = agent.status && t.has(statusKey) ? t(statusKey) : (agent.status ?? '');

  const parsedContent: ParsedContent | null = (() => {
    if (!agent.content) return null;
    try { return JSON.parse(agent.content) as ParsedContent; }
    catch { return null; }
  })();

  return (
    <Card className='border border-gray-100 shadow-sm rounded-2xl overflow-hidden'>
      {/* Property Image Banner */}
      <div className='relative h-40 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-blue-50/30 flex items-center justify-center overflow-hidden'>
        {/* Decorative blobs */}
        <div className='absolute top-3 left-6 h-28 w-28 rounded-full bg-indigo-200/20' />
        <div className='absolute bottom-2 right-8 h-20 w-20 rounded-full bg-purple-200/20' />
        <div className='absolute top-8 right-16 h-12 w-12 rounded-full bg-blue-200/20' />
        {/* Icon */}
        <div className='relative flex flex-col items-center gap-2'>
          <div className='h-14 w-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/80'>
            <Home className='h-7 w-7 text-indigo-400' />
          </div>
          {agent.property_type_name && (
            <span className='text-xs font-semibold bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-indigo-600 border border-white/80 shadow-sm'>
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
          <h3 className='text-sm font-bold text-gray-900'>
            {t('detailPage.summaryTitle')}
          </h3>
          {parsedContent?.message && (
            <p className='text-sm text-gray-500 mt-1.5 leading-relaxed'>
              {parsedContent.message}
            </p>
          )}
        </div>

        {/* Address rows */}
        <div className='space-y-3 mb-4'>
          {agent.property_address && (
            <div className='flex items-start gap-3'>
              <div className='h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <MapPin className='h-3.5 w-3.5 text-indigo-500' />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5'>
                  {t('detailPage.propertyAddress')}
                </p>
                <p className='text-sm font-semibold text-gray-900'>{agent.property_address}</p>
              </div>
            </div>
          )}

          {agent.property_location_name && (
            <div className='flex items-start gap-3'>
              <div className='h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <MapPin className='h-3.5 w-3.5 text-orange-500' />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5'>
                  {t('detailPage.propertyLocation')}
                </p>
                <p className='text-sm font-semibold text-gray-900'>{agent.property_location_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info tiles */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-gray-50 rounded-xl p-3.5 border border-gray-100'>
            <div className='flex items-center gap-1.5 mb-1.5'>
              <Award className='h-3.5 w-3.5 text-purple-400' />
              <span className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                {t('detailPage.engagementType')}
              </span>
            </div>
            <p className='text-sm font-bold text-gray-900'>{agent.engagement_type}</p>
          </div>

          <div className='bg-gray-50 rounded-xl p-3.5 border border-gray-100'>
            <div className='flex items-center gap-1.5 mb-1.5'>
              <CalendarDays className='h-3.5 w-3.5 text-blue-400' />
              <span className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                {t('detailPage.hiredDate')}
              </span>
            </div>
            <p className='text-sm font-bold text-gray-900'>
              {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
