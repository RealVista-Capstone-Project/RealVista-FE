import http from '@/shared/lib/http';

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
  uploadBulk: (files: File[], propertyId?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const params = propertyId ? `?propertyId=${propertyId}` : '';
    return http.post<BulkMediaUploadResponse>(`media/upload/bulk${params}`, formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },
};
