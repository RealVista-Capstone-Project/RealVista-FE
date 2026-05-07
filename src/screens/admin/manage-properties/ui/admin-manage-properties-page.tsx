'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Building2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  Phone,
  UserRoundCog,
  Ruler,
  ImageIcon,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';

import { propertyQueries } from '@/entities/property/api/property.queries';
import { propertyApi } from '@/entities/property/api/property.api';
import type { PropertySummaryResponse } from '@/entities/property/api/property-api.types';
import { listingKeys } from '@/entities/listing/api/keys';
import { useCities, useChildrenLocations } from '@/entities/location/api';
import { useUserSearch } from '@/entities/user/api/use-user-search';
import { UserDetailSheet } from '@/screens/admin/manage-users/ui/user-detail-sheet';
import { DataTable } from '@/shared/ui/data-table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { useDebounce } from '@/shared/lib/hooks';
import { ROUTES } from '@/shared/config/routes';

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED'] as const;

type PropertyStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_BADGE_CLASS: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED:  'bg-blue-50 text-blue-700 border-blue-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  RESERVED:  'bg-purple-50 text-purple-700 border-purple-200',
  SOLD:      'bg-slate-50 text-slate-600 border-slate-200',
  RENTED:    'bg-slate-50 text-slate-600 border-slate-200',
  DRAFT:     'bg-zinc-50 text-zinc-500 border-zinc-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
};

const STATUS_DOT_CLASS: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-emerald-500',
  VERIFIED:  'bg-blue-500',
  PENDING:   'bg-amber-500',
  RESERVED:  'bg-purple-500',
  SOLD:      'bg-slate-400',
  RENTED:    'bg-slate-400',
  DRAFT:     'bg-zinc-400',
  REJECTED:  'bg-red-500',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const badgeClass = STATUS_BADGE_CLASS[status as PropertyStatus] ?? 'bg-muted text-muted-foreground border-border';
  const dotClass = STATUS_DOT_CLASS[status as PropertyStatus] ?? 'bg-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function getInitials(name?: string | null) {
  return name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';
}

function formatLocation(property: PropertySummaryResponse) {
  const location = property.location_info;
  return [location?.ward_name, location?.district_name, location?.city_name].filter(Boolean).join(', ');
}

