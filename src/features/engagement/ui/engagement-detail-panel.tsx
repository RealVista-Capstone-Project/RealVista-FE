'use client';

/**
 * TODO: Tech Debt - Inconsistent content fields from backend
 * - commissionRate (number) vs proposedCommission (string) vs offeredCommission (string)
 * - specialty sometimes returns UUID instead of display name
 * - priceRange field not rendered in UI
 * - Missing: serviceArea, agentRating, agentPropertiesSold, agentBio
 * See: ENGAGEMENT_TECH_DEBT.md
 */

import { Engagement, EngagementStatus, EngagementType } from '@/entities/engagement/model/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
import {
  AlertCircle,
  X,
  MapPin,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Building2,
  User,
  FileText,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { formatCurrency, formatDate } from '@/features/tenant-application/lib/utils';
import { useTranslations } from 'next-intl';

interface EngagementDetailPanelProps {
  engagement: Engagement;
  onClose: () => void;
  onCancel: (id: string) => void;
  currentUserId?: string;
}

interface ContentFields {
  title?: string;
  message?: string;
  commissionRate?: number;
  experienceYears?: number;
  pitchContent?: string;
  specialty?: string;
  priceRange?: {
    rent?: { min?: number; max?: number };
    sale?: { min?: number; max?: number };
  };
  offeredCommission?: string;
  monthlyIncome?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  note?: string;
  [key: string]: unknown;
}

const statusStyle: Record<EngagementStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  [EngagementStatus.SUBMITTED]: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: <Clock className='h-3.5 w-3.5' />,
  },
  [EngagementStatus.ACCEPTED]: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: <CheckCircle2 className='h-3.5 w-3.5' />,
  },
  [EngagementStatus.REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-500',
    icon: <XCircle className='h-3.5 w-3.5' />,
  },
  [EngagementStatus.CANCELLED]: {
    bg: 'bg-muted text-muted-foreground',
    text: 'text-muted-foreground',
    icon: <XCircle className='h-3.5 w-3.5' />,
  },
  [EngagementStatus.FINISHED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: <Trophy className='h-3.5 w-3.5' />,
  },
};

