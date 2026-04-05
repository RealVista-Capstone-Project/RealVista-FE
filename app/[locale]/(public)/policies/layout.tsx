import React from 'react';
import { PolicyAPI } from '@/features/policy/api/policy.api';
import { PolicySidebar } from '@/features/policy/ui/policy-sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policies & Terms | RealVista',
  description: 'Read the policies, terms of service, and guidelines for RealVista.',
};

export default async function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const policies = await PolicyAPI.getAllPolicies();

  return (
    <div className='container mx-auto px-4 py-8 lg:px-8'>
      <div className='flex flex-col md:flex-row gap-8 items-start'>
        <PolicySidebar policies={policies || []} />
        <main className='flex-1 w-full max-w-full overflow-hidden'>{children}</main>
      </div>
    </div>
  );
}