function formatArea(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString()} m²` : '—';
}

function formatPrice(value?: number | null) {
  return typeof value === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
    : '—';
}

export function AdminManagePropertiesPage() {
  const t = useTranslations('AdminManageProperties');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = React.useState<string>('ALL');
  const [flaggedOnly, setFlaggedOnly] = React.useState(false);
  const [propertyTypeId, setPropertyTypeId] = React.useState<string>('ALL');
  const [cityId, setCityId] = React.useState<string>('ALL');
  const [districtId, setDistrictId] = React.useState<string>('ALL');
  const [wardId, setWardId] = React.useState<string>('ALL');
  const [previewPropertyId, setPreviewPropertyId] = React.useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [ownerDialogProperty, setOwnerDialogProperty] = React.useState<PropertySummaryResponse | null>(null);
  const [ownerEmailInput, setOwnerEmailInput] = React.useState('');

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const debouncedOwnerEmail = useDebounce(ownerEmailInput, 600);
  const { data: foundOwner } = useUserSearch(debouncedOwnerEmail);

  const finalLocationId = wardId !== 'ALL' ? wardId : districtId !== 'ALL' ? districtId : cityId !== 'ALL' ? cityId : undefined;

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, status, propertyTypeId, finalLocationId, flaggedOnly]);

  // Delete confirmation
  const [propertyToDelete, setPropertyToDelete] = React.useState<{ id: string; address: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  const { data: deleteTargetDetail, isLoading: isLoadingDeleteDetail } = useQuery(
    queryOptions({
      queryKey: ['properties', 'detail-for-delete', propertyToDelete?.id],
      queryFn: () => propertyApi.getPropertyDetails(propertyToDelete!.id),
      enabled: !!propertyToDelete?.id && isDeleteConfirmOpen,
      staleTime: 0,
    })
  );
  const activeListingsCount = deleteTargetDetail?.payload?.data?.active_listings?.length ?? 0;

  const { data: propertyTypesData } = useQuery(propertyQueries.propertyTypes());
  const propertyTypes = propertyTypesData?.payload?.data ?? [];

  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useChildrenLocations(cityId !== 'ALL' ? cityId : undefined);
  const { data: wards = [] } = useChildrenLocations(districtId !== 'ALL' ? districtId : undefined);

  const { data: previewDetailData, isLoading: isLoadingPreview } = useQuery(
    queryOptions({
      queryKey: ['properties', 'admin-preview', previewPropertyId],
      queryFn: () => propertyApi.getPropertyDetails(previewPropertyId!),
      enabled: !!previewPropertyId,
      staleTime: 30 * 1000,
    })
  );

  const criteria = {
    keyword: debouncedSearch || undefined,
    status: flaggedOnly ? 'PENDING' : status === 'ALL' ? undefined : status,
    propertyTypeId: propertyTypeId === 'ALL' ? undefined : propertyTypeId,
    locationId: finalLocationId,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  };

  const activeFilterCount = [
    status !== 'ALL',
    propertyTypeId !== 'ALL',
    !!finalLocationId,
    flaggedOnly,
  ].filter(Boolean).length;

  const { data, isLoading } = useQuery(propertyQueries.adminList(criteria));

  const pageData = data?.payload?.data;
  const properties: PropertySummaryResponse[] = pageData?.content ?? [];
  const totalPages = pageData?.total_pages ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (propertyId: string) => propertyApi.adminDeleteProperty(propertyId),
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['properties', 'admin'] });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      setIsDeleteConfirmOpen(false);
      setPropertyToDelete(null);
    },
    onError: (error: unknown) => {
      const message = (error as { payload?: { message?: string } })?.payload?.message;
      toast.error(message || t('deleteError'));
    },
  });

  const reassignOwnerMutation = useMutation({
    mutationFn: ({ propertyId, ownerId }: { propertyId: string; ownerId: string }) =>
      propertyApi.adminUpdateProperty({
        propertyId,
        request: { new_owner_id: ownerId },
    }),
    onSuccess: () => {
      toast.success(t('ownerDialog.success'));
      queryClient.invalidateQueries({ queryKey: ['properties', 'admin'] });
      setOwnerDialogProperty(null);
      setOwnerEmailInput('');
    },
    onError: (error: unknown) => {
      const message = (error as { payload?: { message?: string } })?.payload?.message;
      toast.error(message || t('ownerDialog.error'));
    },
  });

  const handleOpenDeleteConfirm = (id: string, address: string) => {
    setPropertyToDelete({ id, address });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      deleteMutation.mutate(propertyToDelete.id);
    }
  };

  const handleOpenUserDetail = (property: PropertySummaryResponse) => {
    if (!property.owner_id) return;
    setPreviewPropertyId(null);
    setSelectedUserId(property.owner_id);
  };

  const handleOpenOwnerDialog = (property: PropertySummaryResponse) => {
    setOwnerDialogProperty(property);
    setOwnerEmailInput('');
  };

  const handleConfirmOwnerChange = () => {
    if (!ownerDialogProperty || !foundOwner) return;
    reassignOwnerMutation.mutate({
      propertyId: ownerDialogProperty.property_id,
      ownerId: foundOwner.user_id,
    });
  };

  const selectedPreviewSummary = properties.find((property) => property.property_id === previewPropertyId);
  const selectedPreviewDetail = previewDetailData?.payload?.data;
  const previewMedia = selectedPreviewDetail?.media?.find((media) => media.media_type === 'IMAGE') ?? selectedPreviewDetail?.media?.[0];
  const previewImageUrl = previewMedia?.thumbnail_url ?? previewMedia?.media_url ?? selectedPreviewSummary?.thumbnail_url;

  const columns = React.useMemo<ColumnDef<PropertySummaryResponse>[]>(
    () => [
      {
        accessorKey: 'street_address',
        header: t('table.address'),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <MapPin className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
            <div className='flex flex-col min-w-0'>
              <span className='font-medium text-sm truncate max-w-[220px]' title={row.original.street_address}>
                {row.original.street_address || '—'}
              </span>
              {row.original.flagged_for_admin_review && (
                <span className='inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5 w-fit mt-0.5'>
                  <AlertTriangle className='h-2.5 w-2.5' />
                  Cần duyệt
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={t(`statuses.${row.original.status as PropertyStatus}` as any) || row.original.status}
          />
        ),
      },
      {
        accessorKey: 'property_type_info',
        header: t('table.type'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.property_type_info?.property_type_name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'owner_name',
        header: t('table.owner'),
        cell: ({ row }) => {
          const { owner_name, owner_email, owner_avatar_url } = row.original;
          return (
            <div className='flex items-center gap-2.5'>
              <Avatar className='h-8 w-8 shrink-0 border border-border'>
                <AvatarImage src={owner_avatar_url || undefined} alt={owner_name || ''} />
                <AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
                  {getInitials(owner_name)}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col min-w-0'>
                <span className='text-sm font-medium text-foreground truncate'>
                  {owner_name || '—'}
                </span>
                {owner_email && (
                  <span className='truncate text-xs text-muted-foreground'>
                    {owner_email}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('table.actions')}</span>,
        cell: ({ row }) => {
          const property = row.original;
          return (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent'
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className='h-3.5 w-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-44'>
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(
                        `${ROUTES.dashboard.manageProperties}/${property.property_id}/edit` as Parameters<typeof router.push>[0]
                      );
                    }}
                  >
                    <Pencil className='h-4 w-4' />
                    {t('table.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenUserDetail(property);
                    }}
                    disabled={!property.owner_id}
                  >
                    <Eye className='h-4 w-4' />
                    {t('table.viewUser')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenOwnerDialog(property);
                    }}
                  >
                    <UserRoundCog className='h-4 w-4' />
                    {t('table.changeOwner')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDeleteConfirm(property.property_id, property.street_address);
                    }}
                  >
                    <Trash2 className='h-4 w-4' />
                    {t('table.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, router]
  );

  return (
    <div className='flex min-h-full flex-col gap-6 bg-background p-6'>
      {/* Page header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0'>
            <Building2 className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-semibold leading-tight'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground mt-0.5'>{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={properties}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={totalPages}
        onRowClick={(property) => setPreviewPropertyId(property.property_id)}
        isRowSelected={(property) => property.property_id === previewPropertyId}
        emptyTitle={t('table.empty.title')}
        emptyDescription={t('table.empty.description')}
        toolbar={
          <div className='flex flex-col gap-3 px-2 py-1 sm:flex-row'>
            <div className='relative w-full min-w-[220px] sm:max-w-md'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            <Button
              variant={flaggedOnly ? 'default' : 'outline'}
              className={flaggedOnly ? 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
              onClick={() => setFlaggedOnly((prev) => !prev)}
            >
              <AlertTriangle className='h-4 w-4' />
              Cần duyệt
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='justify-between sm:w-[170px]'>
                  <span className='inline-flex items-center gap-2'>
                    <SlidersHorizontal className='h-4 w-4' />
                    {t('filters.title')}
                  </span>
                  {activeFilterCount > 0 && (
                    <span className='rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground'>
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-[320px] space-y-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-medium'>{t('filters.title')}</p>
                    <p className='text-xs text-muted-foreground'>{t('filters.description')}</p>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setStatus('ALL');
                        setPropertyTypeId('ALL');
                        setCityId('ALL');
                        setDistrictId('ALL');
                        setWardId('ALL');
                        setFlaggedOnly(false);
                      }}
                    >
                      {t('filters.reset')}
                    </Button>
                  )}
                </div>

                <div className='space-y-3'>
                  <div className='space-y-1.5'>
                    <Label>{t('filters.statusPlaceholder')}</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('filters.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>{t('filters.allStatuses')}</SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`statuses.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label>{t('filters.propertyTypePlaceholder')}</Label>
                    <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('filters.propertyTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>{t('filters.allPropertyTypes')}</SelectItem>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.property_type_id} value={type.property_type_id}>
                            {type.property_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-3'>
                    <div className='space-y-1.5'>
                      <Label>{t('filters.cityPlaceholder')}</Label>
                      <Select
                        value={cityId}
                        onValueChange={(value) => {
                          setCityId(value);
                          setDistrictId('ALL');
                          setWardId('ALL');
                        }}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('filters.cityPlaceholder')} />
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
                    </div>

                    <div className='space-y-1.5'>
                      <Label>{t('filters.districtPlaceholder')}</Label>
                      <Select
                        value={districtId}
                        onValueChange={(value) => {
                          setDistrictId(value);
                          setWardId('ALL');
                        }}
                        disabled={cityId === 'ALL'}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('filters.districtPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>{t('filters.allDistricts')}</SelectItem>
                          {districts.map((district) => (
                            <SelectItem key={district.location_id} value={district.location_id}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-1.5'>
                      <Label>{t('filters.wardPlaceholder')}</Label>
                      <Select value={wardId} onValueChange={setWardId} disabled={districtId === 'ALL'}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('filters.wardPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>{t('filters.allWards')}</SelectItem>
                          {wards.map((ward) => (
                            <SelectItem key={ward.location_id} value={ward.location_id}>
                              {ward.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      <Sheet open={!!previewPropertyId} onOpenChange={(open) => !open && setPreviewPropertyId(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl p-0 gap-0'>
          <SheetHeader className='px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent'>
            <SheetTitle className='text-base font-bold'>{t('preview.title')}</SheetTitle>
            <SheetDescription>
              {selectedPreviewSummary?.street_address ?? t('preview.loading')}
            </SheetDescription>
          </SheetHeader>

          {isLoadingPreview ? (
            <div className='flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('preview.loading')}
            </div>
          ) : (
            <div className='space-y-5 p-6'>
              <div className='overflow-hidden rounded-xl border border-border bg-muted/30'>
                {previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImageUrl} alt='' className='h-52 w-full object-cover' />
                ) : (
                  <div className='flex h-52 w-full flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <ImageIcon className='h-8 w-8' />
                    <span className='text-sm'>{t('preview.noImage')}</span>
                  </div>
                )}
              </div>

              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <h2 className='text-lg font-semibold leading-tight'>
                    {selectedPreviewDetail?.street_address ?? selectedPreviewSummary?.street_address ?? '—'}
                  </h2>
                  <p className='mt-1 flex items-center gap-1.5 text-sm text-muted-foreground'>
                    <MapPin className='h-3.5 w-3.5 shrink-0' />
                    {selectedPreviewSummary ? formatLocation(selectedPreviewSummary) || '—' : '—'}
                  </p>
                </div>
                {selectedPreviewSummary && (
                  <StatusBadge
                    status={selectedPreviewSummary.status}
                    label={t(`statuses.${selectedPreviewSummary.status as PropertyStatus}` as any) || selectedPreviewSummary.status}
                  />
                )}
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>{t('preview.type')}</p>
                  <p className='mt-1 text-sm font-medium'>
                    {selectedPreviewSummary?.property_type_info?.property_type_name ?? '—'}
                  </p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>{t('preview.area')}</p>
                  <p className='mt-1 flex items-center gap-1.5 text-sm font-medium'>
                    <Ruler className='h-3.5 w-3.5 text-muted-foreground' />
                    {formatArea(selectedPreviewDetail?.usable_size_m2 ?? selectedPreviewSummary?.usable_size_m2)}
                  </p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>{t('preview.rentPrice')}</p>
                  <p className='mt-1 text-sm font-medium'>
                    {formatPrice(selectedPreviewDetail?.price_range?.rent?.min ?? selectedPreviewSummary?.price_range?.rent?.min)}
                  </p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>{t('preview.buyPrice')}</p>
                  <p className='mt-1 text-sm font-medium'>
                    {formatPrice(selectedPreviewDetail?.price_range?.buy?.min ?? selectedPreviewSummary?.price_range?.buy?.min)}
                  </p>
                </div>
              </div>

              <div className='rounded-lg border border-border p-3'>
                <p className='mb-2 text-xs text-muted-foreground'>{t('preview.owner')}</p>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-2.5'>
                    <Avatar className='h-9 w-9 shrink-0 border border-border'>
                      <AvatarImage
                        src={selectedPreviewSummary?.owner_avatar_url || undefined}
                        alt={selectedPreviewSummary?.owner_name || ''}
                      />
                      <AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
                        {getInitials(selectedPreviewSummary?.owner_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{selectedPreviewSummary?.owner_name ?? '—'}</p>
                      {selectedPreviewSummary?.owner_email && (
                        <p className='truncate text-xs text-muted-foreground'>
                          {selectedPreviewSummary.owner_email}
                        </p>
                      )}
                      {selectedPreviewSummary?.owner_phone && (
                        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Phone className='h-3 w-3' />
                          {selectedPreviewSummary.owner_phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => selectedPreviewSummary && handleOpenUserDetail(selectedPreviewSummary)}
                    disabled={!selectedPreviewSummary?.owner_id}
                  >
                    <Eye className='h-4 w-4' />
                    {t('table.viewUser')}
                  </Button>
                </div>
              </div>

              <div className='rounded-lg border border-border p-3'>
                <p className='mb-1 text-xs text-muted-foreground'>{t('preview.description')}</p>
                <p className='whitespace-pre-line text-sm leading-relaxed text-foreground/80'>
                  {selectedPreviewDetail?.descriptions ?? selectedPreviewSummary?.description ?? '—'}
                </p>
              </div>

              <div className='flex gap-2 pt-1'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() =>
                    selectedPreviewSummary &&
                    router.push(
                      `${ROUTES.dashboard.manageProperties}/${selectedPreviewSummary.property_id}/edit` as Parameters<typeof router.push>[0]
                    )
                  }
                  disabled={!selectedPreviewSummary}
                >
                  <Pencil className='h-4 w-4' />
                  {t('table.edit')}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <UserDetailSheet
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />

      <Dialog
        open={!!ownerDialogProperty}
        onOpenChange={(open) => {
          if (!open) {
            setOwnerDialogProperty(null);
            setOwnerEmailInput('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ownerDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('ownerDialog.description', {
                address: ownerDialogProperty?.street_address ?? '',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-1'>
            <div className='rounded-lg border border-border p-3'>
              <p className='text-xs text-muted-foreground'>{t('ownerDialog.currentOwner')}</p>
              <div className='mt-2 flex items-center gap-2.5'>
                <Avatar className='h-8 w-8 border border-border'>
                  <AvatarImage
                    src={ownerDialogProperty?.owner_avatar_url || undefined}
                    alt={ownerDialogProperty?.owner_name || ''}
                  />
                  <AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
                    {getInitials(ownerDialogProperty?.owner_name)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{ownerDialogProperty?.owner_name ?? '—'}</p>
                  {ownerDialogProperty?.owner_email && (
                    <p className='truncate text-xs text-muted-foreground'>
                      {ownerDialogProperty.owner_email}
                    </p>
                  )}
                  {ownerDialogProperty?.owner_phone && (
                    <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Phone className='h-3 w-3' />
                      {ownerDialogProperty.owner_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='newOwnerEmail'>{t('ownerDialog.newOwner')}</Label>
              <Input
                id='newOwnerEmail'
                type='email'
                placeholder={t('ownerDialog.emailPlaceholder')}
                value={ownerEmailInput}
                onChange={(event) => setOwnerEmailInput(event.target.value)}
              />
              {ownerEmailInput && foundOwner && (
                <div className='flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700'>
                  <Avatar className='h-6 w-6 border border-emerald-100'>
                    <AvatarFallback className='bg-white text-[10px] font-bold text-emerald-700'>
                      {getInitials(foundOwner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {t('ownerDialog.ownerFound')}: {foundOwner.full_name} ({foundOwner.email})
                  </span>
                </div>
              )}
              {ownerEmailInput && debouncedOwnerEmail === ownerEmailInput && !foundOwner && (
                <p className='text-xs text-muted-foreground'>{t('ownerDialog.ownerNotFound')}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setOwnerDialogProperty(null);
                setOwnerEmailInput('');
              }}
            >
              {t('ownerDialog.cancel')}
            </Button>
            <Button
              onClick={handleConfirmOwnerChange}
              disabled={!foundOwner || reassignOwnerMutation.isPending}
            >
              {reassignOwnerMutation.isPending ? t('ownerDialog.saving') : t('ownerDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', { address: propertyToDelete?.address ?? '' })}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-1'>
            {isLoadingDeleteDetail && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('deleteDialog.checkingListings')}
              </div>
            )}

            {!isLoadingDeleteDetail && activeListingsCount > 0 && (
              <div className='rounded-lg bg-orange-50 border border-orange-100 p-3 flex gap-3'>
                <AlertTriangle className='h-5 w-5 text-orange-600 shrink-0 mt-0.5' />
                <p className='text-xs text-orange-800 font-medium leading-normal'>
                  {t('deleteDialog.activeListingsWarning', { count: activeListingsCount })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteConfirmOpen(false)}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || isLoadingDeleteDetail}
            >
              {deleteMutation.isPending ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
