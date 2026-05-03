'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RentalContractStatus, type RentalContract } from '@/entities/rental-contract';
import {
  useGetRenterSigningUrlMutation,
  useRentalContractDetailQuery,
} from '@/features/rental-contract/hooks/use-rental-contracts';
import { DocuSignSigningModal } from '@/features/rental-contract/ui/docusign-signing-modal';
import {
  isSignedDocumentRunning,
  SignedDocumentCard,
} from '@/features/rental-contract/ui/signed-document-card';
import { Badge, Button, CardContent, Dialog, DialogContent } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { Download, ExternalLink, FileText, Loader2, Pen, X } from 'lucide-react';
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
  const detailQuery = useRentalContractDetailQuery(contract.id, {
    refetchInterval: isSignedDocumentRunning(contract.signedDocumentStatus) ? 5000 : false,
  });
  const liveContract = detailQuery.data ?? contract;

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
          ? `${window.location.origin}/leases/signing-complete?leaseId=${contract.id}&signerRole=renter&viewerRole=tenant`
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

  const previewUrl =
    liveContract.signedDocumentStatus === 'COMPLETED' && liveContract.signedDocumentUrl
      ? liveContract.signedDocumentUrl
      : contract.contractDocumentUrl;
  const isFinalPreview =
    liveContract.signedDocumentStatus === 'COMPLETED' && Boolean(liveContract.signedDocumentUrl);

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
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent showCloseButton={false} className='h-[92vh] max-h-[92vh] w-[96vw] max-w-[1600px] overflow-hidden rounded-[1.75rem] border-primary/15 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.22)]'>
      <div className='flex max-h-[92vh] w-full flex-col overflow-hidden'>
        <div className='relative overflow-hidden border-b border-primary/10 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),linear-gradient(135deg,#ffffff_0%,var(--primary-light,#F7F5FF)_100%)] px-5 py-5'>
          <div className='absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl' />
          <div className='relative flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <span className='rounded-full border border-primary/20 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm'>
                  {t('detailPanel.title')}
                </span>
                <Badge
                  variant='secondary'
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                    getRentalContractStatusColor(contract.status)
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
              <p className='line-clamp-2 text-xl font-bold tracking-[-0.02em] text-foreground'>
                {contract.property.title}
              </p>
              <p className='mt-1 line-clamp-1 text-sm text-muted-foreground'>
                {contract.property.address}
              </p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-10 w-10 shrink-0 rounded-xl bg-white/80 text-muted-foreground shadow-sm hover:bg-white hover:text-foreground'
              onClick={onClose}
              aria-label={t('detailPanel.closeAria')}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <CardContent className='grid min-h-0 flex-1 gap-0 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] p-0 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]'>
          <section className='min-h-[520px] border-b border-primary/10 bg-secondary/40 p-4 lg:border-b-0 lg:border-r lg:p-5'>
            <div className='flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm'>
              <div className='flex items-center justify-between border-b border-primary/10 bg-white px-4 py-3'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-foreground'>
                    {isFinalPreview ? tContract('signedDocument.title') : tContract('detailPanel.previewBadge')}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {isFinalPreview
                      ? tContract('signedDocument.completed')
                      : tContract('signedDocument.notAvailable')}
                  </p>
                </div>
                {previewUrl && (
                  <div className='flex items-center gap-2'>
                    <Button asChild size='sm' variant='outline' className='h-9 rounded-lg'>
                      <a href={previewUrl} download target='_blank' rel='noreferrer'>
                        <Download className='h-3.5 w-3.5' />
                        Download
                      </a>
                    </Button>
                    <Button asChild size='sm' className='h-9 rounded-lg bg-primary text-white hover:bg-primary/90'>
                      <a href={previewUrl} target='_blank' rel='noreferrer'>
                        <ExternalLink className='h-3.5 w-3.5' />
                        Open
                      </a>
                    </Button>
                  </div>
                )}
              </div>
              {previewUrl ? (
                <iframe src={previewUrl} title='Contract preview' className='min-h-0 flex-1 bg-white' />
              ) : (
                <div className='flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground'>
                  <FileText className='mb-3 h-14 w-14 text-primary/30' />
                  <p className='text-sm font-semibold text-foreground'>{tContract('signedDocument.notAvailable')}</p>
                  <p className='mt-1 max-w-sm text-sm leading-6'>No draft or final document is available for preview yet.</p>
                </div>
              )}
            </div>
          </section>

          <section className='min-w-0 space-y-4 p-4 lg:max-h-[calc(92vh-112px)] lg:overflow-y-auto lg:p-5'>
              <div className='rounded-2xl border border-primary/10 bg-white p-4 shadow-sm'>
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
                <div className='rounded-2xl border border-primary/10 bg-secondary/70 p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {tContract('detailPanel.leaseStart')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseStartDate, locale)}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/10 bg-secondary/70 p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {tContract('detailPanel.leaseEnd')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseEndDate, locale)}
                  </p>
                </div>
              </div>

              <div className='rounded-2xl border border-dashed border-primary/20 bg-secondary/70 p-4'>
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

              <div className='rounded-2xl border border-dashed border-primary/20 bg-secondary/70 p-4'>
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

              <SignedDocumentCard contract={liveContract} compact />

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

          {canSignNow && (
            <div className='rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F5FF_100%)] p-4 shadow-sm'>
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
                className='h-11 w-full rounded-xl bg-emerald-600 text-white shadow-[0_14px_28px_color-mix(in_oklch,var(--color-emerald-600,oklch(0.64_0.15_162))_22%,transparent)] hover:bg-emerald-700 disabled:opacity-60'
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
          </section>
        </CardContent>
      </div>
        </DialogContent>
      </Dialog>

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
