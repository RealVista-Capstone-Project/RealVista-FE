import http, { HttpError } from '@/shared/lib/http/http'

export class MarbleApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public retryable: boolean = true
  ) {
    super(message)
    this.name = 'MarbleApiError'
  }
}

export type MarbleModel = 'Marble 0.1-pro' | 'Marble 0.1-mini'

export type OperationResponse = {
  name: string
  operation_id: string
  metadata?: {
    '@type': string
    world_id?: string
    progress?: {
      description: string
    }
  }
  done: boolean
  error?: {
    code: number
    message: string
  }
  response?: {
    '@type': string
    world_id: string
    display_name: string
    created_at: string
    world_marble_url: string
    model: string
    assets: {
      thumbnail_url: string
      caption?: string
      imagery?: { pano_url: string }
      splats?: { spz_urls: { high_res: string; full_res: string } }
      mesh?: { collider_mesh_url: string }
    }
  }
}

export async function uploadImage(file: File, sequence: number = 0): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    'capture_metadata',
    JSON.stringify({
      capture_type: 'CAPTURE_TYPE_SPATIAL_CAMERA',
      sequence_number: sequence,
    })
  )

  try {
    const res = await http.post<{ media_asset_id: string }>('/api/marble/upload', formData, {
      baseUrl: '',
    })

    if (!res.payload.media_asset_id) {
      throw new Error('Upload successful but no media_asset_id returned')
    }
    return res.payload.media_asset_id
  } catch (error: any) {
    if (error instanceof HttpError) {
      const isRetryable = error.status >= 500 || error.status === 429
      throw new MarbleApiError(
        error.payload?.message || 'Upload failed',
        error.status,
        isRetryable
      )
    }
    if (error instanceof MarbleApiError) throw error
    throw new MarbleApiError('Unknown upload error', 500, false)
  }
}

export async function generateWorld(params: {
  displayName?: string
  model: MarbleModel
  images: { mediaAssetId: string; azimuth: number }[]
  textPrompt?: string
}): Promise<{ operation_id: string; metadata?: any }> {
  try {
    const payload = {
      display_name: params.displayName || 'Property 3D World',
      model: params.model,
      generation_options: {
        images: params.images.map((img) => ({
          media_asset_id: img.mediaAssetId,
          camera_parameters: { azimuth: img.azimuth },
        })),
        ...(params.textPrompt && {
          prompts: [{ text: params.textPrompt }],
        }),
      },
    }

    const res = await http.post<{ operation_id: string; metadata?: any }>(
      '/api/marble/generate',
      payload,
      { baseUrl: '' }
    )

    if (!res.payload.operation_id) {
      throw new Error('Generate triggered but no operation_id returned')
    }
    return res.payload
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw new MarbleApiError(
        error.payload?.message || 'Generate request failed',
        error.status,
        false
      )
    }
    if (error instanceof MarbleApiError) throw error
    throw new MarbleApiError('Unknown generate error', 500, false)
  }
}

export async function getOperation(operationId: string): Promise<OperationResponse> {
  try {
    const res = await http.get<OperationResponse>(
      `/api/marble/operations/${operationId}`,
      { baseUrl: '' }
    )
    return res.payload
  } catch (error: any) {
    if (error instanceof HttpError) {
      const isRetryable = error.status >= 500 || error.status === 429
      throw new MarbleApiError(
        error.payload?.message || 'Polling failed',
        error.status,
        isRetryable
      )
    }
    if (error instanceof MarbleApiError) throw error
    throw new MarbleApiError('Unknown polling error', 500, false)
  }
}
