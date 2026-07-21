/**
 * Library Items API Client
 *
 * Type-safe API client for library item CRUD operations.
 * Wraps the API service store for library-item-specific endpoints.
 *
 * Library items are reusable exercise content that can be attached to multiple exercises.
 *
 * @module api/exercises
 */

import { useApiStore } from '@/stores/api'
import type {
  LibraryItem,
  LibraryItemCreate,
  LibraryItemUpdate,
  LibraryItemListParams,
  LibraryItemListResponse,
  LibraryItemType,
  DuplicateItemOptions,
  AttachLibraryItemRequest,
} from './library-items.types'

class LibraryItemsApi {
  private readonly baseUrl = '/api/v1/exercise/items/library'

  /**
   * Get API store instance (getter pattern for lazy access)
   */
  private getApi() {
    return useApiStore()
  }

  /**
   * List all library items with pagination and filtering
   *
   * ⚠️ CRITICAL: Must accept signal parameter for race condition prevention
   *
   * @param params - Query parameters (limit, offset, ordering, search, filters)
   * @param signal - AbortSignal for request cancellation
   * @returns Paginated list of library items
   *
   * @example
   * ```typescript
   * const response = await libraryItemsApi.list({
   *   limit: 20,
   *   offset: 0,
   *   item_type: 'movement',
   *   language: 'de',
   *   search: 'mund',
   * })
   * ```
   */
  async list(
    params?: LibraryItemListParams,
    signal?: AbortSignal
  ): Promise<LibraryItemListResponse> {
    const api = this.getApi()
    const response = await api.get<LibraryItemListResponse>(this.baseUrl, {
      params,
      signal,
      useCache: true,
      cacheTimeout: 30000, // 30 seconds
    })
    return response.data
  }

  /**
   * Get a single library item by ID
   *
   * Includes all contents (multi-language) and instruction reference.
   *
   * @param id - Library item UUID
   * @returns Complete library item with contents
   * @throws 404 if item not found
   *
   * @example
   * ```typescript
   * const item = await libraryItemsApi.getById('123e4567-...')
   * ```
   */
  async getById(id: string, signal?: AbortSignal): Promise<LibraryItem> {
    const api = this.getApi()
    const response = await api.get<LibraryItem>(`${this.baseUrl}/${id}`, {
      signal,
      useCache: true,
      cacheTimeout: 30000,
    })
    return response.data
  }

  /**
   * Create a new library item
   *
   * @param data - Library item creation payload
   * @returns Created library item with generated ID
   * @throws 422 if validation fails
   *
   * @example
   * ```typescript
   * const newItem = await libraryItemsApi.create({
   *   item_type: 'movement',
   *   repetitions: 3,
   *   contents: [
   *     { language: 'de', text_content: 'Mund öffnen' },
   *     { language: 'en', text_content: 'Open mouth' },
   *   ],
   * })
   * ```
   */
  async create(data: LibraryItemCreate): Promise<LibraryItem> {
    const api = this.getApi()
    const response = await api.post<LibraryItem>(this.baseUrl, data)
    return response.data
  }

  /**
   * Update an existing library item (partial update)
   *
   * Note: Backend uses PATCH for partial updates
   *
   * @param id - Library item UUID
   * @param data - Fields to update (all optional)
   * @returns Updated library item
   * @throws 404 if item not found
   * @throws 422 if validation fails
   *
   * @example
   * ```typescript
   * const updated = await libraryItemsApi.update('123e4567-...', {
   *   repetitions: 5,
   *   metadata: { difficulty: 'hard' },
   * })
   * ```
   */
  async update(id: string, data: LibraryItemUpdate): Promise<LibraryItem> {
    const api = this.getApi()
    const response = await api.patch<LibraryItem>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Delete a library item (soft delete)
   *
   * @param id - Library item UUID
   * @throws 404 if item not found
   * @throws 403 if user lacks permission
   *
   * @example
   * ```typescript
   * await libraryItemsApi.delete('123e4567-...')
   * ```
   */
  async delete(id: string): Promise<void> {
    const api = this.getApi()
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Duplicate a library item
   *
   * Can create duplicate as:
   * - Another library item (for variations)
   * - Exercise-specific item (attached to exercise)
   *
   * @param id - Source library item UUID
   * @param options - Duplication options
   * @returns Newly created duplicate item
   * @throws 404 if source item not found
   *
   * @example
   * ```typescript
   * // Duplicate as library item
   * const duplicate = await libraryItemsApi.duplicate('123e4567-...', {
   *   as_library_item: true,
   * })
   *
   * // Duplicate as exercise item
   * const exerciseItem = await libraryItemsApi.duplicate('123e4567-...', {
   *   as_library_item: false,
   *   exercise_id: '456e7890-...',
   * })
   * ```
   */
  async duplicate(id: string, options: DuplicateItemOptions): Promise<LibraryItem> {
    const api = this.getApi()
    // Note: Uses different endpoint pattern (not under /library)
    const duplicateUrl = `/api/v1/exercise/items/${id}/duplicate`
    const response = await api.post<LibraryItem>(duplicateUrl, options)
    return response.data
  }

  /**
   * Attach library item to an exercise
   *
   * Creates a copy of the library item linked to the exercise.
   * The original library item remains unchanged and reusable.
   *
   * @param id - Library item UUID
   * @param request - Attachment details (exercise_id, display_order)
   * @returns Attached item (now linked to exercise)
   * @throws 404 if library item or exercise not found
   *
   * @example
   * ```typescript
   * await libraryItemsApi.attachToExercise('123e4567-...', {
   *   exercise_id: '456e7890-...',
   *   display_order: 5,
   * })
   * ```
   */
  async attachToExercise(id: string, request: AttachLibraryItemRequest): Promise<void> {
    const api = this.getApi()
    const attachUrl = `${this.baseUrl}/${id}/attach`
    await api.post(attachUrl, request)
  }

  /**
   * Search library items by text content
   *
   * Convenience method for full-text search across all contents.
   *
   * @param query - Search query string
   * @param signal - AbortSignal for cancellation
   * @returns Matching items
   *
   * @example
   * ```typescript
   * const results = await libraryItemsApi.search('mund öffnen')
   * ```
   */
  async search(query: string, signal?: AbortSignal): Promise<LibraryItemListResponse> {
    return this.list({ search: query, limit: 50 }, signal)
  }

  /**
   * Get library items by type
   *
   * @param itemType - Item type to filter by
   * @param signal - AbortSignal for cancellation
   * @returns Filtered items
   *
   * @example
   * ```typescript
   * const movements = await libraryItemsApi.getByType('movement')
   * ```
   */
  async getByType(itemType: string, signal?: AbortSignal): Promise<LibraryItemListResponse> {
    return this.list({ item_type: itemType as LibraryItemType, limit: 100 }, signal)
  }

  /**
   * Get library items by language
   *
   * @param language - Language code (ISO 639-1)
   * @param signal - AbortSignal for cancellation
   * @returns Items with content in specified language
   *
   * @example
   * ```typescript
   * const germanItems = await libraryItemsApi.getByLanguage('de')
   * ```
   */
  async getByLanguage(language: string, signal?: AbortSignal): Promise<LibraryItemListResponse> {
    return this.list({ language, limit: 100 }, signal)
  }
}

/**
 * Singleton instance - export and use throughout the application
 *
 * @example
 * ```typescript
 * import { libraryItemsApi } from '@/api/exercises'
 *
 * const items = await libraryItemsApi.list()
 * ```
 */
export const libraryItemsApi = new LibraryItemsApi()
