'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { useContactForm } from '../model/use-contact-form';
import type { ContactFormData, UserContactInfo, ChatListingData } from '@/entities/contact';

interface ContactModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback to close the modal
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Listing information for the contact request
   */
  listing: ChatListingData;
  /**
   * Pre-fill form with user's contact info
   */
  userInfo?: UserContactInfo;
  /**
   * Optional agent/owner name being contacted
   */
  agentName?: string;
  /**
   * Callback when message is sent successfully
   */
  onSend?: (data: ContactFormData) => void | Promise<void>;
}

/**
 * ContactModal component
 * Modal dialog for contacting listing agent/owner with pre-filled user info
 */
export function ContactModal({
  open,
  onOpenChange,
  listing,
  userInfo,
  agentName,
  onSend,
}: ContactModalProps) {
  const t = useTranslations('Contact');
  const [isSent, setIsSent] = useState(false);

  const { form, handleSubmit, isSubmitting } = useContactForm({
    listingId: listing.id,
    userInfo,
    onSubmit: async (data) => {
      await onSend?.(data);
      setIsSent(true);
      // Reset sent state after 2 seconds
      setTimeout(() => {
        setIsSent(false);
        onOpenChange(false);
      }, 2000);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {agentName ? t('descriptionWithAgent', { agent: agentName }) : t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Listing Preview */}
        <div className='flex gap-3 rounded-lg border border-border bg-muted/30 p-3'>
          <img
            src={listing.image}
            alt={listing.title}
            className='h-16 w-20 rounded-md object-cover'
          />
          <div className='flex flex-col justify-center gap-1'>
            <p className='line-clamp-1 text-sm font-medium text-main-black'>{listing.title}</p>
            <p className='text-base font-bold text-main-primary'>{formatVND(listing.price)}</p>
          </div>
        </div>

        {/* Contact Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {/* Full Name */}
            <FormField
              control={form.control}
              name='fullName'
              rules={{ required: t('validation.fullNameRequired') }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('fullNamePlaceholder')}
                      className={cn(userInfo?.fullName && 'bg-muted')}
                      disabled={!!userInfo?.fullName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name='email'
              rules={{
                required: t('validation.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('validation.emailInvalid'),
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      placeholder={t('emailPlaceholder')}
                      className={cn(userInfo?.email && 'bg-muted')}
                      disabled={!!userInfo?.email}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name='phone'
              rules={{ required: t('validation.phoneRequired') }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='tel'
                      placeholder={t('phonePlaceholder')}
                      className={cn(userInfo?.phone && 'bg-muted')}
                      disabled={!!userInfo?.phone}
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
              rules={{
                required: t('validation.messageRequired'),
                minLength: {
                  value: 10,
                  message: t('validation.messageMinLength'),
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('message')}</FormLabel>
                  <div className='mb-2 flex flex-col gap-2'>
                    <span className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70'>
                      {t('suggestedInquiries')}
                    </span>
                    <div className='no-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-1'>
                      {t.raw('quickReplies').map((reply: string, index: number) => (
                        <Button
                          key={index}
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-auto shrink-0 rounded-full border-border bg-background px-3 py-1.5 text-xs font-normal text-muted-foreground transition-all hover:border-main-primary hover:bg-main-primary/5 hover:text-main-primary'
                          onClick={() => form.setValue('message', reply, { shouldValidate: true })}
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('messagePlaceholder')}
                      className='min-h-[120px] resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type='submit' className='w-full' disabled={isSubmitting || isSent}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('sending')}
                </>
              ) : isSent ? (
                t('sent')
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  {t('send')}
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
