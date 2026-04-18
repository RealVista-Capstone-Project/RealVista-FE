'use client';

import * as React from 'react';
import { Award, Percent, Edit3, Trash2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import {
  AgentProposal,
  AgentProposalStatus,
  getAgentProposalSpecialtyCode,
} from '@/entities/agent-proposal/model/types';

interface ProposalCardProps {
  proposal: AgentProposal;
  isSelected: boolean;
  inSplitView: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProposalCard({
  proposal, isSelected, inSplitView, onClick, onEdit, onDelete,
}: ProposalCardProps) {
  const t = useTranslations('ManageProposals');
  const isActive = proposal.status === AgentProposalStatus.ACTIVE;
  const specialtyCode = getAgentProposalSpecialtyCode(proposal);
  const updatedLabel = React.useMemo(() => {
    const d = new Date(proposal.updated_at);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }, [proposal.updated_at]);
  const specialtyLabel = React.useMemo(() => {
    if (!specialtyCode) return '';
    for (const cat of PROPERTY_TYPES) {
      const ty = cat.types.find((x) => x.code === specialtyCode);
      if (ty) return ty.label;
    }
    return specialtyCode;
  }, [specialtyCode]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 select-none',
        isSelected
          ? 'border-primary/20 bg-indigo-50 ring-1 ring-indigo-300/50'
          : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
      )}
    >
      {/* Updated at */}
      <div className={cn(
        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors tabular-nums',
        isSelected
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
      )}>
        <span className='text-[10px] font-bold leading-none'>{updatedLabel}</span>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className={cn(
            'text-sm font-semibold leading-snug line-clamp-2 transition-colors',
            isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-slate-900',
          )}>
            {proposal.title}
          </h3>
          {/* Action buttons - show on hover when not in split view */}
          {!inSplitView && (
            <div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className='rounded-md p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 transition-colors'
                title={t('btnEdit')}
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className='rounded-md p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                title={t('btnDelete')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className='mt-1 flex items-center gap-2 text-[11px] text-slate-500 min-w-0'>
          {specialtyLabel && (
            <span className='inline-flex max-w-[65%] items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600'>
              <Sparkles size={11} className='text-indigo-400 shrink-0' />
              <span className='truncate'>{specialtyLabel}</span>
            </span>
          )}
        </div>

        <div className='mt-1.5 flex items-center gap-3 text-xs text-slate-500'>
          <span className='flex items-center gap-1'>
            <Award size={11} className='text-indigo-400' />
            {t('metricExperience')}: {proposal.experience_years} năm
          </span>
          <span className='flex items-center gap-1'>
            <Percent size={11} className='text-indigo-400' />
            {t('metricCommission')}: {proposal.commission_rate}%
          </span>
          <span className={cn(
            'ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
          )}>
            <span className={cn('size-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-400')} />
            {isActive ? t('statusActive') : t('statusDraft')}
          </span>
        </div>
      </div>
    </div>
  );
}
