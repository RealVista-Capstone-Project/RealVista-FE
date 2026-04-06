import { Suspense } from 'react';
import { LeaseSigningCompletePage } from '@/screens/lease-signing-complete';

export default function LeaseSigningCompleteRoute() {
  return (
    <Suspense>
      <LeaseSigningCompletePage />
    </Suspense>
  );
}
