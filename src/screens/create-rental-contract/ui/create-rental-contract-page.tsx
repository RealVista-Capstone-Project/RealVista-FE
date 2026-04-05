'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Save,
  Search,
  SendHorizontal,
} from 'lucide-react';
import { RentalContractStatus, type CreateRentalContractPayload } from '@/entities/rental-contract';
import { propertyQueries, type PropertySummaryResponse } from '@/entities/property';
import { userApi } from '@/entities/user';
import { useCreateRentalContractMutation } from '@/features/rental-contract/hooks/use-rental-contracts';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from '@/shared/ui';
import { cn, formatVND } from '@/shared/lib/utils';

type WizardStep = 1 | 2 | 3 | 4;

const ITEMS_PER_PAGE = 6;

interface FormState {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  thumbnailUrl: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantLookupDone: boolean;
  monthlyRent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
}

/* ── helpers to extract data from PropertySummaryResponse ── */

function getPropertyThumbnail(property: PropertySummaryResponse): string | null {
  const standardMedia = (property.media ?? []).filter((m) => m.is_property_standard);
  const primary = standardMedia.find((m) => m.is_primary) ?? standardMedia[0] ?? property.media?.[0];
  return primary?.thumbnail_url ?? primary?.media_url ?? null;
}

function getPropertyAddress(property: PropertySummaryResponse): string {
  const parts = [
    property.street_address,
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ].filter(Boolean);
  return parts.join(', ');
}

function getAttributeNumber(property: PropertySummaryResponse, code: string): number {
  const attr = (property.attributes ?? []).find((a) => a.attribute_code === code);
  return attr?.value_number ?? 0;
}

const INITIAL_FORM_STATE: FormState = {
  propertyId: '',
  propertyTitle: '',
  propertyAddress: '',
  propertyType: '',
  bedrooms: '0',
  bathrooms: '0',
  thumbnailUrl: '',
  tenantName: '',
  tenantEmail: '',
  tenantPhone: '',
  tenantLookupDone: false,
  monthlyRent: '',
  securityDeposit: '',
  leaseStartDate: '2026-04-01',
  leaseEndDate: '2027-03-31',
};

function applyPropertyToForm(property: PropertySummaryResponse): Partial<FormState> {
  return {
    propertyId: property.property_id,
    propertyTitle: property.property_type_info?.property_type_name
      ? `${property.property_type_info.property_type_name} — ${property.street_address}`
      : property.street_address,
    propertyAddress: getPropertyAddress(property),
    propertyType: property.property_type_info?.property_type_name ?? '',
    bedrooms: String(getAttributeNumber(property, 'bedrooms')),
    bathrooms: String(getAttributeNumber(property, 'bathrooms')),
    thumbnailUrl: getPropertyThumbnail(property) ?? '',
  };
}

