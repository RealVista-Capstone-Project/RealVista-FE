'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RegisterForm } from './register-form/register-form';

type Role = 'CUSTOMER' | 'AGENT';

export function RegisterPageClient() {
  const t = useTranslations('Auth');
  const [role, setRole] = useState<Role>('CUSTOMER');

  return (
    <>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-main-black'>
          {t('createAccount')}
        </h1>
        <p className='mt-1.5 text-sm text-grey-500'>{t('registerSubtitle')}</p>
      </div>

      {/* Register Form */}
      <RegisterForm role={role} onRoleChange={setRole} />
    </>
  );
}
