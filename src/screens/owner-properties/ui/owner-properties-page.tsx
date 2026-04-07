'use client';

import {
  OwnerPropertiesProvider,
  useOwnerPropertiesContext,
} from '@/features/agent-proposal/model/owner-properties-context';
import { OwnerPropertyCard } from '@/features/agent-proposal/ui/owner-property-card';
import { OwnerPropertySheet } from '@/features/agent-proposal/ui/owner-property-detail-panel';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Search, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

function OwnerPropertiesContent() {
  const {
    properties,
    isLoading,
    isError,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    selectedProperty,
    setSelectedProperty,
    totalPages,
    totalElements,
    ITEMS_PER_PAGE,
    handlePropertyClick,
  } = useOwnerPropertiesContext();

  const t = useTranslations('OwnerProperties');

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#F7F7FD] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-10 w-10 rounded-full border-[3px] border-main-primary border-t-transparent animate-spin' />
          <p className='text-sm text-gray-500 font-medium tracking-wide'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='min-h-screen bg-[#F7F7FD] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3 text-center max-w-xs'>
          <div className='h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center shadow-sm'>
            <Home className='h-8 w-8 text-red-400' />
          </div>
          <p className='font-semibold text-gray-800'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F7F7FD] font-sans'>
      <div className='container mx-auto px-6 py-6'>

        {/* Page header */}
        <div className='mb-6'>
          <h1 className='text-xl font-bold text-gray-900'>{t('pageTitle')}</h1>
          <p className='text-sm text-gray-500 mt-1'>{t('pageSubtitle')}</p>
        </div>

        {/* Search bar */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center'>
          <div className='relative flex-1 w-full'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
            <Input
              placeholder={t('filter.searchPlaceholder')}
              className='pl-9 bg-gray-50 border-transparent rounded-xl h-9 text-sm focus-visible:ring-indigo-200'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {totalElements > 0 && (
            <span className='text-xs text-gray-400 whitespace-nowrap font-medium'>
              {t('filter.resultCount', { count: totalElements })}
            </span>
          )}
        </div>

        {/* Card grid */}
        {properties.length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-[400px] gap-4 text-center'>
            <div className='h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center'>
              <Home className='h-8 w-8 text-indigo-300' />
            </div>
            <div>
              <p className='font-semibold text-gray-700'>{t('empty.title')}</p>
              <p className='text-sm text-gray-400 mt-1'>{t('empty.subtitle')}</p>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {properties.map((property) => (
              <OwnerPropertyCard
                key={property.property_id}
                property={property}
                isSelected={selectedProperty?.property_id === property.property_id}
                onClick={handlePropertyClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalElements > 0 && (
          <div className='flex items-center justify-between mt-8 px-1'>
            <p className='text-xs text-gray-400 font-medium'>
              {t('pagination.showing', {
                from: Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalElements),
                to: Math.min(currentPage * ITEMS_PER_PAGE, totalElements),
                total: totalElements,
              })}
            </p>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 rounded-lg border-gray-200 hover:border-main-primary hover:text-main-primary hover:bg-indigo-50 transition-colors'
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
                className='h-8 w-8 rounded-lg border-gray-200 hover:border-main-primary hover:text-main-primary hover:bg-indigo-50 transition-colors'
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet — slides in from right */}
      <OwnerPropertySheet
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
}

export function OwnerPropertiesPage() {
  return (
    <OwnerPropertiesProvider>
      <OwnerPropertiesContent />
    </OwnerPropertiesProvider>
  );
}
