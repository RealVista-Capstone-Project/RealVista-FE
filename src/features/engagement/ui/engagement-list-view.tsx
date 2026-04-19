'use client';

import React from 'react';

import { Engagement, EngagementStatus, EngagementType } from '@/entities/engagement/model/types';
import { AvatarWithInitials } from './avatar-with-initials';
import { EngagementSearchHeader, EngagementTab } from './engagement-search-header';
import { EngagementHeaderSection } from './engagement-header-section';
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Percent,
  Briefcase,
  XCircle,
  Home,
  Trophy,
  DollarSign,
  X,
} from 'lucide-react';
function isValidUrl(url?: string | null): url is string {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Pick the first valid image URL from propertyMediaUrls, fallback to propertyImageUrl */
function resolvePropertyImage(item: Engagement): string | undefined {
  const firstMedia = item.propertyMediaUrls?.find(isValidUrl);
  if (firstMedia) return firstMedia;
  if (isValidUrl(item.propertyImageUrl)) return item.propertyImageUrl;
  return undefined;
}
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { format, parseISO, type Locale } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

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
  [EngagementStatus.CANCELLED]: 'bg-gray-50 text-gray-400 border-gray-100',
  [EngagementStatus.FINISHED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

interface EngagementListViewProps {
  engagements: Engagement[];
  isLoading: boolean;
  isError: boolean;
  tab: EngagementTab;
  onTabChange: (tab: EngagementTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  selectedEngagement: Engagement | null;
  onSelect: (engagement: Engagement) => void;
  onCancel: (id: string, reason?: string) => void;
  onFinish: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  currentUserId?: string;
}

function fmtDate(dateStr: string | undefined, dateLocale: Locale): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: dateLocale });
  } catch {
    return '—';
  }
}

function fmtShortDate(dateStr: string | undefined, dateLocale: Locale): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: dateLocale });
  } catch {
    return '—';
  }
}

function fmtPrice(value?: number | null): string {
  if (value == null) return '—';
  return formatVND(value);
}

