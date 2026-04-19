'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AgentEngagement, CreateReviewPayload } from '@/entities/agent-engagement';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StarRatingInput } from './star-rating-input';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { getInitials } from '../lib/utils';

const reviewSchema = z.object({
  rating: z
    .number({ required_error: 'Vui lòng chọn số sao' })
    .min(1, 'Vui lòng chọn ít nhất 1 sao')
    .max(5),
  comment: z.string().max(1000, 'Nhận xét không được vượt quá 1000 ký tự').optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentEngagement;
  onSubmit: (payload: Omit<CreateReviewPayload, 'engagement_id'>) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function ReviewModal({
  open,
  onOpenChange,
  agent,
  onSubmit,
  onSkip,
  isLoading = false,
}: ReviewModalProps) {
  const t = useTranslations('AgentEngagement');

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const rating = form.watch('rating');
  const comment = form.watch('comment') ?? '';

  useEffect(() => {
    if (!open) {
      form.reset({ rating: 0, comment: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      rating: data.rating,
      comment: data.comment || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px] p-0 overflow-hidden'>
        {/* Gradient header */}
        <div className='bg-gradient-to-br from-primary/5 to-primary/5 px-6 pt-6 pb-5 border-b border-primary/15'>
          <DialogHeader className='gap-0'>
            <DialogTitle className='sr-only'>{t('reviewModal.title')}</DialogTitle>
            <DialogDescription className='sr-only'>
              {t('reviewModal.description', { agentName: agent.agent_full_name })}
            </DialogDescription>
          </DialogHeader>

          {/* Agent profile summary */}
          <div className='flex flex-col items-center gap-3'>
            <Avatar className='h-16 w-16 border-2 border-white shadow-md ring-2 ring-primary/20'>
              <AvatarImage
                src={agent.agent_avatar_url ?? undefined}
                alt={agent.agent_full_name}
              />
              <AvatarFallback className='bg-primary/15 text-primary font-bold text-lg'>
                {getInitials(agent.agent_full_name)}
              </AvatarFallback>
            </Avatar>
            <div className='text-center'>
              <h3 className='font-bold text-gray-900 text-base'>
                {agent.agent_full_name}
              </h3>
              <p className='text-xs text-gray-500 mt-0.5'>
                {agent.engagement_type}
                {agent.property_address && (
                  <> · <span className='truncate'>{agent.property_address}</span></>
                )}
              </p>
            </div>

            {/* Stars input - prominent */}
            <Form {...form}>
              <form onSubmit={handleSubmit} id='review-form'>
                <Controller
                  control={form.control}
                  name='rating'
                  render={({ field, fieldState }) => (
                    <div className='flex flex-col items-center gap-1'>
                      <StarRatingInput
                        value={field.value}
                        onChange={field.onChange}
                        size='lg'
                      />
                      {fieldState.error && (
                        <p className='text-xs text-destructive mt-1'>
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        {/* Body */}
        <div className='px-6 py-5'>
          <Form {...form}>
            <form onSubmit={handleSubmit} id='review-form'>
              <FormField
                control={form.control}
                name='comment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      {t('reviewModal.commentLabel')}
                      <span className='text-gray-400 font-normal ml-1'>
                        ({t('reviewModal.optional')})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('reviewModal.commentPlaceholder')}
                        className='min-h-[100px] resize-none'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className='flex justify-between items-center'>
                      <FormMessage />
                      <span className='text-xs text-gray-400 ml-auto'>
                        {comment.length}/1000
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
            onClick={onSkip}
            disabled={isLoading}
            className='text-gray-500 hover:text-gray-700'
          >
            {t('reviewModal.skip')}
          </Button>
          <Button
            type='submit'
            form='review-form'
            disabled={isLoading || rating === 0}
            className='bg-primary hover:bg-primary/90 text-white gap-2 flex-1'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <MessageSquarePlus className='h-4 w-4' />
            )}
            {t('reviewModal.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
