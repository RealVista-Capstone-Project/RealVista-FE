'use client';

import type { AgentPerformancePeriod } from '../model/agent-dashboard.types';
import { useAgentPerformanceMetrics } from '../api/use-agent-dashboard';
import { AgentDashboardPerformanceChartContent } from './agent-dashboard-performance-chart';
import { AgentDashboardTopListingsContent } from './agent-dashboard-top-listings-card';
import { Card, CardContent } from '@/shared/ui/card';
import { useState } from 'react';

export function AgentDashboardInsightsCard() {
  const [selectedPeriod, setSelectedPeriod] = useState<AgentPerformancePeriod>('M');
  const performanceQuery = useAgentPerformanceMetrics(selectedPeriod);
  const trendData = performanceQuery.data?.data.trend ?? [];

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-6 px-6 pb-6 pt-6'>
        <AgentDashboardPerformanceChartContent
          trendData={trendData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <div className='border-t border-border/60 pt-6'>
          <AgentDashboardTopListingsContent />
        </div>
      </CardContent>
    </Card>
  );
}
