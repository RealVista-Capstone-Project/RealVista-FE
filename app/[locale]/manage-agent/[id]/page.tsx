import { AgentEngagementDetailLoader } from '@/features/agent-engagement/ui/agent-engagement-detail-loader';

interface ManageAgentDetailRouteProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ManageAgentDetailRoute({ params }: ManageAgentDetailRouteProps) {
  const { id } = await params;
  return <AgentEngagementDetailLoader engagementId={id} />;
}
