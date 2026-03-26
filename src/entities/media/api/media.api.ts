import http from '@/shared/lib/http';

export interface MediaUploadResponse {
  media_url: string;
  media_type: string;
}

export interface BulkMediaUploadResponse {
  uploaded_files: MediaUploadResponse[];
  failed_count: number;
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
    });
  },
};
