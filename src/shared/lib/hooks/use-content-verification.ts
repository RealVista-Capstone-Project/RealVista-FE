'use client';

import * as React from 'react';
import {
  aiAnalysisApi,
  type ListingVerificationResponse,
} from '@/entities/ai/api/ai-analysis.api';

export interface ContentVerificationStatus {
  isLoading: boolean;
  result: ListingVerificationResponse | null;
  error: string | null;
}

/**
 * Hook that performs debounced AI content verification on listing name and content.
 * Returns verification status and a derived `isContentValid` flag.
 *
 * @param name - The listing title to verify
 * @param content - The listing description/content to verify
 * @param debounceMs - Debounce delay in milliseconds (default 1500)
 */
export function useContentVerification(
  name: string,
  content: string,
  debounceMs = 1500
) {
  const [contentStatus, setContentStatus] = React.useState<ContentVerificationStatus>({
    isLoading: false,
    result: null,
    error: null,
  });

  const verifyListingContent = React.useCallback(async () => {
    if (!name.trim() && !content.trim()) return;
    setContentStatus({ isLoading: true, result: null, error: null });
    try {
      const res = await aiAnalysisApi.verifyListing({
        title: name || 'Trống',
        description: content || 'Trống',
      });
      setContentStatus({ isLoading: false, result: res.payload, error: null });
    } catch {
      setContentStatus({ isLoading: false, result: null, error: 'Analysis failed' });
    }
  }, [name, content]);

  React.useEffect(() => {
    const isNameEmpty = name.trim().length === 0;
    const isContentEmpty = content.trim().length === 0;

    if (isNameEmpty && isContentEmpty) {
      setContentStatus({ isLoading: false, result: null, error: null });
      return;
    }
    const timer = setTimeout(() => {
      verifyListingContent();
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [name, content, verifyListingContent, debounceMs]);

  const isContentValid = contentStatus.result?.isValid ?? false;

  return { contentStatus, isContentValid };
}
