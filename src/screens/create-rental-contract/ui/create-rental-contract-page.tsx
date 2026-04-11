'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { type CreateRentalContractPayload } from '@/entities/rental-contract';
import { propertyQueries, type PropertySummaryResponse } from '@/entities/property';
import { userApi } from '@/entities/user';
import {
  useCreateRentalContractMutation,
  useSendToLandlordMutation,
} from '@/features/rental-contract/hooks/use-rental-contracts';
import { DocuSignSigningModal } from '@/features/rental-contract/ui/docusign-signing-modal';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { Card, CardContent } from '@/shared/ui';
import { ContractPageHeader } from './components/contract-page-header';
import { WizardStepsCard } from './components/wizard-steps-card';
import { StepListingPicker, getPropertyThumbnail, getPropertyAddress, getAttributeNumber } from './components/step-listing-picker';
import { StepTenantLookup } from './components/step-tenant-lookup';
import { StepLeaseTerms } from './components/step-lease-terms';
import { StepReview } from './components/step-review';
import { WizardFooter } from './components/wizard-footer';

// ── Types & constants ─────────────────────────────────────────────────────────

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
  tenantUserId: string;
  tenantLookupDone: boolean;
  monthlyRent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
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
  tenantUserId: '',
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

// ── Page ─────────────────────────────────────────────────────────────────────

