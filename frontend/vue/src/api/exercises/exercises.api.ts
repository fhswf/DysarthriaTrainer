/**
 * Exercises API
 *
 * API client for exercise CRUD operations.
 * Follows the resource-based API pattern established in /src/api/
 *
 * @module api/exercises
 */

import { useApiStore } from '@/stores/api'
import type {
  Exercise,
  ExerciseDetail,
  ExerciseCreateDto,
  ExerciseUpdateDto,
  ExerciseVersionCreateDto,
  ExerciseListResponse,
  ExerciseListParams,
  ExerciseDetailParams,
} from './exercises.types'

class ExercisesApi {
  private readonly baseUrl = '/api/v1/exercise/exercises'

  private getApi() {
    return useApiStore()
  }

  /**
   * List exercises with pagination and filtering
   *
   * @param params - Query parameters for filtering
   * @param signal - AbortSignal for cancelling requests
   * @param useCache - Whether to use cached results (default: false for filtered lists)
   * @returns Paginated list of exercises
   *
   * @example
   * ```typescript
   * // List all exercises
   * const response = await exercisesApi.list()
   *
   * // List exercises for a specific category with search
   * const response = await exercisesApi.list({
   *   category_id: '123',
   *   active_only: true,
   *   search: 'breathing',
   *   offset: 0,
   *   limit: 20
   * })
   * ```
   */
  async list(
    params?: ExerciseListParams,
    signal?: AbortSignal,
    useCache: boolean = false
  ): Promise<ExerciseListResponse> {
    const api = this.getApi()
    const response = await api.get<ExerciseListResponse>(this.baseUrl, { params, signal, useCache })
    return response.data
  }

  /**
   * Get a single exercise by ID
   *
   * @param id - Exercise UUID
   * @param params - Query parameters for loading relations
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise details with optional relations
   *
   * @example
   * ```typescript
   * // Get exercise with all relations
   * const exercise = await exercisesApi.getById('123', {
   *   load_instructions: true,
   *   load_items: true,
   *   language: 'de'
   * })
   * ```
   */
  async getById(
    id: string,
    params?: ExerciseDetailParams,
    signal?: AbortSignal
  ): Promise<ExerciseDetail> {
    const api = this.getApi()
    const response = await api.get<ExerciseDetail>(`${this.baseUrl}/${id}`, { params, signal })
    return response.data
  }

  /**
   * Get exercise by exercise code (e.g., "LT001")
   *
   * @param code - Exercise code
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise details
   *
   * @example
   * ```typescript
   * const exercise = await exercisesApi.getByCode('LT001')
   * ```
   */
  async getByCode(code: string, signal?: AbortSignal): Promise<ExerciseDetail> {
    const api = this.getApi()
    const response = await api.get<ExerciseDetail>(`${this.baseUrl}/code/${code}`, { signal })
    return response.data
  }

  /**
   * Create a new exercise
   *
   * @param data - Exercise creation payload
   * @returns Created exercise
   *
   * @example
   * ```typescript
   * const exercise = await exercisesApi.create({
   *   category_id: '123',
   *   code: 'LT001',
   *   title: 'Lippenbewegung Übung',
   *   difficulty_level: 'beginner',
   *   is_active: true
   * })
   * ```
   */
  async create(data: ExerciseCreateDto): Promise<Exercise> {
    const api = this.getApi()
    const response = await api.post<Exercise>(this.baseUrl, data)
    return response.data
  }

  /**
   * Update an existing exercise
   *
   * @param id - Exercise UUID
   * @param data - Exercise update payload
   * @returns Updated exercise
   *
   * @example
   * ```typescript
   * const exercise = await exercisesApi.update('123', {
   *   title: 'Updated Title',
   *   difficulty_level: 'intermediate'
   * })
   * ```
   */
  async update(id: string, data: ExerciseUpdateDto): Promise<Exercise> {
    const api = this.getApi()
    const response = await api.patch<Exercise>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Delete an exercise (soft delete)
   *
   * @param id - Exercise UUID
   *
   * @example
   * ```typescript
   * await exercisesApi.delete('123')
   * ```
   */
  async delete(id: string): Promise<void> {
    const api = this.getApi()
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Get exercise with all items (convenience method)
   *
   * @param id - Exercise UUID
   * @param language - Language code for items (default: 'de')
   * @param signal - AbortSignal for cancelling requests
   * @returns Exercise with items
   *
   * @example
   * ```typescript
   * const exercise = await exercisesApi.getWithItems('123', 'de')
   * ```
   */
  async getWithItems(
    id: string,
    language: string = 'de',
    signal?: AbortSignal
  ): Promise<ExerciseDetail> {
    return this.getById(
      id,
      {
        load_instructions: true,
        load_items: true,
        language,
      },
      signal
    )
  }

  /**
   * Get exercise version history by code
   *
   * @param code - Exercise code (e.g., "LT001")
   * @param signal - AbortSignal for cancelling requests
   * @returns Array of all versions for this exercise code
   *
   * @example
   * ```typescript
   * const versions = await exercisesApi.getVersions('LT001')
   * // Returns all versions, ordered by version number
   * ```
   */
  async getVersions(code: string, signal?: AbortSignal): Promise<Exercise[]> {
    const api = this.getApi()
    const response = await api.get<Exercise[]>(`${this.baseUrl}/code/${code}/versions`, { signal })
    return response.data
  }

  /**
   * Get the first available exercise
   *
   * Returns the first active exercise from the list, useful for "Continue Training" feature.
   * In future, this could be enhanced to return the user's last unfinished exercise.
   *
   * @param signal - AbortSignal for cancelling requests
   * @returns First exercise or null if none available
   *
   * @example
   * ```typescript
   * const firstExercise = await exercisesApi.getFirstExercise()
   * if (firstExercise) {
   *   router.push(`/exercise-practice?id=${firstExercise.id}`)
   * }
   * ```
   */
  async getFirstExercise(signal?: AbortSignal): Promise<Exercise | null> {
    const response = await this.list({ limit: 1, active_only: true }, signal)
    return response.results.length > 0 ? response.results[0] : null
  }

  /**
   * Create a new version of an exercise
   *
   * Creates a new version with incremented version number.
   * The old version is marked as superseded.
   *
   * @param id - Exercise UUID to create new version from
   * @param data - Changes for the new version
   * @returns Created exercise (new version)
   *
   * @example
   * ```typescript
   * const newVersion = await exercisesApi.createVersion('123', {
   *   title: 'Updated Title',
   *   description: 'Improved with new techniques',
   *   difficulty_level: 'intermediate'
   * })
   * ```
   */
  async createVersion(id: string, data: ExerciseVersionCreateDto): Promise<Exercise> {
    const api = this.getApi()
    const response = await api.post<Exercise>(`${this.baseUrl}/${id}/versions`, data)
    return response.data
  }
}

// Export singleton instance
export const exercisesApi = new ExercisesApi()
