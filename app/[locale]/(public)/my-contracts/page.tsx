'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/auth/model';
import { MyRentalContractsPage } from '@/screens/my-rental-contracts';
import { useLocale } from 'next-intl';
import { ROUTES } from '@/shared/config/routes';

export default function PublicMyContractsRoute() {
  const { data: session, status } = useAuthSession();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(`/${locale}${ROUTES.login}`);
      return;
    }

    const { role } = session.user;
    const backendRoles = session.user.backendRoles || [];

    // Redirect admins/moderators/owners to their dashboard equivalent
    if (role === 'admin' || role === 'moderator' || backendRoles.includes('OWNER') || backendRoles.includes('AGENT')) {
      router.push(`/${locale}${ROUTES.dashboard.myContracts}`);
    }
  }, [session, status, router, locale]);

  if (status === 'loading') {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-[3px] border-main-primary border-t-transparent' />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <MyRentalContractsPage />;
}
