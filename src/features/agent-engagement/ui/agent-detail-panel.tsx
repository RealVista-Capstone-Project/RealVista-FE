'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { AgentEngagement, CreateReviewPayload } from '@/entities/agent-engagement';
import { CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  X,
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
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatDate, getInitials, getStatusColor, toStringArray } from '../lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useManageAgentContext } from '../model/manage-agent-context';
import { CompleteConfirmDialog } from './complete-confirm-dialog';
import { CancelContractDialog } from './cancel-contract-dialog';
import { ReviewModal } from './review-modal';
import {
  useFinishEngagementMutation,
  useCancelEngagementMutation,
  useSubmitReviewMutation,
} from '../hooks/use-hired-agents';
import { ROUTES } from '@/shared/config/routes';

interface AgentDetailPanelProps {
  agent: AgentEngagement;
  onClose: () => void;
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const t = useTranslations('AgentEngagement');
  const locale = useLocale();
  const { setSelectedAgent } = useManageAgentContext();

  const statusKey = `status.${agent.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : agent.status;

  // Dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const finishMutation = useFinishEngagementMutation();
  const cancelMutation = useCancelEngagementMutation();
  const reviewMutation = useSubmitReviewMutation();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openReviewAfterDelay = useCallback(() => {
    setTimeout(() => setReviewModalOpen(true), 600);
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      await finishMutation.mutateAsync(agent.engagement_id);
      setCompleteDialogOpen(false);
      setSelectedAgent({ ...agent, status: 'COMPLETED' });
      toast.success(t('toast.completeSuccess'));
      openReviewAfterDelay();
    } catch {
      toast.error(t('toast.completeError'));
    }
  }, [agent, finishMutation, setSelectedAgent, t, openReviewAfterDelay]);

  const handleCancel = useCallback(async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ engagementId: agent.engagement_id, reason });
      setCancelDialogOpen(false);
      setSelectedAgent({ ...agent, status: 'CANCELLED' });
      toast.success(t('toast.cancelSuccess'));
      openReviewAfterDelay();
    } catch {
      toast.error(t('toast.cancelError'));
    }
  }, [agent, cancelMutation, setSelectedAgent, t, openReviewAfterDelay]);

  const handleReviewSubmit = useCallback(
    async (payload: Omit<CreateReviewPayload, 'engagement_id'>) => {
      try {
        await reviewMutation.mutateAsync({ ...payload, engagement_id: agent.engagement_id });
        setReviewModalOpen(false);
        setSelectedAgent({ ...agent, has_review: true });
        toast.success(t('toast.reviewSuccess'));
      } catch {
        toast.error(t('toast.reviewError'));
      }
    },
    [agent, reviewMutation, setSelectedAgent, t]
  );

  const handleReviewSkip = useCallback(() => {
    setReviewModalOpen(false);
  }, []);

  // ── Action buttons logic ────────────────────────────────────────────────────

  const status = agent.status.toUpperCase();
  const hasReview = agent.has_review ?? false;

  const renderActionButtons = () => {
    if (status === 'ACTIVE' || status === 'ACCEPTED') {
      return (
        <div className='flex flex-col gap-2'>
          <Button
            className='w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-indigo-200/60'
            onClick={() => setCompleteDialogOpen(true)}
          >
            <CheckCircle2 className='h-4 w-4' />
            {t('actions.completeContract')}
          </Button>
          <Button
            variant='outline'
            className='w-full border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 font-semibold rounded-xl h-10 gap-2'
            onClick={() => setCancelDialogOpen(true)}
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
        >
          <XCircle className='h-4 w-4' />
          {t('actions.cancelRequest')}
        </Button>
      );
    }

    if ((status === 'COMPLETED' || status === 'CANCELLED') && !hasReview) {
      return (
        <Button
          className='w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-indigo-200/60'
          onClick={() => setReviewModalOpen(true)}
        >
          <MessageSquarePlus className='h-4 w-4' />
          {t('detailPanel.addReview')}
        </Button>
      );
    }

    if ((status === 'COMPLETED' || status === 'CANCELLED') && hasReview) {
      return (
        <div className='flex items-center justify-center gap-2 py-2 text-sm text-gray-500 bg-green-50 rounded-xl border border-green-100'>
          <CheckCircle2 className='h-4 w-4 text-green-500' />
          <span className='font-medium text-green-700'>{t('actions.alreadyReviewed')}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        id='agent-detail-panel'
        key={agent.engagement_id}
        className='w-full lg:w-[380px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-lg flex flex-col max-h-[calc(100vh-120px)] animate-in slide-in-from-right-4 fade-in duration-300 sticky top-4 overflow-hidden'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white flex-none'>
          <h2 className='font-bold text-sm text-gray-900 tracking-tight'>
            {t('detailPanel.title')}
          </h2>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg'
            onClick={onClose}
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>

        {/* Scrollable Content */}
        <CardContent className='p-0 flex-1 overflow-y-auto min-h-0'>
          {/* Profile Banner */}
          <div className='relative bg-gradient-to-br from-indigo-50 via-purple-50/40 to-white px-6 pt-6 pb-5 border-b border-gray-100'>
            <div className='flex flex-col items-center'>
              <div className='relative mb-3'>
                <Avatar className='h-20 w-20 ring-4 ring-white shadow-md'>
                  <AvatarImage
                    src={agent.agent_avatar_url ?? undefined}
                    alt={agent.agent_full_name}
                  />
                  <AvatarFallback className='bg-indigo-100 text-indigo-700 text-xl font-bold'>
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
              <h3 className='text-base font-bold text-gray-900 text-center leading-tight'>
                {agent.agent_full_name}
              </h3>

              {/* Star Rating */}
              {agent.agent_rating != null && (
                <div className='flex items-center gap-0.5 mt-1.5'>
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
                    {agent.agent_rating?.toFixed(1)}
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
          </div>

          <div className='p-5 space-y-5'>
            {/* Contact Info */}
            <section className='space-y-3'>
              <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                {t('detailPanel.contactInfo')}
              </h4>
              {agent.agent_email && (
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0'>
                    <Mail className='h-3.5 w-3.5 text-indigo-500' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-[10px] text-gray-400 font-medium'>
                      {t('detailPanel.email')}
                    </div>
                    <div className='text-sm font-semibold text-gray-800 truncate'>
                      {agent.agent_email}
                    </div>
                  </div>
                </div>
              )}
              {agent.agent_phone && (
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0'>
                    <Phone className='h-3.5 w-3.5 text-green-500' />
                  </div>
                  <div>
                    <div className='text-[10px] text-gray-400 font-medium'>
                      {t('detailPanel.phone')}
                    </div>
                    <div className='text-sm font-semibold text-gray-800'>
                      {agent.agent_phone}
                    </div>
                  </div>
                </div>
              )}
              {toStringArray(agent.agent_service_areas).length > 0 && (
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0'>
                    <MapPin className='h-3.5 w-3.5 text-orange-500' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-[10px] text-gray-400 font-medium'>
                      {t('detailPanel.serviceAreas')}
                    </div>
                    <div className='text-sm font-semibold text-gray-800 truncate'>
                      {toStringArray(agent.agent_service_areas).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator className='bg-gray-100' />

            {/* Professional Info */}
            <section>
              <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3'>
                {t('detailPanel.professionalInfo')}
              </h4>
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                  <div className='flex items-center gap-1.5 text-[10px] text-gray-400 mb-1'>
                    <Briefcase className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.experience')}
                    </span>
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.agent_years_of_experience !== null
                      ? t('detailPanel.yearsUnit', {
                        count: agent.agent_years_of_experience,
                      })
                      : t('common.na')}
                  </div>
                </div>
                <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                  <div className='flex items-center gap-1.5 text-[10px] text-gray-400 mb-1'>
                    <Home className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.propertiesSold')}
                    </span>
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.agent_properties_sold ?? t('common.na')}
                  </div>
                </div>
                <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                  <div className='flex items-center gap-1.5 text-[10px] text-gray-400 mb-1'>
                    <Award className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.engagementType')}
                    </span>
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.engagement_type}
                  </div>
                </div>
                <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                  <div className='flex items-center gap-1.5 text-[10px] text-gray-400 mb-1'>
                    <Calendar className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.hiredDate')}
                    </span>
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            {toStringArray(agent.agent_specialties).length > 0 && (
              <section>
                <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5'>
                  {t('detailPanel.specialties')}
                </h4>
                <div className='flex flex-wrap gap-1.5'>
                  {toStringArray(agent.agent_specialties).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant='outline'
                      className='text-xs font-semibold bg-indigo-50/60 text-indigo-600 border-indigo-100 rounded-lg px-2.5 py-0.5'
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Bio */}
            {agent.agent_bio && (
              <section>
                <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5'>
                  {t('detailPanel.about')}
                </h4>
                <p className='text-sm text-gray-600 leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100'>
                  {agent.agent_bio}
                </p>
              </section>
            )}

            {/* Assigned Property */}
            <section>
              <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5'>
                {t('detailPanel.assignedProperty')}
              </h4>
              <div className='bg-indigo-50/40 border border-indigo-100/70 p-4 rounded-xl space-y-2'>
                {agent.property_address && (
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-3.5 w-3.5 text-indigo-400 mt-0.5 flex-shrink-0' />
                    <span className='text-sm text-gray-700 font-medium leading-snug'>
                      {agent.property_address}
                    </span>
                  </div>
                )}
                <div className='flex items-center gap-2 flex-wrap'>
                  {agent.property_type_name && (
                    <span className='text-xs bg-white text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-lg font-semibold'>
                      {agent.property_type_name}
                    </span>
                  )}
                  {agent.property_location_name && (
                    <span className='text-xs text-gray-400 font-medium'>
                      {agent.property_location_name}
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </CardContent>

        {/* Footer */}
        <div className='p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex-none space-y-2.5'>
          {renderActionButtons()}
          <Link
            href={`/${locale}${ROUTES.dashboard.agentDetail(agent.engagement_id)}`}
            className='flex items-center justify-center gap-1.5 w-full text-xs text-primary hover:text-primary-hover font-semibold py-2 rounded-xl hover:bg-indigo-50 transition-colors'
          >
            <ExternalLink className='h-3 w-3' />
            {t('detailPage.viewFullDetails')}
          </Link>
        </div>
      </div>

      {/* Dialogs */}
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
        onSkip={handleReviewSkip}
        isLoading={reviewMutation.isPending}
      />
    </>
  );
}