export function CreateRentalContractPage() {
  const t = useTranslations('CreateRentalContract');
  const router = useRouter();
  const createContractMutation = useCreateRentalContractMutation();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>(() => ({ ...INITIAL_FORM_STATE }));
  const [listingSearch, setListingSearch] = useState('');
  const [tenantLookupLoading, setTenantLookupLoading] = useState(false);
  const [propertyPage, setPropertyPage] = useState(1);

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery(
    propertyQueries.myProperties({ keyword: listingSearch || undefined, page: propertyPage - 1, size: ITEMS_PER_PAGE })
  );

  const propertiesResponse = propertiesData?.payload?.data;
  const properties = propertiesResponse?.content ?? [];
  const totalPages = propertiesResponse?.totalPages ?? 0;

  const handleTenantLookup = useCallback(async () => {
    const email = form.tenantEmail.trim();
    if (!email) return;

    setTenantLookupLoading(true);
    try {
      const response = await userApi.searchByEmail(email);
      const userData = response.payload?.data;
      if (userData) {
        setForm((previous) => ({
          ...previous,
          tenantName: userData.full_name,
          tenantPhone: userData.phone || userData.masked_phone || '',
          tenantLookupDone: true,
        }));
        toast.success(t('tenantLookup.found'));
      } else {
        setForm((previous) => ({
          ...previous,
          tenantName: '',
          tenantPhone: '',
          tenantLookupDone: false,
        }));
        toast.error(t('tenantLookup.notFound'));
      }
    } catch {
      setForm((previous) => ({
        ...previous,
        tenantName: '',
        tenantPhone: '',
        tenantLookupDone: false,
      }));
      toast.error(t('tenantLookup.notFound'));
    } finally {
      setTenantLookupLoading(false);
    }
  }, [form.tenantEmail, t]);

  const steps = [
    { id: 1, label: t('steps.property') },
    { id: 2, label: t('steps.tenant') },
    { id: 3, label: t('steps.terms') },
    { id: 4, label: t('steps.review') },
  ] as const;

  const summaryItems = useMemo(
    () => [
      { label: t('summary.propertyId'), value: form.propertyId },
      { label: t('summary.property'), value: form.propertyTitle },
      { label: t('summary.address'), value: form.propertyAddress },
      { label: t('summary.tenant'), value: form.tenantName },
      { label: t('summary.email'), value: form.tenantEmail },
      { label: t('summary.monthlyRent'), value: formatCurrencyValue(form.monthlyRent) },
      { label: t('summary.deposit'), value: formatCurrencyValue(form.securityDeposit) },
      { label: t('summary.leaseWindow'), value: `${form.leaseStartDate} → ${form.leaseEndDate}` },
    ],
    [form, t]
  );

  const isStepValid = useMemo(() => {
    if (currentStep === 1) {
      return Boolean(
        form.propertyId && form.propertyTitle && form.propertyAddress && form.propertyType
      );
    }

    if (currentStep === 2) {
      return Boolean(form.tenantName && form.tenantEmail && form.tenantLookupDone);
    }

    if (currentStep === 3) {
      return Boolean(
        form.monthlyRent &&
          form.leaseStartDate &&
          form.leaseEndDate
      );
    }

    return true;
  }, [currentStep, form]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyProperty = (property: PropertySummaryResponse) => {
    setForm((previous) => ({
      ...previous,
      ...applyPropertyToForm(property),
    }));
  };

  const buildPayload = (
    status: RentalContractStatus.DRAFT | RentalContractStatus.PENDING_SIGNATURE
  ): CreateRentalContractPayload => ({
    listing_id: form.propertyId,
    property: {
      id: form.propertyId,
      listing_id: form.propertyId,
      title: form.propertyTitle,
      address: form.propertyAddress,
      listingType: form.propertyType,
      bedrooms: Number(form.bedrooms) || undefined,
      bathrooms: Number(form.bathrooms) || undefined,
    },
    tenant: {
      id: `tenant-${Date.now()}`,
      user_id: `user-${Date.now()}`,
      fullName: form.tenantName,
      email: form.tenantEmail,
      phoneNumber: form.tenantPhone || null,
      avatarUrl: null,
    },
    monthlyRent: Number(form.monthlyRent),
    securityAmount: Number(form.securityDeposit) || undefined,
    startDate: form.leaseStartDate,
    endDate: form.leaseEndDate,
    status,
  });

  const saveDraft = async () => {
    try {
      await createContractMutation.mutateAsync(buildPayload(RentalContractStatus.DRAFT));

      toast.success(t('toast.draftSaved'));
      router.push(ROUTES.dashboard.rentalContracts);
    } catch {
      toast.error(t('toast.draftError'));
    }
  };

  const sendForSigning = async () => {
    try {
      await createContractMutation.mutateAsync(buildPayload(RentalContractStatus.PENDING_SIGNATURE));

      toast.success(t('toast.sentSuccess'));
      router.push(ROUTES.dashboard.rentalContracts);
    } catch {
      toast.error(t('toast.sentError'));
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className='space-y-4'>
          <div className='rounded-3xl border border-[#E9E0FF] bg-[#FBF9FF] p-4'>
            <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-main-primary/70'>
                  {t('listingPicker.eyebrow')}
                </p>
                <h3 className='mt-2 text-lg font-semibold text-main-black'>
                  {t('listingPicker.title')}
                </h3>
                <p className='mt-1 text-sm leading-6 text-main-secondary/65'>
                  {t('listingPicker.description')}
                </p>
              </div>
              <div className='relative w-full md:max-w-xs'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-main-secondary/45' />
                <Input
                  value={listingSearch}
                  onChange={(event) => {
                    setListingSearch(event.target.value);
                    setPropertyPage(1);
                  }}
                  placeholder={t('listingPicker.searchPlaceholder')}
                  className='h-11 rounded-2xl border-[#E5DFFC] bg-white pl-9'
                />
              </div>
            </div>
          </div>

          {propertiesLoading ? (
            <div className='flex items-center justify-center rounded-3xl border border-dashed border-[#DDD2FF] bg-[#FBF9FF] px-5 py-16'>
              <Loader2 className='h-6 w-6 animate-spin text-main-primary/60' />
            </div>
          ) : (
            <>
              <div className='grid gap-4'>
                {properties.map((property) => {
                  const isSelected = property.property_id === form.propertyId;
                  const thumbnail = getPropertyThumbnail(property);
                  const address = getPropertyAddress(property);
                  const bedrooms = getAttributeNumber(property, 'bedrooms');
                  const bathrooms = getAttributeNumber(property, 'bathrooms');
                  const typeName = property.property_type_info?.property_type_name ?? '';
                  const statusLabel = property.status;

                  return (
                    <button
                      key={property.property_id}
                      type='button'
                      onClick={() => applyProperty(property)}
                      className={cn(
                        'overflow-hidden rounded-3xl border bg-white text-left transition-all',
                        isSelected
                          ? 'border-main-primary shadow-[0_22px_50px_rgba(92,63,214,0.18)]'
                          : 'border-[#ECE4FF] shadow-[0_14px_32px_rgba(96,72,179,0.08)] hover:-translate-y-0.5 hover:border-[#D8C8FF]'
                      )}
                    >
                      <div className='grid gap-0 md:grid-cols-[220px_1fr]'>
                        <div className='relative min-h-[180px] bg-[#F4EEFF]'>
                          {thumbnail ? (
                            <Image src={thumbnail} alt={property.street_address} fill className='object-cover' />
                          ) : (
                            <div className='flex h-full items-center justify-center text-main-secondary/30'>
                              <Building2 className='h-12 w-12' />
                            </div>
                          )}
                          <div className='absolute left-4 top-4'>
                            <Badge className='rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-main-black shadow-sm'>
                              {statusLabel}
                            </Badge>
                          </div>
                        </div>

                        <div className='flex flex-col justify-between p-5'>
                          <div>
                            <div className='flex flex-wrap items-start justify-between gap-3'>
                              <div>
                                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-main-secondary/45'>
                                  {property.property_id}
                                </p>
                                <h4 className='mt-2 text-xl font-semibold tracking-[-0.03em] text-main-black'>
                                  {property.street_address}
                                </h4>
                              </div>
                            </div>

                            <div className='mt-4 flex items-start gap-2 text-sm text-main-secondary/72'>
                              <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-main-primary/70' />
                              <span>{address}</span>
                            </div>

                            <div className='mt-4 flex flex-wrap gap-2'>
                              {typeName && <ListingMetaChip icon={Building2} value={typeName} />}
                              {bedrooms > 0 && (
                                <ListingMetaChip
                                  icon={BedDouble}
                                  value={t('listingPicker.bedroomsValue', { count: bedrooms })}
                                />
                              )}
                              {bathrooms > 0 && (
                                <ListingMetaChip
                                  icon={Bath}
                                  value={t('listingPicker.bathroomsValue', { count: bathrooms })}
                                />
                              )}
                            </div>
                          </div>

                          <div className='mt-5 flex items-center justify-end border-t border-[#F1EBFF] pt-4'>
                            <span
                              className={cn(
                                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]',
                                isSelected ? 'bg-main-primary text-white' : 'bg-[#F3EEFF] text-main-primary'
                              )}
                            >
                              {isSelected && <Check className='h-3.5 w-3.5' />}
                              {isSelected ? t('listingPicker.selected') : t('listingPicker.selectAction')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {properties.length === 0 && (
                  <div className='rounded-3xl border border-dashed border-[#DDD2FF] bg-[#FBF9FF] px-5 py-10 text-center'>
                    <p className='text-sm font-semibold text-main-black'>{t('listingPicker.emptyTitle')}</p>
                    <p className='mt-2 text-sm leading-6 text-main-secondary/65'>
                      {t('listingPicker.emptyDescription')}
                    </p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2 pt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-9 w-9 rounded-xl border-[#DED1FF] p-0'
                    disabled={propertyPage <= 1}
                    onClick={() => setPropertyPage((p) => p - 1)}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <span className='text-sm text-main-secondary/70'>
                    {propertyPage} / {totalPages}
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-9 w-9 rounded-xl border-[#DED1FF] p-0'
                    disabled={propertyPage >= totalPages}
                    onClick={() => setPropertyPage((p) => p + 1)}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className='space-y-6'>
          <div className='rounded-3xl border border-[#E9E0FF] bg-[#FBF9FF] p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-main-primary/70'>
              {t('tenantLookup.eyebrow')}
            </p>
            <h3 className='mt-2 text-lg font-semibold text-main-black'>
              {t('tenantLookup.title')}
            </h3>
            <p className='mt-1 text-sm leading-6 text-main-secondary/65'>
              {t('tenantLookup.description')}
            </p>

            <div className='mt-4 flex gap-3'>
              <div className='flex-1'>
                <Input
                  type='email'
                  value={form.tenantEmail}
                  onChange={(event) => {
                    updateField('tenantEmail', event.target.value);
                    if (form.tenantLookupDone) {
                      setForm((previous) => ({
                        ...previous,
                        tenantName: '',
                        tenantPhone: '',
                        tenantLookupDone: false,
                      }));
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleTenantLookup();
                    }
                  }}
                  placeholder={t('tenantLookup.emailPlaceholder')}
                  className='h-11 rounded-2xl border-[#E5DFFC] bg-white'
                />
              </div>
              <Button
                type='button'
                className='h-11 rounded-2xl bg-main-primary px-5 text-white shadow-[0_12px_24px_rgba(92,63,214,0.2)] hover:bg-main-primary-hover'
                onClick={handleTenantLookup}
                disabled={!form.tenantEmail.trim() || tenantLookupLoading}
              >
                {tenantLookupLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Search className='h-4 w-4' />
                )}
                {t('tenantLookup.lookupAction')}
              </Button>
            </div>
          </div>

          {form.tenantLookupDone && (
            <div className='grid gap-4 md:grid-cols-2'>
              <Field label={t('form.tenantName')}>
                <Input value={form.tenantName} readOnly className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80' />
              </Field>
              <Field label={t('form.tenantPhone')}>
                <Input value={form.tenantPhone} readOnly className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80' />
              </Field>
              <Field label={t('form.tenantEmail')} className='md:col-span-2'>
                <Input value={form.tenantEmail} readOnly className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80' />
              </Field>
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className='grid gap-4 md:grid-cols-2'>
          <Field label={t('form.monthlyRent')}>
            <MoneyInput value={form.monthlyRent} onChange={(raw) => updateField('monthlyRent', raw)} className='h-11 rounded-xl border-[#E5DFFC] bg-white/90' />
          </Field>
          <Field label={t('form.securityDeposit')}>
            <MoneyInput value={form.securityDeposit} onChange={(raw) => updateField('securityDeposit', raw)} className='h-11 rounded-xl border-[#E5DFFC] bg-white/90' />
          </Field>
          <Field label={t('form.leaseStartDate')}>
            <Input type='date' value={form.leaseStartDate} onChange={(event) => updateField('leaseStartDate', event.target.value)} className='h-11 rounded-xl border-[#E5DFFC] bg-white/90' />
          </Field>
          <Field label={t('form.leaseEndDate')}>
            <Input type='date' value={form.leaseEndDate} onChange={(event) => updateField('leaseEndDate', event.target.value)} className='h-11 rounded-xl border-[#E5DFFC] bg-white/90' />
          </Field>
        </div>
      );
    }

    return (
      <div className='grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
        <div className='overflow-hidden rounded-3xl border border-[#E7E0FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F4FF_100%)]'>
          <div className='border-b border-[#EFE8FF] px-5 py-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-main-primary/70'>
              {t('review.previewEyebrow')}
            </p>
            <h3 className='mt-2 text-xl font-semibold text-main-black'>{t('review.previewTitle')}</h3>
          </div>
          <div className='space-y-5 px-5 py-5'>
            <div className='rounded-2xl bg-[#120F25] p-5 text-white shadow-[0_24px_60px_rgba(18,15,37,0.18)]'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs uppercase tracking-[0.18em] text-white/60'>{t('review.documentType')}</p>
                  <p className='mt-2 text-2xl font-semibold tracking-[-0.03em]'>{t('review.documentTitle')}</p>
                </div>
                <div className='rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80'>
                  DocuSign
                </div>
              </div>
              <div className='mt-8 grid gap-4 sm:grid-cols-2'>
                <DocumentFact label={t('summary.property')} value={form.propertyTitle} />
                <DocumentFact label={t('summary.tenant')} value={form.tenantName} />
                <DocumentFact label={t('summary.monthlyRent')} value={formatCurrencyValue(form.monthlyRent)} />
                <DocumentFact label={t('summary.deposit')} value={formatCurrencyValue(form.securityDeposit)} />
              </div>
            </div>
            <div className='rounded-2xl border border-dashed border-[#D7CFFF] bg-white/80 p-5'>
              <p className='text-sm font-semibold text-main-black'>{t('review.signingFlowTitle')}</p>
              <p className='mt-2 text-sm leading-6 text-main-secondary/70'>{t('review.signingFlowDescription')}</p>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <Card className='rounded-3xl border-[#ECE4FF] bg-white/90 shadow-[0_18px_40px_rgba(95,70,175,0.08)]'>
            <CardContent className='space-y-4 p-5'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.22em] text-main-secondary/50'>
                  {t('summary.eyebrow')}
                </p>
                <h3 className='mt-2 text-lg font-semibold text-main-black'>{t('summary.title')}</h3>
              </div>
              <div className='space-y-3'>
                {summaryItems.map((item) => (
                  <div key={item.label} className='flex items-start justify-between gap-4 rounded-2xl bg-[#F8F4FF] px-4 py-3'>
                    <span className='text-sm text-main-secondary/60'>{item.label}</span>
                    <span className='text-right text-sm font-semibold text-main-black'>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(120,80,255,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(39,197,255,0.10),_transparent_22%),linear-gradient(180deg,#F7F4FF_0%,#FBFAFF_100%)]'>
      <div className='mx-auto max-w-[1320px] px-6 py-6'>
        <div className='mb-6 flex flex-col gap-5 rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,240,255,0.92))] p-6 shadow-[0_24px_70px_rgba(92,63,214,0.10)] backdrop-blur-md lg:flex-row lg:items-start lg:justify-between'>
          <div className='max-w-3xl'>
            <Button
              type='button'
              variant='ghost'
              className='mb-4 h-9 rounded-full px-3 text-main-secondary/70 hover:bg-white hover:text-main-black'
              onClick={() => router.push(ROUTES.dashboard.rentalContracts)}
            >
              <ArrowLeft className='h-4 w-4' />
              {t('backToContracts')}
            </Button>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-main-primary/70'>
              {t('hero.eyebrow')}
            </p>
            <h1 className='mt-3 text-4xl font-semibold tracking-[-0.04em] text-main-black'>
              {t('hero.title')}
            </h1>
            <p className='mt-4 max-w-2xl text-sm leading-7 text-main-secondary/72'>
              {t('hero.subtitle')}
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:min-w-[380px]'>
            <HeroStat title={t('hero.stats.lifecycle')} value={t('hero.stats.lifecycleValue')} />
            <HeroStat title={t('hero.stats.delivery')} value={t('hero.stats.deliveryValue')} />
          </div>
        </div>

        <div className='space-y-6'>
          <Card className='overflow-hidden rounded-[28px] border-[#EBE2FF] bg-white/92 shadow-[0_20px_48px_rgba(92,63,214,0.08)]'>
            <CardContent className='p-5'>
              <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.22em] text-main-secondary/50'>
                    {t('steps.eyebrow')}
                  </p>
                  <h2 className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-main-black'>
                    {t(`steps.titles.${currentStep}` as never)}
                  </h2>
                  <p className='mt-2 max-w-2xl text-sm leading-6 text-main-secondary/65'>
                    {t(`steps.descriptions.${currentStep}` as never)}
                  </p>
                </div>
                <div className='rounded-full border border-[#E7DDFF] bg-[#FAF8FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-main-primary/75'>
                  {t('progress', { current: currentStep, total: steps.length })}
                </div>
              </div>

              <div className='mt-5 grid gap-3 md:grid-cols-4'>
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isComplete = currentStep > step.id;

                  return (
                    <button
                      key={step.id}
                      type='button'
                      className={cn(
                        'flex min-w-0 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                        isActive
                          ? 'border-main-primary bg-[#F3EEFF] shadow-[0_12px_28px_rgba(92,63,214,0.12)]'
                          : 'border-[#EEE6FF] bg-[#FCFBFF] hover:border-[#D8C8FF] hover:bg-[#F8F4FF]'
                      )}
                      onClick={() => setCurrentStep(step.id as WizardStep)}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
                          isComplete
                            ? 'bg-main-primary text-white'
                            : isActive
                              ? 'bg-white text-main-primary shadow-sm'
                              : 'bg-[#F1ECFF] text-main-secondary/60'
                        )}
                      >
                        {isComplete ? <Check className='h-4 w-4' /> : step.id}
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-main-black'>{step.label}</p>
                        <p className='mt-1 line-clamp-2 text-xs leading-5 text-main-secondary/60'>
                          {t(`steps.descriptions.${step.id}` as never)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div>
            <Card className='rounded-[30px] border-[#EAE1FF] bg-white/94 shadow-[0_24px_60px_rgba(96,72,179,0.10)]'>
              <CardContent className='p-6'>
                {renderStepContent()}

                <div className='mt-8 flex flex-col gap-3 border-t border-[#F0E8FF] pt-6 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex flex-wrap gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-11 rounded-xl border-[#DED1FF] bg-white px-4 hover:bg-[#F8F4FF]'
                      onClick={saveDraft}
                      disabled={createContractMutation.isPending}
                    >
                      <Save className='h-4 w-4' />
                      {t('actions.saveDraft')}
                    </Button>

                    {currentStep > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        className='h-11 rounded-xl px-4 text-main-secondary/70 hover:bg-[#F8F4FF] hover:text-main-black'
                        onClick={() => setCurrentStep((previous) => Math.max(1, previous - 1) as WizardStep)}
                      >
                        <ArrowLeft className='h-4 w-4' />
                        {t('actions.back')}
                      </Button>
                    )}
                  </div>

                  <div className='flex flex-wrap gap-3'>
                    {currentStep < 4 ? (
                      <Button
                        type='button'
                        className='h-11 rounded-xl bg-main-primary px-5 text-white shadow-[0_18px_30px_rgba(92,63,214,0.24)] hover:bg-main-primary-hover'
                        onClick={() => setCurrentStep((previous) => Math.min(4, previous + 1) as WizardStep)}
                        disabled={!isStepValid || createContractMutation.isPending}
                      >
                        {t('actions.next')}
                        <ArrowRight className='h-4 w-4' />
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        className='h-11 rounded-xl bg-main-primary px-5 text-white shadow-[0_18px_30px_rgba(92,63,214,0.24)] hover:bg-main-primary-hover'
                        onClick={sendForSigning}
                        disabled={createContractMutation.isPending}
                      >
                        <SendHorizontal className='h-4 w-4' />
                        {createContractMutation.isPending ? t('actions.sending') : t('actions.sendForSigning')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className='mb-2 block text-sm font-medium text-main-black'>{label}</Label>
      {children}
    </div>
  );
}

function HeroStat({ title, value }: { title: string; value: string }) {
  return (
    <div className='rounded-3xl border border-[#EDE4FF] bg-white/85 p-4'>
      <p className='text-[11px] uppercase tracking-[0.18em] text-main-secondary/48'>{title}</p>
      <p className='mt-2 text-sm font-semibold leading-6 text-main-black'>{value}</p>
    </div>
  );
}

function DocumentFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-[11px] uppercase tracking-[0.16em] text-white/45'>{label}</p>
      <p className='mt-1 text-sm font-semibold text-white'>{value}</p>
    </div>
  );
}

function ListingMetaChip({
  icon: Icon,
  value,
}: {
  icon: typeof Building2;
  value: string;
}) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full bg-[#F6F2FF] px-3 py-1.5 text-xs font-semibold text-main-secondary/80'>
      <Icon className='h-3.5 w-3.5 text-main-primary' />
      <span>{value}</span>
    </div>
  );
}

function formatCurrencyValue(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return value || '0';
  }

  return formatVND(amount);
}

function formatNumberDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  return Number(digits).toLocaleString('vi-VN');
}

function sanitizeNumericInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

function MoneyInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (raw: string) => void;
  className?: string;
}) {
  return (
    <div className='relative'>
      <Input
        inputMode='numeric'
        value={formatNumberDisplay(value)}
        onChange={(event) => onChange(sanitizeNumericInput(event.target.value))}
        className={cn('pr-14', className)}
      />
      <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-main-secondary/60'>
        VND
      </span>
    </div>
  );
}
