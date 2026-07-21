/**
 * Authentication API Types
 *
 * Type definitions matching the backend API v1 authentication schemas.
 * Backend: /api/v1/auth/*
 * Schemas: backend/src/api/schemas/auth.py
 */

/**
 * Login Request
 * POST /api/v1/auth/login
 */
export interface LoginRequest {
  email: string // EmailStr - required
  password: string // required
  device_info?: string // Optional device tracking (max 200 chars)
}

/**
 * Register Request
 * POST /api/v1/auth/register
 */
export interface RegisterRequest {
  email: string // EmailStr - required
  username: string // required (3-50 chars, alphanumeric + _ -)
  password: string // required (min 8 chars, max 128)
  full_name?: string // optional (max 100 chars)
}

/**
 * Refresh Token Request
 * POST /api/v1/auth/refresh
 */
export interface RefreshTokenRequest {
  refresh_token: string // required
}

/**
 * Logout Request
 * POST /api/v1/auth/logout
 */
export interface LogoutRequest {
  refresh_token: string // required
}

/**
 * Password Reset Request
 * POST /api/v1/auth/password-reset/request
 */
export interface PasswordResetRequest {
  email: string // EmailStr
}

/**
 * Password Reset Confirm
 * POST /api/v1/auth/password-reset/confirm
 */
export interface PasswordResetConfirm {
  token: string // reset token from email
  new_password: string // min 8 chars, max 128
}

/**
 * Email Verification Request
 * POST /api/v1/auth/verify-email
 */
export interface EmailVerificationRequest {
  token: string // verification token from email
}

/**
 * Change Password Request
 * POST /api/v1/auth/change-password
 */
export interface ChangePasswordRequest {
  current_password: string // Current password for verification
  new_password: string // New password (min 8 chars, max 128)
}

/**
 * User Response
 * Returned by register, verify-email, password-reset/confirm
 */
export interface UserResponse {
  id: string // UUID format
  email: string
  username: string
  full_name: string | null
  email_verified: boolean
  created_at: string // ISO 8601 datetime
  last_login: string | null // ISO 8601 datetime
}

/**
 * Token Response
 * Returned by refresh endpoint
 */
export interface TokenResponse {
  access_token: string // JWT access token
  refresh_token: string // JWT refresh token (new, old revoked)
  token_type: 'bearer' // Always "bearer"
  expires_in: number // Seconds (900 = 15 minutes)
}

/**
 * Login Response
 * Returned by login endpoint
 */
export interface LoginResponse extends TokenResponse {
  user: UserResponse
}

/**
 * Message Response
 * Generic success message
 */
export interface MessageResponse {
  message: string
}

/**
 * Error Response
 * Standard error structure from backend
 */
export interface ErrorResponse {
  detail: string // Error detail message
  error_code?: string // Application-specific error code
}

/**
 * Stored Token Data
 * How tokens are stored in localStorage/sessionStorage
 */
export interface StoredTokens {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number
  expires_at: number // Calculated: Date.now() + (expires_in * 1000)
  issued_at: number // Date.now() when stored
}

/**
 * Stored User Data
 * Cached user information
 */
export interface StoredUser extends UserResponse {
  permissions?: string[] // If retrieved separately
  roles?: string[] // If retrieved separately
}

/**
 * Frontend-only Login Form Data
 */
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean // Frontend-only, affects storage location
  deviceInfo?: string // Populated from navigator.userAgent
}

/**
 * Frontend-only Register Form Data
 */
export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string // Frontend validation only
  fullName?: string // Optional
}

/**
 * Frontend-only Forgot Password Form Data
 */
export interface ForgotPasswordFormData {
  email: string
}

/**
 * Frontend-only Reset Password Form Data
 */
export interface ResetPasswordFormData {
  token: string // From URL query param
  newPassword: string
  confirmPassword: string // Frontend validation only
}

/**
 * Auth State (for Pinia store)
 */
export interface AuthState {
  user: StoredUser | null
  tokens: StoredTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * HTTP Status Codes from Backend
 */
export const AUTH_ERROR_CODES = {
  BAD_REQUEST: 400, // Validation errors, invalid tokens, weak password
  UNAUTHORIZED: 401, // Invalid credentials, expired/revoked tokens
  FORBIDDEN: 403, // Email not verified
  CONFLICT: 409, // Duplicate email/username
  LOCKED: 423, // Account locked
} as const

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user',
  REMEMBER_ME: 'auth_remember_me',
} as const

/**
 * Token Refresh Configuration
 */
export const TOKEN_CONFIG = {
  REFRESH_THRESHOLD_SECONDS: 300, // Refresh 5 minutes before expiry
  ACCESS_TOKEN_EXPIRES: 900, // 15 minutes (backend default)
} as const
