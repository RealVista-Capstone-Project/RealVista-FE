import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadImage, MarbleApiError, MarbleModel } from '@/shared/api/marble-client';
import { propertyApi } from '@/entities/property';
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

export function useGenerate3d(propertyId: string) {
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
      const list = ('data' in res ? res.data : res) as Property3dOperation[];
      const op = list.find((o) => o.operation_id === state.operationId);
      if (!op) return null;

      const isDone = op.status === 'SUCCEEDED' || op.status === 'FAILED';
      return {
        done: isDone,
        error: op.status === 'FAILED' ? { message: op.error_message || 'Failed' } : undefined,
        metadata: {
          progress: {
            description: op.status === 'PENDING' ? 'Processing on backend...' : 'Done',
          },
        },
        response: op,
      };
    },
    enabled: state.phase === 'polling' && !!state.operationId,
    refetchInterval: (query) => {
      // If it's done or error occurred, stop polling
      if (!query.state.data || query.state.data.done || query.state.error) {
        return false;
      }
      return POLL_INTERVAL;
    },
    refetchIntervalInBackground: false,
  });

  // Watch operationStatus and transition phase if done
  if (state.phase === 'polling' && operationStatus) {
    if (operationStatus.done) {
      if (operationStatus.error) {
        setState((prev) => ({
          ...prev,
          phase: 'failed',
          error: operationStatus.error?.message || 'Generation failed on Marble side',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          phase: 'succeeded',
          progressDescription: '3D World generated successfully!',
        }));
      }
    } else {
      const description =
        operationStatus.metadata?.progress?.description || 'Generating 3D model...';
      if (description !== state.progressDescription) {
        setState((prev) => ({ ...prev, progressDescription: description }));
      }
    }
  } else if (state.phase === 'polling' && isPollError) {
    // Only fail hard if TanStack retries are exhausted, useQuery does retries internally
    setState((prev) => ({ ...prev, phase: 'failed', error: 'Failed to poll operation status' }));
  }

  const cancel = useCallback(() => {
    abortRef.current = true;
    setState((prev) => ({
      ...prev,
      phase: prev.phase === 'uploading' ? 'idle' : prev.phase,
      error: 'Generation cancelled',
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
    async (images: AzimuthImage[], model: MarbleModel, displayName?: string) => {
      abortRef.current = false;
      setState({
        phase: 'uploading',
        operationId: null,
        uploadedCount: 0,
        totalImages: images.length,
        error: null,
        progressDescription: 'Starting image upload...',
      });

      const uploadedAssets: { media_asset_id: string; azimuth: number }[] = [];

      // Step 1: Upload images sequentially
      for (let i = 0; i < images.length; i++) {
        if (abortRef.current) return;

        setState((prev) => ({
          ...prev,
          uploadedCount: i,
          progressDescription: `Uploading image ${i + 1} of ${images.length}...`,
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
            error: lastError?.message || `Failed to upload image ${i + 1}`,
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
        progressDescription: 'Submitting 3D generation request to backend...',
      }));

      try {
        const generationRes = await propertyApi.initiate3dOperation(propertyId, {
          display_name: displayName,
          model: model,
          images: uploadedAssets,
        });

        const opData = (
          'data' in generationRes ? generationRes.data : generationRes
        ) as Property3dOperation;
        const opId = opData.operation_id;

        // Step 3: Switch to polling
        setState((prev) => ({
          ...prev,
          phase: 'polling',
          operationId: opId,
          progressDescription: 'Operation accepted. Preparing 3D engine...',
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          phase: 'failed',
          error: error.message || 'Failed to start generation',
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
      progressDescription: 'Resuming tracking from backend...',
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
