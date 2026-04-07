'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { OwnerPropertySummary } from '@/entities/property';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  MapPin,
  Home,
  Ruler,
  Phone,
  Mail,
  User,
  SendHorizonal,
  Building2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { SubmitProposalModal } from './submit-proposal-modal';
import { useSubmitProposalMutation } from '../hooks/use-submit-proposal';

interface OwnerPropertySheetProps {
  property: OwnerPropertySummary | null;
  onClose: () => void;
}

function getStatusStyle(status: string): string {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VERIFIED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function formatArea(size: number | null): string | null {
  if (!size) return null;
  return `${size} m²`;
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className='bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col gap-1.5'>
      <div className='flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide'>
        {icon}
        {label}
      </div>
      <div className='font-bold text-gray-900 text-sm truncate'>{value}</div>
    </div>
  );
}

export function OwnerPropertySheet({ property, onClose }: OwnerPropertySheetProps) {
  const t = useTranslations('OwnerProperties');
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const submitProposalMutation = useSubmitProposalMutation();

  const handleProposalSubmit = useCallback(
    async (values: { message: string; offered_commission: string }) => {
      if (!property) return;
      try {
        await submitProposalMutation.mutateAsync({
          property_id: property.property_id,
          message: values.message,
          offered_commission: values.offered_commission,
        });
        setProposalModalOpen(false);
        toast.success(t('toast.proposalSuccess'));
      } catch {
        toast.error(t('toast.proposalError'));
      }
    },
    [property, submitProposalMutation, t]
  );

  if (!property) return null;

  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ??
    property.media?.[0]?.media_url;

  const location = [
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
    .filter(Boolean)
    .join(', ');

  const usableArea = formatArea(property.usable_size_m2);
  const landArea = formatArea(property.land_size_m2);

  const bedroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BEDROOMS');
  const bathroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BATHROOMS');
  const floorsAttr = property.attributes?.find((a) => a.attribute_code === 'FLOORS');

  return (
    <>
      <Sheet open={!!property} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-[480px] p-0 flex flex-col gap-0 overflow-hidden'
        >
          {/* Hidden title for accessibility */}
          <SheetHeader className='sr-only'>
            <SheetTitle>{t('detailPanel.title')}</SheetTitle>
          </SheetHeader>

          {/* Hero image */}
          <div className='relative h-56 w-full bg-gray-100 flex-shrink-0'>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={property.street_address}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
                <Home className='h-14 w-14 text-indigo-200' />
              </div>
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent' />

            {/* Overlaid address + status */}
            <div className='absolute bottom-0 left-0 right-0 px-5 pb-4'>
              <div className='flex items-end justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <h2 className='text-white font-bold text-base leading-tight line-clamp-2'>
                    {property.street_address}
                  </h2>
                  {location && (
                    <div className='flex items-center gap-1 mt-1'>
                      <MapPin className='h-3 w-3 text-white/70 flex-shrink-0' />
                      <span className='text-xs text-white/80 truncate'>{location}</span>
                    </div>
                  )}
                </div>
                <Badge
                  variant='outline'
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 bg-white/90 backdrop-blur-sm',
                    getStatusStyle(property.status)
                  )}
                >
                  {property.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-5 space-y-6'>

              {/* Property type + category */}
              {property.property_type_info && (
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4 text-indigo-500 flex-shrink-0' />
                  <span className='text-sm font-semibold text-gray-800'>
                    {property.property_type_info.property_type_name}
                  </span>
                  {property.property_type_info.property_category_name && (
                    <>
                      <span className='text-gray-300'>·</span>
                      <span className='text-sm text-gray-500'>
                        {property.property_type_info.property_category_name}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Stats tiles */}
              <div className='grid grid-cols-2 gap-3'>
                {usableArea && (
                  <InfoTile
                    label={t('detailPanel.usableArea')}
                    value={usableArea}
                    icon={<Ruler className='h-3 w-3' />}
                  />
                )}
                {landArea && (
                  <InfoTile
                    label={t('detailPanel.landArea')}
                    value={landArea}
                    icon={<Ruler className='h-3 w-3' />}
                  />
                )}
                {bedroomsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.bedrooms')}
                    value={String(bedroomsAttr.value_number)}
                    icon={<Home className='h-3 w-3' />}
                  />
                )}
                {bathroomsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.bathrooms')}
                    value={String(bathroomsAttr.value_number)}
                    icon={<Home className='h-3 w-3' />}
                  />
                )}
                {floorsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.floors')}
                    value={String(floorsAttr.value_number)}
                    icon={<Building2 className='h-3 w-3' />}
                  />
                )}
              </div>

              {/* Description */}
              {property.description && (
                <section>
                  <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5'>
                    {t('detailPanel.description')}
                  </h4>
                  <p className='text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100'>
                    {property.description}
                  </p>
                </section>
              )}

              <Separator className='bg-gray-100' />

              {/* Owner info */}
              <section>
                <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3'>
                  {t('detailPanel.ownerInfo')}
                </h4>
                <div className='space-y-3'>
                  {property.owner_name && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0'>
                        <User className='h-4 w-4 text-indigo-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.ownerName')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800'>
                          {property.owner_name}
                        </div>
                      </div>
                    </div>
                  )}
                  {property.owner_phone && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0'>
                        <Phone className='h-4 w-4 text-green-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.phone')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800'>
                          {property.owner_phone}
                        </div>
                      </div>
                    </div>
                  )}
                  {property.owner_email && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0'>
                        <Mail className='h-4 w-4 text-orange-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.email')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800 truncate'>
                          {property.owner_email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Sticky CTA footer */}
          <div className='p-4 border-t border-gray-100 bg-white flex-shrink-0'>
            <Button
              className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-xl h-11 gap-2 shadow-sm shadow-indigo-200/60 text-sm'
              onClick={() => setProposalModalOpen(true)}
            >
              <SendHorizonal className='h-4 w-4' />
              {t('detailPanel.submitProposal')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Proposal modal (opened from sheet) */}
      <SubmitProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        property={property}
        onSubmit={handleProposalSubmit}
        isLoading={submitProposalMutation.isPending}
      />
    </>
  );
}
