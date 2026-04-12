import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadImage, MarbleApiError, MarbleModel } from '@/shared/api/marble-client';
import { propertyApi } from '@/entities/property';
import { HttpError } from '@/shared/lib/http/http';
import { Property3dOperation } from '@/entities/property/api/property-api.types';

type GenerationPhase = 'idle' | 'uploading' | 'requesting' | 'polling' | 'succeeded' | 'failed';

export type AzimuthImage = {
  file: File;
  previewUrl: string;
  azimuth: number;
};

type UploadState = {
  phase: GenerationPhase;
  operationId: string | null;
  uploadedCount: number;
  totalImages: number;
  error: string | null;
  progressDescription: string;
};

const MAX_UPLOAD_RETRIES = 2;
const POLL_INTERVAL = 5000; // 5 seconds

export function useGenerate3d(propertyId: string, t?: (key: string, params?: Record<string, any>) => string) {
  const [state, setState] = useState<UploadState>({
    phase: 'idle',
    operationId: null,
    uploadedCount: 0,
    totalImages: 0,
    error: null,
    progressDescription: '',
  });

  const abortRef = useRef(false);

  // Poll operation status automatically when phase is 'polling'
  const { data: operationStatus, isError: isPollError } = useQuery({
    queryKey: ['property3dOperations', propertyId, state.operationId],
    queryFn: async () => {
      if (!state.operationId || !propertyId) return null;
      const res = await propertyApi.get3dOperations(propertyId);
      // Both endpoints return ApiResponse<T>: { message, data: T }
      // http.get wraps this in { status, payload } — so actual data is at res.payload.data
      const list = ((res.payload as any)?.data ?? []) as Property3dOperation[];
      const op = list.find((o) => o.operation_id === state.operationId);
      if (!op) return null;

      const isDone = op.status === 'SUCCEEDED' || op.status === 'FAILED';
      return {
        done: isDone,
        error: op.status === 'FAILED' ? { message: op.error_message || 'Failed' } : undefined,
        metadata: {
          progress: {
            description: t ? t('progressPolling') : 'Processing on backend...',
          },
        },
        response: op,
      };
    },
    enabled: state.phase === 'polling' && !!state.operationId,
    refetchInterval: (query) => {
      const d = query.state.data;
      // null = operation not yet found in list — keep polling
      // undefined = query hasn't run yet — keep polling
      // d.done = terminal state (SUCCEEDED or FAILED) — stop
      if (d != null && (d.done || query.state.error)) {
        return false;
      }
      return POLL_INTERVAL;
    },
    refetchIntervalInBackground: false,
  });

  // Watch operationStatus and transition phase if done — must be in useEffect, not render body
  useEffect(() => {
    if (state.phase === 'polling' && operationStatus) {
      if (operationStatus.done) {
        if (operationStatus.error) {
          setState((prev) => ({
            ...prev,
            phase: 'failed',
            error: operationStatus.error?.message || (t ? t('progressFailed') : 'Generation failed on Marble side'),
          }));
        } else {
          setState((prev) => ({
            ...prev,
            phase: 'succeeded',
            progressDescription: t ? t('progressSucceeded') : '3D World generated successfully!',
          }));
        }
      } else {
        const description =
          operationStatus.metadata?.progress?.description || (t ? t('progressPolling') : 'Generating 3D model...');
        // Always update — functional updater is safe even if value hasn't changed
        setState((prev) => ({ ...prev, progressDescription: description }));
      }
    } else if (state.phase === 'polling' && isPollError) {
      // Only fail hard if TanStack retries are exhausted, useQuery does retries internally
      setState((prev) => ({ ...prev, phase: 'failed', error: t ? t('progressFailed') : 'Failed to poll operation status' }));
    }
  }, [operationStatus, isPollError, state.phase]);  // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = useCallback(() => {
    abortRef.current = true;
    setState((prev) => ({
      ...prev,
      phase: prev.phase === 'uploading' ? 'idle' : prev.phase,
      error: t ? t('progressCancelled') : 'Generation cancelled',
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current = false;
    setState({
      phase: 'idle',
      operationId: null,
      uploadedCount: 0,
      totalImages: 0,
      error: null,
      progressDescription: '',
    });
  }, []);

  const generate = useCallback(
    async (
      images: AzimuthImage[],
      model: MarbleModel,
      displayName?: string,
      roomName?: string,
      options?: { onPreFlight?: () => boolean; onOperationCreated?: () => void; onInitiationError?: () => void }
    ) => {
      abortRef.current = false;

      // Pre-flight quota check
      if (options?.onPreFlight && !options.onPreFlight()) {
        return;
      }

      setState({
        phase: 'uploading',
        operationId: null,
        uploadedCount: 0,
        totalImages: images.length,
        error: null,
        progressDescription: t ? t('progressStarting') : 'Starting image upload...',
      });

      const uploadedAssets: { media_asset_id: string; azimuth: number }[] = [];

      // Step 1: Upload images sequentially
      for (let i = 0; i < images.length; i++) {
        if (abortRef.current) return;

        setState((prev) => ({
          ...prev,
          uploadedCount: i,
          progressDescription: t
            ? t('progressUploading', { current: i + 1, total: images.length })
            : `Uploading image ${i + 1} of ${images.length}...`,
        }));

        let lastError: any = null;
        for (let retry = 0; retry <= MAX_UPLOAD_RETRIES; retry++) {
          if (abortRef.current) return;
          try {
            const assetId = await uploadImage(images[i].file);
            uploadedAssets.push({ media_asset_id: assetId, azimuth: images[i].azimuth });
            lastError = null;
            break;
          } catch (error: any) {
            lastError = error;
            if (error instanceof MarbleApiError && !error.retryable) {
              break;
            }
            if (retry < MAX_UPLOAD_RETRIES) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1))); // Exponential backoff
            }
          }
        }

        if (lastError || abortRef.current) {
          setState((prev) => ({
            ...prev,
            phase: 'failed',
            error: lastError?.message || (t
              ? t('progressFailedUpload', { current: i + 1 })
              : `Failed to upload image ${i + 1}`),
          }));
          return;
        }
      }

      if (abortRef.current) return;

      // Step 2: Request World Generation via Backend
      setState((prev) => ({
        ...prev,
        phase: 'requesting',
        uploadedCount: images.length,
        progressDescription: t ? t('progressSubmitting') : 'Submitting 3D generation request to backend...',
      }));

      try {
        const generationRes = await propertyApi.initiate3dOperation(propertyId, {
          display_name: displayName,
          model: model,
          room_name: roomName,
          images: uploadedAssets,
        });

        // initiate3dOperation returns ApiResponse<Property3DGenerationDto>
        // http.post wraps it in { status, payload } — actual data is at res.payload.data
        const opData = (generationRes.payload as any)?.data as Property3dOperation;
        const opId = opData?.operation_id;

        // Notify caller that the operation was created (e.g., for quota decrement)
        options?.onOperationCreated?.();

        // Step 3: Switch to polling
        setState((prev) => ({
          ...prev,
          phase: 'polling',
          operationId: opId,
          progressDescription: t ? t('progressAccepted') : 'Operation accepted. Preparing 3D engine...',
        }));
      } catch (error: any) {
        let errorMessage: string;
        if (error instanceof HttpError) {
          // Jackson serializes camelCase as snake_case (SNAKE_CASE naming strategy on BE)
          const errorCode = (error.payload?.error_code ?? error.payload?.errorCode) as string | undefined;
          if (errorCode === 'QUOTA_EXHAUSTED' || errorCode === 'ILLEGAL_STATE') {
            // ILLEGAL_STATE is the legacy code before InsufficientQuotaException was added
            errorMessage = t ? t('progressQuotaExhausted') : 'No remaining 3D room credits. Please upgrade your plan.';
          } else {
            // Never surface raw server messages to end users
            errorMessage = t ? t('progressFailed') : 'Failed to start generation';
          }
        } else {
          errorMessage = t ? t('progressFailed') : 'Failed to start generation';
        }
        // Notify caller so it can refresh quota display regardless of error type
        options?.onInitiationError?.();
        setState((prev) => ({
          ...prev,
          phase: 'failed',
          error: errorMessage,
        }));
      }
    },
    [propertyId]
  );

  const resumeOperation = useCallback((opId: string) => {
    abortRef.current = false;
    setState({
      phase: 'polling',
      operationId: opId,
      uploadedCount: 8, // Assuming resumed means already uploaded
      totalImages: 8,
      error: null,
      progressDescription: t ? t('progressResuming') : 'Resuming tracking from backend...',
    });
  }, []);

  return {
    ...state,
    operationStatus: operationStatus?.response,
    generate,
    cancel,
    reset,
    resumeOperation,
  };
}
