/**
 * Exercise Item API Service
 *
 * Provides CRUD operations for exercise items.
 * Exercise items are the individual components within an exercise (movements, speech practices, information).
 *
 * API Endpoint: /api/v1/exercise/items
 * Backend Entity: ExerciseItem
 */

import type { UUID } from 'crypto'

/**
 * Exercise Item Type Enum
 * Matches backend ExerciseItemType enum
 */
export enum ExerciseItemType {
  MOVEMENT = 'movement', // Physical movement instruction
  SPEECH_PRACTICE = 'speech_practice', // Syllables, words, sentences
  INFORMATION = 'information', // Context, explanations, notes
}

/**
 * Exercise Item Interface
 * Matches backend ExerciseItem entity
 */
export interface ExerciseItem {
  id: UUID
  exercise_id: UUID
  item_type: ExerciseItemType
  display_order: number
  repetitions: number | null
  duration_seconds: number | null
  metadata: Record<string, unknown> | null
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

/**
 * Exercise Item List Response
 * Paginated response for GET /api/v1/exercise/items
 */
export interface ExerciseItemListResponse {
  items: ExerciseItem[]
  total: number
  limit: number
  offset: number
}

/**
 * Exercise Item Create/Update Payload
 */
export interface ExerciseItemPayload {
  exercise_id: UUID
  item_type: ExerciseItemType
  display_order: number
  repetitions?: number | null
  duration_seconds?: number | null
  metadata?: Record<string, unknown> | null
}

/**
 * Exercise Item List Parameters
 */
export interface ExerciseItemListParams {
  exercise_id?: UUID // Filter by parent exercise
  item_type?: ExerciseItemType // Filter by item type
  limit?: number
  offset?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Exercise Item Service
 * CRUD operations for exercise items
 */
class ExerciseItemService {
  private baseUrl = '/api/v1/exercise/items'

  /**
   * Get paginated list of exercise items
   *
   * @param params - Filter and pagination parameters
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<ExerciseItemListResponse>
   */
  async list(
    params?: ExerciseItemListParams,
    signal?: AbortSignal
  ): Promise<ExerciseItemListResponse> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    const apiParams: Record<string, string | number> = {}

    if (params?.limit) apiParams.limit = params.limit
    if (params?.offset) apiParams.offset = params.offset
    if (params?.exercise_id) apiParams.exercise_id = params.exercise_id
    if (params?.item_type) apiParams.item_type = params.item_type
    if (params?.sort_by) apiParams.sort_by = params.sort_by
    if (params?.sort_order) apiParams.sort_order = params.sort_order
    if ('search' in (params ?? {})) {
      apiParams.search = params!.search!
    }

    const response = await apiStore.get<ExerciseItemListResponse>(this.baseUrl, {
      params: apiParams,
      signal,
    })

    return response.data
  }

  /**
   * Get single exercise item by ID
   *
   * @param id - Exercise item UUID
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<ExerciseItem>
   */
  async get(id: UUID, signal?: AbortSignal): Promise<ExerciseItem> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    const response = await apiStore.get<ExerciseItem>(`${this.baseUrl}/${id}`, { signal })

    return response.data
  }

  /**
   * Create new exercise item
   *
   * @param payload - Exercise item data
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<ExerciseItem>
   */
  async create(payload: ExerciseItemPayload, signal?: AbortSignal): Promise<ExerciseItem> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    const response = await apiStore.post<ExerciseItem>(this.baseUrl, payload, signal)

    return response.data
  }

  /**
   * Update existing exercise item
   *
   * @param id - Exercise item UUID
   * @param payload - Exercise item update data
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<ExerciseItem>
   */
  async update(
    id: UUID,
    payload: Partial<ExerciseItemPayload>,
    signal?: AbortSignal
  ): Promise<ExerciseItem> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    const response = await apiStore.put<ExerciseItem>(`${this.baseUrl}/${id}`, payload, signal)

    return response.data
  }

  /**
   * Delete exercise item
   *
   * @param id - Exercise item UUID
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async delete(id: UUID, signal?: AbortSignal): Promise<void> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    await apiStore.delete(`${this.baseUrl}/${id}`, signal)
  }

  /**
   * Reorder exercise items
   * Updates display_order for multiple items at once
   *
   * @param items - Array of { id, display_order } objects
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async reorder(
    items: Array<{ id: UUID; display_order: number }>,
    signal?: AbortSignal
  ): Promise<void> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    await apiStore.post(`${this.baseUrl}/reorder`, { items }, signal)
  }

  /**
   * Bulk delete exercise items
   *
   * @param ids - Array of exercise item UUIDs to delete
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async bulkDelete(ids: UUID[], signal?: AbortSignal): Promise<void> {
    const apiStore = (await import('@/stores/api')).useApiStore()

    await apiStore.post(`${this.baseUrl}/bulk-delete`, { ids }, signal)
  }
}

// Export singleton instance
export const exerciseItemService = new ExerciseItemService()
