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
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import {
  reportApi,
  LISTING_REPORT_REASONS,
  USER_REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from '@/entities/report/api/report.api';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({
  targetType,
  targetId,
  targetName,
  open,
  onOpenChange,
}: ReportDialogProps) {
  const t = useTranslations('ReportDialog');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons =
    targetType === 'LISTING' ? LISTING_REPORT_REASONS : USER_REPORT_REASONS;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t('errorEmptyReason'));
      return;
    }

    setIsSubmitting(true);
    try {
      await reportApi.submit({
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      });

      toast.success(t('successMessage'));
      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast.error(t('errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md p-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-4 border-b border-border'>
          <div className='flex items-center gap-3'>
            <Flag className='size-5 text-destructive' />
            <div>
              <DialogTitle className='text-lg font-semibold'>
                {targetType === 'LISTING' ? t('titleListing') : t('titleUser')}
              </DialogTitle>
              <DialogDescription className='text-sm text-muted-foreground mt-0.5'>
                {targetName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='p-6 space-y-5'>
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              {t('reasonLabel')}
              <span className='text-red-500 ml-0.5'>*</span>
            </label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t('reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent className='max-h-[240px] overflow-y-auto w-full'>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              {t('descriptionLabel')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              className='min-h-[100px] resize-none bg-slate-50'
            />
          </div>
        </div>

        <DialogFooter className='p-6 pt-4 border-t border-border gap-3'>
          <Button variant='outline' onClick={handleClose} className='flex-1 h-10'>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className='flex-1 h-10 bg-black text-white hover:bg-black/90'
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
