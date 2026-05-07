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
    <Card className='overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm'>
      <CardHeader className='px-5 pt-5 pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-sm font-bold text-foreground'>
              {t('detailPage.listingsTitle')}
            </CardTitle>
            <p className='mt-1 text-xs text-muted-foreground'>{t('detailPage.listingsSubtitle')}</p>
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
              className='overflow-hidden rounded-xl border border-dashed border-primary/20 bg-sky-50/40 dark:bg-muted/20'
            >
              <div className='flex h-28 items-center justify-center bg-gradient-to-br from-sky-100/70 to-primary/5'>
                <Home className='h-7 w-7 text-muted/35' />
              </div>
              <div className='space-y-2 p-3'>
                <div className='h-2.5 w-3/4 animate-pulse rounded-full bg-primary/15' />
                <div className='h-2.5 w-1/2 animate-pulse rounded-full bg-primary/10' />
                <div className='flex gap-2 pt-1'>
                  <div className='h-2 w-16 animate-pulse rounded-full bg-primary/12' />
                  <div className='h-2 w-12 animate-pulse rounded-full bg-primary/10' />
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
