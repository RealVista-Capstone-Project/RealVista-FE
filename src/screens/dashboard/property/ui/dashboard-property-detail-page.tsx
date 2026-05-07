'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { usePropertyDetail } from '@/entities/property';
import { Spinner } from '@/shared/ui/spinner';
import type { PropertySummaryResponse } from '@/entities/property/api/property-api.types';
import { AgentVerificationModal } from '@/features/property-management/ui/components/agent-verification-modal';
import { mapPropertyDetailToOwnerSummary } from '../lib/map-property-detail-to-owner-summary';
import { PropertyDetailPanel } from './property-detail-panel';

export function DashboardPropertyDetailPage({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const t = useTranslations('PropertyDashboard');
  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);
  const [verifyTarget, setVerifyTarget] = React.useState<PropertySummaryResponse | null>(null);

  const handleBack = () => {
    router.push('/dashboard/property');
  };

  if (isLoading) {
    return (
      <div className='flex min-h-[320px] flex-1 items-center justify-center'>
        <Spinner className='size-10 text-primary' />
      </div>
    );
  }

  const summaryProperty =
    property != null ? mapPropertyDetailToOwnerSummary(property) : null;

  if (isError || !property || !summaryProperty) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 px-6 py-16'>
        <p className='text-center text-sm font-medium text-muted-foreground'>{t('detailLoadError')}</p>
        <button
          type='button'
          onClick={handleBack}
          className='text-sm font-semibold text-primary hover:underline'
        >
          {t('backToList')}
        </button>
      </div>
    );
  }

  return (
    <>
      <PropertyDetailPanel
        property={summaryProperty}
        onVerifyClick={(p) => setVerifyTarget(p)}
        onBack={handleBack}
        onDeleted={handleBack}
      />
      {verifyTarget ? (
        <AgentVerificationModal
          isOpen={!!verifyTarget}
          onClose={() => setVerifyTarget(null)}
          propertyId={verifyTarget.property_id}
          ownerName={verifyTarget.owner_name || ''}
          ownerPhoneRaw={verifyTarget.owner_phone || ''}
          ownerPhoneDisplay={verifyTarget.owner_phone_display || verifyTarget.owner_phone || ''}
        />
      ) : null}
    </>
  );
}
