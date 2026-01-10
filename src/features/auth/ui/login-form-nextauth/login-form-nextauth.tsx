'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
export function LoginFormNextAuth() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
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
        const errorMessage = mapAuthError(result.error);
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (result?.ok) {
        // Success! Show toast and redirect
        toast.success('Login successful!');

        // Redirect to dashboard with locale
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      // Unexpected error
      const errorMessage = 'Login failed. Please try again.';
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
      <div className='space-y-2'>
        <Label htmlFor='email'>{t('email')}</Label>
        <Input
          id='email'
          type='email'
          placeholder='john@example.com'
          disabled={isLoading}
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>{t('password')}</Label>
        <Input
          id='password'
          type='password'
          disabled={isLoading}
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
      </div>

      {error && <p className='text-sm text-red-500'>{error}</p>}

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? 'Logging in...' : t('login')}
      </Button>
    </form>
  );
}
