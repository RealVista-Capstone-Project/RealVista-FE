'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  CreditCard,
  Rocket,
  Check,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Loader2,
  ExternalLink,
  LayoutGrid,
  PackageSearch,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingApi,
  billingKeys,
  billingQueries,
  type BoostPackage,
  type CheckoutResponse,
  type ActiveSubscriptionResponse,
  type ActiveBoostPackageResponse,
  type FeaturePackage,
  type TransactionStatusResponse,
} from '@/entities/billing';
import { listingBoostKeys } from '@/entities/listing';
import { toast } from 'sonner';
import { HttpError } from '@/shared/lib/http';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ROUTES } from '@/shared/config/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PackageType = 'subscription' | 'boost';
type PaymentMethod = 'vnpay' | 'payos';
type WizardStep = 1 | 2 | 3 | 4;

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  durationDays: number;
  durationLabel: string;
  isPopular?: boolean;
  benefits: { label: string }[];
  features: { label: string }[];
  /** Chỉ gói tính năng (subscription) */
  featureType?: FeaturePackage['feature_type'];
  tierLevel: number;
}

// ---------------------------------------------------------------------------
// Helpers: feature packages & boost → UI Plan shape
// ---------------------------------------------------------------------------

/** Đồng bộ với FeaturePackageTierHelper (BE) */
function packageTierLevelFromCode(code: string): number {
  switch (code) {
    case 'LISTING_FREE':
    case '3D_TOUR_FREE':
    case 'AI_FREE':
      return 0;
    case 'LISTING_10':
    case '3D_TOUR_5':
    case 'AI_50':
      return 1;
    case 'LISTING_25':
    case '3D_TOUR_15':
    case 'AI_100':
      return 2;
    case 'LISTING_50':
    case '3D_TOUR_30':
    case 'AI_200':
      return 3;
    case 'LISTING_UNLIMITED':
    case '3D_TOUR_UNLIMITED':
    case 'AI_UNLIMITED':
      return 4;
    default:
      return 0;
  }
}

const TIER_LABELS_VI = ['Miễn phí', 'Basic', 'Premium', 'Pro', 'Pro+'] as const;

function tierLabelVi(level: number): string {
  const i = Math.min(Math.max(0, level), 4);
  return TIER_LABELS_VI[i];
}

function maxActiveTierForFeature(
  subs: ActiveSubscriptionResponse[] | undefined,
  featureType: string
): number {
  if (!subs?.length) return 0;
  return subs
    .filter((s) => s.feature_type === featureType && s.status === 'ACTIVE')
    .reduce((m, s) => Math.max(m, s.tier_level ?? packageTierLevelFromCode(s.package_code)), 0);
}

function findNextUpgradePackage(
  sub: ActiveSubscriptionResponse,
  catalog: FeaturePackage[]
): FeaturePackage | null {
  const current = sub.tier_level ?? packageTierLevelFromCode(sub.package_code);
  if (current >= 4) return null;
  const candidates = catalog.filter(
    (p) =>
      p.feature_type === sub.feature_type &&
      !p.free &&
      Number(p.price) > 0 &&
      packageTierLevelFromCode(p.code) === current + 1
  );
  return candidates[0] ?? null;
}

function featureTypeLabelVi(ft: string): string {
  switch (ft) {
    case 'LISTING':
      return 'Tin đăng';
    case '3D_TOUR':
      return 'Tour 3D';
    case 'AI_REQUEST':
      return 'AI Assistant';
    default:
      return ft;
  }
}

function quotaBenefitLabel(p: FeaturePackage): string {
  if (p.unlimited) {
    if (p.feature_type === 'AI_REQUEST') return 'Không giới hạn lượt AI / ngày';
    if (p.feature_type === '3D_TOUR') return 'Không giới hạn tour 3D';
    return 'Không giới hạn tin đăng hoạt động';
  }
  if (p.feature_type === 'AI_REQUEST') return `${p.quota} lượt AI assistant / ngày`;
  if (p.feature_type === '3D_TOUR') return `${p.quota} tour 3D`;
  return `${p.quota} tin đăng hoạt động`;
}

function durationBenefitLabel(days: number): string {
  if (days === -1) return 'Thời hạn: không giới hạn';
  if (days === 30) return 'Thời hạn: 30 ngày (≈ 1 tháng)';
  return `Thời hạn: ${days} ngày`;
}

/** Gói trả phí — tránh checkout 0đ với gói FREE trên catalog. */
function paidFeaturePackages(list: FeaturePackage[]): FeaturePackage[] {
  return list.filter((p) => !p.free && Number(p.price) > 0);
}

function mapFeaturePackage(p: FeaturePackage): Plan {
  const benefits: { label: string }[] = [
    { label: quotaBenefitLabel(p) },
    { label: durationBenefitLabel(p.duration_days) },
  ];
  const features: { label: string }[] = [];
  if (p.description?.trim()) {
    features.push({ label: p.description.trim() });
  }
  features.push({ label: `Loại: ${featureTypeLabelVi(p.feature_type)}` });

  const priceLabel = (p.price).toLocaleString('vi-VN') + ' đ';
  const durationLabel =
    p.duration_days === -1 ? 'vô thời hạn' : p.duration_days === 30 ? 'tháng' : `${p.duration_days} ngày`;

  const isPopular =
    p.code === 'LISTING_25' || p.code === '3D_TOUR_15' || p.code === 'AI_100';

  return {
    id: p.code,
    name: p.name,
    description: p.description,
    price: p.price,
    priceLabel,
    durationDays: p.duration_days,
    durationLabel,
    isPopular,
    benefits,
    features,
    featureType: p.feature_type,
    tierLevel: packageTierLevelFromCode(p.code),
  };
}

