'use client';

import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

export type EngagementTab = 'sent' | 'received';

interface EngagementSearchHeaderProps {
  tab: EngagementTab;
  onTabChange: (tab: EngagementTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const EngagementSearchHeader = ({
  tab,
  onTabChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: EngagementSearchHeaderProps) => {
  const t = useTranslations('Engagement');

  return (
    <div className='bg-background border-b border-border sticky top-0 z-20 px-4 py-3 flex items-center gap-3'>
      <div className='flex gap-1 flex-shrink-0'>
        <button
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
            tab === 'sent'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onTabChange('sent')}
        >
          {t('tabs.sent')}
        </button>
        <button
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
            tab === 'received'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onTabChange('received')}
        >
          {t('tabs.received')}
        </button>
      </div>

      <div className='hidden sm:block w-px h-6 bg-border' />

      <div className='relative flex-1 min-w-0'>
        <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70' />
        <Input
          placeholder={t('filter.searchPlaceholder')}
          className='pl-9 bg-primary/5 border-primary/20 rounded-lg h-9 text-sm'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className='w-40 bg-primary/5 border-primary/20 rounded-lg text-sm text-foreground h-9 flex-shrink-0'>
          <SelectValue placeholder={t('filter.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('filter.all')}</SelectItem>
          <SelectItem value='SUBMITTED'>{t('status.SUBMITTED')}</SelectItem>
          <SelectItem value='ACCEPTED'>{t('status.ACCEPTED')}</SelectItem>
          <SelectItem value='REJECTED'>{t('status.REJECTED')}</SelectItem>
          <SelectItem value='CANCELLED'>{t('status.CANCELLED')}</SelectItem>
          <SelectItem value='FINISHED'>{t('status.FINISHED')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
