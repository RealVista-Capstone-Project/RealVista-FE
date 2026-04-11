'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Edit, Eye, Home, ShieldCheck, Box } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/shared/ui/select';
import { DataTable } from '@/shared/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property/api/property.queries';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { AgentVerificationModal } from '@/features/property-management/ui/components/agent-verification-modal';
import { ThreeDPromoBanner } from '@/widgets/billing';
import type {
  PropertySummaryResponse,
  PropertyMediaItem,
} from '@/entities/property/api/property-api.types';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const PROPERTY_STATUSES = [
  'DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED',
] as const;

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

function usePropertyColumns(
  t: ReturnType<typeof useTranslations<'PropertyDashboard'>>,
  handleVerifyClick: (property: PropertySummaryResponse) => void,
): ColumnDef<PropertySummaryResponse, unknown>[] {
  return React.useMemo(
    () => [
      {
        id: 'image',
        header: () => t('colImage'),
        cell: ({ row }) => {
          const property = row.original;
          return (
            <div className='w-24 h-16 rounded-lg overflow-hidden relative bg-slate-100 dark:bg-slate-800'>
              {property.media && property.media.length > 0 ? (
                <Image
                  src={
                    property.media.find((m: PropertyMediaItem) => m.is_primary)
                      ?.media_url || property.media[0].media_url
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
          );
        },
      },
      {
        id: 'address',
        header: () => t('colAddress'),
        cell: ({ row }) => {
          const property = row.original;
          return (
            <div>
              <div className='font-medium text-slate-900 dark:text-white max-w-xs truncate'>
                {property.street_address}
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                ID: {property.property_id.substring(0, 8)}...
              </div>
            </div>
          );
        },
      },
      {
        id: 'type',
        header: () => t('colType'),
        cell: ({ row }) => {
          const property = row.original;
          const typeName = property.property_type_info?.property_type_name ?? '\u2014';
          return (
            <span className='inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200'>
              {typeName}
            </span>
          );
        },
      },
      {
        id: 'location',
        header: () => t('colLocation'),
        cell: ({ row }) => {
          const property = row.original;
          const { location_info } = property;
          if (!location_info?.district_name && !location_info?.city_name) {
            return <span className='text-sm text-muted-foreground'>{'\u2014'}</span>;
          }
          const parts = [location_info.district_name, location_info.city_name].filter(Boolean);
          return (
            <span className='text-sm text-slate-700 dark:text-slate-300'>
              {parts.join(', ')}
            </span>
          );
        },
      },
      {
        id: 'size',
        header: () => t('colSize'),
        cell: ({ row }) => {
          const property = row.original;
          if (property.land_size_m2 == null) {
            return <span className='text-sm text-muted-foreground'>{'\u2014'}</span>;
          }
          return (
            <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
              {property.land_size_m2} m&sup2;
            </span>
          );
        },
      },
      {
        id: 'status',
        header: () => t('colStatus'),
        cell: ({ row }) => {
          const property = row.original;
          return (
            <Badge
              variant='secondary'
              className={`border-none ${getStatusColor(property.status)}`}
            >
              {t(`status${property.status}` as Parameters<typeof t>[0])}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className='text-right block'>{t('colActions')}</span>
        ),
        cell: ({ row }) => {
          const property = row.original;
          return (
            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10'
                asChild
              >
                <Link href={`/dashboard/property/${property.property_id}/edit`}>
                  <Edit className='w-4 h-4' />
                  <span className='sr-only'>
                    {t('editAction')}
                  </span>
                </Link>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='relative inline-flex'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      asChild
                    >
                      <Link href={`/dashboard/property/${property.property_id}/3d`}>
                        <Box className='w-4 h-4' />
                        <span className='sr-only'>
                          {t('3dAction')}
                        </span>
                      </Link>
                    </Button>
                    {!property.has_3d && (
                      <span className='absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                        <span className='relative inline-flex rounded-full h-3 w-3 bg-amber-500' />
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                {!property.has_3d && (
                  <TooltipContent side='top'>
                    {t('threeDDotTooltip')}
                  </TooltipContent>
                )}
              </Tooltip>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              >
                <Eye className='w-4 h-4' />
                <span className='sr-only'>{t('viewAction')}</span>
              </Button>
              {property.status === 'PENDING' && (
                <Button
                  variant='default'
                  size='sm'
                  className='rounded-full h-8 px-3 text-xs gap-1 bg-primary'
                  onClick={() => handleVerifyClick(property)}
                >
                  <ShieldCheck className='w-3 h-3' />
                  {t('verifyAction')}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, handleVerifyClick],
  );
}

export default function PropertyDashboardPage() {
  const t = useTranslations('PropertyDashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncedSearch = useDebounce(searchQuery, 500);

  const {
    data: propertiesResponse,
    isLoading,
  } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page: pagination.pageIndex,
      size: pagination.pageSize,
    })
  );

  const properties = propertiesResponse?.payload.data.content || [];
  const totalPages =
    propertiesResponse?.payload.data.total_pages ??
    propertiesResponse?.payload.data.totalPages ??
    0;

  const [selectedProperty, setSelectedProperty] = useState<PropertySummaryResponse | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleVerifyClick = React.useCallback((property: PropertySummaryResponse) => {
    setSelectedProperty(property);
    setIsVerifyModalOpen(true);
  }, []);

  const columns = usePropertyColumns(t, handleVerifyClick);

  return (
    <div className='h-full flex-1'>
      <div className='h-full flex-1 mx-auto px-6 py-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
              {t('pageTitle')}
            </h1>
            <p className='text-muted-foreground mt-2'>
              {t('pageDesc')}
            </p>
          </div>
          <Link href='/dashboard/property/create'>
            <Button size='lg' className='rounded-full shadow-md font-semibold gap-2'>
              <Plus className='w-5 h-5' />
              {t('createNew')}
            </Button>
          </Link>
        </div>

        {/* 3D Tour promo banner */}
        <div className='mt-3'>
          <ThreeDPromoBanner />
        </div>

        {/* Data Table */}
        <div className='mt-3'>
          <DataTable
            columns={columns}
            data={properties}
            pageCount={totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            pageInfoText={(current, total) => t('pageInfo', { current, total })}
            toolbar={
              <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
                <div className='relative w-full sm:max-w-md'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    className='pl-10 bg-white dark:bg-slate-900/50'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger className='w-[180px] rounded-lg border-grey-200'>
                      <SelectValue placeholder={t('filterStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>{t('allStatuses')}</SelectItem>
                      {PROPERTY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`status${status}` as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            emptyIcon={
              <div className='w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4'>
                <Home className='w-10 h-10 text-slate-400' />
              </div>
            }
            emptyTitle={t('noProperties')}
            emptyDescription={t('noPropertiesDesc')}
          />
        </div>

        {/* Agent Verification Modal */}
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
    </div>
  );
}
