'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { userApi } from '@/entities/user/api';
import { getErrorMessage, isHttpError } from '@/features/auth/ui/register-form/register-form.utils';

/** Same constraints as backend ForgotPasswordRequest (aligned with register email). */
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format').max(255, 'Email must not exceed 255 characters'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      const res = await userApi.forgotPassword({ email: data.email.trim() });
      const msg = (res.payload as { message?: string })?.message;
      toast.success(msg || t('forgotPasswordSuccessToast'));
    } catch (error) {
      if (isHttpError(error) && error.status === 429) {
        toast.error(t('forgotPasswordRateLimited'));
        return;
      }
      const code = getErrorMessage(error, 'errorDefault');
      if (code === 'TOO_MANY_REQUESTS') {
        toast.error(t('forgotPasswordRateLimited'));
        return;
      }
      toast.error(t('forgotPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        <Label htmlFor='forgot-email'>{t('email')}</Label>
        <Input
          id='forgot-email'
          type='email'
          autoComplete='email'
          placeholder={t('emailPlaceholder')}
          disabled={isLoading}
          className='h-11 rounded-lg border-border'
          {...register('email')}
        />
        {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
      </div>

      <Button
        type='submit'
        className='h-11 w-full rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-hover'
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            {t('forgotPasswordSending')}
          </>
        ) : (
          t('forgotPasswordSubmit')
        )}
      </Button>
    </form>
  );
}
