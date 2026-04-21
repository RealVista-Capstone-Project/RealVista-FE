'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { useAuthSession } from '@/features/auth/model';
import { useRenterContractsQuery } from '@/features/rental-contract/hooks/use-rental-contracts';
import {
  MyRentalContractsPage,
  TenantNoContractsCTA,
} from '@/screens/my-rental-contracts';
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

    // Redirect admins/moderators/owners/agents to their dashboard equivalent
    if (
      role === 'admin' ||
      role === 'moderator' ||
      backendRoles.includes('OWNER') ||
      backendRoles.includes('AGENT')
    ) {
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

  return <TenantMyContractsGate renterId={session.user.id} />;
}

/**
 * Probes the renter's contract count with a tiny request (size=1) and either
 * renders the full page or the CTA when the renter has zero contracts.
 *
 * The probe uses its own query key, so the full page will still fetch its own
 * paginated list when rendered — trade-off is one extra ~size=1 request, which
 * is cheap and lets us keep `MyRentalContractsPage` untouched.
 */
function TenantMyContractsGate({ renterId }: { renterId: string }) {
  const probe = useRenterContractsQuery(
    { renterId, page: 0, size: 1 },
    { enabled: Boolean(renterId) }
  );

  if (probe.isLoading) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-[3px] border-main-primary border-t-transparent' />
      </div>
    );
  }

  // On error, fall back to rendering the full page (safer than hiding it)
  const totalElements = probe.data?.payload.data.total_elements ?? null;

  if (!probe.isError && totalElements === 0) {
    return <TenantNoContractsCTA />;
  }

  return <MyRentalContractsPage />;
}
