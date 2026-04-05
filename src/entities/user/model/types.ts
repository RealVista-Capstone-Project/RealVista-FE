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

export interface SearchUserResponse {
  success: boolean
  message: string
  data: {
    user_id: string
    email: string
    full_name: string
    masked_phone: string
    phone: string
  }
  timestamp: string
}
