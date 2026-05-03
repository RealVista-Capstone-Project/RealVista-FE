'use client';

import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pen,
  XCircle,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { RentalContractStatus, type RentalContract } from '@/entities/rental-contract';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';
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

function getContractPreviewUrl(contract: RentalContract) {
  return contract.signedDocumentStatus === 'COMPLETED' && contract.signedDocumentUrl
    ? contract.signedDocumentUrl
    : contract.contractDocumentUrl || null;
}

// ─── Actions cell ────────────────────────────────────────────────────────────

function ContractActionsCell({ contract }: { contract: RentalContract }) {
  const t = useTranslations('RentalContract');
  const tGlobal = useTranslations();

  const updateStatusMutation = useUpdateRentalContractStatusMutation();
  const getLandlordSigningUrlMutation = useGetLandlordSigningUrlMutation();
  const sendToLandlordMutation = useSendToLandlordMutation();

  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const previewUrl = getContractPreviewUrl(contract);

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-lg hover:bg-primary/5'
            onClick={(event) => event.stopPropagation()}
            aria-label={t('statusActions.moreActions')}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56 rounded-xl border-primary/10 p-2 shadow-xl'>
          <DropdownMenuLabel className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
            {t('statusActions.contractActions')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!previewUrl}
            onSelect={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className='h-4 w-4' />
            {t('statusActions.viewDetail')}
          </DropdownMenuItem>
          {(canSendToLandlord || canSignNow || canSendNotification || canTerminate) && (
            <DropdownMenuSeparator />
          )}

          {canSendToLandlord && (
            <DropdownMenuItem onSelect={handleSendToLandlord} disabled={sendToLandlordMutation.isPending}>
              {sendToLandlordMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Pen className='h-4 w-4' />}
              {t('statusActions.sendToOwner')}
            </DropdownMenuItem>
          )}
          {canSignNow && (
            <DropdownMenuItem onSelect={handleSignNow} disabled={getLandlordSigningUrlMutation.isPending}>
              {getLandlordSigningUrlMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Pen className='h-4 w-4' />}
              {t('statusActions.signNow')}
            </DropdownMenuItem>
          )}
          {canSendNotification && (
            <DropdownMenuItem onSelect={handleSendNotification}>
              <Bell className='h-4 w-4' />
              {t('statusActions.sendToRenter')}
            </DropdownMenuItem>
          )}
          {canTerminate && (
            <DropdownMenuItem
              variant='destructive'
              onSelect={() => setShowTerminateDialog(true)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <XCircle className='h-4 w-4' />}
              {t('statusActions.terminate')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}

// ─── Tenant actions cell ──────────────────────────────────────────────────────

function TenantContractActionsCell({ contract }: { contract: RentalContract }) {
  const t = useTranslations('RentalContract');
  const locale = useLocale();

  const getRenterSigningUrlMutation = useGetRenterSigningUrlMutation();

  const previewUrl = getContractPreviewUrl(contract);
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
          ? `${window.location.origin}/${locale}/leases/signing-complete?leaseId=${contract.id}&signerRole=renter&viewerRole=tenant`
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-lg hover:bg-primary/5'
            onClick={(event) => event.stopPropagation()}
            aria-label={t('statusActions.moreActions')}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52 rounded-xl border-primary/10 p-2 shadow-xl'>
          <DropdownMenuLabel className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
            {t('statusActions.contractActions')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!previewUrl}
            onSelect={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className='h-4 w-4' />
            {t('statusActions.viewDetail')}
          </DropdownMenuItem>
          {canSignNow && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignNow} disabled={getRenterSigningUrlMutation.isPending}>
                {getRenterSigningUrlMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Pen className='h-4 w-4' />}
                {t('statusActions.signNow')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
            <div className='flex min-w-0 items-center gap-3'>
              <div className='relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5'>
                {property.thumbnailUrl ? (
                  <Image
                    src={property.thumbnailUrl}
                    alt={property.title}
                    fill
                    sizes='64px'
                    className='object-cover'
                  />
                ) : (
                  <Building2 className='h-5 w-5 text-primary' />
                )}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-foreground'>{property.title}</p>
                <p className='truncate text-xs text-muted-foreground'>{property.address}</p>
              </div>
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
