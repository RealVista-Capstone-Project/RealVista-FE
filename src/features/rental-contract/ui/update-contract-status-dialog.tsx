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

type DialogStatus = RentalContractStatus.TERMINATED | RentalContractStatus.CANCELLED;

interface UpdateContractStatusDialogProps {
  contract: RentalContract;
  nextStatus: DialogStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nextStatus: DialogStatus, reason?: string) => Promise<void>;
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
    if (nextStatus === RentalContractStatus.CANCELLED) {
      return {
        title: t('statusDialog.cancelTitle'),
        description: t('statusDialog.cancelDescription', {
          tenantName: contract.tenant.fullName,
        }),
        confirmLabel: t('statusActions.cancelLease'),
        placeholder: t('statusDialog.cancelReasonPlaceholder'),
        hint: t('statusDialog.cancelReasonHint'),
      };
    }

    return {
      title: t('statusDialog.terminateTitle'),
      description: t('statusDialog.terminateDescription', {
        tenantName: contract.tenant.fullName,
      }),
      confirmLabel: t('statusActions.terminate'),
      placeholder: t('statusDialog.reasonPlaceholder'),
      hint: t('statusDialog.reasonHint'),
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
            <DialogTitle className='text-xl font-semibold text-foreground'>
              {config.title}
            </DialogTitle>
            <DialogDescription className='mt-2 text-sm leading-6 text-muted-foreground'>
              {config.description}
            </DialogDescription>
          </DialogHeader>

          <div className='mt-5 space-y-2'>
              <label className='text-sm font-medium text-foreground' htmlFor='contract-status-reason'>
                {t('statusDialog.reasonLabel')}
              </label>
              <Textarea
                id='contract-status-reason'
                value={reason}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)}
                placeholder={config.placeholder}
                className='min-h-28 rounded-xl border-gray-200 bg-primary/5 text-sm focus-visible:ring-primary/30'
              />
              <p className='text-xs text-muted-foreground'>
                {config.hint}
              </p>
          </div>

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
              className='rounded-xl bg-primary text-white hover:bg-primary/90'
            >
              {isPending ? t('statusDialog.updating') : config.confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
