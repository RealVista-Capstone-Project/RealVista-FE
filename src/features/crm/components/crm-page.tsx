'use client';

import * as React from 'react';
import {
  Users,
  LayoutGrid,
  List,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  StickyNote,
  Building2,
  Search,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
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
} from '@/shared/ui/kanban';
import { MOCK_LEADS } from '../data/mock-leads';
import {
  Lead,
  LeadNote,
  LeadStatus,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from '../types/lead';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
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
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

const SOURCE_LABELS: Record<Lead['source'], string> = {
  chat: 'Chat',
  tour: 'Đặt lịch xem',
  call: 'Cuộc gọi',
  manual: 'Thêm thủ công',
};

const ALL_STATUSES = Object.values(LeadStatus);

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const c = LEAD_STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium border',
        c.bg,
        c.text,
        c.border
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Lead Card (Kanban) ───────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onAddNote: (lead: Lead) => void;
  onViewDetail: (lead: Lead) => void;
}

function LeadCard({ lead, onAddNote, onViewDetail }: LeadCardProps) {
  return (
    <Card
      className='border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group'
      onClick={() => onViewDetail(lead)}
    >
      <CardContent className='p-4 flex flex-col gap-3'>
        {/* Header row */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <Avatar className='size-8 shrink-0'>
              <AvatarImage src={lead.avatarUrl} alt={lead.customerName} />
              <AvatarFallback className='text-xs bg-primary/10 text-primary font-semibold'>
                {getInitials(lead.customerName)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='text-sm font-semibold truncate'>{lead.customerName}</p>
              {lead.phone && (
                <p className='text-xs text-muted-foreground truncate'>{lead.phone}</p>
              )}
            </div>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        {/* Property interest */}
        {lead.propertyInterest && (
          <div className='flex items-center gap-1.5'>
            <Building2 className='size-3.5 shrink-0 text-muted-foreground/60' />
            <p className='text-xs text-muted-foreground truncate'>{lead.propertyInterest}</p>
          </div>
        )}

        {/* Last note preview */}
        {lead.lastNote && (
          <div className='rounded-md bg-muted/60 px-3 py-2'>
            <p className='text-xs text-muted-foreground line-clamp-2 italic'>&quot;{lead.lastNote}&quot;</p>
          </div>
        )}

        <Separator className='opacity-50' />

        {/* Footer */}
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] text-muted-foreground/60'>
            {formatRelative(lead.updatedAt)}
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
                      className='size-7 text-muted-foreground hover:text-primary'
                      onClick={() => window.open(`tel:${lead.phone}`)}
                    >
                      <Phone className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gọi điện</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-muted-foreground hover:text-primary'
                  >
                    <MessageCircle className='size-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-muted-foreground hover:text-primary'
                  >
                    <Calendar className='size-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Đặt lịch xem</TooltipContent>
              </Tooltip>
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
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Kanban Column Header ─────────────────────────────────────────────────────

interface KanbanColHeaderProps {
  status: LeadStatus;
  count: number;
}

function KanbanColHeader({ status, count }: KanbanColHeaderProps) {
  const c = LEAD_STATUS_COLORS[status];
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2.5 mb-3 border',
        c.bg,
        c.border
      )}
    >
      <div className='flex items-center gap-2'>
        <KanbanColumnHandle className='opacity-100'>
          <GripVertical className='size-3.5 text-muted-foreground/50' />
        </KanbanColumnHandle>
        <span className={cn('h-2 w-2 rounded-full', c.dot)} />
        <span className={cn('text-sm font-semibold', c.text)}>
          {LEAD_STATUS_LABELS[status]}
        </span>
      </div>
      <Badge variant='secondary' className={cn('text-xs font-bold', c.text, c.bg, 'border', c.border)}>
        {count}
      </Badge>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

interface TableRowProps {
  lead: Lead;
  onAddNote: (lead: Lead) => void;
  onViewDetail: (lead: Lead) => void;
}

function LeadTableRow({ lead, onAddNote, onViewDetail }: TableRowProps) {
  return (
    <tr
      className='border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer group'
      onClick={() => onViewDetail(lead)}
    >
      <td className='px-4 py-3'>
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
      </td>
      <td className='px-4 py-3'>
        <span className='text-sm text-muted-foreground'>{lead.phone ?? '—'}</span>
      </td>
      <td className='px-4 py-3'>
        <span className='text-sm text-muted-foreground truncate max-w-[200px] block'>
          {lead.propertyInterest ?? '—'}
        </span>
      </td>
      <td className='px-4 py-3'>
        <StatusBadge status={lead.status} />
      </td>
      <td className='px-4 py-3'>
        <Badge variant='outline' className='text-xs font-normal'>
          {SOURCE_LABELS[lead.source]}
        </Badge>
      </td>
      <td className='px-4 py-3'>
        <span className='text-xs text-muted-foreground'>{formatDate(lead.updatedAt)}</span>
      </td>
      <td className='px-4 py-3'>
        <div
          className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={(e) => e.stopPropagation()}
        >
          <TooltipProvider delayDuration={300}>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground hover:text-primary'
                >
                  <MessageCircle className='size-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
}

// ─── Add Lead / Add Note Modal ────────────────────────────────────────────────

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  prefillLead?: Lead | null;
  leads: Lead[];
  onSave: (updatedLeads: Lead[]) => void;
}

function AddLeadModal({ open, onClose, prefillLead, leads, onSave }: AddLeadModalProps) {
  const isNote = !!prefillLead;

  const [customerName, setCustomerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [propertyInterest, setPropertyInterest] = React.useState('');
  const [status, setStatus] = React.useState<LeadStatus>(LeadStatus.NEW);
  const [note, setNote] = React.useState('');
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>('');

  React.useEffect(() => {
    if (open) {
      if (prefillLead) {
        setSelectedLeadId(prefillLead.id);
        setStatus(prefillLead.status);
        setNote('');
      } else {
        setCustomerName('');
        setPhone('');
        setEmail('');
        setPropertyInterest('');
        setStatus(LeadStatus.NEW);
        setNote('');
        setSelectedLeadId('');
      }
    }
  }, [open, prefillLead]);

  function handleSave() {
    if (isNote) {
      const newNote: LeadNote = {
        id: `note-${Date.now()}`,
        content: note,
        createdAt: new Date().toISOString(),
        status,
      };
      const updated = leads.map((l) => {
        if (l.id !== selectedLeadId) return l;
        return {
          ...l,
          status,
          lastNote: note || l.lastNote,
          notes: [...l.notes, newNote],
          updatedAt: new Date().toISOString(),
        };
      });
      onSave(updated);
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        customerName,
        phone: phone || undefined,
        email: email || undefined,
        propertyInterest: propertyInterest || undefined,
        status,
        lastNote: note || undefined,
        notes: note
          ? [{ id: `note-${Date.now()}`, content: note, createdAt: new Date().toISOString(), status }]
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual',
      };
      onSave([...leads, newLead]);
    }
    onClose();
  }

  const canSave = isNote ? !!selectedLeadId && !!note.trim() : !!customerName.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <StickyNote className='size-4 text-primary' />
            {isNote ? 'Thêm ghi chú lead' : 'Thêm khách hàng mới'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          {!isNote ? (
            <>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='crm-name'>Tên khách hàng *</Label>
                <Input
                  id='crm-name'
                  placeholder='Nguyễn Văn A'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='crm-phone'>Số điện thoại</Label>
                  <Input
                    id='crm-phone'
                    placeholder='0901 234 567'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='crm-email'>Email</Label>
                  <Input
                    id='crm-email'
                    type='email'
                    placeholder='email@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='crm-property'>Bất động sản quan tâm</Label>
                <Input
                  id='crm-property'
                  placeholder='Căn hộ Vinhomes Q9...'
                  value={propertyInterest}
                  onChange={(e) => setPropertyInterest(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className='flex flex-col gap-1.5'>
              <Label>Khách hàng *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn khách hàng' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.customerName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <Label>Trạng thái lead *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='crm-note'>Ghi chú {isNote ? '*' : ''}</Label>
            <Textarea
              id='crm-note'
              placeholder={
                isNote ? 'Khách kêu T3 đi xem, hẹn 9h sáng...' : 'Ghi chú ban đầu...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className='resize-none'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isNote ? 'Lưu ghi chú' : 'Thêm khách hàng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Detail Modal ────────────────────────────────────────────────────────

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onAddNote: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

function LeadDetailModal({ lead, onClose, onAddNote, onStatusChange }: LeadDetailModalProps) {
  if (!lead) return null;
  return (
    <Dialog open={!!lead} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <Avatar className='size-10'>
              <AvatarImage src={lead.avatarUrl} alt={lead.customerName} />
              <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                {getInitials(lead.customerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{lead.customerName}</DialogTitle>
              {lead.phone && (
                <p className='text-sm text-muted-foreground'>{lead.phone}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {/* Quick info */}
          <div className='grid grid-cols-2 gap-3 text-sm'>
            {lead.email && (
              <div>
                <p className='text-xs text-muted-foreground mb-0.5'>Email</p>
                <p className='font-medium truncate'>{lead.email}</p>
              </div>
            )}
            {lead.propertyInterest && (
              <div>
                <p className='text-xs text-muted-foreground mb-0.5'>BĐS quan tâm</p>
                <p className='font-medium truncate'>{lead.propertyInterest}</p>
              </div>
            )}
            <div>
              <p className='text-xs text-muted-foreground mb-0.5'>Nguồn</p>
              <p className='font-medium'>{SOURCE_LABELS[lead.source]}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground mb-0.5'>Ngày thêm</p>
              <p className='font-medium'>{formatDate(lead.createdAt)}</p>
            </div>
          </div>

          {/* Status select */}
          <div className='flex flex-col gap-1.5'>
            <p className='text-xs text-muted-foreground'>Trạng thái</p>
            <Select
              value={lead.status}
              onValueChange={(v) => onStatusChange(lead.id, v as LeadStatus)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className='flex gap-2'>
            {lead.phone && (
              <Button variant='outline' size='sm' className='flex-1 gap-1.5' onClick={() => window.open(`tel:${lead.phone}`)}>
                <Phone className='size-3.5' />
                Gọi điện
              </Button>
            )}
            <Button variant='outline' size='sm' className='flex-1 gap-1.5'>
              <MessageCircle className='size-3.5' />
              Chat
            </Button>
            <Button variant='outline' size='sm' className='flex-1 gap-1.5'>
              <Calendar className='size-3.5' />
              Đặt lịch
            </Button>
            <Button
              size='sm'
              className='flex-1 gap-1.5'
              onClick={() => { onClose(); onAddNote(lead); }}
            >
              <StickyNote className='size-3.5' />
              Ghi chú
            </Button>
          </div>

          <Separator />

          {/* Notes timeline */}
          <div>
            <p className='text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide'>
              Lịch sử ghi chú ({lead.notes.length})
            </p>
            <div className='max-h-[220px] overflow-y-auto flex flex-col gap-3 pr-1'>
              {lead.notes.length === 0 ? (
                <p className='text-xs text-muted-foreground text-center py-4'>Chưa có ghi chú nào</p>
              ) : (
                [...lead.notes].reverse().map((n) => (
                  <div key={n.id} className='rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5'>
                    <div className='flex items-center justify-between gap-2 mb-1'>
                      <StatusBadge status={n.status} />
                      <span className='text-[10px] text-muted-foreground'>{formatDate(n.createdAt)}</span>
                    </div>
                    <p className='text-sm'>{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'table';
type TabValue = 'all' | LeadStatus;

const STATUS_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  ...ALL_STATUSES.map((s) => ({ value: s as TabValue, label: LEAD_STATUS_LABELS[s] })),
];

export function CrmPage() {
  const [leads, setLeads] = React.useState<Lead[]>(MOCK_LEADS);
  const [view, setView] = React.useState<ViewMode>('kanban');
  const [tab, setTab] = React.useState<TabValue>('all');
  const [search, setSearch] = React.useState('');

  const [addLeadOpen, setAddLeadOpen] = React.useState(false);
  const [addNoteTarget, setAddNoteTarget] = React.useState<Lead | null>(null);
  const [detailLead, setDetailLead] = React.useState<Lead | null>(null);

  const filteredLeads = React.useMemo(() => {
    let result = leads;
    if (tab !== 'all') result = result.filter((l) => l.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.propertyInterest?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, tab, search]);

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

  function handleColumnChange(newCols: Record<string, Lead[]>) {
    setColumns(newCols);
    // Persist reordering back to leads state
    const updatedLeads: Lead[] = [];
    for (const [status, colLeads] of Object.entries(newCols)) {
      for (const lead of colLeads) {
        updatedLeads.push({ ...lead, status: status as LeadStatus });
      }
    }
    // Keep leads that are not in current view (filtered-out leads) untouched
    const visibleIds = new Set(updatedLeads.map((l) => l.id));
    const unchanged = leads.filter((l) => !visibleIds.has(l.id));
    setLeads([...unchanged, ...updatedLeads]);
  }

  function handleSaveLeads(updated: Lead[]) {
    setLeads(updated);
    if (detailLead) {
      const found = updated.find((l) => l.id === detailLead.id);
      if (found) setDetailLead(found);
    }
  }

  function handleOpenAddNote(lead: Lead) {
    setAddNoteTarget(lead);
    setAddLeadOpen(false);
  }

  function handleStatusChange(leadId: string, status: LeadStatus) {
    handleSaveLeads(
      leads.map((l) => (l.id === leadId ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );
  }

  const totalLeads = leads.length;
  const closedLeads = leads.filter((l) => l.status === LeadStatus.CLOSED).length;
  const activeLeads = leads.filter(
    (l) => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.NOT_POTENTIAL
  ).length;

  return (
    <div className='flex flex-col h-full p-6 gap-5'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold flex items-center gap-2'>
            <Users className='size-5 text-primary' />
            CRM – Quản lý khách hàng
          </h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Theo dõi pipeline từ lead đến chốt deal
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {/* View toggle */}
          <div className='flex items-center rounded-lg border border-border bg-background p-1 gap-1'>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className={cn('size-7', view === 'kanban' && 'bg-primary/10 text-primary')}
                    onClick={() => setView('kanban')}
                  >
                    <LayoutGrid className='size-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kanban</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className={cn('size-7', view === 'table' && 'bg-primary/10 text-primary')}
                    onClick={() => setView('table')}
                  >
                    <List className='size-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bảng</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
            className='gap-1.5'
            onClick={() => { setAddNoteTarget(null); setAddLeadOpen(true); }}
          >
            <Plus className='size-4' data-icon='inline-start' />
            Thêm lead
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className='grid grid-cols-3 gap-4'>
        {[
          { label: 'Tổng khách hàng', value: totalLeads, colorClass: 'text-primary', bgClass: 'bg-primary/5 border-primary/15' },
          { label: 'Đang hoạt động', value: activeLeads, colorClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-100' },
          { label: 'Đã chốt deal', value: closedLeads, colorClass: 'text-green-700', bgClass: 'bg-green-50 border-green-100' },
        ].map((stat) => (
          <Card key={stat.label} className={cn('shadow-sm border', stat.bgClass)}>
            <CardContent className='p-4'>
              <p className='text-xs text-muted-foreground mb-1'>{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.colorClass)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-[200px] max-w-[320px]'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50' />
          <Input
            placeholder='Tìm theo tên, SĐT, BĐS...'
            className='pl-9'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className='overflow-x-auto'>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList className='h-9 gap-1 p-1'>
              {STATUS_TABS.map((t) => {
                const count =
                  t.value === 'all'
                    ? leads.length
                    : leads.filter((l) => l.status === t.value).length;
                return (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className='text-xs px-3 h-7 whitespace-nowrap'
                  >
                    {t.label}
                    {count > 0 && (
                      <Badge variant='secondary' className='ml-1.5 px-1.5 py-0 text-[10px] font-bold h-4 min-w-4'>
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <Kanban
          value={columns}
          onValueChange={handleColumnChange}
          getItemValue={(item: Lead) => item.id}
          className='flex-1'
        >
          <KanbanBoard className='flex gap-4 overflow-x-auto pb-4 !grid-cols-none auto-rows-auto items-start'>
            {Object.entries(columns).map(([statusKey, colLeads]) => (
              <KanbanColumn
                key={statusKey}
                value={statusKey}
                className='min-w-[270px] max-w-[290px] flex-shrink-0'
              >
                <KanbanColHeader status={statusKey as LeadStatus} count={colLeads.length} />
                <KanbanColumnContent
                  value={statusKey}
                  className='flex flex-col gap-3 overflow-y-auto'
                  style={{ maxHeight: 'calc(100vh - 340px)' } as React.CSSProperties}
                >
                  {colLeads.length === 0 ? (
                    <div className='rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-center'>
                      <p className='text-xs text-muted-foreground/50'>Không có khách hàng</p>
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <KanbanItem key={lead.id} value={lead.id}>
                        <KanbanItemHandle>
                          <LeadCard
                            lead={lead}
                            onAddNote={handleOpenAddNote}
                            onViewDetail={(l) => setDetailLead(l)}
                          />
                        </KanbanItemHandle>
                      </KanbanItem>
                    ))
                  )}
                </KanbanColumnContent>
              </KanbanColumn>
            ))}
          </KanbanBoard>
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
                    />
                  );
                }
              }
              return <div className='bg-muted size-full rounded-xl opacity-80' />;
            }}
          </KanbanOverlay>
        </Kanban>
      ) : (
        <Card className='border-border/60 shadow-sm flex-1 overflow-hidden'>
          <CardHeader className='p-0'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='border-b border-border/50 bg-muted/30'>
                    {['Khách hàng', 'Điện thoại', 'BĐS quan tâm', 'Trạng thái', 'Nguồn', 'Cập nhật', ''].map((h) => (
                      <th
                        key={h}
                        className='px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap'
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='px-4 py-12 text-center text-sm text-muted-foreground'>
                        Không tìm thấy khách hàng nào
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        onAddNote={handleOpenAddNote}
                        onViewDetail={(l) => setDetailLead(l)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Add Lead / Add Note modal */}
      <AddLeadModal
        open={addLeadOpen || !!addNoteTarget}
        onClose={() => { setAddLeadOpen(false); setAddNoteTarget(null); }}
        prefillLead={addNoteTarget}
        leads={leads}
        onSave={handleSaveLeads}
      />

      {/* Detail modal */}
      <LeadDetailModal
        lead={detailLead}
        onClose={() => setDetailLead(null)}
        onAddNote={handleOpenAddNote}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
