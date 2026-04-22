'use client';

import * as React from 'react';
import {
  ManageRentalContractProvider,
  useManageRentalContractContext,
} from '@/features/rental-contract/model/manage-rental-contract-context';
import { ManageRentalContractListView } from '@/features/rental-contract/ui/manage-rental-contract-list-view';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/shared/ui/spinner';
import { FileSearch } from 'lucide-react';

function ManageRentalContractContent() {
  const {
    contracts,
    currentPage,
    isError,
    isLoading,
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    statusFilter,
    setCurrentPage,
    totalElements,
    totalPages,
  } = useManageRentalContractContext();

  const t = useTranslations('ManageRentalContract');

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <ManageRentalContractListView
      contracts={contracts}
      totalElements={totalElements}
      isLoading={isLoading}
      isError={isError}
      search={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={10}
      onPageChange={setCurrentPage}
    />
  );
}

export function ManageRentalContractPage() {
  return (
    <ManageRentalContractProvider>
      <ManageRentalContractContent />
    </ManageRentalContractProvider>
  );
}