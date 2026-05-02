'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Textarea } from '@/shared/ui/textarea';
import { Flag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportDialogProps {
  listingId: string;
  listingName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ listingId, listingName, open, onOpenChange }: ReportDialogProps) {
  const t = useTranslations('ReportDialog');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error(t('errorEmptyReason'));
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit report
      // await reportApi.submit({ listingId, reason });

      toast.success(t('successMessage'));
      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast.error(t('errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md p-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-4 border-b border-border'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-full bg-destructive/10 flex items-center justify-center'>
              <Flag className='size-5 text-destructive' />
            </div>
            <div>
              <DialogTitle className='text-lg font-semibold'>{t('title')}</DialogTitle>
              <DialogDescription className='text-sm text-muted-foreground mt-0.5'>
                {listingName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='p-6 space-y-4'>
          <div className='flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
            <AlertCircle className='size-5 text-amber-600 shrink-0 mt-0.5' />
            <p className='text-sm text-amber-800'>{t('disclaimer')}</p>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>
              {t('reasonLabel')}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className='min-h-[120px] resize-none'
            />
          </div>
        </div>

        <DialogFooter className='p-6 pt-4 border-t border-border gap-3'>
          <Button variant='outline' onClick={handleClose} className='flex-1'>
            {t('cancel')}
          </Button>
          <RealVistaButton
            variant='primary'
            size='medium'
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className='flex-1 bg-destructive hover:bg-destructive/90'
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </RealVistaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