/* ------------------------------------------------------------------ */
/*  Inline action buttons for each card row                           */
/* ------------------------------------------------------------------ */
function CardActions({
  eng,
  currentUserId,
  onCancel,
  onFinish,
  onAccept,
  onReject,
  t,
}: {
  eng: Engagement;
  currentUserId?: string;
  onCancel: (id: string, reason?: string) => void;
  onFinish: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  t: ReturnType<typeof useTranslations<'Engagement'>>;
}) {
  const isSender = eng.initiatorId === currentUserId;
  const isReceiver = eng.receiverId === currentUserId;
  const st = eng.status;

  const canCancelSubmitted = st === EngagementStatus.SUBMITTED && isSender;
  const canAcceptReject = st === EngagementStatus.SUBMITTED && isReceiver;
  const canCancelAccepted = st === EngagementStatus.ACCEPTED;
  const canFinish = st === EngagementStatus.ACCEPTED;

  if (!canCancelSubmitted && !canAcceptReject && !canCancelAccepted && !canFinish) return null;

  return (
    <div className='flex flex-col gap-1.5 min-w-[110px]'>
      {canCancelSubmitted && (
        <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} size='xs' status={st} />
      )}

      {canAcceptReject && (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button size='sm' className='h-7 text-xs bg-green-600 hover:bg-green-700 text-white'>
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
                <DialogClose asChild>
                  <Button variant='outline'>{t('accept.no')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className='bg-green-600 hover:bg-green-700 text-white'
                    onClick={(e) => { e.stopPropagation(); onAccept(eng.engagementId); }}
                  >
                    {t('accept.confirm')}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs border-red-200 text-red-600 hover:bg-red-50'
              >
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
                <DialogClose asChild>
                  <Button variant='outline'>{t('reject.no')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant='destructive'
                    onClick={(e) => { e.stopPropagation(); onReject(eng.engagementId); }}
                  >
                    {t('reject.confirm')}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canCancelAccepted && (
        <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} size='xs' status={st} />
      )}
      {canFinish && (
        <Button
          size='sm'
          className='h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white'
          onClick={(e) => { e.stopPropagation(); onFinish(eng.engagementId); }}
        >
          {t('outlook.finish')}
        </Button>
      )}
    </div>
  );
}

function CancelDialog({
  engId,
  onCancel,
  t,
  size = 'xs',
  status,
}: {
  engId: string;
  onCancel: (id: string, reason?: string) => void;
  t: ReturnType<typeof useTranslations<'Engagement'>>;
  size?: 'xs' | 'sm';
  status: EngagementStatus;
}) {
  const [reason, setReason] = React.useState('');
  const needsReason = status === EngagementStatus.ACCEPTED;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className={cn(
            'text-xs border-gray-300 text-gray-700 hover:bg-gray-100',
            size === 'xs' ? 'h-7' : 'h-8'
          )}
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
        {needsReason && (
          <textarea
            className='w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300'
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

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export const EngagementListView = ({
  engagements,
  isLoading,
  isError,
  tab,
  onTabChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedEngagement,
  onSelect,
  onCancel,
  onFinish,
  onAccept,
  onReject,
  currentUserId,
}: EngagementListViewProps) => {
  const t = useTranslations('Engagement');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : enUS;
  const eng = selectedEngagement;
  const engContent = eng?.content;
  const engIsProposal = eng?.engagementType === EngagementType.AGENT_PROPOSAL;

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500'>
        {t('page.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='h-full flex items-center justify-center text-red-500'>
        {t('page.loadError')}
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col bg-gray-50'>
      <EngagementHeaderSection />
      <EngagementSearchHeader
        tab={tab}
        onTabChange={onTabChange}
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />

      <div className='flex flex-1 overflow-hidden'>
        {/* Left: Card list */}
        <div
          className={cn(
            'overflow-y-auto transition-all duration-300',
            eng ? 'w-1/2 xl:w-3/5' : 'w-full'
          )}
        >
          <div className='p-4 space-y-3'>
            {engagements.length === 0 && (
              <div className='py-16 text-center text-sm text-gray-400'>
                {t('table.empty')}
              </div>
            )}
            {engagements.map((item) => {
              const c = item.content;
              const isProposal = item.engagementType === EngagementType.AGENT_PROPOSAL;
              const isSelected = item.engagementId === eng?.engagementId;
              const otherName =
                item.initiatorId === currentUserId
                  ? item.receiverName ?? item.agentFullName ?? '—'
                  : item.initiatorName ?? item.agentFullName ?? '—';

              const imgUrl = resolvePropertyImage(item);

              const propertyCol = (
                <div className='flex flex-col gap-2 px-5 py-4 w-48 flex-shrink-0 overflow-hidden'>
                  <div className='relative w-full h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt=''
                        className='absolute inset-0 w-full h-full object-cover'
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement;
                          e.currentTarget.style.display = 'none';
                          if (parent) {
                            const fb = parent.querySelector('[data-img-fallback]') as HTMLElement;
                            if (fb) fb.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      data-img-fallback
                      className='w-full h-full items-center justify-center text-gray-300'
                      style={{ display: imgUrl ? 'none' : 'flex' }}
                    >
                      <Home className='h-5 w-5' />
                    </div>
                  </div>
                  <div className='text-xs text-gray-500 truncate'>
                    {item.propertyAddress ?? '—'}
                  </div>
                </div>
              );

              const statusCol = (
                <div className='px-4 py-4 w-36 flex-shrink-0 flex flex-col items-center justify-center gap-1.5'>
                  <Badge
                    variant='secondary'
                    className={cn(
                      'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 border whitespace-nowrap',
                      statusStyle[item.status]
                    )}
                  >
                    {statusIcon[item.status]}
                    {t(`status.${item.status}`)}
                  </Badge>
                  <span className='text-[10px] text-gray-400'>
                    {fmtShortDate(item.createdAt, dateLocale)}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <CardActions
                      eng={item}
                      currentUserId={currentUserId}
                      onCancel={onCancel}
                      onFinish={onFinish}
                      onAccept={onAccept}
                      onReject={onReject}
                      t={t}
                    />
                  </div>
                </div>
              );

              return (
                <div
                  key={item.engagementId}
                  className={cn(
                    'bg-white rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md',
                    isSelected
                      ? 'border-indigo-300 ring-2 ring-indigo-100'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => onSelect(item)}
                >
                  {isProposal ? (
                    /* ── AGENT → OWNER (Agent Proposal) ── */
                    <div className='flex items-stretch gap-0 divide-x divide-gray-100 h-[200px]'>
                      {/* Agent */}
                      <div className='flex flex-col gap-3 px-5 py-4 w-64 flex-shrink-0 overflow-hidden'>
                        <AvatarWithInitials name={otherName} size={40} />
                        <div className='min-w-0 flex-1 overflow-hidden'>
                          <div className='text-sm font-semibold text-gray-900'>{otherName}</div>
                          <p className='text-xs text-gray-500 mt-1 leading-relaxed line-clamp-4'>
                            {c?.message ?? ''}
                          </p>
                        </div>
                      </div>

                      {/* Property */}
                      {propertyCol}

                      {/* Proposal info — hidden when detail open */}
                      {!eng && (
                        <div className='flex-1 px-5 py-4 min-w-0 overflow-hidden'>
                          <div className='text-sm font-semibold text-gray-900 truncate mb-2'>
                            {c?.title ?? item.listingTitle ?? '—'}
                          </div>
                          <div className='space-y-2'>
                            <div className='flex items-center gap-6'>
                              <div>
                                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                                  <Percent className='h-3 w-3' />
                                  {t('outlook.commission')}
                                </div>
                                <span className='text-sm font-bold text-primary'>
                                  {c?.commissionRate != null ? `${c.commissionRate}%` : '—'}
                                </span>
                              </div>
                              <div>
                                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                                  <Briefcase className='h-3 w-3' />
                                  {t('outlook.experience')}
                                </div>
                                <span className='text-sm font-bold text-gray-900'>
                                  {c?.experienceYears != null
                                    ? `${c.experienceYears} ${t('outlook.years')}`
                                    : '—'}
                                </span>
                              </div>
                            </div>
                            {c?.pitchContent && (
                              <p className='text-xs text-gray-600 leading-relaxed line-clamp-4'>
                                {c.pitchContent}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price ranges — hidden when detail open */}
                      {!eng && (
                        <div className='px-5 py-4 w-52 flex-shrink-0 hidden lg:flex flex-col justify-center'>
                          {c?.priceRange ? (
                            <div className='space-y-1.5'>
                              {c.priceRange.sale && (
                                <div className='text-xs'>
                                  <div className='text-gray-500 mb-0.5'>{t('outlook.saleRange')}</div>
                                  <span className='font-semibold text-gray-900'>
                                    {fmtPrice(c.priceRange.sale.min)} VND – {fmtPrice(c.priceRange.sale.max)} VND
                                  </span>
                                </div>
                              )}
                              {c.priceRange.rent && (
                                <div className='text-xs'>
                                  <div className='text-gray-500 mb-0.5'>{t('outlook.rentRange')}</div>
                                  <span className='font-semibold text-gray-900'>
                                    {fmtPrice(c.priceRange.rent.min)} VND – {fmtPrice(c.priceRange.rent.max)} VND
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className='text-xs text-gray-400'>—</span>
                          )}
                        </div>
                      )}

                      {/* Status + actions */}
                      {statusCol}
                    </div>
                  ) : (
                    /* ── OWNER → AGENT (Owner Invitation) ── */
                    <div className='flex items-stretch gap-0 divide-x divide-gray-100 h-[200px]'>
                      {/* Property first */}
                      {propertyCol}

                      {/* Agent receiver */}
                      <div className='flex flex-col gap-3 px-5 py-4 w-56 flex-shrink-0 overflow-hidden'>
                        <AvatarWithInitials name={otherName} size={40} />
                        <div className='min-w-0 flex-1 overflow-hidden'>
                          <div className='text-sm font-semibold text-gray-900'>{otherName}</div>
                          <p className='text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3'>
                            {item.agentBio ?? ''}
                          </p>
                        </div>
                      </div>

                      {/* Message + commission — hidden when detail open */}
                      {!eng && (
                        <div className='flex-1 px-5 py-4 min-w-0 overflow-hidden'>
                          <div className='text-sm font-semibold text-gray-900 truncate mb-2'>
                            {c?.title ?? item.listingTitle ?? '—'}
                          </div>
                          <div className='space-y-2'>
                            {c?.message && (
                              <p className='text-xs text-gray-600 leading-relaxed line-clamp-3'>
                                {c.message}
                              </p>
                            )}
                            {c?.offeredCommission && (
                              <div>
                                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                                  <DollarSign className='h-3 w-3' />
                                  {t('outlook.offeredCommission')}
                                </div>
                                <span className='text-sm font-bold text-primary'>
                                  {c.offeredCommission}
                                </span>
                              </div>
                            )}
                            {c?.note && (
                              <p className='text-xs text-gray-600 leading-relaxed line-clamp-2'>
                                {c.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status + actions */}
                      {statusCol}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail panel (slides in) */}
        {eng && (
          <div className='w-1/2 xl:w-2/5 border-l border-gray-200 bg-white overflow-y-auto' id='engagement-detail-panel'>
            {/* Close button */}
            <div className='sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between'>
              <h3 className='text-sm font-bold text-gray-900 truncate'>
                {engContent?.title ?? eng.listingTitle ?? t('detail.noTitle')}
              </h3>
              <button
                onClick={() => onSelect(eng)}
                className='p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            {/* Property image */}
            <div className='relative w-full h-44 bg-gray-100'>
              {(() => {
                const detailImg = resolvePropertyImage(eng);
                if (detailImg) {
                  return (
                    <img
                      src={detailImg}
                      alt={engContent?.title ?? ''}
                      className='absolute inset-0 w-full h-full object-cover'
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  );
                }
                return (
                  <div className='w-full h-full flex items-center justify-center text-gray-300'>
                    <Home className='h-12 w-12' />
                  </div>
                );
              })()}
            </div>

            <div className='px-5 py-4 space-y-5'>
              {/* Title + address */}
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  {engContent?.title ?? eng.listingTitle ?? t('detail.noTitle')}
                </h3>
                {eng.propertyAddress && (
                  <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
                    <MapPin className='h-4 w-4 flex-shrink-0' />
                    <span>{eng.propertyAddress}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              {engContent?.message && (
                <div>
                  <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                    {t('outlook.messageTitle')}
                  </h4>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <div className='flex gap-3'>
                      <AvatarWithInitials
                        name={engIsProposal ? (eng.agentFullName ?? '?') : (eng.initiatorName ?? '?')}
                        size={36}
                        className={engIsProposal ? 'bg-blue-500' : undefined}
                      />
                      <div className='min-w-0'>
                        <span className='text-xs font-semibold text-gray-700'>
                          {engIsProposal ? (eng.agentFullName ?? '—') : (eng.initiatorName ?? '—')}
                        </span>
                        <p className='text-sm text-gray-700 mt-1 leading-relaxed'>
                          {engContent.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Proposal Card */}
              {engIsProposal && engContent && (
                <div>
                  <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                    {t('outlook.proposalTitle')}
                  </h4>
                  <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
                    <div className='bg-indigo-50 px-5 py-3 border-b border-primary/10'>
                      <div className='flex items-center gap-3'>
                        <AvatarWithInitials
                          name={eng.agentFullName ?? '?'}
                          size={36}
                          className='bg-blue-500'
                        />
                        <div>
                          <h5 className='text-sm font-bold text-gray-900'>
                            {engContent.title ?? '—'}
                          </h5>
                          <span className='text-xs text-gray-600'>{eng.agentFullName ?? '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100'>
                      <div className='px-5 py-3'>
                        <div className='flex items-center gap-1.5 text-xs text-gray-500 mb-1'>
                          <Percent className='h-3 w-3' />
                          {t('outlook.commission')}
                        </div>
                        <span className='text-sm font-bold text-primary'>
                          {engContent.commissionRate != null ? `${engContent.commissionRate}%` : '—'}
                        </span>
                      </div>
                      <div className='px-5 py-3'>
                        <div className='flex items-center gap-1.5 text-xs text-gray-500 mb-1'>
                          <Briefcase className='h-3 w-3' />
                          {t('outlook.experience')}
                        </div>
                        <span className='text-sm font-bold text-gray-900'>
                          {engContent.experienceYears != null
                            ? `${engContent.experienceYears} ${t('outlook.years')}`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {engContent.priceRange && (
                      <div className='px-5 py-3 border-b border-gray-100 space-y-2'>
                        {engContent.priceRange.rent && (
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-500'>{t('outlook.rentRange')}</span>
                            <span className='font-medium text-gray-900'>
                              {fmtPrice(engContent.priceRange.rent.min)} –{' '}
                              {fmtPrice(engContent.priceRange.rent.max)}
                            </span>
                          </div>
                        )}
                        {engContent.priceRange.sale && (
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-500'>{t('outlook.saleRange')}</span>
                            <span className='font-medium text-gray-900'>
                              {fmtPrice(engContent.priceRange.sale.min)} –{' '}
                              {fmtPrice(engContent.priceRange.sale.max)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {engContent.pitchContent && (
                      <div className='px-5 py-3'>
                        <div className='text-xs font-semibold text-gray-500 mb-1'>
                          {t('outlook.bio')}
                        </div>
                        <p className='text-sm text-gray-700 leading-relaxed'>
                          {engContent.pitchContent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Owner Invitation */}
              {!engIsProposal && engContent?.offeredCommission && (
                <div>
                  <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                    {t('outlook.invitationDetails')}
                  </h4>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>{t('outlook.offeredCommission')}</span>
                      <span className='font-medium text-primary'>
                        {engContent.offeredCommission}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className='flex items-center justify-between py-3 border-t border-gray-100'>
                <span className='text-sm text-gray-600'>{t('detail.statusLabel')}</span>
                <Badge
                  variant='secondary'
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border',
                    statusStyle[eng.status]
                  )}
                >
                  {statusIcon[eng.status]}
                  {t(`detail.status${eng.status.charAt(0)}${eng.status.slice(1).toLowerCase()}`)}
                </Badge>
              </div>

              {/* Dates */}
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-500'>{t('detail.submittedDate')}</span>
                  <span className='font-medium text-gray-900'>
                    {fmtDate(eng.createdAt, dateLocale)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-500'>{t('detail.updatedDate')}</span>
                  <span className='font-medium text-gray-900'>
                    {fmtDate(eng.updatedAt, dateLocale)}
                  </span>
                </div>
              </div>

              {/* Detail action buttons */}
              {(() => {
                const isSender = eng.initiatorId === currentUserId;
                const isReceiver = eng.receiverId === currentUserId;
                const st = eng.status;
                const canCancelSubmitted = st === EngagementStatus.SUBMITTED && isSender;
                const canAcceptReject = st === EngagementStatus.SUBMITTED && isReceiver;
                const canCancelAccepted = st === EngagementStatus.ACCEPTED;
                const canFinish = st === EngagementStatus.ACCEPTED;
                const show = canCancelSubmitted || canAcceptReject || canCancelAccepted || canFinish;
                if (!show) return null;
                return (
                  <div className='pt-3 border-t border-gray-100 flex gap-3'>
                    {canCancelSubmitted && (
                      <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} size='sm' status={st} />
                    )}
                    {canAcceptReject && (
                      <>
                        <Button
                          variant='outline'
                          className='flex-1 border-red-200 text-red-600 hover:bg-red-50'
                          onClick={() => onReject(eng.engagementId)}
                        >
                          {t('reject.button')}
                        </Button>
                        <Button
                          className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                          onClick={() => onAccept(eng.engagementId)}
                        >
                          {t('accept.button')}
                        </Button>
                      </>
                    )}
                    {canCancelAccepted && (
                      <CancelDialog engId={eng.engagementId} onCancel={onCancel} t={t} size='sm' status={st} />
                    )}
                    {canFinish && (
                      <Button
                        className='flex-1 bg-indigo-600 hover:bg-indigo-700 text-white'
                        onClick={() => onFinish(eng.engagementId)}
                      >
                        {t('outlook.finish')}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
