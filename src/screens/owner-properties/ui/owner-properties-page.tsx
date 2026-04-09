'use client';

import {
  OwnerPropertiesProvider,
  useOwnerPropertiesContext,
} from '@/features/agent-proposal/model/owner-properties-context';
import { OwnerPropertyCard } from '@/features/agent-proposal/ui/owner-property-card';
import { OwnerPropertyDetailPanel } from '@/features/agent-proposal/ui/owner-property-detail-panel';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { Input } from '@/shared/ui/input';
import { Search, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';

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
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-98 border-t-main-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 shadow-sm'>
            <Home className='h-8 w-8 text-red-400' />
          </div>
          <p className='font-semibold text-gray-800'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col overflow-hidden sm:flex-row'>
      {/* ── Left Sidebar ── */}
      <aside
        className={cn(
          'flex-col border-r border-purple-92/50 bg-white transition-all duration-300',
          isMobile
            ? selectedProperty
              ? 'hidden'
              : 'flex w-full'
            : 'flex w-1/2'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-purple-92/50 p-4 sm:p-6'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-bold text-main-black'>{t('pageTitle')}</h2>
              <div className='flex items-center justify-center rounded-lg bg-main-primary px-2 py-1'>
                <span className='text-sm font-bold text-white'>{totalElements}</span>
              </div>
            </div>
            <p className='mt-1 text-sm text-main-secondary/60'>{t('pageSubtitle')}</p>
          </div>

          {/* Search bar */}
          <div className='border-b border-purple-92/50 p-4 sm:p-6'>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                <Search className='h-5 w-5 text-main-secondary/50' strokeWidth={2} />
              </div>
              <Input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('filter.searchPlaceholder')}
                className='h-14 w-full rounded-lg border-2 border-purple-92 bg-purple-98 pl-12 pr-4 text-base font-medium text-main-black placeholder:text-main-secondary/50 focus:border-main-primary focus:outline-none focus-visible:ring-0'
              />
            </div>
          </div>

          {/* Properties List */}
          <div className='flex-1 overflow-y-auto'>
            {properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-8 text-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50'>
                  <Home className='h-8 w-8 text-indigo-300' />
                </div>
                <div>
                  <p className='font-semibold text-gray-700'>{t('empty.title')}</p>
                  <p className='mt-1 text-sm text-gray-400'>{t('empty.subtitle')}</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-purple-92/50'>
                {properties.map((property) => (
                  <OwnerPropertyCard
                    key={property.property_id}
                    property={property}
                    isSelected={selectedProperty?.property_id === property.property_id}
                    onClick={handlePropertyClick}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='border-t border-purple-92/50 bg-white py-6'>
                    <RealVistaPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(p) => setCurrentPage(() => p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Right Detail Panel ── */}
      <main
        className={cn(
          'flex-1 overflow-y-auto bg-purple-98',
          isMobile ? (selectedProperty ? 'block' : 'hidden') : 'block'
        )}
      >
        {selectedProperty ? (
          <OwnerPropertyDetailPanel
            key={selectedProperty.property_id}
            property={selectedProperty}
            onBack={() => setSelectedProperty(null)}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-main-secondary/60'>{t('empty.selectProperty')}</p>
          </div>
        )}
      </main>
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
