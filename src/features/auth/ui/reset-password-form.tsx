'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { userApi } from '@/entities/user/api';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@/features/auth/ui/register-form/register-form.schema';
import { PASSWORD_RULES, getStrength } from '@/features/auth/ui/register-form/register-form.constants';
import { getErrorMessage, isHttpError } from '@/features/auth/ui/register-form/register-form.utils';
import { EyeIcon, CheckIcon, CrossIcon } from '@/features/auth/ui/register-form/register-form.icons';

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(passwordValue) })),
    [passwordValue]
  );
  const strength = getStrength(ruleResults.filter((r) => r.passed).length);
  const translatedStrengthLabel = t(`strength${strength.level}` as 'strength0');

  const ruleMessageKey: Record<string, 'ruleLength' | 'ruleUpper' | 'ruleLower' | 'ruleNumber' | 'ruleSpecial'> = {
    length: 'ruleLength',
    upper: 'ruleUpper',
    lower: 'ruleLower',
    number: 'ruleNumber',
    special: 'ruleSpecial',
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await userApi.resetPassword({
        token,
        new_password: data.password,
      });
      toast.success(t('resetPasswordSuccessToast'));
      router.push('/login');
    } catch (error) {
      if (isHttpError(error) && error.status === 429) {
        toast.error(t('resetPasswordRateLimited'));
        return;
      }
      const code = getErrorMessage(error, 'errorDefault');
      if (code === 'ERROR_INVALID_OR_EXPIRED_RESET_TOKEN') {
        toast.error(t('resetTokenInvalid'));
        return;
      }
      if (code === 'TOO_MANY_REQUESTS') {
        toast.error(t('resetPasswordRateLimited'));
        return;
      }
      toast.error(t('resetPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'flex h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        <Label htmlFor='reset-password'>{t('password')}</Label>
        <div className='relative'>
          <Input
            id='reset-password'
            type={showPassword ? 'text' : 'password'}
            autoComplete='new-password'
            disabled={isLoading}
            className={`${inputClass} pr-10`}
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword((p) => !p)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-grey-400 hover:text-grey-600'
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
        {passwordValue.length > 0 && (
          <div className='mt-1.5 space-y-1'>
            <div className='flex gap-1' aria-label={t('passwordStrength', { label: translatedStrengthLabel })}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <p
              className={`text-xs font-medium ${strength.level <= 1 ? 'text-red-500' : strength.level === 2 ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {t('strengthLabel', { label: translatedStrengthLabel })}
            </p>
          </div>
        )}
        <ul className='space-y-1 text-xs'>
          {ruleResults.map((rule) => (
            <li key={rule.id} className='flex items-center gap-2'>
              <span className={rule.passed ? 'text-green-600' : 'text-muted-foreground'}>
                {rule.passed ? <CheckIcon /> : <CrossIcon />}
              </span>
              <span className={rule.passed ? 'text-green-700' : 'text-muted-foreground'}>
                {t(ruleMessageKey[rule.id])}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='reset-confirm'>{t('confirmPassword')}</Label>
        <div className='relative'>
          <Input
            id='reset-confirm'
            type={showConfirm ? 'text' : 'password'}
            autoComplete='new-password'
            disabled={isLoading}
            className={`${inputClass} pr-10`}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            onClick={() => setShowConfirm((p) => !p)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-grey-400 hover:text-grey-600'
            aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-sm text-red-500'>{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type='submit'
        className='h-11 w-full rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-hover'
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            {t('resetPasswordSubmitting')}
          </>
        ) : (
          t('resetPasswordSubmit')
        )}
      </Button>
    </form>
  );
}
