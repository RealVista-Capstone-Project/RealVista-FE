'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { type CreateRentalContractPayload } from '@/entities/rental-contract';
import { type PropertySummaryResponse } from '@/entities/property';
import { listingQueries } from '@/entities/listing';
import { userApi } from '@/entities/user';
import {
  useCreateRentalContractMutation,
  useSendToLandlordMutation,
} from '@/features/rental-contract/hooks/use-rental-contracts';
import { DocuSignSigningModal } from '@/features/rental-contract/ui/docusign-signing-modal';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

import { ContractPageHeader } from './components/contract-page-header';
import { WizardStepsCard } from './components/wizard-steps-card';
import { StepListingPicker, getPropertyThumbnail, getPropertyAddress, getAttributeNumber } from './components/step-listing-picker';
import { StepTenantLookup } from './components/step-tenant-lookup';
import { StepLeaseTerms } from './components/step-lease-terms';
import { StepReview } from './components/step-review';
import { WizardFooter } from './components/wizard-footer';

// ── Types & constants ─────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

interface FormState {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  thumbnailUrl: string;
  landlordId: string;   // owner_id from the selected property
  landlordName: string; // full name of the property owner (fetched from user profile)
  landlordEmail: string; // email of the property owner
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

function getDefaultDates(): { leaseStartDate: string; leaseEndDate: string } {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().slice(0, 10);
  return { leaseStartDate: start, leaseEndDate: end };
}

const INITIAL_FORM_STATE: FormState = {
  propertyId: '',
  propertyTitle: '',
  propertyAddress: '',
  propertyType: '',
  bedrooms: '0',
  bathrooms: '0',
  thumbnailUrl: '',
  landlordId: '',
  landlordName: '',
  landlordEmail: '',
  tenantName: '',
  tenantEmail: '',
  tenantPhone: '',
  tenantUserId: '',
  tenantLookupDone: false,
  monthlyRent: '',
  securityDeposit: '',
  ...getDefaultDates(),
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
    // Use owner_id / owner_name returned by the API — never the agent's identity
    landlordId: property.owner_id ?? '',
    landlordName: property.owner_name ?? '',
    landlordEmail: '',
  };
}

