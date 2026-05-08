'use client';

import { Suspense } from 'react';
import { MyEngagementsProvider, useMyEngagementsContext } from '@/features/engagement/model/my-engagements-context';
import { EngagementListView } from '@/features/engagement/ui/engagement-list-view';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/shared/ui/spinner';
import { FileSearch } from 'lucide-react';

const MyEngagementsOutlookContent = () => {
  const {
    filteredEngagements,
    isLoading,
    isError,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedEngagement,
    handleEngagementClick,
    handleCancel,
    handleFinish,
    handleAccept,
    handleReject,
    currentUserId,
  } = useMyEngagementsContext();

  const t = useTranslations('Engagement');

  if (isLoading) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center'>
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('page.loadError')}</p>
        </div>
      </div>
    );
  }

  return (
    <EngagementListView
      engagements={filteredEngagements}
      totalElements={filteredEngagements.length}
      isLoading={isLoading}
      isError={isError}
      tab={tab}
      onTabChange={setTab}
      search={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      currentPage={1}
      totalPages={1}
      itemsPerPage={10}
      onPageChange={() => {}}
      selectedEngagement={selectedEngagement}
      onSelect={handleEngagementClick}
      onCancel={handleCancel}
      onFinish={handleFinish}
      onAccept={handleAccept}
      onReject={handleReject}
      currentUserId={currentUserId}
    />
  );
};

export const MyEngagementsPageOutlook = () => {
  return (
    <Suspense>
      <MyEngagementsProvider>
        <MyEngagementsOutlookContent />
      </MyEngagementsProvider>
    </Suspense>
  );
};
