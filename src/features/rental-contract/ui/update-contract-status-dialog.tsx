'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { RentalContractStatus, type RentalContract } from '@/entities/rental-contract';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@/shared/ui';
import { useTranslations } from 'next-intl';

interface UpdateContractStatusDialogProps {
  contract: RentalContract;
  nextStatus:
    | RentalContractStatus.PENDING_RENTER
    | RentalContractStatus.ACTIVE
    | RentalContractStatus.TERMINATED;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nextStatus: UpdateContractStatusDialogProps['nextStatus'], reason?: string) => Promise<void>;
  isPending?: boolean;
}

export function UpdateContractStatusDialog({
  contract,
  nextStatus,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: UpdateContractStatusDialogProps) {
  const t = useTranslations('RentalContract');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const requiresReason = nextStatus === RentalContractStatus.TERMINATED;

  const config = useMemo(() => {
    if (nextStatus === RentalContractStatus.PENDING_RENTER) {
      return {
        title: t('statusDialog.sendTitle'),
        description: t('statusDialog.sendDescription', {
          tenantName: contract.tenant.fullName,
        }),
        confirmLabel: t('statusActions.sendForSigning'),
      };
    }

    if (nextStatus === RentalContractStatus.ACTIVE) {
      return {
        title: t('statusDialog.activateTitle'),
        description: t('statusDialog.activateDescription', {
          tenantName: contract.tenant.fullName,
        }),
        confirmLabel: t('statusActions.markActive'),
      };
    }

    return {
      title: t('statusDialog.terminateTitle'),
      description: t('statusDialog.terminateDescription', {
        tenantName: contract.tenant.fullName,
      }),
      confirmLabel: t('statusActions.terminate'),
    };
  }, [contract.tenant.fullName, nextStatus, t]);

  const handleConfirm = async () => {
    await onConfirm(nextStatus, reason.trim() || undefined);
  };

  const disableConfirm = isPending || (requiresReason && reason.trim().length < 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-2xl border-0 p-0 shadow-2xl'>
        <div className='rounded-2xl bg-white p-6'>
          <DialogHeader className='text-left'>
            <DialogTitle className='text-xl font-semibold text-main-black'>
              {config.title}
            </DialogTitle>
            <DialogDescription className='mt-2 text-sm leading-6 text-main-secondary/70'>
              {config.description}
            </DialogDescription>
          </DialogHeader>

          {requiresReason && (
            <div className='mt-5 space-y-2'>
              <label className='text-sm font-medium text-main-black' htmlFor='contract-status-reason'>
                {t('statusDialog.reasonLabel')}
              </label>
              <Textarea
                id='contract-status-reason'
                value={reason}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)}
                placeholder={t('statusDialog.reasonPlaceholder')}
                className='min-h-28 rounded-xl border-gray-200 bg-[#F7F7FD] text-sm focus-visible:ring-main-primary/30'
              />
              <p className='text-xs text-main-secondary/60'>
                {t('statusDialog.reasonHint')}
              </p>
            </div>
          )}

          <DialogFooter className='mt-6 flex-row gap-3 sm:justify-end sm:space-x-0'>
            <Button
              type='button'
              variant='outline'
              className='rounded-xl border-gray-200'
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type='button'
              onClick={handleConfirm}
              disabled={disableConfirm}
              className='rounded-xl bg-main-primary text-white hover:bg-main-primary-hover'
            >
              {isPending ? t('statusDialog.updating') : config.confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
