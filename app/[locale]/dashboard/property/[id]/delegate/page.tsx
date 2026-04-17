'use client';

import React, { use } from 'react';
import DelegateAgentPage from '@/screens/dashboard/delegate-agent/ui/delegate-agent-page';

interface DelegatePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function Page({ params }: DelegatePageProps) {
  const resolvedParams = use(params);
  return <DelegateAgentPage propertyId={resolvedParams.id} />;
}
