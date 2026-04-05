import React from 'react';
import { PolicyDto } from '../api/policy.api';
import './policy.css';

interface Props {
  policy: PolicyDto;
}

export function PolicyContent({ policy }: Props) {
  const formattedDate = new Date(policy.updatedAt || new Date()).toLocaleDateString('vi-VN');

  return (
    <div className='bg-white rounded-lg shadow-sm p-6 md:p-10 border border-gray-200 min-h-screen'>
      <header className='mb-8 border-b border-gray-100 pb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>{policy.title}</h1>
        <p className='text-sm text-gray-500'>Last updated: {formattedDate}</p>
      </header>

      {/* Policy Content */}
      <div
        className='prose prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 policy-content-wrapper'
        dangerouslySetInnerHTML={{ __html: policy.content }}
      />
    </div>
  );
}
