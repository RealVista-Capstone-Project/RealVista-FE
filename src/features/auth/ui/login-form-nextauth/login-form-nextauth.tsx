'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { getRedirectPathByRole } from '@/shared/lib/auth/rbac';
import type { UserRole } from '@/shared/lib/auth/rbac';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';

type LoginFormData = {
  identifier: string;
  password: string;
};

// TODO: Handle only BackendRole
export function LoginFormNextAuth() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    const isEmail = data.identifier.includes('@');
    const credentials = isEmail
      ? { email: data.identifier, password: data.password }
      : { phone: data.identifier, password: data.password };

    try {
      const result = await signIn('credentials', { ...credentials, redirect: false });

      if (result?.error) {
        const errorCode = typeof result.error === 'string' ? result.error : 'Default';
        const errorMessage = mapAuthError(errorCode);
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (result?.ok) {
        toast.success(t('loginSuccess'));

        const session = await getSession();
        const role = session?.user?.role as UserRole | undefined;

        const rawRedirectTo = searchParams.get('redirectTo');
        const redirectPath =
          rawRedirectTo?.startsWith('/') && !rawRedirectTo.startsWith('//')
            ? `/${locale}${rawRedirectTo}`
            : `/${locale}${getRedirectPathByRole(role)}`;

        router.push(redirectPath);
      }
    } catch {
      const errorMessage = t('loginFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  function mapAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      CredentialsSignin: 'Invalid email/phone or password',
      InvalidCredentials: 'Invalid email/phone or password',
      AccessDenied: 'Access denied',
      Configuration: 'Server configuration error',
      Default: 'An error occurred. Please try again.',
    };

    return errorMap[error] || errorMap.Default;
  }

  const inputClass =
    'h-11 rounded-lg border-purple-92 bg-purple-98 px-4 text-main-black placeholder:text-grey-400 focus:border-main-primary focus:bg-white focus:ring-main-primary';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor='identifier' className='text-sm font-medium text-main-black'>
          {t('emailOrPhone')}
        </Label>
        <Input
          id='identifier'
          type='text'
          placeholder={t('emailOrPhonePlaceholder')}
          disabled={isLoading}
          className={inputClass}
          {...register('identifier', { required: t('emailOrPhoneRequired') })}
        />
        {errors.identifier && <p className='text-sm text-red-500'>{errors.identifier.message}</p>}
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='password' className='text-sm font-medium text-main-black'>
          {t('password')}
        </Label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder='Enter password'
            disabled={isLoading}
            className={cn(inputClass, 'pr-10')}
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type='button'
            onClick={() => setShowPassword((prev) => !prev)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-grey-400 hover:text-grey-600 focus:outline-none'
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
      </div>

      <div className='flex justify-end'>
        <Link
          href='/forgot-password'
          className='text-sm font-semibold text-main-primary hover:text-main-primary-hover transition-colors'
        >
          {t('forgotPassword')}
        </Link>
      </div>

      {error && (
        <div className='rounded-lg bg-red-50 p-3'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <Button
        type='submit'
        className='h-11 w-full rounded-lg bg-main-primary text-base font-semibold text-white hover:bg-main-primary-hover focus:ring-4 focus:ring-purple-92'
        disabled={isLoading}
      >
        {isLoading ? t('loggingIn') : t('login')}
      </Button>
    </form>
  );
}
