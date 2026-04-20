import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api';
import type {
  User,
  UserProfile,
  LoginCredentials,
  LoginResponse,
  UpdateUserData,
  UpdateMeData,
  UserSearchResponse,
  UserFilterParams,
} from '../model/types';
import type { PageResponse } from '@/shared/types/search';

/** Response shape from POST /auth/register */
export interface RegisterResponse {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * User API - All user-related HTTP methods
 * This is the data source layer - pure functions that make HTTP requests
 */
export const userApi = {
  /**
   * Get current authenticated user (from /me endpoint)
   */
  getMe: () => http.get<ApiResponse<UserProfile>>('/me'),

  /**
   * Update current authenticated user
   */
  updateMe: (data: UpdateMeData) => http.patch<ApiResponse<UserProfile>>('/me', data),

  /**
   * Get current authenticated user
   */
  getCurrent: () => http.get<User>('/user/profile'),

  /**
   * Get user by ID
   */
  getById: (id: string) => http.get<ApiResponse<UserProfile>>(`/users/${id}`),

  /**
   * Get list of users
   */
  list: () => http.get<User[]>('/users'),

  /**
   * Login user
   */
  login: (credentials: LoginCredentials) => http.post<LoginResponse>('/auth/login', credentials),

  /**
   * Logout user
   */
  logout: () => http.post('/auth/logout', {}),

  /**
   * Register new user
   */
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    role: string;
  }) => http.post<RegisterResponse>('/auth/register', data),

  /**
   * Update user profile
   */
  update: (data: UpdateUserData) => http.put<User>('/user/profile', data),

  /**
   * Change password
   */
  changePassword: (userId: string, data: { current_password: string; new_password: string }) =>
    http.put<ApiResponse<void>>(`/users/${userId}/password`, data),

  /**
   * Delete (soft-delete) current user account
   */
  deleteAccount: (userId: string) =>
    http.delete<ApiResponse<void>>(`/users/${userId}`),


  /**
   * Send email OTP to the given email address (updates user's email if changed)
   */
  sendEmailOtp: (email: string) =>
    http.post<ApiResponse<{ expirySeconds: number }>>('/me/send-email-otp', { email }),

  /**
   * Verify email with OTP
   */
  verifyEmail: (otp: string) =>
    http.post<ApiResponse<UserProfile>>('/me/verify-email', { otp }),

  verifyPhone: (phone?: string) =>
    http.post<ApiResponse<UserProfile>>('/me/verify-phone', { phone }),

  /**
   * Upload avatar
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return http.post<{ url: string }>('/user/avatar', formData, { baseUrl: '' });
  },
  /**
   * Search user by email (masked phone) for owner assignment
   */
  searchByEmail: (email: string) =>
    http.get<ApiResponse<UserSearchResponse>>(`/users/search?email=${email}`),

  /**
   * Add OWNER role to current user (idempotent)
   */
  addOwnerRole: () => http.post<ApiResponse<UserProfile>>('/me/add-role', {}),

  /**
   * Get paginated list of users (Admin only)
   */
  getPagedUsers: (
    params?: UserFilterParams & { page?: number; size?: number; sort?: string }
  ) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.role) query.append('role', params.role);
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    return http.get<ApiResponse<PageResponse<UserProfile>>>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
  },
} as const;

// Re-export query keys and queries
export { userKeys } from './keys';
export { userQueries } from './user.queries';
