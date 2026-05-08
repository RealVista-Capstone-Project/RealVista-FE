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
  compact?: boolean;
}

/**
 * Displays the AI content verification status panel.
 * Shows loading spinner, verified badge, or policy violation alert.
 */
export function ContentVerificationStatusPanel({
  hasContent,
  status,
  labels,
  compact = false,
}: ContentVerificationStatusProps) {
  if (!hasContent) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className='flex items-center gap-2'>
        <span className={cn('font-semibold text-foreground', compact ? 'text-xs' : 'text-sm')}>
          {labels.title}
        </span>
        {status.isLoading && (
          <Loader2 className={cn('animate-spin text-primary', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        )}
        {!status.isLoading && status.result?.isValid && (
          <span className={cn('flex items-center gap-1 font-semibold text-emerald-600', compact ? 'text-xs' : 'text-sm')}>
            <CheckCircle2 className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} /> {labels.verified}
          </span>
        )}
        {!status.isLoading && status.result && !status.result.isValid && (
          <span className={cn('flex items-center gap-1 font-semibold text-red-600', compact ? 'text-xs' : 'text-sm')}>
            <AlertCircle className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} /> {labels.violated}
          </span>
        )}
      </div>
      {!status.isLoading && status.result && (
        <p
          className={cn(
            compact ? 'text-xs' : 'text-sm',
            status.result.isValid ? 'text-secondary' : 'text-red-500 font-medium'
          )}
        >
          {status.result.feedback}
        </p>
      )}
    </div>
  );
}