/** Maps a full Listing API response to the same FormState fields as applyPropertyToForm */
function applyListingToForm(listing: import('@/entities/listing').Listing): Partial<FormState> {
  const primaryMedia = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  const addressParts = [
    listing.property.street_address,
    listing.location.district_name,
    listing.location.city_name,
  ].filter(Boolean);
  const bedroomsAttr = listing.attributes?.find((a) => a.attribute_code === 'bedrooms' || a.attribute_code === 'BEDROOMS');
  const bathroomsAttr = listing.attributes?.find((a) => a.attribute_code === 'bathrooms' || a.attribute_code === 'BATHROOMS');

  // property_owner is the real owner; user_id is the agent when is_created_by_owner === false
  const owner = listing.property_owner;

  return {
    propertyId: listing.property_id ?? listing.listing_id,
    propertyTitle: listing.name ?? listing.property.street_address,
    propertyAddress: addressParts.join(', '),
    propertyType: listing.property_type?.property_type_name ?? '',
    bedrooms: String(bedroomsAttr?.value_number ?? 0),
    bathrooms: String(bathroomsAttr?.value_number ?? 0),
    thumbnailUrl: primaryMedia?.thumbnail_url ?? primaryMedia?.media_url ?? '',
    landlordId: owner?.user_id ?? listing.user_id ?? '',
    landlordName: owner?.full_name ?? '',
    landlordEmail: owner?.email ?? '',
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function CreateRentalContractPage() {
  const t = useTranslations('CreateRentalContract');
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const createContractMutation = useCreateRentalContractMutation();
  const sendToLandlordMutation = useSendToLandlordMutation();

  // ── Pre-fill context from ?listingId=&tenantUserId=&tenantName= ───────────
  const prefillListingId = searchParams?.get('listingId') ?? '';
  const prefillTenantId = searchParams?.get('tenantUserId') ?? '';
  const prefillTenantName = searchParams?.get('tenantName') ?? '';

  // Fetch the listing so we can populate Step 1 fields
  const { data: listingResponse } = useQuery({
    ...listingQueries.detail(prefillListingId),
    enabled: !!prefillListingId,
  });
  const prefillListing =
    (listingResponse as any)?.payload?.data ??
    (listingResponse as any)?.data ??
    null;

  // Determine start step: skip straight to Step 3 (Lease Terms) when both
  // listing + tenant are pre-filled; skip to Step 2 when only tenant is known.
  const initialStep = useMemo<WizardStep>(() => {
    if (prefillListingId && prefillTenantId) return 3;
    if (prefillTenantId) return 2;
    return 1;
  }, [prefillListingId, prefillTenantId]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
  // Track the highest step the user has legitimately reached (completed previous step)
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(initialStep);
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM_STATE,
    // Seed tenant fields immediately so Step 2 shows them without lookup
    ...(prefillTenantId
      ? {
        tenantUserId: prefillTenantId,
        tenantName: prefillTenantName,
        tenantLookupDone: true,
      }
      : {}),
  }));
  const [tenantLookupLoading, setTenantLookupLoading] = useState(false);
  const [signingModal, setSigningModal] = useState<{ url: string; redirectOnClose: boolean } | null>(null);

  // Apply listing data once it loads (Step 1 pre-fill)
  useEffect(() => {
    if (!prefillListing) return;
    setForm((prev) => ({ ...prev, ...applyListingToForm(prefillListing) }));
  }, [prefillListing]);

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
      const today = new Date().toISOString().slice(0, 10);
      const hasRent = Boolean(form.monthlyRent);
      const hasStart = Boolean(form.leaseStartDate);
      const hasEnd = Boolean(form.leaseEndDate);
      const startNotPast = form.leaseStartDate >= today;
      const endAfterStart = form.leaseEndDate > form.leaseStartDate;
      const s = new Date(form.leaseStartDate);
      const e = new Date(form.leaseEndDate);
      const durationMonths = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      const meetsMinDuration = durationMonths >= 3;
      return hasRent && hasStart && hasEnd && startNotPast && endAfterStart && meetsMinDuration;
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

  const isAgent = useMemo(() => {
    const backendRoles: string[] = (session?.user as any)?.backendRoles ?? [];
    return backendRoles.includes('AGENT');
  }, [session?.user]);

  const buildPayload = (): CreateRentalContractPayload => {
    const sessionUserId = session?.user?.id ?? '';

    return {
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
      // Tenant's user ID — set from email lookup in Step 2
      tenantUserId: form.tenantUserId,
      // Owner of the property — comes from property.owner_id (Step 1), never the agent
      landlordId: form.landlordId,
      // If an AGENT is creating this contract on behalf of an owner, record their ID; owners get null
      agentId: isAgent ? sessionUserId : null,
      monthlyRent: Number(form.monthlyRent),
      securityAmount: Number(form.securityDeposit) || undefined,
      startDate: form.leaseStartDate,
      endDate: form.leaseEndDate,
    };
  };

  const contractsRoute = isAgent ? ROUTES.dashboard.myContracts : ROUTES.dashboard.rentalContracts;

  const saveDraft = async () => {
    try {
      await createContractMutation.mutateAsync(buildPayload());
      toast.success(t('toast.draftSaved'));
      router.push(contractsRoute);
    } catch {
      toast.error(t('toast.draftError'));
    }
  };

  const sendForSigning = async () => {
    try {
      const contract = await createContractMutation.mutateAsync(buildPayload());
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/leases/signing-complete?leaseId=${contract.id}&signerRole=landlord&viewerRole=owner`
          : undefined;
      const signing = await sendToLandlordMutation.mutateAsync({ leaseId: contract.id, returnUrl });
      toast.success(t('toast.sentSuccess'));
      // Agents create the contract on behalf of the owner — they have nothing to sign,
      // so skip the DocuSign modal and redirect straight to the contracts list.
      if (isAgent) {
        router.push(contractsRoute);
        return;
      }
      setSigningModal({ url: signing.signing_url, redirectOnClose: true });
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
          selectedPropertyId={form.propertyId}
          onSelectProperty={(property) =>
            setForm((prev) => ({ ...prev, ...applyPropertyToForm(property) }))
          }
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
          t={(key, values) => t(key as never, values as never)}
        />
      );
    }

    return <StepReview form={form} t={(key, values) => t(key as never, values as never)} />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className='h-full overflow-hidden flex flex-col p-4 md:p-6'>
      <div className='rounded-2xl border border-primary/20 overflow-hidden bg-white shadow-lg flex flex-col flex-1 max-w-5xl mx-auto w-full min-h-0'>

        {/* Header — back button + page title + step indicator */}
        <div className='shrink-0'>
          <div className='flex items-center px-4 md:px-8 pt-5 pb-0'>
            <ContractPageHeader
              label={t('backToContracts')}
              onBack={() => router.push(contractsRoute)}
            />
          </div>

          {/* Centered page title + subtitle */}
          <div className='space-y-1 px-4 md:px-8 pt-4 pb-0 text-center'>
            <h1 className='text-2xl md:text-[28px] font-bold leading-tight tracking-[-0.28px] text-foreground'>
              {t('pageTitle')}
            </h1>
            <p className='mx-auto max-w-md text-sm md:text-base leading-relaxed text-muted-foreground/70'>
              {t('pageSubtitle')}
            </p>
          </div>

          {/* Step indicator */}
          <div className='flex justify-center border-b border-primary/20 px-4 md:px-8 pb-4 md:pb-5 mt-4'>
            <WizardStepsCard
              steps={steps}
              currentStep={currentStep}
              maxAllowedStep={maxReachedStep}
              onStepClick={(step) => {
                if (step <= maxReachedStep) setCurrentStep(step);
              }}
            />
          </div>
        </div>

        {/* Scrollable step content */}
        <div className='flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6'>
          {renderStepContent()}
        </div>

        {/* Sticky wizard footer */}
        <WizardFooter
          currentStep={currentStep}
          totalSteps={steps.length}
          isStepValid={isStepValid}
          isMutating={isMutating}
          onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep)}
          onNext={() => {
            const next = Math.min(4, currentStep + 1) as WizardStep;
            setCurrentStep(next);
            setMaxReachedStep((prev) => (next > prev ? next : prev));
          }}
          onSaveDraft={saveDraft}
          onSendForSigning={sendForSigning}
          t={(key) => t(key as never)}
        />
      </div>

      {signingModal && (
        <DocuSignSigningModal
          open={Boolean(signingModal)}
          signingUrl={signingModal.url}
          signerRole='landlord'
          onClose={() => {
            const shouldRedirect = signingModal.redirectOnClose;
            setSigningModal(null);
            if (shouldRedirect) router.push(contractsRoute);
          }}
        />
      )}
    </div>
  );
}
