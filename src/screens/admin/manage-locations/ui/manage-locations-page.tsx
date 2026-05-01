'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import {
  Archive,
  Building2,
  LayoutGrid,
  Map,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { locationQueries } from '@/entities/location/api/location.queries';
import { useCities, useChildrenLocations } from '@/entities/location/api/use-locations';
import { useChangeLocationStatus } from '@/entities/location/api/use-change-location-status';
import type {
  LocationResponse,
  LocationLevel,
  LocationStatus,
} from '@/entities/location/api/location-api.types';
import { DataTable } from '@/shared/ui/data-table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu/dropdown-menu';
import { useDebounce } from '@/shared/lib/hooks';

import { LocationFormDialog } from './location-form-dialog';

type LevelTab = 'ALL' | LocationLevel;

const LEVEL_BADGE_CLASS: Record<LocationLevel, string> = {
  CITY: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  DISTRICT: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  WARD: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const LEVEL_TAB_ICONS: Record<LevelTab, React.ReactNode> = {
  ALL: <LayoutGrid className='h-3.5 w-3.5' />,
  CITY: <Building2 className='h-3.5 w-3.5' />,
  DISTRICT: <Map className='h-3.5 w-3.5' />,
  WARD: <MapPin className='h-3.5 w-3.5' />,
};

const STATUS_BADGE_CLASS: Record<LocationStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  ARCHIVED: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-700',
};

const STATUS_DOT_CLASS: Record<LocationStatus, string> = {
  ACTIVE: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]',
  ARCHIVED: 'bg-slate-500 shadow-[0_0_0_3px_rgba(100,116,139,0.16)]',
};

const PAGE_SIZE = 10;