function mapBoostPackage(p: BoostPackage): Plan {
  const benefits: { label: string }[] = [
    { label: `${p.featured_quota} Tin đăng nổi bật` },
    { label: `${p.hot_badge_quota} Huy hiệu HOT` },
    { label: `Hiển thị ưu tiên ${p.duration_days} ngày` },
  ];
  const features: { label: string }[] = [
    { label: 'Tăng lượt xem' },
    { label: 'Đặt lên đầu kết quả tìm kiếm' },
  ];
  const priceLabel = (p.price).toLocaleString('vi-VN') + ' đ';
  return {
    id: p.code,
    name: p.name,
    description: p.description,
    price: p.price,
    priceLabel,
    durationDays: p.duration_days,
    durationLabel: `${p.duration_days} ngày`,
    isPopular: p.code === 'PREMIUM',
    benefits,
    features,
    tierLevel: 0,
  };
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function QuotaUsageBar({
  used,
  total,
  unlimited,
}: {
  used: number;
  total: number;
  unlimited: boolean;
}) {
  if (unlimited || total <= 0) {
    return (
      <p className='text-xs font-medium text-muted-foreground'>Không giới hạn quota — không cần theo dõi mức dùng.</p>
    );
  }
  const pct = Math.min(100, Math.round((used / total) * 100));
  const isHigh = pct >= 80;
  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>Đã dùng</span>
        <span className='font-semibold text-foreground'>{pct}%</span>
      </div>
      <div className='flex items-center gap-3'>
        <div className='h-2 flex-1 overflow-hidden rounded-full bg-primary/10'>
          <div
            className={cn('h-full rounded-full transition-all', isHigh ? 'bg-orange-400' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className='w-20 shrink-0 text-right text-xs font-medium text-muted-foreground'>
          {used}/{total}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Current active plans
// ---------------------------------------------------------------------------

function CurrentPlansSection({ onUpgrade }: { onUpgrade: (planId: string) => void }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const { data: subscriptions, isLoading } = useQuery({ ...billingQueries.mySubscriptions(), enabled: isAuthenticated });
  const { data: boosts, isLoading: boostsLoading } = useQuery({ ...billingQueries.myBoosts(), enabled: isAuthenticated });
  const { data: catalogRaw } = useQuery(billingQueries.subscriptionPlans());
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [subscriptionIdToCancel, setSubscriptionIdToCancel] = React.useState<string | null>(null);
  const [showCancelBoostConfirm, setShowCancelBoostConfirm] = React.useState(false);
  const [boostIdToCancel, setBoostIdToCancel] = React.useState<string | null>(null);

  const cancelMut = useMutation({
    mutationFn: (id: string) => billingApi.cancelSubscription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
      toast.success('Đã huỷ gói đăng ký.');
      setShowCancelConfirm(false);
      setSubscriptionIdToCancel(null);
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof HttpError && e.payload?.message
          ? String(e.payload.message)
          : 'Không huỷ được gói. Thử lại sau.';
      toast.error(msg);
    },
  });

  const cancelBoostMut = useMutation({
    mutationFn: (id: string) => billingApi.cancelBoost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.myBoosts() });
      toast.success('Đã huỷ gói đẩy tin.');
      setShowCancelBoostConfirm(false);
      setBoostIdToCancel(null);
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof HttpError && e.payload?.message
          ? String(e.payload.message)
          : 'Không huỷ được gói. Thử lại sau.';
      toast.error(msg);
    },
  });

  if (isLoading || boostsLoading) {
    return (
      <div>
        <h2 className='mb-4 text-base font-semibold text-foreground'>Gói đang hoạt động</h2>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' /> Đang tải...
        </div>
      </div>
    );
  }

  const active: ActiveSubscriptionResponse[] = subscriptions ?? [];
  const activeBoosts: ActiveBoostPackageResponse[] = boosts ?? [];
  const catalog = catalogRaw ?? [];

  return (
    <div>
      <h2 className='mb-4 text-base font-semibold text-foreground'>Gói đang hoạt động</h2>

      {/* Display subscriptions */}
      {active.length === 0 && activeBoosts.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Bạn chưa có gói nào đang hoạt động.</p>
      ) : (
        <div className='space-y-6'>
          {/* Subscriptions section */}
          {active.map((sub) => {
            const tier = sub.tier_level ?? packageTierLevelFromCode(sub.package_code);
            const limit = sub.quota_limit;
            const remaining = sub.remaining_quota;
            const used =
              !sub.unlimited && limit != null && limit > 0 && remaining != null
                ? Math.max(0, limit - remaining)
                : 0;
            const totalForBar = !sub.unlimited && limit != null && limit > 0 ? limit : 0;
            const nextPkg = findNextUpgradePackage(sub, catalog);

            return (
              <div
                key={sub.subscription_id}
                className='grid gap-4 lg:grid-cols-2 lg:items-stretch'
              >
                <div className='flex flex-col rounded-xl border border-foreground/10 bg-white p-5 shadow-sm ring-1 ring-border'>
                  <div className='flex flex-row items-center justify-between'>
                    <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Gói hiện tại</p>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border'>
                        {featureTypeLabelVi(sub.feature_type)}
                      </span>
                      <span className='rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border'>
                        {tierLabelVi(tier)}
                      </span>
                    </div>
                  </div>
                  <h3 className='mt-2 text-lg font-bold text-foreground'>{sub.package_name}</h3>
                  <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <CalendarDays className='size-3.5 shrink-0' />
                    <span>
                      {sub.end_date ? `Hết hạn: ${formatDate(sub.end_date)}` : 'Không giới hạn thời hạn'}
                    </span>
                  </div>
                  <div className='mt-2'>
                    <QuotaUsageBar used={used} total={totalForBar} unlimited={sub.unlimited} />
                  </div>
                  {tier > 0 && (
                  <div className='mt-3 flex flex-wrap gap-2 pt-0'>
                    <RealVistaButton
                      variant='secondary'
                      size='small'
                      disabled={cancelMut.isPending}
                      onClick={() => {
                        setSubscriptionIdToCancel(sub.subscription_id);
                        setShowCancelConfirm(true);
                      }}
                    >
                      {cancelMut.isPending ? 'Đang huỷ…' : 'Huỷ gói'}
                    </RealVistaButton>
                  </div>
                  )}
                </div>

                <div className='flex flex-col rounded-xl border border-foreground/10 bg-white p-5 shadow-sm ring-1 ring-border'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Nâng cấp</p>
                  {nextPkg ? (
                    <>
                      <h3 className='mt-2 text-lg font-bold text-foreground'>{nextPkg.name}</h3>
                      <p className='mt-1 text-sm text-muted-foreground'>{nextPkg.description}</p>
                      <p className='mt-1 text-2xl font-bold text-foreground'>
                        {(nextPkg.price).toLocaleString('vi-VN')} đ
                        <span className='text-xs font-normal text-muted-foreground'>
                          /
                          {nextPkg.duration_days === 30 ? 'tháng' : `${nextPkg.duration_days} ngày`}
                        </span>
                      </p>
                      <div className='mt-auto'>
                        <RealVistaButton
                          size='small'
                          className='w-full sm:w-auto bg-primary text-white hover:bg-primary-dark'
                          onClick={() => onUpgrade(nextPkg.code)}
                        >
                          Nâng cấp
                        </RealVistaButton>
                      </div>
                    </>
                  ) : (
                    <p className='mt-4 flex-1 text-sm text-muted-foreground'>
                      Bạn đang ở mức cao nhất cho {featureTypeLabelVi(sub.feature_type)} trong danh mục hiện tại.
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Boost packages section */}
          {activeBoosts.map((boost) => (
            <div
              key={boost.boost_package_id}
              className='grid gap-4 lg:grid-cols-2 lg:items-stretch'
            >
              <div className='flex flex-col rounded-xl border border-foreground/10 bg-white p-5 shadow-sm ring-1 ring-border'>
                <div className='flex flex-row items-center justify-between'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Gói đẩy tin</p>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border'>
                      {boost.code}
                    </span>
                  </div>
                </div>
                <h3 className='mt-2 text-lg font-bold text-foreground'>{boost.name}</h3>
                <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <CalendarDays className='size-3.5 shrink-0' />
                  <span>
                    Hết hạn: {formatDate(boost.end_date)}
                  </span>
                </div>
                <div className='mt-2 space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Lượt đẩy nổi bật:</span>
                    <span className='font-semibold text-foreground'>{boost.remaining_featured_quota}/{boost.featured_quota}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Huy hiệu HOT:</span>
                    <span className='font-semibold text-foreground'>{boost.remaining_hot_badge_quota}/{boost.hot_badge_quota}</span>
                  </div>
                </div>
                <div className='mt-3 flex flex-wrap gap-2 pt-0'>
                  <RealVistaButton
                    variant='secondary'
                    size='small'
                    disabled={cancelBoostMut.isPending}
                    onClick={() => {
                      setBoostIdToCancel(boost.boost_package_id);
                      setShowCancelBoostConfirm(true);
                    }}
                  >
                    {cancelBoostMut.isPending ? 'Đang huỷ…' : 'Huỷ gói'}
                  </RealVistaButton>
                </div>
              </div>

              <div className='flex flex-col rounded-xl border border-foreground/10 bg-white p-5 shadow-sm ring-1 ring-border'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Chi tiết gói</p>
                <h3 className='mt-2 text-lg font-bold text-foreground'>{boost.name}</h3>
                <p className='mt-1 text-sm text-muted-foreground'>{boost.description}</p>
                <ul className='mt-3 space-y-1.5'>
                  <li className='flex items-start gap-2 text-sm text-foreground/70'>
                    <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                    {boost.featured_quota} lượt đẩy nổi bật
                  </li>
                  <li className='flex items-start gap-2 text-sm text-foreground/70'>
                    <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                    {boost.hot_badge_quota} huy hiệu HOT
                  </li>
                  <li className='flex items-start gap-2 text-sm text-foreground/70'>
                    <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                    Hiển thị ưu tiên {boost.duration_days} ngày
                  </li>
                </ul>
                <div className='mt-auto pt-4'>
                  <p className='text-xs text-muted-foreground mb-2'>Muốn mua thêm gói khác?</p>
                  <RealVistaButton
                    size='small'
                    className='w-full sm:w-auto bg-primary text-white hover:bg-primary-dark'
                    onClick={() => {
                      document.getElementById('mua-goi-dich-vu')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Xem thêm gói
                  </RealVistaButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel subscription confirmation dialog */}
      {showCancelConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl border border-muted bg-white p-6 shadow-lg'>
            <h3 className='text-lg font-bold text-foreground'>Xác nhận huỷ gói</h3>
            <p className='mt-3 text-sm text-muted-foreground'>
              Huỷ gói này? Bạn sẽ mất quyền lợi ngay sau khi huỷ (theo chính sách hiện tại).
            </p>
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowCancelConfirm(false);
                  setSubscriptionIdToCancel(null);
                }}
                className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary/50 transition-colors'
              >
                Vẫn giữ gói
              </button>
              <RealVistaButton
                size='small'
                className='bg-primary text-white hover:bg-primary/90'
                disabled={cancelMut.isPending}
                onClick={() => {
                  if (subscriptionIdToCancel) {
                    cancelMut.mutate(subscriptionIdToCancel);
                  }
                }}
              >
                {cancelMut.isPending ? 'Đang huỷ…' : 'Huỷ gói'}
              </RealVistaButton>
            </div>
          </div>
        </div>
      )}

      {/* Cancel boost confirmation dialog */}
      {showCancelBoostConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl border border-muted bg-white p-6 shadow-lg'>
            <h3 className='text-lg font-bold text-foreground'>Xác nhận huỷ gói đẩy tin</h3>
            <p className='mt-3 text-sm text-muted-foreground'>
              Huỷ gói này? Bạn sẽ mất lượt đẩy tin còn lại ngay sau khi huỷ.
            </p>
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowCancelBoostConfirm(false);
                  setBoostIdToCancel(null);
                }}
                className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary/50 transition-colors'
              >
                Vẫn giữ gói
              </button>
              <RealVistaButton
                size='small'
                className='bg-primary text-white hover:bg-primary/90'
                disabled={cancelBoostMut.isPending}
                onClick={() => {
                  if (boostIdToCancel) {
                    cancelBoostMut.mutate(boostIdToCancel);
                  }
                }}
              >
                {cancelBoostMut.isPending ? 'Đang huỷ…' : 'Huỷ gói'}
              </RealVistaButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal stepper (wizard header)
// ---------------------------------------------------------------------------

const WIZARD_STEP_DEFS: { num: WizardStep; label: string; icon: React.ReactNode }[] = [
  { num: 1, label: 'Loại gói', icon: <LayoutGrid className='size-4' /> },
  { num: 2, label: 'Chọn gói', icon: <PackageSearch className='size-4' /> },
  { num: 3, label: 'Thanh toán', icon: <CreditCard className='size-4' /> },
  { num: 4, label: 'Kết quả', icon: <CheckCircle2 className='size-4' /> },
];

function StepIconCircle({
  active,
  done,
  reachable,
  icon,
}: {
  active: boolean;
  done: boolean;
  reachable: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        active
          ? 'border-primary bg-primary text-white ring-4 ring-primary/20'
          : done
            ? 'border-primary bg-primary text-white'
            : reachable
              ? 'border-primary bg-white text-primary'
              : 'border-border bg-white text-muted-foreground/80'
      )}
    >
      {done ? <Check className='size-3.5' /> : icon}
    </div>
  );
}

function StepLabel({
  num,
  label,
  active,
  done,
}: {
  num: WizardStep;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className='flex flex-col items-start gap-0.5'>
      <span className='text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80'>
        Bước {num}
      </span>
      <span
        className={cn(
          'text-start text-xs font-semibold leading-tight sm:text-sm',
          active || done ? 'text-foreground' : 'text-muted-foreground/80'
        )}
      >
        {label}
      </span>
      {active && (
        <span className='mt-0.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary'>
          Đang thực hiện
        </span>
      )}
      {done && (
        <span className='mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600'>
          Hoàn thành
        </span>
      )}
      {!active && !done && (
        <span className='mt-0.5 inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground'>
          Chờ
        </span>
      )}
    </div>
  );
}

function HorizontalWizardSteps({
  activeStep,
  onStepChange,
}: {
  activeStep: WizardStep;
  typeSummary?: React.ReactNode;
  planSummary?: React.ReactNode;
  paymentSummary?: React.ReactNode;
  onStepChange: (s: WizardStep) => void;
}) {
  return (
    <div className='mb-6 w-full overflow-x-auto pb-1'>
      <div className='flex min-w-0 items-start pl-1'>
        {WIZARD_STEP_DEFS.map((item, index) => {
          const done = activeStep > item.num;
          const active = activeStep === item.num;
          const reachable = activeStep >= item.num;
          const isLast = index === WIZARD_STEP_DEFS.length - 1;

          return (
            /* Each step slot is relative so the connector line can be absolutely positioned.
               flex-1 on all but the last step so they share available width evenly. */
            <div
              key={item.num}
              className={cn('relative', isLast ? 'shrink-0' : 'flex-1')}
            >
              {/* Connector line — absolute so it sits flush between icons with no gap.
                  left-8  = right edge of this step's icon circle (size-8 = 2rem)
                  right-0 = left edge of next step's container (= next icon's left edge)
                  top-4   = vertical centre of the icon circle (size-8 / 2 = 1rem) */}
              {!isLast && (
                <div
                  aria-hidden
                  className={cn(
                    'absolute left-8 right-0 top-4 h-0.5 translate-y-px transition-colors',
                    done ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}

              <button
                type='button'
                disabled={!reachable}
                onClick={() => reachable && onStepChange(item.num)}
                className={cn(
                  'group/step relative flex flex-col items-start gap-2.5 py-1 transition-opacity',
                  reachable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-50'
                )}
              >
                <StepIconCircle active={active} done={done} reachable={reachable} icon={item.icon} />
                <StepLabel num={item.num} label={item.label} active={active} done={done} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — package type
// ---------------------------------------------------------------------------

function Step1Content({
  selected,
  onSelect,
  onNext,
  canBuyBoost,
}: {
  selected: PackageType | null;
  onSelect: (t: PackageType) => void;
  onNext: () => void;
  canBuyBoost: boolean;
}) {
  return (
    <div className='space-y-4'>
      <div className={cn('grid gap-3', canBuyBoost && 'sm:grid-cols-2')}>
        <button
          type='button'
          onClick={() => onSelect('subscription')}
          className={cn(
            'relative flex flex-col items-start gap-4 rounded-xl p-5 text-left transition-all',
            selected === 'subscription'
              ? 'bg-primary/5'
              : 'bg-white'
          )}
        >
          <div className='flex items-start gap-3 w-full'>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                selected === 'subscription' ? 'bg-primary text-white' : 'bg-primary/5 text-primary'
              )}
            >
              <CreditCard className='size-5' />
            </div>
            <p className='font-semibold text-sm text-foreground flex-1'>Gói tính năng</p>
            {selected === 'subscription' && <Check className='size-5 shrink-0 text-primary' />}
          </div>
          <ul className='w-full space-y-2'>
            <li className='flex items-start gap-2 text-sm text-foreground/70'>
              <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
              Đăng tin bất động sản
            </li>
            <li className='flex items-start gap-2 text-sm text-foreground/70'>
              <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
              Lượt AI assistant
            </li>
            <li className='flex items-start gap-2 text-sm text-foreground/70'>
              <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
              Tạo 3D model cho bất động sản
            </li>
          </ul>
        </button>

        {canBuyBoost && (
        <button
          type='button'
          onClick={() => onSelect('boost')}
          className={cn(
            'relative flex flex-col items-start gap-4 rounded-xl p-5 text-left transition-all',
            selected === 'boost'
              ? 'bg-primary/5'
              : 'bg-white'
          )}
        >
          <div className='flex items-start gap-3 w-full'>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                selected === 'boost' ? 'bg-primary text-white' : 'bg-primary/5 text-primary'
              )}
            >
              <Rocket className='size-5' />
            </div>
            <p className='font-semibold text-sm text-foreground flex-1'>Gói đẩy tin</p>
            {selected === 'boost' && <Check className='size-5 shrink-0 text-primary' />}
          </div>
          <ul className='w-full space-y-2'>
            <li className='flex items-start gap-2 text-sm text-foreground/70'>
              <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
              Đẩy nổi bật
            </li>
            <li className='flex items-start gap-2 text-sm text-foreground/70'>
              <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
              Huy hiệu HOT
            </li>
          </ul>
        </button>
        )}
      </div>

      <div className='flex justify-end pt-1'>
        <RealVistaButton size='small' disabled={!selected} onClick={onNext} withIcon>
          Tiếp theo
        </RealVistaButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — plan selection
// ---------------------------------------------------------------------------

function isCurrentActivePlan(planCode: string, mySubs: ActiveSubscriptionResponse[] | undefined): boolean {
  return mySubs?.some((s) => s.package_code === planCode && s.status === 'ACTIVE') ?? false;
}

function isCurrentActiveBoost(
  boostCode: string,
  myBoosts: ActiveBoostPackageResponse[] | undefined
): boolean {
  return myBoosts?.some((b) => b.code === boostCode && b.status === 'ACTIVE') ?? false;
}

function isSubscriptionPlanBlocked(plan: Plan, mySubs: ActiveSubscriptionResponse[] | undefined): boolean {
  if (!plan.featureType) return false;
  const maxT = maxActiveTierForFeature(mySubs, plan.featureType);
  // Block if lower tier OR if exact code is already active
  const isCurrentlyActive = mySubs?.some((s) => s.package_code === plan.id && s.status === 'ACTIVE') ?? false;
  return plan.tierLevel < maxT || isCurrentlyActive;
}

function Step2Content({
  type,
  selectedPlanId,
  onSelectPlan,
  onNext,
  onRetry,
  allowedFeatureTypes,
}: {
  type: PackageType;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onNext: () => void;
  onRetry: () => void;
  allowedFeatureTypes?: string[];
}) {
  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const subQuery = useQuery(billingQueries.subscriptionPlans());
  const boostQuery = useQuery(billingQueries.boostPackages());
  const { data: mySubs } = useQuery({ ...billingQueries.mySubscriptions(), enabled: isAuthenticated });
  const { data: myBoosts } = useQuery({ ...billingQueries.myBoosts(), enabled: isAuthenticated });

  const rawPlans = React.useMemo(() => {
    const plans =
      type === 'subscription'
        ? paidFeaturePackages(subQuery.data ?? []).map(mapFeaturePackage)
        : (boostQuery.data ?? []).map(mapBoostPackage);
    if (allowedFeatureTypes && type === 'subscription') {
      return plans.filter((p) => p.featureType && allowedFeatureTypes.includes(p.featureType));
    }
    return plans;
  }, [type, subQuery.data, boostQuery.data, allowedFeatureTypes]);

  const isLoading = type === 'subscription' ? subQuery.isLoading : boostQuery.isLoading;

  // Group subscription plans by feature type
  const plansByFeatureType = React.useMemo(() => {
    if (type !== 'subscription') return null;
    const grouped: Record<string, Plan[]> = {};
    rawPlans.forEach((plan) => {
      if (plan.featureType) {
        if (!grouped[plan.featureType]) grouped[plan.featureType] = [];
        grouped[plan.featureType].push(plan);
      }
    });
    return grouped;
  }, [type, rawPlans]);

  // Feature type order and labels
  const featureTypeOrder = ['LISTING', '3D_TOUR', 'AI_REQUEST'];
  const featureTypes = type === 'subscription' && plansByFeatureType
    ? featureTypeOrder.filter((ft) => plansByFeatureType[ft])
    : [];

  const [selectedFeatureType, setSelectedFeatureType] = React.useState<string>(
    featureTypes[0] ?? ''
  );

  // Sync selectedFeatureType to match the selected plan's feature type.
  // Runs when featureTypes data loads OR when selectedPlanId changes (e.g. upgrade navigation).
  React.useEffect(() => {
    if (featureTypes.length === 0) return;
    // If a plan is selected, navigate to its tab
    if (selectedPlanId && plansByFeatureType) {
      for (const ft of featureTypes) {
        if ((plansByFeatureType[ft] ?? []).some((p) => p.id === selectedPlanId)) {
          if (ft !== selectedFeatureType) setSelectedFeatureType(ft);
          return;
        }
      }
    }
    // No plan selected or plan not found — fall back to first valid tab
    if (!featureTypes.includes(selectedFeatureType)) {
      setSelectedFeatureType(featureTypes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureTypes.join(','), selectedPlanId]);

  // Get plans for active feature type
  const plansForFeatureType = React.useMemo(() => {
    return type === 'subscription' && plansByFeatureType
      ? plansByFeatureType[selectedFeatureType] ?? []
      : rawPlans;
  }, [type, plansByFeatureType, selectedFeatureType, rawPlans]);

  // Stable string key of active boost codes — avoids putting an object in useEffect deps
  const activeBoostCodesKey = React.useMemo(
    () => (myBoosts ?? []).filter((b) => b.status === 'ACTIVE').map((b) => b.code).join(','),
    [myBoosts]
  );

  const firstSelectableId = React.useMemo(() => {
    if (type === 'boost') {
      const activeCodes = new Set(activeBoostCodesKey.split(',').filter(Boolean));
      const ok = rawPlans.find((p) => !activeCodes.has(p.id));
      return ok?.id ?? rawPlans[0]?.id ?? '';
    }
    const ok = plansForFeatureType.find((p) => !isSubscriptionPlanBlocked(p, mySubs));
    return ok?.id ?? plansForFeatureType[0]?.id ?? '';
  }, [type, rawPlans, plansForFeatureType, mySubs, activeBoostCodesKey]);

  const activePlanId = selectedPlanId ?? firstSelectableId;
  const selectedPlan = plansForFeatureType.find((p) => p.id === activePlanId) ?? plansForFeatureType[0] ?? null;

  React.useEffect(() => {
    if (!firstSelectableId) return;
    if (type === 'subscription') {
      const sel = plansForFeatureType.find((p) => p.id === selectedPlanId);
      const currentIsBlocked = !!sel && isSubscriptionPlanBlocked(sel, mySubs);
      if (!selectedPlanId || currentIsBlocked) {
        onSelectPlan(firstSelectableId);
      }
      return;
    }
    // boost: default to first non-active plan
    const activeCodes = new Set(activeBoostCodesKey.split(',').filter(Boolean));
    if (!selectedPlanId || activeCodes.has(selectedPlanId)) {
      onSelectPlan(firstSelectableId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, rawPlans.map((p) => p.id).join(','), firstSelectableId, mySubs, activeBoostCodesKey, selectedFeatureType]);

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground py-4'>
        <Loader2 className='size-4 animate-spin' /> Đang tải gói...
      </div>
    );
  }

  if (type === 'subscription' && rawPlans.length === 0) {
    return (
      <p className='text-sm text-muted-foreground py-4'>
        Hiện không có gói tính năng trả phí để mua. Kiểm tra lại API hoặc danh sách gói trên hệ thống.
      </p>
    );
  }

  if (!selectedPlan) return null;

  const selectableCount = type === 'subscription'
    ? plansForFeatureType.filter((p) => !isSubscriptionPlanBlocked(p, mySubs)).length
    : plansForFeatureType.length;

  if (type === 'subscription' && selectableCount === 0 && plansForFeatureType.length > 0) {
    return (
      <p className='py-4 text-sm text-muted-foreground'>
        Bạn đang dùng gói cao nhất cho {featureTypeLabelVi(selectedFeatureType)}. Để đổi gói, hãy{' '}
        <span className='font-medium text-primary'>huỷ gói hiện tại</span> ở phần trên rồi chọn gói thấp hơn (nếu
        phù hợp), hoặc chờ hết hạn.
      </p>
    );
  }

  return (
    <div className='space-y-4 pt-3'>
      {/* Feature type tabs for subscriptions */}
      {type === 'subscription' && featureTypes.length > 1 && (
        <div className='relative'>
          {/* Bookmark tags layer - positioned absolutely to the left, outside */}
          <div className='absolute right-full top-0 -rotate-90 origin-right flex flex-row gap-2 z-10 -mr-[-37px]'>
            {featureTypes.map((featureType) => (
              <button
                key={featureType}
                type='button'
                onClick={() => {
                  setSelectedFeatureType(featureType);
                  // Reset selected plan when changing feature type
                  const firstSelectable = plansByFeatureType?.[featureType]?.find(
                    (p) => !isSubscriptionPlanBlocked(p, mySubs)
                  )?.id ?? plansByFeatureType?.[featureType]?.[0]?.id;
                  if (firstSelectable) {
                    onSelectPlan(firstSelectable);
                  }
                }}
                className={cn(
                  'relative flex shrink-0 items-center justify-center px-2 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                  'rounded-t-lg border-2 border-b-0',
                  selectedFeatureType === featureType
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-muted text-muted-foreground hover:bg-secondary/50'
                )}
              >
                {featureTypeLabelVi(featureType)}
              </button>
            ))}
          </div>

          {/* Content section - no border container */}
          <div className='flex flex-col gap-4 lg:flex-row'>
            <div className='flex flex-col gap-4 lg:w-2/5'>
              {plansForFeatureType.map((plan) => {
                const blocked = type === 'subscription' && isSubscriptionPlanBlocked(plan, mySubs);
                let isCurrentActive = false;
                if (type === 'subscription') {
                  isCurrentActive = isCurrentActivePlan(plan.id, mySubs);
                } else if (type === 'boost') {
                  isCurrentActive = isCurrentActiveBoost(plan.id, myBoosts);
                }
                return (
                  <button
                    key={plan.id}
                    type='button'
                    disabled={blocked || isCurrentActive}
                    onClick={() => !blocked && !isCurrentActive && onSelectPlan(plan.id)}
                    className={cn(
                      'relative flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-all',
                      (blocked || isCurrentActive) && 'cursor-not-allowed',
                      activePlanId === plan.id && !blocked && !isCurrentActive
                        ? 'border-2 border-primary bg-white shadow-md'
                        : !blocked && !isCurrentActive && 'border border-border bg-white hover:border-primary/30 hover:bg-primary/5',
                      (blocked || isCurrentActive) && 'border border-border bg-secondary/50'
                    )}
                  >
                    {(plan.isPopular || isCurrentActive) && (
                      <span className={cn('absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white', isCurrentActive ? 'bg-muted-foreground/80' : 'bg-primary')}>
                        {isCurrentActive ? 'Gói đang dùng' : 'Phổ biến nhất'}
                      </span>
                    )}
                    <div className='min-w-0'>
                      <p className='font-semibold text-sm text-foreground'>{plan.name}</p>
                      <p className='text-xs text-muted-foreground'>{plan.description}</p>
                    </div>
                    <div className='ml-3 shrink-0 text-right'>
                      <span className='text-lg font-bold text-foreground'>{plan.priceLabel}</span>
                      <span className='text-xs text-muted-foreground'>/{plan.durationLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Plan details - simplified border */}
            <div className='rounded-xl border border-primary/20 bg-primary/5 p-5 lg:flex-1 shadow-sm'>
              <div className='mb-4 flex items-start justify-between gap-2'>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-lg font-bold text-foreground'>{selectedPlan.name}</h3>
                    {selectedPlan.isPopular && (
                      <span className='rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white'>
                        Phổ biến nhất
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {type === 'subscription' ? 'Gói tính năng (tin đăng / 3D / AI)' : `Gói ${selectedPlan.durationLabel}`}
                  </p>
                </div>
                <div className='shrink-0 text-right'>
                  <p className='text-2xl font-bold text-foreground'>
                    {selectedPlan.priceLabel}
                  </p>
                  <p className='text-xs text-muted-foreground'>/{selectedPlan.durationLabel}</p>
                </div>
              </div>

              <div className='mb-4'>
                <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Quyền lợi</p>
                <ul className='space-y-1.5'>
                  {selectedPlan.benefits.map((b) => (
                    <li key={b.label} className='flex items-start gap-2 text-sm text-foreground/70'>
                      <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                      {b.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className='mb-5'>
                <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Tính năng</p>
                <ul className='space-y-1.5'>
                  {selectedPlan.features.map((f) => (
                    <li key={f.label} className='flex items-start gap-1.5 text-sm text-foreground/70'>
                      <span className='mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* For boost packages or single feature type subscriptions - original layout */}
      {!(type === 'subscription' && featureTypes.length > 1) && (
        <div className='flex flex-col gap-4 lg:flex-row'>
          <div className='flex flex-col gap-4 lg:w-2/5'>
            {plansForFeatureType.map((plan) => {
              const blocked = type === 'subscription' && isSubscriptionPlanBlocked(plan, mySubs);
              let isCurrentActive = false;
              if (type === 'subscription') {
                isCurrentActive = isCurrentActivePlan(plan.id, mySubs);
              } else if (type === 'boost') {
                isCurrentActive = isCurrentActiveBoost(plan.id, myBoosts);
              }
              return (
                <button
                  key={plan.id}
                  type='button'
                  disabled={blocked || isCurrentActive}
                  onClick={() => !blocked && !isCurrentActive && onSelectPlan(plan.id)}
                  className={cn(
                    'relative flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all',
                    (blocked || isCurrentActive) && 'cursor-not-allowed',
                    activePlanId === plan.id && !blocked && !isCurrentActive
                      ? 'border-primary bg-primary/5'
                      : !blocked && !isCurrentActive && 'border-border bg-white hover:border-primary/30 hover:bg-primary/5',
                    (blocked || isCurrentActive) && 'border-border bg-muted/50'
                  )}
                >
                  {(plan.isPopular || isCurrentActive) && (
                    <span className={cn('absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white', isCurrentActive ? 'bg-muted-foreground/80' : 'bg-primary')}>
                      {isCurrentActive ? 'Gói đang dùng' : 'Phổ biến nhất'}
                    </span>
                  )}
                  <div className='min-w-0'>
                    <p className='font-semibold text-sm text-foreground'>{plan.name}</p>
                    <p className='text-xs text-muted-foreground'>{plan.description}</p>
                  </div>
                  <div className='ml-3 shrink-0 text-right'>
                    <span className='text-lg font-bold text-foreground'>{plan.priceLabel}</span>
                    <span className='text-xs text-muted-foreground'>/{plan.durationLabel}</span>
                  </div>
                  {blocked && !isCurrentActive && (
                    <span className='absolute bottom-1 left-3 text-[10px] font-medium text-orange-600'>
                      Đang dùng gói cao hơn
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className='rounded-xl border border-primary/20 bg-primary/5 p-5 lg:flex-1 shadow-sm'>
            <div className='mb-4 flex items-start justify-between gap-2'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='text-lg font-bold text-foreground'>{selectedPlan.name}</h3>
                  {selectedPlan.isPopular && (
                    <span className='rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white'>
                      Phổ biến nhất
                    </span>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {type === 'subscription' ? 'Gói tính năng (tin đăng / 3D / AI)' : `Gói ${selectedPlan.durationLabel}`}
                </p>
              </div>
              <div className='shrink-0 text-right'>
                <p className='text-2xl font-bold text-foreground'>
                  {selectedPlan.priceLabel}
                </p>
                <p className='text-xs text-muted-foreground'>/{selectedPlan.durationLabel}</p>
              </div>
            </div>

            <div className='mb-4'>
              <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Quyền lợi</p>
              <ul className='space-y-1.5'>
                {selectedPlan.benefits.map((b) => (
                  <li key={b.label} className='flex items-start gap-2 text-sm text-foreground/70'>
                    <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                    {b.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className='mb-5'>
              <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Tính năng</p>
              <ul className='space-y-1.5'>
                {selectedPlan.features.map((f) => (
                  <li key={f.label} className='flex items-start gap-1.5 text-sm text-foreground/70'>
                    <span className='mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/80' />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-between pt-1'>
        <RealVistaButton
          variant='secondary'
          size='small'
          onClick={onRetry}
        >
          Quay lại
        </RealVistaButton>
        <RealVistaButton
          size='small'
          onClick={onNext}
          withIcon
          disabled={type === 'subscription' && isSubscriptionPlanBlocked(selectedPlan, mySubs)}
        >
          Chọn gói này
        </RealVistaButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — payment method + QR / redirect
// ---------------------------------------------------------------------------

function Step3Content({
  selectedPlan,
  selectedType,
  selectedPayment,
  onSelectPayment,
  onCheckoutCreated,
  onNext,
  onRetry,
}: {
  selectedPlan: Plan | null;
  selectedType: PackageType | null;
  selectedPayment: PaymentMethod | null;
  onSelectPayment: (m: PaymentMethod) => void;
  onCheckoutCreated: (res: CheckoutResponse) => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  const queryClient = useQueryClient();
  const [checkout, setCheckout] = React.useState<CheckoutResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: billingApi.checkout,
    onSuccess: () => {
      setError(null);
    },
    onError: (e: unknown) => {
      if (e instanceof HttpError && e.payload?.message) {
        setError(String(e.payload.message));
        toast.error(String(e.payload.message));
        return;
      }
      setError('Không thể tạo link thanh toán. Vui lòng thử lại.');
      toast.error('Không thể tạo link thanh toán.');
    },
  });

  // Refs to distinguish manual clicks from auto-poll (only show toast on manual)
  const isManualSyncRef = React.useRef(false);
  const syncPayOsMutationRef = React.useRef<ReturnType<typeof useMutation<
    { payload: { data?: TransactionStatusResponse } },
    Error, void, unknown
  >> | null>(null);

  const syncPayOsMutation = useMutation({
    mutationFn: () => billingApi.syncPayOsFromCheckoutOrder(checkout?.checkout_order_id ?? ''),
    onSuccess: (res) => {
      const txnStatus = (res.payload as { data?: TransactionStatusResponse }).data?.status;
      if (txnStatus === 'COMPLETED') {
        onNext();
      } else if (isManualSyncRef.current) {
        toast.info('Chưa nhận được thanh toán. Vui lòng thử lại sau ít phút.');
      }
      isManualSyncRef.current = false;
    },
    onError: () => {
      if (isManualSyncRef.current) {
        toast.error('Không thể kiểm tra trạng thái PayOS');
      }
      isManualSyncRef.current = false;
    },
  });
  syncPayOsMutationRef.current = syncPayOsMutation;

  // Auto-poll PayOS every 10 s while checkout is active — mirrors VNPay behaviour
  React.useEffect(() => {
    if (!checkout?.checkout_order_id || checkout.payment_method !== 'PAYOS') return;
    const id = setInterval(() => {
      if (!syncPayOsMutationRef.current?.isPending) {
        syncPayOsMutationRef.current?.mutate();
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [checkout?.checkout_order_id, checkout?.payment_method]);

  // PayOS: countdown to QR expiry driven by expired_at from server
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!checkout?.expired_at) {
      setSecondsLeft(null);
      return;
    }
    const calcRemaining = () =>
      Math.max(0, checkout.expired_at! - Math.floor(Date.now() / 1000));
    setSecondsLeft(calcRemaining());
    const id = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [checkout?.expired_at]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  // Poll VNPay transaction status when checkout is created with VNPay
  React.useEffect(() => {
    if (!checkout || checkout.payment_method !== 'VNPAY') return;
    if (!checkout.checkout_order_id) return;

    const interval = setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: billingKeys.transactionStatus(checkout.checkout_order_id),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [checkout, queryClient]);

  // When VNPay transaction completes, auto proceed to step 4
  const { data: vnpayStatusData } = useQuery({
    ...billingQueries.transactionStatus(checkout?.checkout_order_id ?? ''),
    enabled: !!checkout && checkout.payment_method === 'VNPAY' && !!checkout.checkout_order_id,
  });

  React.useEffect(() => {
    if (vnpayStatusData?.status === 'COMPLETED' && selectedPayment === 'vnpay') {
      onNext();
    }
  }, [vnpayStatusData?.status, selectedPayment, onNext]);

  const requestCheckout = React.useCallback(
    (method: 'PAYOS' | 'VNPAY', onDone?: (data: CheckoutResponse) => void) => {
      if (!selectedPlan || !selectedType) return;
      checkoutMutation.mutate(
        {
          plan_code: selectedPlan.id,
          plan_type: selectedType === 'boost' ? 'BOOST' : 'SUBSCRIPTION',
          payment_method: method,
        },
        {
          onSuccess: (res: { payload: { data: CheckoutResponse } }) => {
            const data = res.payload.data;
            setCheckout(data);
            setError(null);
            void queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
            void queryClient.invalidateQueries({ queryKey: billingKeys.myBoosts() });
            onCheckoutCreated(data);
            onDone?.(data);
          },
        }
      );
    },
    [checkoutMutation, queryClient, selectedPlan, selectedType, onCheckoutCreated]
  );

  const handleSelectPayment = (method: PaymentMethod) => {
    onSelectPayment(method);
    setError(null);

    if (method === 'vnpay') {
      setCheckout(null);
      // VNPay: tạo link khi chọn (show button section)
      if (!selectedPlan || !selectedType) return;
      if (checkoutMutation.isPending) return;
      requestCheckout('VNPAY');
      return;
    }

    // PayOS: tạo link ngay khi chọn — không cần bấm thêm mới thấy QR
    if (!selectedPlan || !selectedType) return;
    if (checkoutMutation.isPending) return;
    if (checkout?.payment_method === 'PAYOS') return;

    setCheckout(null);
    requestCheckout('PAYOS');
  };

  const isLoading = checkoutMutation.isPending;

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    const startDate = today.toLocaleDateString('vi-VN');

    let endDate = 'Không giới hạn';
    if (selectedPlan && selectedPlan.durationDays > 0) {
      const end = new Date(today);
      end.setDate(end.getDate() + selectedPlan.durationDays);
      endDate = end.toLocaleDateString('vi-VN');
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-4 lg:flex-row'>
        {/* Left: Payment method selection */}
        <div className='flex flex-col gap-2.5 lg:w-2/5'>
          <p className='text-xs text-muted-foreground mb-1'>Chọn phương thức thanh toán</p>
          <button
            type='button'
            onClick={() => handleSelectPayment('vnpay')}
            className={cn(
              'flex items-center gap-3 rounded-xl p-4 text-left transition-all',
              selectedPayment === 'vnpay'
                ? 'bg-primary/5'
                : 'bg-white'
            )}
          >
            <div className='flex size-5 items-center justify-center rounded-full border-2 border-muted shrink-0'>
              {selectedPayment === 'vnpay' && (
                <div className='size-2.5 rounded-full bg-primary' />
              )}
            </div>
            <Image
              src='/vnpay.png'
              alt='VNPay'
              width={40}
              height={40}
              className='h-10 w-auto shrink-0 object-contain rounded-lg'
            />
            <div className='flex-1'>
              <p className='font-semibold text-sm text-foreground'>VNPay</p>
              <p className='text-xs text-muted-foreground'>Ví điện tử & ngân hàng</p>
            </div>
          </button>

          <button
            type='button'
            onClick={() => handleSelectPayment('payos')}
            className={cn(
              'flex items-center gap-3 rounded-xl p-4 text-left transition-all',
              selectedPayment === 'payos'
                ? 'bg-primary/5'
                : 'bg-white'
            )}
          >
            <div className='flex size-5 items-center justify-center rounded-full border-2 border-muted shrink-0'>
              {selectedPayment === 'payos' && (
                <div className='size-2.5 rounded-full bg-primary' />
              )}
            </div>
            <Image
              src='/payos.png'
              alt='PayOS'
              width={40}
              height={40}
              className='h-10 w-auto shrink-0 object-contain rounded-lg'
            />
            <div className='flex-1'>
              <p className='font-semibold text-sm text-foreground'>PayOS</p>
              <p className='text-xs text-muted-foreground'>Chuyển khoản ngân hàng</p>
            </div>
          </button>
        </div>

        {/* Right: Order review */}
        <div className='rounded-xl border border-primary/20 bg-primary/5 p-5 lg:flex-1 shadow-sm'>
          <div className='mb-4 flex items-start justify-between gap-2'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-lg font-bold text-foreground'>{selectedPlan?.name || 'Gói dịch vụ'}</h3>
              </div>
              <p className='text-xs text-muted-foreground'>
                {selectedType === 'subscription' ? 'Gói tính năng (tin đăng / 3D / AI)' : `Gói ${selectedPlan?.durationLabel}`}
              </p>
            </div>
            <div className='shrink-0 text-right'>
              <p className='text-2xl font-bold text-foreground'>
                {selectedPlan?.priceLabel}
              </p>
              <p className='text-xs text-muted-foreground'>/{selectedPlan?.durationLabel}</p>
            </div>
          </div>

          <div className='mb-4'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Quyền lợi</p>
            <ul className='space-y-1.5'>
              {selectedPlan?.benefits.map((b) => (
                <li key={b.label} className='flex items-start gap-2 text-sm text-foreground/70'>
                  <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                  {b.label}
                </li>
              ))}
            </ul>
          </div>

          <div className='mb-5'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80'>Thời hạn</p>
            <p className='text-sm text-foreground/70'>
              {startDate} - {endDate}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500'>
          {error}
        </div>
      )}

      {/* PayOS loading */}
      {selectedPayment === 'payos' && isLoading && (
        <div className='flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' />
          Đang tạo mã QR PayOS…
        </div>
      )}

      {/* PayOS: show QR after checkout created */}
      {selectedPayment === 'payos' && checkout && (checkout.qr_code || checkout.checkout_url) && (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-border bg-white py-6 shadow-sm'>
          {secondsLeft === 0 ? (
            /* Expired state — user may have already scanned and transferred */
            <div className='flex flex-col items-center gap-3 text-center px-6'>
              <div className='flex items-center gap-1.5 text-sm font-medium text-red-500'>
                <Clock className='size-4' />
                Mã QR đã hết hạn
              </div>
              <p className='text-xs text-muted-foreground'>
                Nếu bạn đã chuyển khoản, nhấn kiểm tra thanh toán.
                <br />Chưa chuyển? Tạo mã QR mới để tiếp tục.
              </p>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => { isManualSyncRef.current = true; syncPayOsMutation.mutate(); }}
                  disabled={syncPayOsMutation.isPending}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50 transition-colors'
                >
                  {syncPayOsMutation.isPending
                    ? <Loader2 className='size-3.5 animate-spin' />
                    : <CreditCard className='size-3.5' />}
                  Kiểm tra thanh toán
                </button>
                <button
                  type='button'
                  onClick={() => { setCheckout(null); requestCheckout('PAYOS'); }}
                  disabled={isLoading}
                  className='inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors'
                >
                  <RefreshCw className='size-3.5' />
                  Tạo mã QR mới
                </button>
              </div>
            </div>
          ) : (
            /* Active QR state */
            <>
              <p className='text-sm font-medium text-foreground/70 flex items-center gap-1.5'>
                Quét mã QR để thanh toán qua{' '}
                <span className='text-blue-600'>PayOS</span>
                {!syncPayOsMutation.isPending && (
                  <button
                    type='button'
                    onClick={() => { isManualSyncRef.current = true; syncPayOsMutation.mutate(); }}
                    disabled={syncPayOsMutation.isPending}
                    className='inline-flex items-center text-foreground/70 hover:text-muted-foreground transition-colors disabled:opacity-50'
                    title='Kiểm tra thanh toán'
                    aria-label='Confirm payment'
                  >
                    <CreditCard className='size-4' />
                  </button>
                )}
                {syncPayOsMutation.isPending && (
                  <Loader2 className='size-4 animate-spin text-foreground/70' />
                )}
              </p>
              <div className='rounded-xl border border-border bg-white p-1 shadow-md'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    checkout.qr_code || checkout.checkout_url
                  )}&color=7065f0&bgcolor=ffffff`}
                  alt='PayOS QR code'
                  width={180}
                  height={180}
                  className='rounded-lg'
                />
              </div>
              <p className={cn(
                'flex items-center gap-1 text-xs',
                secondsLeft === null ? 'text-muted-foreground'
                  : secondsLeft > 300 ? 'text-muted-foreground'
                    : secondsLeft > 60 ? 'text-yellow-600'
                      : 'text-red-500'
              )}>
                <Clock className='size-3' />
                {secondsLeft !== null
                  ? `Mã QR hết hạn sau ${formatCountdown(secondsLeft)}`
                  : 'Mã QR chỉ có giá trị trong 10 phút'}
              </p>
              <a
                href={checkout.checkout_url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 text-xs text-blue-600 underline underline-offset-2'
              >
                Mở PayOS <ExternalLink className='size-3' />
              </a>
            </>
          )}
        </div>
      )}

      {/* VNPay: show payment button after link created */}
      {selectedPayment === 'vnpay' && checkout && (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-border bg-white py-6 shadow-sm'>
          <p className='text-sm font-medium text-foreground/70'>
            Đã tạo link thanh toán VNPay
          </p>
          <RealVistaButton
            size='small'
            className='bg-primary text-white hover:bg-primary-dark'
            onClick={() => {
              window.open(checkout.checkout_url, '_blank');
            }}
          >
            Chuyển sang VNPay thanh toán
          </RealVistaButton>
          <p className='text-xs text-muted-foreground'>Cửa sổ thanh toán sẽ mở trong tab mới. Tự động quay về sau khi thanh toán xong</p>
        </div>
      )}

      <div className='flex justify-start pt-1'>
        <RealVistaButton
          variant='secondary'
          size='small'
          onClick={onRetry}
        >
          Quay lại
        </RealVistaButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — payment result (with live polling)
// ---------------------------------------------------------------------------

function Step4Content({
  transactionId,
  plan,
  onDone,
}: {
  transactionId: string | null;
  plan: Plan | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const savedTxnRef = React.useRef<string | null>(null);

  const { data: statusData, isLoading } = useQuery({
    ...billingQueries.transactionStatus(transactionId ?? ''),
    enabled: !!transactionId,
  });

  const saveTransactionMutation = useMutation({
    mutationFn: (id: string) => billingApi.saveTransaction(id),
    onSuccess: () => {
      // Billing + per-listing boost caches (separate query roots) so quota/3D/boost UI match the new purchase
      void Promise.all([
        queryClient.resetQueries({ queryKey: billingKeys.all }),
        queryClient.resetQueries({ queryKey: listingBoostKeys.all }),
      ]).catch((err) => {
        console.error('Failed to refetch billing data:', err);
      });
    },
  });

  // Ghi nhận giao dịch một lần khi cổng báo COMPLETED; refresh subscriptions chạy trong onSuccess
  React.useEffect(() => {
    if (statusData?.status !== 'COMPLETED' || !transactionId) return;
    if (savedTxnRef.current === transactionId) return;
    savedTxnRef.current = transactionId;
    saveTransactionMutation.mutate(transactionId, {
      onError: () => {
        if (savedTxnRef.current === transactionId) savedTxnRef.current = null;
      },
    });
  }, [statusData?.status, transactionId, saveTransactionMutation]);

  const isPending = !statusData || statusData.status === 'PENDING' || isLoading;
  const isSuccess = statusData?.status === 'COMPLETED';

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    const startDate = today.toLocaleDateString('vi-VN');

    let endDate = 'Không giới hạn';
    if (plan && plan.durationDays > 0) {
      const end = new Date(today);
      end.setDate(end.getDate() + plan.durationDays);
      endDate = end.toLocaleDateString('vi-VN');
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  if (isPending) {
    return (
      <div className='flex flex-col items-center gap-4 py-12 text-center'>
        <Loader2 className='size-16 animate-spin text-primary' />
        <div>
          <h3 className='text-lg font-bold text-foreground'>Đang xử lý thanh toán...</h3>
          <p className='mt-2 text-sm text-muted-foreground'>
            Trang đang chờ kết quả từ hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <div className='flex flex-col items-center gap-4 py-8 text-center'>
        {isSuccess ? (
          <CheckCircle2 className='size-16 text-primary' />
        ) : (
          <XCircle className='size-16 text-red-400' />
        )}
        <div>
          <h3 className={cn('text-xl font-bold', isSuccess ? 'text-foreground' : 'text-red-500')}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h3>
          <p className='mt-2 text-sm text-muted-foreground'>
            {isSuccess
              ? 'Gói dịch vụ của bạn đã được kích hoạt.'
              : 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.'}
          </p>
        </div>

        {isSuccess && plan && (
          <div className='w-full max-w-xs rounded-xl border border-primary/30 bg-primary/5 p-4 text-left'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-primary'>Chi tiết đơn hàng</p>
            <div className='space-y-1.5 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Gói</span>
                <span className='font-semibold text-foreground'>{plan.name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Thời hạn</span>
                <span className='font-semibold text-foreground'>{startDate} - {endDate}</span>
              </div>
              <div className='flex justify-between border-t border-primary/30 pt-1.5'>
                <span className='text-muted-foreground'>Tổng tiền</span>
                <span className='font-bold text-primary'>{plan.priceLabel}</span>
              </div>
            </div>
          </div>
        )}

        {isSuccess && statusData && plan && (
          <div className='w-full rounded-xl border border-border bg-white p-6'>
            <div className='mb-6 flex items-center justify-between'>
              <p className='text-base font-semibold text-foreground'>Chi tiết thanh toán</p>
              <span className='text-sm text-muted-foreground'>
                {new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }).replace('/', ' năm ')}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-border'>
                    <th className='pb-4 text-left text-xs font-semibold text-muted-foreground'>Ngày</th>
                    <th className='pb-4 text-left text-xs font-semibold text-muted-foreground'>Sự miêu tả</th>
                    <th className='pb-4 text-left text-xs font-semibold text-muted-foreground'>Trạng thái</th>
                    <th className='pb-4 text-right text-xs font-semibold text-muted-foreground'>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b border-muted'>
                    <td className='py-4 text-sm text-foreground/70'>{new Date().toLocaleDateString('vi-VN')}</td>
                    <td className='py-4 text-sm text-foreground/70'>{plan.name}</td>
                    <td className='py-4'>
                      <span className='text-sm text-foreground/70'>Đã thanh toán</span>
                    </td>
                    <td className='py-4 text-right text-sm font-semibold text-foreground'>{plan.priceLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className='flex justify-center gap-3'>
        {isSuccess ? (
          <RealVistaButton size='small' onClick={onDone}>
            Hoàn tất
          </RealVistaButton>
        ) : (
          <>
            <RealVistaButton variant='secondary' size='small' onClick={onDone}>
              Quay lại
            </RealVistaButton>
            <RealVistaButton size='small' onClick={onDone}>
              Thử lại
            </RealVistaButton>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purchase Wizard
// ---------------------------------------------------------------------------

function PurchaseWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const isOwnerOrAgent = backendRoles.includes('OWNER') || backendRoles.includes('AGENT');

  const [step, setStep] = React.useState<WizardStep>(1);
  const [selectedType, setSelectedType] = React.useState<PackageType | null>('subscription');
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentMethod | null>(null);
  const [checkoutData, setCheckoutData] = React.useState<CheckoutResponse | null>(null);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [pendingPlanId, setPendingPlanId] = React.useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = React.useState(false);
  const [conflictingPlan, setConflictingPlan] = React.useState<
    ActiveSubscriptionResponse | ActiveBoostPackageResponse | null
  >(null);

  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const subQuery = useQuery(billingQueries.subscriptionPlans());
  const boostQuery = useQuery(billingQueries.boostPackages());
  const mySubsQuery = useQuery({ ...billingQueries.mySubscriptions(), enabled: isAuthenticated });
  const myBoostsQuery = useQuery({ ...billingQueries.myBoosts(), enabled: isAuthenticated });

  const rawPlans = React.useMemo(() => {
    const plans =
      selectedType === 'subscription'
        ? paidFeaturePackages(subQuery.data ?? []).map(mapFeaturePackage)
        : (boostQuery.data ?? []).map(mapBoostPackage);
    if (!isOwnerOrAgent && selectedType === 'subscription') {
      return plans.filter((p) => p.featureType === 'AI_REQUEST');
    }
    return plans;
  }, [selectedType, subQuery.data, boostQuery.data, isOwnerOrAgent]);

  const selectedPlan = rawPlans.find((p) => p.id === selectedPlanId) ?? null;

  // Restore state from localStorage after hydration (runs client-side only)
  React.useEffect(() => {
    const saved = localStorage.getItem('subscription-wizard-state');
    if (!saved) return;
    try {
      const state = JSON.parse(saved) as {
        step: WizardStep;
        selectedType: PackageType | null;
        selectedPlanId: string | null;
        selectedPayment: PaymentMethod | null;
      };
      setStep(state.step);
      setSelectedType(state.selectedType);
      setSelectedPlanId(state.selectedPlanId);
      setSelectedPayment(state.selectedPayment);
    } catch {
      // ignore
    }
  }, []);

  // Save state to localStorage (but not checkoutData to force fresh state after redirect)
  // Skip the very first run so we don't overwrite localStorage with default values
  // before the restore effect above has had a chance to apply its state updates.
  const firstSaveDone = React.useRef(false);
  React.useEffect(() => {
    if (!firstSaveDone.current) {
      firstSaveDone.current = true;
      return;
    }
    localStorage.setItem(
      'subscription-wizard-state',
      JSON.stringify({ step, selectedType, selectedPlanId, selectedPayment })
    );
  }, [step, selectedType, selectedPlanId, selectedPayment]);

  const handleTypeNext = () => { if (selectedType) { setSelectedPlanId(null); setStep(2); } };

  // Check if user already has active subscription with same feature type
  const checkSameTypeConflict = (planId: string) => {
    if (selectedType === 'subscription') {
      const newPlan = rawPlans.find((p) => p.id === planId);
      if (!newPlan || !newPlan.featureType) return null;

      const activeSametype = (mySubsQuery.data ?? []).find(
        (s) => s.status === 'ACTIVE' && s.feature_type === newPlan.featureType
      );

      return activeSametype || null;
    }

    if (selectedType === 'boost') {
      // For boosts, check if user already has an active boost
      const activeBoost = (myBoostsQuery.data ?? []).find((b) => b.status === 'ACTIVE');
      return activeBoost || null;
    }

    return null;
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleConfirmPlanSwap = () => {
    setShowConflictDialog(false);
    setPendingPlanId(null);
    setConflictingPlan(null);
    // Proceed to step 3 after confirming
    setStep(3);
  };

  const handlePlanNext = () => {
    if (!selectedPlanId) return;
    if (!session?.user) {
      setShowLoginDialog(true);
      return;
    }
    // Only show conflict dialog when the selected plan is the SAME type as an active plan
    const conflict = checkSameTypeConflict(selectedPlanId);
    if (conflict) {
      setPendingPlanId(selectedPlanId);
      setConflictingPlan(conflict);
      setShowConflictDialog(true);
      return;
    }
    setStep(3);
  };

  const handlePaymentNext = () => setStep(4);

  const handleDone = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedPlanId(null);
    setSelectedPayment(null);
    setCheckoutData(null);
    localStorage.removeItem('subscription-wizard-state');
  };

  const toggleStep = (s: WizardStep) => {
    if (step !== s) {
      // Reset state when going back to earlier steps
      if (s < 4) setCheckoutData(null);
      if (s < 3) setSelectedPayment(null);
      setStep(s);
    }
  };

  return (
    <div id='mua-goi-dich-vu'>
      <h2 className='mb-5 text-base font-semibold text-foreground'>Chọn gói trải nghiệm</h2>

      <HorizontalWizardSteps
        activeStep={step}
        onStepChange={toggleStep}
      />

      <div className='rounded-xl border border-muted bg-white p-4 shadow-sm sm:p-5'>
        {step === 1 && (
          <Step1Content selected={selectedType} onSelect={setSelectedType} onNext={handleTypeNext} canBuyBoost={isOwnerOrAgent} />
        )}
        {step === 2 && selectedType && (
          <Step2Content
            type={selectedType}
            selectedPlanId={selectedPlanId}
            onSelectPlan={handleSelectPlan}
            onNext={handlePlanNext}
            onRetry={() => {
              setStep(1);
              setSelectedPlanId(null);
              setSelectedPayment(null);
              setCheckoutData(null);
            }}
            allowedFeatureTypes={isOwnerOrAgent ? undefined : ['AI_REQUEST']}
          />
        )}
        {step === 2 && !selectedType && (
          <p className='text-center text-sm text-muted-foreground'>Chọn loại gói ở bước 1 để tiếp tục.</p>
        )}
        {step === 3 && (
          <Step3Content
            selectedPlan={selectedPlan}
            selectedType={selectedType}
            selectedPayment={selectedPayment}
            onSelectPayment={setSelectedPayment}
            onCheckoutCreated={setCheckoutData}
            onNext={handlePaymentNext}
            onRetry={() => {
              setStep(2);
              setSelectedPayment(null);
              setCheckoutData(null);
            }}
          />
        )}
        {step === 4 && (
          <Step4Content
            transactionId={checkoutData?.checkout_order_id ?? null}
            plan={selectedPlan}
            onDone={handleDone}
          />
        )}
      </div>

      {showLoginDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl border border-muted bg-white p-6 shadow-lg'>
            <h3 className='text-lg font-bold text-foreground'>Yêu cầu đăng nhập</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Bạn cần đăng nhập để tiếp tục mua gói dịch vụ.
            </p>
            <div className='mt-6 flex flex-col gap-3'>
              <RealVistaButton
                className='w-full bg-primary text-white hover:bg-primary/90'
                onClick={() => {
                  setShowLoginDialog(false);
                  router.push(`/${locale}${ROUTES.login}?redirectTo=${ROUTES.subscribe}`);
                }}
              >
                Đăng nhập
              </RealVistaButton>
              <RealVistaButton
                variant='secondary'
                className='w-full'
                onClick={() => {
                  setShowLoginDialog(false);
                  router.push(`/${locale}${ROUTES.register}?redirectTo=${ROUTES.subscribe}`);
                }}
              >
                Tạo tài khoản
              </RealVistaButton>
              <button
                type='button'
                onClick={() => setShowLoginDialog(false)}
                className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict dialog: same feature type subscription already active */}
      {showConflictDialog && conflictingPlan && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl border border-muted bg-white p-6 shadow-lg'>
            <h3 className='text-lg font-bold text-foreground'>Nâng cấp gói dịch vụ</h3>
            <p className='mt-3 text-sm text-muted-foreground'>
              Bạn đã có gói{' '}
              <span className='font-semibold text-foreground'>
                {('package_name' in conflictingPlan ? conflictingPlan.package_name : null) ||
                  ('name' in conflictingPlan ? conflictingPlan.name : 'hiện tại')}
              </span>{' '}
              đang hoạt động.
            </p>
            <p className='mt-2 text-sm text-muted-foreground'>
              Hủy gói hiện tại để mua gói mới?
            </p>
            <div className='mt-6 flex flex-col gap-3'>
              <RealVistaButton
                className='w-full bg-primary text-white hover:bg-primary/90'
                onClick={handleConfirmPlanSwap}
              >
                Đồng ý, hủy và mua gói mới
              </RealVistaButton>
              <button
                type='button'
                onClick={() => {
                  setShowConflictDialog(false);
                  setPendingPlanId(null);
                  setConflictingPlan(null);
                }}
                className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transactions Section
// ---------------------------------------------------------------------------

function TransactionsSection() {
  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const { data: transactions, isLoading, error } = useQuery({ ...billingQueries.myTransactions(), enabled: isAuthenticated });

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      COMPLETED: 'Thành công',
      FAILED: 'Thất bại',
      REFUNDED: 'Hoàn tiền',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700';
      case 'FAILED':
        return 'bg-red-50 text-red-700';
      case 'REFUNDED':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-secondary/50 text-foreground/70';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amount: number): string => {
    return (amount).toLocaleString('vi-VN') + ' ₫';
  };

  if (isLoading) {
    return (
      <div className='rounded-xl border border-border bg-white p-5 shadow-sm'>
        <h2 className='mb-4 text-lg font-bold text-foreground'>Lịch sử giao dịch</h2>
        <div className='flex justify-center py-8'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-xl border border-border bg-white p-5 shadow-sm'>
        <h2 className='mb-4 text-lg font-bold text-foreground'>Lịch sử giao dịch</h2>
        <div className='text-center py-8 text-muted-foreground'>
          Không thể tải lịch sử giao dịch
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className='rounded-xl border border-border bg-white p-5 shadow-sm'>
        <h2 className='mb-4 text-lg font-bold text-foreground'>Lịch sử giao dịch</h2>
        <div className='text-center py-8 text-muted-foreground'>
          Chưa có giao dịch nào
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-border bg-white shadow-sm overflow-hidden'>
      <div className='border-b border-border px-5 py-4'>
        <h2 className='text-lg font-bold text-foreground'>Lịch sử giao dịch</h2>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border bg-muted/45'>
              <th className='px-5 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider'>
                Ngày
              </th>
              <th className='px-5 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider'>
                Mô tả
              </th>
              <th className='px-5 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider'>
                Trạng thái
              </th>
              <th className='px-5 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider'>
                Số tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.transaction_id}
                className='border-b border-border bg-white transition-colors hover:bg-primary/10'
              >
                <td className='px-5 py-3 text-sm text-muted-foreground'>
                  {formatDate(transaction.created_at)}
                </td>
                <td className='px-5 py-3 text-sm text-foreground'>
                  {transaction.description}
                </td>
                <td className='px-5 py-3 text-sm'>
                  <span className={cn('inline-block rounded-full px-2 py-1 text-xs font-medium', getStatusColor(transaction.status))}>
                    {formatStatus(transaction.status)}
                  </span>
                </td>
                <td className='px-5 py-3 text-sm font-semibold text-foreground'>
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SubscriptionTab() {
  const [mainTab, setMainTab] = React.useState<'buy' | 'manage'>('buy');

  const handleUpgrade = React.useCallback((planId: string) => {
    localStorage.setItem(
      'subscription-wizard-state',
      JSON.stringify({ step: 2, selectedType: 'subscription', selectedPlanId: planId, selectedPayment: null })
    );
    setMainTab('buy');
  }, []);

  return (
    <div className='space-y-6'>
      {/* Top-level tab switcher */}
      <div className='flex gap-1 rounded-xl bg-primary/5 p-1'>
        <button
          type='button'
          onClick={() => setMainTab('buy')}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
            mainTab === 'buy'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Mua gói
        </button>
        <button
          type='button'
          onClick={() => setMainTab('manage')}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
            mainTab === 'manage'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Gói hiện tại
        </button>
      </div>

      {mainTab === 'buy' && <PurchaseWizard />}

      {mainTab === 'manage' && (
        <div className='space-y-6'>
          <CurrentPlansSection onUpgrade={handleUpgrade} />
          <TransactionsSection />
        </div>
      )}
    </div>
  );
}
