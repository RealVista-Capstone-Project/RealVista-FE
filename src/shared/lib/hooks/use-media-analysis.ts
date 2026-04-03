'use client';

import * as React from 'react';
import {
  aiAnalysisApi,
  type AIAnalysisResult,
} from '@/entities/ai/api/ai-analysis.api';

export interface MediaAnalysisEntry {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

const QUALITY_THRESHOLD = 50;

/**
 * Hook that manages AI image analysis for newly uploaded files.
 * Provides per-file analysis status, a function to trigger analysis,
 * and derived flags for overall completion and quality.
 */
export function useMediaAnalysis() {
  const [analysisStatus, setAnalysisStatus] = React.useState<MediaAnalysisEntry[]>([]);

  const analyzeFile = React.useCallback(async (file: File, index: number) => {
    // If it's a video, skip analysis for now
    if (file.type.startsWith('video/')) {
      // TODO: Implement video analysis in the future
      setAnalysisStatus((prev) => {
        const next = [...prev];
        next[index] = {
          result: {
            isValid: true,
            feedback: 'Video file - verification skipped',
            finalScore: 100,
          } as unknown as AIAnalysisResult,
          isLoading: false,
          error: null,
        };
        return next;
      });
      return;
    }

    setAnalysisStatus((prev) => {
      const next = [...prev];
      next[index] = { result: null, isLoading: true, error: null };
      return next;
    });

    try {
      const res = await aiAnalysisApi.analyzeImage(file);
      setAnalysisStatus((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { result: res.payload, isLoading: false, error: null };
        }
        return next;
      });
    } catch {
      setAnalysisStatus((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { result: null, isLoading: false, error: 'Analysis failed' };
        }
        return next;
      });
    }
  }, []);

  /** Append empty analysis entries for newly added files */
  const appendEntries = React.useCallback((count: number) => {
    setAnalysisStatus((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => ({
        result: null,
        isLoading: false,
        error: null,
      })),
    ]);
  }, []);

  /** Remove an entry at the given index (re-indexes remaining) */
  const removeEntry = React.useCallback((index: number) => {
    setAnalysisStatus((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const allImagesAnalyzed = analysisStatus.every(
    (s) => !s.isLoading && (s.result || s.error)
  );

  const allImagesPassed = analysisStatus.every(
    (s) => s.result && (s.result.finalScore ?? 100) >= QUALITY_THRESHOLD
  );

  return {
    analysisStatus,
    analyzeFile,
    appendEntries,
    removeEntry,
    allImagesAnalyzed,
    allImagesPassed,
    QUALITY_THRESHOLD,
  };
}
