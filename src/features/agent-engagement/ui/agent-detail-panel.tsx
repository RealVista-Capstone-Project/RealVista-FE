'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AgentEngagement, CreateReviewPayload } from '@/entities/agent-engagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
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
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatDate, getInitials, getStatusColor, toStringArray } from '../lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useManageAgentContext } from '../model/manage-agent-context';
import { CompleteConfirmDialog } from './complete-confirm-dialog';
import { CancelContractDialog } from './cancel-contract-dialog';
import { ReviewModal } from './review-modal';

interface AgentDetailPanelProps {
  agent: AgentEngagement;
  onClose: () => void;
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const t = useTranslations('AgentEngagement');
  const locale = useLocale();
  const { updateAgentStatus, markAgentReviewed } = useManageAgentContext();

  const statusKey = `status.${agent.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : agent.status;

  // Dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Loading state per action
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openReviewAfterDelay = useCallback(() => {
    setTimeout(() => setReviewModalOpen(true), 600);
  }, []);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    // TODO: replace with real API call: await agentEngagementApi.completeEngagement(agent.engagement_id)
    await new Promise((r) => setTimeout(r, 800));
    setIsCompleting(false);
    setCompleteDialogOpen(false);
    updateAgentStatus(agent.engagement_id, 'COMPLETED');
    toast.success(t('toast.completeSuccess'));
    openReviewAfterDelay();
  }, [agent.engagement_id, updateAgentStatus, t, openReviewAfterDelay]);

  const handleCancel = useCallback(async (reason: string) => {
    setIsCancelling(true);
    // TODO: replace with real API call: await agentEngagementApi.cancelEngagement(agent.engagement_id, reason)
    console.log('[mock] cancel reason:', reason);
    await new Promise((r) => setTimeout(r, 800));
    setIsCancelling(false);
    setCancelDialogOpen(false);
    updateAgentStatus(agent.engagement_id, 'CANCELLED');
    toast.success(t('toast.cancelSuccess'));
    openReviewAfterDelay();
  }, [agent.engagement_id, updateAgentStatus, t, openReviewAfterDelay]);

  const handleReviewSubmit = useCallback(
    async (payload: Omit<CreateReviewPayload, 'engagement_id'>) => {
      setIsReviewing(true);
      // TODO: replace with real API call: await agentEngagementApi.submitReview({ ...payload, engagement_id: agent.engagement_id })
      console.log('[mock] review payload:', { ...payload, engagement_id: agent.engagement_id });
      await new Promise((r) => setTimeout(r, 800));
      setIsReviewing(false);
      setReviewModalOpen(false);
      markAgentReviewed(agent.engagement_id);
      toast.success(t('toast.reviewSuccess'));
    },
    [agent.engagement_id, markAgentReviewed, t]
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
            className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-lg h-10 gap-2'
            onClick={() => setCompleteDialogOpen(true)}
          >
            <CheckCircle2 className='h-4 w-4' />
            {t('actions.completeContract')}
          </Button>
          <Button
            variant='outline'
            className='w-full border-destructive/40 text-destructive hover:bg-red-50 hover:border-destructive font-semibold rounded-lg h-10 gap-2'
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
          className='w-full border-destructive/40 text-destructive hover:bg-red-50 hover:border-destructive font-semibold rounded-lg h-10 gap-2'
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
          className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-lg h-10 gap-2'
          onClick={() => setReviewModalOpen(true)}
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

  return (
    <>
      <Card
        id='agent-detail-panel'
        key={agent.engagement_id}
        className='w-full lg:w-[400px] flex-shrink-0 border-none shadow-lg bg-white flex flex-col max-h-[calc(100vh-100px)] animate-in slide-in-from-right-4 fade-in duration-300 rounded-xl sticky top-4 overflow-hidden'
      >
        {/* Header */}
        <CardHeader className='p-5 border-b border-gray-100 flex flex-row items-center justify-between bg-white flex-none'>
          <CardTitle className='font-bold text-base text-gray-900'>
            {t('detailPanel.title')}
          </CardTitle>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-gray-400 hover:text-gray-900'
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className='p-0 flex-1 overflow-y-auto min-h-0'>
          {/* Profile Section */}
          <div className='p-6 flex flex-col items-center border-b border-gray-50 bg-gray-50/30'>
            <Avatar className='h-24 w-24 mb-4 border-4 border-white shadow-sm ring-1 ring-gray-100'>
              <AvatarImage
                src={agent.agent_avatar_url ?? undefined}
                alt={agent.agent_full_name}
              />
              <AvatarFallback className='bg-indigo-100 text-indigo-700 text-lg font-bold'>
                {getInitials(agent.agent_full_name)}
              </AvatarFallback>
            </Avatar>
            <h3 className='text-lg font-bold text-gray-900'>{agent.agent_full_name}</h3>

            {/* Rating */}
            {agent.agent_rating !== null && (
              <div className='flex items-center gap-1 mt-1'>
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
                  ({agent.agent_rating?.toFixed(1)})
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

          {/* Contact Info */}
          <div className='p-6 space-y-6'>
            <div className='space-y-4'>
              <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wider'>
                {t('detailPanel.contactInfo')}
              </h4>
              {agent.agent_email && (
                <div className='flex items-center gap-3 text-sm'>
                  <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50'>
                    <Mail className='h-4 w-4 text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-xs text-gray-400'>{t('detailPanel.email')}</div>
                    <div className='font-medium text-gray-900 truncate'>
                      {agent.agent_email}
                    </div>
                  </div>
                </div>
              )}
              {agent.agent_phone && (
                <div className='flex items-center gap-3 text-sm'>
                  <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-green-50'>
                    <Phone className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-xs text-gray-400'>{t('detailPanel.phone')}</div>
                    <div className='font-medium text-gray-900'>{agent.agent_phone}</div>
                  </div>
                </div>
              )}
              {toStringArray(agent.agent_service_areas).length > 0 && (
                <div className='flex items-center gap-3 text-sm'>
                  <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-orange-50'>
                    <MapPin className='h-4 w-4 text-orange-600' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-xs text-gray-400'>{t('detailPanel.serviceAreas')}</div>
                    <div className='font-medium text-gray-900 truncate'>
                      {toStringArray(agent.agent_service_areas).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Professional Info */}
            <div className='bg-gray-50 rounded-xl p-5 border border-gray-100'>
              <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wider mb-4'>
                {t('detailPanel.professionalInfo')}
              </h4>
              <div className='grid grid-cols-2 gap-y-5 gap-x-4'>
                <div>
                  <div className='flex items-center gap-1.5 text-xs text-gray-400 mb-1'>
                    <Briefcase className='h-3 w-3' />
                    {t('detailPanel.experience')}
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.agent_years_of_experience !== null
                      ? t('detailPanel.yearsUnit', { count: agent.agent_years_of_experience })
                      : t('common.na')}
                  </div>
                </div>
                <div>
                  <div className='flex items-center gap-1.5 text-xs text-gray-400 mb-1'>
                    <Home className='h-3 w-3' />
                    {t('detailPanel.propertiesSold')}
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.agent_properties_sold ?? t('common.na')}
                  </div>
                </div>
                <div>
                  <div className='flex items-center gap-1.5 text-xs text-gray-400 mb-1'>
                    <Award className='h-3 w-3' />
                    {t('detailPanel.engagementType')}
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {agent.engagement_type}
                  </div>
                </div>
                <div>
                  <div className='flex items-center gap-1.5 text-xs text-gray-400 mb-1'>
                    {t('detailPanel.hiredDate')}
                  </div>
                  <div className='font-bold text-gray-900 text-sm'>
                    {formatDate(agent.hired_at, 'dd/MM/yyyy', locale)}
                  </div>
                </div>
              </div>
            </div>

            {/* Specialties */}
            {toStringArray(agent.agent_specialties).length > 0 && (
              <div>
                <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wider mb-3'>
                  {t('detailPanel.specialties')}
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {toStringArray(agent.agent_specialties).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant='outline'
                      className='text-xs font-medium bg-indigo-50/50 text-indigo-700 border-indigo-100'
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {agent.agent_bio && (
              <div>
                <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wider mb-3'>
                  {t('detailPanel.about')}
                </h4>
                <p className='text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100'>
                  {agent.agent_bio}
                </p>
              </div>
            )}

            {/* Property Info */}
            <div>
              <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wider mb-3'>
                {t('detailPanel.assignedProperty')}
              </h4>
              <div className='bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-2'>
                {agent.property_address && (
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
                    <span className='text-sm text-gray-700'>
                      {agent.property_address}
                    </span>
                  </div>
                )}
                <div className='flex items-center gap-4 text-xs text-gray-500'>
                  {agent.property_type_name && (
                    <span className='bg-gray-100 px-2 py-1 rounded'>
                      {agent.property_type_name}
                    </span>
                  )}
                  {agent.property_location_name && (
                    <span>{agent.property_location_name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer CTA — dynamic based on status */}
        {renderActionButtons() && (
          <div className='p-4 border-t border-gray-100 bg-white flex-none'>
            {renderActionButtons()}
          </div>
        )}
      </Card>

      {/* Dialogs — rendered outside Card to avoid stacking context issues */}
      <CompleteConfirmDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        agent={agent}
        onConfirm={handleComplete}
        isLoading={isCompleting}
      />

      <CancelContractDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        agent={agent}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        agent={agent}
        onSubmit={handleReviewSubmit}
        onSkip={handleReviewSkip}
        isLoading={isReviewing}
      />
    </>
  );
}
