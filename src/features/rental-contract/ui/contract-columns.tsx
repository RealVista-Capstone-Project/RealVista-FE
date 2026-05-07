'use client';

import React, { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Bell, CheckCircle2, Clock, Loader2, Pen, Trophy, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { RentalContractStatus, type RentalContract } from '@/entities/rental-contract';
import { Badge, Button } from '@/shared/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';

import {
  useGetLandlordSigningUrlMutation,
  useGetRenterSigningUrlMutation,
  useSendToLandlordMutation,
  useUpdateRentalContractStatusMutation,
} from '../hooks/use-rental-contracts';
import {
  formatContractCurrency,
  formatContractDate,
  getContractInitials,
  getRentalContractStatusColor,
} from '../lib/utils';
import { UpdateContractStatusDialog } from './update-contract-status-dialog';
import { DocuSignSigningModal } from './docusign-signing-modal';

// ─── Actions cell ────────────────────────────────────────────────────────────

function ContractActionsCell({ contract }: { contract: RentalContract }) {
  const t = useTranslations('RentalContract');
  const tGlobal = useTranslations();

  const updateStatusMutation = useUpdateRentalContractStatusMutation();
  const getLandlordSigningUrlMutation = useGetLandlordSigningUrlMutation();
  const sendToLandlordMutation = useSendToLandlordMutation();

  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [signingModal, setSigningModal] = useState<{
    url: string;
    role: 'landlord' | 'renter';
  } | null>(null);

  // Show "Send to owner to sign" when DRAFT
  const canSendToLandlord = contract.status === RentalContractStatus.DRAFT;

  // Show "Sign Now" when PENDING_LANDLORD, owner hasn't signed yet, envelope exists
  const canSignNow =
    contract.status === RentalContractStatus.PENDING_LANDLORD &&
    !contract.ownerSignedAt &&
    Boolean(contract.docusignEnvelopeId);

  // Show "Send Notification" when PENDING_RENTER
  const canSendNotification = contract.status === RentalContractStatus.PENDING_RENTER;

  // Show "Terminate" when ACTIVE
  const canTerminate = contract.status === RentalContractStatus.ACTIVE;

  const handleSendToLandlord = async () => {
    try {
      await sendToLandlordMutation.mutateAsync({ leaseId: contract.id });
      toast.success(t('toast.sentSuccess'));
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  const handleSignNow = async () => {
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/leases/signing-complete?leaseId=${contract.id}&role=landlord`
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
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  const handleSendNotification = async () => {
    // TODO: implement send notification to renter API
    toast.info('Send notification to renter — not implemented yet.');
  };

  const handleTerminate = async (_nextStatus: RentalContractStatus.TERMINATED, reason?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        contractId: contract.id,
        status: RentalContractStatus.TERMINATED,
        reason,
      });
      setShowTerminateDialog(false);
      toast.success(t('toast.updateSuccess'));
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        {/* Send to owner to sign — DRAFT */}
        {canSendToLandlord && (
          <Button
            type='button'
            size='sm'
            className='h-8 rounded-lg bg-primary px-3 text-white hover:bg-primary/90 disabled:opacity-60'
            onClick={handleSendToLandlord}
            disabled={sendToLandlordMutation.isPending}
          >
            {sendToLandlordMutation.isPending ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <>
                <Pen className='h-3.5 w-3.5' />
                {t('statusActions.sendToOwner')}
              </>
            )}
          </Button>
        )}

        {/* Sign Now — PENDING_LANDLORD */}
        {canSignNow && (
          <Button
            type='button'
            size='xs'
            variant='outline'
            className='rounded-lg border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-60'
            onClick={handleSignNow}
            disabled={getLandlordSigningUrlMutation.isPending}
          >
            {getLandlordSigningUrlMutation.isPending ? (
              <Loader2 className='size-3 animate-spin' />
            ) : (
              <>
                <Pen className='size-3' />
                {t('statusActions.signNow')}
              </>
            )}
          </Button>
        )}

        {/* Send Notification — PENDING_RENTER */}
        {/* TODO: wire up send-notification-to-renter API once implemented */}
        {canSendNotification && (
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 rounded-lg border-blue-200 px-3 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-60'
            onClick={handleSendNotification}
          >
            <Bell className='h-3.5 w-3.5' />
            {t('statusActions.sendToRenter')}
          </Button>
        )}

        {/* Terminate — ACTIVE */}
        {canTerminate && (
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 rounded-lg border-red-200 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60'
            onClick={() => setShowTerminateDialog(true)}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <>
                <XCircle className='h-3.5 w-3.5' />
                {t('statusActions.terminate')}
              </>
            )}
          </Button>
        )}
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

// ─── Tenant actions cell ──────────────────────────────────────────────────────

function TenantContractActionsCell({ contract }: { contract: RentalContract }) {
  const t = useTranslations('RentalContract');

  const getRenterSigningUrlMutation = useGetRenterSigningUrlMutation();

  const [signingModal, setSigningModal] = useState<{
    url: string;
    role: 'landlord' | 'renter';
  } | null>(null);

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
      setSigningModal({ url: data.signing_url, role: 'renter' });
    } catch {
      toast.error(t('toast.signingError'));
    }
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        {canSignNow && (
          <Button
            type='button'
            size='xs'
            variant='outline'
            className='rounded-lg border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-60'
            onClick={handleSignNow}
            disabled={getRenterSigningUrlMutation.isPending}
          >
            {getRenterSigningUrlMutation.isPending ? (
              <Loader2 className='size-3 animate-spin' />
            ) : (
              <>
                <Pen className='size-3' />
                {t('statusActions.signNow')}
              </>
            )}
          </Button>
        )}
      </div>

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

// ─── Column definitions ───────────────────────────────────────────────────────

export function useContractColumns(): ColumnDef<RentalContract, unknown>[] {
  const t = useTranslations('RentalContract');
  const tManage = useTranslations('ManageRentalContract');
  const locale = useLocale();

  return useMemo<ColumnDef<RentalContract, unknown>[]>(
    () => [
      {
        id: 'tenant',
        header: () => t('table.tenant'),
        cell: ({ row }) => {
          const { tenant } = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8 shrink-0'>
                <AvatarImage src={tenant.avatarUrl ?? undefined} alt={tenant.fullName} />
                <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
                  {getContractInitials(tenant.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-foreground'>{tenant.fullName}</p>
                <p className='truncate text-xs text-muted-foreground'>{tenant.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'property',
        header: () => t('table.property'),
        cell: ({ row }) => {
          const { property } = row.original;
          return (
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-foreground'>{property.title}</p>
              <p className='truncate text-xs text-muted-foreground'>{property.address}</p>
            </div>
          );
        },
      },
      {
        id: 'monthlyRent',
        header: () => t('table.monthlyRent'),
        cell: ({ row }) => (
          <span className='text-sm font-medium text-foreground'>
            {formatContractCurrency(row.original.monthlyRent, locale === 'vi' ? 'vi-VN' : 'en-US')}
          </span>
        ),
      },
      {
        id: 'leasePeriod',
        header: () => t('table.leasePeriod'),
        cell: ({ row }) => {
          const { leaseStartDate, leaseEndDate } = row.original;
          const start = new Date(leaseStartDate);
          const end = new Date(leaseEndDate);
          const now = new Date();
          const total = end.getTime() - start.getTime();
          const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
          const progress = total > 0 ? Math.round((elapsed / total) * 100) : 0;
          return (
            <div className='min-w-[180px] space-y-1.5'>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <span>{formatContractDate(leaseStartDate, locale, 'dd/MM/yyyy')}</span>
                <span className='mx-0.5'>→</span>
                <span>{formatContractDate(leaseEndDate, locale, 'dd/MM/yyyy')}</span>
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-primary/10'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: () => t('table.status'),
        cell: ({ row }) => {
          const status = row.original.status;
          const statusKey = `status.${status.toLowerCase()}` as const;
          const statusLabel = t.has(statusKey) ? t(statusKey) : status;

          const statusIconMap: Record<RentalContractStatus, React.ReactNode> = {
            [RentalContractStatus.DRAFT]:           <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.PENDING_LANDLORD]: <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.PENDING_RENTER]:  <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.ACTIVE]:          <CheckCircle2 className='h-3.5 w-3.5' />,
            [RentalContractStatus.EXPIRED]:         <XCircle className='h-3.5 w-3.5' />,
            [RentalContractStatus.TERMINATED]:      <XCircle className='h-3.5 w-3.5' />,
            [RentalContractStatus.REJECTED]:        <XCircle className='h-3.5 w-3.5' />,
          };

          return (
            <Badge
              variant='secondary'
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 border whitespace-nowrap w-fit',
                getRentalContractStatusColor(status)
              )}
            >
              {statusIconMap[status]}
              {statusLabel}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => tManage('table.actions'),
        cell: ({ row }) => <ContractActionsCell contract={row.original} />,
      },
    ],
    [t, tManage, locale]
  );
}

export function useTenantContractColumns(): ColumnDef<RentalContract, unknown>[] {
  const t = useTranslations('RentalContract');
  const locale = useLocale();

  return useMemo<ColumnDef<RentalContract, unknown>[]>(
    () => [
      {
        id: 'property',
        header: () => t('table.property'),
        cell: ({ row }) => {
          const { property } = row.original;
          return (
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-foreground'>{property.title}</p>
              <p className='truncate text-xs text-muted-foreground'>{property.address}</p>
            </div>
          );
        },
      },
      {
        id: 'monthlyRent',
        header: () => t('table.monthlyRent'),
        cell: ({ row }) => (
          <span className='text-sm font-medium text-foreground'>
            {formatContractCurrency(row.original.monthlyRent, locale === 'vi' ? 'vi-VN' : 'en-US')}
          </span>
        ),
      },
      {
        id: 'leasePeriod',
        header: () => t('table.leasePeriod'),
        cell: ({ row }) => {
          const { leaseStartDate, leaseEndDate } = row.original;
          const start = new Date(leaseStartDate);
          const end = new Date(leaseEndDate);
          const now = new Date();
          const total = end.getTime() - start.getTime();
          const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
          const progress = total > 0 ? Math.round((elapsed / total) * 100) : 0;
          return (
            <div className='min-w-[180px] space-y-1.5'>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <span>{formatContractDate(leaseStartDate, locale, 'dd/MM/yyyy')}</span>
                <span className='mx-0.5'>→</span>
                <span>{formatContractDate(leaseEndDate, locale, 'dd/MM/yyyy')}</span>
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-primary/10'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: () => t('table.status'),
        cell: ({ row }) => {
          const status = row.original.status;
          const statusKey = `status.${status.toLowerCase()}` as const;
          const statusLabel = t.has(statusKey) ? t(statusKey) : status;

          const statusIconMap: Record<RentalContractStatus, React.ReactNode> = {
            [RentalContractStatus.DRAFT]:            <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.PENDING_LANDLORD]: <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.PENDING_RENTER]:   <Clock className='h-3.5 w-3.5' />,
            [RentalContractStatus.ACTIVE]:           <CheckCircle2 className='h-3.5 w-3.5' />,
            [RentalContractStatus.EXPIRED]:          <XCircle className='h-3.5 w-3.5' />,
            [RentalContractStatus.TERMINATED]:       <XCircle className='h-3.5 w-3.5' />,
            [RentalContractStatus.REJECTED]:         <XCircle className='h-3.5 w-3.5' />,
          };

          return (
            <Badge
              variant='secondary'
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 border whitespace-nowrap w-fit',
                getRentalContractStatusColor(status)
              )}
            >
              {statusIconMap[status]}
              {statusLabel}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => t('table.actions'),
        cell: ({ row }) => <TenantContractActionsCell contract={row.original} />,
      },
    ],
    [t, locale]
  );
}
