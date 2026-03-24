import http from '@/shared/lib/http';
import type { ApiResponse, MediaUploadResponse, BulkMediaUploadResponse } from './media-api.types';

export const mediaApi = {
  uploadMedia: (file: File, folder = 'properties') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return http.post<ApiResponse<MediaUploadResponse>>('media/upload', formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  uploadBulkMedia: (files: File[], folder = 'properties') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    return http.post<ApiResponse<BulkMediaUploadResponse>>('media/upload/bulk', formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
};
