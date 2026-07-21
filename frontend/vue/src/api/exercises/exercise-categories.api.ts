/**
 * Exercise Categories API
 *
 * API client for exercise category CRUD operations.
 * Categories organize exercises into logical groups.
 *
 * @module api/exercises
 */

import { useApiStore } from '@/stores/api'
import type {
  ExerciseCategory,
  ExerciseCategoryCreateDto,
  ExerciseCategoryUpdateDto,
  ExerciseCategoryReorderDto,
} from './exercises.types'

class ExerciseCategoriesApi {
  private readonly baseUrl = '/api/v1/exercise/categories'

  private getApi() {
    return useApiStore()
  }

  /**
   * List all exercise categories
   *
   * @param includeDeleted - Include soft-deleted categories (default: false)
   * @param signal - AbortSignal for cancelling requests
   * @returns Paginated response with array of exercise categories ordered by display_order
   *
   * @example
   * ```typescript
   * // List active categories
   * const response = await exerciseCategoriesApi.list()
   * const categories = response.results
   *
   * // List including deleted
   * const response = await exerciseCategoriesApi.list(true)
   * ```
   */
  async list(
    includeDeleted: boolean = false,
    signal?: AbortSignal
  ): Promise<{ count: number; results: ExerciseCategory[] }> {
    const api = this.getApi()
    const response = await api.get<{ count: number; results: ExerciseCategory[] }>(this.baseUrl, {
      params: { include_deleted: includeDeleted },
      signal,
    })
    return response.data
  }

  /**
   * Get a single category by ID
   *
   * @param id - Category UUID
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise category
   *
   * @example
   * ```typescript
   * const category = await exerciseCategoriesApi.getById('123')
   * ```
   */
  async getById(id: string, signal?: AbortSignal): Promise<ExerciseCategory> {
    const api = this.getApi()
    const response = await api.get<ExerciseCategory>(`${this.baseUrl}/${id}`, { signal })
    return response.data
  }

  /**
   * Get category by slug
   *
   * @param slug - Category slug (e.g., "lippen-training")
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise category
   *
   * @example
   * ```typescript
   * const category = await exerciseCategoriesApi.getBySlug('lippen-training')
   * ```
   */
  async getBySlug(slug: string, signal?: AbortSignal): Promise<ExerciseCategory> {
    const api = this.getApi()
    const response = await api.get<ExerciseCategory>(`${this.baseUrl}/slug/${slug}`, { signal })
    return response.data
  }

  /**
   * Create a new exercise category
   *
   * @param data - Category creation payload
   * @returns Created category
   *
   * @example
   * ```typescript
   * const category = await exerciseCategoriesApi.create({
   *   name: 'Lippen-Training',
   *   slug: 'lippen-training',
   *   description: 'Übungen zur Stärkung der Lippenmuskulatur',
   *   sort_order: 1
   * })
   * ```
   */
  async create(data: ExerciseCategoryCreateDto): Promise<ExerciseCategory> {
    const api = this.getApi()
    const response = await api.post<ExerciseCategory>(this.baseUrl, data)
    return response.data
  }

  /**
   * Update an existing exercise category
   *
   * @param id - Category UUID
   * @param data - Category update payload
   * @returns Updated category
   *
   * @example
   * ```typescript
   * const category = await exerciseCategoriesApi.update('123', {
   *   name: 'Lippen-Training Fortgeschritten',
   *   description: 'Erweiterte Übungen'
   * })
   * ```
   */
  async update(id: string, data: ExerciseCategoryUpdateDto): Promise<ExerciseCategory> {
    const api = this.getApi()
    const response = await api.patch<ExerciseCategory>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Delete a category (soft delete)
   *
   * @param id - Category UUID
   * @param deletedBy - User UUID performing the deletion
   *
   * @example
   * ```typescript
   * await exerciseCategoriesApi.delete('123', 'user-456')
   * ```
   */
  async delete(id: string, deletedBy: string): Promise<void> {
    const api = this.getApi()
    await api.delete(`${this.baseUrl}/${id}`, {
      params: { deleted_by: deletedBy },
    })
  }

  /**
   * Reorder categories
   *
   * Updates the sort_order for multiple categories at once.
   *
   * @param categoryIds - Array of category UUIDs in desired order
   * @returns Message response
   *
   * @example
   * ```typescript
   * // Reorder categories (first becomes last)
   * await exerciseCategoriesApi.reorder([
   *   'category-2',
   *   'category-3',
   *   'category-1'
   * ])
   * ```
   */
  async reorder(categoryIds: string[]): Promise<{ message: string }> {
    const api = this.getApi()
    const payload: ExerciseCategoryReorderDto = { category_ids: categoryIds }
    const response = await api.post<{ message: string }>(`${this.baseUrl}/reorder`, payload)
    return response.data
  }
}

// Export singleton instance
export const exerciseCategoriesApi = new ExerciseCategoriesApi()
