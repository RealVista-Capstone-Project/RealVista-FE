'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Construction, Home, DollarSign, CalendarDays } from 'lucide-react';
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
    <Card className='border-none shadow-sm rounded-xl'>
      <CardHeader className='px-6 pt-5 pb-3'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-base font-bold text-gray-900'>
              {t('detailPage.listingsTitle')}
            </CardTitle>
            <p className='text-xs text-gray-400 mt-1'>{t('detailPage.listingsSubtitle')}</p>
          </div>
          <Badge variant='outline' className='text-xs text-amber-600 border-amber-200 bg-amber-50'>
            Coming Soon
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='px-6 pb-6'>
        {/* Placeholder skeleton cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='rounded-xl border border-dashed border-gray-200 bg-gray-50 overflow-hidden'
            >
              {/* Image placeholder */}
              <div className='h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'>
                <Home className='h-8 w-8 text-gray-300' />
              </div>
              {/* Content placeholder */}
              <div className='p-3 space-y-2'>
                <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
                <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2' />
                <div className='flex items-center gap-3 pt-1'>
                  <div className='flex items-center gap-1 text-xs text-gray-300'>
                    <DollarSign className='h-3 w-3' />
                    <div className='h-2.5 bg-gray-200 rounded animate-pulse w-16' />
                  </div>
                  <div className='flex items-center gap-1 text-xs text-gray-300'>
                    <CalendarDays className='h-3 w-3' />
                    <div className='h-2.5 bg-gray-200 rounded animate-pulse w-12' />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className='flex flex-col items-center justify-center py-6 text-center border border-dashed border-amber-200 rounded-xl bg-amber-50/50'>
          <Construction className='h-8 w-8 text-amber-400 mb-3' />
          <p className='text-sm font-semibold text-amber-700'>
            {t('detailPage.listingsComingSoon')}
          </p>
          <p className='text-xs text-amber-600/80 mt-1 max-w-sm'>
            {t('detailPage.listingsComingSoonDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
