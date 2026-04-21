'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { format, parseISO, type Locale } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';

import { Engagement, EngagementStatus, EngagementType } from '@/entities/engagement/model/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { AvatarWithInitials } from './avatar-with-initials';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(url?: string | null): url is string {
  if (!url || url.trim() === '') return false;
  try { new URL(url); return true; } catch { return false; }
}

function resolvePropertyImage(item: Engagement): string | undefined {
  const firstMedia = item.propertyMediaUrls?.find(isValidUrl);
  if (firstMedia) return firstMedia;
  if (isValidUrl(item.propertyImageUrl)) return item.propertyImageUrl;
  return undefined;
}

function fmtShortDate(dateStr: string | undefined, locale: Locale): string {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale }); } catch { return '—'; }
}

const statusIcon: Record<EngagementStatus, React.ReactNode> = {
  [EngagementStatus.SUBMITTED]: <Clock className='h-3.5 w-3.5' />,
  [EngagementStatus.ACCEPTED]: <CheckCircle2 className='h-3.5 w-3.5' />,
  [EngagementStatus.REJECTED]: <XCircle className='h-3.5 w-3.5' />,
  [EngagementStatus.CANCELLED]: <XCircle className='h-3.5 w-3.5' />,
  [EngagementStatus.FINISHED]: <Trophy className='h-3.5 w-3.5' />,
};

