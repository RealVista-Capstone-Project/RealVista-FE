'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Construction, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AgentListingsSectionProps {
  agent?: AgentEngagement;
}

/**
 * Displays listings created by the agent for the owner's property.
 * Currently shows a "coming soon" placeholder until the backend endpoint is ready.
 * TODO: wire up GET /engagements/{id}/listings when available.
 */
export function AgentListingsSection(_props: AgentListingsSectionProps) {
  const t = useTranslations('AgentEngagement');

  return (
    <Card className='border border-gray-100 shadow-sm rounded-2xl overflow-hidden'>
      <CardHeader className='px-5 pt-5 pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-sm font-bold text-gray-900'>
              {t('detailPage.listingsTitle')}
            </CardTitle>
            <p className='text-xs text-gray-400 mt-1'>{t('detailPage.listingsSubtitle')}</p>
          </div>
          <Badge
            variant='outline'
            className='text-[10px] font-semibold text-amber-600 border-amber-200 bg-amber-50 rounded-full px-2.5 flex-shrink-0'
          >
            Coming Soon
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='px-5 pb-5'>
        {/* Placeholder skeleton cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='rounded-xl border border-dashed border-gray-200 bg-gray-50/60 overflow-hidden'
            >
              <div className='h-28 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center'>
                <Home className='h-7 w-7 text-gray-200' />
              </div>
              <div className='p-3 space-y-2'>
                <div className='h-2.5 bg-gray-200/80 rounded-full animate-pulse w-3/4' />
                <div className='h-2.5 bg-gray-200/60 rounded-full animate-pulse w-1/2' />
                <div className='flex gap-2 pt-1'>
                  <div className='h-2 bg-gray-200/60 rounded-full animate-pulse w-16' />
                  <div className='h-2 bg-gray-200/60 rounded-full animate-pulse w-12' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className='flex flex-col items-center justify-center py-5 text-center border border-dashed border-amber-200/80 rounded-2xl bg-amber-50/40'>
          <div className='h-10 w-10 rounded-xl bg-amber-100/80 flex items-center justify-center mb-3'>
            <Construction className='h-5 w-5 text-amber-500' />
          </div>
          <p className='text-sm font-semibold text-amber-700'>
            {t('detailPage.listingsComingSoon')}
          </p>
          <p className='text-xs text-amber-600/70 mt-1 max-w-xs leading-relaxed'>
            {t('detailPage.listingsComingSoonDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
