export type LocationLevel = 'CITY' | 'DISTRICT' | 'WARD';
export type LocationStatus = 'ACTIVE' | 'ARCHIVED';

export interface LocationResponse {
  location_id: string;
  code: string;
  name: string;
  parent_id?: string;
  level?: LocationLevel;
  status?: LocationStatus;
  sort_order?: number;
  used_by_properties_count?: number;
  north_lat?: number;
  south_lat?: number;
  east_lng?: number;
  west_lng?: number;
  created_at?: string;
  updated_at?: string;
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
  sort_order?: number;
}

export interface UpdateLocationRequest {
  code?: string;
  name?: string;
  sort_order?: number;
}

export interface AdminLocationListParams {
  level?: LocationLevel;
  status?: LocationStatus;
  parent_id?: string;
  search?: string;
  page?: number;
  size?: number;
}
