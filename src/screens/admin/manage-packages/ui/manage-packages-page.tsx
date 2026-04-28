'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
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
  BadgeCheck,
  AlertTriangle,
  PowerOff,
  Power,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks';

import { PackageFormSheet } from './package-form-sheet';
import { PackageDetailSheet } from './package-detail-sheet';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return price.toLocaleString('vi-VN') + ' ₫';
}

function formatDuration(days: number): string {
  if (days === -1) return '∞';
  if (days === 30) return '30d';
  return `${days}d`;
}

function featureTypeColor(ft: FeaturePackage['feature_type']): string {
  switch (ft) {
    case 'LISTING':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case '3D_TOUR':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'AI_REQUEST':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function featureTypeIcon(ft: FeaturePackage['feature_type']) {
  switch (ft) {
    case 'LISTING':
      return <Layers className='h-3 w-3' />;
    case '3D_TOUR':
      return <TrendingUp className='h-3 w-3' />;
    case 'AI_REQUEST':
      return <BadgeCheck className='h-3 w-3' />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active status badge
// ─────────────────────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive?: boolean }) {
  const t = useTranslations('ManagePackages');
  if (isActive === undefined) return null;
  return (
    <Badge
      variant='outline'
      className={cn(
        'text-[10px] font-bold',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-muted text-muted-foreground border-border'
      )}
    >
      {isActive ? t('status.active') : t('status.inactive')}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Show-inactive toggle (checkbox-style switch)
// ─────────────────────────────────────────────────────────────────────────────

function ShowInactiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTranslations('ManagePackages');
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className='flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all select-none'
    >
      <div
        className={cn(
          'relative w-8 h-4 rounded-full transition-colors shrink-0',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
      {t('filters.showInactive')}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className='flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm'>
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          accent ?? 'bg-primary/10 text-primary'
        )}
      >
        {icon}
      </div>
      <div>
        <p className='text-2xl font-bold text-foreground'>{value}</p>
        <p className='text-xs text-muted-foreground'>{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Packages Tab
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionPackagesTab() {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [featureTypeFilter, setFeatureTypeFilter] = React.useState<
    FeaturePackage['feature_type'] | 'ALL'
  >('ALL');
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<FeaturePackage | null>(null);
  const [detailPackage, setDetailPackage] = React.useState<FeaturePackage | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<FeaturePackage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const { data: packages = [], isLoading } = useQuery(
    billingQueries.adminFeaturePackages(includeInactive)
  );

  // ── mutations ──────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: billingKeys.adminFeaturePackages() });

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
    onSuccess: () => {
      toast.success(t('actions.activateSuccess'));
      void invalidate();
    },
    onError: () => toast.error(t('actions.activateError')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deactivateFeaturePackage(id),
    onSuccess: () => {
      toast.success(t('actions.deactivateSuccess'));
      void invalidate();
    },
    onError: () => toast.error(t('actions.deactivateError')),
  });

  // ── filter ─────────────────────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    return packages.filter((p) => {
      const matchesSearch =
        !debouncedSearch ||
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = featureTypeFilter === 'ALL' || p.feature_type === featureTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [packages, debouncedSearch, featureTypeFilter]);

  const activeCount = packages.filter((p) => p.is_active).length;
  const freeCount = packages.filter((p) => p.free).length;
  const paidCount = packages.filter((p) => !p.free).length;

  return (
    <div className='flex flex-col gap-6'>
      {/* Stats row */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          icon={<Package className='h-5 w-5' />}
          label={t('stats.totalSubscription')}
          value={packages.length}
        />
        <StatCard
          icon={<Power className='h-5 w-5' />}
          label={t('stats.activePackages')}
          value={activeCount}
          accent='bg-emerald-50 text-emerald-600'
        />
        <StatCard
          icon={<Gift className='h-5 w-5' />}
          label={t('stats.freePackages')}
          value={freeCount}
          accent='bg-blue-50 text-blue-600'
        />
        <StatCard
          icon={<CreditCard className='h-5 w-5' />}
          label={t('stats.paidPackages')}
          value={paidCount}
          accent='bg-violet-50 text-violet-600'
        />
      </div>

      {/* Toolbar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2 flex-wrap'>
          <div className='relative flex-1 max-w-sm group'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors' />
            <Input
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 h-10 border-primary/10 bg-primary/5 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all'
            />
          </div>

          <Select
            value={featureTypeFilter}
            onValueChange={(v) =>
              setFeatureTypeFilter(v as FeaturePackage['feature_type'] | 'ALL')
            }
          >
            <SelectTrigger className='w-[155px] h-10 border-primary/10 bg-white'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-muted-foreground/60' />
                <SelectValue placeholder={t('filters.featureType')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>{t('filters.allTypes')}</SelectItem>
              <SelectItem value='LISTING'>{t('filters.LISTING')}</SelectItem>
              <SelectItem value='3D_TOUR'>{t('filters.3D_TOUR')}</SelectItem>
              <SelectItem value='AI_REQUEST'>{t('filters.AI_REQUEST')}</SelectItem>
            </SelectContent>
          </Select>

          <ShowInactiveToggle checked={includeInactive} onChange={setIncludeInactive} />
        </div>

        <Button
          onClick={() => {
            setEditingPackage(null);
            setFormOpen(true);
          }}
          className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 shadow-sm shadow-primary/20'
        >
          <Plus className='h-4 w-4' />
          {t('actions.add')}
        </Button>
      </div>

      {/* Table */}
      <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 gap-3 text-center px-4'>
            <div className='p-3 bg-muted rounded-full'>
              <Package className='h-7 w-7 text-muted-foreground/50' />
            </div>
            <p className='text-sm font-semibold text-foreground'>{t('table.empty.title')}</p>
            <p className='text-xs text-muted-foreground max-w-xs'>{t('table.empty.description')}</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border/50 bg-muted/30'>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.package')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.featureType')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.quota')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.duration')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.price')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.status')}
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/30'>
                {filtered.map((pkg) => (
                  <SubscriptionPackageRow
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={(p) => {
                      setEditingPackage(p);
                      setFormOpen(true);
                    }}
                    onDelete={(p) => {
                      setDeleteTarget(p);
                      setDeleteConfirmOpen(true);
                    }}
                    onView={(p) => {
                      setDetailPackage(p);
                      setDetailOpen(true);
                    }}
                    onActivate={(p) => activateMutation.mutate(p.id)}
                    onDeactivate={(p) => deactivateMutation.mutate(p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Sheet */}
      <PackageFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        type='subscription'
        editingPackage={editingPackage}
      />

      {/* Detail Sheet */}
      <PackageDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        type='subscription'
        pkg={detailPackage}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-md border-destructive/20 shadow-2xl shadow-destructive/5'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <div className='p-2 bg-destructive/10 rounded-lg'>
                <Trash2 className='h-5 w-5' />
              </div>
              {t('actions.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='pt-2 text-sm leading-relaxed'>
              {t('actions.deleteConfirmDescription', { name: deleteTarget?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className='rounded-xl border border-destructive/10 bg-destructive/5 p-4 flex items-center gap-3'>
              <AlertTriangle className='h-5 w-5 text-destructive shrink-0' />
              <div>
                <p className='text-sm font-bold text-foreground'>{deleteTarget.name}</p>
                <p className='text-xs font-mono text-muted-foreground'>{deleteTarget.code}</p>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button variant='ghost' onClick={() => setDeleteConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='shadow-lg shadow-destructive/20 font-bold'
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
// Subscription Package Row
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionPackageRow({
  pkg,
  onEdit,
  onDelete,
  onView,
  onActivate,
  onDeactivate,
}: {
  pkg: FeaturePackage;
  onEdit: (p: FeaturePackage) => void;
  onDelete: (p: FeaturePackage) => void;
  onView: (p: FeaturePackage) => void;
  onActivate: (p: FeaturePackage) => void;
  onDeactivate: (p: FeaturePackage) => void;
}) {
  const t = useTranslations('ManagePackages');

  return (
    <tr className={cn('group hover:bg-accent/30 transition-colors', !pkg.is_active && 'opacity-60')}>
      {/* Package name + code */}
      <td className='px-4 py-3'>
        <div className='flex flex-col gap-0.5'>
          <span className='font-semibold text-foreground text-sm leading-tight'>{pkg.name}</span>
          <span className='text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit'>
            {pkg.code}
          </span>
        </div>
      </td>

      {/* Feature type */}
      <td className='px-4 py-3'>
        <Badge
          variant='outline'
          className={cn('gap-1 text-[10px] font-bold uppercase tracking-wider', featureTypeColor(pkg.feature_type))}
        >
          {featureTypeIcon(pkg.feature_type)}
          {t(`featureType.${pkg.feature_type}` as any)}
        </Badge>
      </td>

      {/* Quota */}
      <td className='px-4 py-3'>
        <span className='text-sm font-semibold text-foreground'>
          {pkg.unlimited ? (
            <span className='text-violet-600'>∞</span>
          ) : (
            pkg.quota
          )}
        </span>
      </td>

      {/* Duration */}
      <td className='px-4 py-3'>
        <span className='text-sm font-medium text-foreground'>{formatDuration(pkg.duration_days)}</span>
      </td>

      {/* Price */}
      <td className='px-4 py-3'>
        <span className={cn('text-sm font-bold', pkg.free ? 'text-emerald-600' : 'text-foreground')}>
          {formatPrice(pkg.price)}
        </span>
      </td>

      {/* Status */}
      <td className='px-4 py-3'>
        <ActiveBadge isActive={pkg.is_active} />
      </td>

      {/* Actions */}
      <td className='px-4 py-3 text-right'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[185px]'>
            <DropdownMenuLabel>{t('table.columns.actions')}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(pkg.code);
                toast.success(t('actions.copyCodeSuccess'));
              }}
              className='gap-2'
            >
              <Copy className='h-4 w-4 opacity-70' />
              {t('actions.copyCode')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(pkg)} className='gap-2'>
              <Eye className='h-4 w-4 opacity-70' />
              {t('actions.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(pkg)} className='gap-2'>
              <Pencil className='h-4 w-4 opacity-70' />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pkg.is_active ? (
              <DropdownMenuItem
                onClick={() => onDeactivate(pkg)}
                className='gap-2 text-amber-600 font-medium'
              >
                <PowerOff className='h-4 w-4' />
                {t('actions.deactivate')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onActivate(pkg)}
                className='gap-2 text-emerald-600 font-medium'
              >
                <Power className='h-4 w-4' />
                {t('actions.activate')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(pkg)}
              className='text-destructive font-medium gap-2'
            >
              <Trash2 className='h-4 w-4' />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Boost Packages Tab
// ─────────────────────────────────────────────────────────────────────────────

function BoostPackagesTab() {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<BoostPackage | null>(null);
  const [detailPackage, setDetailPackage] = React.useState<BoostPackage | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BoostPackage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const { data: packages = [], isLoading } = useQuery(
    billingQueries.adminBoostPackages(includeInactive)
  );

  // ── mutations ──────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: billingKeys.adminBoostPackages() });

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
    onSuccess: () => {
      toast.success(t('actions.activateSuccess'));
      void invalidate();
    },
    onError: () => toast.error(t('actions.activateError')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminBillingApi.deactivateBoostPackage(id),
    onSuccess: () => {
      toast.success(t('actions.deactivateSuccess'));
      void invalidate();
    },
    onError: () => toast.error(t('actions.deactivateError')),
  });

  // ── filter ─────────────────────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    return packages.filter(
      (p) =>
        !debouncedSearch ||
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [packages, debouncedSearch]);

  const activeCount = packages.filter((p) => p.is_active).length;
  const totalFeaturedQuota = packages
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + p.featured_quota, 0);
  const totalHotBadge = packages
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + p.hot_badge_quota, 0);

  return (
    <div className='flex flex-col gap-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          icon={<Rocket className='h-5 w-5' />}
          label={t('stats.totalBoost')}
          value={packages.length}
          accent='bg-orange-50 text-orange-600'
        />
        <StatCard
          icon={<Power className='h-5 w-5' />}
          label={t('stats.activePackages')}
          value={activeCount}
          accent='bg-emerald-50 text-emerald-600'
        />
        <StatCard
          icon={<TrendingUp className='h-5 w-5' />}
          label={t('table.boost.featuredQuota')}
          value={totalFeaturedQuota}
          accent='bg-blue-50 text-blue-600'
        />
        <StatCard
          icon={<BadgeCheck className='h-5 w-5' />}
          label={t('table.boost.hotBadgeQuota')}
          value={totalHotBadge}
          accent='bg-red-50 text-red-600'
        />
      </div>

      {/* Toolbar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2 flex-wrap'>
          <div className='relative flex-1 max-w-sm group'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors' />
            <Input
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 h-10 border-primary/10 bg-primary/5 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all'
            />
          </div>

          <ShowInactiveToggle checked={includeInactive} onChange={setIncludeInactive} />
        </div>

        <Button
          onClick={() => {
            setEditingPackage(null);
            setFormOpen(true);
          }}
          className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 shadow-sm shadow-primary/20'
        >
          <Plus className='h-4 w-4' />
          {t('actions.add')}
        </Button>
      </div>

      {/* Table */}
      <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 gap-3 text-center px-4'>
            <div className='p-3 bg-muted rounded-full'>
              <Rocket className='h-7 w-7 text-muted-foreground/50' />
            </div>
            <p className='text-sm font-semibold text-foreground'>{t('table.empty.title')}</p>
            <p className='text-xs text-muted-foreground max-w-xs'>{t('table.empty.description')}</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border/50 bg-muted/30'>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.package')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.boost.featuredQuota')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.boost.hotBadgeQuota')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.duration')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.price')}
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.status')}
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {t('table.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/30'>
                {filtered.map((pkg) => (
                  <BoostPackageRow
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={(p) => {
                      setEditingPackage(p);
                      setFormOpen(true);
                    }}
                    onDelete={(p) => {
                      setDeleteTarget(p);
                      setDeleteConfirmOpen(true);
                    }}
                    onView={(p) => {
                      setDetailPackage(p);
                      setDetailOpen(true);
                    }}
                    onActivate={(p) => activateMutation.mutate(p.id)}
                    onDeactivate={(p) => deactivateMutation.mutate(p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Sheet */}
      <PackageFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        type='boost'
        editingBoostPackage={editingPackage}
      />

      {/* Detail Sheet */}
      <PackageDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        type='boost'
        boostPkg={detailPackage}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-md border-destructive/20 shadow-2xl shadow-destructive/5'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <div className='p-2 bg-destructive/10 rounded-lg'>
                <Trash2 className='h-5 w-5' />
              </div>
              {t('actions.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='pt-2 text-sm leading-relaxed'>
              {t('actions.deleteConfirmDescription', { name: deleteTarget?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className='rounded-xl border border-destructive/10 bg-destructive/5 p-4 flex items-center gap-3'>
              <AlertTriangle className='h-5 w-5 text-destructive shrink-0' />
              <div>
                <p className='text-sm font-bold text-foreground'>{deleteTarget.name}</p>
                <p className='text-xs font-mono text-muted-foreground'>{deleteTarget.code}</p>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button variant='ghost' onClick={() => setDeleteConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='shadow-lg shadow-destructive/20 font-bold'
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
// Boost Package Row
// ─────────────────────────────────────────────────────────────────────────────

function BoostPackageRow({
  pkg,
  onEdit,
  onDelete,
  onView,
  onActivate,
  onDeactivate,
}: {
  pkg: BoostPackage;
  onEdit: (p: BoostPackage) => void;
  onDelete: (p: BoostPackage) => void;
  onView: (p: BoostPackage) => void;
  onActivate: (p: BoostPackage) => void;
  onDeactivate: (p: BoostPackage) => void;
}) {
  const t = useTranslations('ManagePackages');

  return (
    <tr className={cn('group hover:bg-accent/30 transition-colors', !pkg.is_active && 'opacity-60')}>
      <td className='px-4 py-3'>
        <div className='flex flex-col gap-0.5'>
          <span className='font-semibold text-foreground text-sm leading-tight'>{pkg.name}</span>
          <span className='text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit'>
            {pkg.code}
          </span>
          {pkg.description && (
            <span className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>
              {pkg.description}
            </span>
          )}
        </div>
      </td>

      <td className='px-4 py-3'>
        <div className='flex items-center gap-1.5'>
          <div className='h-2 w-2 rounded-full bg-blue-400' />
          <span className='text-sm font-semibold text-foreground'>{pkg.featured_quota}</span>
        </div>
      </td>

      <td className='px-4 py-3'>
        <div className='flex items-center gap-1.5'>
          <div className='h-2 w-2 rounded-full bg-red-400' />
          <span className='text-sm font-semibold text-foreground'>{pkg.hot_badge_quota}</span>
        </div>
      </td>

      <td className='px-4 py-3'>
        <span className='text-sm font-medium text-foreground'>{formatDuration(pkg.duration_days)}</span>
      </td>

      <td className='px-4 py-3'>
        <span className='text-sm font-bold text-foreground'>{formatPrice(pkg.price)}</span>
      </td>

      {/* Status */}
      <td className='px-4 py-3'>
        <ActiveBadge isActive={pkg.is_active} />
      </td>

      <td className='px-4 py-3 text-right'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[185px]'>
            <DropdownMenuLabel>{t('table.columns.actions')}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(pkg.code);
                toast.success(t('actions.copyCodeSuccess'));
              }}
              className='gap-2'
            >
              <Copy className='h-4 w-4 opacity-70' />
              {t('actions.copyCode')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(pkg)} className='gap-2'>
              <Eye className='h-4 w-4 opacity-70' />
              {t('actions.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(pkg)} className='gap-2'>
              <Pencil className='h-4 w-4 opacity-70' />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pkg.is_active ? (
              <DropdownMenuItem
                onClick={() => onDeactivate(pkg)}
                className='gap-2 text-amber-600 font-medium'
              >
                <PowerOff className='h-4 w-4' />
                {t('actions.deactivate')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onActivate(pkg)}
                className='gap-2 text-emerald-600 font-medium'
              >
                <Power className='h-4 w-4' />
                {t('actions.activate')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(pkg)}
              className='text-destructive font-medium gap-2'
            >
              <Trash2 className='h-4 w-4' />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

type TabType = 'subscription' | 'boost';

export function ManagePackagesPage() {
  const t = useTranslations('ManagePackages');
  const [activeTab, setActiveTab] = React.useState<TabType>('subscription');

  return (
    <div className='flex h-full flex-col gap-6 p-6 overflow-hidden'>
      {/* Page header */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm shadow-primary/5'>
            <Package className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground'>{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className='flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/50'>
        <button
          type='button'
          onClick={() => setActiveTab('subscription')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'subscription'
              ? 'bg-white text-primary shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          )}
        >
          <CreditCard className='h-4 w-4' />
          {t('tabs.subscription')}
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('boost')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'boost'
              ? 'bg-white text-primary shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          )}
        >
          <Rocket className='h-4 w-4' />
          {t('tabs.boost')}
        </button>
      </div>

      {/* Tab content */}
      <div className='flex-1 overflow-y-auto'>
        {activeTab === 'subscription' ? <SubscriptionPackagesTab /> : <BoostPackagesTab />}
      </div>
    </div>
  );
}
