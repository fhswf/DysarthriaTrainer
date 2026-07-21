/**
 * Users API Client
 *
 * Type-safe API client for User resource operations.
 * Wraps the API service store for user-specific endpoints.
 *
 * Backend: FastAPI (not Django)
 * Base URL: /api/v1/users
 */

import { useApiStore } from '@/stores/api'
import type { User, CreateUserRequest, UpdateUserRequest, UserQueryParams } from './users.types'

export class UsersApi {
  private get api() {
    return useApiStore()
  }

  private readonly baseEndpoint = '/api/v1/users'

  /**
   * Get all users
   *
   * @param params - Optional query parameters
   * @returns List of users
   *
   * @example
   * const users = await usersApi.list();
   */
  async list(params?: UserQueryParams): Promise<User[]> {
    const response = await this.api.get<User[]>(this.baseEndpoint, {
      params,
      useCache: true,
      cacheTimeout: 30000, // 30 seconds
    })
    return response.data
  }

  /**
   * Get user by ID
   *
   * @param userId - UUID of the user
   * @returns User object
   * @throws 404 if user not found
   *
   * @example
   * const user = await usersApi.getById('123e4567-e89b-12d3-a456-426614174000');
   */
  async getById(userId: string): Promise<User> {
    const response = await this.api.get<User>(`${this.baseEndpoint}/${userId}`, {
      useCache: true,
      cacheTimeout: 30000,
    })
    return response.data
  }

  /**
   * Get current user profile (authenticated user)
   *
   * @returns Current user object
   * @throws 401 if not authenticated
   *
   * @example
   * const currentUser = await usersApi.getCurrentUser();
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>(`${this.baseEndpoint}/me`, {
      useCache: false, // Always fetch fresh user data
    })
    return response.data
  }

  /**
   * Update current user profile (authenticated user)
   *
   * @param data - Partial user data to update
   * @returns Updated user object
   * @throws 401 if not authenticated
   *
   * @example
   * const updated = await usersApi.updateCurrentUser({
   *   fullName: 'John Updated Doe'
   * });
   */
  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    // Convert camelCase (frontend) to snake_case (backend)
    const backendData: Record<string, unknown> = {}
    if (data.fullName !== undefined) {
      backendData.full_name = data.fullName
    }
    if (data.email !== undefined) {
      backendData.email = data.email
    }

    const response = await this.api.put<User>(`${this.baseEndpoint}/me`, backendData)

    // Clear cache after updating
    await this.api.clearCache()

    return response.data
  }

  /**
   * Create a new user
   *
   * @param data - User creation data
   * @returns Created user object
   * @throws 409 if username already exists
   *
   * @example
   * const newUser = await usersApi.create({
   *   username: 'johndoe',
   *   password: 'securepass123',
   *   email: 'john@example.com',
   *   fullName: 'John Doe'
   * });
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await this.api.post<User>(this.baseEndpoint, data)

    // Clear cache after creating a user
    await this.api.clearCache()

    return response.data
  }

  /**
   * Update user (partial update with PATCH)
   *
   * @param userId - UUID of the user to update
   * @param data - Partial user data to update
   * @returns Updated user object
   * @throws 404 if user not found
   *
   * @example
   * const updated = await usersApi.update('123e4567-e89b-12d3-a456-426614174000', {
   *   email: 'newemail@example.com',
   *   fullName: 'John Updated Doe'
   * });
   */
  async update(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.api.patch<User>(`${this.baseEndpoint}/${userId}`, data)

    // Clear cache after updating
    await this.api.clearCache()

    return response.data
  }

  /**
   * Delete user
   *
   * @param userId - UUID of the user to delete
   * @throws 404 if user not found
   *
   * @example
   * await usersApi.delete('123e4567-e89b-12d3-a456-426614174000');
   */
  async delete(userId: string): Promise<void> {
    await this.api.delete(`${this.baseEndpoint}/${userId}`)

    // Clear cache after deleting
    await this.api.clearCache()
  }
}

/**
 * Singleton instance of UsersApi
 * Use this in components and stores
 */
export const usersApi = new UsersApi()
