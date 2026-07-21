/**
 * Session Analysis Composable
 *
 * Provides reactive session analysis functionality for Vue components.
 * Handles analysis triggering, progress tracking, and WebSocket connection lifecycle.
 */

import { computed, onUnmounted, watch } from 'vue'
import { useSessionAnalysisStore } from '@/stores/sessionAnalysis'
import type { AnalysisProgress } from '@/api/sessionAnalysis/sessionAnalysis.types'

export interface UseSessionAnalysisOptions {
  sessionId: string
  autoConnect?: boolean
}

export function useSessionAnalysis(options: UseSessionAnalysisOptions) {
  const store = useSessionAnalysisStore()
  const { sessionId, autoConnect = false } = options

  // Reactive state - computed wraps store function calls to make them reactive
  const progress = computed<AnalysisProgress | null>(() => store.getProgress(sessionId))

  const isAnalyzing = computed<boolean>(() => store.isAnalyzing(sessionId))

  const progressPercentage = computed<number>(() => store.progressPercentage(sessionId))

  const isLoading = computed<boolean>(() => store.isLoading)
  const error = computed<string | null>(() => store.error)

  const hasErrors = computed<boolean>(() => (progress.value?.errors.length || 0) > 0)

  const isComplete = computed<boolean>(() => progress.value?.status === 'completed')

  const isFailed = computed<boolean>(() => progress.value?.status === 'failed')

  // Actions
  async function startAnalysis(): Promise<void> {
    await store.startAnalysis(sessionId)
  }

  async function refreshStatus(): Promise<void> {
    await store.fetchAnalysisStatus(sessionId)
  }

  function connectWebSocket(): void {
    store.connectWebSocket(sessionId)
  }

  function disconnectWebSocket(): void {
    store.disconnectWebSocket(sessionId)
  }

  function clearProgress(): void {
    store.clearProgress(sessionId)
  }

  function clearError(): void {
    store.clearError()
  }

  // Debug: Watch progress changes
  watch(
    progress,
    (newProgress) => {
      console.log(`[useSessionAnalysis] Progress updated for session ${sessionId}:`, newProgress)
    },
    { deep: true }
  )

  // Auto-connect WebSocket if requested
  if (autoConnect && progress.value?.status === 'running') {
    connectWebSocket()
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnectWebSocket()
  })

  return {
    // State
    progress,
    isAnalyzing,
    progressPercentage,
    isLoading,
    error,
    hasErrors,
    isComplete,
    isFailed,

    // Actions
    startAnalysis,
    refreshStatus,
    connectWebSocket,
    disconnectWebSocket,
    clearProgress,
    clearError,
  }
}
