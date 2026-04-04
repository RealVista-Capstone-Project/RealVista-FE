'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AgentEngagement } from '@/entities/agent-engagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

const cancelSchema = z.object({
  reason: z
    .string()
    .min(10, 'Vui lòng nhập ít nhất 10 ký tự')
    .max(500, 'Lý do không được vượt quá 500 ký tự'),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

interface CancelContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentEngagement;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function CancelContractDialog({
  open,
  onOpenChange,
  agent,
  onConfirm,
  isLoading = false,
}: CancelContractDialogProps) {
  const t = useTranslations('AgentEngagement');

  const form = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onConfirm(data.reason);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-1'>
            <div className='flex items-center justify-center h-10 w-10 rounded-full bg-red-100 flex-shrink-0'>
              <AlertTriangle className='h-5 w-5 text-destructive' />
            </div>
            <DialogTitle className='text-base font-semibold text-gray-900'>
              {t('cancelDialog.title')}
            </DialogTitle>
          </div>
          <DialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
            {t('cancelDialog.description', {
              agentName: agent.agent_full_name,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Info summary */}
        <div className='bg-red-50 rounded-xl p-4 border border-red-100 space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>{t('detailPanel.agent')}</span>
            <span className='font-semibold text-gray-900'>{agent.agent_full_name}</span>
          </div>
          {(agent.property_address || agent.property_type_name) && (
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>{t('detailPanel.property')}</span>
              <span className='font-semibold text-gray-900 text-right max-w-[200px] truncate'>
                {agent.property_address ?? agent.property_type_name}
              </span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium text-gray-700'>
                    {t('cancelDialog.reasonLabel')}
                    <span className='text-destructive ml-1'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('cancelDialog.reasonPlaceholder')}
                      className='min-h-[100px] resize-none focus-visible:ring-destructive/30 focus-visible:border-destructive/50'
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className='flex justify-between items-center'>
                    <FormMessage />
                    <span className='text-xs text-gray-400 ml-auto'>
                      {field.value.length}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className='border-gray-200'
              >
                {t('common.back')}
              </Button>
              <Button
                type='submit'
                variant='destructive'
                disabled={isLoading}
                className='gap-2'
              >
                {isLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <AlertTriangle className='h-4 w-4' />
                )}
                {t('cancelDialog.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
