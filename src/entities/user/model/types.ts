/**
 * User Entity Types
 * Domain models for the User entity
 */

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: 'user' | 'admin' | 'moderator'
  emailVerified?: boolean
  createdAt: string
  updatedAt: string
}

/** UserProfile matches the backend UserResponse DTO */
export interface UserProfile {
  user_id: string
  email: string
  phone?: string
  first_name?: string
  last_name?: string
  business_name?: string
  full_name?: string
  status: string
  roles?: string[]
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UpdateMeData {
  first_name?: string
  last_name?: string
  avatar_url?: string
  phone?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn: number
}

export interface UpdateUserData {
  name?: string
  avatar?: string
}

export interface Session {
  token: string
  user: User
  expiresAt: number
}
