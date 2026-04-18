'use client';

import {
  ManageAgentProvider,
  useManageAgentContext,
} from '@/features/agent-engagement/model/manage-agent-context';
import { AgentListItem } from '@/features/agent-engagement/ui/agent-list-item';
import { AgentDetailPanel } from '@/features/agent-engagement/ui/agent-detail-panel';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import { Button } from '@/shared/ui/button';
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

function ManageAgentContent() {
  const {
    agents,
    isLoading,
    isError,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    selectedAgent,
    setSelectedAgent,
    totalPages,
    totalElements,
    ITEMS_PER_PAGE,
    handleAgentClick,
  } = useManageAgentContext();

  const t = useTranslations('ManageAgent');
  const tStatus = useTranslations('AgentEngagement.status');

  if (isLoading) {
    return (
      <div className='h-full bg-primary/5 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-10 w-10 rounded-full border-[3px] border-primary border-t-transparent animate-spin' />
          <p className='text-sm text-gray-500 font-medium tracking-wide'>
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='h-full bg-primary/5 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3 text-center max-w-xs'>
          <div className='h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center shadow-sm'>
            <Users className='h-8 w-8 text-red-400' />
          </div>
          <p className='font-semibold text-gray-800'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full bg-primary/5 font-sans'>
      <div className='container mx-auto px-6 py-6'>
        <div className='flex flex-col lg:flex-row gap-6 items-start'>
          {/* Left Panel */}
          <div
            className={cn(
              'flex-1 min-w-0 flex flex-col transition-all duration-300',
              selectedAgent ? 'lg:flex-1' : 'w-full'
            )}
          >
            {/* Filter Bar */}
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-center'>
              <div className='flex items-center gap-2 w-full sm:w-auto flex-shrink-0'>
                <SlidersHorizontal className='h-4 w-4 text-gray-400 flex-shrink-0' />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full sm:w-44 bg-gray-50 border-transparent rounded-xl h-9 text-sm font-medium focus:ring-indigo-200'>
                    <SelectValue placeholder={t('filter.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('filter.allStatuses')}</SelectItem>
                    <SelectItem value='ACTIVE'>{tStatus('active')}</SelectItem>
                    <SelectItem value='PENDING'>{tStatus('pending')}</SelectItem>
                    <SelectItem value='ACCEPTED'>{tStatus('accepted')}</SelectItem>
                    <SelectItem value='COMPLETED'>{tStatus('completed')}</SelectItem>
                    <SelectItem value='CANCELLED'>{tStatus('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='relative flex-1 w-full'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
                <Input
                  placeholder={t('filter.searchPlaceholder')}
                  className='pl-9 bg-gray-50 border-transparent rounded-xl h-9 text-sm focus-visible:ring-indigo-200'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table Container */}
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
              {/* Table Header */}
              <div className='grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/70'>
                <div className='col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
                  {t('table.hiredDate')}
                </div>
                <div className='col-span-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
                  {t('table.agent')}
                </div>
                <div className='col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
                  {t('table.rating')}
                </div>
                <div className='col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
                  {t('table.property')}
                </div>
                <div className='col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
                  {t('table.status')}
                </div>
              </div>

              {/* Table Body */}
              <div className='min-h-[400px]'>
                {agents.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-[400px] gap-4 text-center px-6'>
                    <div className='h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center'>
                      <Users className='h-8 w-8 text-indigo-300' />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-700'>{t('empty.title')}</p>
                      <p className='text-sm text-gray-400 mt-1'>{t('empty.subtitle')}</p>
                    </div>
                  </div>
                ) : (
                  <div className='divide-y divide-gray-50'>
                    {agents.map((agent) => (
                      <AgentListItem
                        key={agent.engagement_id}
                        agent={agent}
                        isSelected={
                          selectedAgent?.engagement_id === agent.engagement_id
                        }
                        onClick={handleAgentClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalElements > 0 && (
              <div className='flex items-center justify-between mt-4 px-1'>
                <p className='text-xs text-gray-400 font-medium'>
                  {t('pagination.showing', {
                    from: Math.min(
                      (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      totalElements
                    ),
                    to: Math.min(currentPage * ITEMS_PER_PAGE, totalElements),
                    total: totalElements,
                  })}
                </p>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8 rounded-lg border-gray-200 hover:border-primary hover:text-primary hover:bg-indigo-50 transition-colors'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <span className='px-3 text-sm font-semibold text-gray-700 tabular-nums'>
                    {currentPage}
                    <span className='text-gray-300 mx-1.5 font-normal'>/</span>
                    {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8 rounded-lg border-gray-200 hover:border-primary hover:text-primary hover:bg-indigo-50 transition-colors'
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Detail */}
          {selectedAgent && (
            <AgentDetailPanel
              agent={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageAgentPage() {
  return (
    <ManageAgentProvider>
      <ManageAgentContent />
    </ManageAgentProvider>
  );
}
