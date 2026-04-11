'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import type { OwnerPropertySummary } from '@/entities/property';
import { agentEngagementApi } from '@/entities/agent-engagement';
import { useAuthSession, isAuthenticated } from '@/features/auth/model';

/**
 * Apply-proposal CTA + modal wiring for agent browsing owner-listed properties.
 * Uses engagement apply-state API and optional local lock after successful submit.
 */
export function useAgentProposalCtaForOwnerProperty(property: OwnerPropertySummary | null) {
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyBlockedLocal, setApplyBlockedLocal] = useState(false);

  useEffect(() => {
    setApplyBlockedLocal(false);
    setIsApplyModalOpen(false);
  }, [property?.property_id]);

  const backendRoles = session?.user?.backendRoles ?? [];
  const isAgent = backendRoles.includes('AGENT');
  const initiatorId = session?.user?.id;
  const receiverId = property?.owner_id;
  const targetPropertyId = property?.property_id;

  const { data: applyStateResponse } = useQuery({
    queryKey: ['agent-proposal-apply-state', initiatorId, receiverId, targetPropertyId],
    queryFn: () =>
      agentEngagementApi.getAgentProposalApplyState(initiatorId!, receiverId!, targetPropertyId!),
    enabled: isAgent && !!initiatorId && !!receiverId && !!targetPropertyId,
    staleTime: 2 * 60 * 1000,
  });

  const cannotApplyProposal =
    applyBlockedLocal || applyStateResponse?.payload?.data?.can_apply_proposal === false;

  const openApplyModal = useCallback(() => {
    if (!isAuthenticated(session)) {
      const locale = params?.locale || 'vi';
      router.push(`/${locale}/login`);
      return;
    }
    setIsApplyModalOpen(true);
  }, [session, params?.locale, router]);

  const onApplySubmitSuccess = useCallback(() => {
    setApplyBlockedLocal(true);
    queryClient.invalidateQueries({ queryKey: ['properties', 'owner-available'] });
    if (initiatorId && receiverId && targetPropertyId) {
      queryClient.invalidateQueries({
        queryKey: ['agent-proposal-apply-state', initiatorId, receiverId, targetPropertyId],
      });
    }
  }, [queryClient, initiatorId, receiverId, targetPropertyId]);

  return {
    isAgent,
    isApplyModalOpen,
    setIsApplyModalOpen,
    cannotApplyProposal,
    openApplyModal,
    onApplySubmitSuccess,
    propertyId: property?.property_id ?? '',
  };
}
