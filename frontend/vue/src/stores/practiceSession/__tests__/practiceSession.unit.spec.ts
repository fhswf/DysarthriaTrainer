import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePracticeSessionStore } from '../index'
import { useApiStore } from '@/stores/api'
import { useMessagingStore } from '@/stores/messaging'
import { useLocalizationStore } from '@/stores/localization'

vi.mock('@/stores/api', () => ({
  useApiStore: vi.fn(() => ({
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  })),
}))
vi.mock('@/stores/messaging', () => ({
  useMessagingStore: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  })),
}))
vi.mock('@/stores/localization', () => ({
  useLocalizationStore: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

describe('practiceSession store', () => {
  let store: ReturnType<typeof usePracticeSessionStore>

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = usePracticeSessionStore()
  })

  it('initializes with default state', () => {
    expect(store.currentSession).toBeNull()
    expect(store.exercise).toBeNull()
    expect(store.exerciseItems).toEqual([])
    expect(store.currentItemIndex).toBe(0)
    expect(store.isRecording).toBe(false)
    expect(store.timestamps).toEqual([])
    expect(store.results.size).toBe(0)
  })

  it('resets session state', () => {
    store.currentSession = {
      id: 'abc',
      userId: 'u',
      exerciseId: 'e',
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalItems: 1,
      completedItems: 0,
      metadata: {},
    }
    store.exercise = { id: 'e', name: 'Test', items: [], repeatCount: 1, metadata: {} }
    store.exerciseItems = [{ id: 'item1', text: 'foo', repeatCount: 1, metadata: {} }]
    store.currentItemIndex = 1
    store.isRecording = true
    store.timestamps = [
      {
        id: 't',
        exerciseItemId: 'item1',
        itemText: 'foo',
        iteration: 1,
        timestamp: 0,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    ]
    store.results.set('r', {
      id: 'r',
      practiceSessionId: 'abc',
      exerciseItemId: 'item1',
      iterationNumber: 1,
      startedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      durationMs: 1000,
      audioSegmentStartMs: 0,
      audioSegmentEndMs: 1000,
      transcription: null,
      phonemeAccuracy: null,
      pronunciationScore: null,
      fluencyScore: null,
      audioQualityScore: null,
      analysisData: null,
      metadata: {},
    })
    store.resetSession()
    expect(store.currentSession).toBeNull()
    expect(store.exercise).toBeNull()
    expect(store.exerciseItems).toEqual([])
    expect(store.currentItemIndex).toBe(0)
    expect(store.isRecording).toBe(false)
    expect(store.timestamps).toEqual([])
    expect(store.results.size).toBe(0)
  })

  describe('computed properties', () => {
    beforeEach(() => {
      store.exerciseItems = [
        { id: 'item1', text: 'First item', repeatCount: 2, metadata: {} },
        { id: 'item2', text: 'Second item', repeatCount: 1, metadata: {} },
      ]
    })

    it('returns current item based on index', () => {
      store.currentItemIndex = 0
      expect(store.currentItem?.id).toBe('item1')

      store.currentItemIndex = 1
      expect(store.currentItem?.id).toBe('item2')

      store.currentItemIndex = 2
      expect(store.currentItem).toBeNull()
    })

    it('calculates current iteration correctly', () => {
      store.currentItemIndex = 0
      expect(store.currentIteration).toBe(1)

      // Add a timestamp for first completion
      store.timestamps = [
        {
          id: 't1',
          exerciseItemId: 'item1',
          itemText: 'First item',
          iteration: 1,
          timestamp: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ]
      expect(store.currentIteration).toBe(2)

      // Add second timestamp
      store.timestamps.push({
        id: 't2',
        exerciseItemId: 'item1',
        itemText: 'First item',
        iteration: 2,
        timestamp: 1000,
        startedAt: new Date(),
        completedAt: new Date(),
      })
      expect(store.currentIteration).toBe(3)
    })

    it('correctly identifies first and last items', () => {
      store.currentItemIndex = 0
      expect(store.isFirstItem).toBe(true)
      expect(store.isLastItem).toBe(false)

      store.currentItemIndex = 1
      expect(store.isFirstItem).toBe(false)
      expect(store.isLastItem).toBe(true)
    })

    it('calculates total items including repeats', () => {
      expect(store.totalItems).toBe(3) // item1 x2 + item2 x1
    })

    it('calculates progress percentage', () => {
      expect(store.progressPercentage).toBe(0)

      store.results.set('r1', {
        id: 'r1',
        practiceSessionId: 's',
        exerciseItemId: 'item1',
        iterationNumber: 1,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        durationMs: 1000,
        audioSegmentStartMs: 0,
        audioSegmentEndMs: 1000,
        transcription: null,
        phonemeAccuracy: null,
        pronunciationScore: null,
        fluencyScore: null,
        audioQualityScore: null,
        analysisData: null,
        metadata: {},
      })
      expect(store.progressPercentage).toBe(33) // 1/3 = 33%

      store.results.set('r2', {
        id: 'r2',
        practiceSessionId: 's',
        exerciseItemId: 'item1',
        iterationNumber: 2,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        durationMs: 1000,
        audioSegmentStartMs: 0,
        audioSegmentEndMs: 1000,
        transcription: null,
        phonemeAccuracy: null,
        pronunciationScore: null,
        fluencyScore: null,
        audioQualityScore: null,
        analysisData: null,
        metadata: {},
      })
      expect(store.progressPercentage).toBe(67) // 2/3 = 67%
    })

    it('determines navigation capabilities', () => {
      store.currentItemIndex = 0
      expect(store.canNavigateBack).toBe(false)
      expect(store.canNavigateNext).toBe(false) // No results yet

      // Add timestamps for item1 (needs 2)
      store.timestamps = [
        {
          id: 't1',
          exerciseItemId: 'item1',
          itemText: 'First item',
          iteration: 1,
          timestamp: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: 't2',
          exerciseItemId: 'item1',
          itemText: 'First item',
          iteration: 2,
          timestamp: 1000,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ]
      expect(store.canNavigateNext).toBe(true)

      store.currentItemIndex = 1
      expect(store.canNavigateBack).toBe(true)
      expect(store.canNavigateNext).toBe(false) // Last item
    })
  })

  describe('navigation actions', () => {
    beforeEach(() => {
      store.exerciseItems = [
        { id: 'item1', text: 'First', repeatCount: 1, metadata: {} },
        { id: 'item2', text: 'Second', repeatCount: 1, metadata: {} },
      ]
      store.currentItemIndex = 0
    })

    it('navigates to next item when allowed', () => {
      // Complete current item
      store.timestamps = [
        {
          id: 't1',
          exerciseItemId: 'item1',
          itemText: 'First',
          iteration: 1,
          timestamp: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ]

      store.nextItem()
      expect(store.currentItemIndex).toBe(1)
    })

    it('does not navigate next when item incomplete', () => {
      store.nextItem()
      expect(store.currentItemIndex).toBe(0)
    })

    it('navigates to previous item', () => {
      store.currentItemIndex = 1
      store.previousItem()
      expect(store.currentItemIndex).toBe(0)
    })

    it('does not navigate back from first item', () => {
      store.currentItemIndex = 0
      store.previousItem()
      expect(store.currentItemIndex).toBe(0)
    })

    it('jumps to specific item', () => {
      store.goToItem(1)
      expect(store.currentItemIndex).toBe(1)

      // Invalid index should not change
      store.goToItem(5)
      expect(store.currentItemIndex).toBe(1)
    })
  })

  describe('recording management', () => {
    it('marks timestamps correctly', () => {
      store.recordingStartTime = Date.now()
      store.recordingStartedAt = new Date()

      store.markItemTimestamp('item1', 'Test item', 1)

      expect(store.timestamps).toHaveLength(1)
      expect(store.timestamps[0].exerciseItemId).toBe('item1')
      expect(store.timestamps[0].itemText).toBe('Test item')
      expect(store.timestamps[0].iteration).toBe(1)
      expect(store.timestamps[0].timestamp).toBeGreaterThanOrEqual(0)
    })

    it('tracks multiple timestamps', async () => {
      store.recordingStartTime = Date.now()
      store.recordingStartedAt = new Date()

      store.markItemTimestamp('item1', 'First', 1)
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))
      store.markItemTimestamp('item2', 'Second', 1)

      expect(store.timestamps).toHaveLength(2)
      expect(store.timestamps[1].timestamp).toBeGreaterThanOrEqual(store.timestamps[0].timestamp)
    })

    it('stops recording', () => {
      store.isRecording = true
      store.stopRecording()
      expect(store.isRecording).toBe(false)
    })
  })

  describe('session actions', () => {
    it('starts a new session', async () => {
      const mockResponse = {
        id: 'session-1',
        user_id: 'user-1',
        exercise_id: 'exercise-1',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: null,
        recording_started_at: null,
        session_audio_file_id: null,
        recording_duration_ms: null,
        total_items: 3,
        completed_items: 0,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockApi = {
        post: vi.fn().mockResolvedValue(mockResponse),
        put: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue([]),
      }
      const mockMessaging = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
      }
      const mockLoc = {
        t: vi.fn((key: string) => key),
      }

      vi.mocked(useApiStore).mockReturnValue(mockApi)
      vi.mocked(useMessagingStore).mockReturnValue(mockMessaging)
      vi.mocked(useLocalizationStore).mockReturnValue(mockLoc)

      // Create fresh store instance
      setActivePinia(createPinia())
      const testStore = usePracticeSessionStore()

      const exercise = {
        id: 'exercise-1',
        name: 'Test Exercise',
        items: [],
        repeatCount: 1,
        metadata: { itemCount: 3 },
      }

      await testStore.startSession('exercise-1', exercise)

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/practice/sessions', {
        exercise_id: 'exercise-1',
        total_items: 3,
        metadata: {},
      })
      expect(testStore.currentSession).not.toBeNull()
      expect(testStore.currentSession?.id).toBe('session-1')
      expect(testStore.exercise).toEqual(exercise)
      expect(mockMessaging.success).toHaveBeenCalled()
    })

    it('handles session start error', async () => {
      const failingMockApi = {
        post: vi.fn().mockRejectedValue(new Error('API error')),
        put: vi.fn(),
        get: vi.fn(),
      }
      const mockMessaging = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
      }
      const mockLoc = {
        t: vi.fn((key: string) => key),
      }

      vi.mocked(useApiStore).mockReturnValue(failingMockApi)
      vi.mocked(useMessagingStore).mockReturnValue(mockMessaging)
      vi.mocked(useLocalizationStore).mockReturnValue(mockLoc)

      // Create fresh store instance
      setActivePinia(createPinia())
      const failingStore = usePracticeSessionStore()

      const exercise = {
        id: 'exercise-1',
        name: 'Test',
        items: [],
        repeatCount: 1,
        metadata: {},
      }

      await expect(failingStore.startSession('exercise-1', exercise)).rejects.toThrow('API error')
      expect(mockMessaging.error).toHaveBeenCalled()
    })
  })
})
