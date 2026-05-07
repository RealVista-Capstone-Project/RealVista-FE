'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import {
  useMyProposalsQuery,
  useCancelProposalMutation,
  useUpdateProposalMutation,
  useApplyProposalMutation,
  useSaveProposalDraftMutation,
} from '@/features/agent-proposal/hooks/use-agent-proposal';
import {
  AgentProposal,
  ApplyAgentProposalPayload,
  AgentProposalStatus,
} from '@/entities/agent-proposal/model/types';
import { getAgentProposalSpecialtyCode } from '@/entities/agent-proposal/model/types';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks';
import { useSyncDashboardTopNavCountBadge } from '@/shared/lib/dashboard-top-nav-badge-context';
import { Spinner } from '@/shared/ui/spinner';
import { DataTable } from '@/shared/ui/data-table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Search,
  Filter,
  Plus,
  X,
  ChevronDown,
  FileText,
  FileSearch,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';
import { Badge } from '@/shared/ui/badge';

// ─── Sub-components (split into own files) ───
import { ProposalDetailView } from './components/proposal-detail-view';
import { ProposalFormDialog } from './components/proposal-form-dialog';
import { DeleteProposalDialog } from './components/delete-proposal-dialog';

// ─── Columns ────────────────────────────────────────────────────────────────

function ProposalColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (p: AgentProposal) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('ManageProposals');

  const columns = React.useMemo(() => {
    const cols: any[] = [
      {
        accessorKey: 'title',
        header: t('table.title'),
        cell: ({ row }: { row: { original: AgentProposal } }) => {
          const p = row.original;
          const specialtyCode = getAgentProposalSpecialtyCode(p);
          const specialtyLabel = (() => {
            if (!specialtyCode) return '';
            for (const cat of PROPERTY_TYPES) {
              const ty = cat.types.find((x) => x.code === specialtyCode);
              if (ty) return ty.label;
            }
            return specialtyCode;
          })();

          return (
            <div className='flex flex-col gap-1'>
              <span className='font-medium text-foreground'>{p.title}</span>
              {specialtyLabel && (
                <span className='inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary w-fit'>
                  {specialtyLabel}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'commission_rate',
        header: t('table.commission'),
        cell: ({ getValue }: { getValue: () => number }) => (
          <span className='font-medium text-foreground'>{getValue()}%</span>
        ),
      },
      {
        accessorKey: 'experience_years',
        header: t('table.experience'),
        cell: ({ getValue }: { getValue: () => number }) => (
          <span className='font-medium text-foreground'>{getValue()} năm</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }: { row: { original: AgentProposal } }) => {
          const p = row.original;
          const isActive = p.status === AgentProposalStatus.ACTIVE;
          return (
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={cn(
                'gap-1.5 font-medium',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-100'
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  isActive ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
              {isActive ? t('statusActive') : t('statusDraft')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'updated_at',
        header: t('table.updatedAt'),
        cell: ({ row }: { row: { original: AgentProposal } }) => {
          const p = row.original;
          const d = new Date(p.updated_at);
          const label = Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
          return <span className='text-muted-foreground'>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: AgentProposal } }) => {
          const p = row.original;
          return (
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5'
                onClick={() => onEdit(p)}
                title={t('btnEdit')}
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5'
                onClick={() => onDelete(p.agent_proposal_id)}
                title={t('btnDelete')}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          );
        },
      },
    ];
    return cols;
  }, [t, onEdit, onDelete]);

  return columns;
}

// ─── Main Component ────────────────────────────────────────────────────────

type StatusFilter = 'all' | AgentProposalStatus;

export function ManageAgentProposalsScreen() {
  const t = useTranslations('ManageProposals');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 10;

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [editTarget, setEditTarget] = React.useState<AgentProposal | null>(null);
  const [selectedProposal, setSelectedProposal] = React.useState<AgentProposal | null>(null);

  const [isSearchPending, setIsSearchPending] = React.useState(false);

  React.useEffect(() => {
    setIsSearchPending(searchQuery !== debouncedSearch);
  }, [searchQuery, debouncedSearch]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const hasActiveStatus = statusFilter !== 'all';
  const activeFilterCount = hasActiveStatus ? 1 : 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setIsFilterOpen(false);
  };

  const filterStatusOptions = [
    { value: 'all', labelKey: 'filter.allStatuses' },
    { value: AgentProposalStatus.ACTIVE, labelKey: 'statusActive' },
    { value: AgentProposalStatus.DRAFT, labelKey: 'statusDraft' },
  ];

  // ── Data ──
  const { data, isLoading, isError } = useMyProposalsQuery(page, PAGE_SIZE);
  const proposals = React.useMemo(() => data?.content ?? [], [data]);
  const totalElements = data?.total_elements ?? 0;
  const totalPages = data?.total_pages ?? 0;

  useSyncDashboardTopNavCountBadge(isLoading || isError ? null : totalElements);

  const filteredProposals = React.useMemo(() => {
    let result = proposals;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.pitch_content.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [proposals, debouncedSearch, statusFilter]);

  // ── Mutations ──
  const createMutation = useApplyProposalMutation(() => setIsFormOpen(false));
  const updateMutation = useUpdateProposalMutation(() => setIsFormOpen(false));
  const draftMutation = useSaveProposalDraftMutation(() => setIsFormOpen(false));
  const deleteMutation = useCancelProposalMutation(() => {
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

  const pagination: PaginationState = {
    pageIndex: page,
    pageSize: PAGE_SIZE,
  };

  const columns = ProposalColumns({ onEdit: openEdit, onDelete: openDelete });

  const toolbar = (
    <div className='flex flex-col gap-4 p-4 sm:p-5'>
      <div className='flex items-center justify-end'>
        <button
          type='button'
          onClick={openCreate}
          className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        >
          <Plus className='h-3.5 w-3.5' strokeWidth={2.5} />
          {t('createNew')}
        </button>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-md'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className='h-11 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-10 text-base font-medium focus:border-primary focus:outline-none focus:ring-0'
            aria-label={t('searchPlaceholder')}
          />
          {isSearchPending && (
            <span className='pointer-events-none absolute inset-y-0 right-4 flex items-center'>
              <Spinner className='size-4 text-primary' />
            </span>
          )}
        </div>

        <div ref={filterRef} className='relative shrink-0'>
          <button
            type='button'
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              hasActiveStatus
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
            )}
          >
            <Filter className='h-5 w-5' strokeWidth={2} />
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
              strokeWidth={2}
            />
            {hasActiveStatus && (
              <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                {activeFilterCount}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <div className='absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-primary/20 bg-white shadow-lg'>
              <div className='flex items-center justify-between border-b border-primary/20 px-4 py-3'>
                <span className='text-sm font-semibold text-foreground'>{t('filterTitle')}</span>
                <button
                  type='button'
                  onClick={resetFilters}
                  className='cursor-pointer text-xs font-medium text-primary hover:underline'
                >
                  {t('filterReset')}
                </button>
              </div>
              <div className='p-3'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('filterStatus')}
                </p>
                <div className='flex flex-col gap-1'>
                  {filterStatusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => {
                        setStatusFilter(opt.value as StatusFilter);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                        statusFilter === opt.value
                          ? 'bg-primary/5 font-medium text-primary'
                          : 'text-foreground hover:bg-primary/5'
                      )}
                    >
                      {t(opt.labelKey as Parameters<typeof t>[0])}
                      {statusFilter === opt.value && (
                        <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Render ──
  if (isLoading && page === 0) {
    return (
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('errorLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 flex gap-4 items-start'>
      <div className='flex-1 min-w-0'>
        <DataTable
          columns={columns}
          data={filteredProposals}
          isLoading={isLoading}
          pageCount={totalPages}
          pagination={pagination}
          onPaginationChange={(updater) => {
            const next = typeof updater === 'function' ? updater(pagination) : updater;
            setPage(next.pageIndex);
          }}
          toolbar={toolbar}
          emptyIcon={<FileText className='h-10 w-10 text-primary/40 mb-2' />}
          emptyTitle={t('emptyTitle')}
          pageInfoText={(current) => {
            const from = (current - 1) * PAGE_SIZE + 1;
            const to = Math.min(current * PAGE_SIZE, totalElements);
            return t('paginationShowing', { from, to, total: totalElements });
          }}
        />
      </div>

      {selectedProposal && (
        <ProposalDetailView
          proposal={selectedProposal}
          locale={locale}
          isMobile={false}
          onBack={() => setSelectedProposal(null)}
          onEdit={() => {
            openEdit(selectedProposal);
            setSelectedProposal(null);
          }}
          onDelete={() => {
            openDelete(selectedProposal.agent_proposal_id);
            setSelectedProposal(null);
          }}
        />
      )}

      <ProposalFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        initialData={editTarget}
        isLoading={createMutation.isPending || updateMutation.isPending || draftMutation.isPending}
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
