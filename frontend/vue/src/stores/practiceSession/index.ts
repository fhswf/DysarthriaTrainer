/**
 * Practice Session Store
 *
 * Manages practice session lifecycle, continuous recording state,
 * and exercise item tracking with timestamps.
 *
 * Key Features:
 * - Session lifecycle management (create, complete, abandon)
 * - Continuous recording with timestamp tracking
 * - Exercise item navigation
 * - Result management
 * - Audio upload handling
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useApiStore } from '@/stores/api'
import { useMessagingStore } from '@/stores/messaging'
import { useLocalizationStore } from '@/stores/localization'
import type {
  PracticeSession,
  ExerciseResult,
  ItemTimestamp,
  Exercise,
  ExerciseItem,
} from './types'

export const usePracticeSessionStore = defineStore('practiceSession', () => {
  // ===== SERVICE STORES =====
  const api = useApiStore()
  const messaging = useMessagingStore()
  const loc = useLocalizationStore()

  // ===== STATE =====

  // Session
  const currentSession = ref<PracticeSession | null>(null)
  const exercise = ref<Exercise | null>(null)
  const exerciseItems = ref<ExerciseItem[]>([])

  // Navigation
  const currentItemIndex = ref(0)
  const completedItemIds = ref(new Set<string>())

  // Recording
  const isRecording = ref(false)
  const recordingStartTime = ref<number | null>(null)
  const recordingStartedAt = ref<Date | null>(null)
  const currentResultItemStart = ref<number | null>(null) // Track when current item started

  // Timestamps
  const timestamps = ref<ItemTimestamp[]>([])
  const lastTimestamp = ref(0)

  // Results
  const results = ref(new Map<string, ExerciseResult>())
  const pendingResults = ref<string[]>([])

  // Upload
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const uploadError = ref<string | null>(null)

  // UI
  const showQualityFeedback = ref(false)
  const showWaveform = ref(false)

  // ===== GETTERS =====

  const currentItem = computed(() => {
    if (currentItemIndex.value < 0 || currentItemIndex.value >= exerciseItems.value.length) {
      return null
    }
    return exerciseItems.value[currentItemIndex.value]
  })

  const currentIteration = computed(() => {
    if (!currentItem.value) return 1

    // Count how many times this item has been completed
    const itemCompletions = timestamps.value.filter(
      (t) => t.exerciseItemId === currentItem.value!.id
    ).length

    return itemCompletions + 1
  })

  const isFirstItem = computed(() => currentItemIndex.value === 0)

  const isLastItem = computed(() => currentItemIndex.value === exerciseItems.value.length - 1)

  const totalItems = computed(() =>
    exerciseItems.value.reduce((sum, item) => sum + item.repeatCount, 0)
  )

  const completedItemsCount = computed(() => results.value.size)

  const progressPercentage = computed(() => {
    if (totalItems.value === 0) return 0
    return Math.round((completedItemsCount.value / totalItems.value) * 100)
  })

  const canNavigateBack = computed(() => currentItemIndex.value > 0)

  const canNavigateNext = computed(() => {
    if (!currentItem.value) return false

    // Check if current item has been practiced the required number of times
    const itemTimestamps = timestamps.value.filter(
      (t) => t.exerciseItemId === currentItem.value!.id
    )
    const hasResult = itemTimestamps.length >= currentItem.value.repeatCount

    return hasResult && !isLastItem.value
  })

  const sessionDuration = computed(() => {
    if (!currentSession.value) return 0
    const end = currentSession.value.completedAt || new Date()
    return end.getTime() - currentSession.value.startedAt.getTime()
  })

  // ===== ACTIONS =====

  // Session Management

  // Flag to prevent concurrent session creation
  let isCreatingSession = false

  async function startSession(exerciseId: string, exerciseData: Exercise, totalItems: number) {
    try {
      // Prevent creating duplicate sessions
      if (currentSession.value) {
        console.warn(
          '[Session Store] Session already exists, skipping creation:',
          currentSession.value.id
        )
        return currentSession.value
      }

      // Prevent concurrent session creation
      if (isCreatingSession) {
        console.warn('[Session Store] Session creation already in progress, waiting...')
        // Wait for the ongoing creation to complete
        while (isCreatingSession) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        // Return the session that was created
        if (currentSession.value) {
          return currentSession.value
        }
      }

      isCreatingSession = true
      exercise.value = exerciseData
      exerciseItems.value = [] // Will be loaded from API

      console.log('[Session Store] startSession called with:', {
        exerciseId,
        totalItems,
        exerciseItemCount: exerciseData.items?.length,
      })

      const requestBody = {
        exercise_id: exerciseId,
        total_items: totalItems,
        metadata: {},
      }

      console.log('[Session Store] Sending POST request with body:', requestBody)

      const response = await api.post('/api/v1/practice/sessions', requestBody)

      console.log('[Session Store] Response received:', response)

      // Extract data from response
      const sessionData = response.data || response

      currentSession.value = {
        ...sessionData,
        startedAt: new Date(sessionData.started_at),
        completedAt: sessionData.completed_at ? new Date(sessionData.completed_at) : null,
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
      }

      console.log('[Session Store] Current session set:', currentSession.value)

      // Reset state
      currentItemIndex.value = 0
      completedItemIds.value = new Set()
      timestamps.value = []
      results.value = new Map()
      pendingResults.value = []

      void messaging.success(loc.t('session.feedback.sessionStarted'))

      return currentSession.value
    } catch (error) {
      void messaging.error(loc.t('session.errors.startFailed'))
      throw error
    } finally {
      isCreatingSession = false
    }
  }

  async function completeSession(audioBlob: Blob) {
    if (!currentSession.value) {
      throw new Error('No active session')
    }

    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Session Store] Invalid audio blob:', audioBlob)
      throw new Error('Invalid or empty audio blob')
    }

    try {
      isUploading.value = true
      uploadError.value = null
      uploadProgress.value = 0

      console.log('[Session Store] completeSession called with blob:', {
        size: audioBlob?.size,
        type: audioBlob?.type,
        isBlob: audioBlob instanceof Blob,
      })

      // Upload audio file
      const formData = new FormData()
      formData.append('file', audioBlob, 'session.webm')
      formData.append(
        'metadata',
        JSON.stringify({
          session_id: currentSession.value.id,
          duration_ms: recordingStartTime.value ? Date.now() - recordingStartTime.value : 0,
        })
      )

      console.log('[Session Store] FormData created, uploading...')

      const mediaFile = await api.post('/api/v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        },
      })

      const mediaFileData = mediaFile.data || mediaFile
      console.log('[Session Store] Media file uploaded:', mediaFileData.id)

      // Get results from local store (already created during session)
      console.log('[Session Store] Current results Map size:', results.value.size)
      console.log('[Session Store] Results in Map:', Array.from(results.value.keys()))
      const sessionResults = Array.from(results.value.values())

      // If no results in store, try fetching from API
      if (sessionResults.length === 0) {
        console.log('[Session Store] No results in local store, fetching from API...')
        const fetchedResults = await fetchSessionResults()
        console.log('[Session Store] Fetched results from API:', fetchedResults.length)
        sessionResults.push(...fetchedResults)
      }

      // Total items = total result count (all iterations)
      // Completed items = number of results created (all completed if session finished)
      const totalItems = sessionResults.length
      const completedItems = sessionResults.length
      const uniqueItemIds = new Set(sessionResults.map((r) => r.exerciseItemId))

      console.log('[Session Store] Session metrics:', {
        totalResults: sessionResults.length,
        totalItems,
        completedItems,
        uniqueExerciseItems: uniqueItemIds.size,
        uniqueItems: Array.from(uniqueItemIds),
      })

      // Complete session with audio reference and metrics
      const durationMs = recordingStartTime.value ? Date.now() - recordingStartTime.value : 0

      await api.put(`/api/v1/practice/sessions/${currentSession.value.id}/complete`, {
        audio_file_id: mediaFileData.id,
        recording_duration_ms: durationMs,
        total_items: totalItems,
        completed_items: completedItems,
      })

      console.log('[Session Store] Session completion API call successful')

      // Update results with audio file reference using attach-audio-segment endpoint
      console.log('[Session Store] Updating', sessionResults.length, 'results with audio_file_id')
      for (const result of sessionResults) {
        try {
          await api.put(`/api/v1/practice/results/${result.id}/audio-segment`, {
            audio_file_id: mediaFileData.id,
            start_ms: result.audioSegmentStartMs,
            end_ms: result.audioSegmentEndMs,
          })
          console.log('[Session Store] Updated result', result.id, 'with audio segment')
        } catch (error) {
          console.error('[Session Store] Failed to update result', result.id, ':', error)
        }
      }

      currentSession.value.status = 'completed'
      currentSession.value.completedAt = new Date()
      currentSession.value.sessionAudioFileId = mediaFileData.id
      currentSession.value.recordingDurationMs = durationMs
      currentSession.value.totalItems = totalItems
      currentSession.value.completedItems = completedItems

      console.log('[Session Store] Session completed successfully')
      void messaging.success(loc.t('session.completedSuccessfully'))
    } catch (error) {
      uploadError.value = error instanceof Error ? error.message : 'Upload failed'
      void messaging.error(loc.t('session.completionFailed'))
      throw error
    } finally {
      isUploading.value = false
    }
  }

  async function abandonSession() {
    if (!currentSession.value) return

    try {
      await api.put(`/api/v1/practice/sessions/${currentSession.value.id}/abandon`)

      currentSession.value.status = 'abandoned'
      void messaging.success(loc.t('session.feedback.sessionAbandoned'))

      resetSession()
    } catch (error) {
      void messaging.error(loc.t('session.errors.sessionAbandonFailed'))
      throw error
    }
  }

  // Recording

  async function startRecording() {
    if (!currentSession.value) {
      throw new Error('No active session')
    }

    try {
      recordingStartTime.value = Date.now()
      recordingStartedAt.value = new Date()
      currentResultItemStart.value = recordingStartTime.value // First item starts with recording
      isRecording.value = true

      await api.put(`/api/v1/practice/sessions/${currentSession.value.id}/start-recording`, {
        recording_timestamp: recordingStartedAt.value.toISOString(),
      })

      currentSession.value.recordingStartedAt = recordingStartedAt.value

      console.log('[Session] Recording started:', {
        recordingStartTime: recordingStartTime.value,
        currentResultItemStart: currentResultItemStart.value,
      })
    } catch (error) {
      isRecording.value = false
      recordingStartTime.value = null
      recordingStartedAt.value = null
      currentResultItemStart.value = null
      void messaging.error(loc.t('recording.startFailed'))
      throw error
    }
  }

  function stopRecording() {
    isRecording.value = false
    currentResultItemStart.value = null
    // Recording blob is handled by composable
  }

  function markItemTimestamp(itemId: string, itemText: string, iteration: number) {
    if (!recordingStartTime.value) {
      console.warn('Cannot mark timestamp: recording not started')
      return
    }

    const now = new Date()
    const elapsedMs = now.getTime() - recordingStartTime.value

    // For the first item, startedAt should be the recording start time
    // For subsequent items, startedAt should be when the previous item completed
    const itemStartedAt = lastTimestamp.value
      ? new Date(recordingStartTime.value + lastTimestamp.value)
      : recordingStartedAt.value!

    const timestamp: ItemTimestamp = {
      id: `${itemId}-${iteration}-${Date.now()}`,
      exerciseItemId: itemId,
      itemText,
      iteration,
      timestamp: elapsedMs,
      // startedAt: when this item's recording began
      startedAt: itemStartedAt,
      // completedAt: when we mark this timestamp (should be AFTER startedAt)
      // For safety, ensure completedAt is never before startedAt
      completedAt:
        now.getTime() > itemStartedAt.getTime() ? now : new Date(itemStartedAt.getTime() + 1),
    }

    timestamps.value = [...timestamps.value, timestamp]
    lastTimestamp.value = timestamp.timestamp
  }

  // Navigation

  function nextItem() {
    if (!canNavigateNext.value) return

    currentItemIndex.value++
  }

  function previousItem() {
    if (!canNavigateBack.value) return

    currentItemIndex.value--
  }

  function goToItem(index: number) {
    if (index < 0 || index >= exerciseItems.value.length) return

    currentItemIndex.value = index
  }

  // Results

  async function createResult(
    itemId: string,
    iteration: number,
    completedAtTimestamp?: number
  ): Promise<ExerciseResult> {
    if (!currentSession.value) {
      throw new Error('No active session')
    }

    if (!recordingStartTime.value || !currentResultItemStart.value) {
      throw new Error('Recording timing not initialized')
    }

    // Calculate timing based on workflow specification
    // Use provided timestamp or current time (for final item)
    const completedAtMs = completedAtTimestamp ?? Date.now()
    const startedAt = new Date(currentResultItemStart.value)
    const completedAt = new Date(completedAtMs)

    // Audio segment timing: relative to recording start
    const audioSegmentStartMs = currentResultItemStart.value - recordingStartTime.value
    const audioSegmentEndMs = completedAtMs - recordingStartTime.value
    const durationMs = audioSegmentEndMs - audioSegmentStartMs

    console.log('[Session] Creating result:', {
      itemId,
      iteration,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      audioSegmentStartMs,
      audioSegmentEndMs,
      durationMs,
    })

    try {
      const response = await api.post('/api/v1/practice/results', {
        practice_session_id: currentSession.value.id,
        exercise_item_id: itemId,
        iteration_number: iteration,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        audio_segment_start_ms: audioSegmentStartMs,
        audio_segment_end_ms: audioSegmentEndMs,
        metadata: {},
      })

      const resultData = response.data || response

      const result: ExerciseResult = {
        id: resultData.id,
        practiceSessionId: resultData.practice_session_id,
        exerciseItemId: resultData.exercise_item_id,
        iterationNumber: resultData.iteration_number,
        startedAt: new Date(resultData.started_at),
        completedAt: new Date(resultData.completed_at),
        durationMs: resultData.duration_ms,
        audioFileId: resultData.audio_file_id,
        audioSegmentStartMs: resultData.audio_segment_start_ms,
        audioSegmentEndMs: resultData.audio_segment_end_ms,
        audioDurationMs: resultData.audio_duration_ms,
        transcription: resultData.transcription,
        transcriptionConfidence: resultData.transcription_confidence,
        phonemeAnalysis: resultData.phoneme_analysis,
        audioQualityMetrics: resultData.audio_quality_metrics,
        analysisParameters: resultData.analysis_parameters,
        evaluationResults: resultData.evaluation_results,
        processingStatus: resultData.processing_status,
        processingError: resultData.processing_error,
        createdAt: new Date(resultData.created_at),
        updatedAt: new Date(resultData.updated_at),
      }

      results.value.set(result.id, result)
      completedItemIds.value.add(itemId)

      return result
    } catch (error) {
      console.error('[Session Store] createResult failed:', error)
      void messaging.error(loc.t('errors.resultCreationFailed'))
      throw error
    }
  }

  function startNextItem(startTimestamp?: number) {
    // Mark the start time for the next item
    // Use provided timestamp (end of previous item) or current time
    currentResultItemStart.value = startTimestamp ?? Date.now()
    console.log('[Session] Started next item at:', currentResultItemStart.value)
  }

  async function fetchSessionResults(): Promise<ExerciseResult[]> {
    if (!currentSession.value) return []

    try {
      const response = await api.get(`/api/v1/practice/results/session/${currentSession.value.id}`)

      const responseData = response.data || response
      const resultsArray = Array.isArray(responseData) ? responseData : []

      const fetchedResults: ExerciseResult[] = resultsArray.map((r: any) => ({
        ...r,
        startedAt: new Date(r.started_at),
        completedAt: new Date(r.completed_at),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }))

      // Update results map
      fetchedResults.forEach((result) => {
        results.value.set(result.id, result)
      })

      return fetchedResults
    } catch (error) {
      void messaging.error(loc.t('errors.fetchResultsFailed'))
      throw error
    }
  }

  // Utility

  function resetSession() {
    currentSession.value = null
    exercise.value = null
    exerciseItems.value = []
    currentItemIndex.value = 0
    completedItemIds.value = new Set()
    isRecording.value = false
    recordingStartTime.value = null
    recordingStartedAt.value = null
    currentResultItemStart.value = null
    timestamps.value = []
    lastTimestamp.value = 0
    results.value = new Map()
    pendingResults.value = []
    isUploading.value = false
    uploadProgress.value = 0
    uploadError.value = null
    showQualityFeedback.value = false
    showWaveform.value = false
  }

  // ===== RETURN =====

  return {
    // State
    currentSession,
    exercise,
    exerciseItems,
    currentItemIndex,
    completedItemIds,
    isRecording,
    recordingStartTime,
    recordingStartedAt,
    timestamps,
    lastTimestamp,
    results,
    pendingResults,
    isUploading,
    uploadProgress,
    uploadError,
    showQualityFeedback,
    showWaveform,

    // Getters
    currentItem,
    currentIteration,
    isFirstItem,
    isLastItem,
    totalItems,
    completedItemsCount,
    progressPercentage,
    canNavigateBack,
    canNavigateNext,
    sessionDuration,

    // Actions
    startSession,
    completeSession,
    abandonSession,
    startRecording,
    stopRecording,
    markItemTimestamp,
    nextItem,
    previousItem,
    goToItem,
    createResult,
    startNextItem,
    fetchSessionResults,
    resetSession,
  }
})
