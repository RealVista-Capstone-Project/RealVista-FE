export type LocationLevel = 'CITY' | 'DISTRICT' | 'WARD';

export interface LocationResponse {
  location_id: string;
  code: string;
  name: string;
  parent_id?: string;
  level?: LocationLevel;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Admin request types
export interface CreateLocationRequest {
  code: string;
  name: string;
  level: LocationLevel;
  parent_id?: string;
}

export interface UpdateLocationRequest {
  code?: string;
  name?: string;
}

export interface AdminLocationListParams {
  level?: LocationLevel;
  parent_id?: string;
  search?: string;
  page?: number;
  size?: number;
}
