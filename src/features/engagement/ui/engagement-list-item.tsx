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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip/tooltip';
import { AlertCircle, FileText, Home, XCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { format, parseISO } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

interface EngagementListItemProps {
  engagement: Engagement;
  isSelected: boolean;
  onClick: (engagement: Engagement) => void;
  onCancel: (engagementId: string) => void;
}

function formatRowDate(dateStr: string, dateLocale: Locale) {
  try {
    const d = parseISO(dateStr);
    return { day: format(d, 'd MMM', { locale: dateLocale }), time: format(d, 'HH:mm') };
  } catch {
    return { day: '—', time: '' };
  }
}

export const EngagementListItem = ({
  engagement,
  isSelected,
  onClick,
  onCancel,
}: EngagementListItemProps) => {
  const t = useTranslations('Engagement');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : enUS;
  const { day, time } = formatRowDate(engagement.createdAt, dateLocale);

  const statusBadge = {
    [EngagementStatus.SUBMITTED]: { label: t('status.SUBMITTED'), className: 'bg-blue-50 text-blue-600 border-blue-100' },
    [EngagementStatus.ACCEPTED]:  { label: t('status.ACCEPTED'),  className: 'bg-green-50 text-green-600 border-green-100' },
    [EngagementStatus.REJECTED]:  { label: t('status.REJECTED'),  className: 'bg-red-50 text-red-500 border-red-100' },
    [EngagementStatus.CANCELLED]: { label: t('status.CANCELLED'), className: 'bg-gray-100 text-gray-400 border-gray-200' },
  };

  const badge = statusBadge[engagement.status];

  return (
    <div
      className={cn(
        'grid items-center gap-4 px-5 py-4 border-b border-gray-100 cursor-pointer transition-colors duration-100',
        isSelected ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50',
      )}
      style={{ gridTemplateColumns: '120px 1fr 140px auto' }}
      onClick={() => onClick(engagement)}
    >
      {/* Date */}
      <div>
        <div className='text-base font-semibold text-gray-700'>{day}</div>
        <div className='text-sm text-gray-400 mt-0.5'>{time}</div>
      </div>

      {/* Property */}
      <div className='flex items-center gap-4 min-w-0'>
        <div className='relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm'>
          {engagement.propertyImageUrl ? (
            <Image
              src={engagement.propertyImageUrl}
              alt={engagement.listingTitle || t('listItem.noTitle')}
              fill
              className='object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-gray-300'>
              <Home className='h-6 w-6' />
            </div>
          )}
        </div>
        <div className='min-w-0'>
          <div className='text-base font-semibold text-gray-900 truncate mb-0.5'>
            {engagement.listingTitle || t('listItem.noTitle')}
          </div>
          <div className='text-sm text-gray-500 truncate'>
            {engagement.propertyAddress || '—'}
          </div>
        </div>
      </div>

      {/* Status + Cancel */}
      <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
        <Badge
          variant='outline'
          className={cn('text-sm font-medium px-3 py-0.5 whitespace-nowrap', badge.className)}
        >
          {badge.label}
        </Badge>

        {engagement.status === EngagementStatus.SUBMITTED && (
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <button
                    className='text-gray-300 hover:text-red-500 transition-colors duration-100'
                  >
                    <XCircle className='h-5 w-5' />
                  </button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side='top'>{t('listItem.cancelTooltip')}</TooltipContent>
            </Tooltip>

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
      </div>

      {/* View detail */}
      <div className='flex-shrink-0'>
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-1.5 text-sm text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 h-9 px-3.5 font-normal'
          onClick={(e) => { e.stopPropagation(); onClick(engagement); }}
        >
          <FileText className='h-4 w-4' />
          {t('listItem.viewDetail')}
        </Button>
      </div>
    </div>
  );
};
