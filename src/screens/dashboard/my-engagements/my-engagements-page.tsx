'use client';

import { format } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import {
  MyEngagementsProvider,
  useMyEngagementsContext,
} from '@/features/engagement/model/my-engagements-context';
import { EngagementOverviewCards } from '@/features/engagement/ui/engagement-overview-cards';
import { EngagementDetailPanel } from '@/features/engagement/ui/engagement-detail-panel';
import { EngagementListItem } from '@/features/engagement/ui/engagement-list-item';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

function MyEngagementsContent() {
  const t = useTranslations('Engagement');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : enUS;

  const {
    engagements,
    isLoading,
    isError,
    searchQuery,
    setSearchQuery,
    date,
    setDate,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    selectedEngagement,
    setSelectedEngagement,
    filteredEngagements,
    paginatedEngagements,
    totalPages,
    ITEMS_PER_PAGE,
    handleCancel,
    handleEngagementClick,
  } = useMyEngagementsContext();

  if (isLoading)
    return <div className='p-8 text-center text-gray-500'>{t('page.loading')}</div>;
  if (isError)
    return <div className='p-8 text-center text-red-500'>{t('page.loadError')}</div>;

  const startItem = filteredEngagements.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem   = Math.min(currentPage * ITEMS_PER_PAGE, filteredEngagements.length);

  return (
    <div className='bg-gray-50 min-h-screen font-sans'>
      <div className='container mx-auto py-8 px-4'>
        {/* Page header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>{t('page.title')}</h1>
            <p className='text-sm text-gray-400 mt-0.5'>{t('page.subtitle')}</p>
          </div>
          <Button asChild variant='outline' className='flex items-center gap-2 text-sm text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'>
            <Link href='/dashboard/my-applications'>
              <ClipboardList className='h-4 w-4' />
              {t('page.viewApplications')}
            </Link>
          </Button>
        </div>

        {/* Filter bar */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center mb-5'>
          {/* Status dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-full sm:w-44 bg-gray-50 border-gray-200 rounded-lg text-sm text-gray-700 h-9'>
              <SelectValue placeholder={t('filter.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('filter.all')}</SelectItem>
              <SelectItem value='SUBMITTED'>{t('status.SUBMITTED')}</SelectItem>
              <SelectItem value='ACCEPTED'>{t('status.ACCEPTED')}</SelectItem>
              <SelectItem value='REJECTED'>{t('status.REJECTED')}</SelectItem>
              <SelectItem value='CANCELLED'>{t('status.CANCELLED')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className='relative flex-1 w-full'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
            <Input
              placeholder={t('filter.searchPlaceholder')}
              className='pl-9 bg-gray-50 border-gray-200 rounded-lg h-9 text-sm'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full sm:w-auto h-9 text-sm font-normal bg-gray-50 border-gray-200 rounded-lg justify-start',
                  !date && 'text-gray-400',
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {date ? format(date, 'd MMM, yyyy', { locale: dateLocale }) : t('filter.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='end'>
              <Calendar mode='single' selected={date} onSelect={setDate} initialFocus locale={dateLocale} />
              {date && (
                <div className='p-2 border-t border-gray-100'>
                  <Button
                    variant='ghost'
                    className='w-full text-xs h-8'
                    onClick={() => setDate(undefined)}
                  >
                    {t('filter.clearDate')}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Main content */}
        <div className='flex flex-col lg:flex-row gap-5 items-start'>
          {/* Left: Overview + List in one card */}
          <div className='flex-1 min-w-0 transition-all duration-300'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
              {/* Overview stats row */}
              <EngagementOverviewCards engagements={engagements || []} />

              {/* Table header */}
              <div
                className='grid gap-4 px-5 py-3 bg-gray-50/60 border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400'
                style={{ gridTemplateColumns: '120px 1fr 140px auto' }}
              >
                <div>{t('table.dateColumn')}</div>
                <div>{t('table.propertyColumn')}</div>
                <div>{t('table.statusColumn')}</div>
                <div></div>
              </div>

              {/* List */}
              <div className='divide-y-0 min-h-[360px]'>
                {filteredEngagements.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                    <FileText className='h-10 w-10 mb-3 text-gray-300' />
                    <p className='text-sm'>{t('table.empty')}</p>
                    {date && (
                      <Button
                        variant='link'
                        onClick={() => setDate(undefined)}
                        className='text-indigo-500 text-xs mt-1'
                      >
                        {t('table.clearDateFilter')}
                      </Button>
                    )}
                  </div>
                ) : (
                  paginatedEngagements.map((eng, index) => (
                    <EngagementListItem
                      key={eng.engagementId || index}
                      engagement={eng}
                      isSelected={selectedEngagement?.engagementId === eng.engagementId}
                      onClick={handleEngagementClick}
                      onCancel={handleCancel}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredEngagements.length > 0 && (
                <div className='flex items-center justify-between px-5 py-3 border-t border-gray-100'>
                  <span className='text-xs text-gray-400'>
                    {startItem}–{endItem} of {filteredEngagements.length}
                  </span>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-gray-400 mr-1'>
                      {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50'
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50'
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          {selectedEngagement && (
            <EngagementDetailPanel
              engagement={selectedEngagement}
              onClose={() => setSelectedEngagement(null)}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyEngagementsPage() {
  return (
    <MyEngagementsProvider>
      <MyEngagementsContent />
    </MyEngagementsProvider>
  );
}
