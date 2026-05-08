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
import { formatDate, getInitials, getStatusColor, toStringArray, getEngagementTypeLabel } from '../lib/utils';
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
      setSelectedAgent({ ...agent, status: 'FINISHED' });
      toast.success(t('toast.completeSuccess'));
      openReviewAfterDelay();
    } catch {
      toast.error(t('toast.completeError'));
    }
  }, [agent, finishMutation, setSelectedAgent, t, openReviewAfterDelay]);

  const handleCancel = useCallback(
    async (reason: string) => {
      try {
        await cancelMutation.mutateAsync({ engagementId: agent.engagement_id, reason });
        setCancelDialogOpen(false);
        setSelectedAgent({ ...agent, status: 'CANCELLED' });
        toast.success(t('toast.cancelSuccess'));
        openReviewAfterDelay();
      } catch {
        toast.error(t('toast.cancelError'));
      }
    },
    [agent, cancelMutation, setSelectedAgent, t, openReviewAfterDelay]
  );

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
            className='w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-primary/20'
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

    if ((status === 'FINISHED' || status === 'CANCELLED') && !hasReview) {
      return (
        <Button
          className='w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 gap-2 shadow-sm shadow-primary/20'
          onClick={() => setReviewModalOpen(true)}
        >
          <MessageSquarePlus className='h-4 w-4' />
          {t('detailPanel.addReview')}
        </Button>
      );
    }

    if ((status === 'FINISHED' || status === 'CANCELLED') && hasReview) {
      return (
        <div className='flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 py-2 text-sm text-muted-foreground'>
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
        className='flex h-full min-h-0 w-full max-w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg animate-in fade-in slide-in-from-right-4 duration-300 lg:w-[380px]'
      >
        {/* Header */}
        <div className='flex flex-none items-center justify-between border-b border-border/80 bg-card px-5 py-4'>
          <h2 className='text-sm font-bold tracking-tight text-foreground'>
            {t('detailPanel.title')}
          </h2>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            onClick={onClose}
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>

        {/* Scrollable Content */}
        <CardContent className='p-0 flex-1 overflow-y-auto min-h-0'>
          {/* Profile Banner */}
          <div className='relative border-b border-border/80 bg-gradient-to-br from-primary/5 via-primary/5 to-card px-6 pb-5 pt-6'>
            <div className='flex flex-col items-center'>
              <div className='relative mb-3'>
                <Avatar className='h-20 w-20 ring-4 ring-white shadow-md'>
                  <AvatarImage
                    src={agent.agent_avatar_url ?? undefined}
                    alt={agent.agent_full_name}
                  />
                  <AvatarFallback className='bg-primary/10 text-primary text-xl font-bold'>
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
                        : status === 'FINISHED'
                          ? 'bg-blue-400'
                          : 'bg-muted-foreground/40'
                  )}
                />
              </div>
              <h3 className='text-center text-base font-bold leading-tight text-foreground'>
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
                          : 'fill-muted/35 text-muted/35'
                      )}
                    />
                  ))}
                  <span className='ml-1.5 text-xs font-medium text-muted-foreground'>
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
              <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
                {t('detailPanel.contactInfo')}
              </h4>
              {agent.agent_email && (
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0'>
                    <Mail className='h-3.5 w-3.5 text-primary/80' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-[10px] text-muted-foreground font-medium'>
                      {t('detailPanel.email')}
                    </div>
                    <div className='text-sm font-semibold text-foreground truncate'>
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
                    <div className='text-[10px] text-muted-foreground font-medium'>
                      {t('detailPanel.phone')}
                    </div>
                    <div className='text-sm font-semibold text-foreground'>{agent.agent_phone}</div>
                  </div>
                </div>
              )}
              {toStringArray(agent.agent_service_areas).length > 0 && (
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0'>
                    <MapPin className='h-3.5 w-3.5 text-orange-500' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-[10px] text-muted-foreground font-medium'>
                      {t('detailPanel.serviceAreas')}
                    </div>
                    <div className='text-sm font-semibold text-foreground truncate'>
                      {toStringArray(agent.agent_service_areas).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator className='bg-border' />

            {/* Professional Info */}
            <section>
              <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3'>
                {t('detailPanel.professionalInfo')}
              </h4>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3'>
                  <div className='mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                    <Briefcase className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.experience')}
                    </span>
                  </div>
                  <div className='text-sm font-bold text-foreground'>
                    {agent.agent_years_of_experience !== null
                      ? t('detailPanel.yearsUnit', {
                          count: agent.agent_years_of_experience,
                        })
                      : t('common.na')}
                  </div>
                </div>
                <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3'>
                  <div className='mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                    <Home className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.propertiesSold')}
                    </span>
                  </div>
                  <div className='text-sm font-bold text-foreground'>
                    {agent.agent_properties_sold ?? t('common.na')}
                  </div>
                </div>
                <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3'>
                  <div className='mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                    <Award className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.engagementType')}
                    </span>
                  </div>
                  <div className='text-sm font-bold text-foreground'>{getEngagementTypeLabel(agent.engagement_type, t)}</div>
                </div>
                <div className='rounded-xl border border-border/70 bg-primary/[0.04] p-3'>
                  <div className='mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                    <Calendar className='h-3 w-3' />
                    <span className='font-medium uppercase tracking-wide'>
                      {t('detailPanel.hiredDate')}
                    </span>
                  </div>
                  <div className='text-sm font-bold text-foreground'>
                    {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            {toStringArray(agent.agent_specialties).length > 0 && (
              <section>
                <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5'>
                  {t('detailPanel.specialties')}
                </h4>
                <div className='flex flex-wrap gap-1.5'>
                  {toStringArray(agent.agent_specialties).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant='outline'
                      className='text-xs font-semibold bg-primary/5 text-primary border-primary/10 rounded-lg px-2.5 py-0.5'
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
                <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5'>
                  {t('detailPanel.about')}
                </h4>
                <p className='rounded-xl border border-border/70 bg-primary/[0.04] p-4 text-sm leading-relaxed text-muted-foreground'>
                  {agent.agent_bio}
                </p>
              </section>
            )}

            {/* Assigned Property */}
            <section>
              <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5'>
                {t('detailPanel.assignedProperty')}
              </h4>
              <div className='bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-2'>
                {agent.property_address && (
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-3.5 w-3.5 text-primary/70 mt-0.5 flex-shrink-0' />
                    <span className='text-sm text-foreground font-medium leading-snug'>
                      {agent.property_address}
                    </span>
                  </div>
                )}
                <div className='flex items-center gap-2 flex-wrap'>
                  {agent.property_type_name && (
                    <span className='text-xs bg-white text-primary border border-primary/10 px-2.5 py-1 rounded-lg font-semibold'>
                      {agent.property_type_name}
                    </span>
                  )}
                  {agent.property_location_name && (
                    <span className='text-xs text-muted-foreground font-medium'>
                      {agent.property_location_name}
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </CardContent>

        {/* Footer */}
        <div className='flex-none space-y-2.5 border-t border-border/80 bg-card/90 p-4 backdrop-blur-sm'>
          {renderActionButtons()}
          <Link
            href={`/${locale}${ROUTES.dashboard.agentDetail(agent.engagement_id)}`}
            className='flex items-center justify-center gap-1.5 w-full text-xs text-primary hover:text-primary/80 font-semibold py-2 rounded-xl hover:bg-primary/5 transition-colors'
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
