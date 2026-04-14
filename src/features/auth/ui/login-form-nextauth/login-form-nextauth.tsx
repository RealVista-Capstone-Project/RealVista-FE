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

/**
 * LoginFormNextAuth Component
 *
 * NextAuth-powered login form that uses the Credentials provider.
 * Integrates with the backend API at /api/auth/signin/credentials.
 *
 * Features:
 * - Email/password validation
 * - NextAuth error handling with user-friendly messages
 * - Toast notifications for success/error
 * - Loading state during authentication
 * - Redirect to dashboard on success
 *
 * Usage:
 * ```tsx
 * import { LoginFormNextAuth } from '@/features/auth/ui';
 *
 * export default function LoginPage() {
 *   return <LoginFormNextAuth />;
 * }
 * ```
 */

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
  } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      // Call NextAuth signIn with Credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        // Map NextAuth error codes to user-friendly messages
        // result.error can be string | undefined, validate it first
        const errorCode = typeof result.error === 'string' ? result.error : 'Default';
        const errorMessage = mapAuthError(errorCode);
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (result?.ok) {
        // Success! Show toast and redirect based on role
        toast.success(t('loginSuccess'));

        // Fetch the session to get the user's role for redirect
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
      // Unexpected error
      const errorMessage = t('loginFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maps NextAuth error codes to user-friendly messages
   *
   * NextAuth error codes:
   * - CredentialsSignin: Invalid credentials
   * - InvalidCredentials: Invalid credentials
   * - Default: Generic error
   *
   * @param error - Error code from NextAuth
   * @returns User-friendly error message
   */
  function mapAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      CredentialsSignin: 'Invalid email or password',
      InvalidCredentials: 'Invalid email or password',
      AccessDenied: 'Access denied',
      Configuration: 'Server configuration error',
      Default: 'An error occurred. Please try again.',
    };

    return errorMap[error] || errorMap.Default;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor='email' className='text-sm font-medium text-main-black'>
          {t('email')}
        </Label>
        <Input
          id='email'
          type='email'
          placeholder='hi@example.com'
          disabled={isLoading}
          className='h-11 rounded-lg border-purple-92 bg-purple-98 px-4 text-main-black placeholder:text-grey-400 focus:border-main-primary focus:bg-white focus:ring-main-primary'
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
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
            className='h-11 rounded-lg border-purple-92 bg-purple-98 px-4 pr-10 text-main-black placeholder:text-grey-400 focus:border-main-primary focus:bg-white focus:ring-main-primary'
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

      {/* Forgot Password Link */}
      <div className='flex justify-end'>
        <Link href='/forgot-password' className='text-sm font-semibold text-main-primary hover:text-main-primary-hover transition-colors'>
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
