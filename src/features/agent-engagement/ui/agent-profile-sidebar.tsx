'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AgentEngagement, CreateReviewPayload } from '@/entities/agent-engagement';
import { CardContent } from '@/shared/ui/card';
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

  const statusKey = `status.${(agent.status ?? '').toLowerCase()}` as const;
  const statusLabel = agent.status && t.has(statusKey) ? t(statusKey) : (agent.status ?? '');

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

  const status = (agent.status ?? '').toUpperCase();
  const hasReview = agent.has_review ?? false;

  const renderActionButtons = () => {
    if (status === 'ACTIVE' || status === 'ACCEPTED') {
      return (
        <div className='flex flex-col gap-2'>
          <Button
            className='w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-indigo-200/60'
            onClick={() => setCompleteDialogOpen(true)}
            disabled={finishMutation.isPending}
          >
            <CheckCircle2 className='h-4 w-4' />
            {t('actions.completeContract')}
          </Button>
          <Button
            variant='outline'
            className='w-full border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 font-semibold rounded-xl h-10 gap-2'
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
          className='w-full border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 font-semibold rounded-xl h-10 gap-2'
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
          className='w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-indigo-200/60'
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
        <div className='flex items-center justify-center gap-2 py-2 text-sm bg-green-50 rounded-xl border border-green-100'>
          <CheckCircle2 className='h-4 w-4 text-green-500' />
          <span className='font-medium text-green-700'>{t('actions.alreadyReviewed')}</span>
        </div>
      );
    }

    return null;
  };

  const actionButtons = renderActionButtons();

  return (
    <>
      <div className='bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-4'>
        {/* Profile header */}
        <div className='px-6 pt-6 pb-5 flex flex-col items-center bg-gradient-to-br from-primary/5 via-primary/5 to-white border-b border-gray-100 relative'>
          <div className='relative mb-3'>
            <Avatar className='h-20 w-20 ring-4 ring-white shadow-md'>
              <AvatarImage src={agent.agent_avatar_url ?? undefined} alt={agent.agent_full_name} />
              <AvatarFallback className='bg-indigo-100 text-primary700 text-lg font-bold'>
                {getInitials(agent.agent_full_name)}
              </AvatarFallback>
            </Avatar>
            {/* Status dot */}
            <span
              className={cn(
                'absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm',
                status === 'ACTIVE' || status === 'ACCEPTED'
                  ? 'bg-emerald-400'
                  : status === 'PENDING'
                    ? 'bg-amber-400'
                    : status === 'COMPLETED'
                      ? 'bg-blue-400'
                      : 'bg-gray-300'
              )}
            />
          </div>

          <h2 className='text-base font-bold text-gray-900 text-center leading-tight'>
            {agent.agent_full_name}
          </h2>

          {agent.agent_service_areas && toStringArray(agent.agent_service_areas).length > 0 && (
            <p className='text-xs text-gray-400 mt-0.5 text-center'>
              {toStringArray(agent.agent_service_areas)[0]}
            </p>
          )}

          {agent.agent_rating != null && (
            <div className='flex items-center gap-0.5 mt-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < Math.round(agent.agent_rating ?? 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  )}
                />
              ))}
              <span className='text-xs text-gray-500 ml-1.5 font-medium'>
                {agent.agent_rating.toFixed(1)}
              </span>
            </div>
          )}

          <Badge
            variant='secondary'
            className={cn(
              'mt-2.5 text-xs px-3 py-0.5 font-semibold pointer-events-none rounded-full',
              getStatusColor(agent.status)
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <CardContent className='p-5 space-y-5'>
          {/* Contact */}
          <section className='space-y-3'>
            {agent.agent_email && (
              <div className='flex items-center gap-3'>
                <div className='h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0'>
                  <Mail className='h-3.5 w-3.5 text-primary500' />
                </div>
                <div className='min-w-0'>
                  <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                    {t('detailPanel.email')}
                  </p>
                  <p className='text-sm font-semibold text-gray-800 truncate'>
                    {agent.agent_email}
                  </p>
                </div>
              </div>
            )}
            {agent.agent_phone && (
              <div className='flex items-center gap-3'>
                <div className='h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0'>
                  <Phone className='h-3.5 w-3.5 text-green-500' />
                </div>
                <div className='min-w-0'>
                  <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                    {t('detailPanel.phone')}
                  </p>
                  <p className='text-sm font-semibold text-gray-800'>{agent.agent_phone}</p>
                </div>
              </div>
            )}
            {toStringArray(agent.agent_service_areas).length > 0 && (
              <div className='flex items-center gap-3'>
                <div className='h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0'>
                  <MapPin className='h-3.5 w-3.5 text-orange-500' />
                </div>
                <div className='min-w-0'>
                  <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                    {t('detailPanel.serviceAreas')}
                  </p>
                  <p className='text-sm font-semibold text-gray-800 truncate'>
                    {toStringArray(agent.agent_service_areas).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </section>

          <Separator className='bg-gray-100' />

          {/* Professional stats */}
          <section>
            <div className='grid grid-cols-3 gap-2.5 text-center'>
              <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                <Briefcase className='h-4 w-4 text-primary400 mx-auto mb-1.5' />
                <p className='text-base font-bold text-gray-900 tabular-nums'>
                  {agent.agent_years_of_experience ?? '—'}
                </p>
                <p className='text-[10px] text-gray-400 leading-tight mt-0.5'>
                  {t('detailPanel.experience')}
                </p>
              </div>
              <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                <Home className='h-4 w-4 text-blue-400 mx-auto mb-1.5' />
                <p className='text-base font-bold text-gray-900 tabular-nums'>
                  {agent.agent_properties_sold ?? '—'}
                </p>
                <p className='text-[10px] text-gray-400 leading-tight mt-0.5'>
                  {t('detailPanel.propertiesSold')}
                </p>
              </div>
              <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                <Award className='h-4 w-4 text-primary/60 mx-auto mb-1.5' />
                <p className='text-[11px] font-bold text-gray-900 truncate'>
                  {agent.engagement_type}
                </p>
                <p className='text-[10px] text-gray-400 leading-tight mt-0.5'>
                  {t('detailPanel.engagementType')}
                </p>
              </div>
            </div>
          </section>

          {/* Specialties */}
          {toStringArray(agent.agent_specialties).length > 0 && (
            <section>
              <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2'>
                {t('detailPanel.specialties')}
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {toStringArray(agent.agent_specialties).map((s) => (
                  <Badge
                    key={s}
                    variant='outline'
                    className='text-xs font-semibold bg-primary/5/60 text-primary600 border-indigo-100 rounded-lg px-2.5 py-0.5'
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Bio */}
          {agent.agent_bio && (
            <section>
              <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2'>
                {t('detailPanel.about')}
              </p>
              <p className='text-sm text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100 line-clamp-4'>
                {agent.agent_bio}
              </p>
            </section>
          )}

          {/* Action buttons */}
          {actionButtons && (
            <>
              <Separator className='bg-gray-100' />
              {actionButtons}
            </>
          )}
        </CardContent>
      </div>

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
