'use client';

import { useTranslations } from 'next-intl';
import { Settings, Plus, Search, Edit, Eye, Home, ShieldCheck, Box } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property/api/property.queries';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { AgentVerificationModal } from '@/features/property-management/ui/components/agent-verification-modal';
import type { PropertySummaryResponse, PropertyMediaItem } from '@/entities/property/api/property-api.types';

export default function PropertyDashboardPage() {
  const t = useTranslations('PropertyDashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const {
    data: propertiesResponse,
    isLoading,
    isError,
  } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch,
      page,
      size: pageSize,
    })
  );

  const properties = propertiesResponse?.payload.data.content || [];

  const [selectedProperty, setSelectedProperty] = useState<PropertySummaryResponse | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleVerifyClick = (property: PropertySummaryResponse) => {
    setSelectedProperty(property);
    setIsVerifyModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400';
      case 'SOLD':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'RESERVED':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'PENDING':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      case 'VERIFIED':
        return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className='container py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
            {t('pageTitle', { default: 'Property Management' })}
          </h1>
          <p className='text-muted-foreground mt-2'>
            {t('pageDesc', {
              default: 'Manage your property listings, viewed stats, and active status.',
            })}
          </p>
        </div>
        <Link href='/dashboard/property/create'>
          <Button size='lg' className='rounded-full shadow-md font-semibold gap-2'>
            <Plus className='w-5 h-5' />
            {t('createNew', { default: 'Create Property' })}
          </Button>
        </Link>
      </div>

      <div className='bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between'>
        <div className='relative w-full sm:max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder={t('searchPlaceholder', { default: 'Search by title, location or ID...' })}
            className='pl-10 bg-slate-50 dark:bg-slate-900/50'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0); // Reset to first page on new search
            }}
          />
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='icon' className='rounded-full'>
            <Settings className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='flex justify-center p-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      ) : isError || !properties || properties.length === 0 ? (
        <div className='flex flex-col items-center justify-center p-12 lg:p-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 text-center'>
          <div className='w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6'>
            <Home className='w-10 h-10 text-slate-400' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>
            {t('noProperties', { default: 'No Properties Found' })}
          </h3>
          <p className='text-muted-foreground max-w-sm mb-6'>
            {t('noPropertiesDesc', {
              default:
                "You haven't added any properties yet. Click the button below to get started.",
            })}
          </p>
          <Link href='/dashboard/property/create'>
            <Button variant='default' className='rounded-full gap-2 px-8'>
              <Plus className='w-4 h-4' />
              {t('createNew', { default: 'Create Property' })}
            </Button>
          </Link>
        </div>
      ) : (
        <div className='bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800'>
                <tr>
                  <th scope='col' className='px-6 py-4 font-medium'>
                    {t('colImage', { default: 'Image' })}
                  </th>
                  <th scope='col' className='px-6 py-4 font-medium'>
                    {t('colAddress', { default: 'Property Details' })}
                  </th>
                  <th scope='col' className='px-6 py-4 font-medium'>
                    {t('colType', { default: 'Type' })}
                  </th>
                  <th scope='col' className='px-6 py-4 font-medium'>
                    {t('colStatus', { default: 'Status' })}
                  </th>
                  <th scope='col' className='px-6 py-4 font-medium text-right'>
                    {t('colActions', { default: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {properties.map((property) => (
                  <tr
                    key={property.property_id}
                    className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='w-24 h-16 rounded-lg overflow-hidden relative bg-slate-100 dark:bg-slate-800'>
                        {property.media && property.media.length > 0 ? (
                          <Image
                            src={
                              property.media.find((m: PropertyMediaItem) => m.is_primary)?.media_url ||
                              property.media[0].media_url
                            }
                            alt={property.street_address}
                            fill
                            className='object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <Home className='w-6 h-6 text-slate-400' />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='font-medium text-slate-900 dark:text-white max-w-xs truncate'>
                        {property.street_address}
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        ID: {property.property_id.substring(0, 8)}...
                      </div>
                      {property.land_size_m2 && (
                        <div className='text-xs font-medium text-slate-500 mt-1'>
                          {property.land_size_m2} m²
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200'>
                        {property.property_type_id.substring(0, 8)}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Badge
                        variant={'secondary'}
                        className={`border-none ${getStatusColor(property.status)}`}
                      >
                        {t(`status${property.status}` as any, { default: property.status })}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex items-center justify-end gap-1.5'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10'
                          asChild
                        >
                          <Link href={`/dashboard/property/${property.property_id}/edit`}>
                            <Edit className='w-4 h-4' />
                            <span className='sr-only'>{t('editAction', { default: 'Edit' })}</span>
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                          asChild
                        >
                          <Link href={`/dashboard/property/${property.property_id}/3d`}>
                            <Box className='w-4 h-4' />
                            <span className='sr-only'>{t('3dAction', { default: '3D Management' })}</span>
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        >
                          <Eye className='w-4 h-4' />
                          <span className='sr-only'>{t('viewAction', { default: 'View' })}</span>
                        </Button>
                        {property.status === 'PENDING' && (
                          <Button
                            variant='default'
                            size='sm'
                            className='rounded-full h-8 px-3 text-xs gap-1 bg-primary'
                            onClick={() => handleVerifyClick(property)}
                          >
                            <ShieldCheck className='w-3 h-3' />
                            {t('verifyAction', { default: 'Verify' })}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedProperty && (
        <AgentVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setSelectedProperty(null);
          }}
          propertyId={selectedProperty.property_id}
          ownerName={selectedProperty.owner_name || ''}
          ownerPhone={selectedProperty.owner_phone || ''}
        />
      )}
    </div>
  );
}