export const EngagementDetailPanel = ({
  engagement,
  onClose,
  onCancel,
  currentUserId,
}: EngagementDetailPanelProps) => {
  const t = useTranslations('Engagement');
  const s = statusStyle[engagement.status];
  const canCancel = engagement.status === EngagementStatus.SUBMITTED;
  const engagementType = engagement.engagementType as EngagementType;

  const isCurrentUserInitiator = currentUserId && engagement.initiatorId === currentUserId;

  const getCounterpartyInfo = () => {
    if (engagementType === EngagementType.AGENT_PROPOSAL) {
      if (isCurrentUserInitiator) {
        return {
          name: engagement.receiverName || engagement.agentFullName || '',
          role: t('table.roleAgent'),
        };
      } else {
        return { name: engagement.initiatorName || '', role: t('table.roleOwner') };
      }
    }
    if (engagementType === EngagementType.OWNER_INVITATION) {
      if (isCurrentUserInitiator) {
        return {
          name: engagement.receiverName || engagement.agentFullName || '',
          role: t('table.roleAgent'),
        };
      } else {
        return { name: engagement.initiatorName || '', role: t('table.roleOwner') };
      }
    }
    return { name: '', role: '' };
  };

  const counterparty = getCounterpartyInfo();

  const getTypeLabel = (type: EngagementType): string => {
    switch (type) {
      case EngagementType.AGENT_PROPOSAL:
        return t('detail.typeAgentProposal');
      case EngagementType.OWNER_INVITATION:
        return t('detail.typeOwnerInvitation');
      case EngagementType.TENANT_APPLICATION:
        return t('detail.typeTenantApplication');
      default:
        return type;
    }
  };

  const getPanelTitle = (type: EngagementType): string => {
    switch (type) {
      case EngagementType.AGENT_PROPOSAL:
        return t('detail.panelTitleProposal');
      case EngagementType.OWNER_INVITATION:
        return t('detail.panelTitleInvitation');
      case EngagementType.TENANT_APPLICATION:
        return t('detail.panelTitleApplication');
      default:
        return t('detail.panelTitle');
    }
  };

  const getAcceptedMessage = (type: EngagementType): string => {
    switch (type) {
      case EngagementType.AGENT_PROPOSAL:
        return t('detail.acceptedMessageProposal');
      case EngagementType.OWNER_INVITATION:
        return t('detail.acceptedMessageInvitation');
      case EngagementType.TENANT_APPLICATION:
        return t('detail.acceptedMessageApplication');
      default:
        return t('detail.acceptedMessageProposal');
    }
  };

  const statusLabel: Record<EngagementStatus, string> = {
    [EngagementStatus.SUBMITTED]: t('detail.statusSubmitted'),
    [EngagementStatus.ACCEPTED]: t('detail.statusAccepted'),
    [EngagementStatus.REJECTED]: t('detail.statusRejected'),
    [EngagementStatus.CANCELLED]: t('detail.statusCancelled'),
    [EngagementStatus.FINISHED]: t('detail.statusFinished'),
  };

  let content: ContentFields | null = null;
  if (engagement.content) {
    content = engagement.content as unknown as ContentFields;
  }

  return (
    <div className='w-full lg:w-[360px] flex-shrink-0 bg-background rounded-xl shadow-sm border border-border flex flex-col max-h-[calc(100vh-120px)] sticky top-4 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <span className='font-bold text-sm text-foreground'>{getPanelTitle(engagementType)}</span>
        <div className='flex items-center gap-2'>
          {canCancel && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size='sm'
                  className='h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground'
                >
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
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline'>{t('cancel.no')}</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant='destructive' onClick={() => onCancel(engagement.engagementId)}>
                      {t('cancel.confirm')}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground'
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        {/* Avatar + listing identity */}
        <div className='flex flex-col items-center pt-7 pb-5 px-5 border-b border-border'>
          <div className='relative w-20 h-20 rounded-full overflow-hidden bg-muted border-4 border-background shadow mb-3 ring-1 ring-border'>
            {engagement.propertyImageUrl ? (
              <Image
                src={engagement.propertyImageUrl}
                alt={engagement.listingTitle || t('detail.noTitle')}
                fill
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                <Home className='h-8 w-8' />
              </div>
            )}
          </div>
          <h2 className='text-base font-bold text-foreground text-center'>
            {engagement.listingTitle || t('detail.noTitle')}
          </h2>
          {engagement.propertyAddress && (
            <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1'>
              <MapPin className='h-3 w-3 flex-shrink-0' />
              <span className='text-center'>{engagement.propertyAddress}</span>
            </div>
          )}
        </div>

        {/* Status pill */}
        <div className='px-5 py-3 border-b border-border flex items-center justify-between'>
          <span className='text-xs text-muted-foreground font-medium'>
            {t('detail.statusLabel')}
          </span>
          <Badge
            variant='secondary'
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2.5 py-1',
              s.bg,
              s.text
            )}
          >
            {s.icon}
            {statusLabel[engagement.status]}
          </Badge>
        </div>

        {/* Key info rows */}
        <div className='px-5 py-4 border-b border-border space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detail.submittedDate')}</span>
            <span className='font-medium text-foreground'>
              {formatDate(engagement.createdAt, 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detail.updatedDate')}</span>
            <span className='font-medium text-foreground'>
              {formatDate(engagement.updatedAt, 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detail.requestType')}</span>
            <span className='font-medium text-foreground text-xs uppercase tracking-wide'>
              {getTypeLabel(engagementType)}
            </span>
          </div>
          {engagementType === EngagementType.TENANT_APPLICATION && content?.title && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('detail.applicationTitle')}</span>
              <span className='font-medium text-foreground text-right max-w-[180px] leading-tight'>
                {content.title}
              </span>
            </div>
          )}
        </div>

        {/* AGENT_PROPOSAL fields */}
        {engagementType === EngagementType.AGENT_PROPOSAL && content && (
          <div className='px-5 py-4 border-b border-border space-y-4'>
            {/* TODO: Handle both commissionRate (number) and proposedCommission (string) - backend inconsistency */}
            {content.commissionRate !== undefined && content.commissionRate > 0 && (
              <div className='flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20'>
                <div className='p-2 rounded-full bg-primary/10'>
                  <FileText className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <div className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                    {t('detail.commissionRate')}
                  </div>
                  <div className='text-sm font-bold text-foreground'>{content.commissionRate}%</div>
                </div>
              </div>
            )}
            {content.experienceYears !== undefined && content.experienceYears > 0 && (
              <div className='flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20'>
                <div className='p-2 rounded-full bg-primary/10'>
                  <Star className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <div className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                    {t('detail.experience')}
                  </div>
                  <div className='text-sm font-bold text-foreground'>
                    {content.experienceYears} {t('detail.years')}
                  </div>
                </div>
              </div>
            )}
            {content.specialty && (
              <div className='flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20'>
                <div className='p-2 rounded-full bg-primary/10'>
                  <Building2 className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <div className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                    {t('detail.specialty')}
                  </div>
                  <div className='text-sm font-bold text-foreground'>{content.specialty}</div>
                </div>
              </div>
            )}
            {content.pitchContent && (
              <div className='mt-2'>
                <div className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
                  {t('detail.pitchContent')}
                </div>
                <div className='bg-muted/40 rounded-lg p-3 border border-border'>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    &ldquo;{content.pitchContent}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OWNER_INVITATION fields */}
        {engagementType === EngagementType.OWNER_INVITATION && content && (
          <div className='px-5 py-4 border-b border-border space-y-4'>
            {content.offeredCommission && (
              <div className='flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20'>
                <div className='p-2 rounded-full bg-primary/10'>
                  <FileText className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <div className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                    {t('detail.offeredCommission')}
                  </div>
                  <div className='text-sm font-bold text-foreground'>
                    {content.offeredCommission}
                  </div>
                </div>
              </div>
            )}
            {content.message && (
              <div className='mt-2'>
                <div className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
                  {t('detail.ownerMessage')}
                </div>
                <div className='bg-muted/40 rounded-lg p-3 border border-border'>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    &ldquo;{content.message}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TENANT_APPLICATION financial grid */}
        {engagementType === EngagementType.TENANT_APPLICATION && content && (
          <div className='px-5 py-4 border-b border-border'>
            <div className='grid grid-cols-2 gap-x-4 gap-y-4'>
              <div>
                <div className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>
                  {t('detail.income')}
                </div>
                <div className='text-sm font-bold text-foreground'>
                  {content.monthlyIncome
                    ? formatCurrency(content.monthlyIncome) + t('detail.incomePerMonth')
                    : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>
                  {t('detail.leaseTerm')}
                </div>
                <div className='text-sm font-bold text-foreground'>
                  {content.leaseTermMonths
                    ? t('detail.leaseTermMonths', { months: content.leaseTermMonths })
                    : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>
                  {t('detail.moveInDate')}
                </div>
                <div className='text-sm font-bold text-foreground'>
                  {content.moveInDate ? formatDate(content.moveInDate, 'dd MMM, yyyy') : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>
                  {t('detail.tenants')}
                </div>
                <div className='text-sm font-bold text-foreground'>—</div>
              </div>
            </div>
            {content.note && (
              <div className='mt-4'>
                <div className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
                  {t('detail.tenantNote')}
                </div>
                <div className='bg-muted/40 rounded-lg p-3 border border-border'>
                  <p className='text-sm italic text-muted-foreground leading-relaxed'>
                    &ldquo;{content.note}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Counterparty info for AGENT_PROPOSAL and OWNER_INVITATION */}
        {(engagementType === EngagementType.AGENT_PROPOSAL ||
          engagementType === EngagementType.OWNER_INVITATION) &&
          counterparty.name && (
            <div className='px-5 py-4 border-b border-border'>
              <div className='flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border'>
                <div className='relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0'>
                  {engagementType === EngagementType.AGENT_PROPOSAL ? (
                    engagement.agentAvatarUrl ? (
                      <Image
                        src={engagement.agentAvatarUrl}
                        alt={counterparty.name}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                        <User className='h-5 w-5' />
                      </div>
                    )
                  ) : engagement.receiverAvatarUrl ? (
                    <Image
                      src={engagement.receiverAvatarUrl}
                      alt={counterparty.name}
                      fill
                      className='object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                      <User className='h-5 w-5' />
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                    {counterparty.role}
                  </div>
                  <div className='text-sm font-semibold text-foreground truncate'>
                    {counterparty.name}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Status message */}
        {engagement.status === EngagementStatus.ACCEPTED && (
          <div className='mx-5 mb-4 bg-green-50 border border-green-100 rounded-xl p-3.5'>
            <p className='text-xs text-green-700 font-medium flex items-center gap-1.5'>
              <CheckCircle2 className='h-4 w-4 flex-shrink-0' />
              {getAcceptedMessage(engagementType)}
            </p>
          </div>
        )}
        {engagement.status === EngagementStatus.REJECTED && (
          <div className='mx-5 mb-4 bg-red-50 border border-red-100 rounded-xl p-3.5'>
            <p className='text-xs text-red-600 font-medium flex items-center gap-1.5'>
              <XCircle className='h-4 w-4 flex-shrink-0' />
              {t('detail.rejectedMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
