'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { OwnerPropertySummary } from '@/entities/property';
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
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { MapPin, Home, Loader2, SendHorizonal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

const proposalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),
  offered_commission: z
    .string()
    .min(1, 'Commission is required')
    .max(100, 'Commission cannot exceed 100 characters'),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface SubmitProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: OwnerPropertySummary;
  onSubmit: (values: ProposalFormValues) => void;
  isLoading?: boolean;
}

export function SubmitProposalModal({
  open,
  onOpenChange,
  property,
  onSubmit,
  isLoading = false,
}: SubmitProposalModalProps) {
  const t = useTranslations('OwnerProperties');

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { title: '', message: '', offered_commission: '' },
  });

  const message = form.watch('message') ?? '';

  useEffect(() => {
    if (!open) {
      form.reset({ title: '', message: '', offered_commission: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(onSubmit);

  const location = [
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] p-0 overflow-hidden'>
        {/* Gradient header */}
        <div className='bg-gradient-to-br from-primary/5 to-primary/5 px-6 pt-6 pb-5 border-b border-primary/15'>
          <DialogHeader className='gap-0'>
            <DialogTitle className='sr-only'>{t('proposalModal.title')}</DialogTitle>
            <DialogDescription className='sr-only'>
              {t('proposalModal.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Property summary */}
          <div className='flex items-start gap-4'>
            <div className='h-14 w-14 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0'>
              <Home className='h-7 w-7 text-primary500' />
            </div>
            <div className='min-w-0'>
              <h3 className='font-bold text-gray-900 text-base leading-tight truncate'>
                {property.street_address}
              </h3>
              {location && (
                <div className='flex items-center gap-1 mt-1'>
                  <MapPin className='h-3.5 w-3.5 text-primary400 flex-shrink-0' />
                  <span className='text-sm text-gray-500 truncate'>{location}</span>
                </div>
              )}
              {property.property_type_info?.property_type_name && (
                <span className='inline-block mt-1.5 text-xs bg-indigo-100 text-primary700 px-2.5 py-0.5 rounded-lg font-semibold'>
                  {property.property_type_info.property_type_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className='px-6 py-5'>
          <Form {...form}>
            <form onSubmit={handleSubmit} id='proposal-form' className='space-y-4'>
              {/* Title */}
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      {t('proposalModal.titleLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('proposalModal.titlePlaceholder')}
                        className='rounded-xl'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission */}
              <FormField
                control={form.control}
                name='offered_commission'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      {t('proposalModal.commissionLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('proposalModal.commissionPlaceholder')}
                        className='rounded-xl'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      {t('proposalModal.messageLabel')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('proposalModal.messagePlaceholder')}
                        className='min-h-[120px] resize-none rounded-xl'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className='flex justify-between items-center'>
                      <FormMessage />
                      <span className='text-xs text-gray-400 ml-auto'>
                        {message.length}/1000
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className='px-6 pb-6 pt-0 gap-2'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='text-gray-500 hover:text-gray-700'
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            form='proposal-form'
            disabled={isLoading}
            className='bg-primary hover:bg-primary/90 text-white gap-2 flex-1'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <SendHorizonal className='h-4 w-4' />
            )}
            {t('proposalModal.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
