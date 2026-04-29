import * as React from 'react';
import { Calendar as CalendarIcon, MessageCircle, Phone, StickyNote } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Lead, LeadStatus, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from '../types/lead';

const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const PRIORITY_LABELS: Record<NonNullable<Lead['priority']>, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const SOURCE_LABELS: Record<Lead['source'], string> = {
  CHAT: 'Chat',
  TOUR: 'Đặt lịch xem',
  MANUAL: 'Thêm thủ công',
};

const ALL_STATUSES = Object.values(LeadStatus);

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

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onAddNote: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onPriorityChange: (lead: Lead, priority: NonNullable<Lead['priority']>) => void;
  onOpenChat: (lead: Lead) => void;
  onViewCalendar: (lead: Lead) => void;
}

export const LeadDetailModal = React.memo(function LeadDetailModal({
  lead,
  onClose,
  onAddNote,
  onStatusChange,
  onPriorityChange,
  onOpenChat,
  onViewCalendar,
}: LeadDetailModalProps) {
  if (!lead) return null;
  const canChat = !!lead.buyerId;
  const priority = lead.priority ?? 'MEDIUM';
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
              {lead.phone && <p className='text-sm text-muted-foreground'>{lead.phone}</p>}
            </div>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
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

          <div className='grid grid-cols-2 gap-3'>
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
            <div className='flex flex-col gap-1.5'>
              <p className='text-xs text-muted-foreground'>Mức ưu tiên</p>
              <Select
                value={priority}
                onValueChange={(v) => onPriorityChange(lead, v as NonNullable<Lead['priority']>)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LEAD_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex gap-2'>
            {lead.phone && (
              <Button
                variant='outline'
                size='sm'
                className='flex-1 gap-1.5'
                onClick={() => window.open(`tel:${lead.phone}`)}
              >
                <Phone className='size-3.5' />
                Gọi điện
              </Button>
            )}
            {canChat && (
              <Button
                variant='outline'
                size='sm'
                className='flex-1 gap-1.5'
                onClick={() => onOpenChat(lead)}
              >
                <MessageCircle className='size-3.5' />
                Chat
              </Button>
            )}
            {canChat && (
              <Button
                variant='outline'
                size='sm'
                className='flex-1 gap-1.5'
                onClick={() => onViewCalendar(lead)}
              >
                <CalendarIcon className='size-3.5' />
                Đặt lịch
              </Button>
            )}
            <Button
              size='sm'
              className='flex-1 gap-1.5'
              onClick={() => {
                onClose();
                onAddNote(lead);
              }}
            >
              <StickyNote className='size-3.5' />
              Ghi chú
            </Button>
          </div>

          <Separator />

          <div>
            <p className='text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide'>
              Lịch sử ghi chú ({lead.notes.length})
            </p>
            <div className='max-h-[220px] overflow-y-auto flex flex-col gap-3 pr-1'>
              {lead.notes.length === 0 ? (
                <p className='text-xs text-muted-foreground text-center py-4'>
                  Chưa có ghi chú nào
                </p>
              ) : (
                [...lead.notes].reverse().map((n, index) => {
                  const noteKey = n.id || `${lead.id}-note-${index}-${n.createdAt}`;

                  return (
                    <div
                      key={noteKey}
                      className='rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5'
                    >
                      <div className='flex items-center justify-between gap-2 mb-1'>
                        <StatusBadge status={n.status} />
                        <span className='text-[10px] text-muted-foreground'>
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className='text-sm'>{n.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
