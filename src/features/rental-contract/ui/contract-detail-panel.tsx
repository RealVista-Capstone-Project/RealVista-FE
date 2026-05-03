'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  RentalContractStatus,
  type RentalContract,
} from '@/entities/rental-contract';
import {
  useGetLandlordSigningUrlMutation,
  useRentalContractDetailQuery,
  useSendToLandlordMutation,
  useSendToRenterMutation,
  useUpdateRentalContractStatusMutation,
} from '../hooks/use-rental-contracts';
import {
  Badge,
  Button,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Eye, ExternalLink, FileText, Loader2, Pen, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatContractCurrency,
  formatContractDate,
  getRentalContractStatusColor,
} from '../lib/utils';
import { UpdateContractStatusDialog } from './update-contract-status-dialog';
import { DocuSignSigningModal } from './docusign-signing-modal';
import { isSignedDocumentRunning, SignedDocumentCard } from './signed-document-card';

interface ContractDetailPanelProps {
  contract: RentalContract;
  onClose: () => void;
}

type SigningAction =
  | RentalContractStatus.PENDING_LANDLORD
  | RentalContractStatus.PENDING_RENTER;

type DialogAction = RentalContractStatus.TERMINATED;

export function ContractDetailPanel({ contract, onClose }: ContractDetailPanelProps) {
  const t = useTranslations('RentalContract');
  const locale = useLocale();
  const updateStatusMutation = useUpdateRentalContractStatusMutation();
  const sendToLandlordMutation = useSendToLandlordMutation();
  const sendToRenterMutation = useSendToRenterMutation();
  const getLandlordSigningUrlMutation = useGetLandlordSigningUrlMutation();
  const detailQuery = useRentalContractDetailQuery(contract.id, {
    refetchInterval: isSignedDocumentRunning(contract.signedDocumentStatus) ? 5000 : false,
  });
  const liveContract = detailQuery.data ?? contract;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [signingModal, setSigningModal] = useState<{
    url: string;
    role: 'landlord' | 'renter';
  } | null>(null);

  const isPending =
    sendToLandlordMutation.isPending ||
    sendToRenterMutation.isPending ||
    updateStatusMutation.isPending;

  // Show "Sign Now" when PENDING_LANDLORD, owner hasn't signed yet, envelope exists
  const canSignNow =
    contract.status === RentalContractStatus.PENDING_LANDLORD &&
    !contract.ownerSignedAt &&
    Boolean(contract.docusignEnvelopeId);

  const handleSignNow = async () => {
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/leases/signing-complete?leaseId=${contract.id}&signerRole=landlord&viewerRole=owner`
          : undefined;
      const data = await getLandlordSigningUrlMutation.mutateAsync({
        leaseId: contract.id,
        returnUrl,
      });
      if (!data.signing_url) {
        toast.error(t('toast.signingUnavailable'));
        return;
      }
      window.open(data.signing_url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(t('toast.signingError'));
    }
  };

  const statusKey = `status.${contract.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : contract.status;

  // Map each contract status to the action(s) available
  const availableActions = useMemo((): Array<SigningAction | DialogAction> => {
    switch (contract.status) {
      case RentalContractStatus.DRAFT:
        return [RentalContractStatus.PENDING_LANDLORD];
      case RentalContractStatus.PENDING_LANDLORD:
        return [RentalContractStatus.PENDING_RENTER];
      case RentalContractStatus.ACTIVE:
        return [RentalContractStatus.TERMINATED];
      default:
        return [];
    }
  }, [contract.status]);

  // Signing actions open the DocuSign URL; terminate opens a dialog
  const handleAction = async (action: SigningAction | DialogAction) => {
    if (action === RentalContractStatus.TERMINATED) {
      setShowTerminateDialog(true);
      setIsPopoverOpen(false);
      return;
    }

    try {
      let signingData;
      if (action === RentalContractStatus.PENDING_LANDLORD) {
        signingData = await sendToLandlordMutation.mutateAsync({ leaseId: contract.id });
      } else {
        signingData = await sendToRenterMutation.mutateAsync({ leaseId: contract.id });
      }

      setIsPopoverOpen(false);
      // Show modal — user decides when/whether to open DocuSign
      setSigningModal({
        url: signingData.signing_url,
        role: action === RentalContractStatus.PENDING_LANDLORD ? 'landlord' : 'renter',
      });
    } catch {
      toast.error(t('toast.updateError'));
    }
  };

  const handleTerminate = async (
    _nextStatus: RentalContractStatus.TERMINATED,
    reason?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        contractId: contract.id,
        status: RentalContractStatus.TERMINATED,
        reason,
      });
      setShowTerminateDialog(false);
      toast.success(t('toast.updateSuccess'));
    } catch {
      toast.error(t('toast.updateError'));
    }
  };

  const getActionLabel = (action: SigningAction | DialogAction) => {
    if (action === RentalContractStatus.PENDING_LANDLORD)
      return t('statusActions.sendToLandlord');
    if (action === RentalContractStatus.PENDING_RENTER)
      return t('statusActions.sendToRenter');
    return t('statusActions.terminate');
  };

  const getActionHint = (action: SigningAction | DialogAction) => {
    if (action === RentalContractStatus.PENDING_LANDLORD)
      return t('statusActionHints.sendToLandlord');
    if (action === RentalContractStatus.PENDING_RENTER)
      return t('statusActionHints.sendToRenter');
    return t('statusActionHints.terminate');
  };

  const signingProgress = [
    {
      label: t('detailPanel.signingProgress.ownerSigned'),
      value: contract.ownerSignedAt
        ? formatContractDate(contract.ownerSignedAt, locale)
        : t('detailPanel.signingProgress.pending'),
    },
    {
      label: t('detailPanel.signingProgress.tenantSigned'),
      value: contract.tenantSignedAt
        ? formatContractDate(contract.tenantSignedAt, locale)
        : t('detailPanel.signingProgress.pending'),
    },
  ];

  return (
    <>
      <div className='sticky top-4 flex max-h-[calc(100vh-120px)] w-full flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-[0_24px_60px_color-mix(in_oklch,var(--primary)_12%,transparent)] lg:basis-[40%] lg:max-w-[40%]'>
        <div className='flex items-center justify-between border-b border-primary/10 px-5 py-4'>
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
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <CardContent className='min-h-0 flex-1 space-y-5 overflow-y-auto p-5'>
          <div className='overflow-hidden rounded-2xl border border-primary/10 bg-primary/5'>
            <div className='relative aspect-[3/4] overflow-hidden bg-primary/5'>
              {contract.contractDocumentUrl ? (
                <img
                  src={contract.contractDocumentUrl}
                  alt={t('detailPanel.previewAlt', { tenantName: contract.tenant.fullName })}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-secondary/30'>
                  <FileText className='h-16 w-16' />
                </div>
              )}
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-white/10' />
              <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3'>
                <Badge
                  variant='secondary'
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    getRentalContractStatusColor(contract.status)
                  )}
                >
                  {statusLabel}
                </Badge>
                <div className='flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md'>
                  <Eye className='h-3.5 w-3.5' />
                  {t('detailPanel.previewBadge')}
                </div>
              </div>
            </div>

            <div className='space-y-4 px-4 py-4'>
              <div className='rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_20%,transparent)]'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <FileText className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground/70'>
                      {t('detailPanel.contractMeta')}
                    </p>
                    <p className='mt-1 text-sm font-semibold text-foreground'>{contract.id}</p>
                    <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                      {contract.tenant.fullName} ·{' '}
                      {formatContractCurrency(
                        contract.monthlyRent,
                        locale === 'vi' ? 'vi-VN' : 'en-US'
                      )}
                    </p>
                    {contract.docusignEnvelopeId && (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {t('detailPanel.envelopeId', { envelopeId: contract.docusignEnvelopeId })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-secondary p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {t('detailPanel.leaseStart')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseStartDate, locale)}
                  </p>
                </div>
                <div className='rounded-xl bg-secondary p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {t('detailPanel.leaseEnd')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-foreground'>
                    {formatContractDate(contract.leaseEndDate, locale)}
                  </p>
                </div>
              </div>

              <div className='rounded-xl border border-dashed border-primary/20 bg-secondary p-4'>
                <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                  {t('detailPanel.signingProgress.title')}
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

              <SignedDocumentCard contract={liveContract} />

              {contract.terminationReason && (
                <div className='rounded-xl border border-dashed border-primary/20 bg-secondary p-4'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
                    {t('detailPanel.terminationReason')}
                  </p>
                  <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                    {contract.terminationReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className='rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,white_0%,var(--primary-light,#F7F5FF)_100%)] p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('detailPanel.actionCardEyebrow')}
                </p>
                <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                  {t('detailPanel.actionCardDescription')}
                </p>
              </div>
            </div>

            {canSignNow && (
              <Button
                type='button'
                className='mb-3 h-11 w-full rounded-xl bg-emerald-600 text-white shadow-[0_14px_28px_color-mix(in_oklch,var(--color-emerald-600,oklch(0.64_0.15_162))_22%,transparent)] hover:bg-emerald-700 disabled:opacity-60'
                onClick={handleSignNow}
                disabled={getLandlordSigningUrlMutation.isPending}
              >
                {getLandlordSigningUrlMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {t('statusDialog.updating')}
                  </>
                ) : (
                  <>
                    <Pen className='h-4 w-4' />
                    {t('statusActions.signNow')}
                  </>
                )}
              </Button>
            )}

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  disabled={availableActions.length === 0 || isPending}
                  className='h-11 w-full rounded-xl bg-primary text-white shadow-[0_18px_30px_color-mix(in_oklch,var(--primary)_26%,transparent)] hover:bg-primary/90'
                >
                  {availableActions.length === 0
                    ? t('statusActions.noAvailableAction')
                    : isPending
                      ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          {t('statusDialog.updating')}
                        </>
                      )
                      : (
                        <>
                          {t('statusActions.updateStatus')}
                          <ChevronDown className='h-4 w-4' />
                        </>
                      )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align='end'
                className='w-64 rounded-xl border-primary/10 p-2 shadow-xl'
              >
                <div className='space-y-1'>
                  {availableActions.map((action) => {
                    const isSigning =
                      action === RentalContractStatus.PENDING_LANDLORD ||
                      action === RentalContractStatus.PENDING_RENTER;
                    return (
                      <button
                        key={action}
                        type='button'
                        className='flex w-full items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary/5'
                        onClick={() => handleAction(action)}
                      >
                        <div className='flex-1'>
                          <p className='flex items-center gap-1.5 text-sm font-semibold text-foreground'>
                            {getActionLabel(action)}
                            {isSigning && <ExternalLink className='h-3 w-3 text-primary' />}
                          </p>
                          <p className='mt-0.5 text-xs leading-5 text-muted-foreground'>
                            {getActionHint(action)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </div>

      {showTerminateDialog && (
        <UpdateContractStatusDialog
          contract={contract}
          nextStatus={RentalContractStatus.TERMINATED}
          open={showTerminateDialog}
          onOpenChange={(open) => {
            if (!open) setShowTerminateDialog(false);
          }}
          onConfirm={handleTerminate}
          isPending={updateStatusMutation.isPending}
        />
      )}

      {signingModal && (
        <DocuSignSigningModal
          open={Boolean(signingModal)}
          signingUrl={signingModal.url}
          signerRole={signingModal.role}
          onClose={() => setSigningModal(null)}
        />
      )}
    </>
  );
}
