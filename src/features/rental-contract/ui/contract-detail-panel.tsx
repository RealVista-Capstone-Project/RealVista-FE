'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  RentalContractStatus,
  type RentalContract,
} from '@/entities/rental-contract';
import { useManageRentalContractContext } from '../model/manage-rental-contract-context';
import { useUpdateRentalContractStatusMutation } from '../hooks/use-rental-contracts';
import {
  Badge,
  Button,
  CardContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Eye, FileText, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatContractCurrency,
  formatContractDate,
  getRentalContractStatusColor,
} from '../lib/utils';
import { UpdateContractStatusDialog } from './update-contract-status-dialog';

interface ContractDetailPanelProps {
  contract: RentalContract;
  onClose: () => void;
}

export function ContractDetailPanel({ contract, onClose }: ContractDetailPanelProps) {
  const t = useTranslations('RentalContract');
  const locale = useLocale();
  const { setSelectedContract } = useManageRentalContractContext();
  const updateStatusMutation = useUpdateRentalContractStatusMutation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<
    RentalContractStatus.ACTIVE | RentalContractStatus.REJECTED | RentalContractStatus.TERMINATED | null
  >(null);

  const statusKey = `status.${contract.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : contract.status;

  const availableActions = useMemo(() => {
    if (contract.status === RentalContractStatus.PENDING) {
      return [RentalContractStatus.ACTIVE, RentalContractStatus.REJECTED] as const;
    }

    if (contract.status === RentalContractStatus.ACTIVE) {
      return [RentalContractStatus.TERMINATED] as const;
    }

    return [] as const;
  }, [contract.status]);

  const handleStatusUpdate = async (
    nextStatus: RentalContractStatus.ACTIVE | RentalContractStatus.REJECTED | RentalContractStatus.TERMINATED,
    reason?: string
  ) => {
    try {
      const updated = await updateStatusMutation.mutateAsync({
        contractId: contract.id,
        status: nextStatus,
        reason,
      });

      setSelectedContract(updated);
      setDialogStatus(null);
      setIsPopoverOpen(false);
      toast.success(t('toast.updateSuccess'));
    } catch {
      toast.error(t('toast.updateError'));
    }
  };

  const renderActionLabel = (
    status: RentalContractStatus.ACTIVE | RentalContractStatus.REJECTED | RentalContractStatus.TERMINATED
  ) => {
    if (status === RentalContractStatus.ACTIVE) return t('statusActions.approve');
    if (status === RentalContractStatus.REJECTED) return t('statusActions.reject');
    return t('statusActions.terminate');
  };

  const reasonText = contract.terminationReason ?? contract.rejectionReason;

  return (
    <>
      <div className='sticky top-4 flex max-h-[calc(100vh-120px)] w-full flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-[#E9E7F5] bg-white shadow-[0_24px_60px_rgba(80,56,160,0.12)] lg:basis-[40%] lg:max-w-[40%]'>
        <div className='flex items-center justify-between border-b border-[#F0EEF7] px-5 py-4'>
          <div>
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-main-secondary/60'>
              {t('detailPanel.title')}
            </h2>
            <p className='mt-1 text-lg font-semibold text-main-black'>{contract.property.title}</p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='rounded-xl text-main-secondary/60 hover:bg-[#F6F4FF] hover:text-main-black'
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <CardContent className='min-h-0 flex-1 space-y-5 overflow-y-auto p-5'>
          <div className='overflow-hidden rounded-2xl border border-[#ECE9FB] bg-[#FBFAFF]'>
            <div className='relative aspect-[3/4] overflow-hidden bg-[#F3F0FF]'>
              <img
                src={contract.contractDocumentUrl}
                alt={t('detailPanel.previewAlt', { tenantName: contract.tenant.fullName })}
                className='h-full w-full object-cover'
              />
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120F25]/40 via-transparent to-white/10' />
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
              <div className='rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(234,230,249,0.9)]'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1ECFF] text-main-primary'>
                    <FileText className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs uppercase tracking-[0.16em] text-main-secondary/50'>
                      {t('detailPanel.contractMeta')}
                    </p>
                    <p className='mt-1 text-sm font-semibold text-main-black'>{contract.id}</p>
                    <p className='mt-1 text-sm leading-6 text-main-secondary/70'>
                      {contract.tenant.fullName} · {formatContractCurrency(contract.monthlyRent, locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-[#F8F7FD] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-main-secondary/50'>
                    {t('detailPanel.leaseStart')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-main-black'>
                    {formatContractDate(contract.leaseStartDate, locale)}
                  </p>
                </div>
                <div className='rounded-xl bg-[#F8F7FD] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-main-secondary/50'>
                    {t('detailPanel.leaseEnd')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-main-black'>
                    {formatContractDate(contract.leaseEndDate, locale)}
                  </p>
                </div>
              </div>

              {reasonText && (
                <div className='rounded-xl border border-dashed border-[#D7D1F8] bg-[#FAF8FF] p-4'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-main-secondary/50'>
                    {contract.status === RentalContractStatus.REJECTED
                      ? t('detailPanel.rejectionReason')
                      : t('detailPanel.terminationReason')}
                  </p>
                  <p className='mt-2 text-sm leading-6 text-main-secondary/80'>{reasonText}</p>
                </div>
              )}
            </div>
          </div>

          <div className='rounded-2xl border border-[#ECE9FB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F5FF_100%)] p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-[0.18em] text-main-secondary/50'>
                  {t('detailPanel.actionCardEyebrow')}
                </p>
                <p className='mt-1 text-sm leading-6 text-main-secondary/80'>
                  {t('detailPanel.actionCardDescription')}
                </p>
              </div>
            </div>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  disabled={availableActions.length === 0}
                  className='h-11 w-full rounded-xl bg-main-primary text-white shadow-[0_18px_30px_rgba(92,63,214,0.26)] hover:bg-main-primary-hover'
                >
                  {availableActions.length === 0
                    ? t('statusActions.noAvailableAction')
                    : t('statusActions.updateStatus')}
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-64 rounded-xl border-[#ECE9FB] p-2 shadow-xl'>
                <div className='space-y-1'>
                  {availableActions.map((action) => (
                    <button
                      key={action}
                      type='button'
                      className='flex w-full items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#F5F1FF]'
                      onClick={() => {
                        setDialogStatus(action);
                        setIsPopoverOpen(false);
                      }}
                    >
                      <div>
                        <p className='text-sm font-semibold text-main-black'>
                          {renderActionLabel(action)}
                        </p>
                        <p className='mt-0.5 text-xs leading-5 text-main-secondary/60'>
                          {action === RentalContractStatus.ACTIVE
                            ? t('statusActionHints.approve')
                            : action === RentalContractStatus.REJECTED
                              ? t('statusActionHints.reject')
                              : t('statusActionHints.terminate')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </div>

      {dialogStatus && (
        <UpdateContractStatusDialog
          contract={contract}
          nextStatus={dialogStatus}
          open={dialogStatus !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDialogStatus(null);
            }
          }}
          onConfirm={handleStatusUpdate}
          isPending={updateStatusMutation.isPending}
        />
      )}
    </>
  );
}
