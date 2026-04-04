export interface MediaUploadResponse {
  media_url: string;
  media_type: string;
  file_size: number;
  file_name: string;
  uploaded_at: string;
  folder: string;
}

export interface BulkMediaUploadResponse {
  uploaded_files: MediaUploadResponse[];
  total_count: number;
  success_count: number;
  failed_count: number;
  failed_files: FailedUpload[];
}

export interface FailedUpload {
  file_name: string;
  error_message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
