/**
 * Shared API Response Types
 * Type definitions for backend API responses
 */

/**
 * Standard API response wrapper from backend
 * All endpoints return this structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResponse<T> {
  content: T[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * HTTP utility response format
 * Wraps the raw backend response with status code
 */
export interface HttpResponse<T = unknown> {
  status: number;
  payload: T;
}

/**
 * Type-safe helper to unwrap ApiResponse from HttpResponse
 * Handles both wrapped and unwrapped formats
 */
export function unwrapApiResponse<T>(response: HttpResponse<ApiResponse<T>> | HttpResponse<T>): T {
  const payload = response.payload as ApiResponse<T> | T;

  // Check if payload is wrapped in ApiResponse
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }

  // Payload is already unwrapped
  return payload as T;
}
