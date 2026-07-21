/**
 * Exercise Category API Service
 *
 * Provides CRUD operations for exercise categories (Bereiche).
 * Categories group exercises by therapeutic area (mouth, breathing, etc.).
 */

import { useApiStore } from '@/stores/api'

export interface ExerciseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  display_order: number
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseCategoryListParams {
  limit?: number
  offset?: number
  ordering?: string
  search?: string
}

export interface ExerciseCategoryListResponse {
  count: number
  results: ExerciseCategory[]
}

export interface ExerciseCategoryCreate {
  name: string
  slug: string
  description?: string
  icon_url?: string
  display_order?: number
}

export interface ExerciseCategoryUpdate {
  name?: string
  slug?: string
  description?: string
  icon_url?: string
  display_order?: number
}

class ExerciseCategoryService {
  private api: ReturnType<typeof useApiStore> | null = null

  /**
   * Base URL for exercise categories endpoint
   * ⚠️ CRITICAL: Must be public for CSV export functionality
   */
  public readonly baseUrl = '/api/v1/exercise/categories'

  private getApi() {
    this.api ??= useApiStore()
    return this.api
  }

  /**
   * List all exercise categories with pagination and filtering
   *
   * ⚠️ CRITICAL: Must accept signal parameter for race condition prevention
   *
   * @param params - Query parameters (limit, offset, ordering, search)
   * @param signal - AbortSignal for request cancellation
   */
  async list(
    params?: ExerciseCategoryListParams,
    signal?: AbortSignal
  ): Promise<ExerciseCategoryListResponse> {
    const response = await this.getApi().get<ExerciseCategoryListResponse>(this.baseUrl, {
      params,
      signal,
    })
    return response.data
  }

  /**
   * Get a single category by ID
   */
  async getById(id: string | number): Promise<ExerciseCategory> {
    const response = await this.getApi().get<ExerciseCategory>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Create a new category
   */
  async create(data: ExerciseCategoryCreate): Promise<ExerciseCategory> {
    const response = await this.getApi().post<ExerciseCategory>(this.baseUrl, data)
    return response.data
  }

  /**
   * Update an existing category (partial update)
   * Note: Backend uses PATCH, not PUT
   */
  async update(id: string | number, data: ExerciseCategoryUpdate): Promise<ExerciseCategory> {
    const response = await this.getApi().patch<ExerciseCategory>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Partially update a category
   */
  async partialUpdate(
    id: string | number,
    data: Partial<ExerciseCategoryUpdate>
  ): Promise<ExerciseCategory> {
    const response = await this.getApi().patch<ExerciseCategory>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Delete a category (soft delete)
   */
  async delete(id: string | number): Promise<void> {
    await this.getApi().delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Get exercises in a category
   */
  async getExercises(id: string | number): Promise<unknown[]> {
    const response = await this.getApi().get(`${this.baseUrl}/${id}/exercises`)
    return response.data.results
  }
}

export const exerciseCategoryService = new ExerciseCategoryService()
