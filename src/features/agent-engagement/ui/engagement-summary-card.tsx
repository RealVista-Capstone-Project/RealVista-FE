'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
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
    <Card className='border-none shadow-sm rounded-xl overflow-hidden'>
      {/* Property Image Placeholder */}
      <div className='relative h-44 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center overflow-hidden'>
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-4 left-8 h-32 w-32 rounded-full bg-indigo-400' />
          <div className='absolute bottom-4 right-12 h-20 w-20 rounded-full bg-purple-400' />
        </div>
        <div className='relative flex flex-col items-center gap-2 text-indigo-400'>
          <Home className='h-12 w-12' />
          {agent.property_type_name && (
            <span className='text-xs font-medium bg-white/70 px-3 py-1 rounded-full text-indigo-600'>
              {agent.property_type_name}
            </span>
          )}
        </div>
        <div className='absolute top-3 right-3'>
          <Badge
            variant='secondary'
            className={cn('text-xs font-medium pointer-events-none shadow-sm', getStatusColor(agent.status))}
          >
            {statusLabel}
          </Badge>
        </div>
      </div>

      <CardHeader className='px-6 pt-5 pb-2'>
        <CardTitle className='text-base font-bold text-gray-900'>
          {t('detailPage.summaryTitle')}
        </CardTitle>
        {parsedContent?.message && (
          <p className='text-sm text-gray-500 mt-1 leading-relaxed'>{parsedContent.message}</p>
        )}
      </CardHeader>

      <CardContent className='px-6 pb-6'>
        <dl className='space-y-4'>
          {agent.property_address && (
            <div className='flex items-start gap-3'>
              <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 flex-shrink-0 mt-0.5'>
                <MapPin className='h-4 w-4 text-indigo-600' />
              </div>
              <div>
                <dt className='text-xs text-gray-400 mb-0.5'>{t('detailPage.propertyAddress')}</dt>
                <dd className='text-sm font-semibold text-gray-900'>{agent.property_address}</dd>
              </div>
            </div>
          )}

          {agent.property_location_name && (
            <div className='flex items-start gap-3'>
              <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-orange-50 flex-shrink-0 mt-0.5'>
                <MapPin className='h-4 w-4 text-orange-500' />
              </div>
              <div>
                <dt className='text-xs text-gray-400 mb-0.5'>{t('detailPage.propertyLocation')}</dt>
                <dd className='text-sm font-semibold text-gray-900'>{agent.property_location_name}</dd>
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4 pt-1'>
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
              <div className='flex items-center gap-2 mb-2'>
                <Award className='h-4 w-4 text-purple-500' />
                <span className='text-xs text-gray-500'>{t('detailPage.engagementType')}</span>
              </div>
              <p className='text-sm font-bold text-gray-900'>{agent.engagement_type}</p>
            </div>

            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
              <div className='flex items-center gap-2 mb-2'>
                <CalendarDays className='h-4 w-4 text-blue-500' />
                <span className='text-xs text-gray-500'>{t('detailPage.hiredDate')}</span>
              </div>
              <p className='text-sm font-bold text-gray-900'>
                {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
              </p>
            </div>
          </div>

          {/*<div className='flex items-center gap-2 pt-1'>
            <span className='text-xs text-gray-400'>{t('detailPage.engagementId')}</span>
            <code className='text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[240px]'>
              {agent.engagement_id}
            </code>
          </div>*/}
        </dl>
      </CardContent>
    </Card>
  );
}
