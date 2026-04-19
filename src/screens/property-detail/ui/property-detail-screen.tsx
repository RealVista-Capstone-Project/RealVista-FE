'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
import { PropertyAbout } from '@/features/property-about';
import type { Property } from '@/entities/property';
import { useAuthSession } from '@/features/auth/model';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { AgentApplyProposalModal } from '@/features/agent-proposal/ui/agent-apply-proposal-modal';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/features/auth/model';
import { usePropertyDetail } from '@/entities/property/api/use-property-detail';
import { PropertyActiveListings } from '@/features/property-active-listings';
import { mapPropertyResponseToProperty } from '@/entities/property/lib/property-response-to-property.mapper';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { ClipboardEdit, AlertCircle } from 'lucide-react';
import { agentEngagementApi } from '@/entities/agent-engagement';

export interface PropertyDetailScreenProps {
  propertyId: string;
}

export function PropertyDetailScreen({ propertyId }: PropertyDetailScreenProps) {
  const { data: response, isLoading, isError } = usePropertyDetail(propertyId);
  const [isApplyProposalOpen, setIsApplyProposalOpen] = useState(false);
  const [isApplyProposalDisabledLocal, setIsApplyProposalDisabledLocal] = useState(false);
  const { data: session } = useAuthSession();
  const t = useTranslations('PropertyDetail');
  const router = useRouter();
  const params = useParams();

  // RBAC check
  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const isAgent = backendRoles.includes('AGENT');
  const initiatorId = session?.user?.id;
  const receiverId = response?.owner_id;
  const applyStatePropertyId = response?.property_id ?? propertyId;

  const { data: applyStateResponse } = useQuery({
    queryKey: ['agent-proposal-apply-state', initiatorId, receiverId, applyStatePropertyId],
    queryFn: () =>
      agentEngagementApi.getAgentProposalApplyState(initiatorId!, receiverId!, applyStatePropertyId),
    enabled: isAgent && !!initiatorId && !!receiverId && !!applyStatePropertyId,
    staleTime: 2 * 60 * 1000,
  });

  const isApplyProposalDisabled =
    isApplyProposalDisabledLocal || applyStateResponse?.payload?.data?.can_apply_proposal === false;

  if (isLoading) {
    return (
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-pulse'>
        <Skeleton className='h-12 w-3/4 mb-6' />
        <Skeleton className='h-[400px] w-full rounded-xl mb-8' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
          <div className='md:col-span-2'>
            <Skeleton className='h-64 w-full mb-6' />
          </div>
          <div className='md:col-span-1'>
            <Skeleton className='h-48 w-full' />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <AlertCircle className='size-12 text-red-500' />
        <h2 className='text-xl font-bold'>{t('propertyNotFound')}</h2>
        <RealVistaButton variant='primary' onClick={() => router.back()}>
          {t('goBack')}
        </RealVistaButton>
      </div>
    );
  }

  const property: Property = mapPropertyResponseToProperty(response);

  const handleApplyProposal = () => {
    if (!isAuthenticated(session)) {
      const locale = params?.locale || 'vi';
      router.push(`/${locale}/login`);
      return;
    }
    setIsApplyProposalOpen(true);
  };

  return (
    <div className='min-h-screen bg-background pb-22 md:pb-8'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-8'>
        <PropertyHeader
          property={property}
          onFavorite={() => { }} // Properties themselves might not be favoritable yet?
          isFavorite={false}
        />

        {/* Gallery Section */}
        <div className='mt-4 sm:mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={() => { }}
            onFavorite={() => { }}
            isFavorite={false}
          />
        </div>

        {/* Responsive layout: mobile column, desktop row */}
        <div className='mt-6 sm:mt-10 flex flex-col md:flex-row md:gap-10'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            {/* Mobile: Apply Sidebar (inline) only for agents */}
            {isAgent && (
              <div className='md:hidden mb-6 bg-white border border-primary/20 rounded-lg p-6'>
                <p className='text-muted-foreground mb-4'>{t('agentApplyDescription') || 'Are you an agent looking to manage this property?'}</p>
                <RealVistaButton
                  variant='primary'
                  size='medium'
                  className='w-full bg-secondary flex items-center justify-center gap-2'
                  onClick={handleApplyProposal}
                  disabled={isApplyProposalDisabled}
                >
                  <ClipboardEdit className='h-5 w-5 shrink-0' />
                  {t('applyProposal') || 'Apply Proposal'}
                </RealVistaButton>
              </div>
            )}

            {/* About Section */}
            <div className='mb-10'>
              <PropertyAbout property={property} />
            </div>

            {/* Active Listings Section (Market context for Agents) */}
            <div className='mb-10 pt-8 border-t border-border/50'>
              <PropertyActiveListings
                listings={response.active_listings || []}
                locale={(params?.locale as string) || 'vi'}
              />
            </div>
          </div>

          {/* Desktop: Apply Sidebar only for agents */}
          {isAgent && (
            <div className='hidden md:block mt-6 md:mt-0 w-full max-w-[380px] shrink-0'>
              <div className='md:sticky md:top-8 bg-white border border-primary/20 rounded-lg p-6'>
                <h3 className='text-lg font-bold mb-2'>{t('agentApplyTitle') || 'Manage this property'}</h3>
                <p className='text-muted-foreground text-sm mb-6'>
                  {t('agentApplyDescription') || 'Submit your proposal to the owner to manage this real estate asset.'}
                </p>
                <RealVistaButton
                  variant='primary'
                  size='medium'
                  className='w-full bg-secondary flex items-center justify-center gap-2'
                  onClick={handleApplyProposal}
                  disabled={isApplyProposalDisabled}
                >
                  <ClipboardEdit className='h-5 w-5 shrink-0' />
                  {t('applyProposal') || 'Apply Proposal'}
                </RealVistaButton>
              </div>
            </div>
          )}
        </div>
      </div>

      <AgentApplyProposalModal
        propertyId={property.id}
        isOpen={isApplyProposalOpen}
        onClose={() => setIsApplyProposalOpen(false)}
        onSubmitSuccess={() => setIsApplyProposalDisabledLocal(true)}
      />
    </div>
  );
}
