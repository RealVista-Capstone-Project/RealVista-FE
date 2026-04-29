'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { MapPin, Search, Plus, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { locationQueries } from '@/entities/location/api/location.queries';
import { useCities, useChildrenLocations } from '@/entities/location/api/use-locations';
import type { LocationResponse, LocationLevel } from '@/entities/location/api/location-api.types';
import { DataTable } from '@/shared/ui/data-table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useDebounce } from '@/shared/lib/hooks';

import { LocationFormDialog } from './location-form-dialog';

type LevelTab = 'ALL' | LocationLevel;

const LEVEL_BADGE_VARIANTS: Record<LocationLevel, 'default' | 'secondary' | 'outline'> = {
  CITY: 'default',
  DISTRICT: 'secondary',
  WARD: 'outline',
};

const PAGE_SIZE = 15;

export function ManageLocationsPage() {
  const t = useTranslations('ManageLocations');

  // Filters
  const [activeTab, setActiveTab] = React.useState<LevelTab>('ALL');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterCityId, setFilterCityId] = React.useState<string>('');
  const [filterDistrictId, setFilterDistrictId] = React.useState<string>('');

  // Pagination
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<LocationResponse | undefined>();

  // Reset pagination when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeTab, debouncedSearch, filterCityId, filterDistrictId]);

  // Reset district filter when city changes
  React.useEffect(() => {
    setFilterDistrictId('');
  }, [filterCityId]);

  // Reset city & district filters when switching tabs
  React.useEffect(() => {
    setFilterCityId('');
    setFilterDistrictId('');
  }, [activeTab]);

  // Cascading filter data
  const { data: cities = [] } = useCities();
  const { data: districtsForFilter = [] } = useChildrenLocations(
    activeTab === 'WARD' && filterCityId ? filterCityId : undefined
  );

  // Determine parent_id for the query
  const queryParentId =
    activeTab === 'DISTRICT' && filterCityId
      ? filterCityId
      : activeTab === 'WARD' && filterDistrictId
        ? filterDistrictId
        : activeTab === 'WARD' && filterCityId && !filterDistrictId
          ? filterCityId
          : undefined;

  const queryParams = {
    level: activeTab !== 'ALL' ? activeTab : undefined,
    parent_id: queryParentId,
    search: debouncedSearch || undefined,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  };

  const { data, isLoading } = useQuery(locationQueries.adminList(queryParams));

  const locations = data?.content ?? [];
  const totalPages = data?.total_pages ?? 0;

  // Table columns
  const columns = React.useMemo<ColumnDef<LocationResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('table.columns.name'),
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'code',
        header: t('table.columns.code'),
        cell: ({ row }) => (
          <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>
            {row.original.code}
          </code>
        ),
      },
      {
        accessorKey: 'level',
        header: t('table.columns.level'),
        cell: ({ row }) => {
          const level = row.original.level;
          if (!level) return <span className='text-muted-foreground text-xs'>—</span>;
          return (
            <Badge variant={LEVEL_BADGE_VARIANTS[level]}>{t(`levels.${level}`)}</Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('table.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <Button
              variant='ghost'
              size='icon'
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLocation(row.original);
                setDialogOpen(true);
              }}
              aria-label={t('table.columns.actions')}
            >
              <Pencil className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  const handleAddClick = () => {
    setSelectedLocation(undefined);
    setDialogOpen(true);
  };

  const tabs: { value: LevelTab; label: string }[] = [
    { value: 'ALL', label: t('tabs.ALL') },
    { value: 'CITY', label: t('tabs.CITY') },
    { value: 'DISTRICT', label: t('tabs.DISTRICT') },
    { value: 'WARD', label: t('tabs.WARD') },
  ];

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <MapPin className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-semibold'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground'>{t('description')}</p>
          </div>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className='mr-2 h-4 w-4' />
          {t('addLocation')}
        </Button>
      </div>

      {/* Level tabs */}
      <div className='flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit'>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1 min-w-[220px] max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* City filter — shown for Districts and Wards tabs */}
        {(activeTab === 'DISTRICT' || activeTab === 'WARD') && (
          <Select
            value={filterCityId || 'ALL'}
            onValueChange={(v) => setFilterCityId(v === 'ALL' ? '' : v)}
          >
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder={t('filters.allCities')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('filters.allCities')}</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.location_id} value={city.location_id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* District filter — shown for Wards tab, enabled only after a city is selected */}
        {activeTab === 'WARD' && (
          <Select
            value={filterDistrictId || 'ALL'}
            onValueChange={(v) => setFilterDistrictId(v === 'ALL' ? '' : v)}
            disabled={!filterCityId}
          >
            <SelectTrigger className='w-[200px]'>
              <SelectValue
                placeholder={filterCityId ? t('filters.allDistricts') : t('filters.selectCityFirst')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('filters.allDistricts')}</SelectItem>
              {districtsForFilter.map((district) => (
                <SelectItem key={district.location_id} value={district.location_id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={locations}
        isLoading={isLoading}
        pageCount={totalPages}
        pagination={pagination}
        onPaginationChange={setPagination}
        emptyTitle={t('table.empty.title')}
        emptyDescription={t('table.empty.description')}
      />

      {/* Create / Edit dialog */}
      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={selectedLocation}
      />
    </div>
  );
}
