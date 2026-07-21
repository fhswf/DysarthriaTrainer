/**
 * User API Type Definitions
 *
 * TypeScript interfaces for User resource operations.
 * Matches FastAPI backend schema definitions.
 */

/**
 * User entity (response from API)
 */
export interface User {
  id: string // UUID
  username: string
  email: string
  full_name?: string | null // Backend stores as single field
  created_at?: string
  updated_at?: string
  email_verified?: boolean
  is_active?: boolean
  roles?: string[]
  permissions?: string[]
  
  // Frontend-only fields (computed from full_name)
  first_name?: string
  last_name?: string
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  username: string
  password: string
  email: string
  fullName: string
}

/**
 * User update request (partial)
 */
export interface UpdateUserRequest {
  email?: string
  fullName?: string | null
}

/**
 * User list response (if pagination is added later)
 */
export interface UserListResponse {
  users: User[]
}

/**
 * User query parameters
 */
export interface UserQueryParams {
  // Add filters as backend supports them
  search?: string
  limit?: number
  offset?: number
}