const statusStyle: Record<EngagementStatus, string> = {
  [EngagementStatus.SUBMITTED]: 'bg-blue-50 text-blue-600 border-blue-100',
  [EngagementStatus.ACCEPTED]: 'bg-green-50 text-green-600 border-green-100',
  [EngagementStatus.REJECTED]: 'bg-red-50 text-red-500 border-red-100',
  [EngagementStatus.CANCELLED]: 'bg-muted text-muted-foreground border-border',
  [EngagementStatus.FINISHED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  engId,
  onCancel,
  t,
  status,
}: {
  engId: string;
  onCancel: (id: string, reason?: string) => void;
  t: ReturnType<typeof useTranslations<'Engagement'>>;
  status: EngagementStatus;
}) {
  const [reason, setReason] = useState('');
  const needsReason = status === EngagementStatus.ACCEPTED;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='h-8 rounded-lg border-border text-foreground hover:bg-muted px-3 text-xs'>
          {t('cancel.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <AlertCircle className='h-5 w-5' />
            {t('cancel.dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('cancel.dialogDescription')}</DialogDescription>
        </DialogHeader>
        {needsReason && (
          <textarea
            className='w-full rounded-md border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
            rows={3}
            placeholder={t('cancel.reasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>{t('cancel.no')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant='destructive'
              disabled={needsReason && !reason.trim()}
              onClick={(e) => { e.stopPropagation(); onCancel(engId, reason.trim() || undefined); }}
            >
              {t('cancel.confirm')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Actions cell ─────────────────────────────────────────────────────────────

function EngagementActionsCell({
  eng,
  currentUserId,
  onCancel,
  onFinish,
  onAccept,
  onReject,
}: {
  eng: Engagement;
  currentUserId?: string;
  onCancel: (id: string, reason?: string) => void;
  onFinish: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const t = useTranslations('Engagement');
  const isSender = eng.initiatorId === currentUserId;
  const isReceiver = eng.receiverId === currentUserId;
  const st = eng.status;

  const canCancelSubmitted = st === EngagementStatus.SUBMITTED && isSender;
  const canAcceptReject = st === EngagementStatus.SUBMITTED && isReceiver;
  const canCancelAccepted = st === EngagementStatus.ACCEPTED;
  const canFinish = st === EngagementStatus.ACCEPTED;

  if (!canCancelSubmitted && !canAcceptReject && !canCancelAccepted && !canFinish) return null;

  return (
    <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
      {canCancelSubmitted && (
        <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} status={st} />
      )}
      {canAcceptReject && (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button size='sm' className='h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 text-xs'>
                {t('accept.button')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-green-700'>
                  <CheckCircle2 className='h-5 w-5' />
                  {t('accept.dialogTitle')}
                </DialogTitle>
                <DialogDescription>{t('accept.dialogDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild><Button variant='outline'>{t('accept.no')}</Button></DialogClose>
                <DialogClose asChild>
                  <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => onAccept(eng.engagementId)}>
                    {t('accept.confirm')}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size='sm' variant='outline' className='h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50 px-3 text-xs'>
                {t('reject.button')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-destructive'>
                  <AlertCircle className='h-5 w-5' />
                  {t('reject.dialogTitle')}
                </DialogTitle>
                <DialogDescription>{t('reject.dialogDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild><Button variant='outline'>{t('reject.no')}</Button></DialogClose>
                <DialogClose asChild>
                  <Button variant='destructive' onClick={() => onReject(eng.engagementId)}>
                    {t('reject.confirm')}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      {canCancelAccepted && (
        <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} status={st} />
      )}
      {canFinish && (
        <Button size='sm' className='h-8 rounded-lg bg-primary hover:bg-primary/90 text-white px-3 text-xs' onClick={() => onFinish(eng.engagementId)}>
          {t('outlook.finish')}
        </Button>
      )}
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

export interface EngagementColumnsOptions {
  currentUserId?: string;
  onCancel: (id: string, reason?: string) => void;
  onFinish: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function useEngagementColumns(opts: EngagementColumnsOptions): ColumnDef<Engagement, unknown>[] {
  const t = useTranslations('Engagement');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : enUS;

  return useMemo<ColumnDef<Engagement, unknown>[]>(
    () => [
      {
        id: 'property',
        header: () => t('table.propertyColumn'),
        cell: ({ row }) => {
          const item = row.original;
          const imgUrl = resolvePropertyImage(item);
          return (
            <div className='flex items-center gap-3 min-w-[200px]'>
              <div className='relative h-12 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0'>
                {imgUrl ? (
                  <img src={imgUrl} alt='' className='absolute inset-0 w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-muted-foreground/30'>
                    <Home className='h-4 w-4' />
                  </div>
                )}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-foreground'>
                  {item.content?.title ?? item.listingTitle ?? '—'}
                </p>
                {item.propertyAddress && (
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
                    <MapPin className='h-3 w-3 flex-shrink-0' />
                    <span className='truncate'>{item.propertyAddress}</span>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'counterparty',
        header: () => t('table.counterpartyColumn'),
        cell: ({ row }) => {
          const item = row.original;
          const isSender = item.initiatorId === opts.currentUserId;
          const otherName = isSender
            ? item.receiverName ?? item.agentFullName ?? '—'
            : item.initiatorName ?? item.agentFullName ?? '—';

          // Determine the counterparty's role:
          // AGENT_PROPOSAL: agent sent → counterparty of receiver is "Môi giới"; counterparty of initiator is "Chủ nhà"
          // OWNER_INVITATION: owner sent to agent → counterparty of sender is "Môi giới"; counterparty of receiver (agent) is "Chủ nhà"
          // TENANT_APPLICATION: tenant sent → counterparty is always "Chủ nhà"
          let roleLabel: string;
          if (item.engagementType === EngagementType.AGENT_PROPOSAL) {
            roleLabel = isSender ? t('table.roleOwner') : t('table.roleAgent');
          } else if (item.engagementType === EngagementType.OWNER_INVITATION) {
            roleLabel = isSender ? t('table.roleAgent') : t('table.roleOwner');
          } else {
            // TENANT_APPLICATION — counterparty is the owner
            roleLabel = t('table.roleOwner');
          }

          return (
            <div className='flex items-center gap-2.5 min-w-[140px]'>
              <AvatarWithInitials name={otherName} size={32} />
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-foreground'>{otherName}</p>
                <p className='text-xs text-muted-foreground'>{roleLabel}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'type',
        header: () => t('table.typeColumn'),
        cell: ({ row }) => {
          const item = row.original;
          const isProposal = item.engagementType === EngagementType.AGENT_PROPOSAL;
          return (
            <span className='text-xs font-medium text-muted-foreground'>
              {isProposal ? t('table.typeProposal') : t('table.typeInvitation')}
            </span>
          );
        },
      },
      {
        id: 'date',
        header: () => t('table.dateColumn'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground whitespace-nowrap'>
            {fmtShortDate(row.original.createdAt, dateLocale)}
          </span>
        ),
      },
      {
        id: 'status',
        header: () => t('table.statusColumn'),
        cell: ({ row }) => (
          <Badge
            variant='secondary'
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 border whitespace-nowrap w-fit',
              statusStyle[row.original.status]
            )}
          >
            {statusIcon[row.original.status]}
            {t(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => t('table.actionsColumn'),
        cell: ({ row }) => (
          <EngagementActionsCell
            eng={row.original}
            currentUserId={opts.currentUserId}
            onCancel={opts.onCancel}
            onFinish={opts.onFinish}
            onAccept={opts.onAccept}
            onReject={opts.onReject}
          />
        ),
      },
    ],
    [t, dateLocale, opts]
  );
}
