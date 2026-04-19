'use client';

import * as React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ContentVerificationStatus } from '@/shared/lib/hooks/use-content-verification';

interface ContentVerificationStatusProps {
  /** Whether the user has typed any name or content */
  hasContent: boolean;
  status: ContentVerificationStatus;
  labels: {
    title: string;
    verified: string;
    violated: string;
  };
}

/**
 * Displays the AI content verification status panel.
 * Shows loading spinner, verified badge, or policy violation alert.
 */
export function ContentVerificationStatusPanel({
  hasContent,
  status,
  labels,
}: ContentVerificationStatusProps) {
  if (!hasContent) return null;

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-semibold text-foreground'>{labels.title}</span>
        {status.isLoading && (
          <Loader2 className='h-4 w-4 animate-spin text-primary' />
        )}
        {!status.isLoading && status.result?.isValid && (
          <span className='flex items-center gap-1 text-xs font-semibold text-emerald-600'>
            <CheckCircle2 className='h-4 w-4' /> {labels.verified}
          </span>
        )}
        {!status.isLoading && status.result && !status.result.isValid && (
          <span className='flex items-center gap-1 text-xs font-semibold text-red-600'>
            <AlertCircle className='h-4 w-4' /> {labels.violated}
          </span>
        )}
      </div>
      {!status.isLoading && status.result && (
        <p
          className={cn(
            'text-xs',
            status.result.isValid ? 'text-secondary' : 'text-red-500 font-medium'
          )}
        >
          {status.result.feedback}
        </p>
      )}
    </div>
  );
}
