'use client';

import { MyEngagementsProvider, useMyEngagementsContext } from '@/features/engagement/model/my-engagements-context';
import { EngagementListView } from '@/features/engagement/ui/engagement-list-view';

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

  return (
    <EngagementListView
      engagements={filteredEngagements}
      isLoading={isLoading}
      isError={isError}
      tab={tab}
      onTabChange={setTab}
      search={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
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
    <MyEngagementsProvider>
      <MyEngagementsOutlookContent />
    </MyEngagementsProvider>
  );
};
