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
    <div className='container mx-auto p-4 md:px-6 md:py-0 bg-[#F7F7FD] min-h-screen font-sans'>
      {/* Back navigation */}
      <div className='mb-3'>
        <Button
          variant='ghost'
          size='sm'
          className='gap-2 text-gray-600 hover:text-gray-900 hover:bg-white -ml-2'
          onClick={() => router.back()}
        >
          <ArrowLeft className='h-4 w-4' />
          {t('detailPage.backToList')}
        </Button>
      </div>

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
  );
}
