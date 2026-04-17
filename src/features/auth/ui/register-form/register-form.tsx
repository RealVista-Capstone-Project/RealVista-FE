'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRegister } from '@/features/auth/api/use-register';

import { registerSchema, type RegisterFormValues } from './register-form.schema';
import { PASSWORD_RULES, getStrength } from './register-form.constants';
import { getErrorMessage } from './register-form.utils';
import { EyeIcon, CheckIcon, CrossIcon } from './register-form.icons';

type Role = 'CUSTOMER' | 'AGENT';

export function RegisterForm({ role, onRoleChange }: { role: Role; onRoleChange: (role: Role) => void }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutateAsync: registerUser, isPending: isLoading } = useRegister();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';
  const confirmValue = useWatch({ control, name: 'confirmPassword' }) ?? '';

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(passwordValue) })),
    [passwordValue]
  );

  const strength = getStrength(ruleResults.filter((r) => r.passed).length);
  const translatedStrengthLabel = t(`strength${strength.level}` as any);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        password: data.password,
        role,
      });
      toast.success(t('registerSuccess'));
      router.push(`/${locale}/login`);
    } catch (error) {
      const errorMsg = getErrorMessage(error);

      // Mapping backend error codes to i18n keys
      const errorKeyMap: Record<string, string> = {
        'EMAIL_ALREADY_EXISTS': 'emailAlreadyExists',
        'PHONE_NUMBER_ALREADY_EXISTS': 'phoneAlreadyExists',
        'ROLE_NOT_FOUND': 'roleNotFound',
      };

      const finalKey = errorKeyMap[errorMsg] || 'registerFailed';
      toast.error(t(finalKey));
    }
  };

  const passwordsMatch = passwordValue === confirmValue;

  return (
    <div className='space-y-4'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-2.5' noValidate>
        {/* ── Name ────────────────────────────────────────────────── */}
        <div className='grid grid-cols-2 gap-2.5'>
          <div>
            <Input id='firstName' placeholder={t('firstNamePlaceholder')} disabled={isLoading} aria-label={t('firstName')} aria-invalid={!!errors.firstName} className='h-9 border-primary/20 bg-primary/5' {...register('firstName')} />
            {errors.firstName && <p role='alert' className='mt-1 text-xs text-red-500'>{errors.firstName.message}</p>}
          </div>
          <div>
            <Input id='lastName' placeholder={t('lastNamePlaceholder')} disabled={isLoading} aria-label={t('lastName')} aria-invalid={!!errors.lastName} className='h-9 border-primary/20 bg-primary/5' {...register('lastName')} />
            {errors.lastName && <p role='alert' className='mt-1 text-xs text-red-500'>{errors.lastName.message}</p>}
          </div>
        </div>

        {/* ── Email ───────────────────────────────────────────────── */}
        <div>
          <Input id='email' type='email' placeholder={t('emailPlaceholder')} disabled={isLoading} aria-label={t('email')} aria-invalid={!!errors.email} autoComplete='email' className='h-9 border-primary/20 bg-primary/5' {...register('email')} />
          {errors.email && <p role='alert' className='mt-1 text-xs text-red-500'>{errors.email.message}</p>}
        </div>

        {/* ── Phone ───────────────────────────────────────────────── */}
        <div>
          <Input id='phoneNumber' placeholder={t('phonePlaceholder')} inputMode='tel' disabled={isLoading} aria-label={t('phoneNumber')} aria-invalid={!!errors.phoneNumber} autoComplete='tel' className='h-9 border-primary/20 bg-primary/5' {...register('phoneNumber')} />
          {errors.phoneNumber && <p role='alert' className='mt-1 text-xs text-red-500'>{errors.phoneNumber.message}</p>}
        </div>

        {/* ── Password ────────────────────────────────────────────── */}
        <div>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              disabled={isLoading}
              aria-label={t('password')}
              aria-invalid={!!errors.password}
              autoComplete='new-password'
              className='h-9 pr-10 border-primary/20 bg-primary/5'
              {...register('password')}
            />
            <button
              type='button'
              onClick={() => setShowPassword((v) => !v)}
              className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors'
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {passwordValue.length > 0 && (
            <div className='mt-1.5 space-y-1'>
              <div
                className='flex gap-1'
                role='meter'
                aria-valuenow={strength.level}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-label={t('passwordStrength', { label: translatedStrengthLabel })}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className={`text-xs font-medium ${strength.level <= 1 ? 'text-red-500' : strength.level === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                {t('strengthLabel', { label: translatedStrengthLabel })}
              </p>
            </div>
          )}
          {errors.password && <p role='alert' className='mt-1 text-xs text-red-500'>{errors.password.message}</p>}
        </div>

        {/* ── Confirm Password ─────────────────────────────────────── */}
        <div>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('confirmPlaceholder')}
              disabled={isLoading}
              aria-label={t('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
              autoComplete='new-password'
              className='h-9 pr-10 border-primary/20 bg-primary/5'
              {...register('confirmPassword')}
            />
            <button
              type='button'
              onClick={() => setShowConfirm((v) => !v)}
              className='absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors'
              aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {confirmValue.length > 0 && passwordValue.length > 0 && (
            <p className={`mt-1 flex items-center gap-1.5 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`} role='status'>
              {passwordsMatch ? <><CheckIcon /> {t('passwordsMatch')}</> : <><CrossIcon /> {t('passwordsDoNotMatch')}</>}
            </p>
          )}
          {errors.confirmPassword && confirmValue.length === 0 && (
            <p role='alert' className='mt-1 text-xs text-red-500'>{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* ── Agent Checkbox + Submit ─────────────────────────────── */}
        <div className='space-y-3'>
          <label className='group flex cursor-pointer items-center gap-3 pt-1'>
            <input
              type='checkbox'
              className='sr-only'
              checked={role === 'AGENT'}
              onChange={(e) => onRoleChange(e.target.checked ? 'AGENT' : 'CUSTOMER')}
            />
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-150 ${role === 'AGENT'
                  ? 'border-primary bg-primary'
                  : 'border-primary/20 bg-primary/5 group-hover:border-primary'
                }`}
            >
              {role === 'AGENT' && <Check className='h-3 w-3 text-white' strokeWidth={3} />}
            </div>
            <span className='text-sm font-normal text-foreground'>{t('agentCheckboxLabel')}</span>
          </label>

          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('signingUp')}
              </span>
            ) : (
              t('createAccount')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
