/**
 * Authentication API Service
 *
 * Handles all authentication-related API calls to backend /api/v1/auth/*
 */

import type { ApiServiceInterface, ApiResponse } from '@/stores/api/api.types'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
  TokenResponse,
  MessageResponse,
  PasswordResetConfirm,
  ChangePasswordRequest,
} from './auth.types'

export class AuthApiService {
  private api: ApiServiceInterface
  private readonly BASE_PATH = '/api/v1/auth'

  constructor(apiService: ApiServiceInterface) {
    this.api = apiService
  }

  /**
   * Login
   * POST /api/v1/auth/login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>(`${this.BASE_PATH}/login`, credentials)
  }

  /**
   * Register
   * POST /api/v1/auth/register
   */
  async register(data: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    return this.api.post<UserResponse>(`${this.BASE_PATH}/register`, data)
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  async logout(refreshToken: string): Promise<ApiResponse<MessageResponse>> {
    return this.api.post<MessageResponse>(`${this.BASE_PATH}/logout`, {
      refresh_token: refreshToken,
    })
  }

  /**
   * Refresh Token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
    return this.api.post<TokenResponse>(`${this.BASE_PATH}/refresh`, {
      refresh_token: refreshToken,
    })
  }

  /**
   * Verify Email
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(token: string): Promise<ApiResponse<UserResponse>> {
    return this.api.post<UserResponse>(`${this.BASE_PATH}/verify-email`, {
      token,
    })
  }

  /**
   * Request Password Reset
   * POST /api/v1/auth/password-reset/request
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<MessageResponse>> {
    return this.api.post<MessageResponse>(`${this.BASE_PATH}/password-reset/request`, {
      email,
    })
  }

  /**
   * Confirm Password Reset
   * POST /api/v1/auth/password-reset/confirm
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<ApiResponse<UserResponse>> {
    return this.api.post<UserResponse>(`${this.BASE_PATH}/password-reset/confirm`, data)
  }

  /**
   * Change Password (Authenticated)
   * POST /api/v1/auth/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<MessageResponse>> {
    return this.api.post<MessageResponse>(`${this.BASE_PATH}/change-password`, data)
  }
}

/**
 * Factory function to create auth API service
 */
export function createAuthApiService(apiService: ApiServiceInterface): AuthApiService {
  return new AuthApiService(apiService)
}
