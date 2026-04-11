'use client';

import { Engagement, EngagementStatus } from '@/entities/engagement/model/types';
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
import { AlertCircle, X, MapPin, Home, CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { formatCurrency, formatDate } from '@/features/tenant-application/lib/utils';
import { useTranslations } from 'next-intl';

interface EngagementDetailPanelProps {
  engagement: Engagement;
  onClose: () => void;
  onCancel: (id: string) => void;
}

interface ContentFields {
  title?: string;
  monthlyIncome?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  note?: string;
  [key: string]: unknown;
}

const statusStyle: Record<EngagementStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  [EngagementStatus.SUBMITTED]: { bg: 'bg-blue-50',  text: 'text-blue-600',  icon: <Clock className='h-3.5 w-3.5' /> },
  [EngagementStatus.ACCEPTED]:  { bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle2 className='h-3.5 w-3.5' /> },
  [EngagementStatus.REJECTED]:  { bg: 'bg-red-50',   text: 'text-red-500',   icon: <XCircle className='h-3.5 w-3.5' /> },
  [EngagementStatus.CANCELLED]: { bg: 'bg-gray-100', text: 'text-gray-400',  icon: <XCircle className='h-3.5 w-3.5' /> },
  [EngagementStatus.FINISHED]:  { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <Trophy className='h-3.5 w-3.5' /> },
};

export const EngagementDetailPanel = ({
  engagement,
  onClose,
  onCancel,
}: EngagementDetailPanelProps) => {
  const t = useTranslations('Engagement');
  const s = statusStyle[engagement.status];
  const canCancel = engagement.status === EngagementStatus.SUBMITTED;

  const statusLabel: Record<EngagementStatus, string> = {
    [EngagementStatus.SUBMITTED]: t('detail.statusSubmitted'),
    [EngagementStatus.ACCEPTED]:  t('detail.statusAccepted'),
    [EngagementStatus.REJECTED]:  t('detail.statusRejected'),
    [EngagementStatus.CANCELLED]: t('detail.statusCancelled'),
    [EngagementStatus.FINISHED]:  t('detail.statusFinished'),
  };

  let content: ContentFields | null = null;
  if (engagement.content) {
    content = engagement.content as unknown as ContentFields;
  }

  return (
    <div className='w-full lg:w-[360px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[calc(100vh-120px)] sticky top-4 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
        <span className='font-bold text-sm text-gray-900'>{t('detail.panelTitle')}</span>
        <div className='flex items-center gap-2'>
          {canCancel && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size='sm' className='h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white'>
                  {t('cancel.button')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2 text-destructive'>
                    <AlertCircle className='h-5 w-5' />
                    {t('cancel.dialogTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('cancel.dialogDescription')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild><Button variant='outline'>{t('cancel.no')}</Button></DialogClose>
                  <DialogClose asChild>
                    <Button variant='destructive' onClick={() => onCancel(engagement.engagementId)}>
                      {t('cancel.confirm')}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant='ghost' size='icon' className='h-8 w-8 text-gray-400 hover:text-gray-700' onClick={onClose}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        {/* Avatar + listing identity */}
        <div className='flex flex-col items-center pt-7 pb-5 px-5 border-b border-gray-100'>
          <div className='relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow mb-3 ring-1 ring-gray-100'>
            {engagement.propertyImageUrl ? (
              <Image
                src={engagement.propertyImageUrl}
                alt={engagement.listingTitle || t('detail.noTitle')}
                fill
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-gray-300'>
                <Home className='h-8 w-8' />
              </div>
            )}
          </div>
          <h2 className='text-base font-bold text-gray-900 text-center'>
            {engagement.listingTitle || t('detail.noTitle')}
          </h2>
          {engagement.propertyAddress && (
            <div className='flex items-center gap-1 text-xs text-gray-400 mt-1'>
              <MapPin className='h-3 w-3 flex-shrink-0' />
              <span className='text-center'>{engagement.propertyAddress}</span>
            </div>
          )}
        </div>

        {/* Status pill */}
        <div className='px-5 py-3 border-b border-gray-100 flex items-center justify-between'>
          <span className='text-xs text-gray-400 font-medium'>{t('detail.statusLabel')}</span>
          <Badge
            variant='secondary'
            className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1', s.bg, s.text)}
          >
            {s.icon}
            {statusLabel[engagement.status]}
          </Badge>
        </div>

        {/* Key info rows */}
        <div className='px-5 py-4 border-b border-gray-100 space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-400'>{t('detail.submittedDate')}</span>
            <span className='font-medium text-gray-800'>{formatDate(engagement.createdAt, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-400'>{t('detail.updatedDate')}</span>
            <span className='font-medium text-gray-800'>{formatDate(engagement.updatedAt, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-400'>{t('detail.requestType')}</span>
            <span className='font-medium text-gray-800 text-xs uppercase tracking-wide'>
              {engagement.engagementType?.replace(/_/g, ' ')}
            </span>
          </div>
          {content?.title && (
            <div className='flex justify-between text-sm'>
              <span className='text-gray-400'>{t('detail.applicationTitle')}</span>
              <span className='font-medium text-gray-800 text-right max-w-[180px] leading-tight'>{content.title}</span>
            </div>
          )}
        </div>

        {/* Financial grid */}
        {content && (
          <div className='px-5 py-4 border-b border-gray-100'>
            <div className='grid grid-cols-2 gap-x-4 gap-y-4'>
              <div>
                <div className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>{t('detail.income')}</div>
                <div className='text-sm font-bold text-gray-900'>
                  {content.monthlyIncome ? formatCurrency(content.monthlyIncome) + t('detail.incomePerMonth') : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>{t('detail.leaseTerm')}</div>
                <div className='text-sm font-bold text-gray-900'>
                  {content.leaseTermMonths ? t('detail.leaseTermMonths', { months: content.leaseTermMonths }) : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>{t('detail.moveInDate')}</div>
                <div className='text-sm font-bold text-gray-900'>
                  {content.moveInDate ? formatDate(content.moveInDate, 'dd MMM, yyyy') : '—'}
                </div>
              </div>
              <div>
                <div className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>{t('detail.tenants')}</div>
                <div className='text-sm font-bold text-gray-900'>—</div>
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        {content?.note && (
          <div className='px-5 py-4'>
            <div className='text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3'>
              {t('detail.tenantNote')}
            </div>
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
              <p className='text-sm italic text-gray-500 leading-relaxed'>
                &quot;{content.note}&quot;
              </p>
            </div>
          </div>
        )}

        {/* Status message */}
        {engagement.status === EngagementStatus.ACCEPTED && (
          <div className='mx-5 mb-4 bg-green-50 border border-green-100 rounded-xl p-3.5'>
            <p className='text-xs text-green-700 font-medium flex items-center gap-1.5'>
              <CheckCircle2 className='h-4 w-4 flex-shrink-0' />
              {t('detail.acceptedMessage')}
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
