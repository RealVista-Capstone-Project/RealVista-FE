'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AgentEngagement, CreateReviewPayload } from '@/entities/agent-engagement';
import { Card, CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  Star,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Home,
  Award,
  MessageSquarePlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { getInitials, getStatusColor, toStringArray } from '../lib/utils';
import { useTranslations } from 'next-intl';
import { CompleteConfirmDialog } from './complete-confirm-dialog';
import { CancelContractDialog } from './cancel-contract-dialog';
import { ReviewModal } from './review-modal';
import {
  useFinishEngagementMutation,
  useCancelEngagementMutation,
  useSubmitReviewMutation,
} from '../hooks/use-hired-agents';

interface AgentProfileSidebarProps {
  agent: AgentEngagement;
  /** Called after a successful status mutation so the parent can refresh/update state. */
  onAgentUpdate: (updated: AgentEngagement) => void;
}

export function AgentProfileSidebar({ agent, onAgentUpdate }: AgentProfileSidebarProps) {
  const t = useTranslations('AgentEngagement');

  const statusKey = `status.${agent.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : agent.status;

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const finishMutation = useFinishEngagementMutation();
  const cancelMutation = useCancelEngagementMutation();
  const reviewMutation = useSubmitReviewMutation();

  const openReviewAfterDelay = useCallback(() => {
    setTimeout(() => setReviewModalOpen(true), 600);
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      await finishMutation.mutateAsync(agent.engagement_id);
      setCompleteDialogOpen(false);
      const updated = { ...agent, status: 'COMPLETED' };
      onAgentUpdate(updated);
      toast.success(t('toast.completeSuccess'));
      openReviewAfterDelay();
    } catch {
      toast.error(t('toast.completeError'));
    }
  }, [agent, finishMutation, onAgentUpdate, t, openReviewAfterDelay]);

  const handleCancel = useCallback(
    async (reason: string) => {
      try {
        await cancelMutation.mutateAsync({ engagementId: agent.engagement_id, reason });
        setCancelDialogOpen(false);
        const updated = { ...agent, status: 'CANCELLED' };
        onAgentUpdate(updated);
        toast.success(t('toast.cancelSuccess'));
        openReviewAfterDelay();
      } catch {
        toast.error(t('toast.cancelError'));
      }
    },
    [agent, cancelMutation, onAgentUpdate, t, openReviewAfterDelay]
  );

  const handleReviewSubmit = useCallback(
    async (payload: Omit<CreateReviewPayload, 'engagement_id'>) => {
      try {
        await reviewMutation.mutateAsync({ ...payload, engagement_id: agent.engagement_id });
        setReviewModalOpen(false);
        onAgentUpdate({ ...agent, has_review: true });
        toast.success(t('toast.reviewSuccess'));
      } catch {
        toast.error(t('toast.reviewError'));
      }
    },
    [agent, reviewMutation, onAgentUpdate, t]
  );

  const status = agent.status.toUpperCase();
  const hasReview = agent.has_review ?? false;

  const renderActionButtons = () => {
    if (status === 'ACTIVE' || status === 'ACCEPTED') {
      return (
        <div className='flex flex-col gap-2'>
          <Button
            className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-lg h-10 gap-2'
            onClick={() => setCompleteDialogOpen(true)}
            disabled={finishMutation.isPending}
          >
            <CheckCircle2 className='h-4 w-4' />
            {t('actions.completeContract')}
          </Button>
          <Button
            variant='outline'
            className='w-full border-destructive/40 text-destructive hover:bg-red-50 hover:border-destructive font-semibold rounded-lg h-10 gap-2'
            onClick={() => setCancelDialogOpen(true)}
            disabled={cancelMutation.isPending}
          >
            <XCircle className='h-4 w-4' />
            {t('actions.cancelContract')}
          </Button>
        </div>
      );
    }

    if (status === 'PENDING') {
      return (
        <Button
          variant='outline'
          className='w-full border-destructive/40 text-destructive hover:bg-red-50 hover:border-destructive font-semibold rounded-lg h-10 gap-2'
          onClick={() => setCancelDialogOpen(true)}
          disabled={cancelMutation.isPending}
        >
          <XCircle className='h-4 w-4' />
          {t('actions.cancelRequest')}
        </Button>
      );
    }

    if ((status === 'COMPLETED' || status === 'CANCELLED') && !hasReview) {
      return (
        <Button
          className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-lg h-10 gap-2'
          onClick={() => setReviewModalOpen(true)}
          disabled={reviewMutation.isPending}
        >
          <MessageSquarePlus className='h-4 w-4' />
          {t('detailPanel.addReview')}
        </Button>
      );
    }

    if ((status === 'COMPLETED' || status === 'CANCELLED') && hasReview) {
      return (
        <div className='flex items-center justify-center gap-2 py-2 text-sm text-gray-500'>
          <CheckCircle2 className='h-4 w-4 text-green-500' />
          {t('actions.alreadyReviewed')}
        </div>
      );
    }

    return null;
  };

  const actionButtons = renderActionButtons();

  return (
    <>
      <Card className='border-none shadow-sm rounded-xl overflow-hidden sticky top-4'>
        {/* Profile header */}
        <div className='p-6 flex flex-col items-center bg-gradient-to-b from-indigo-50/60 to-white border-b border-gray-100'>
          <Avatar className='h-20 w-20 mb-3 border-4 border-white shadow ring-1 ring-gray-100'>
            <AvatarImage src={agent.agent_avatar_url ?? undefined} alt={agent.agent_full_name} />
            <AvatarFallback className='bg-indigo-100 text-indigo-700 text-lg font-bold'>
              {getInitials(agent.agent_full_name)}
            </AvatarFallback>
          </Avatar>

          <h2 className='text-lg font-bold text-gray-900 text-center'>{agent.agent_full_name}</h2>

          {agent.agent_service_areas && toStringArray(agent.agent_service_areas).length > 0 && (
            <p className='text-xs text-gray-500 mt-0.5 text-center'>
              {toStringArray(agent.agent_service_areas)[0]}
            </p>
          )}

          {agent.agent_rating !== null && (
            <div className='flex items-center gap-1 mt-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(agent.agent_rating ?? 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-200'
                  )}
                />
              ))}
              <span className='text-sm text-gray-500 ml-1'>
                ({agent.agent_rating.toFixed(1)})
              </span>
            </div>
          )}

          <Badge
            variant='secondary'
            className={cn(
              'mt-3 text-xs px-3 py-0.5 font-medium pointer-events-none',
              getStatusColor(agent.status)
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <CardContent className='p-5 space-y-5'>
          {/* Contact */}
          <div className='space-y-3'>
            {agent.agent_email && (
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 flex-shrink-0'>
                  <Mail className='h-4 w-4 text-indigo-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-gray-400'>{t('detailPanel.email')}</p>
                  <p className='text-sm font-medium text-gray-900 truncate'>{agent.agent_email}</p>
                </div>
              </div>
            )}
            {agent.agent_phone && (
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-green-50 flex-shrink-0'>
                  <Phone className='h-4 w-4 text-green-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-gray-400'>{t('detailPanel.phone')}</p>
                  <p className='text-sm font-medium text-gray-900'>{agent.agent_phone}</p>
                </div>
              </div>
            )}
            {toStringArray(agent.agent_service_areas).length > 0 && (
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-orange-50 flex-shrink-0'>
                  <MapPin className='h-4 w-4 text-orange-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-gray-400'>{t('detailPanel.serviceAreas')}</p>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {toStringArray(agent.agent_service_areas).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Professional stats */}
          <div className='grid grid-cols-3 gap-3 text-center'>
            <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
              <Briefcase className='h-4 w-4 text-indigo-500 mx-auto mb-1' />
              <p className='text-base font-bold text-gray-900'>
                {agent.agent_years_of_experience ?? '—'}
              </p>
              <p className='text-[10px] text-gray-400 leading-tight'>
                {t('detailPanel.experience')}
              </p>
            </div>
            <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
              <Home className='h-4 w-4 text-blue-500 mx-auto mb-1' />
              <p className='text-base font-bold text-gray-900'>
                {agent.agent_properties_sold ?? '—'}
              </p>
              <p className='text-[10px] text-gray-400 leading-tight'>
                {t('detailPanel.propertiesSold')}
              </p>
            </div>
            <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
              <Award className='h-4 w-4 text-purple-500 mx-auto mb-1' />
              <p className='text-[11px] font-bold text-gray-900 truncate'>
                {agent.engagement_type}
              </p>
              <p className='text-[10px] text-gray-400 leading-tight'>
                {t('detailPanel.engagementType')}
              </p>
            </div>
          </div>

          {/* Specialties */}
          {toStringArray(agent.agent_specialties).length > 0 && (
            <div>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>
                {t('detailPanel.specialties')}
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {toStringArray(agent.agent_specialties).map((s) => (
                  <Badge
                    key={s}
                    variant='outline'
                    className='text-xs font-medium bg-indigo-50/50 text-indigo-700 border-indigo-100'
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {agent.agent_bio && (
            <div>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>
                {t('detailPanel.about')}
              </p>
              <p className='text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 line-clamp-4'>
                {agent.agent_bio}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {actionButtons && (
            <>
              <Separator />
              {actionButtons}
            </>
          )}
        </CardContent>
      </Card>

      <CompleteConfirmDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        agent={agent}
        onConfirm={handleComplete}
        isLoading={finishMutation.isPending}
      />

      <CancelContractDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        agent={agent}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />

      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        agent={agent}
        onSubmit={handleReviewSubmit}
        onSkip={() => setReviewModalOpen(false)}
        isLoading={reviewMutation.isPending}
      />
    </>
  );
}
