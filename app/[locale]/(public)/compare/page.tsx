import { Suspense } from 'react';
import { CompareListingsPage } from '@/screens/compare';

function CompareFallback() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-white'>
      <div className='h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent' />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareListingsPage />
    </Suspense>
  );
}
