/**
 * Session Analysis Store
 *
 * Manages state for session-level AI analysis with real-time progress tracking.
 * Handles WebSocket connection, progress updates, and error collection.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionAnalysisApi } from '@/api/sessionAnalysis/sessionAnalysis.api'
import type {
  AnalysisProgress,
  AnalysisStatus,
  WebSocketProgressMessage,
} from '@/api/sessionAnalysis/sessionAnalysis.types'

export const useSessionAnalysisStore = defineStore('sessionAnalysis', () => {
  // State
  const analysisProgress = ref<Map<string, AnalysisProgress>>(new Map())
  const activeWebSockets = ref<Map<string, WebSocket>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  function getProgress(sessionId: string): AnalysisProgress | null {
    return analysisProgress.value.get(sessionId) || null
  }

  function isAnalyzing(sessionId: string): boolean {
    const progress = analysisProgress.value.get(sessionId)
    return progress?.status === 'running'
  }

  function progressPercentage(sessionId: string): number {
    const progress = analysisProgress.value.get(sessionId)
    return progress?.progress_percentage || 0
  }

  // Actions
  async function startAnalysis(sessionId: string): Promise<void> {
    try {
      console.log(`[SessionAnalysisStore] Starting analysis for session: ${sessionId}`)
      isLoading.value = true
      error.value = null

      // Start analysis via API
      console.log(`[SessionAnalysisStore] Calling API: POST /analyze/sessions/${sessionId}/analyze`)
      const response = await sessionAnalysisApi.startAnalysis(sessionId)
      console.log('[SessionAnalysisStore] API response:', response)

      // Initialize progress
      const initialProgress = {
        session_id: sessionId,
        status: response.status,
        total_results: 0,
        processed_results: 0,
        current_result_id: null,
        errors: [],
        started_at: Date.now() / 1000,
        completed_at: null,
        progress_percentage: 0,
      }
      analysisProgress.value = new Map(analysisProgress.value).set(sessionId, initialProgress)
      console.log('[SessionAnalysisStore] Initial progress state:', initialProgress)

      // Connect WebSocket for real-time updates
      console.log('[SessionAnalysisStore] Connecting WebSocket for real-time updates...')
      connectWebSocket(sessionId)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to start analysis'
      console.error('[SessionAnalysisStore] ❌ Failed to start analysis:', errorMsg)
      console.error('[SessionAnalysisStore] Full error:', err)
      error.value = errorMsg
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAnalysisStatus(sessionId: string): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const status = await sessionAnalysisApi.getAnalysisStatus(sessionId)
      console.log('[SessionAnalysisStore] Fetched analysis status:', status)

      analysisProgress.value = new Map(analysisProgress.value).set(sessionId, {
        ...status,
        progress_percentage: Math.round((status.processed_results / status.total_results) * 100),
        current_result_id: null, // Not provided by status endpoint
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Expected: No analysis found - clear local state silently
        // This is not an error - it just means no analysis has been started yet
        console.log('[SessionAnalysisStore] No active analysis found (expected on initial load)')
        const newMap = new Map(analysisProgress.value)
        newMap.delete(sessionId)
        analysisProgress.value = newMap
        // Don't set error state for 404 - it's expected when no analysis exists
      } else {
        // Actual error - log and set error state
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch status'
        console.error('[SessionAnalysisStore] Failed to fetch status:', errorMsg)
        error.value = errorMsg
      }
    } finally {
      isLoading.value = false
    }
  }

  function connectWebSocket(sessionId: string): void {
    // Close existing connection if any
    disconnectWebSocket(sessionId)

    const wsUrl = sessionAnalysisApi.getWebSocketUrl(sessionId)
    console.log(`[SessionAnalysisStore] Connecting to WebSocket: ${wsUrl}`)
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`[SessionAnalysisStore] ✅ WebSocket connected for session ${sessionId}`)
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketProgressMessage = JSON.parse(event.data)
        console.log(`[SessionAnalysisStore] WebSocket message received:`, message)

        if (message.type === 'analysis_progress' || message.type === 'analysis_complete') {
          // Calculate progress percentage if not provided
          const progressData: AnalysisProgress = {
            session_id: message.session_id,
            status: message.status,
            total_results: message.total_results,
            processed_results: message.processed_results,
            current_result_id: message.current_result_id,
            errors: message.errors,
            started_at: message.started_at,
            completed_at: message.completed_at,
            progress_percentage:
              message.progress_percentage ||
              (message.total_results > 0
                ? Math.round((message.processed_results / message.total_results) * 100)
                : 0),
          }

          analysisProgress.value = new Map(analysisProgress.value).set(sessionId, progressData)
          console.log(
            `[SessionAnalysisStore] Progress updated: ${progressData.processed_results}/${progressData.total_results} (${progressData.progress_percentage}%)`
          )

          if (message.type === 'analysis_complete') {
            console.log('[SessionAnalysisStore] ✅ Analysis complete - closing WebSocket')
            // Close WebSocket when complete
            disconnectWebSocket(sessionId)
          }
        } else if (message.type === 'analysis_error') {
          console.error('[SessionAnalysisStore] ❌ WebSocket error message:', message)
          error.value = 'Analysis encountered errors'
        }
      } catch (err) {
        console.error('[SessionAnalysisStore] Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (event) => {
      console.error('[SessionAnalysis] WebSocket error:', event)
      error.value = 'WebSocket connection failed'
    }

    ws.onclose = () => {
      console.log(`[SessionAnalysis] WebSocket closed for session ${sessionId}`)
      const newMap = new Map(activeWebSockets.value)
      newMap.delete(sessionId)
      activeWebSockets.value = newMap
    }

    activeWebSockets.value = new Map(activeWebSockets.value).set(sessionId, ws)
  }

  function disconnectWebSocket(sessionId: string): void {
    const ws = activeWebSockets.value.get(sessionId)
    if (ws) {
      ws.close()
      const newMap = new Map(activeWebSockets.value)
      newMap.delete(sessionId)
      activeWebSockets.value = newMap
    }
  }

  function clearProgress(sessionId: string): void {
    const newMap = new Map(analysisProgress.value)
    newMap.delete(sessionId)
    analysisProgress.value = newMap
    disconnectWebSocket(sessionId)
  }

  function clearError(): void {
    error.value = null
  }

  // Cleanup on store disposal
  function $dispose(): void {
    // Close all WebSocket connections
    activeWebSockets.value.forEach((ws) => ws.close())
    activeWebSockets.value = new Map()
    analysisProgress.value = new Map()
  }

  return {
    // State
    analysisProgress,
    isLoading,
    error,

    // Computed
    getProgress,
    isAnalyzing,
    progressPercentage,

    // Actions
    startAnalysis,
    fetchAnalysisStatus,
    connectWebSocket,
    disconnectWebSocket,
    clearProgress,
    clearError,

    // Lifecycle
    $dispose,
  }
})
