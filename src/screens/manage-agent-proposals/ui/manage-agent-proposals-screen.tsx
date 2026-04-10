'use client';

import * as React from 'react';
import { Search, Plus, X, FileText, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  useMyProposalsQuery,
  useCancelProposalMutation,
  useUpdateProposalMutation,
  useApplyProposalMutation,
  useSaveProposalDraftMutation,
} from '@/features/agent-proposal/hooks/use-agent-proposal';
import { AgentProposal, ApplyAgentProposalPayload } from '@/entities/agent-proposal/model/types';
import { getAgentProposalSpecialtyCode } from '@/entities/agent-proposal/model/types';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { cn } from '@/shared/lib/utils';
import { useDebounce, useIsMobile } from '@/shared/lib/hooks';

// ─── Sub-components (split into own files) ───
import { ProposalCard } from './components/proposal-card';
import { ProposalDetailView } from './components/proposal-detail-view';
import { ProposalFormDialog } from './components/proposal-form-dialog';
import { DeleteProposalDialog } from './components/delete-proposal-dialog';

/**
 * ManageAgentProposalsScreen
 *
 * Layout behaviour:
 * - No row selected → full-width list (table-like rows)
 * - Row selected → split 40% list / 60% detail panel
 * - Delete selected → deselect & close detail
 */
