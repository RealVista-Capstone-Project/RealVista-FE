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

export type MarbleModel = 'marble-1.0-draft' | 'marble-1.0' | 'marble-1.1' | 'marble-1.1-plus'

export function getModelCost(model: MarbleModel): number {
  switch (model) {
    case 'marble-1.0-draft':
      return 1
    case 'marble-1.0':
    case 'marble-1.1':
      return 3
    case 'marble-1.1-plus':
      return 5
    default:
      return 3
  }
}

export type WorldStatus = 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'RUNNING'

export type World = {
  world_id: string
  display_name: string
  world_marble_url: string
  model?: string
  created_at?: string
  updated_at?: string
  assets?: {
    thumbnail_url: string
    caption?: string
    imagery?: { pano_url: string }
    splats?: { spz_urls: Record<string, string> }
    mesh?: { collider_mesh_url: string }
  }
}

export type OperationResponse = {
  operation_id: string
  done: boolean
  metadata?: {
    progress_percentage?: number
    status?: WorldStatus
    [key: string]: any
  }
  error?: {
    code: number
    message: string
  }
  response?: World
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

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
  display_name?: string
  model: MarbleModel
  images: { media_asset_id: string; azimuth: number }[]
  text_prompt?: string
}): Promise<{ operation_id: string; metadata?: any }> {
  try {
    // Transform to World Labs multi-image prompt structure
    const payload = {
      display_name: params.display_name || 'Property 3D World',
      model: params.model,
      world_prompt: {
        type: 'multi-image',
        multi_image_prompt: params.images.map((img) => ({
          azimuth: img.azimuth,
          content: {
            source: 'media_asset',
            media_asset_id: img.media_asset_id,
          },
        })),
        ...(params.text_prompt && {
          text_prompt: params.text_prompt,
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
