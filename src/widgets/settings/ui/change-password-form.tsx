'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { userApi } from '@/entities/user/api';
import { passwordFieldSchema } from '@/features/auth/ui/register-form/register-form.schema';
import { PASSWORD_RULES, getStrength } from '@/features/auth/ui/register-form/register-form.constants';
import { CheckIcon, CrossIcon, EyeIcon } from '@/features/auth/ui/register-form/register-form.icons';
import { isHttpError } from '@/features/auth/ui/register-form/register-form.utils';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';

type ChangePasswordFormProps = {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordForm({ userId, onSuccess, onCancel }: ChangePasswordFormProps) {
  const tSettings = useTranslations('Settings');
  const tAuth = useTranslations('Auth');
  const tRoot = useTranslations();

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, tSettings('myAccount.currentPasswordRequired')),
          newPassword: passwordFieldSchema,
          confirmPassword: z.string().min(1, tSettings('myAccount.confirmPasswordRequired')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: tSettings('myAccount.passwordMismatch'),
          path: ['confirmPassword'],
        })
        .refine((data) => data.newPassword !== data.currentPassword, {
          message: tSettings('myAccount.newPasswordMustDiffer'),
          path: ['newPassword'],
        }),
    [tSettings]
  );

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = useWatch({ control, name: 'newPassword' }) ?? '';
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(newPasswordValue) })),
    [newPasswordValue]
  );
  const strength = getStrength(ruleResults.filter((r) => r.passed).length);
  const translatedStrengthLabel = tAuth(`strength${strength.level}` as 'strength0');

  const ruleMessageKey: Record<string, 'ruleLength' | 'ruleUpper' | 'ruleLower' | 'ruleNumber' | 'ruleSpecial'> = {
    length: 'ruleLength',
    upper: 'ruleUpper',
    lower: 'ruleLower',
    number: 'ruleNumber',
    special: 'ruleSpecial',
  };

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      userApi.changePassword(userId, data),
    onSuccess: () => {
      reset();
      toast.success(tSettings('toast.passwordChanged'));
      onSuccess();
    },
    onError: (error: unknown) => {
      if (isHttpError(error) && error.payload?.error_code === 'ERROR_INVALID_CURRENT_PASSWORD') {
        setError('currentPassword', {
          type: 'server',
          message: tRoot('Common.errors.invalidCurrentPassword'),
        });
        return;
      }
      handleErrorApi({ error, t: tRoot });
    },
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    changePasswordMutation.mutate({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
  };

  const inputClass =
    'flex h-9 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mt-2 space-y-3 rounded-lg border border-border p-4'>
      <div className='space-y-1.5'>
        <Label className='text-sm text-muted-foreground' htmlFor='settings-current-password'>
          {tSettings('myAccount.currentPassword')}
        </Label>
        <div className='relative'>
          <Input
            id='settings-current-password'
            type={showCurrent ? 'text' : 'password'}
            autoComplete='current-password'
            disabled={changePasswordMutation.isPending}
            placeholder={tSettings('myAccount.currentPasswordPlaceholder')}
            className={`${inputClass} pr-10`}
            {...register('currentPassword')}
          />
          <button
            type='button'
            onClick={() => setShowCurrent((v) => !v)}
            className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors'
            aria-label={showCurrent ? tAuth('hidePassword') : tAuth('showPassword')}
          >
            <EyeIcon open={showCurrent} />
          </button>
        </div>
        {errors.currentPassword && (
          <p className='text-xs text-red-500' role='alert'>
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className='space-y-1.5'>
        <Label className='text-sm text-muted-foreground' htmlFor='settings-new-password'>
          {tSettings('myAccount.newPassword')}
        </Label>
        <div className='relative'>
          <Input
            id='settings-new-password'
            type={showNew ? 'text' : 'password'}
            autoComplete='new-password'
            disabled={changePasswordMutation.isPending}
            placeholder={tSettings('myAccount.newPasswordPlaceholder')}
            className={`${inputClass} pr-10`}
            {...register('newPassword')}
          />
          <button
            type='button'
            onClick={() => setShowNew((v) => !v)}
            className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors'
            aria-label={showNew ? tAuth('hidePassword') : tAuth('showPassword')}
          >
            <EyeIcon open={showNew} />
          </button>
        </div>
        {errors.newPassword && (
          <p className='text-xs text-red-500' role='alert'>
            {errors.newPassword.message}
          </p>
        )}
        {newPasswordValue.length > 0 && (
          <div className='mt-1.5 space-y-1'>
            <div className='flex gap-1' aria-label={tAuth('passwordStrength', { label: translatedStrengthLabel })}>
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
              {tAuth('strengthLabel', { label: translatedStrengthLabel })}
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
                {tAuth(ruleMessageKey[rule.id])}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-1.5'>
        <Label className='text-sm text-muted-foreground' htmlFor='settings-confirm-password'>
          {tSettings('myAccount.confirmPassword')}
        </Label>
        <div className='relative'>
          <Input
            id='settings-confirm-password'
            type={showConfirm ? 'text' : 'password'}
            autoComplete='new-password'
            disabled={changePasswordMutation.isPending}
            placeholder={tSettings('myAccount.confirmPasswordPlaceholder')}
            className={`${inputClass} pr-10`}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            onClick={() => setShowConfirm((v) => !v)}
            className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors'
            aria-label={showConfirm ? tAuth('hidePassword') : tAuth('showPassword')}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-red-500' role='alert'>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className='flex justify-end gap-2 pt-1'>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => {
            reset();
            onCancel();
          }}
          disabled={changePasswordMutation.isPending}
        >
          {tSettings('myAccount.cancel')}
        </Button>
        <Button
          type='submit'
          size='sm'
          disabled={changePasswordMutation.isPending}
          className='bg-primary text-white hover:bg-primary/90'
        >
          {changePasswordMutation.isPending ? tSettings('myAccount.saving') : tSettings('myAccount.confirm')}
        </Button>
      </div>
    </form>
  );
}
