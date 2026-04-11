'use client';

import { Engagement, EngagementStatus } from '@/entities/engagement/model/types';
import { AvatarWithInitials } from './avatar-with-initials';
import { cn } from '@/shared/lib/utils';
import { format, parseISO } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

const statusBadgeStyle: Record<EngagementStatus, string> = {
  [EngagementStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [EngagementStatus.ACCEPTED]: 'bg-green-100 text-green-700',
  [EngagementStatus.REJECTED]: 'bg-red-100 text-red-600',
  [EngagementStatus.CANCELLED]: 'bg-gray-100 text-gray-500',
  [EngagementStatus.FINISHED]: 'bg-emerald-100 text-emerald-700',
};

interface EngagementListSectionProps {
  engagements: Engagement[];
  selectedId?: string;
  currentUserId?: string;
  onSelect: (engagement: Engagement) => void;
}

export const EngagementListSection = ({
  engagements,
  selectedId,
  currentUserId,
  onSelect,
}: EngagementListSectionProps) => {
  const t = useTranslations('Engagement');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : enUS;

  function getOtherPartyName(eng: Engagement): string {
    const isSender = eng.initiatorId === currentUserId;
    if (isSender) return eng.receiverName ?? t('listItem.noTitle');
    return eng.initiatorName ?? eng.agentFullName ?? t('listItem.noTitle');
  }

  function formatDate(dateStr: string): string {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: dateLocale });
    } catch {
      return '—';
    }
  }

  function getPreview(eng: Engagement): string {
    return eng.content?.message ?? eng.content?.pitchContent ?? '';
  }

  return (
    <div className='w-full lg:w-96 border-r border-gray-200 bg-white overflow-y-auto'>
      <div className='divide-y divide-gray-100'>
        {engagements.length === 0 && (
          <div className='p-8 text-center text-sm text-gray-400'>{t('table.empty')}</div>
        )}
        {engagements.map((eng) => {
          const isSelected = eng.engagementId === selectedId;
          const name = getOtherPartyName(eng);
          return (
            <div
              key={eng.engagementId}
              className={cn(
                'p-4 cursor-pointer transition-colors border-l-4',
                isSelected
                  ? 'bg-blue-50 border-l-blue-600'
                  : 'bg-white border-l-transparent hover:bg-gray-50'
              )}
              onClick={() => onSelect(eng)}
            >
              <div className='flex gap-3'>
                <AvatarWithInitials name={name} size={40} />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-baseline justify-between gap-2 mb-1'>
                    <span className='font-semibold text-sm text-gray-900 truncate'>{name}</span>
                    <span className='text-xs text-gray-500 flex-shrink-0'>
                      {formatDate(eng.createdAt)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 mb-1'>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                        statusBadgeStyle[eng.status]
                      )}
                    >
                      {t(`status.${eng.status}`)}
                    </span>
                  </div>
                  <span className='text-xs font-medium text-gray-700 truncate block mb-1'>
                    {eng.content?.title ?? eng.listingTitle ?? ''}
                  </span>
                  <p className='text-xs text-gray-600 line-clamp-3 leading-relaxed'>
                    {getPreview(eng)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
