'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Package,
  Rocket,
  CalendarDays,
  Clock,
  DollarSign,
  Tag,
  Layers,
  TrendingUp,
  BadgeCheck,
  Power,
  PowerOff,
  X,
} from 'lucide-react';

import { type FeaturePackage, type BoostPackage } from '@/entities/billing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/ui/sheet/sheet';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return price.toLocaleString('vi-VN') + ' VNĐ';
}

function formatDuration(days: number): string {
  if (days === -1) return 'Unlimited';
  if (days === 30) return '30 days (≈ 1 month)';
  return `${days} days`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className='flex items-start gap-3 py-3'>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          accent ?? 'bg-primary/10 text-primary'
        )}
      >
        {icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-0.5'>
          {label}
        </p>
        <div className='text-sm font-semibold text-foreground'>{value}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 mt-4'>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive?: boolean }) {
  const t = useTranslations('ManagePackages');
  if (isActive === undefined) return null;
  return (
    <div className='flex items-center gap-1.5'>
      {isActive ? (
        <Power className='h-3.5 w-3.5 text-emerald-600' />
      ) : (
        <PowerOff className='h-3.5 w-3.5 text-muted-foreground' />
      )}
      <Badge
        variant='outline'
        className={cn(
          'text-xs font-bold',
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-muted text-muted-foreground border-border'
        )}
      >
        {isActive ? t('status.active') : t('status.inactive')}
      </Badge>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Detail
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionDetail({ pkg }: { pkg: FeaturePackage }) {
  const t = useTranslations('ManagePackages');

  const featureTypeColors: Record<string, string> = {
    LISTING: 'bg-blue-50 text-blue-700 border-blue-200',
    '3D_TOUR': 'bg-violet-50 text-violet-700 border-violet-200',
    AI_REQUEST: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const featureTypeIcons: Record<string, React.ReactNode> = {
    LISTING: <Layers className='h-4 w-4' />,
    '3D_TOUR': <TrendingUp className='h-4 w-4' />,
    AI_REQUEST: <BadgeCheck className='h-4 w-4' />,
  };

  return (
    <div className='flex flex-col gap-0'>
      {/* Hero card */}
      <div className='mx-6 mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5'>
        <div className='flex items-center justify-between mb-3'>
          <Badge
            variant='outline'
            className={cn('gap-1.5 text-xs font-bold', featureTypeColors[pkg.feature_type] ?? '')}
          >
            {featureTypeIcons[pkg.feature_type]}
            {t(`featureType.${pkg.feature_type}` as any)}
          </Badge>
          <StatusBadge isActive={pkg.is_active} />
        </div>
        <h3 className='text-xl font-bold text-foreground'>{pkg.name}</h3>
        {pkg.description && (
          <p className='mt-1 text-sm text-muted-foreground leading-relaxed'>{pkg.description}</p>
        )}
        <p className='mt-3 text-3xl font-bold text-primary'>
          {formatPrice(pkg.price)}
          <span className='text-sm font-normal text-muted-foreground ml-1'>
            / {formatDuration(pkg.duration_days)}
          </span>
        </p>
      </div>

      {/* Details */}
      <div className='px-6 mt-2'>
        <SectionLabel>{t('detail.overview')}</SectionLabel>
        <div className='divide-y divide-border/30'>
          <DetailRow
            icon={<Tag className='h-4 w-4' />}
            label={t('detail.packageCode')}
            value={<span className='font-mono text-xs bg-muted px-2 py-1 rounded'>{pkg.code}</span>}
          />
          <DetailRow
            icon={<CalendarDays className='h-4 w-4' />}
            label={t('table.columns.duration')}
            value={formatDuration(pkg.duration_days)}
          />
        </div>

        <SectionLabel>{t('detail.quotaInfo')}</SectionLabel>
        <div className='divide-y divide-border/30'>
          <DetailRow
            icon={<Layers className='h-4 w-4' />}
            label={t('table.columns.quota')}
            value={
              pkg.unlimited || pkg.quota === -1 ? (
                <span className='text-violet-600'>∞ Unlimited</span>
              ) : (
                pkg.quota
              )
            }
            accent={pkg.unlimited || pkg.quota === -1 ? 'bg-violet-50 text-violet-600' : undefined}
          />
        </div>

        <SectionLabel>{t('detail.pricing')}</SectionLabel>
        <div className='divide-y divide-border/30'>
          <DetailRow
            icon={<DollarSign className='h-4 w-4' />}
            label={t('table.columns.price')}
            value={
              <span className={cn('font-bold text-base', pkg.free || pkg.price === 0 ? 'text-emerald-600' : 'text-foreground')}>
                {formatPrice(pkg.price)}
              </span>
            }
            accent={pkg.free || pkg.price === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}
          />
        </div>

        {(pkg.created_at || pkg.updated_at) && (
          <>
            <SectionLabel>{t('detail.overview')}</SectionLabel>
            <div className='divide-y divide-border/30'>
              {pkg.created_at && (
                <DetailRow
                  icon={<CalendarDays className='h-4 w-4' />}
                  label={t('detail.createdAt')}
                  value={<span className='text-sm text-muted-foreground'>{formatDate(pkg.created_at)}</span>}
                  accent='bg-muted/50 text-muted-foreground'
                />
              )}
              {pkg.updated_at && (
                <DetailRow
                  icon={<Clock className='h-4 w-4' />}
                  label={t('detail.updatedAt')}
                  value={<span className='text-sm text-muted-foreground'>{formatDate(pkg.updated_at)}</span>}
                  accent='bg-muted/50 text-muted-foreground'
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Boost Detail
// ─────────────────────────────────────────────────────────────────────────────

function BoostDetail({ pkg }: { pkg: BoostPackage }) {
  const t = useTranslations('ManagePackages');

  return (
    <div className='flex flex-col gap-0'>
      {/* Hero card */}
      <div className='mx-6 mt-4 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-5'>
        <div className='flex items-center justify-between mb-3'>
          <Badge variant='outline' className='gap-1.5 text-xs font-bold bg-orange-50 text-orange-700 border-orange-200'>
            <Rocket className='h-3.5 w-3.5' />
            Boost Package
          </Badge>
          <StatusBadge isActive={pkg.is_active} />
        </div>
        <h3 className='text-xl font-bold text-foreground'>{pkg.name}</h3>
        {pkg.description && (
          <p className='mt-1 text-sm text-muted-foreground leading-relaxed'>{pkg.description}</p>
        )}
        <p className='mt-3 text-3xl font-bold text-orange-600'>
          {formatPrice(pkg.price)}
          <span className='text-sm font-normal text-muted-foreground ml-1'>
            / {formatDuration(pkg.duration_days)}
          </span>
        </p>
      </div>

      {/* Quota highlights */}
      <div className='px-6 mt-4 grid grid-cols-2 gap-3'>
        <div className='flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-4 text-center'>
          <p className='text-3xl font-bold text-blue-700'>{pkg.featured_quota}</p>
          <p className='text-xs font-semibold text-blue-600 mt-1'>{t('table.boost.featuredQuota')}</p>
        </div>
        <div className='flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-4 text-center'>
          <p className='text-3xl font-bold text-red-600'>{pkg.hot_badge_quota}</p>
          <p className='text-xs font-semibold text-red-500 mt-1'>{t('table.boost.hotBadgeQuota')}</p>
        </div>
      </div>

      {/* Details */}
      <div className='px-6 mt-2'>
        <SectionLabel>{t('detail.overview')}</SectionLabel>
        <div className='divide-y divide-border/30'>
          <DetailRow
            icon={<Tag className='h-4 w-4' />}
            label={t('detail.packageCode')}
            value={<span className='font-mono text-xs bg-muted px-2 py-1 rounded'>{pkg.code}</span>}
          />
          <DetailRow
            icon={<CalendarDays className='h-4 w-4' />}
            label={t('table.columns.duration')}
            value={formatDuration(pkg.duration_days)}
          />
        </div>

        <SectionLabel>{t('detail.pricing')}</SectionLabel>
        <div className='divide-y divide-border/30'>
          <DetailRow
            icon={<DollarSign className='h-4 w-4' />}
            label={t('table.columns.price')}
            value={<span className='font-bold text-base text-foreground'>{formatPrice(pkg.price)}</span>}
            accent='bg-orange-50 text-orange-600'
          />
        </div>

        {(pkg.created_at || pkg.updated_at) && (
          <>
            <Separator className='my-3' />
            <div className='divide-y divide-border/30'>
              {pkg.created_at && (
                <DetailRow
                  icon={<CalendarDays className='h-4 w-4' />}
                  label={t('detail.createdAt')}
                  value={<span className='text-sm text-muted-foreground'>{formatDate(pkg.created_at)}</span>}
                  accent='bg-muted/50 text-muted-foreground'
                />
              )}
              {pkg.updated_at && (
                <DetailRow
                  icon={<Clock className='h-4 w-4' />}
                  label={t('detail.updatedAt')}
                  value={<span className='text-sm text-muted-foreground'>{formatDate(pkg.updated_at)}</span>}
                  accent='bg-muted/50 text-muted-foreground'
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

interface PackageDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'subscription' | 'boost';
  pkg?: FeaturePackage | null;
  boostPkg?: BoostPackage | null;
}

export function PackageDetailSheet({
  open,
  onOpenChange,
  type,
  pkg,
  boostPkg,
}: PackageDetailSheetProps) {
  const t = useTranslations('ManagePackages');

  const displayName =
    type === 'subscription' ? (pkg?.name ?? '—') : (boostPkg?.name ?? '—');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full max-w-md sm:max-w-lg flex flex-col p-0 overflow-y-auto'
      >
        <SheetHeader className='px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg border border-primary/20'>
              {type === 'subscription' ? (
                <Package className='h-5 w-5 text-primary' />
              ) : (
                <Rocket className='h-5 w-5 text-primary' />
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <SheetTitle className='text-base font-bold truncate'>{displayName}</SheetTitle>
              <SheetDescription className='text-xs mt-0.5'>{t('detail.title')}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='flex-1 pb-6'>
          {type === 'subscription' && pkg && <SubscriptionDetail pkg={pkg} />}
          {type === 'boost' && boostPkg && <BoostDetail pkg={boostPkg} />}
        </div>

        <div className='shrink-0 border-t border-border/50 px-6 py-4'>
          <Button
            variant='outline'
            className='w-full gap-2'
            onClick={() => onOpenChange(false)}
          >
            <X className='h-4 w-4' />
            {t('detail.close')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
