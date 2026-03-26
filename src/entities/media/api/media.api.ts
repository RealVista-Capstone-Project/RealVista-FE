import http from '@/shared/lib/http';

export interface MediaUploadResponse {
  url: string;
  mediaType: string;
}

export interface BulkMediaUploadResponse {
  results: MediaUploadResponse[];
  failedCount: number;
}

export const mediaApi = {
  uploadBulk: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return http.post<BulkMediaUploadResponse>('media/upload/bulk', formData, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
