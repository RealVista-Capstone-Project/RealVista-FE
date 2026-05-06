'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RegisterForm } from './register-form/register-form';
import { GoogleLoginButton } from './google-login-button';

type Role = 'CUSTOMER' | 'AGENT';

export function RegisterPageClient() {
  const t = useTranslations('Auth');
  const [role, setRole] = useState<Role>('CUSTOMER');

  return (
    <>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
          {t('createAccount')}
        </h1>
        <p className='mt-1.5 text-sm text-muted-foreground'>{t('registerSubtitle')}</p>
      </div>

      {/* Register Form */}
      <div className='space-y-5'>
        <RegisterForm role={role} onRoleChange={setRole} />

        {role !== 'AGENT' && (
          <>
            {/* Visual Separator */}
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-white px-4 text-muted-foreground'>{t('continueWith')}</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <GoogleLoginButton />
          </>
        )}
      </div>
    </>
  );
}
