'use client';

import React from 'react';
import { Link } from '@/shared/config/i18n/navigation';
import { usePathname } from 'next/navigation';
import { PolicyDto } from '../api/policy.api';

interface Props {
  policies: PolicyDto[];
}

export function PolicySidebar({ policies }: Props) {
  const pathname = usePathname();

  return (
    <aside className='w-full md:w-64 flex-shrink-0 bg-white shadow-sm rounded-lg p-4 border border-gray-200'>
      <h3 className='font-semibold text-gray-900 mb-4 px-3'>Policies & Terms</h3>
      <nav className='flex flex-col space-y-1'>
        {policies.map((policy) => {
          const href = `/policies/${policy.slug}`;
          const isActive = pathname?.includes(`/policies/${policy.slug}`);

          return (
            <Link
              key={policy.slug}
              href={href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {policy.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
