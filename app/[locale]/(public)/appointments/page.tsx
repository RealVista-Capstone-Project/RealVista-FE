'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/auth/model';
import { PublicAppointmentsPage } from '@/features/appointments/components';
import { ROUTES } from '@/shared/config/routes';
import { useLocale } from 'next-intl';

export default function PublicAppointmentsRoute() {
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

    if (role === 'user') {
      return; // Allow access
    }

    if (role === 'owner' || role === 'moderator') {
      router.push(`/${locale}${ROUTES.dashboard.appointments}`);
    } else {
      router.push(`/${locale}/unauthorized`);
    }
  }, [session, status, router, locale]);

  if (status === 'loading') {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-main-primary border-t-transparent' />
      </div>
    );
  }

  // Only allow Buyer/Tenant (regular user role) to view this version
  if (!session || session.user.role !== 'user') {
    return null; // Redirection handled in useEffect
  }

  return <PublicAppointmentsPage />;
}
