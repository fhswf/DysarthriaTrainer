/**
 * Exercise Items API
 *
 * API client for exercise item CRUD operations.
 * Handles polymorphic item types (movement, speech_practice, information).
 *
 * @module api/exercises
 */

import { useApiStore } from '@/stores/api'
import type {
  ExerciseItem,
  ExerciseItemCreateDto,
  ExerciseItemUpdateDto,
  ExerciseItemListParams,
  ExerciseItemReorderDto,
} from './exercises.types'

class ExerciseItemsApi {
  private readonly baseUrl = '/api/v1/exercise/items'

  private getApi() {
    return useApiStore()
  }

  /**
   * List exercise items with filtering
   *
   * @param params - Query parameters (exercise_id is required)
   * @param signal - AbortSignal for cancelling requests
   * @returns Array of exercise items
   *
   * @example
   * ```typescript
   * // List all items for an exercise
   * const items = await exerciseItemsApi.list({ exercise_id: '123' })
   *
   * // List specific item type
   * const items = await exerciseItemsApi.list({
   *   exercise_id: '123',
   *   item_type: 'speech_practice',
   *   language: 'de'
   * })
   * ```
   */
  async list(params: ExerciseItemListParams, signal?: AbortSignal): Promise<ExerciseItem[]> {
    const api = this.getApi()
    const response = await api.get<ExerciseItem[]>(this.baseUrl, { params, signal })
    return response.data
  }

  /**
   * Get a single exercise item by ID
   *
   * @param id - Item UUID
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise item
   *
   * @example
   * ```typescript
   * const item = await exerciseItemsApi.getById('123')
   * ```
   */
  async getById(id: string, signal?: AbortSignal): Promise<ExerciseItem> {
    const api = this.getApi()
    const response = await api.get<ExerciseItem>(`${this.baseUrl}/${id}`, { signal })
    return response.data
  }

  /**
   * Create a new exercise item
   *
   * @param data - Item creation payload
   * @returns Created item
   *
   * @example
   * ```typescript
   * // Create a movement item
   * const item = await exerciseItemsApi.create({
   *   exercise_id: '123',
   *   item_type: 'movement',
   *   sort_order: 1,
   *   content: {
   *     instruction: 'Bewegen Sie Ihre Lippen',
   *     duration_seconds: 30,
   *     repetitions: 5
   *   }
   * })
   *
   * // Create a speech practice item
   * const item = await exerciseItemsApi.create({
   *   exercise_id: '123',
   *   item_type: 'speech_practice',
   *   sort_order: 2,
   *   content: {
   *     text: 'Peter piper picked a peck',
   *     phonetic_target: 'p',
   *     difficulty: 'intermediate'
   *   }
   * })
   * ```
   */
  async create(data: ExerciseItemCreateDto): Promise<ExerciseItem> {
    const api = this.getApi()
    const response = await api.post<ExerciseItem>(this.baseUrl, data)
    return response.data
  }

  /**
   * Update an existing exercise item
   *
   * @param id - Item UUID
   * @param data - Item update payload
   * @returns Updated item
   *
   * @example
   * ```typescript
   * const item = await exerciseItemsApi.update('123', {
   *   sort_order: 3,
   *   content: {
   *     instruction: 'Updated instruction'
   *   }
   * })
   * ```
   */
  async update(id: string, data: ExerciseItemUpdateDto): Promise<ExerciseItem> {
    const api = this.getApi()
    const response = await api.put<ExerciseItem>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Delete an exercise item
   *
   * @param id - Item UUID
   *
   * @example
   * ```typescript
   * await exerciseItemsApi.delete('123')
   * ```
   */
  async delete(id: string): Promise<void> {
    const api = this.getApi()
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Reorder exercise items
   *
   * Updates the sort_order for multiple items at once.
   *
   * @param exerciseId - Exercise UUID
   * @param itemIds - Array of item UUIDs in desired order
   * @returns Updated items
   *
   * @example
   * ```typescript
   * // Reorder items (first item becomes last)
   * await exerciseItemsApi.reorder('exercise-123', [
   *   'item-2',
   *   'item-3',
   *   'item-1'
   * ])
   * ```
   */
  async reorder(exerciseId: string, itemIds: string[]): Promise<ExerciseItem[]> {
    const api = this.getApi()
    const payload: ExerciseItemReorderDto = { item_ids: itemIds }
    const response = await api.post<ExerciseItem[]>(`${this.baseUrl}/reorder`, payload, {
      params: { exercise_id: exerciseId },
    })
    return response.data
  }
}

// Export singleton instance
export const exerciseItemsApi = new ExerciseItemsApi()
