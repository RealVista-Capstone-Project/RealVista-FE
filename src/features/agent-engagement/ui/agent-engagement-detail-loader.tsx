'use client';

import { useEngagementDetailQuery } from '../hooks/use-hired-agents';
import { ManageAgentDetailPage } from '@/screens/manage-agent-detail';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AgentEngagementDetailLoaderProps {
  engagementId: string;
}

/**
 * Client-side loader for the agent engagement detail page.
 * Fetches the engagement by ID and renders the detail page or appropriate state.
 */
export function AgentEngagementDetailLoader({ engagementId }: AgentEngagementDetailLoaderProps) {
  const t = useTranslations('ManageAgent');
  const { data, isLoading, isError } = useEngagementDetailQuery(engagementId);
  console.log('data', data )

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px] text-gray-500 gap-3'>
        <Loader2 className='h-5 w-5 animate-spin' />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (isError || !data?.payload?.data) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-3'>
        <AlertCircle className='h-8 w-8' />
        <span>{t('error')}</span>
      </div>
    );
  }

  return <ManageAgentDetailPage initialAgent={data.payload.data} />;
}
