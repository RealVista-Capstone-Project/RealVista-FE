'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Search, FileText, Check, ChevronRight, Clock, Percent, Award, Loader2, SendHorizonal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button';
import { agentEngagementApi } from '@/entities/agent-engagement/api/agent-engagement.api';
import { AgentProposalStatus } from '@/entities/agent-proposal/model/types';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { useMyProposalsQuery } from '../hooks/use-agent-proposal';

interface AgentApplyProposalModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export function AgentApplyProposalModal({
  propertyId,
  isOpen,
  onClose,
  onSubmitSuccess,
}: AgentApplyProposalModalProps) {
  const t = useTranslations('ApplyProposal');

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
    return activeProposals.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.pitch_content.toLowerCase().includes(q)
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
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('toastError');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToManage = () => {
    onClose();
    const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'vi' : 'vi';
    window.location.href = `/${locale}/dashboard/manage-proposals`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[640px] p-0 gap-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl'>
        {/* Header */}
        <DialogHeader className='px-6 pt-6 pb-4 bg-slate-50/50 border-b border-slate-100'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-indigo-200 shadow-lg'>
              <FileText size={20} />
            </div>
            <div className='flex-1'>
              <DialogTitle className='text-xl font-bold text-slate-900'>
                {t('modalTitle')}
              </DialogTitle>
              <DialogDescription className='text-sm text-slate-500 mt-0.5 leading-relaxed'>
                {t('modalSubtitle')}
              </DialogDescription>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className='flex items-center gap-2 mt-5'>
            <div className={cn('h-1.5 flex-1 rounded-full bg-indigo-600 transition-all duration-300', step === 1 ? 'w-full' : 'opacity-100')} />
            <div className={cn('h-1.5 flex-1 rounded-full transition-all duration-300', step === 2 ? 'bg-indigo-600' : 'bg-slate-200')} />
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className='max-h-[60vh] overflow-hidden flex flex-col'>
          {step === 1 ? (
            <div className='flex flex-col flex-1 min-h-[400px]'>
              {/* Search Bar */}
              <div className='px-6 py-4 border-b border-slate-50 bg-white'>
                <div className='relative group'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors' size={16} />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all'
                  />
                </div>
              </div>

              {/* List */}
              <div className='flex-1 overflow-y-auto px-6 py-3 bg-white space-y-3 min-h-0'>
                {isLoading ? (
                  <div className='flex flex-col items-center justify-center py-20 gap-3'>
                    <Loader2 className='size-10 animate-spin text-indigo-600' />
                    <p className='text-sm font-medium text-slate-400'>Đang tải danh sách...</p>
                  </div>
                ) : filteredProposals.length > 0 ? (
                  filteredProposals.map((p) => (
                    <div
                      key={p.agent_proposal_id}
                      onClick={() => setSelectedId(p.agent_proposal_id)}
                      className={cn(
                        'group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer relative',
                        selectedId === p.agent_proposal_id
                          ? 'border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-1',
                        selectedId === p.agent_proposal_id
                          ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm shadow-indigo-200'
                          : 'bg-white border-slate-300 group-hover:border-slate-400'
                      )}>
                        {selectedId === p.agent_proposal_id && <Check className='h-3 w-3 text-white' strokeWidth={3} />}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h4 className={cn(
                          'font-bold transition-colors truncate',
                          selectedId === p.agent_proposal_id ? 'text-indigo-700' : 'text-slate-900 group-hover:text-indigo-600'
                        )}>
                          {p.title}
                        </h4>
                        <div className='flex items-center gap-3 mt-1.5'>
                          <span className='flex items-center gap-1 text-xs font-semibold text-slate-500'>
                            <Award size={13} className='text-indigo-400' />
                            {p.experience_years} {t('years')}
                          </span>
                          <span className='flex items-center gap-1 text-xs font-semibold text-slate-500'>
                            <Percent size={13} className='text-indigo-400' />
                            {p.commission_rate}%
                          </span>
                        </div>
                        <p className='text-xs text-slate-400 mt-2 line-clamp-1 italic'>
                          &quot;{p.pitch_content}&quot;
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 text-center px-10'>
                    <div className='size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4'>
                      <FileText size={28} />
                    </div>
                    <h5 className='text-base font-bold text-slate-900'>{t('noProposals')}</h5>
                    <p className='text-sm text-slate-500 mt-2 mb-6 leading-relaxed'>
                      {t('noProposalsDesc')}
                    </p>
                    <Button variant='outline' className='rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50' onClick={handleGoToManage}>
                      {t('btnManage')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='p-8 space-y-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300'>
              <div className='size-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1 border border-indigo-100 shadow-sm'>
                <SendHorizonal size={30} strokeWidth={2.5} className='-rotate-12 translate-x-0.5' />
              </div>
              <div>
                <h3 className='text-xl font-bold text-slate-900'>{t('confirmTitle')}</h3>
                <p className='text-sm text-slate-500 mt-2 max-w-[360px] mx-auto leading-relaxed'>
                  {t('confirmDesc')}
                </p>
              </div>

              {selectedProposal && (
                <div className='w-full max-w-[420px] bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100 flex flex-col items-start text-left shadow-sm'>
                  <span className='text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2'>{t('selectedLabel')}</span>
                  <p className='text-base font-bold text-slate-900 line-clamp-2 leading-snug'>{selectedProposal.title}</p>
                  <div className='flex gap-6 mt-4 w-full'>
                    <div className='flex-1'>
                      <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5'>{t('experienceLabel')}</p>
                      <p className='text-sm font-bold text-slate-700'>{selectedProposal.experience_years} {t('years')}</p>
                    </div>
                    <div className='flex-1'>
                      <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5'>{t('commissionLabel')}</p>
                      <p className='text-sm font-bold text-slate-700'>{selectedProposal.commission_rate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Message Input */}
              <div className='w-full max-w-[420px] flex flex-col items-start text-left'>
                <label className='text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                  <SendHorizonal size={12} className='text-indigo-500' />
                  {t('personalMessageLabel')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  className='w-full min-h-[120px] p-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-400'
                />
                <p className='text-[10px] text-slate-400 mt-2 italic'>
                  * {t('messageHint')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between'>
          <Button
            variant='ghost'
            className='rounded-xl font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 h-10'
            onClick={step === 1 ? onClose : () => setStep(1)}
          >
            {step === 1 ? t('btnCancel') : t('btnBack')}
          </Button>

          <Button
            className='rounded-xl px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-2xl transition-all disabled:opacity-50 h-11'
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
