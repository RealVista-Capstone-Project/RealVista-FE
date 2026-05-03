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
  Dialog,
  DialogContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Download, ExternalLink, FileText, Loader2, Pen, X } from 'lucide-react';
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

  const previewUrl =
    liveContract.signedDocumentStatus === 'COMPLETED' && liveContract.signedDocumentUrl
      ? liveContract.signedDocumentUrl
      : contract.contractDocumentUrl;
  const isFinalPreview =
    liveContract.signedDocumentStatus === 'COMPLETED' && Boolean(liveContract.signedDocumentUrl);

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
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent showCloseButton={false} className='h-[92vh] max-h-[92vh] w-[96vw] max-w-140 overflow-hidden rounded-[1.75rem] border-primary/15 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.22)]'>
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
                  aria-label='Close contract detail'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <CardContent className='grid min-h-0 flex-1 gap-0 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] p-0 lg:grid-cols-[minmax(0,1fr)_700px] xl:grid-cols-[minmax(0,1fr)_420px]'>
              <section className='min-h-[520px] border-b border-primary/10 bg-secondary/40 p-4 lg:border-b-0 lg:border-r lg:p-5'>
                <div className='flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm'>
                  <div className='flex items-center justify-between border-b border-primary/10 bg-white px-4 py-3'>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-foreground'>
                        {isFinalPreview ? t('signedDocument.title') : t('detailPanel.previewBadge')}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {isFinalPreview
                          ? t('signedDocument.completed')
                          : t('signedDocument.notAvailable')}
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
                      <p className='text-sm font-semibold text-foreground'>{t('signedDocument.notAvailable')}</p>
                      <p className='mt-1 max-w-sm text-sm leading-6'>No draft or final document is available for preview yet.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className='min-w-0 space-y-4 p-4 lg:max-h-[calc(92vh-112px)] lg:overflow-y-auto lg:p-5'>
                <SignedDocumentCard contract={liveContract} compact />

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

                <div className='rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,white_0%,var(--primary-light,#F7F5FF)_100%)] p-4 shadow-sm'>
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
              </section>
            </CardContent>
          </div>
        </DialogContent>
      </Dialog>

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
