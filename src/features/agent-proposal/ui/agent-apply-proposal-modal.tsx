'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  FileText,
  Check,
  ChevronRight,
  Clock,
  Percent,
  Award,
  Loader2,
  SendHorizonal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button';
import { agentEngagementApi } from '@/entities/agent-engagement/api/agent-engagement.api';
import { AgentProposalStatus } from '@/entities/agent-proposal/model/types';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';
import { useMyProposalsQuery } from '../hooks/use-agent-proposal';

interface AgentApplyProposalModalProps {
  propertyId: string;
  propertyAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const RETURN_TO_APPLY_INTENT_STORAGE_KEY = 'agent-proposal:return-to-apply-intent';

export function AgentApplyProposalModal({
  propertyId,
  propertyAddress,
  isOpen,
  onClose,
  onSubmitSuccess,
}: AgentApplyProposalModalProps) {
  const t = useTranslations('ApplyProposal');
  const tGlobal = useTranslations();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load proposals - using existing query hook for consistency
  const { data, isLoading } = useMyProposalsQuery(0, 50);
  const proposals = React.useMemo(() => data?.content ?? [], [data]);

  // Reset state when opening/closing
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedId(null);
      setMessage('');
    }
  }, [isOpen]);

  const activeProposals = React.useMemo(
    () => proposals.filter((p) => p.status === AgentProposalStatus.ACTIVE),
    [proposals]
  );

  const filteredProposals = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeProposals;
    return activeProposals.filter(
      (p) => p.title.toLowerCase().includes(q) || p.pitch_content.toLowerCase().includes(q)
    );
  }, [activeProposals, searchQuery]);

  const selectedProposal = proposals.find((p) => p.agent_proposal_id === selectedId);

  const handleSubmit = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      await agentEngagementApi.submitAgentProposal({
        property_id: propertyId,
        agent_proposal_id: selectedId,
        message: message.trim() || undefined,
      });

      toast.success(t('toastSuccess'), {
        className: 'bg-white border-emerald-200 text-emerald-800 shadow-lg',
      });
      onSubmitSuccess?.();
      onClose();
    } catch (err: unknown) {
      handleErrorApi({ error: err, t: tGlobal });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToManage = () => {
    onClose();
    const locale =
      typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'vi' : 'vi';
    const returnPath = '/dashboard/property-feed';
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(
          RETURN_TO_APPLY_INTENT_STORAGE_KEY,
          JSON.stringify({
            propertyId,
            propertyAddress,
            source: 'manage-proposals',
            ts: Date.now(),
          })
        );
        window.localStorage.setItem(
          RETURN_TO_APPLY_INTENT_STORAGE_KEY,
          JSON.stringify({
            propertyId,
            propertyAddress,
            source: 'manage-proposals',
            ts: Date.now(),
          })
        );
      } catch {
        // Ignore storage failures and keep current URL-based fallback flow.
      }
    }
    const query = new URLSearchParams({
      returnPath,
      returnPropertyId: propertyId,
      returnPropertyAddress: propertyAddress,
    });
    window.location.href = `/${locale}/dashboard/manage-proposals?${query.toString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[640px] p-0 gap-0 overflow-hidden bg-background border-0 shadow-2xl rounded-2xl'>
        {/* Header */}
        <DialogHeader className='px-6 pt-6 pb-4 bg-muted/50 border-b border-border'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-primary/20 shadow-lg'>
              <FileText size={20} />
            </div>
            <div className='flex-1'>
              <DialogTitle className='text-xl font-bold text-foreground'>
                {t('modalTitle')}
              </DialogTitle>
              <DialogDescription className='text-sm text-muted-foreground mt-0.5 leading-relaxed'>
                {t('modalSubtitle')}
              </DialogDescription>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className='flex items-center gap-2 mt-5'>
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full bg-primary transition-all duration-300',
                step === 1 ? 'w-full' : 'opacity-100'
              )}
            />
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                step === 2 ? 'bg-primary' : 'bg-muted'
              )}
            />
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className='max-h-[60vh] overflow-y-auto flex flex-col'>
          {step === 1 ? (
            <div className='flex flex-col flex-1 min-h-0'>
              {/* Search Bar */}
              <div className='px-6 py-4 border-b border-muted bg-background flex items-center gap-3'>
                <div className='relative group flex-1'>
                  <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors'
                    size={16}
                  />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-background transition-all'
                  />
                </div>
                <Button
                  variant='outline'
                  className='h-10 shrink-0 rounded-xl border-primary/20 px-4 text-xs font-bold text-primary hover:bg-primary/5'
                  onClick={handleGoToManage}
                >
                  {t('btnManage')}
                </Button>
              </div>

              {/* List */}
              <div className='flex-1 overflow-y-auto px-6 py-3 bg-background space-y-3 min-h-0'>
                {isLoading ? (
                  <div className='flex flex-col items-center justify-center py-20 gap-3'>
                    <Loader2 className='size-10 animate-spin text-primary' />
                    <p className='text-sm font-medium text-muted-foreground/50'>
                      Đang tải danh sách...
                    </p>
                  </div>
                ) : filteredProposals.length > 0 ? (
                  filteredProposals.map((p) => (
                    <div
                      key={p.agent_proposal_id}
                      onClick={() => setSelectedId(p.agent_proposal_id)}
                      className={cn(
                        'group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer relative',
                        selectedId === p.agent_proposal_id
                          ? 'border-primary/20 bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-1',
                          selectedId === p.agent_proposal_id
                            ? 'bg-primary border-primary scale-110 shadow-sm shadow-primary/20'
                            : 'bg-background border-input group-hover:border-foreground/40'
                        )}
                      >
                        {selectedId === p.agent_proposal_id && (
                          <Check className='h-3 w-3 text-white' strokeWidth={3} />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h4
                          className={cn(
                            'font-bold transition-colors truncate',
                            selectedId === p.agent_proposal_id
                              ? 'text-primary'
                              : 'text-foreground group-hover:text-primary'
                          )}
                        >
                          {p.title}
                        </h4>
                        <div className='flex items-center gap-3 mt-1.5'>
                          <span className='flex items-center gap-1 text-xs font-semibold text-muted-foreground'>
                            <Award size={13} className='text-primary/70' />
                            {p.experience_years} {t('years')}
                          </span>
                          <span className='flex items-center gap-1 text-xs font-semibold text-muted-foreground'>
                            <Percent size={13} className='text-primary/70' />
                            {p.commission_rate}%
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground/50 mt-2 line-clamp-1 italic'>
                          &quot;{p.pitch_content}&quot;
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 text-center px-10'>
                    <div className='size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30 mb-4'>
                      <FileText size={28} />
                    </div>
                    <h5 className='text-base font-bold text-foreground'>{t('noProposals')}</h5>
                    <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
                      {t('noProposalsDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='flex flex-1 min-h-0 flex-col p-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
              <div className='flex shrink-0 flex-col items-center text-center space-y-6'>
                <div className='size-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-1 border border-primary/10 shadow-sm'>
                  <SendHorizonal
                    size={30}
                    strokeWidth={2.5}
                    className='-rotate-12 translate-x-0.5'
                  />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-foreground'>{t('confirmTitle')}</h3>
                  <p className='text-sm text-muted-foreground mt-2 max-w-[360px] mx-auto leading-relaxed'>
                    {t('confirmDesc')}
                  </p>
                </div>
              </div>

              <div className='mt-6 flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'>
                <div className='flex w-full max-w-[420px] flex-col items-center space-y-6 pb-1'>
                  {selectedProposal && (
                    <div className='w-full bg-primary/5 rounded-2xl p-5 border border-primary/10 flex flex-col items-start text-left shadow-sm'>
                      <span className='text-[10px] font-bold text-primary uppercase tracking-widest mb-2'>
                        {t('selectedLabel')}
                      </span>
                      <p className='text-base font-bold text-foreground line-clamp-2 leading-snug'>
                        {selectedProposal.title}
                      </p>
                      <div className='flex gap-6 mt-4 w-full'>
                        <div className='flex-1'>
                          <p className='text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-0.5'>
                            {t('experienceLabel')}
                          </p>
                          <p className='text-sm font-bold text-foreground/70'>
                            {selectedProposal.experience_years} {t('years')}
                          </p>
                        </div>
                        <div className='flex-1'>
                          <p className='text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-0.5'>
                            {t('commissionLabel')}
                          </p>
                          <p className='text-sm font-bold text-foreground/70'>
                            {selectedProposal.commission_rate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Personal Message Input */}
                  <div className='w-full flex flex-col items-start text-left'>
                    <label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                      <SendHorizonal size={12} className='text-primary' />
                      {t('personalMessageLabel')}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('messagePlaceholder')}
                      className='w-full min-h-[120px] p-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all resize-none placeholder:text-muted-foreground/50'
                    />
                    <p className='text-[10px] text-muted-foreground/50 mt-2 italic'>
                      * {t('messageHint')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-muted/80 border-t border-border flex items-center justify-between'>
          <Button
            variant='ghost'
            className='rounded-xl font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10'
            onClick={step === 1 ? onClose : () => setStep(1)}
          >
            {step === 1 ? t('btnCancel') : t('btnBack')}
          </Button>

          <Button
            className='rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 shadow-2xl transition-all disabled:opacity-50 h-11'
            disabled={!selectedId || (step === 2 && isSubmitting)}
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
          >
            {step === 2 && isSubmitting ? (
              <span className='flex items-center gap-2'>
                <Clock className='animate-spin' size={16} />
                {t('btnSubmitting')}
              </span>
            ) : (
              <span className='flex items-center gap-1.5'>
                {step === 1 ? t('btnNext') : t('btnSubmit')}
                <ChevronRight size={16} strokeWidth={3} />
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
