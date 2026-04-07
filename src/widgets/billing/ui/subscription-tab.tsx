'use client';

import * as React from 'react';
import {
  CreditCard,
  Rocket,
  Check,
  CheckCircle2,
  XCircle,
  Zap,
  CalendarDays,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Badge } from '@/shared/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingApi,
  billingKeys,
  billingQueries,
  type BoostPackage,
  type CheckoutResponse,
  type ActiveSubscriptionResponse,
  type FeaturePackage,
  type TransactionStatusResponse,
} from '@/entities/billing';
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
type PaymentResult = 'success' | 'failed' | 'pending';
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
      <p className='text-xs font-medium text-grey-500'>Không giới hạn quota — không cần theo dõi mức dùng.</p>
    );
  }
  const pct = Math.min(100, Math.round((used / total) * 100));
  const isHigh = pct >= 80;
  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between text-xs text-grey-500'>
        <span>Đã dùng</span>
        <span className='font-semibold text-main-black'>{pct}%</span>
      </div>
      <div className='flex items-center gap-3'>
        <div className='h-2 flex-1 overflow-hidden rounded-full bg-purple-92'>
          <div
            className={cn('h-full rounded-full transition-all', isHigh ? 'bg-orange-400' : 'bg-main-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className='w-20 shrink-0 text-right text-xs font-medium text-grey-500'>
          {used}/{total}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Current active plans
// ---------------------------------------------------------------------------

function CurrentPlansSection() {
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading } = useQuery(billingQueries.mySubscriptions());
  const { data: catalogRaw } = useQuery(billingQueries.subscriptionPlans());

  const cancelMut = useMutation({
    mutationFn: (id: string) => billingApi.cancelSubscription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
      toast.success('Đã huỷ gói đăng ký.');
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof HttpError && e.payload?.message
          ? String(e.payload.message)
          : 'Không huỷ được gói. Thử lại sau.';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div>
        <h2 className='mb-4 text-base font-semibold text-main-black'>Gói tính năng đang hoạt động</h2>
        <div className='flex items-center gap-2 text-sm text-grey-500'>
          <Loader2 className='size-4 animate-spin' /> Đang tải...
        </div>
      </div>
    );
  }

  const active: ActiveSubscriptionResponse[] = subscriptions ?? [];
  const catalog = catalogRaw ?? [];

  return (
    <div>
      <h2 className='mb-4 text-base font-semibold text-main-black'>Gói tính năng đang hoạt động</h2>

      {active.length === 0 ? (
        <p className='text-sm text-grey-500'>Bạn chưa có gói tính năng trả phí nào đang hoạt động.</p>
      ) : (
        <div className='space-y-6'>
          {active.map((sub) => {
            const typeBadge =
              sub.feature_type === '3D_TOUR'
                ? 'bg-sky-100 text-sky-800 border-sky-200'
                : sub.feature_type === 'AI_REQUEST'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-purple-96 text-main-primary border-purple-90';
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
                <div className='flex flex-col rounded-xl border border-border bg-grey-50 p-5 shadow-sm'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-grey-400'>Gói hiện tại</p>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <Badge className={cn('shrink-0 text-xs font-medium border', typeBadge)} variant='outline'>
                      {featureTypeLabelVi(sub.feature_type)}
                    </Badge>
                    <span className='rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-main-black ring-1 ring-grey-200'>
                      {tierLabelVi(tier)}
                    </span>
                  </div>
                  <h3 className='mt-2 text-lg font-bold text-main-black'>{sub.package_name}</h3>
                  <div className='mt-1 flex items-center gap-1.5 text-xs text-grey-500'>
                    <CalendarDays className='size-3.5 shrink-0' />
                    <span>
                      {sub.end_date ? `Hết hạn: ${formatDate(sub.end_date)}` : 'Không giới hạn thời hạn'}
                    </span>
                  </div>
                  <div className='mt-4'>
                    <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-grey-400'>Mức dùng quota</p>
                    <QuotaUsageBar used={used} total={totalForBar} unlimited={sub.unlimited} />
                  </div>
                  <p className='mt-3 text-xs text-grey-500'>
                    Mã: <span className='font-mono'>{sub.package_code}</span>
                    {sub.status ? ` · ${sub.status}` : ''}
                  </p>
                  <div className='mt-4 flex flex-wrap gap-2 border-t border-border pt-4'>
                    <RealVistaButton
                      variant='secondary'
                      size='small'
                      disabled={cancelMut.isPending}
                      onClick={() => {
                        if (
                          typeof window !== 'undefined' &&
                          !window.confirm(
                            'Huỷ gói này? Bạn sẽ mất quyền lợi ngay sau khi huỷ (theo chính sách hiện tại).'
                          )
                        ) {
                          return;
                        }
                        cancelMut.mutate(sub.subscription_id);
                      }}
                    >
                      {cancelMut.isPending ? 'Đang huỷ…' : 'Huỷ gói'}
                    </RealVistaButton>
                    <RealVistaButton
                      variant='secondary'
                      size='small'
                      onClick={() => {
                        document.getElementById('mua-goi-dich-vu')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Điều chỉnh / mua thêm
                    </RealVistaButton>
                  </div>
                </div>

                <div className='flex flex-col rounded-xl border border-main-black/10 bg-white p-5 shadow-sm ring-1 ring-grey-100'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-grey-400'>Nâng cấp</p>
                  {nextPkg ? (
                    <>
                      <h3 className='mt-2 text-lg font-bold text-main-black'>{nextPkg.name}</h3>
                      <p className='mt-1 text-sm text-grey-500'>{nextPkg.description}</p>
                      <p className='mt-3 text-2xl font-bold text-main-black'>
                        {(nextPkg.price).toLocaleString('vi-VN')} đ
                        <span className='text-xs font-normal text-grey-500'>
                          /
                          {nextPkg.duration_days === 30 ? 'tháng' : `${nextPkg.duration_days} ngày`}
                        </span>
                      </p>
                      <p className='mt-2 text-xs text-grey-500'>
                        Cấp tiếp theo: <span className='font-semibold text-main-black'>{tierLabelVi(tier + 1)}</span>
                      </p>
                      <div className='mt-auto pt-6'>
                        <RealVistaButton
                          size='small'
                          className='w-full sm:w-auto bg-main-black text-white hover:bg-main-black/90'
                          onClick={() => {
                            document.getElementById('mua-goi-dich-vu')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Nâng cấp
                        </RealVistaButton>
                      </div>
                    </>
                  ) : (
                    <p className='mt-4 flex-1 text-sm text-grey-500'>
                      Bạn đang ở mức cao nhất cho {featureTypeLabelVi(sub.feature_type)} trong danh mục hiện tại.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal stepper (wizard header)
// ---------------------------------------------------------------------------

function HorizontalWizardSteps({
  activeStep,
  typeSummary,
  planSummary,
  paymentSummary,
  onStepChange,
}: {
  activeStep: WizardStep;
  typeSummary?: React.ReactNode;
  planSummary?: React.ReactNode;
  paymentSummary?: React.ReactNode;
  onStepChange: (s: WizardStep) => void;
}) {
  const steps: {
    num: WizardStep;
    label: string;
    reachable: boolean;
    done: boolean;
    summary?: React.ReactNode;
  }[] = [
    { num: 1, label: 'Loại gói', reachable: true, done: activeStep > 1, summary: typeSummary },
    { num: 2, label: 'Chọn gói', reachable: activeStep >= 2, done: activeStep > 2, summary: planSummary },
    { num: 3, label: 'Thanh toán', reachable: activeStep >= 3, done: activeStep > 3, summary: paymentSummary },
    { num: 4, label: 'Kết quả', reachable: activeStep >= 4, done: false, summary: undefined },
  ];

  return (
    <div className='mb-6 w-full overflow-x-auto pb-1'>
      <div className='flex min-w-0 items-start justify-between gap-0.5 sm:gap-1'>
        {steps.map((item, index) => (
          <React.Fragment key={item.num}>
            <button
              type='button'
              disabled={!item.reachable}
              onClick={() => item.reachable && onStepChange(item.num)}
              className={cn(
                'flex min-w-0 max-w-[26%] flex-1 flex-col items-center gap-1.5 px-0.5 py-1 transition-opacity',
                item.reachable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  activeStep === item.num
                    ? 'bg-main-primary text-white ring-4 ring-purple-94'
                    : item.done
                      ? 'bg-main-primary text-white'
                      : item.reachable
                        ? 'border-2 border-main-primary bg-white text-main-primary'
                        : 'border-2 border-grey-200 bg-white text-grey-400'
                )}
              >
                {item.done && activeStep !== item.num ? <Check className='size-4' /> : item.num}
              </div>
              <span
                className={cn(
                  'w-full text-center text-[10px] font-semibold leading-tight sm:text-xs',
                  activeStep === item.num || item.done ? 'text-main-black' : item.reachable ? 'text-main-black' : 'text-grey-400'
                )}
              >
                {item.label}
              </span>
              {item.summary != null && item.summary !== '' && activeStep !== item.num && (
                <span className='line-clamp-2 w-full text-center text-[9px] text-grey-500 sm:text-[10px]'>{item.summary}</span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mt-3.5 h-1 min-w-[6px] flex-1 shrink rounded-full sm:min-w-[12px]',
                  steps[index]!.done ? 'bg-main-primary' : 'bg-grey-200'
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        ))}
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
}: {
  selected: PackageType | null;
  onSelect: (t: PackageType) => void;
  onNext: () => void;
}) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <button
          type='button'
          onClick={() => onSelect('subscription')}
          className={cn(
            'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
            selected === 'subscription'
              ? 'border-main-primary bg-purple-98'
              : 'border-border bg-white hover:border-purple-90 hover:bg-purple-98'
          )}
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              selected === 'subscription' ? 'bg-main-primary text-white' : 'bg-purple-96 text-main-primary'
            )}
          >
            <CreditCard className='size-5' />
          </div>
          <div>
            <p className='font-semibold text-sm text-main-black'>Gói tính năng</p>
            <p className='mt-0.5 text-xs text-grey-500'>
              Tin đăng, tour 3D, AI assistant — mua lẻ theo nhu cầu.
            </p>
          </div>
          {selected === 'subscription' && <Check className='ml-auto size-4 shrink-0 text-main-primary mt-0.5' />}
        </button>

        <button
          type='button'
          onClick={() => onSelect('boost')}
          className={cn(
            'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
            selected === 'boost'
              ? 'border-orange-400 bg-orange-50'
              : 'border-border bg-white hover:border-orange-200 hover:bg-orange-50'
          )}
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              selected === 'boost' ? 'bg-orange-400 text-white' : 'bg-orange-100 text-orange-500'
            )}
          >
            <Rocket className='size-5' />
          </div>
          <div>
            <p className='font-semibold text-sm text-main-black'>Boosting</p>
            <p className='mt-0.5 text-xs text-grey-500'>Đẩy tin nổi bật, huy hiệu HOT, tăng lượt xem.</p>
          </div>
          {selected === 'boost' && <Check className='ml-auto size-4 shrink-0 text-orange-500 mt-0.5' />}
        </button>
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

function isSubscriptionPlanBlocked(plan: Plan, mySubs: ActiveSubscriptionResponse[] | undefined): boolean {
  if (!plan.featureType) return false;
  const maxT = maxActiveTierForFeature(mySubs, plan.featureType);
  return plan.tierLevel < maxT;
}

function Step2Content({
  type,
  selectedPlanId,
  onSelectPlan,
  onNext,
  onRetry,
}: {
  type: PackageType;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  const subQuery = useQuery(billingQueries.subscriptionPlans());
  const boostQuery = useQuery(billingQueries.boostPackages());
  const { data: mySubs } = useQuery(billingQueries.mySubscriptions());

  const rawPlans =
    type === 'subscription'
      ? paidFeaturePackages(subQuery.data ?? []).map(mapFeaturePackage)
      : (boostQuery.data ?? []).map(mapBoostPackage);

  const isLoading = type === 'subscription' ? subQuery.isLoading : boostQuery.isLoading;

  const firstSelectableId = React.useMemo(() => {
    if (type !== 'subscription') return rawPlans[0]?.id ?? '';
    const ok = rawPlans.find((p) => !isSubscriptionPlanBlocked(p, mySubs));
    return ok?.id ?? rawPlans[0]?.id ?? '';
  }, [type, rawPlans, mySubs]);

  const activePlanId = selectedPlanId ?? firstSelectableId;
  const selectedPlan = rawPlans.find((p) => p.id === activePlanId) ?? rawPlans[0] ?? null;

  React.useEffect(() => {
    if (rawPlans.length === 0) return;
    if (type === 'subscription') {
      const sel = rawPlans.find((p) => p.id === selectedPlanId);
      if (!selectedPlanId || (sel && isSubscriptionPlanBlocked(sel, mySubs))) {
        if (firstSelectableId) onSelectPlan(firstSelectableId);
      }
      return;
    }
    if (!selectedPlanId && rawPlans[0]) {
      onSelectPlan(rawPlans[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, rawPlans.map((p) => p.id).join(','), firstSelectableId, mySubs]);

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-grey-500 py-4'>
        <Loader2 className='size-4 animate-spin' /> Đang tải gói...
      </div>
    );
  }

  if (type === 'subscription' && rawPlans.length === 0) {
    return (
      <p className='text-sm text-grey-500 py-4'>
        Hiện không có gói tính năng trả phí để mua. Kiểm tra lại API hoặc danh sách gói trên hệ thống.
      </p>
    );
  }

  if (!selectedPlan) return null;

  const selectableCount =
    type === 'subscription' ? rawPlans.filter((p) => !isSubscriptionPlanBlocked(p, mySubs)).length : rawPlans.length;

  if (type === 'subscription' && selectableCount === 0 && rawPlans.length > 0) {
    return (
      <p className='py-4 text-sm text-grey-600'>
        Bạn đang dùng gói cao nhất cho từng loại tính năng. Để đổi gói, hãy{' '}
        <span className='font-medium text-main-primary'>huỷ gói hiện tại</span> ở phần trên rồi chọn gói thấp hơn (nếu
        phù hợp), hoặc chờ hết hạn.
      </p>
    );
  }

  return (
    <div className='space-y-4'>
      <p className='text-xs text-grey-500'>
        Cấp gói: <span className='font-medium text-main-black'>Miễn phí</span> →{' '}
        <span className='font-medium text-main-black'>Basic</span> →{' '}
        <span className='font-medium text-main-black'>Premium</span> →{' '}
        <span className='font-medium text-main-black'>Pro</span> →{' '}
        <span className='font-medium text-main-black'>Pro+</span>. Gói cấp thấp hơn gói đang dùng sẽ bị khoá.
      </p>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='flex flex-col gap-2.5 lg:w-2/5'>
          {rawPlans.map((plan) => {
            const blocked = type === 'subscription' && isSubscriptionPlanBlocked(plan, mySubs);
            return (
            <button
              key={plan.id}
              type='button'
              disabled={blocked}
              onClick={() => !blocked && onSelectPlan(plan.id)}
              className={cn(
                'relative flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all',
                blocked && 'cursor-not-allowed opacity-50',
                activePlanId === plan.id && !blocked
                  ? 'border-main-primary bg-purple-98'
                  : !blocked && 'border-border bg-white hover:border-purple-90 hover:bg-purple-98',
                blocked && 'border-grey-200 bg-grey-100'
              )}
            >
              {plan.isPopular && (
                <span className='absolute -top-2.5 left-3 rounded-full bg-main-primary px-2 py-0.5 text-[10px] font-bold text-white'>
                  Phổ biến nhất
                </span>
              )}
              <div className='min-w-0'>
                <p className='font-semibold text-sm text-main-black'>{plan.name}</p>
                <p className='text-xs text-grey-500'>{plan.description}</p>
              </div>
              <div className='ml-3 shrink-0 text-right'>
                <span className='text-lg font-bold text-main-black'>{plan.priceLabel}</span>
                <span className='text-xs text-grey-500'>/{plan.durationLabel}</span>
              </div>
              {blocked && (
                <span className='absolute bottom-1 left-3 text-[10px] font-medium text-orange-600'>Đang dùng gói cao hơn</span>
              )}
            </button>
          );
          })}
        </div>

        <div className='rounded-xl border border-border bg-grey-50 p-5 lg:flex-1'>
          <div className='mb-4 flex items-start justify-between gap-2'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-lg font-bold text-main-black'>{selectedPlan.name}</h3>
                {selectedPlan.isPopular && (
                  <span className='rounded-full bg-main-primary px-2.5 py-0.5 text-[11px] font-bold text-white'>
                    Phổ biến nhất
                  </span>
                )}
              </div>
              <p className='text-xs text-grey-500'>
                {type === 'subscription' ? 'Gói tính năng (tin đăng / 3D / AI)' : `Gói ${selectedPlan.durationLabel}`}
              </p>
            </div>
            <div className='shrink-0 text-right'>
              <p className='text-2xl font-bold text-main-black'>
                {selectedPlan.priceLabel}
              </p>
              <p className='text-xs text-grey-500'>/{selectedPlan.durationLabel}</p>
            </div>
          </div>

          <div className='mb-4'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-grey-400'>Quyền lợi</p>
            <ul className='space-y-1.5'>
              {selectedPlan.benefits.map((b) => (
                <li key={b.label} className='flex items-start gap-2 text-sm text-grey-700'>
                  <Check className='mt-0.5 size-3.5 shrink-0 text-main-primary' />
                  {b.label}
                </li>
              ))}
            </ul>
          </div>

          <div className='mb-5'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-grey-400'>Tính năng</p>
            <ul className='space-y-1.5'>
              {selectedPlan.features.map((f) => (
                <li key={f.label} className='flex items-start gap-1.5 text-sm text-grey-700'>
                  <span className='mt-2 size-1.5 shrink-0 rounded-full bg-grey-400' />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

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
    onSuccess: (res) => {
      const data = res.payload.data;
      setCheckout(data);
      onCheckoutCreated(data);
      setError(null);
      // VNPay: sang bước 4 ngay
      if (data.payment_method === 'VNPAY') {
        onNext();
      }
      // PayOS: giữ lại ở step 3, hiển thị QR
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

  const syncPayOsMutation = useMutation({
    mutationFn: () => billingApi.syncPayOsFromGateway(checkout?.transaction_id ?? ''),
    onSuccess: (res) => {
      const txnStatus = (res.payload as { data?: TransactionStatusResponse }).data?.status;
      if (txnStatus === 'COMPLETED') {
        onNext();
      } else {
        toast.info('Chưa nhận được thanh toán. Vui lòng thử lại sau.');
      }
    },
    onError: () => {
      toast.error('Không thể kiểm tra trạng thái PayOS');
    },
  });

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
            queryClient.invalidateQueries({ queryKey: ['billing', 'my-subscriptions'] });
            onDone?.(data);
          },
        }
      );
    },
    [checkoutMutation, queryClient, selectedPlan, selectedType]
  );

  const handleSelectPayment = (method: PaymentMethod) => {
    onSelectPayment(method);
    setError(null);

    if (method === 'vnpay') {
      setCheckout(null);
      return;
    }

    // PayOS: tạo link ngay khi chọn — không cần bấm thêm mới thấy QR
    if (!selectedPlan || !selectedType) return;
    if (checkoutMutation.isPending) return;
    if (checkout?.payment_method === 'PAYOS') return;

    setCheckout(null);
    requestCheckout('PAYOS');
  };

  const handleConfirm = () => {
    if (!selectedPlan || !selectedPayment || checkoutMutation.isPending) return;

    if (!checkout) {
      if (selectedPayment === 'payos') {
        requestCheckout('PAYOS');
        return;
      }
      requestCheckout('VNPAY', (data) => {
        window.open(data.checkout_url, '_blank');
        onNext();
      });
      return;
    }

    if (selectedPayment === 'vnpay') {
      window.open(checkout.checkout_url, '_blank');
    }
    onNext();
  };

  const isLoading = checkoutMutation.isPending;

  return (
    <div className='space-y-4'>
      {selectedPlan && (
        <div className='flex items-center justify-between rounded-lg border border-purple-90 bg-purple-98 px-4 py-3'>
          <div className='flex items-center gap-3'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-main-primary text-white'>
              <Zap className='size-3.5' />
            </div>
            <div>
              <p className='text-sm font-semibold text-main-black'>{selectedPlan.name}</p>
              <p className='text-xs text-grey-500'>{selectedPlan.durationLabel}</p>
            </div>
          </div>
          <span className='text-sm font-bold text-main-primary'>{selectedPlan.priceLabel}</span>
        </div>
      )}

      <div className='grid gap-3 sm:grid-cols-2'>
        <button
          type='button'
          onClick={() => handleSelectPayment('vnpay')}
          className={cn(
            'flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
            selectedPayment === 'vnpay'
              ? 'border-red-400 bg-red-50'
              : 'border-border bg-white hover:border-red-200 hover:bg-red-50'
          )}
        >
          <div className='flex size-9 items-center justify-center rounded-lg bg-red-500 text-white'>
            <span className='text-[11px] font-black leading-none'>VN</span>
          </div>
          <div className='text-left flex-1'>
            <p className='font-semibold text-sm text-main-black'>VNPay</p>
            <p className='text-xs text-grey-500'>Ví điện tử & ngân hàng</p>
          </div>
          {selectedPayment === 'vnpay' && <Check className='size-4 shrink-0 text-red-500' />}
        </button>

        <button
          type='button'
          onClick={() => handleSelectPayment('payos')}
          className={cn(
            'flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
            selectedPayment === 'payos'
              ? 'border-blue-400 bg-blue-50'
              : 'border-border bg-white hover:border-blue-200 hover:bg-blue-50'
          )}
        >
          <div className='flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white'>
            <span className='text-[11px] font-black leading-none'>OS</span>
          </div>
          <div className='text-left flex-1'>
            <p className='font-semibold text-sm text-main-black'>PayOS</p>
            <p className='text-xs text-grey-500'>Chuyển khoản ngân hàng</p>
          </div>
          {selectedPayment === 'payos' && <Check className='size-4 shrink-0 text-blue-500' />}
        </button>
      </div>

      {error && (
        <p className='text-sm text-red-500 rounded-lg border border-red-200 bg-red-50 px-3 py-2'>{error}</p>
      )}

      {selectedPayment === 'payos' && isLoading && (
        <p className='flex items-center justify-center gap-2 text-sm text-grey-600 py-2'>
          <Loader2 className='size-4 animate-spin' />
          Đang tạo mã QR PayOS…
        </p>
      )}

      {selectedPayment === 'vnpay' && !checkout && !isLoading && (
        <p className='text-center text-xs text-grey-500 px-2'>
          Chọn VNPay xong, bấm nút <span className='font-medium text-main-black'>bên dưới</span> để tạo link và mở trang thanh toán.
        </p>
      )}

      {/* PayOS: show QR after checkout created (payload may use qr_code or VietQR string; fallback to payment URL) */}
      {selectedPayment === 'payos' && checkout && (checkout.qr_code || checkout.checkout_url) && (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-border bg-grey-50 py-6'>
          <p className='text-sm font-medium text-grey-700 flex items-center gap-1.5'>
            Quét mã QR để thanh toán qua{' '}
            <span className='text-blue-600'>PayOS</span>
            {!syncPayOsMutation.isPending && (
              <button
                type='button'
                onClick={() => syncPayOsMutation.mutate()}
                disabled={syncPayOsMutation.isPending}
                className='inline-flex items-center text-grey-700 hover:text-grey-500 transition-colors disabled:opacity-50'
                title='Kiểm tra thanh toán'
                aria-label='Confirm payment'
              >
                <CreditCard className='size-4' />
              </button>
            )}
            {syncPayOsMutation.isPending && (
              <Loader2 className='size-4 animate-spin text-grey-700' />
            )}
          </p>
          <div className='rounded-xl border-4 border-white p-1 shadow-md'>
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
          <p className='text-xs text-grey-500'>Mã QR chỉ có giá trị trong 15 phút</p>
          <a
            href={checkout.checkout_url}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1 text-xs text-blue-600 underline underline-offset-2'
          >
            Mở PayOS <ExternalLink className='size-3' />
          </a>
        </div>
      )}

      {/* VNPay: show redirect notice after link created */}
      {selectedPayment === 'vnpay' && checkout && (
        <div className='flex flex-col items-center gap-2 rounded-xl border border-border bg-red-50 py-5'>
          <p className='text-sm font-medium text-grey-700'>
            Đã tạo link — bấm <span className='font-semibold'>Tiếp theo</span> bên dưới hoặc mở lại VNPay.
          </p>
          <p className='text-xs text-grey-500'>Cửa sổ thanh toán đã mở (nếu trình duyệt chặn popup, bấm nút dưới).</p>
        </div>
      )}

      <div className='flex justify-between gap-2 pt-1'>
        <RealVistaButton
          variant='secondary'
          size='small'
          onClick={onRetry}
        >
          Quay lại
        </RealVistaButton>
        <RealVistaButton
          size='small'
          disabled={!selectedPayment || isLoading || (selectedPayment === 'payos' && !checkout)}
          onClick={handleConfirm}
          withIcon
        >
          {isLoading ? (
            <>
              <Loader2 className='size-3.5 animate-spin' />
              Đang xử lý...
            </>
          ) : selectedPayment === 'vnpay' && !checkout ? (
            'Tạo link & mở VNPay'
          ) : selectedPayment === 'payos' && !checkout ? (
            'Tạo mã QR'
          ) : (
            'Xác nhận'
          )}
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

  const { data: statusData, isLoading } = useQuery({
    ...billingQueries.transactionStatus(transactionId ?? ''),
    enabled: !!transactionId,
  });

  // Refresh subscriptions when payment completes
  React.useEffect(() => {
    if (statusData?.status === 'COMPLETED') {
      queryClient.invalidateQueries({ queryKey: ['billing', 'my-subscriptions'] });
    }
  }, [statusData?.status, queryClient]);

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
        <Loader2 className='size-16 animate-spin text-main-primary' />
        <div>
          <h3 className='text-lg font-bold text-main-black'>Đang xử lý thanh toán...</h3>
          <p className='mt-2 text-sm text-grey-500'>
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
          <CheckCircle2 className='size-16 text-main-primary' />
        ) : (
          <XCircle className='size-16 text-red-400' />
        )}
        <div>
          <h3 className={cn('text-xl font-bold', isSuccess ? 'text-main-black' : 'text-red-500')}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h3>
          <p className='mt-2 text-sm text-grey-500'>
            {isSuccess
              ? 'Gói dịch vụ của bạn đã được kích hoạt.'
              : 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.'}
          </p>
        </div>

        {isSuccess && plan && (
          <div className='w-full max-w-xs rounded-xl border border-purple-90 bg-purple-98 p-4 text-left'>
            <p className='mb-2 text-[10px] font-bold uppercase tracking-wider text-main-primary'>Chi tiết đơn hàng</p>
            <div className='space-y-1.5 text-sm'>
              <div className='flex justify-between'>
                <span className='text-grey-600'>Gói</span>
                <span className='font-semibold text-main-black'>{plan.name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-grey-600'>Thời hạn</span>
                <span className='font-semibold text-main-black'>{startDate} - {endDate}</span>
              </div>
              <div className='flex justify-between border-t border-purple-90 pt-1.5'>
                <span className='text-grey-600'>Tổng tiền</span>
                <span className='font-bold text-main-primary'>{plan.priceLabel}</span>
              </div>
            </div>
          </div>
        )}

        {isSuccess && statusData && (
          <div className='w-full rounded-xl border border-border bg-white p-6'>
            <div className='mb-6 flex items-center justify-between'>
              <p className='text-base font-semibold text-main-black'>Hóa đơn</p>
              <span className='text-sm text-grey-600'>
                {new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }).replace('/', ' năm ')}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-grey-200'>
                    <th className='pb-4 text-left text-xs font-semibold text-grey-600'>Ngày</th>
                    <th className='pb-4 text-left text-xs font-semibold text-grey-600'>Sự miêu tả</th>
                    <th className='pb-4 text-left text-xs font-semibold text-grey-600'>Trạng thái</th>
                    <th className='pb-4 text-right text-xs font-semibold text-grey-600'>Số lượng</th>
                    <th className='pb-4 text-right text-xs font-semibold text-grey-600'>Hóa đơn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b border-grey-100'>
                    <td className='py-4 text-sm text-grey-700'>{new Date().toLocaleDateString('vi-VN')}</td>
                    <td className='py-4 text-sm text-grey-700'></td>
                    <td className='py-4'>
                      <span className='text-sm text-grey-700'>Trả</span>
                    </td>
                    <td className='py-4 text-right text-sm font-semibold text-main-black'>{plan.priceLabel}</td>
                    <td className='py-4'>
                      <button
                        type='button'
                        className='flex items-center gap-1 text-right text-sm font-medium text-main-primary hover:opacity-80 transition-opacity'
                      >
                        Xem <ExternalLink className='size-4' />
                      </button>
                    </td>
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

  const [step, setStep] = React.useState<WizardStep>(1);
  const [selectedType, setSelectedType] = React.useState<PackageType | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentMethod | null>(null);
  const [checkoutData, setCheckoutData] = React.useState<CheckoutResponse | null>(null);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);

  const subQuery = useQuery(billingQueries.subscriptionPlans());
  const boostQuery = useQuery(billingQueries.boostPackages());

  const rawPlans =
    selectedType === 'subscription'
      ? paidFeaturePackages(subQuery.data ?? []).map(mapFeaturePackage)
      : (boostQuery.data ?? []).map(mapBoostPackage);

  const selectedPlan = rawPlans.find((p) => p.id === selectedPlanId) ?? null;

  const typeSummary =
    selectedType === 'subscription' ? 'Gói tính năng' : selectedType === 'boost' ? 'Gói đẩy tin' : undefined;
  const planSummary = selectedPlan ? `${selectedPlan.name} · ${selectedPlan.priceLabel}` : undefined;
  const paymentSummary = selectedPayment === 'vnpay' ? 'VNPay' : selectedPayment === 'payos' ? 'PayOS' : undefined;

  // Load state from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('subscription-wizard-state');
    if (saved) {
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
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save state to localStorage (but not checkoutData to force fresh state after redirect)
  React.useEffect(() => {
    const wizardState = {
      step,
      selectedType,
      selectedPlanId,
      selectedPayment,
    };
    localStorage.setItem('subscription-wizard-state', JSON.stringify(wizardState));
  }, [step, selectedType, selectedPlanId, selectedPayment]);

  const handleTypeNext = () => { if (selectedType) { setSelectedPlanId(null); setStep(2); } };

  const handlePlanNext = () => {
    if (!selectedPlanId) return;
    if (!session?.user) {
      setShowLoginDialog(true);
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
      <h2 className='mb-5 text-base font-semibold text-main-black'>Chọn gói trải nghiệm</h2>

      <HorizontalWizardSteps
        activeStep={step}
        typeSummary={typeSummary}
        planSummary={planSummary}
        paymentSummary={paymentSummary}
        onStepChange={toggleStep}
      />

      <div className='rounded-xl border border-grey-96 bg-white p-4 shadow-sm sm:p-5'>
        {step === 1 && (
          <Step1Content selected={selectedType} onSelect={setSelectedType} onNext={handleTypeNext} />
        )}
        {step === 2 && selectedType && (
          <Step2Content
            type={selectedType}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onNext={handlePlanNext}
            onRetry={() => {
              setStep(1);
              setSelectedPlanId(null);
              setSelectedPayment(null);
              setCheckoutData(null);
            }}
          />
        )}
        {step === 2 && !selectedType && (
          <p className='text-center text-sm text-grey-500'>Chọn loại gói ở bước 1 để tiếp tục.</p>
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
            transactionId={checkoutData?.transaction_id ?? null}
            plan={selectedPlan}
            onDone={handleDone}
          />
        )}
      </div>

      {showLoginDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl border border-grey-96 bg-white p-6 shadow-lg'>
            <h3 className='text-lg font-bold text-main-black'>Yêu cầu đăng nhập</h3>
            <p className='mt-2 text-sm text-grey-500'>
              Bạn cần đăng nhập để tiếp tục mua gói dịch vụ.
            </p>
            <div className='mt-6 flex flex-col gap-3'>
              <RealVistaButton
                className='w-full bg-main-primary text-white hover:bg-main-primary-hover'
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
                className='text-sm font-medium text-grey-500 hover:text-main-black transition-colors'
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SubscriptionTab() {
  return (
    <div className='space-y-6'>
      <CurrentPlansSection />
      <PurchaseWizard />
    </div>
  );
}
