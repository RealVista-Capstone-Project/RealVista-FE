import http from '@/shared/lib/http';
import { ApiResponse } from './media-api.types';

export interface MediaUploadResponse {
  media_id: string; // UUID from backend
  media_url: string;
  media_type: string;
}

export interface BulkMediaUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploaded_files: MediaUploadResponse[];
    total_count: number;
    success_count: number;
    failed_count: number;
    failed_files: any[];
  };
  timestamp: string;
}

export const mediaApi = {
  uploadBulkMedia: (files: File[], folder = 'properties', propertyId?: string, listingId?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const params = new URLSearchParams();
    if (propertyId) params.set('propertyId', propertyId);
    if (listingId) params.set('listingId', listingId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return http.post<BulkMediaUploadResponse>(`media/upload/bulk${queryString}`, formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
  uploadMedia: (file: File, folder = 'properties') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return http.post<ApiResponse<MediaUploadResponse>>('media/upload', formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
};
