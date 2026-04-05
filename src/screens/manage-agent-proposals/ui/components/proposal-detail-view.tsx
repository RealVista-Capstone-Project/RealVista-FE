'use client';

import * as React from 'react';
import {
  ChevronLeft, Edit3, Trash2, Award, TrendingUp, CheckCircle2, Calendar,
  Clock, ShieldCheck, RefreshCw, Sparkles, X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { AgentProposal, AgentProposalStatus } from '@/entities/agent-proposal/model/types';

interface ProposalDetailViewProps {
  proposal: AgentProposal;
  locale: string;
  isMobile: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StatusBadge({ status, t }: { status: AgentProposalStatus; t: ReturnType<typeof useTranslations<'ManageProposals'>> }) {
  const isActive = status === AgentProposalStatus.ACTIVE;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      isActive
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    )}>
      <span className={cn('size-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
      {isActive ? t('statusActive') : t('statusDraft')}
    </span>
  );
}

function MetricCard({
  label, value, icon,
}: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4'>
      <div className='flex items-center gap-2 text-xs text-slate-500'>
        {icon}
        <span className='font-medium'>{label}</span>
      </div>
      <p className='text-base font-bold text-slate-900 truncate'>{value}</p>
    </div>
  );
}

export function ProposalDetailView({
  proposal, locale, isMobile, onBack, onEdit, onDelete,
}: ProposalDetailViewProps) {
  const t = useTranslations('ManageProposals');
  const isActive = proposal.status === AgentProposalStatus.ACTIVE;

  const createdDate = new Date(proposal.created_at ?? proposal.updated_at);
  const updatedDate = new Date(proposal.updated_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* ── Header ── */}
      <div className='shrink-0 border-b border-slate-100 px-6 py-4 bg-white shadow-sm z-20'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-start gap-3 min-w-0 flex-1'>
            {isMobile && (
              <button
                onClick={onBack}
                className='mt-1 shrink-0 flex items-center justify-center size-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors'
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                <StatusBadge status={proposal.status} t={t} />
                <span className='text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-wider'>
                  ID: {proposal.agent_proposal_id.slice(0, 8)}
                </span>
              </div>
              <h2 className='text-xl font-bold text-slate-900 leading-tight pr-8 relative'>
                {proposal.title}
              </h2>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            <div className='hidden sm:flex items-center gap-2 mr-2 border-r border-slate-100 pr-4'>
               <button
                onClick={onDelete}
                className='flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95'
                title={t('btnDelete')}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onEdit}
                className='flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95'
                title={t('btnEdit')}
              >
                <Edit3 size={16} />
              </button>
            </div>

            {/* Desktop Close Button to deselect */}
            {!isMobile && (
              <button
                onClick={onBack}
                className='flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90 border border-transparent hover:border-slate-200'
                title={t('btnClose')}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className='flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-slate-50/30 scroll-smooth'>

        {/* Metrics row */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <MetricCard
            label={t('metricExperience')}
            value={`${proposal.experience_years} năm`}
            icon={<Award size={14} className='text-indigo-500' />}
          />
          <MetricCard
            label={t('metricCommission')}
            value={`${proposal.commission_rate}%`}
            icon={<TrendingUp size={14} className='text-violet-500' />}
          />
          <MetricCard
            label={t('metricStatus')}
            value={isActive ? t('statusActive') : t('statusDraft')}
            icon={<CheckCircle2 size={14} className='text-emerald-500' />}
          />
          <MetricCard
            label={t('metricUpdated')}
            value={updatedDate.toLocaleDateString(locale)}
            icon={<Calendar size={14} className='text-orange-500' />}
          />
        </div>

        {/* Pitch content */}
        <div className='group'>
          <h3 className='mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2'>
            <div className='size-1 bg-indigo-400 rounded-full' />
            {t('sectionPitch')}
          </h3>
          <div className='rounded-2xl border border-slate-100 bg-white p-6 shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-slate-200/5'>
            <p className='text-base leading-8 text-slate-700 whitespace-pre-wrap font-medium'>
              {proposal.pitch_content}
            </p>
          </div>
        </div>

        {/* Key Highlights */}
        <div>
          <h3 className='mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2'>
             <div className='size-1 bg-violet-400 rounded-full' />
            {t('sectionHighlights')}
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <HighlightCard
              icon={<ShieldCheck size={20} className='text-indigo-600' />}
              title={t('highlight1Title')}
              desc={t('highlight1Desc')}
              color='indigo'
            />
            <HighlightCard
              icon={<Sparkles size={20} className='text-violet-600' />}
              title={t('highlight2Title')}
              desc={t('highlight2Desc')}
              color='violet'
            />
            <HighlightCard
              icon={<RefreshCw size={20} className='text-emerald-600' />}
              title={t('highlight3Title')}
              desc={t('highlight3Desc')}
              color='emerald'
            />
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className='mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2'>
             <div className='size-1 bg-slate-300 rounded-full' />
            {t('sectionActivity')}
          </h3>
          <div className='rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm'>
            <TimelineItem
              icon={<Clock size={15} className='text-indigo-600' />}
              label={t('timelineCreate')}
              date={createdDate.toLocaleString(locale)}
              note={daysSinceCreated === 0 ? 'Hôm nay' : `${daysSinceCreated} ngày trước`}
            />
            {proposal.updated_at !== proposal.created_at && (
              <TimelineItem
                icon={<Edit3 size={15} className='text-violet-600' />}
                label={t('timelineUpdate')}
                date={updatedDate.toLocaleString(locale)}
                isLast
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className='shrink-0 border-t border-slate-100 bg-white px-8 py-3.5 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <p className='text-[11px] font-medium text-slate-400 flex items-center gap-1.5'>
            <Calendar size={12} />
            {t('footerCreated', { date: createdDate.toLocaleDateString(locale) })}
          </p>
          <div className='size-1 bg-slate-200 rounded-full' />
          <p className='text-[11px] font-medium text-slate-400 flex items-center gap-1.5'>
            <Clock size={12} />
            {t('footerUpdated', { date: updatedDate.toLocaleDateString(locale) })}
          </p>
        </div>

        {isMobile && (
          <Button variant='outline' size='sm' className='rounded-lg text-xs font-bold' onClick={onBack}>
            {t('btnClose')}
          </Button>
        )}
      </div>
    </div>
  );
}

function HighlightCard({
  icon, title, desc, color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: 'indigo' | 'violet' | 'emerald';
}) {
  const bg = { indigo: 'bg-indigo-50/60', violet: 'bg-violet-50/60', emerald: 'bg-emerald-50/60' };
  return (
    <div className={cn('rounded-xl border border-slate-100 p-4', bg[color])}>
      <div className='mb-2'>{icon}</div>
      <p className='text-sm font-semibold text-slate-800 mb-1'>{title}</p>
      <p className='text-xs text-slate-500 leading-relaxed'>{desc}</p>
    </div>
  );
}

function TimelineItem({
  icon, label, date, note, isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  note?: string;
  isLast?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3',
      !isLast && 'border-b border-slate-100',
    )}>
      <div className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100'>
        {icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-slate-700'>{label}</p>
        <p className='text-xs text-slate-400 mt-0.5'>{date}</p>
      </div>
      {note && (
        <span className='text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0'>
          {note}
        </span>
      )}
    </div>
  );
}
