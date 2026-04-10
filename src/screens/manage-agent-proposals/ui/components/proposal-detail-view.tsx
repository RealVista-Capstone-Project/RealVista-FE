'use client';

import * as React from 'react';
import {
  ChevronLeft,
  Edit3,
  Trash2,
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatVND } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import {
  AgentProposal,
  AgentProposalStatus,
  getAgentProposalSpecialtyCode,
} from '@/entities/agent-proposal/model/types';

interface ProposalDetailViewProps {
  proposal: AgentProposal;
  locale: string;
  isMobile: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StatusBadge({
  status,
  t,
}: {
  status: AgentProposalStatus;
  t: ReturnType<typeof useTranslations<'ManageProposals'>>;
}) {
  const isActive = status === AgentProposalStatus.ACTIVE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      )}
    >
      <span className={cn('size-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
      {isActive ? t('statusActive') : t('statusDraft')}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 min-w-0'>
      <div className='flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500'>
        {icon}
        <span className='font-medium line-clamp-2 leading-tight'>{label}</span>
      </div>
      {value}
    </div>
  );
}

export function ProposalDetailView({
  proposal,
  locale,
  isMobile,
  onBack,
  onEdit,
  onDelete,
}: ProposalDetailViewProps) {
  const t = useTranslations('ManageProposals');
  const isActive = proposal.status === AgentProposalStatus.ACTIVE;
  const specialtyCode = getAgentProposalSpecialtyCode(proposal);
  const rentRange = proposal.price_range?.rent;
  const saleRange = proposal.price_range?.sale;
  const hasRentRange = !!rentRange && (rentRange.min > 0 || rentRange.max > 0);
  const hasSaleRange = !!saleRange && (saleRange.min > 0 || saleRange.max > 0);
  const hasAnyPriceRange = hasRentRange || hasSaleRange;
  const hasSpecialty = !!specialtyCode;
  const hasAnyMetaCard = hasSpecialty || !!proposal.price_range;

  const experienceValue =
    typeof proposal.experience_years === 'number'
      ? `${proposal.experience_years} ${t('years')}`
      : null;
  const commissionValue =
    typeof proposal.commission_rate === 'number' ? `${proposal.commission_rate}%` : null;
  const pitchEmpty = !proposal.pitch_content?.trim();

  const renderMetricValue = (raw: string | null) => {
    if (!raw) {
      return (
        <p className='text-sm sm:text-base font-semibold text-slate-400 italic'>
          {t('notSpecified')}
        </p>
      );
    }
    return <p className='text-sm sm:text-base font-bold text-slate-900 break-words hyphens-auto'>{raw}</p>;
  };

  const createdDate = new Date(proposal.created_at ?? proposal.updated_at);
  const updatedDate = new Date(proposal.updated_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* ── Header ── */}
      <div className='shrink-0 border-b border-slate-100 bg-white px-4 py-3 shadow-sm z-20 sm:px-6 sm:py-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
          <div className='flex min-w-0 flex-1 items-start gap-2 sm:gap-3'>
            {isMobile && (
              <button
                type='button'
                onClick={onBack}
                className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 sm:size-8'
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className='min-w-0 flex-1'>
              <div className='mb-1.5 flex flex-wrap items-center gap-2'>
                <StatusBadge status={proposal.status} t={t} />
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded max-w-full truncate'>
                  ID: {proposal.agent_proposal_id.slice(0, 8)}
                </span>
              </div>
              <h2 className='text-lg font-bold leading-snug text-slate-900 sm:text-xl sm:leading-tight'>
                {proposal.title}
              </h2>
            </div>
          </div>

          <div className='flex shrink-0 items-center justify-end gap-2 sm:justify-start'>
            <div className='flex items-center gap-1.5 sm:mr-2 sm:gap-2 sm:border-r sm:border-slate-100 sm:pr-4'>
              <button
                type='button'
                onClick={onDelete}
                className='flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95'
                title={t('btnDelete')}
              >
                <Trash2 size={16} />
              </button>
              <button
                type='button'
                onClick={onEdit}
                className='flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95'
                title={t('btnEdit')}
              >
                <Edit3 size={16} />
              </button>
            </div>

            {!isMobile && (
              <button
                type='button'
                onClick={onBack}
                className='flex size-9 items-center justify-center rounded-full border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-600 active:scale-90'
                title={t('btnClose')}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className='flex-1 overflow-y-auto scroll-smooth bg-slate-50/30 px-4 py-5 space-y-6 sm:px-6 sm:py-6 sm:space-y-8'>
        {/* Metrics row */}
        <div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4'>
          <MetricCard
            label={t('metricExperience')}
            value={renderMetricValue(experienceValue)}
            icon={<Award size={14} className='text-indigo-500' />}
          />
          <MetricCard
            label={t('metricCommission')}
            value={renderMetricValue(commissionValue)}
            icon={<TrendingUp size={14} className='text-violet-500' />}
          />
          <MetricCard
            label={t('metricStatus')}
            value={
              <p className='text-sm sm:text-base font-bold text-slate-900 break-words hyphens-auto'>
                {isActive ? t('statusActive') : t('statusDraft')}
              </p>
            }
            icon={<CheckCircle2 size={14} className='text-emerald-500' />}
          />
          <MetricCard
            label={t('metricUpdated')}
            value={
              <p className='text-sm sm:text-base font-bold text-slate-900 break-words hyphens-auto'>
                {updatedDate.toLocaleDateString(locale)}
              </p>
            }
            icon={<Calendar size={14} className='text-orange-500' />}
          />
        </div>

        {/* Specialty & Price Range */}
        {hasAnyMetaCard && (
          <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2'>
            <div className='flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:size-10'>
                <Sparkles size={18} />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400'>
                  {t('fieldSpecialty')}
                </p>
                <p className={cn(
                  'text-sm font-bold leading-snug break-words sm:text-base',
                  hasSpecialty ? 'text-slate-900' : 'text-slate-400 italic font-semibold'
                )}>
                  {hasSpecialty
                    ? (() => {
                        for (const cat of PROPERTY_TYPES) {
                          const type = cat.types.find((ty) => ty.code === specialtyCode);
                          if (type) return type.label;
                        }
                        return specialtyCode;
                      })()
                    : t('specialtyNotSpecified')}
                </p>
              </div>
            </div>

            {proposal.price_range && (
              <div className='flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4'>
                <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 sm:size-10'>
                  <TrendingUp size={18} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400'>
                    {t('fieldPriceRange')}
                  </p>
                  <div className='flex flex-col gap-2.5 text-xs font-bold text-slate-900 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-4 sm:gap-y-2'>
                    {hasRentRange && (
                        <div className='min-w-0'>
                          <span className='text-[10px] font-medium text-indigo-500'>
                            {t('rentRange')}
                          </span>
                          <p className='mt-0.5 text-xs font-bold leading-relaxed text-slate-900 break-words sm:text-sm'>
                            {formatVND(rentRange?.min ?? 0)} VND – {formatVND(rentRange?.max ?? 0)} VND
                          </p>
                        </div>
                      )}
                    {hasSaleRange && (
                        <div className='min-w-0'>
                          <span className='text-[10px] font-medium text-violet-500'>
                            {t('saleRange')}
                          </span>
                          <p className='mt-0.5 text-xs font-bold leading-relaxed text-slate-900 break-words sm:text-sm'>
                            {formatVND(saleRange?.min ?? 0)} VND – {formatVND(saleRange?.max ?? 0)} VND
                          </p>
                        </div>
                      )}
                    {!hasAnyPriceRange && (
                      <p className='text-xs font-medium text-slate-500'>
                        {t('priceRangeNotSpecified')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pitch content */}
        <div className='group'>
          <h3 className='mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-4'>
            <div className='size-1 shrink-0 rounded-full bg-indigo-400' />
            {t('sectionPitch')}
          </h3>
          <div className='rounded-xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-200/5 transition-shadow group-hover:shadow-md sm:rounded-2xl sm:p-6'>
            {pitchEmpty ? (
              <p className='text-sm font-semibold leading-7 text-slate-400 italic sm:text-base sm:leading-8'>
                {t('pitchNotSpecified')}
              </p>
            ) : (
              <p className='text-sm font-medium leading-7 whitespace-pre-wrap text-slate-700 sm:text-base sm:leading-8'>
                {proposal.pitch_content}
              </p>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className='mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-4'>
            <div className='size-1 shrink-0 rounded-full bg-slate-300' />
            {t('sectionActivity')}
          </h3>
          <div className='overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm sm:rounded-2xl'>
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
      <div className='flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5 lg:px-8'>
        <div className='flex min-w-0 flex-col gap-2 text-[11px] font-medium text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1'>
          <p className='flex min-w-0 items-center gap-1.5'>
            <Calendar className='size-3 shrink-0' />
            <span className='break-words'>
              {t('footerCreated', { date: createdDate.toLocaleDateString(locale) })}
            </span>
          </p>
          <span className='hidden size-1 shrink-0 rounded-full bg-slate-200 sm:inline' />
          <p className='flex min-w-0 items-center gap-1.5'>
            <Clock className='size-3 shrink-0' />
            <span className='break-words'>
              {t('footerUpdated', { date: updatedDate.toLocaleDateString(locale) })}
            </span>
          </p>
        </div>

        {isMobile && (
          <Button
            variant='outline'
            size='sm'
            className='w-full shrink-0 rounded-lg text-xs font-bold sm:w-auto'
            onClick={onBack}
          >
            {t('btnClose')}
          </Button>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  note,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  note?: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:gap-3 sm:px-4',
        !isLast && 'border-b border-slate-100'
      )}
    >
      <div className='flex items-start gap-3 sm:contents'>
        <div className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100'>
          {icon}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-slate-700'>{label}</p>
          <p className='mt-0.5 break-words text-xs text-slate-400'>{date}</p>
        </div>
      </div>
      {note && (
        <span className='w-fit shrink-0 self-start rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-500 sm:self-center'>
          {note}
        </span>
      )}
    </div>
  );
}
