'use client';

import * as React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface DeleteProposalDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProposalDialog({
  isOpen, isLoading, onClose, onConfirm,
}: DeleteProposalDialogProps) {
  const t = useTranslations('ManageProposals');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[420px] rounded-2xl border border-border/70 shadow-2xl p-0 overflow-hidden bg-card'>
        <div className='p-6'>
          <div className='mb-4 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-500'>
            <AlertTriangle size={22} />
          </div>
          <DialogHeader>
            <DialogTitle className='text-base font-bold text-foreground'>
              {t('deleteTitle')}
            </DialogTitle>
            <DialogDescription className='mt-1.5 text-sm leading-relaxed text-muted-foreground'>
              {t('deleteDesc')}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className='flex items-center justify-end gap-3 border-t border-border/70 bg-sky-50/70 px-6 py-4 dark:bg-muted/30'>
          <Button
            variant='ghost'
            onClick={onClose}
            disabled={isLoading}
            className='h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-primary/10'
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className='h-9 rounded-lg px-5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-60'
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <Clock size={14} className='animate-spin' />
                {t('btnDeleting')}
              </span>
            ) : t('btnConfirmDelete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
