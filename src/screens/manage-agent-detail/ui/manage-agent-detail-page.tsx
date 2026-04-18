'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useTranslations } from 'next-intl';
import type { AgentEngagement } from '@/entities/agent-engagement';
import { EngagementSummaryCard } from '@/features/agent-engagement/ui/engagement-summary-card';
import { AgentListingsSection } from '@/features/agent-engagement/ui/agent-listings-section';
import { AgentProfileSidebar } from '@/features/agent-engagement/ui/agent-profile-sidebar';
import { SoldListingsCard } from '@/features/agent-engagement/ui/sold-listings-card';

interface ManageAgentDetailPageProps {
  /** Initial agent data passed from the server (from query cache or SSR). */
  initialAgent: AgentEngagement;
}

export function ManageAgentDetailPage({ initialAgent }: ManageAgentDetailPageProps) {
  const t = useTranslations('AgentEngagement');
  const router = useRouter();

  // Keep local state so mutations in the sidebar can optimistically update the UI
  // without navigating away. Query invalidation will sync the list in the background.
  const [agent, setAgent] = useState<AgentEngagement>(initialAgent);

  return (
    <div className='h-full bg-primary/5 font-sans'>
      {/* Page Header */}
      <div className='bg-white border-b border-gray-100'>
        <div className='container mx-auto px-6 py-4 flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0'
            onClick={() => router.back()}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-lg font-bold text-gray-900 tracking-tight'>
              {agent.agent_full_name}
            </h1>
            <p className='text-xs text-gray-400 mt-0.5'>
              {t('detailPage.backToList')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='container mx-auto px-6 py-6'>
        {/* Two-column layout */}
        <div className='flex flex-col xl:flex-row gap-6 items-start'>
          {/* Left column — engagement summary + listings */}
          <div className='flex-1 flex flex-col gap-6 min-w-0'>
            <SoldListingsCard agent={agent} />
            <EngagementSummaryCard agent={agent} />
            <AgentListingsSection agent={agent} />
          </div>

          {/* Right column — agent profile + action buttons */}
          <div className='w-full xl:w-[340px] flex-shrink-0'>
            <AgentProfileSidebar agent={agent} onAgentUpdate={setAgent} />
          </div>
        </div>
      </div>
    </div>
  );
}
