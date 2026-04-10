'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useRegister } from '@/features/auth/api/use-register';

import { registerSchema, type RegisterFormValues } from './register-form.schema';
import { PASSWORD_RULES, getStrength } from './register-form.constants';
import { getErrorMessage } from './register-form.utils';
import { EyeIcon, RuleIcon, CheckIcon, CrossIcon } from './register-form.icons';

type Role = 'CUSTOMER' | 'AGENT';

export function RegisterForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const [role, setRole] = useState<Role>('CUSTOMER');
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
    <div className='space-y-6'>
      {/* ── Role selector ──────────────────────────────────────────── */}
      <div className='space-y-2 text-center'>
        <p className='text-sm font-medium text-muted-foreground'>{t('roleSelector')}</p>
        <div className='mx-auto flex max-w-xs rounded-xl border bg-muted p-1' role='group' aria-label='Chọn vai trò'>
          {(['CUSTOMER', 'AGENT'] as Role[]).map((r) => (
            <button
              key={r}
              type='button'
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                role === r ? 'bg-white shadow-sm text-primary dark:bg-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'CUSTOMER' ? t('customerRole') : t('agentRole')}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
        {/* ── Name ────────────────────────────────────────────────── */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='firstName'>{t('firstName')}</Label>
            <Input id='firstName' placeholder={t('firstNamePlaceholder')} disabled={isLoading} aria-invalid={!!errors.firstName} {...register('firstName')} />
            {errors.firstName && <p role='alert' className='text-xs text-red-500'>{errors.firstName.message}</p>}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='lastName'>{t('lastName')}</Label>
            <Input id='lastName' placeholder={t('lastNamePlaceholder')} disabled={isLoading} aria-invalid={!!errors.lastName} {...register('lastName')} />
            {errors.lastName && <p role='alert' className='text-xs text-red-500'>{errors.lastName.message}</p>}
          </div>
        </div>

        {/* ── Email ───────────────────────────────────────────────── */}
        <div className='space-y-1.5'>
          <Label htmlFor='email'>{t('email')}</Label>
          <Input id='email' type='email' placeholder={t('emailPlaceholder')} disabled={isLoading} aria-invalid={!!errors.email} autoComplete='email' {...register('email')} />
          {errors.email && <p role='alert' className='text-xs text-red-500'>{errors.email.message}</p>}
        </div>

        {/* ── Phone ───────────────────────────────────────────────── */}
        <div className='space-y-1.5'>
          <Label htmlFor='phoneNumber'>{t('phoneNumber')}</Label>
          <Input id='phoneNumber' placeholder={t('phonePlaceholder')} inputMode='tel' disabled={isLoading} aria-invalid={!!errors.phoneNumber} autoComplete='tel' {...register('phoneNumber')} />
          {errors.phoneNumber && <p role='alert' className='text-xs text-red-500'>{errors.phoneNumber.message}</p>}
        </div>

        {/* ── Password ────────────────────────────────────────────── */}
        <div className='space-y-1.5'>
          <Label htmlFor='password'>{t('password')}</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              autoComplete='new-password'
              className='pr-10'
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
            <div className='space-y-2 pt-1'>
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
              <ul className='space-y-1'>
                {ruleResults.map((rule) => {
                  const ruleKey = `rule${rule.id.charAt(0).toUpperCase() + rule.id.slice(1)}` as any;
                  return (
                    <li key={rule.id} className='flex items-center gap-2'>
                      <RuleIcon passed={rule.passed} />
                      <span className={`text-xs ${rule.passed ? 'text-green-600' : 'text-muted-foreground'}`}>{t(ruleKey)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {errors.password && <p role='alert' className='text-xs text-red-500'>{errors.password.message}</p>}
        </div>

        {/* ── Confirm Password ─────────────────────────────────────── */}
        <div className='space-y-1.5'>
          <Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('confirmPlaceholder')}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              autoComplete='new-password'
              className='pr-10'
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
            <p className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`} role='status'>
              {passwordsMatch ? <><CheckIcon /> {t('passwordsMatch')}</> : <><CrossIcon /> {t('passwordsDoNotMatch')}</>}
            </p>
          )}

          {errors.confirmPassword && confirmValue.length === 0 && (
            <p role='alert' className='text-xs text-red-500'>{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────────────── */}
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
      </form>
    </div>
  );
}
