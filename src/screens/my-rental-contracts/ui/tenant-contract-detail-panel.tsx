'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RentalContractStatus, type RentalContract } from '@/entities/rental-contract';
import { useGetRenterSigningUrlMutation } from '@/features/rental-contract/hooks/use-rental-contracts';
import { DocuSignSigningModal } from '@/features/rental-contract/ui/docusign-signing-modal';
import { Badge, Button, CardContent } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { FileText, Loader2, Pen, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatContractCurrency,
  formatContractDate,
  getRentalContractStatusColor,
} from '@/features/rental-contract/lib/utils';

interface TenantContractDetailPanelProps {
  contract: RentalContract;
  onClose: () => void;
}

export function TenantContractDetailPanel({ contract, onClose }: TenantContractDetailPanelProps) {
  const t = useTranslations('MyRentalContracts');
  const tContract = useTranslations('RentalContract');
  const locale = useLocale();
  const getRenterSigningUrlMutation = useGetRenterSigningUrlMutation();

  const [signingUrl, setSigningUrl] = useState<string | null>(null);

  // Show "Sign Now" when PENDING_RENTER, tenant hasn't signed yet, envelope exists
  const canSignNow =
    contract.status === RentalContractStatus.PENDING_RENTER &&
    !contract.tenantSignedAt &&
    Boolean(contract.docusignEnvelopeId);

  const handleSignNow = async () => {
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/leases/signing-complete?leaseId=${contract.id}&role=renter`
          : undefined;
      const data = await getRenterSigningUrlMutation.mutateAsync({
        leaseId: contract.id,
        returnUrl,
      });
      if (!data.signing_url) {
        toast.error(t('toast.signingUnavailable'));
        return;
      }
      setSigningUrl(data.signing_url);
    } catch {
      toast.error(t('toast.signingError'));
    }
  };

  const statusKey = `status.${contract.status.toLowerCase()}` as const;
  const statusLabel = tContract.has(statusKey) ? tContract(statusKey) : contract.status;

  const signingProgress = [
    {
      label: t('detailPanel.landlordSigned'),
      value: contract.ownerSignedAt
        ? formatContractDate(contract.ownerSignedAt, locale)
        : tContract('detailPanel.signingProgress.pending'),
    },
    {
      label: t('detailPanel.youSigned'),
      value: contract.tenantSignedAt
        ? formatContractDate(contract.tenantSignedAt, locale)
        : tContract('detailPanel.signingProgress.pending'),
    },
  ];

  return (
    <>
      <div className='sticky top-4 flex max-h-[calc(100vh-120px)] w-full flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_rgba(80,56,160,0.12)] lg:basis-[40%] lg:max-w-[40%]'>
        <div className='flex items-center justify-between border-b border-border px-5 py-4'>
          <div>
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
              {t('detailPanel.title')}
            </h2>
            <p className='mt-1 text-lg font-semibold text-foreground'>{contract.property.title}</p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-foreground'
            onClick={onClose}
            aria-label={t('detailPanel.closeAria')}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <CardContent className='min-h-0 flex-1 space-y-5 overflow-y-auto p-5'>
          <div className='overflow-hidden rounded-2xl border border-border bg-primary/5'>
            <div className='relative aspect-[3/4] overflow-hidden bg-primary/10'>
              {contract.contractDocumentUrl ? (
                <img
                  src={contract.contractDocumentUrl}
                  alt={t('detailPanel.previewAlt', { propertyTitle: contract.property.title })}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-secondary/30'>
                  <FileText className='h-16 w-16' />
                </div>
              )}
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120F25]/40 via-transparent to-white/10' />
              <div className='absolute bottom-4 left-4 right-4'>
                <Badge
                  variant='secondary'
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    getRentalContractStatusColor(contract.status)
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
            </div>

            <div className='space-y-4 px-4 py-4'>
              <div className='rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(234,230,249,0.9)]'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <FileText className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground/70'>
                      {t('detailPanel.contractMeta')}
                    </p>
                    <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                      {contract.property.address} ·{' '}
                      {formatContractCurrency(
                        contract.monthlyRent,
                        locale === 'vi' ? 'vi-VN' : 'en-US'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-primary/5 p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {tContract('detailPanel.leaseStart')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseStartDate, locale)}
                  </p>
                </div>
                <div className='rounded-xl bg-primary/5 p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {tContract('detailPanel.leaseEnd')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseEndDate, locale)}
                  </p>
                </div>
              </div>

              <div className='rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4'>
                <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                  {t('detailPanel.partiesTitle')}
                </p>
                <div className='mt-3 space-y-3'>
                  <div>
                    <p className='text-xs text-muted-foreground/70'>{t('detailPanel.ownerLabel')}</p>
                    <p className='mt-0.5 text-sm font-medium text-foreground'>
                      {contract.landlordName || contract.owner_id}
                    </p>
                    {contract.landlordEmail && (
                      <p className='text-xs text-muted-foreground/70'>{contract.landlordEmail}</p>
                    )}
                  </div>
                  <div className='h-px bg-primary/10' />
                  <div>
                    <p className='text-xs text-muted-foreground/70'>{t('detailPanel.tenantLabel')}</p>
                    <p className='mt-0.5 text-sm font-medium text-foreground'>
                      {contract.tenant.fullName}
                    </p>
                    <p className='text-xs text-muted-foreground/70'>{contract.tenant.email}</p>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4'>
                <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                  {t('detailPanel.signingProgressTitle')}
                </p>
                <div className='mt-3 space-y-3'>
                  {signingProgress.map((item) => (
                    <div key={item.label} className='flex items-center justify-between gap-4'>
                      <span className='text-sm text-muted-foreground'>{item.label}</span>
                      <span className='text-sm font-semibold text-foreground'>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {contract.terminationReason && (
                <div className='rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {tContract('detailPanel.terminationReason')}
                  </p>
                  <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                    {contract.terminationReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {canSignNow && (
            <div className='rounded-2xl border border-border bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F5FF_100%)] p-4'>
              <div className='mb-3'>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('detailPanel.actionCardEyebrow')}
                </p>
                <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                  {t('detailPanel.actionCardDescription')}
                </p>
              </div>

              <Button
                type='button'
                className='h-11 w-full rounded-xl bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.22)] hover:bg-emerald-700 disabled:opacity-60'
                onClick={handleSignNow}
                disabled={getRenterSigningUrlMutation.isPending}
                aria-label={t('detailPanel.signNowAria')}
              >
                {getRenterSigningUrlMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {t('detailPanel.signing')}
                  </>
                ) : (
                  <>
                    <Pen className='h-4 w-4' />
                    {t('detailPanel.signNow')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </div>

      {signingUrl && (
        <DocuSignSigningModal
          open={Boolean(signingUrl)}
          signingUrl={signingUrl}
          signerRole='renter'
          onClose={() => setSigningUrl(null)}
        />
      )}
    </>
  );
}