export function ManageLocationsPage() {
  const t = useTranslations('ManageLocations');

  // Filters
  const [activeTab, setActiveTab] = React.useState<LevelTab>('ALL');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterCityId, setFilterCityId] = React.useState<string>('');
  const [filterDistrictId, setFilterDistrictId] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<LocationStatus | 'ALL'>('ALL');

  // Pagination
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<LocationResponse | undefined>();
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [pendingArchiveLocation, setPendingArchiveLocation] =
    React.useState<LocationResponse | null>(null);

  // Reset pagination when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeTab, debouncedSearch, filterCityId, filterDistrictId, statusFilter]);

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
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    parent_id: queryParentId,
    search: debouncedSearch || undefined,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  };

  const { data, isLoading } = useQuery(locationQueries.adminList(queryParams));
  const changeLocationStatus = useChangeLocationStatus();

  const locations = data?.content ?? [];
  const totalPages = data?.total_pages ?? 0;

  const handleStatusChange = React.useCallback(
    (location: LocationResponse, status: LocationStatus) => {
      if (status === 'ARCHIVED') {
        setPendingArchiveLocation(location);
        setArchiveDialogOpen(true);
        return;
      }

      changeLocationStatus.mutate(
        { id: location.location_id, status },
        {
          onSuccess: () => toast.success(t(`toast.${status.toLowerCase()}Success`)),
          onError: () => toast.error(t(`toast.${status.toLowerCase()}Error`)),
        }
      );
    },
    [changeLocationStatus, t]
  );

  const handleConfirmArchive = React.useCallback(() => {
    if (!pendingArchiveLocation) return;

    changeLocationStatus.mutate(
      { id: pendingArchiveLocation.location_id, status: 'ARCHIVED' },
      {
        onSuccess: () => toast.success(t('toast.archivedSuccess')),
        onError: () => toast.error(t('toast.archivedError')),
      }
    );

    setArchiveDialogOpen(false);
    setPendingArchiveLocation(null);
  }, [changeLocationStatus, pendingArchiveLocation, t]);

  // Per-level count queries for tab badges
  const { data: cityData } = useQuery(locationQueries.adminList({ level: 'CITY', page: 0, size: 1 }));
  const { data: districtData } = useQuery(locationQueries.adminList({ level: 'DISTRICT', page: 0, size: 1 }));
  const { data: wardData } = useQuery(locationQueries.adminList({ level: 'WARD', page: 0, size: 1 }));

  const tabCounts: Record<LevelTab, number | undefined> = {
    ALL: (cityData?.total_elements ?? 0) + (districtData?.total_elements ?? 0) + (wardData?.total_elements ?? 0) || undefined,
    CITY: cityData?.total_elements,
    DISTRICT: districtData?.total_elements,
    WARD: wardData?.total_elements,
  };

  // Table columns
  const columns = React.useMemo<ColumnDef<LocationResponse>[]>(
    () => [
      {
        id: 'no',
        header: t('table.columns.no'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('table.columns.name'),
        cell: ({ row }) => (
          <span className='font-medium text-foreground'>{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'code',
        header: t('table.columns.code'),
        cell: ({ row }) => (
          <code className='rounded-md bg-muted px-2 py-0.5 text-xs font-mono tracking-wide border border-border'>
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
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEVEL_BADGE_CLASS[level]}`}
            >
              {t(`levels.${level}`)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('table.columns.status'),
        cell: ({ row }) => {
          const status = row.original.status;
          if (!status) return <span className='text-muted-foreground text-xs'>—</span>;
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[status]}`} />
              {t(`statuses.${status}`)}
            </span>
          );
        },
      },
      {
        accessorKey: 'used_by_properties_count',
        header: t('table.columns.usedByProperties'),
        cell: ({ row }) => (
          <span className='text-sm tabular-nums text-muted-foreground'>
            {row.original.used_by_properties_count ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: t('table.columns.updatedAt'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.updated_at ? new Date(row.original.updated_at).toLocaleDateString() : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('table.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent'
                  aria-label={t('table.moreActions')}
                >
                  <MoreHorizontal className='h-3.5 w-3.5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-44'>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedLocation(row.original);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className='h-4 w-4' />
                  {t('table.editTooltip')}
                </DropdownMenuItem>
                {row.original.status !== 'ACTIVE' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'ACTIVE')}>
                    <Power className='h-4 w-4' />
                    {t('table.actions.activate')}
                  </DropdownMenuItem>
                )}
                {row.original.status !== 'ARCHIVED' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => handleStatusChange(row.original, 'ARCHIVED')}
                    >
                      <Archive className='h-4 w-4' />
                      {t('table.actions.archive')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleStatusChange, pagination.pageIndex, pagination.pageSize, t]
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
    <div className='flex min-h-full flex-col gap-6 bg-background p-6'>
      {/* Page header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0'>
            <MapPin className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-semibold leading-tight'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground mt-0.5'>{t('description')}</p>
          </div>
        </div>
        <Button onClick={handleAddClick} className='shrink-0'>
          <Plus className='mr-2 h-4 w-4' />
          {t('addLocation')}
        </Button>
      </div>

      {/* Level tabs */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit'>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {LEVEL_TAB_ICONS[tab.value]}
              {tab.label}
              {tabCounts[tab.value] != null && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none ${
                    activeTab === tab.value
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tabCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        className='-mt-3'
        columns={columns}
        data={locations}
        isLoading={isLoading}
        pageCount={totalPages}
        pagination={pagination}
        onPaginationChange={setPagination}
        emptyTitle={t('table.empty.title')}
        emptyDescription={t('table.empty.description')}
        toolbar={
          <div className='flex flex-col gap-3 px-2 py-1 sm:flex-row sm:items-center sm:justify-between'>
            <div className='relative min-w-[240px] flex-1 sm:max-w-md'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
              <Input
                placeholder={t('search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as LocationStatus | 'ALL')}
              >
                <SelectTrigger className='w-full sm:w-[160px]'>
                  <SelectValue placeholder={t('filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>{t('filters.allStatuses')}</SelectItem>
                  <SelectItem value='ACTIVE'>{t('statuses.ACTIVE')}</SelectItem>
                  <SelectItem value='ARCHIVED'>{t('statuses.ARCHIVED')}</SelectItem>
                </SelectContent>
              </Select>

              {(activeTab === 'DISTRICT' || activeTab === 'WARD') && (
                <Select
                  value={filterCityId || 'ALL'}
                  onValueChange={(v) => setFilterCityId(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className='w-full sm:w-[200px]'>
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

              {activeTab === 'WARD' && (
                <Select
                  value={filterDistrictId || 'ALL'}
                  onValueChange={(v) => setFilterDistrictId(v === 'ALL' ? '' : v)}
                  disabled={!filterCityId}
                >
                  <SelectTrigger className='w-full sm:w-[200px]'>
                    <SelectValue
                      placeholder={
                        filterCityId ? t('filters.allDistricts') : t('filters.selectCityFirst')
                      }
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
          </div>
        }
      />

      {/* Create / Edit dialog */}
      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={selectedLocation}
      />

      <Dialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open);
          if (!open) setPendingArchiveLocation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.archiveTitle')}</DialogTitle>
            <DialogDescription>
              {pendingArchiveLocation
                ? t('confirm.archiveDescription', { name: pendingArchiveLocation.name })
                : t('confirm.archive')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setArchiveDialogOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button variant='destructive' onClick={handleConfirmArchive}>
              {t('table.actions.archive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
