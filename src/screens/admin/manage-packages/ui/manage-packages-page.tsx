'use client';

import * as React from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Package,
  Search,
  Plus,
  Rocket,
  CreditCard,
  Gift,
  Trash2,
  Pencil,
  Copy,
  Eye,
  Layers,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Power,
  MoreHorizontal,
  ArrowUpDown,
  Flame,
  Star,
  Filter,
} from 'lucide-react';

import {
  adminBillingApi,
  billingKeys,
  billingQueries,
  type FeaturePackage,
  type BoostPackage,
} from '@/entities/billing';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { DataTable } from '@/shared/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks';

import { PackageFormSheet } from './package-form-sheet';
import { PackageDetailSheet } from './package-detail-sheet';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number, freeLabel: string): string {
  if (price === 0) return freeLabel;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDuration(
  days: number,
  t: ReturnType<typeof useTranslations<'ManagePackages'>>
): string {
  if (days === -1) return t('duration.noExpiry');
  if (days === 1) return t('duration.oneDay');
  if (days % 30 === 0 && days > 0) {
    const months = days / 30;
    return months === 1
      ? t('duration.oneMonth')
      : t('duration.months', { months });
  }
  return t('duration.days', { days });
}

const FEATURE_TYPE_CONFIG = {
  LISTING: {
    labelKey: 'featureType.LISTING' as const,
    icon: Layers,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  '3D_TOUR': {
    labelKey: 'featureType.3D_TOUR' as const,
    icon: TrendingUp,
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  AI_REQUEST: {
    labelKey: 'featureType.AI_REQUEST' as const,
    icon: Sparkles,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
} as const;

/** Normalise raw API value → canonical key, e.g. "_3D_TOUR" → "3D_TOUR" */
function normalizeFeatureType(featureType: string): string {
  return String(featureType ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getFeatureTypeConfig(featureType: string) {
  // Strip leading/trailing underscores so "_3D_TOUR" normalises to "3D_TOUR"
  const key = normalizeFeatureType(featureType) as keyof typeof FEATURE_TYPE_CONFIG;
  return FEATURE_TYPE_CONFIG[key] ?? FEATURE_TYPE_CONFIG['LISTING'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs'>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          iconClass ?? 'bg-primary/10 text-primary'
        )}
      >
        {icon}
      </div>
      <div className='min-w-0'>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xl font-bold tabular-nums text-foreground'>{value}</span>
          {sub && <span className='text-xs text-muted-foreground'>{sub}</span>}
        </div>
        <p className='text-[11px] text-muted-foreground truncate'>{label}</p>
      </div>
    </div>
  );
}

function ActiveToggle({
  isActive,
  onActivate,
  onDeactivate,
  disabled,
  activateLabel,
  deactivateLabel,
}: {
  isActive?: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  disabled?: boolean;
  activateLabel: string;
  deactivateLabel: string;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const t = useTranslations('ManagePackages');
  if (isActive === undefined) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* stopPropagation prevents the row's onRowClick from firing when the toggle is clicked */}
        <div
          className='flex items-center gap-2'
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={isActive}
            disabled={disabled}
            onCheckedChange={(checked) => (checked ? onActivate() : onDeactivate())}
            className='data-[state=checked]:bg-emerald-500'
          />
          <span
            className={cn(
              'text-xs font-semibold',
              isActive ? 'text-emerald-600' : 'text-muted-foreground'
            )}
          >
            {isActive ? t('status.active') : t('status.inactive')}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side='top'>
        {isActive ? deactivateLabel : activateLabel}
      </TooltipContent>
    </Tooltip>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  activeCount,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150',
        active
          ? 'bg-white text-foreground shadow-sm border border-border/60'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none min-w-[18px]',
            active
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {activeCount}/{count}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Packages Tab
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionPackagesTab({ onAddClick }: { onAddClick: () => void }) {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [featureTypeFilter, setFeatureTypeFilter] = React.useState<
    FeaturePackage['feature_type'] | 'ALL'
  >('ALL');
  const [includeInactive, setIncludeInactive] = React.useState(true);
  const [sortKey, setSortKey] = React.useState<'name' | 'price' | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc' | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<FeaturePackage | null>(null);
  const [detailPackage, setDetailPackage] = React.useState<FeaturePackage | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<FeaturePackage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const { data: packages = [], isLoading } = useQuery(
    billingQueries.adminFeaturePackages(includeInactive)
  );

  // Invalidate ALL admin-feature-packages queries regardless of includeInactive param
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [...billingKeys.all, 'admin-feature-packages'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deleteFeaturePackage(id),
    onSuccess: () => {
      toast.success(t('actions.deleteSuccess'));
      void invalidate();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error(t('actions.deleteError')),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.activateFeaturePackage(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => { toast.success(t('actions.activateSuccess')); void invalidate(); },
    onError: () => toast.error(t('actions.activateError')),
    onSettled: () => setTogglingId(null),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deactivateFeaturePackage(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => { toast.success(t('actions.deactivateSuccess')); void invalidate(); },
    onError: () => toast.error(t('actions.deactivateError')),
    onSettled: () => setTogglingId(null),
  });

  const filtered = React.useMemo(() => {
    let result = packages.filter((p) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchesType = featureTypeFilter === 'ALL' || normalizeFeatureType(p.feature_type) === featureTypeFilter;
      return matchesSearch && matchesType;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = sortKey === 'price' ? a.price : a.name.toLowerCase();
        const valB = sortKey === 'price' ? b.price : b.name.toLowerCase();
        const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [packages, debouncedSearch, featureTypeFilter, sortKey, sortDir]);

  const activeCount = packages.filter((p) => p.is_active).length;
  const inactiveCount = packages.length - activeCount;
  const freeCount = packages.filter((p) => p.free || p.price === 0).length;
  const paidCount = packages.length - freeCount;

  function toggleSort(key: 'name' | 'price') {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
  }

  const columns = React.useMemo<ColumnDef<FeaturePackage>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => (
          <button
            type='button'
            onClick={() => toggleSort('name')}
            className='flex items-center gap-1.5 group text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors'
          >
            {t('table.columns.package')}
            <ArrowUpDown
              className={cn(
                'h-3 w-3 transition-colors',
                sortKey === 'name' ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
              )}
            />
          </button>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          const cfg = getFeatureTypeConfig(pkg.feature_type);
          return (
            <div className='flex items-center gap-3 min-w-0'>
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', cfg.bg, cfg.border)}>
                <cfg.icon className={cn('h-3.5 w-3.5', cfg.text)} />
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='text-sm font-semibold text-foreground leading-tight truncate'>{pkg.name}</span>
                {pkg.description && (
                  <span className='text-xs text-muted-foreground/70 truncate max-w-[200px]'>
                    {pkg.description}
                  </span>
                )}
                <span className='text-[10px] font-mono text-muted-foreground/50 bg-muted/60 px-1.5 py-0.5 rounded mt-0.5 w-fit'>
                  {pkg.code}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'feature_type',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.featureType')}
          </span>
        ),
        cell: ({ row }) => {
          const cfg = getFeatureTypeConfig(row.original.feature_type);
          return (
            <Badge
              variant='outline'
              className={cn(
                'gap-1 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap',
                cfg.bg, cfg.text, cfg.border
              )}
            >
              <cfg.icon className='h-2.5 w-2.5' />
              {t(cfg.labelKey)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quota',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.entitlement')}
          </span>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          const isUnlimited = pkg.unlimited || pkg.quota === -1;
          const isNoExpiry = pkg.duration_days === -1;
          return (
            <div className='flex flex-col gap-0.5'>
              <span className={cn('text-sm font-bold', isUnlimited ? 'text-violet-600' : 'text-foreground')}>
                {isUnlimited ? '∞' : pkg.quota}
                <span className='text-xs font-normal text-muted-foreground ml-1'>
                  {t('table.units')}
                </span>
              </span>
              <span className={cn('text-xs', isNoExpiry ? 'text-violet-500' : 'text-muted-foreground')}>
                {formatDuration(pkg.duration_days, t)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: () => (
          <button
            type='button'
            onClick={() => toggleSort('price')}
            className='flex items-center gap-1.5 group text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors'
          >
            {t('table.columns.price')}
            <ArrowUpDown
              className={cn(
                'h-3 w-3 transition-colors',
                sortKey === 'price' ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
              )}
            />
          </button>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          const isFree = pkg.free || pkg.price === 0;
          return (
            <span className={cn('text-sm font-bold', isFree ? 'text-emerald-600' : 'text-foreground')}>
              {isFree ? (
                <span className='inline-flex items-center gap-1'>
                  <Gift className='h-3 w-3' />
                  {t('price.free')}
                </span>
              ) : (
                formatPrice(pkg.price, t('price.free'))
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.status')}
          </span>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <ActiveToggle
              isActive={pkg.is_active}
              disabled={togglingId === pkg.id}
              onActivate={() => activateMutation.mutate(pkg.id)}
              onDeactivate={() => deactivateMutation.mutate(pkg.id)}
              activateLabel={t('status.clickToActivate')}
              deactivateLabel={t('status.clickToDeactivate')}
              activeLabel={t('status.active')}
              inactiveLabel={t('status.inactive')}
            />
          );
        },
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className='flex items-center justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-[175px]'>
                  <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
                    {pkg.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(pkg.code);
                      toast.success(t('actions.copyCodeSuccess'));
                    }}
                    className='gap-2 text-xs'
                  >
                    <Copy className='h-3.5 w-3.5' /> {t('actions.copyCode')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailPackage(pkg);
                      setDetailOpen(true);
                    }}
                    className='gap-2 text-xs'
                  >
                    <Eye className='h-3.5 w-3.5' /> {t('actions.viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPackage(pkg);
                      setFormOpen(true);
                    }}
                    className='gap-2 text-xs'
                  >
                    <Pencil className='h-3.5 w-3.5' /> {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(pkg);
                      setDeleteConfirmOpen(true);
                    }}
                    className='gap-2 text-xs text-destructive focus:text-destructive'
                  >
                    <Trash2 className='h-3.5 w-3.5' /> {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglingId, sortKey, sortDir, t]
  );

  const hasActiveFilters = debouncedSearch || featureTypeFilter !== 'ALL';

  const toolbar = (
    <div className='flex flex-col gap-3 px-1 pb-1 sm:flex-row sm:items-center'>
      <div className='flex flex-1 items-center gap-2 flex-wrap'>
        {/* Search */}
        <div className='relative flex-1 max-w-[280px] group'>
          <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none' />
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 pl-8 text-sm border-border/60 bg-transparent focus:bg-background transition-colors'
          />
        </div>

        {/* Feature type filter */}
        <Select
          value={featureTypeFilter}
          onValueChange={(v) => setFeatureTypeFilter(v as FeaturePackage['feature_type'] | 'ALL')}
        >
          <SelectTrigger className='h-9 w-[155px] text-xs border-border/60 bg-transparent'>
            <div className='flex items-center gap-1.5'>
              <Filter className='h-3 w-3 text-muted-foreground/60 shrink-0' />
              <SelectValue placeholder={t('filters.allTypes')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL' className='text-xs'>{t('filters.allTypes')}</SelectItem>
            <SelectItem value='LISTING' className='text-xs'>{t('filters.LISTING')}</SelectItem>
            <SelectItem value='3D_TOUR' className='text-xs'>{t('filters.3D_TOUR')}</SelectItem>
            <SelectItem value='AI_REQUEST' className='text-xs'>{t('filters.AI_REQUEST')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Show inactive toggle */}
        <button
          type='button'
          role='switch'
          aria-checked={includeInactive}
          onClick={() => setIncludeInactive(!includeInactive)}
          className={cn(
            'h-9 px-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2',
            includeInactive
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <div
            className={cn(
              'relative w-7 h-3.5 rounded-full transition-colors shrink-0',
              includeInactive ? 'bg-primary' : 'bg-muted-foreground/25'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform',
                includeInactive ? 'translate-x-3.5' : 'translate-x-0'
              )}
            />
          </div>
          {t('filters.inactive')}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type='button'
            onClick={() => { setSearch(''); setFeatureTypeFilter('ALL'); }}
            className='h-9 px-2.5 rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-all'
          >
            {t('filters.clearFilters')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className='flex flex-col gap-5'>
      {/* Metrics */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <MetricCard
          icon={<Package className='h-4 w-4' />}
          label={t('stats.totalPackages')}
          value={packages.length}
          sub={inactiveCount > 0 ? t('stats.inactiveCount', { count: inactiveCount }) : undefined}
        />
        <MetricCard
          icon={<Power className='h-4 w-4' />}
          label={t('stats.activeNow')}
          value={activeCount}
          iconClass='bg-emerald-50 text-emerald-600'
        />
        <MetricCard
          icon={<Gift className='h-4 w-4' />}
          label={t('stats.freePackages')}
          value={freeCount}
          iconClass='bg-sky-50 text-sky-600'
        />
        <MetricCard
          icon={<CreditCard className='h-4 w-4' />}
          label={t('stats.paidPackages')}
          value={paidCount}
          iconClass='bg-violet-50 text-violet-600'
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        toolbar={toolbar}
        emptyIcon={
          <div className='flex flex-col items-center gap-3 py-4'>
            <div className='p-3.5 rounded-xl bg-muted/50 border border-dashed border-border'>
              <Package className='h-7 w-7 text-muted-foreground/40' />
            </div>
            <div className='flex flex-col items-center gap-1'>
              <p className='text-sm font-semibold text-foreground'>
                {t('table.empty.title')}
              </p>
              <p className='text-xs text-muted-foreground'>
                {hasActiveFilters
                  ? t('table.empty.adjustFilters')
                  : t('table.empty.createFirst')}
              </p>
            </div>
            {!hasActiveFilters && (
              <Button size='sm' onClick={onAddClick} className='mt-1 gap-1.5 text-xs'>
                <Plus className='h-3.5 w-3.5' />
                {t('actions.add')}
              </Button>
            )}
          </div>
        }
        emptyTitle=''
        onRowClick={(pkg) => { setDetailPackage(pkg); setDetailOpen(true); }}
        isRowSelected={(pkg) => detailPackage?.id === pkg.id && detailOpen}
        className='shadow-none border-border/60'
      />

      <PackageFormSheet
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingPackage(null); }}
        type='subscription'
        editingPackage={editingPackage}
      />

      <PackageDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        type='subscription'
        pkg={detailPackage}
      />

      {/* Delete confirm */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2.5'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10'>
                <Trash2 className='h-4 w-4 text-destructive' />
              </div>
              {t('actions.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='text-sm'>
              {t('actions.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center gap-3 rounded-lg border border-destructive/15 bg-destructive/5 p-3'>
            <AlertTriangle className='h-4 w-4 text-destructive/70 shrink-0' />
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-foreground truncate'>{deleteTarget?.name}</p>
              <p className='text-xs font-mono text-muted-foreground'>{deleteTarget?.code}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='ghost' size='sm' onClick={() => setDeleteConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              size='sm'
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? t('actions.deleting') : t('actions.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Boost Packages Tab
// ─────────────────────────────────────────────────────────────────────────────

function BoostPackagesTab({ onAddClick }: { onAddClick: () => void }) {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [includeInactive, setIncludeInactive] = React.useState(true);
  const [sortKey, setSortKey] = React.useState<'name' | 'price' | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc' | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<BoostPackage | null>(null);
  const [detailPackage, setDetailPackage] = React.useState<BoostPackage | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BoostPackage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const { data: packages = [], isLoading } = useQuery(
    billingQueries.adminBoostPackages(includeInactive)
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [...billingKeys.all, 'admin-boost-packages'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deleteBoostPackage(id),
    onSuccess: () => {
      toast.success(t('actions.deleteSuccess'));
      void invalidate();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error(t('actions.deleteError')),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.activateBoostPackage(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => { toast.success(t('actions.activateSuccess')); void invalidate(); },
    onError: () => toast.error(t('actions.activateError')),
    onSettled: () => setTogglingId(null),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deactivateBoostPackage(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => { toast.success(t('actions.deactivateSuccess')); void invalidate(); },
    onError: () => toast.error(t('actions.deactivateError')),
    onSettled: () => setTogglingId(null),
  });

  const filtered = React.useMemo(() => {
    let result = packages.filter((p) => {
      const q = debouncedSearch.toLowerCase();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = sortKey === 'price' ? a.price : a.name.toLowerCase();
        const valB = sortKey === 'price' ? b.price : b.name.toLowerCase();
        const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return result;
  }, [packages, debouncedSearch, sortKey, sortDir]);

  const activeCount = packages.filter((p) => p.is_active).length;
  const inactiveCount = packages.length - activeCount;

  function toggleSort(key: 'name' | 'price') {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
  }

  const columns = React.useMemo<ColumnDef<BoostPackage>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => (
          <button
            type='button'
            onClick={() => toggleSort('name')}
            className='flex items-center gap-1.5 group text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground'
          >
            {t('table.columns.package')}
            <ArrowUpDown className={cn('h-3 w-3', sortKey === 'name' ? 'text-primary' : 'text-muted-foreground/40')} />
          </button>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50'>
                <Rocket className='h-3.5 w-3.5 text-orange-600' />
              </div>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-foreground leading-tight'>{pkg.name}</span>
                {pkg.description && (
                  <span className='text-xs text-muted-foreground/70 truncate max-w-[180px]'>{pkg.description}</span>
                )}
                <span className='text-[10px] font-mono text-muted-foreground/50 bg-muted/60 px-1.5 py-0.5 rounded mt-0.5 w-fit'>
                  {pkg.code}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'featured_quota',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.quotas')}
          </span>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1.5'>
                <Star className='h-3 w-3 text-blue-400' />
                <span className='text-xs font-semibold text-foreground'>{pkg.featured_quota}</span>
                <span className='text-[10px] text-muted-foreground'>{t('table.boost.featured')}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Flame className='h-3 w-3 text-red-400' />
                <span className='text-xs font-semibold text-foreground'>{pkg.hot_badge_quota}</span>
                <span className='text-[10px] text-muted-foreground'>{t('table.boost.hotBadge')}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'duration_days',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.duration')}
          </span>
        ),
        cell: ({ row }) => (
          <span className='text-sm text-foreground'>
            {formatDuration(row.original.duration_days, t)}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: () => (
          <button
            type='button'
            onClick={() => toggleSort('price')}
            className='flex items-center gap-1.5 group text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground'
          >
            {t('table.columns.price')}
            <ArrowUpDown className={cn('h-3 w-3', sortKey === 'price' ? 'text-primary' : 'text-muted-foreground/40')} />
          </button>
        ),
        cell: ({ row }) => (
          <span className='text-sm font-bold text-foreground'>
            {formatPrice(row.original.price, t('price.free'))}
          </span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: () => (
          <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            {t('table.columns.status')}
          </span>
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <ActiveToggle
              isActive={pkg.is_active}
              disabled={togglingId === pkg.id}
              onActivate={() => activateMutation.mutate(pkg.id)}
              onDeactivate={() => deactivateMutation.mutate(pkg.id)}
              activateLabel={t('status.clickToActivate')}
              deactivateLabel={t('status.clickToDeactivate')}
              activeLabel={t('status.active')}
              inactiveLabel={t('status.inactive')}
            />
          );
        },
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className='flex items-center justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-[175px]'>
                  <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
                    {pkg.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(pkg.code); toast.success(t('actions.copyCodeSuccess')); }}
                    className='gap-2 text-xs'
                  >
                    <Copy className='h-3.5 w-3.5' /> {t('actions.copyCode')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setDetailPackage(pkg); setDetailOpen(true); }}
                    className='gap-2 text-xs'
                  >
                    <Eye className='h-3.5 w-3.5' /> {t('actions.viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setEditingPackage(pkg); setFormOpen(true); }}
                    className='gap-2 text-xs'
                  >
                    <Pencil className='h-3.5 w-3.5' /> {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg); setDeleteConfirmOpen(true); }}
                    className='gap-2 text-xs text-destructive focus:text-destructive'
                  >
                    <Trash2 className='h-3.5 w-3.5' /> {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglingId, sortKey, sortDir, t]
  );

  const toolbar = (
    <div className='flex flex-col gap-3 px-1 pb-1 sm:flex-row sm:items-center'>
      <div className='flex flex-1 items-center gap-2 flex-wrap'>
        <div className='relative flex-1 max-w-[280px] group'>
          <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none' />
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 pl-8 text-sm border-border/60 bg-transparent focus:bg-background transition-colors'
          />
        </div>

        <button
          type='button'
          role='switch'
          aria-checked={includeInactive}
          onClick={() => setIncludeInactive(!includeInactive)}
          className={cn(
            'h-9 px-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2',
            includeInactive
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <div
            className={cn(
              'relative w-7 h-3.5 rounded-full transition-colors shrink-0',
              includeInactive ? 'bg-primary' : 'bg-muted-foreground/25'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform',
                includeInactive ? 'translate-x-3.5' : 'translate-x-0'
              )}
            />
          </div>
          {t('filters.inactive')}
        </button>

        {debouncedSearch && (
          <button
            type='button'
            onClick={() => setSearch('')}
            className='h-9 px-2.5 rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-all'
          >
            {t('filters.clear')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className='flex flex-col gap-5'>
      {/* Metrics */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <MetricCard
          icon={<Rocket className='h-4 w-4' />}
          label={t('stats.totalBoost')}
          value={packages.length}
          sub={inactiveCount > 0 ? t('stats.inactiveCount', { count: inactiveCount }) : undefined}
          iconClass='bg-orange-50 text-orange-600'
        />
        <MetricCard
          icon={<Power className='h-4 w-4' />}
          label={t('stats.activeNow')}
          value={activeCount}
          iconClass='bg-emerald-50 text-emerald-600'
        />
        <MetricCard
          icon={<Star className='h-4 w-4' />}
          label={t('stats.totalFeaturedSlots')}
          value={packages.filter((p) => p.is_active).reduce((s, p) => s + p.featured_quota, 0)}
          iconClass='bg-blue-50 text-blue-600'
        />
        <MetricCard
          icon={<Flame className='h-4 w-4' />}
          label={t('stats.totalHotBadgeSlots')}
          value={packages.filter((p) => p.is_active).reduce((s, p) => s + p.hot_badge_quota, 0)}
          iconClass='bg-red-50 text-red-500'
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        toolbar={toolbar}
        emptyIcon={
          <div className='flex flex-col items-center gap-3 py-4'>
            <div className='p-3.5 rounded-xl bg-muted/50 border border-dashed border-border'>
              <Rocket className='h-7 w-7 text-muted-foreground/40' />
            </div>
            <div className='flex flex-col items-center gap-1'>
              <p className='text-sm font-semibold text-foreground'>
                {t('table.empty.noBoostPackages')}
              </p>
              <p className='text-xs text-muted-foreground'>
                {debouncedSearch
                  ? t('table.empty.adjustSearch')
                  : t('table.empty.addFirstBoost')}
              </p>
            </div>
            {!debouncedSearch && (
              <Button size='sm' onClick={onAddClick} className='mt-1 gap-1.5 text-xs'>
                <Plus className='h-3.5 w-3.5' />
                {t('actions.add')}
              </Button>
            )}
          </div>
        }
        emptyTitle=''
        onRowClick={(pkg) => { setDetailPackage(pkg); setDetailOpen(true); }}
        isRowSelected={(pkg) => detailPackage?.id === pkg.id && detailOpen}
        className='shadow-none border-border/60'
      />

      <PackageFormSheet
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingPackage(null); }}
        type='boost'
        editingBoostPackage={editingPackage}
      />

      <PackageDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        type='boost'
        boostPkg={detailPackage}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10'>
                <Trash2 className='h-4 w-4 text-destructive' />
              </div>
              {t('actions.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('actions.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center gap-3 rounded-lg border border-destructive/15 bg-destructive/5 p-3'>
            <AlertTriangle className='h-4 w-4 text-destructive/70 shrink-0' />
            <div>
              <p className='text-sm font-semibold'>{deleteTarget?.name}</p>
              <p className='text-xs font-mono text-muted-foreground'>{deleteTarget?.code}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='ghost' size='sm' onClick={() => setDeleteConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              size='sm'
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? t('actions.deleting') : t('actions.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

type TabType = 'subscription' | 'boost';

export function ManagePackagesPage() {
  const t = useTranslations('ManagePackages');
  const [activeTab, setActiveTab] = React.useState<TabType>('subscription');
  const [subFormOpen, setSubFormOpen] = React.useState(false);
  const [boostFormOpen, setBoostFormOpen] = React.useState(false);

  const { data: subPackages = [] } = useQuery(billingQueries.adminFeaturePackages(true));
  const { data: boostPackages = [] } = useQuery(billingQueries.adminBoostPackages(true));

  const subActiveCount = subPackages.filter((p) => p.is_active).length;
  const boostActiveCount = boostPackages.filter((p) => p.is_active).length;

  return (
    <div className='flex h-full flex-col gap-0 overflow-hidden'>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4 bg-card/50 backdrop-blur-sm shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/5'>
            <Package className='h-4.5 w-4.5 text-primary' />
          </div>
          <div>
            <h1 className='text-base font-bold text-foreground leading-tight'>
              {t('title')}
            </h1>
            <p className='text-xs text-muted-foreground'>
              {t('description')}
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            activeTab === 'subscription' ? setSubFormOpen(true) : setBoostFormOpen(true)
          }
          size='sm'
          className='gap-1.5 shadow-sm shadow-primary/20'
        >
          <Plus className='h-3.5 w-3.5' />
          {activeTab === 'subscription'
            ? t('header.addSubscription')
            : t('header.addBoost')}
        </Button>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className='flex items-center gap-1 border-b border-border/60 bg-muted/30 px-6 py-2 shrink-0'>
        <TabButton
          active={activeTab === 'subscription'}
          icon={<CreditCard className='h-3.5 w-3.5' />}
          label={t('tabs.subscription')}
          count={subPackages.length}
          activeCount={subActiveCount}
          onClick={() => setActiveTab('subscription')}
        />
        <TabButton
          active={activeTab === 'boost'}
          icon={<Rocket className='h-3.5 w-3.5' />}
          label={t('tabs.boost')}
          count={boostPackages.length}
          activeCount={boostActiveCount}
          onClick={() => setActiveTab('boost')}
        />
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className='flex-1 overflow-y-auto px-6 py-5'>
        {activeTab === 'subscription' ? (
          <SubscriptionPackagesTab onAddClick={() => setSubFormOpen(true)} />
        ) : (
          <BoostPackagesTab onAddClick={() => setBoostFormOpen(true)} />
        )}
      </div>

      {/* Top-level form sheets (triggered by header CTA) */}
      <PackageFormSheet
        open={subFormOpen}
        onOpenChange={setSubFormOpen}
        type='subscription'
        editingPackage={null}
      />
      <PackageFormSheet
        open={boostFormOpen}
        onOpenChange={setBoostFormOpen}
        type='boost'
        editingBoostPackage={null}
      />
    </div>
  );
}
