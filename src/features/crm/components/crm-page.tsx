'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Calendar as CalendarIcon,
  StickyNote,
  Building2,
  GripVertical,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Pie, PieChart } from 'recharts';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Card, CardContent } from '@/shared/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from '@/shared/ui/kanban';
import {
  useLeads,
  useLeadSummary,
  useCreateLead,
  useUpdateLead,
  useUpdateLeadStatus,
  useAddLeadNote,
} from '../api/lead.queries';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/shared/ui/data-table';
import type { CreateLeadRequest, LeadResponse, LeadSummaryResponse } from '../types/api';
import { Lead, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '../types/lead';
import { conversationApi } from '@/entities/conversation/api';
import { conversationKeys } from '@/entities/conversation/api/keys';
import { listingQueries } from '@/entities/listing/api';
import { ROUTES } from '@/shared/config/routes';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CrmContentSkeleton } from './crm-content-skeleton';
import { CrmHeader, getInitialDateRange } from './crm-header';
import { CrmSearchInput } from './crm-search-input';
import { AddLeadModal } from './add-lead-modal';
import { LeadDetailModal } from './lead-detail-modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TranslationFn = ReturnType<typeof useTranslations>;

function getInitials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  return parts
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatRelative(iso: string) {
  if (!iso) return 'Chưa cập nhật';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'Chưa cập nhật';
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

function formatShortDate(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatApiDate(date?: Date) {
  return date ? format(date, 'yyyy-MM-dd') : undefined;
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function getPageCount(pageData: unknown) {
  const page = pageData as { total_pages?: number; totalPages?: number } | undefined;
  return page?.total_pages ?? page?.totalPages ?? 0;
}

const SOURCE_LABEL_KEYS: Record<Lead['source'], string> = {
  CHAT: 'sources.chat',
  TOUR: 'sources.tour',
  MANUAL: 'sources.manual',
};

const SOURCE_LABELS: Record<Lead['source'], string> = {
  CHAT: 'Chat',
  TOUR: 'Đặt lịch xem',
  MANUAL: 'Thêm thủ công',
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  MANUAL: 'var(--primary)',
  CHAT: 'var(--chart-2)',
  TOUR: 'var(--chart-3)',
};

const SOURCE_ORDER: Lead['source'][] = ['MANUAL', 'CHAT', 'TOUR'];

const PRIORITY_LABELS: Record<NonNullable<Lead['priority']>, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const PRIORITY_COLORS: Record<NonNullable<Lead['priority']>, string> = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-300 shadow-slate-200/70',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-200/70',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-200/70',
  URGENT: 'bg-red-100 text-red-800 border-red-300 shadow-red-200/70',
};

const ALL_STATUSES = Object.values(LeadStatus);

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const resolvedStatus = LEAD_STATUS_COLORS[status] ? status : LeadStatus.NEW;
  const c = LEAD_STATUS_COLORS[resolvedStatus];
  return (
    <Badge variant='outline' className={cn('gap-1.5 font-medium border', c.bg, c.text, c.border)}>
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {LEAD_STATUS_LABELS[resolvedStatus]}
    </Badge>
  );
}

const MetricCard = React.memo(function MetricCard({
  title,
  value,
  previousValue,
  icon,
  comparisonLabel,
}: {
  title: string;
  value: number;
  previousValue: number;
  icon: React.ReactNode;
  comparisonLabel: string;
}) {
  const change = getPercentChange(value, previousValue);
  const isNegative = change < 0;

  return (
    <Card className='h-[92px] rounded-2xl border-border/80 bg-card py-0 shadow-sm'>
      <CardContent className='flex h-full items-center justify-between gap-4 px-4 py-3'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold tracking-tight text-foreground tabular-nums'>{value}</p>
          <p className='text-xs text-muted-foreground'>
            <span className={cn('font-semibold', isNegative ? 'text-red-500' : 'text-emerald-500')}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>{' '}
            {comparisonLabel}
          </p>
        </div>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary'>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
});

const LeadsBySourceCard = React.memo(function LeadsBySourceCard({
  summary,
  t,
}: {
  summary?: LeadSummaryResponse;
  t: TranslationFn;
}) {
  const rawRows = summary?.bySource ?? [];
  const rows = SOURCE_ORDER.map((source) => ({
    source,
    count: rawRows.find((row) => row.source === source)?.count ?? 0,
  }));
  const total = summary?.totalLeads ?? rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = rows.map((row) => ({
    source: row.source.toLowerCase(),
    count: row.count,
    fill: `var(--color-${row.source.toLowerCase()})`,
  }));
  const chartConfig = {
    manual: {
      label: t(SOURCE_LABEL_KEYS.MANUAL),
      color: SOURCE_COLORS.MANUAL,
    },
    chat: {
      label: t(SOURCE_LABEL_KEYS.CHAT),
      color: SOURCE_COLORS.CHAT,
    },
    tour: {
      label: t(SOURCE_LABEL_KEYS.TOUR),
      color: SOURCE_COLORS.TOUR,
    },
  } satisfies ChartConfig;

  return (
    <Card className='h-[196px] rounded-2xl border-border/80 bg-card py-0 shadow-sm'>
      <CardContent className='flex h-full flex-col gap-1 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-foreground'>{t('metrics.leadsBySource')}</p>
          <p className='text-xs text-muted-foreground'>{t('metrics.filteredByDateAndSearch')}</p>
        </div>
        <div className='flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:items-center'>
          <div className='relative size-32 shrink-0'>
            <ChartContainer config={chartConfig} className='aspect-square size-full min-h-[128px]'>
              <PieChart accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey='source' />}
                />
                <Pie
                  data={chartData}
                  dataKey='count'
                  nameKey='source'
                  innerRadius={44}
                  outerRadius={56}
                  strokeWidth={3}
                />
              </PieChart>
            </ChartContainer>
            <div className='absolute inset-0 flex items-center justify-center text-center'>
              <p className='text-2xl font-bold tabular-nums text-foreground'>{total}</p>
            </div>
          </div>
          <div className='w-full space-y-2.5 sm:flex-1'>
            <div className='rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium text-foreground'>
              Tổng: <span className='font-bold tabular-nums'>{total}</span> khách hàng tiềm năng
            </div>
            {rows.map((row) => (
              <div key={row.source} className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <span
                    className='size-2.5 rounded-full'
                    style={{ backgroundColor: SOURCE_COLORS[row.source] }}
                  />
                  <span className='text-sm font-medium text-muted-foreground'>
                    {t(SOURCE_LABEL_KEYS[row.source])}
                  </span>
                </div>
                <span className='text-sm font-semibold tabular-nums text-foreground'>
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── Lead Card (Kanban) ───────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onAddNote: (lead: Lead) => void;
  onViewDetail: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onViewCalendar: (lead: Lead) => void;
}

const LeadCard = React.memo(function LeadCard({
  lead,
  onAddNote,
  onViewDetail,
  onOpenChat,
  onViewCalendar,
}: LeadCardProps) {
  const nextFollowUp = formatShortDate(lead.nextFollowUpAt);
  const canChat = !!lead.buyerId;
  const priority = lead.priority ?? 'MEDIUM';

  return (
    <Card
      className='border-border/60 py-0 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group'
      onClick={() => onViewDetail(lead)}
    >
      <CardContent className='p-2 flex flex-col gap-1.5'>
        {/* Header row */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 min-w-0'>
            <Avatar className='size-7 shrink-0'>
              <AvatarImage src={lead.avatarUrl} alt={lead.customerName || 'Khách hàng'} />
              <AvatarFallback className='text-xs bg-primary/10 text-primary font-semibold'>
                {getInitials(lead.customerName)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='text-sm font-semibold truncate'>{lead.customerName || 'Khách hàng'}</p>
              <p className='text-[11px] text-muted-foreground/60 truncate'>
                {lead.phone || lead.email || 'Chưa có liên hệ'}
              </p>
            </div>
          </div>
          <Badge
            variant='outline'
            className={cn(
              'h-5 shrink-0 px-1.5 text-[10px] font-bold shadow-sm',
              PRIORITY_COLORS[priority]
            )}
          >
            {PRIORITY_LABELS[priority]}
          </Badge>
        </div>

        {/* Property interest */}
        {lead.propertyInterest && (
          <div className='flex items-center gap-1.5'>
            <Building2 className='size-3.5 shrink-0 text-muted-foreground' />
            <p className='text-xs text-muted-foreground truncate'>{lead.propertyInterest}</p>
          </div>
        )}

        <div className='rounded-md border border-primary/10 bg-primary/[0.035] px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'>
          <div className='mb-0.5 flex items-center gap-2'>
            <p className='text-[11px] font-medium text-muted-foreground'>Ghi chú</p>
          </div>
          <p className='text-xs text-foreground/80 line-clamp-2'>
            {lead.lastNote ||
              (nextFollowUp ? `Follow-up ngày ${nextFollowUp}` : 'Chưa có ghi chú tiếp theo')}
          </p>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-2 pt-0.5'>
          <span className='text-[11px] text-muted-foreground'>
            {nextFollowUp ? `Follow-up ${nextFollowUp}` : formatRelative(lead.updatedAt)}
          </span>
          <div
            className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={(e) => e.stopPropagation()}
          >
            <TooltipProvider delayDuration={300}>
              {lead.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 text-muted-foreground hover:text-primary'
                      onClick={() => window.open(`tel:${lead.phone}`)}
                    >
                      <Phone className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gọi điện</TooltipContent>
                </Tooltip>
              )}
              {canChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 text-muted-foreground hover:text-primary'
                      onClick={() => onOpenChat(lead)}
                    >
                      <MessageCircle className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat</TooltipContent>
                </Tooltip>
              )}
              {canChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 text-muted-foreground hover:text-primary'
                      onClick={() => onViewCalendar(lead)}
                    >
                      <CalendarIcon className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Đặt lịch xem</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-6 text-muted-foreground hover:text-amber-600'
                    onClick={() => onAddNote(lead)}
                  >
                    <StickyNote className='size-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Thêm ghi chú</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── Kanban Column Header ─────────────────────────────────────────────────────

interface KanbanColHeaderProps {
  status: LeadStatus;
  count: number;
  onAddLead: () => void;
}

const KanbanColHeader = React.memo(function KanbanColHeader({
  status,
  count,
  onAddLead,
}: KanbanColHeaderProps) {
  const c = LEAD_STATUS_COLORS[status];
  return (
    <div
      className={cn(
        'group/header flex items-center justify-between rounded-lg px-3 py-2.5 mb-3 border',
        c.bg,
        c.border
      )}
    >
      <div className='flex items-center gap-2'>
        <KanbanColumnHandle className='opacity-100'>
          <GripVertical className='size-3.5 text-muted-foreground/50' />
        </KanbanColumnHandle>
        <span className={cn('h-2 w-2 rounded-full', c.dot)} />
        <span className={cn('text-sm font-semibold', c.text)}>{LEAD_STATUS_LABELS[status]}</span>
      </div>
      <div className='flex items-center gap-1.5'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-6 opacity-0 transition-opacity group-hover/header:opacity-100'
          onClick={(e) => {
            e.stopPropagation();
            onAddLead();
          }}
        >
          <Plus className='size-3.5' />
        </Button>
        <Badge
          variant='secondary'
          className={cn('text-xs font-bold', c.text, c.bg, 'border', c.border)}
        >
          {count}
        </Badge>
      </div>
    </div>
  );
});

// ─── Table Columns ────────────────────────────────────────────────────────────

function makeLeadColumns(
  onAddNote: (lead: Lead) => void,
  onViewDetail: (lead: Lead) => void,
  onOpenChat: (lead: Lead) => void,
  onViewCalendar: (lead: Lead) => void
): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className='flex items-center gap-3'>
            <Avatar className='size-8 shrink-0'>
              <AvatarImage src={lead.avatarUrl} alt={lead.customerName} />
              <AvatarFallback className='text-xs bg-primary/10 text-primary font-semibold'>
                {getInitials(lead.customerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='text-sm font-medium'>{lead.customerName}</p>
              {lead.email && <p className='text-xs text-muted-foreground'>{lead.email}</p>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground'>{row.original.phone ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'propertyInterest',
      header: 'BĐS quan tâm',
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground truncate max-w-[200px] block'>
          {row.original.propertyInterest ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'source',
      header: 'Nguồn',
      cell: ({ row }) => (
        <Badge variant='outline' className='text-xs font-normal'>
          {SOURCE_LABELS[row.original.source]}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Cập nhật',
      cell: ({ row }) => (
        <span className='text-xs text-muted-foreground'>{formatDate(row.original.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const lead = row.original;
        const canChat = !!lead.buyerId;
        return (
          <div className='flex items-center justify-end gap-1' onClick={(e) => e.stopPropagation()}>
            <TooltipProvider delayDuration={300}>
              {lead.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 text-muted-foreground hover:text-primary'
                      onClick={() => window.open(`tel:${lead.phone}`)}
                    >
                      <Phone className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gọi điện</TooltipContent>
                </Tooltip>
              )}
              {canChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 text-muted-foreground hover:text-primary'
                      onClick={() => onOpenChat(lead)}
                    >
                      <MessageCircle className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat</TooltipContent>
                </Tooltip>
              )}
              {canChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 text-muted-foreground hover:text-primary'
                      onClick={() => onViewCalendar(lead)}
                    >
                      <CalendarIcon className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Đặt lịch xem</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-muted-foreground hover:text-amber-600'
                    onClick={() => onAddNote(lead)}
                  >
                    <StickyNote className='size-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Thêm ghi chú</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
}

// ─── Map BE response → FE Lead shape ─────────────────────────────────────────

function mapLead(r: LeadResponse): Lead {
  const raw = r as unknown as Record<string, unknown>;
  const rawNotes = (raw.notes as Record<string, unknown>[] | undefined) ?? [];
  const notes = rawNotes.map((n) => ({
    id: (n.lead_note_id as string | undefined) ?? (n.leadNoteId as string | undefined) ?? '',
    content: (n.content as string | undefined) ?? '',
    createdAt: (n.created_at as string | undefined) ?? (n.createdAt as string | undefined) ?? '',
    status: (n.status_at_time as LeadStatus | undefined) ?? (n.statusAtTime as LeadStatus),
  }));
  const lastNote = notes.length > 0 ? notes[notes.length - 1].content : undefined;
  return {
    id: (raw.listing_lead_id as string | undefined) ?? r.listingLeadId,
    listingId: (raw.listing_id as string | undefined) ?? r.listingId ?? undefined,
    customerName: (raw.full_name as string | undefined) ?? r.fullName,
    avatarUrl: (raw.buyer_avatar_url as string | undefined) ?? r.buyerAvatarUrl ?? undefined,
    phone: (raw.phone as string | undefined) ?? r.phone ?? undefined,
    email: (raw.email as string | undefined) ?? r.email ?? undefined,
    buyerId: (raw.buyer_id as string | undefined) ?? r.buyerId ?? undefined,
    propertyInterest: (raw.listing_name as string | undefined) ?? r.listingName ?? undefined,
    status: (raw.status as LeadStatus | undefined) ?? r.status,
    priority: (raw.priority as Lead['priority'] | undefined) ?? r.priority ?? undefined,
    lastContactedAt:
      (raw.last_contacted_at as string | undefined) ?? r.lastContactedAt ?? undefined,
    nextFollowUpAt: (raw.next_follow_up_at as string | undefined) ?? r.nextFollowUpAt ?? undefined,
    source: (raw.source as Lead['source'] | undefined) ?? r.source,
    lastNote,
    notes,
    createdAt: (raw.created_at as string | undefined) ?? r.createdAt,
    updatedAt: (raw.updated_at as string | undefined) ?? r.updatedAt,
  };
}

function normalizeSummary(summary?: LeadSummaryResponse): LeadSummaryResponse | undefined {
  if (!summary) return undefined;
  const raw = summary as unknown as Record<string, unknown>;
  return {
    totalLeads: (raw.total_leads as number | undefined) ?? summary.totalLeads ?? 0,
    closedLeads: (raw.closed_leads as number | undefined) ?? summary.closedLeads ?? 0,
    previousTotalLeads:
      (raw.previous_total_leads as number | undefined) ?? summary.previousTotalLeads ?? 0,
    previousClosedLeads:
      (raw.previous_closed_leads as number | undefined) ?? summary.previousClosedLeads ?? 0,
    bySource: (
      (raw.by_source as LeadSummaryResponse['bySource'] | undefined) ??
      summary.bySource ??
      []
    ).map((row) => {
      const rawRow = row as unknown as Record<string, unknown>;
      return {
        source: row.source,
        count: (rawRow.count as number | undefined) ?? row.count ?? 0,
      };
    }),
  };
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'table';
type TabValue = 'all' | LeadStatus;

const STATUS_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  ...ALL_STATUSES.map((s) => ({ value: s as TabValue, label: LEAD_STATUS_LABELS[s] })),
];

export function CrmPage() {
  const router = useRouter();
  const t = useTranslations('CRM');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [view, setView] = React.useState<ViewMode>('kanban');
  const [tab, setTab] = React.useState<TabValue>('all');
  const [search, setSearch] = React.useState('');
  const [listingFilter, setListingFilter] = React.useState('all');
  const deferredSearch = React.useDeferredValue(search.trim());
  const [dateRange, setDateRange] = React.useState<DateRange>(() => getInitialDateRange());
  const [tablePagination, setTablePagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const { data: managedListingsPage } = useQuery(listingQueries.managed({ page: 0, size: 100 }));
  const managedListings = managedListingsPage?.content ?? [];

  const from = formatApiDate(dateRange.from);
  const to = formatApiDate(dateRange.to);
  const status = tab === 'all' ? undefined : tab;
  const leadFilters = React.useMemo(
    () => ({
      status,
      from,
      to,
      listingId: listingFilter === 'all' ? undefined : listingFilter,
      q: deferredSearch || undefined,
      page: view === 'table' ? tablePagination.pageIndex : 0,
      size: view === 'table' ? tablePagination.pageSize : 100,
    }),
    [deferredSearch, from, listingFilter, status, tablePagination.pageIndex, tablePagination.pageSize, to, view]
  );
  const summaryFilters = React.useMemo(
    () => ({
      from,
      to,
      listingId: listingFilter === 'all' ? undefined : listingFilter,
      q: deferredSearch || undefined,
    }),
    [deferredSearch, from, listingFilter, to]
  );

  const { data: pageData, isLoading, isFetching } = useLeads(leadFilters);
  const { data: summaryData, isFetching: isSummaryFetching } = useLeadSummary(summaryFilters);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const updateStatus = useUpdateLeadStatus();
  const addNote = useAddLeadNote();

  const leads: Lead[] = React.useMemo(() => (pageData?.content ?? []).map(mapLead), [pageData]);

  const [addLeadOpen, setAddLeadOpen] = React.useState(false);
  const [pendingCreateStatus, setPendingCreateStatus] = React.useState<LeadStatus | null>(null);
  const [addNoteTarget, setAddNoteTarget] = React.useState<Lead | null>(null);
  const [detailLead, setDetailLead] = React.useState<Lead | null>(null);
  const kanbanScrollRef = React.useRef<HTMLDivElement>(null);
  const [kanbanFades, setKanbanFades] = React.useState({ left: false, right: false });

  const handleSearchChange = React.useCallback((value: string) => {
    React.startTransition(() => {
      setSearch(value);
    });
  }, []);

  const handleTabChange = React.useCallback((value: string) => {
    setTab(value as TabValue);
  }, []);

  const handleViewDetail = React.useCallback((lead: Lead) => {
    setDetailLead(lead);
  }, []);

  const handleOpenAddLead = React.useCallback((status?: LeadStatus) => {
    setAddNoteTarget(null);
    setPendingCreateStatus(status ?? null);
    setAddLeadOpen(true);
  }, []);

  const handleCloseAddLead = React.useCallback(() => {
    setAddLeadOpen(false);
    setPendingCreateStatus(null);
  }, []);

  const handleCloseDetail = React.useCallback(() => {
    setDetailLead(null);
  }, []);

  React.useEffect(() => {
    setTablePagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [deferredSearch, from, listingFilter, status, to]);

  const handleOpenChat = React.useCallback(
    async (lead: Lead) => {
      if (!lead.buyerId) return;
      const response = await conversationApi.createOrGetConversation(lead.buyerId);
      const conversation = response.payload.data;
      const conversationId = conversation.conversation_id;
      if (conversationId) {
        queryClient.setQueryData(conversationKeys.list(), (current: any) => {
          const existing = current?.payload?.data ?? current?.data ?? [];
          const items = Array.isArray(existing) ? existing : [];
          const nextItem = {
            conversation_id: conversation.conversation_id,
            other_user: {
              user_id: conversation.other_user_id,
              name: conversation.other_user_name,
              avatar_url: conversation.other_user_avatar_url,
            },
            last_message: undefined,
            last_message_type: undefined,
            last_message_time: undefined,
            unread_count: 0,
            created_at: conversation.created_at,
          };

          if (current?.payload?.data) {
            return {
              ...current,
              payload: {
                ...current.payload,
                data: [
                  nextItem,
                  ...items.filter((item: any) => item.conversation_id !== nextItem.conversation_id),
                ],
              },
            };
          }

          if (current?.data) {
            return {
              ...current,
              data: [
                nextItem,
                ...items.filter((item: any) => item.conversation_id !== nextItem.conversation_id),
              ],
            };
          }

          return { payload: { data: [nextItem] } };
        });
        router.push(`/${locale}${ROUTES.dashboard.messages}/${conversationId}`);
      }
    },
    [locale, queryClient, router]
  );

  const handleViewCalendar = React.useCallback(
    (lead: Lead) => {
      if (!lead.buyerId) return;

      const params = new URLSearchParams({ user: lead.buyerId });
      if (lead.listingId) params.set('listing', lead.listingId);

      router.push(`/${locale}${ROUTES.dashboard.appointments}?${params.toString()}`);
    },
    [locale, router]
  );

  // Keep detailLead in sync when leads refresh
  React.useEffect(() => {
    if (detailLead) {
      const updated = leads.find((l) => l.id === detailLead.id);
      if (updated) setDetailLead(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  const filteredLeads = React.useMemo(() => {
    return leads;
  }, [leads]);

  // Kanban state: columns keyed by status, values are lead arrays
  const kanbanColumns = React.useMemo(() => {
    const visibleStatuses = tab === 'all' ? ALL_STATUSES : [tab as LeadStatus];
    const map: Record<string, Lead[]> = {};
    for (const s of visibleStatuses) {
      map[s] = filteredLeads.filter((l) => l.status === s);
    }
    return map;
  }, [filteredLeads, tab]);

  const [columns, setColumns] = React.useState<Record<string, Lead[]>>(kanbanColumns);

  // Sync columns when leads / filter change
  React.useEffect(() => {
    setColumns(kanbanColumns);
  }, [kanbanColumns]);

  const getLeadId = React.useCallback((item: Lead) => item.id, []);

  const updateKanbanFades = React.useCallback(() => {
    const el = kanbanScrollRef.current;
    if (!el) return;

    const next = {
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    };

    setKanbanFades((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  React.useEffect(() => {
    if (view !== 'kanban') return;

    const frame = window.requestAnimationFrame(updateKanbanFades);
    window.addEventListener('resize', updateKanbanFades);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateKanbanFades);
    };
  }, [columns, tab, view, updateKanbanFades]);

  const handleColumnChange = React.useCallback((newCols: Record<string, Lead[]>) => {
    setColumns(newCols);
  }, []);

  const handleLeadMove = React.useCallback(
    ({ activeContainer, activeIndex, overContainer, overIndex }: KanbanMoveEvent) => {
      const activeItems = columns[activeContainer] ?? [];
      const movedLead = activeItems[activeIndex];
      if (!movedLead) return;

      const nextColumns: Record<string, Lead[]> = { ...columns };

      if (activeContainer === overContainer) {
        const reorderedItems = [...activeItems];
        reorderedItems.splice(activeIndex, 1);
        reorderedItems.splice(overIndex, 0, movedLead);
        nextColumns[activeContainer] = reorderedItems;
        setColumns(nextColumns);
        return;
      }

      const nextActiveItems = [...activeItems];
      const nextOverItems = [...(columns[overContainer] ?? [])];
      nextActiveItems.splice(activeIndex, 1);
      nextOverItems.splice(overIndex, 0, movedLead);
      nextColumns[activeContainer] = nextActiveItems;
      nextColumns[overContainer] = nextOverItems;
      setColumns(nextColumns);

      if (movedLead.id && movedLead.status !== overContainer) {
        updateStatus.mutate({ leadId: movedLead.id, data: { status: overContainer as LeadStatus } });
      }
    },
    [columns, updateStatus]
  );

  const handleOpenAddNote = React.useCallback((lead: Lead) => {
    setAddNoteTarget(lead);
    setAddLeadOpen(true);
  }, []);

  const handleStatusChange = React.useCallback(
    (leadId: string, status: LeadStatus) => {
      updateStatus.mutate({ leadId, data: { status } });
      setDetailLead((prev) => (prev?.id === leadId ? { ...prev, status } : prev));
    },
    [updateStatus]
  );

  const handlePriorityChange = React.useCallback(
    (lead: Lead, priority: NonNullable<Lead['priority']>) => {
      updateLead.mutate(
        {
          leadId: lead.id,
          data: {
            full_name: lead.customerName,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            listing_id: lead.listingId,
            priority,
          },
        },
        {
          onSuccess: () => {
            setDetailLead((prev) => (prev?.id === lead.id ? { ...prev, priority } : prev));
          },
          onError: (err: any) => {
            toast.error(err?.payload?.message ?? 'Cập nhật mức ưu tiên thất bại');
          },
        }
      );
    },
    [updateLead]
  );

  const handleCreateLead = React.useCallback(
    (data: CreateLeadRequest) => {
      createLead.mutate(data, {
        onSuccess: () => {
          toast.success('Thêm khách hàng thành công');
          setAddLeadOpen(false);
          setPendingCreateStatus(null);
        },
        onError: (err: any) => {
          const payload = err?.payload;
          const fieldErrors: { field: string; message: string }[] = payload?.errors ?? [];
          if (fieldErrors.length > 0) {
            fieldErrors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
          } else {
            toast.error(payload?.message ?? 'Thêm khách hàng thất bại');
          }
        },
      });
    },
    [createLead]
  );

  const handleAddNote = React.useCallback(
    (leadId: string, content: string) => {
      addNote.mutate(
        { leadId, data: { content } },
        {
          onSuccess: () => {
            toast.success('Thêm ghi chú thành công');
            setAddLeadOpen(false);
          },
          onError: (err: any) => {
            toast.error(err?.payload?.message ?? 'Thêm ghi chú thất bại');
          },
        }
      );
    },
    [addNote]
  );

  const leadColumns = React.useMemo(
    () => makeLeadColumns(handleOpenAddNote, handleViewDetail, handleOpenChat, handleViewCalendar),
    [handleOpenAddNote, handleOpenChat, handleViewCalendar, handleViewDetail]
  );

  const totalLeadsIcon = React.useMemo(() => <Users className='size-4' />, []);
  const closedLeadsIcon = React.useMemo(() => <Briefcase className='size-4' />, []);

  const summary = React.useMemo(() => normalizeSummary(summaryData), [summaryData]);
  const totalLeads = summary?.totalLeads ?? 0;
  const closedLeads = summary?.closedLeads ?? 0;
  const tablePageCount = getPageCount(pageData);
  const showInitialLoading = isLoading && !pageData;
  const showRefreshSkeleton = !showInitialLoading && (isFetching || isSummaryFetching);

  return (
    <div className='min-h-full flex flex-col p-6 gap-5 bg-background'>
      {showInitialLoading && (
        <div className='flex items-center justify-center flex-1 py-20 text-sm text-muted-foreground'>
          Đang tải dữ liệu...
        </div>
      )}
      {!showInitialLoading && (
        <>
          <CrmHeader
            title={t('title')}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            view={view}
            onViewChange={setView}
            onAddLead={handleOpenAddLead}
            t={t}
          />

          {/* Metrics */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]'>
            <LeadsBySourceCard summary={summary} t={t} />
            <div className='flex flex-col gap-2'>
              <MetricCard
                title={t('metrics.totalCustomers')}
                value={totalLeads}
                previousValue={summary?.previousTotalLeads ?? 0}
                comparisonLabel={t('metrics.fromPreviousPeriod')}
                icon={totalLeadsIcon}
              />
              <MetricCard
                title={t('metrics.totalDeals')}
                value={closedLeads}
                previousValue={summary?.previousClosedLeads ?? 0}
                comparisonLabel={t('metrics.fromPreviousPeriod')}
                icon={closedLeadsIcon}
              />
            </div>
          </div>

          <div className='flex items-center gap-3 flex-wrap'>
            <CrmSearchInput value={search} onChange={handleSearchChange} />

            {managedListings.length > 0 && (
              <Select value={listingFilter} onValueChange={setListingFilter}>
                <SelectTrigger className='w-full sm:w-[230px] bg-background/90 shadow-sm'>
                  <SelectValue placeholder={t('filters.listing')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='all'>{t('filters.allListings')}</SelectItem>
                    {managedListings.map((listing) => (
                      <SelectItem key={listing.listing_id} value={listing.listing_id}>
                        {listing.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            <Select value={tab} onValueChange={handleTabChange}>
              <SelectTrigger className='w-full sm:w-[230px] bg-background/90 shadow-sm'>
                <SelectValue placeholder='Lọc theo trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_TABS.map((t) => {
                    const count =
                      t.value === 'all'
                        ? leads.length
                        : leads.filter((l) => l.status === t.value).length;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {showRefreshSkeleton ? (
            <CrmContentSkeleton view={view} />
          ) : leads.length === 0 ? (
            <Card className='border-dashed shadow-sm'>
              <CardContent className='flex flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
                <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <Users className='size-6' />
                </div>
                <div>
                  <p className='font-semibold'>Chưa có khách hàng nào</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Thêm khách hàng đầu tiên để bắt đầu theo dõi.
                  </p>
                </div>
                <Button
                  className='gap-1.5'
                  onClick={() => handleOpenAddLead()}
                >
                  <Plus className='size-4' data-icon='inline-start' />
                  Thêm khách hàng đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : view === 'kanban' ? (
            <div className='relative overflow-hidden'>
              <Kanban
                value={columns}
                onValueChange={handleColumnChange}
                getItemValue={getLeadId}
                onMove={handleLeadMove}
                className='flex-1'
              >
                <div
                  ref={kanbanScrollRef}
                  className='overflow-x-auto pb-3 pr-8 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'
                  onScroll={updateKanbanFades}
                >
                  <KanbanBoard className='flex gap-3 !grid-cols-none auto-rows-auto items-start'>
                    {Object.entries(columns).map(([statusKey, colLeads]) => (
                      <KanbanColumn
                        key={statusKey}
                        value={statusKey}
                        className='min-w-[236px] max-w-[244px] flex-shrink-0'
                      >
                        <KanbanColHeader
                          status={statusKey as LeadStatus}
                          count={colLeads.length}
                          onAddLead={() => handleOpenAddLead(statusKey as LeadStatus)}
                        />
                        <KanbanColumnContent
                          value={statusKey}
                          className='flex flex-col gap-3 overflow-y-auto'
                          style={{ maxHeight: 'calc(100vh - 360px)' } as React.CSSProperties}
                        >
                          {colLeads.length === 0 ? (
                            <div className='h-12 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20' />
                          ) : (
                            colLeads.map((lead, index) => {
                              const itemId = lead.id || `${statusKey}-${index}`;

                              return (
                                <KanbanItem key={itemId} value={itemId}>
                                  <KanbanItemHandle>
                                    <LeadCard
                                      lead={lead}
                                      onAddNote={handleOpenAddNote}
                                      onViewDetail={handleViewDetail}
                                      onOpenChat={handleOpenChat}
                                      onViewCalendar={handleViewCalendar}
                                    />
                                  </KanbanItemHandle>
                                </KanbanItem>
                              );
                            })
                          )}
                        </KanbanColumnContent>
                      </KanbanColumn>
                    ))}
                  </KanbanBoard>
                </div>
                <KanbanOverlay>
                  {({ value, variant }) => {
                    if (variant === 'item') {
                      const lead = leads.find((l) => l.id === value);
                      if (lead) {
                        return (
                          <LeadCard
                            lead={lead}
                            onAddNote={() => {}}
                            onViewDetail={() => {}}
                            onOpenChat={() => {}}
                            onViewCalendar={() => {}}
                          />
                        );
                      }
                    }
                    return <div className='bg-muted size-full rounded-xl opacity-80' />;
                  }}
                </KanbanOverlay>
              </Kanban>
              {kanbanFades.left && (
                <div className='pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent' />
              )}
              {kanbanFades.right && (
                <div className='pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent' />
              )}
            </div>
          ) : (
            <DataTable
              columns={leadColumns}
              data={leads}
              isLoading={isLoading}
              pageCount={tablePageCount}
              pagination={tablePagination}
              onPaginationChange={setTablePagination}
              pageInfoText={(current, total) => t('pagination.pageInfo', { current, total })}
              emptyTitle='Không tìm thấy khách hàng nào'
              onRowClick={handleViewDetail}
              className='self-start w-full'
            />
          )}

          {/* Add Lead / Add Note modal */}
          <AddLeadModal
            open={addLeadOpen}
            onClose={handleCloseAddLead}
            prefillLead={addNoteTarget}
            pendingStatus={pendingCreateStatus}
            leads={leads}
            onCreateLead={handleCreateLead}
            onAddNote={handleAddNote}
          />

          {/* Detail modal */}
          <LeadDetailModal
            lead={detailLead}
            onClose={handleCloseDetail}
            onAddNote={handleOpenAddNote}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onOpenChat={handleOpenChat}
            onViewCalendar={handleViewCalendar}
          />
        </>
      )}
    </div>
  );
}
