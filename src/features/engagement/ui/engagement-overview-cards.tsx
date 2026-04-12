'use client';

import { Engagement, EngagementStatus } from '@/entities/engagement/model/types';
import { subDays, isAfter } from 'date-fns';
import { useTranslations } from 'next-intl';

interface EngagementOverviewCardsProps {
  engagements: Engagement[];
}

export const EngagementOverviewCards = ({ engagements }: EngagementOverviewCardsProps) => {
  const t = useTranslations('Engagement.overview');
  const thirtyDaysAgo = subDays(new Date(), 30);

  const recent = engagements.filter((eng) => {
    try { return isAfter(new Date(eng.createdAt), thirtyDaysAgo); } catch { return false; }
  });

  const total    = recent.length;
  const accepted = recent.filter((e) => e.status === EngagementStatus.ACCEPTED).length;
  const pending  = recent.filter((e) => e.status === EngagementStatus.SUBMITTED).length;
  const rejected = recent.filter((e) => e.status === EngagementStatus.REJECTED).length;
  const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100'>
      <div className='p-5'>
        <div className='text-sm font-semibold text-gray-900'>{t('title')}</div>
        <div className='text-xs text-gray-400 mt-0.5'>{t('last30Days')}</div>
      </div>
      <div className='p-5'>
        <div className='text-xs text-gray-400 mb-1.5'>{t('total')}</div>
        <div className='text-2xl font-bold text-gray-900'>{total}</div>
      </div>
      <div className='p-5'>
        <div className='text-xs text-gray-400 mb-1.5'>{t('accepted')}</div>
        <div className='flex items-end gap-2'>
          <span className='text-2xl font-bold text-gray-900'>{accepted}</span>
          {total > 0 && (
            <span className='text-xs font-semibold text-green-600 mb-0.5'>{acceptRate}%</span>
          )}
        </div>
      </div>
      <div className='p-5'>
        <div className='text-xs text-gray-400 mb-1.5'>{t('pendingRejected')}</div>
        <div className='flex items-end gap-4'>
          <div>
            <span className='text-2xl font-bold text-blue-500'>{pending}</span>
            <span className='text-xs text-gray-400 ml-1'>{t('pending')}</span>
          </div>
          <div>
            <span className='text-2xl font-bold text-red-400'>{rejected}</span>
            <span className='text-xs text-gray-400 ml-1'>{t('rejected')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