export function CreateRentalContractPage() {
  const t = useTranslations('CreateRentalContract');
  const router = useRouter();
  const { data: session } = useSession();
  const createContractMutation = useCreateRentalContractMutation();
  const sendToLandlordMutation = useSendToLandlordMutation();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>(() => ({ ...INITIAL_FORM_STATE }));
  const [listingSearch, setListingSearch] = useState('');
  const [tenantLookupLoading, setTenantLookupLoading] = useState(false);
  const [propertyPage, setPropertyPage] = useState(1);
  const [signingModal, setSigningModal] = useState<{ url: string; redirectOnClose: boolean } | null>(null);

  // ── Properties query ───────────────────────────────────────────────────────

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery(
    propertyQueries.myProperties({
      keyword: listingSearch || undefined,
      page: propertyPage - 1,
      size: ITEMS_PER_PAGE,
    })
  );

  const propertiesResponse = propertiesData?.payload?.data;
  const properties = propertiesResponse?.content ?? [];
  const totalPages = propertiesResponse?.total_pages ?? 0;

  // ── Steps config ───────────────────────────────────────────────────────────

  const steps = [
    { id: 1 as WizardStep, label: t('steps.property'), description: t('steps.descriptions.1') },
    { id: 2 as WizardStep, label: t('steps.tenant'), description: t('steps.descriptions.2') },
    { id: 3 as WizardStep, label: t('steps.terms'), description: t('steps.descriptions.3') },
    { id: 4 as WizardStep, label: t('steps.review'), description: t('steps.descriptions.4') },
  ];

  // ── Validation ─────────────────────────────────────────────────────────────

  const isStepValid = useMemo(() => {
    if (currentStep === 1) {
      return Boolean(form.propertyId && form.propertyTitle && form.propertyAddress && form.propertyType);
    }
    if (currentStep === 2) {
      return Boolean(form.tenantName && form.tenantEmail && form.tenantLookupDone);
    }
    if (currentStep === 3) {
      return Boolean(form.monthlyRent && form.leaseStartDate && form.leaseEndDate);
    }
    return true;
  }, [currentStep, form]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTenantEmailChange = useCallback(
    (email: string) => {
      setForm((prev) => ({
        ...prev,
        tenantEmail: email,
        ...(prev.tenantLookupDone ? { tenantName: '', tenantPhone: '', tenantLookupDone: false } : {}),
      }));
    },
    []
  );

  const handleTenantLookup = useCallback(async () => {
    const email = form.tenantEmail.trim();
    if (!email) return;

    setTenantLookupLoading(true);
    try {
      const response = await userApi.searchByEmail(email);
      const userData = response.payload?.data;
      if (userData) {
        setForm((prev) => ({
          ...prev,
          tenantName: userData.full_name,
          tenantPhone: userData.phone || userData.masked_phone || '',
          tenantUserId: userData.user_id,
          tenantLookupDone: true,
        }));
        toast.success(t('tenantLookup.found'));
      } else {
        setForm((prev) => ({ ...prev, tenantName: '', tenantPhone: '', tenantLookupDone: false }));
        toast.error(t('tenantLookup.notFound'));
      }
    } catch {
      setForm((prev) => ({ ...prev, tenantName: '', tenantPhone: '', tenantLookupDone: false }));
      toast.error(t('tenantLookup.notFound'));
    } finally {
      setTenantLookupLoading(false);
    }
  }, [form.tenantEmail, t]);

  const buildPayload = (): CreateRentalContractPayload => ({
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
      id: form.tenantUserId,
      user_id: form.tenantUserId,
      fullName: form.tenantName,
      email: form.tenantEmail,
      phoneNumber: form.tenantPhone || null,
      avatarUrl: null,
    },
    tenantUserId: form.tenantUserId,
    landlordId: session?.user?.id ?? '',
    monthlyRent: Number(form.monthlyRent),
    securityAmount: Number(form.securityDeposit) || undefined,
    startDate: form.leaseStartDate,
    endDate: form.leaseEndDate,
  });

  const saveDraft = async () => {
    try {
      await createContractMutation.mutateAsync(buildPayload());
      toast.success(t('toast.draftSaved'));
      router.push(ROUTES.dashboard.rentalContracts);
    } catch {
      toast.error(t('toast.draftError'));
    }
  };

  const sendForSigning = async () => {
    try {
      const contract = await createContractMutation.mutateAsync(buildPayload());
      const signing = await sendToLandlordMutation.mutateAsync({ leaseId: contract.id });
      setSigningModal({ url: signing.signing_url, redirectOnClose: true });
      toast.success(t('toast.sentSuccess'));
    } catch {
      toast.error(t('toast.sentError'));
    }
  };

  const isMutating = createContractMutation.isPending || sendToLandlordMutation.isPending;

  // ── Step content ───────────────────────────────────────────────────────────

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <StepListingPicker
          properties={properties}
          isLoading={propertiesLoading}
          selectedPropertyId={form.propertyId}
          listingSearch={listingSearch}
          propertyPage={propertyPage}
          totalPages={totalPages}
          onSearchChange={(v) => { setListingSearch(v); setPropertyPage(1); }}
          onSelectProperty={(property) =>
            setForm((prev) => ({ ...prev, ...applyPropertyToForm(property) }))
          }
          onPageChange={setPropertyPage}
          t={(key, values) => t(key as never, values as never)}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <StepTenantLookup
          form={form}
          isLoading={tenantLookupLoading}
          onEmailChange={handleTenantEmailChange}
          onLookup={handleTenantLookup}
          t={(key) => t(key as never)}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <StepLeaseTerms
          form={form}
          onFieldChange={updateField}
          t={(key) => t(key as never)}
        />
      );
    }

    return <StepReview form={form} t={(key, values) => t(key as never, values as never)} />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(120,80,255,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(39,197,255,0.10),_transparent_22%),linear-gradient(180deg,#F7F4FF_0%,#FBFAFF_100%)]'>
      <div className='mx-auto max-w-[1320px] px-6 py-6'>
        {/* Back button — no giant card wrapper */}
        <ContractPageHeader
          label={t('backToContracts')}
          onBack={() => router.push(ROUTES.dashboard.rentalContracts)}
        />

        <div className='space-y-6'>
          {/* Wizard step indicator */}
          <WizardStepsCard
            steps={steps}
            currentStep={currentStep}
            eyebrow={t('steps.eyebrow')}
            title={t(`steps.titles.${currentStep}` as never)}
            subtitle={t(`steps.descriptions.${currentStep}` as never)}
            progressLabel={t('progress', { current: currentStep, total: steps.length })}
            onStepClick={setCurrentStep}
          />

          {/* Step content card */}
          <Card className='rounded-[30px] border-[#EAE1FF] bg-white/94 shadow-[0_24px_60px_rgba(96,72,179,0.10)]'>
            <CardContent className='p-6'>
              {renderStepContent()}

              <WizardFooter
                currentStep={currentStep}
                totalSteps={steps.length}
                isStepValid={isStepValid}
                isMutating={isMutating}
                onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep)}
                onNext={() => setCurrentStep((prev) => Math.min(4, prev + 1) as WizardStep)}
                onSaveDraft={saveDraft}
                onSendForSigning={sendForSigning}
                t={(key) => t(key as never)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {signingModal && (
        <DocuSignSigningModal
          open={Boolean(signingModal)}
          signingUrl={signingModal.url}
          signerRole='landlord'
          onClose={() => {
            const shouldRedirect = signingModal.redirectOnClose;
            setSigningModal(null);
            if (shouldRedirect) router.push(ROUTES.dashboard.rentalContracts);
          }}
        />
      )}
    </div>
  );
}
