'use client';

import {
  ManageAgentProvider,
  useManageAgentContext,
} from '@/features/agent-engagement/model/manage-agent-context';
import { AgentListItem } from '@/features/agent-engagement/ui/agent-list-item';
import { AgentDetailPanel } from '@/features/agent-engagement/ui/agent-detail-panel';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import { Button } from '@/shared/ui/button';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className='p-8 text-center text-gray-500'>{t('loading')}</div>
    );
  }

  if (isError) {
    return (
      <div className='p-8 text-center text-red-500'>
        {t('error')}
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 bg-[#F7F7FD] min-h-screen font-sans'>
      {/* Main Layout: List + Detail */}
      <div className='flex flex-col lg:flex-row gap-8 items-start'>
        {/* Left Panel: List */}
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300 w-full',
            selectedAgent ? 'lg:w-2/3' : 'w-full'
          )}
        >
          {/* Filter Bar */}
          <Card className='mb-6 border-none shadow-sm rounded-xl'>
            <CardContent className='p-4 flex flex-col sm:flex-row gap-4 items-center'>
              <div className='w-full sm:w-48'>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full bg-gray-50 border-transparent rounded-lg'>
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
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                <Input
                  placeholder={t('filter.searchPlaceholder')}
                  className='pl-9 bg-gray-50 border-transparent rounded-lg'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* List Header */}
          <div className='bg-white rounded-t-xl border-b border-gray-100 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-900 uppercase tracking-wide'>
            <div className='col-span-2'>{t('table.hiredDate')}</div>
            <div className='col-span-4'>{t('table.agent')}</div>
            <div className='col-span-2'>{t('table.rating')}</div>
            <div className='col-span-2'>{t('table.property')}</div>
            <div className='col-span-2'>{t('table.status')}</div>
          </div>

          {/* List Items */}
          <div className='bg-white rounded-b-xl shadow-sm overflow-hidden min-h-[400px]'>
            {agents.length === 0 ? (
              <div className='p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full'>
                <Users className='h-12 w-12 text-gray-300 mb-4' />
                <p className='font-medium'>{t('empty.title')}</p>
                <p className='text-sm text-gray-400 mt-1'>
                  {t('empty.subtitle')}
                </p>
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

          {/* Pagination Controls */}
          {totalElements > 0 && (
            <div className='flex items-center justify-between mt-4 px-2'>
              <div className='text-sm text-gray-500 font-medium'>
                {t('pagination.showing', {
                  from: Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalElements),
                  to: Math.min(currentPage * ITEMS_PER_PAGE, totalElements),
                  total: totalElements,
                })}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8 rounded-lg border-gray-200 hover:bg-white hover:border-gray-300'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8 rounded-lg border-gray-200 hover:bg-white hover:border-gray-300'
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
  );
}

export function ManageAgentPage() {
  return (
    <ManageAgentProvider>
      <ManageAgentContent />
    </ManageAgentProvider>
  );
}
