import http from '@/shared/lib/http'
import { ApiResponse } from '@/shared/types/api'
import type { User, LoginCredentials, LoginResponse, UpdateUserData, UserSearchResponse } from '../model/types'

/**
 * User API - All user-related HTTP methods
 * This is the data source layer - pure functions that make HTTP requests
 */
export const userApi = {
  /**
   * Get current authenticated user
   */
  getCurrent: () => http.get<User>('/user/profile'),

  /**
   * Get user by ID
   */
  getById: (id: string) => http.get<User>(`/users/${id}`),

  /**
   * Get list of users
   */
  list: () => http.get<User[]>('/users'),

  /**
   * Login user
   */
  login: (credentials: LoginCredentials) =>
    http.post<LoginResponse>('/auth/login', credentials),

  /**
   * Logout user
   */
  logout: () => http.post('/auth/logout', {}),

  /**
   * Register new user
   */
  register: (data: {
    email: string
    password: string
    name: string
  }) => http.post<LoginResponse>('/auth/register', data),

  /**
   * Update user profile
   */
  update: (data: UpdateUserData) => http.put<User>('/user/profile', data),

  /**
   * Change password
   */
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.post('/user/change-password', data, {}),

  /**
   * Upload avatar
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return http.post<{ url: string }>('/user/avatar', formData, { baseUrl: '' })
  },
  /**
   * Search user by email (masked phone) for owner assignment
   */
  searchByEmail: (email: string) =>
    http.get<ApiResponse<UserSearchResponse>>(`/users/search?email=${email}`),
} as const

// Re-export query keys and queries
export { userKeys } from './keys'
export { userQueries } from './user.queries'