export function ManageAgentProposalsScreen() {
  const t = useTranslations('ManageProposals');
  const locale = useLocale();
  const isMobile = useIsMobile();

  // ── State ──
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 20;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [editTarget, setEditTarget] = React.useState<AgentProposal | null>(null);

  // ── Data ──
  const { data, isLoading } = useMyProposalsQuery(page, PAGE_SIZE);
  const proposals = React.useMemo(() => data?.content ?? [], [data]);

  const filtered = React.useMemo(() => {
    if (!debouncedSearch.trim()) return proposals;
    const q = debouncedSearch.toLowerCase();
    return proposals.filter(
      (p) => p.title.toLowerCase().includes(q) || p.pitch_content.toLowerCase().includes(q)
    );
  }, [proposals, debouncedSearch]);

  const selected = React.useMemo(
    () => proposals.find((p) => p.agent_proposal_id === selectedId) ?? null,
    [proposals, selectedId]
  );

  const showDetail = !!selectedId;

  // ── Mutations ──
  const createMutation = useApplyProposalMutation(() => setIsFormOpen(false));

  const updateMutation = useUpdateProposalMutation(() => setIsFormOpen(false));

  const draftMutation = useSaveProposalDraftMutation(() => setIsFormOpen(false));

  const deleteMutation = useCancelProposalMutation(() => {
    // If the deleted item was selected, clear the detail panel
    if (selectedId === pendingDeleteId) setSelectedId(null);
    setIsDeleteOpen(false);
    setPendingDeleteId(null);
  });

  // ── Handlers ──
  const openCreate = () => {
    setFormMode('create');
    setEditTarget(null);
    setIsFormOpen(true);
  };
  const openEdit = (p: AgentProposal) => {
    setFormMode('edit');
    setEditTarget(p);
    setIsFormOpen(true);
  };
  const openDelete = (id: string) => {
    setPendingDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (payload: ApplyAgentProposalPayload) => {
    if (formMode === 'edit' && editTarget) {
      updateMutation.mutate({ id: editTarget.agent_proposal_id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Render ──
  if (isLoading && page === 0) {
    return (
      <div className='flex h-full items-center justify-center bg-slate-50/50'>
        <div className='flex flex-col items-center gap-4 text-slate-400'>
          <div className='relative flex size-12 items-center justify-center'>
            <div className='absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75' />
            <div className='relative size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600' />
          </div>
          <p className='text-sm font-bold text-slate-500 animate-pulse'>{t('loadingProposals')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full overflow-hidden bg-slate-50'>
      {/* ── LEFT PANEL ── */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-hidden',
          // Width: when detail open → 40% (split), when closed → 100%
          showDetail && !isMobile ? 'w-[40%] min-w-[320px] max-w-[480px]' : 'w-full',
          // Mobile: hide list when detail is shown
          showDetail && isMobile ? 'hidden' : 'flex'
        )}
      >
        {/* Panel Header */}
        <div className='shrink-0 px-5 pt-5 pb-4 space-y-3 border-b border-slate-100'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-base font-bold text-slate-900'>{t('pageTitle')}</h1>
              <p className='text-xs text-slate-400 mt-0.5'>
                {t('pageSubtitle', { count: filtered.length })}
              </p>
            </div>
            <button
              onClick={openCreate}
              className='flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all'
            >
              <Plus size={15} strokeWidth={2.5} />
              {t('createNew')}
            </button>
          </div>

          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={15} />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder={t('searchPlaceholder')}
              className='h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Proposal List */}
        <div className='flex-1 overflow-y-auto px-4 py-2'>
          {filtered.length === 0 ? (
            <EmptyState t={t} isFiltering={!!debouncedSearch.trim()} onCreateClick={openCreate} />
          ) : (
            <div
              className={cn(
                // When split view: compact cards; when full width: use table-style rows
                showDetail && !isMobile ? 'space-y-2' : 'space-y-1'
              )}
            >
              <div
                className={cn(
                  !showDetail &&
                    'bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm'
                )}
              >
                {filtered.map((p) =>
                  showDetail && !isMobile ? (
                    // Compact card mode in split view
                    <ProposalCard
                      key={p.agent_proposal_id}
                      proposal={p}
                      isSelected={p.agent_proposal_id === selectedId}
                      inSplitView
                      onClick={() => setSelectedId(p.agent_proposal_id)}
                      onEdit={() => openEdit(p)}
                      onDelete={() => openDelete(p.agent_proposal_id)}
                    />
                  ) : (
                    // Full-width table row mode
                    <TableRow
                      key={p.agent_proposal_id}
                      t={t}
                      proposal={p}
                      isSelected={p.agent_proposal_id === selectedId}
                      onClick={() => setSelectedId(p.agent_proposal_id)}
                      onEdit={() => openEdit(p)}
                      onDelete={() => openDelete(p.agent_proposal_id)}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {(data?.total_pages ?? 0) > 1 && (
          <div className='shrink-0 border-t border-slate-100 px-4 py-3 bg-white'>
            <RealVistaPagination
              currentPage={page + 1}
              totalPages={data!.total_pages}
              onPageChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </aside>

      {/* ── RIGHT PANEL (Detail) ── */}
      {showDetail && (
        <main
          className={cn(
            'flex-1 overflow-hidden bg-white shadow-2xl z-10 transition-all animate-in slide-in-from-right duration-300',
            isMobile ? 'fixed inset-0 z-[60]' : 'relative'
          )}
        >
          {selected ? (
            <ProposalDetailView
              proposal={selected}
              locale={locale}
              isMobile={isMobile}
              onBack={() => setSelectedId(null)}
              onEdit={() => openEdit(selected)}
              onDelete={() => openDelete(selected.agent_proposal_id)}
            />
          ) : null}
        </main>
      )}

      {/* ── DIALOGS ── */}
      <ProposalFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        initialData={editTarget}
        isLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          draftMutation.isPending
        }
        onSubmit={handleFormSubmit}
        onSaveDraft={(payload) =>
          draftMutation.mutate({
            id: formMode === 'edit' && editTarget ? editTarget.agent_proposal_id : undefined,
            payload,
          })
        }
      />

      <DeleteProposalDialog
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
      />
    </div>
  );
}

/* ─────────── Full-Width Table Row (no selection state) ─────────── */
function TableRow({
  proposal,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  t,
}: {
  proposal: AgentProposal;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: any;
}) {
  const isActive = proposal.status === 'ACTIVE';
  const specialtyCode = getAgentProposalSpecialtyCode(proposal);
  const updatedDateParts = React.useMemo(() => {
    const d = new Date(proposal.updated_at);
    if (Number.isNaN(d.getTime())) return { day: '--', month: '--' };
    return {
      day: d.toLocaleDateString('vi-VN', { day: '2-digit' }),
      month: d.toLocaleDateString('vi-VN', { month: '2-digit' }),
    };
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
        'group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-150',
        isSelected ? 'bg-indigo-50/80 shadow-inner' : 'hover:bg-slate-50'
      )}
    >
      {/* Updated at */}
      <div
        className={cn(
          'flex size-10 shrink-0 flex-col items-center justify-center rounded-xl transition-all shadow-sm tabular-nums',
          isSelected
            ? 'bg-indigo-600 text-white scale-105'
            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        )}
      >
        <span className='text-[12px] font-bold leading-none'>{updatedDateParts.day}</span>
        <span className='text-[9px] font-semibold leading-none opacity-80'>{updatedDateParts.month}</span>
      </div>

      {/* Title + meta */}
      <div className='flex-1 min-w-0'>
        <p
          className={cn(
            'text-sm font-bold truncate transition-colors',
            isSelected ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-600'
          )}
        >
          {proposal.title}
        </p>
        <div className='mt-1 flex items-center gap-2 min-w-0'>
          {specialtyLabel && (
            <span className='inline-flex max-w-[45%] items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/70 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700'>
              <Sparkles size={10} className='shrink-0 opacity-80' />
              <span className='truncate'>{specialtyLabel}</span>
            </span>
          )}
          <p className='text-xs text-slate-400 truncate line-clamp-1 italic min-w-0'>
            &quot;{proposal.pitch_content}&quot;
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className='hidden lg:flex items-center gap-8 shrink-0 mx-4'>
        <div className='text-center'>
          <p className='text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5'>
            {t('metricExperience')}
          </p>
          <p className='text-sm font-bold text-slate-600'>{proposal.experience_years} năm</p>
        </div>
        <div className='text-center'>
          <p className='text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5'>
            {t('metricCommission')}
          </p>
          <p className='text-sm font-bold text-slate-600'>{proposal.commission_rate}%</p>
        </div>
        <div className='w-24 flex justify-end'>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap',
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            )}
          >
            <span
              className={cn('size-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-500')}
            />
            {isActive ? t('statusActive') : t('statusDraft')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2'>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className='rounded-lg p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all active:scale-90 border border-transparent hover:border-slate-100'
          title={t('btnEdit')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' />
            <path d='m15 5 4 4' />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className='rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm transition-all active:scale-90 border border-transparent hover:border-slate-100'
          title={t('btnDelete')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M3 6h18' />
            <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
            <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────── Empty States ─────────── */
function EmptyState({
  t,
  isFiltering,
  onCreateClick,
}: {
  t: any;
  isFiltering: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className='flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200'>
      <div className='mb-6 flex size-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 shadow-inner'>
        <FileText size={36} strokeWidth={1.5} />
      </div>
      <h3 className='text-lg font-bold text-slate-800 mb-2'>
        {isFiltering ? t('emptyFilterTitle') : t('emptyTitle')}
      </h3>
      <p className='text-sm text-slate-500 mb-8 max-w-[280px] leading-relaxed'>
        {isFiltering ? t('emptyFilterDesc') : t('emptyDesc')}
      </p>
      {!isFiltering && (
        <button
          onClick={onCreateClick}
          className='flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200'
        >
          <Plus size={18} strokeWidth={3} />
          {t('btnCreateNow')}
        </button>
      )}
    </div>
  );
}
