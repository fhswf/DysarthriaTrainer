/**
 * Practice Sessions with Results API
 *
 * API client for retrieving practice sessions with their exercise results included.
 * This endpoint is more efficient than fetching sessions and results separately.
 *
 * @module api/practiceSession
 */

import { useApiStore } from '@/stores/api'

export interface SessionResult {
  id: string
  practice_session_id: string
  exercise_item_id: string
  iteration_number: number
  started_at: string
  completed_at: string
  duration_ms: number
  audio_file_id: string | null
  audio_segment_start_ms: number | null
  audio_segment_end_ms: number | null
  audio_duration_ms: number | null
  transcription: string | null
  transcription_confidence: number | null
  phoneme_analysis: Record<string, any> | null
  audio_quality_metrics: Record<string, any> | null
  analysis_parameters: Record<string, any>
  evaluation_results: Record<string, any>
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_error: string | null
  created_at: string
  updated_at: string
}

export interface PracticeSessionWithResults {
  id: string
  user_id: string
  exercise_id: string
  started_at: string
  completed_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  total_items: number
  completed_items: number
  session_audio_file_id: string | null
  recording_started_at: string | null
  recording_duration_ms: number | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  results: SessionResult[]
}

export interface SessionsWithResultsListParams {
  limit?: number
  offset?: number
  ordering?: string
  search?: string
  status_filter?: 'in_progress' | 'completed' | 'abandoned'
  created_at__gte?: string
  created_at__lte?: string
  completed_at__gte?: string
  completed_at__lte?: string
}

export interface SessionsWithResultsListResponse {
  results: PracticeSessionWithResults[]
  count: number
}

class PracticeSessionsWithResultsApi {
  public readonly baseUrl = '/api/v1/practice/sessions/with-results'

  private getApi() {
    return useApiStore()
  }

  /**
   * List sessions with their results included
   *
   * @param params - Query parameters for filtering
   * @param signal - AbortSignal for cancelling requests
   * @returns Paginated list of sessions with results
   *
   * @example
   * ```typescript
   * // List completed sessions
   * const response = await sessionsWithResultsApi.list({
   *   status_filter: 'completed',
   *   limit: 20,
   *   offset: 0
   * })
   * ```
   */
  async list(
    params?: SessionsWithResultsListParams,
    signal?: AbortSignal
  ): Promise<SessionsWithResultsListResponse> {
    const api = this.getApi()
    const response = await api.get<SessionsWithResultsListResponse>(this.baseUrl, {
      params,
      signal,
    })
    return response.data
  }

  /**
   * Get a single session with all results included
   *
   * @param sessionId - Session UUID
   * @param signal - AbortSignal for cancelling requests
   * @returns Session with all exercise results
   *
   * @example
   * ```typescript
   * // Get session with results
   * const session = await sessionsWithResultsApi.get('session-uuid-here')
   * console.log(session.results) // All exercise results
   * ```
   */
  async get(sessionId: string, signal?: AbortSignal): Promise<PracticeSessionWithResults> {
    const api = this.getApi()
    const response = await api.get<PracticeSessionWithResults>(
      `/api/v1/practice/sessions/${sessionId}/with-results`,
      { signal }
    )
    return response.data
  }

  /**
   * Delete a practice session and all associated data
   *
   * Deletes:
   * - The practice session record
   * - All exercise results for the session (cascade)
   * - Session audio file (if exists)
   * - Individual result audio files (if exist)
   *
   * @param sessionId - Session UUID to delete
   * @param signal - AbortSignal for cancelling requests
   * @returns void (204 No Content on success)
   *
   * @throws {Error} 404 if session not found
   * @throws {Error} 403 if not authorized to delete
   *
   * @example
   * ```typescript
   * // Delete a session
   * await sessionsWithResultsApi.delete('session-uuid-here')
   * ```
   */
  async delete(sessionId: string, signal?: AbortSignal): Promise<void> {
    const api = this.getApi()
    await api.delete(`/api/v1/practice/sessions/${sessionId}`, { signal })
  }
}

// Export singleton instance
export const sessionsWithResultsApi = new PracticeSessionsWithResultsApi()
