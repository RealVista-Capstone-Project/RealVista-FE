/**
 * User Entity Types
 * Domain models for the User entity
 */

export type UserStatus = 'ACTIVE' | 'VERIFIED' | 'SUSPENDED' | 'BANNED'

export type RoleCode = 'ADMIN' | 'AGENT' | 'OWNER' | 'BUYER' | 'TENANT' | 'VERIFIER'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: RoleCode | string
  emailVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface UserFilterParams {
  search?: string
  status?: UserStatus
  role?: RoleCode
}

/** UserProfile matches the raw snake_case fields returned by the backend */
export interface UserProfile {
  user_id: string
  email: string
  phone?: string
  first_name?: string | null
  last_name?: string | null
  business_name?: string
  full_name?: string
  status: string
  roles?: string[]
  avatar_url?: string
  deleted?: boolean
  is_deleted?: boolean
  deleted_at?: string | null
  is_email_verified?: boolean
  is_phone_verified?: boolean
  email_verified_at?: string | null
  phone_verified_at?: string | null
  created_at: string
  updated_at: string
}

export interface UpdateMeData {
  email?: string
  first_name?: string
  last_name?: string
  business_name?: string
  avatar_url?: string
  phone?: string
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
}

export interface Session {
  token: string;
  user: User;
  expiresAt: number;
}

export interface UserSearchResponse {
  user_id: string;
  email: string;
  full_name: string;
  masked_phone: string;
  phone: string;
  avatar_url?: string;
}
