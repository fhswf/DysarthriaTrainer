/**
 * Messaging Service - Comprehensive Unit Tests
 *
 * Tests the messaging service functionality with proper mocking and type safety
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMessagingStore } from '@/stores/messaging'
import type {
  MessageOptions,
  MessagingServiceInterface,
  MessageLogEntry,
  ToastMessage,
} from '@/stores/messaging/messaging.types'

describe('Messaging Service - Unit Tests', () => {
  let mockService: Partial<MessagingServiceInterface>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Create a comprehensive mock service
    mockService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      isInitialized: vi.fn().mockReturnValue(true),
      setPrimeVueToast: vi.fn(),
      success: vi.fn(
        (summary: string, detail?: string): MessageLogEntry => ({
          id: 'msg-1',
          severity: 'success',
          summary,
          detail,
          timestamp: new Date(),
        })
      ),
      info: vi.fn(
        (summary: string, detail?: string): MessageLogEntry => ({
          id: 'msg-2',
          severity: 'info',
          summary,
          detail,
          timestamp: new Date(),
        })
      ),
      warn: vi.fn(
        (summary: string, detail?: string): MessageLogEntry => ({
          id: 'msg-3',
          severity: 'warn',
          summary,
          detail,
          timestamp: new Date(),
        })
      ),
      error: vi.fn(
        (summary: string, detail?: string): MessageLogEntry => ({
          id: 'msg-4',
          severity: 'error',
          summary,
          detail,
          timestamp: new Date(),
        })
      ),
      successLocalized: vi.fn(
        (summaryKey: string): MessageLogEntry => ({
          id: 'msg-5',
          severity: 'success',
          summary: `Translated: ${summaryKey}`,
          timestamp: new Date(),
        })
      ),
      infoLocalized: vi.fn(
        (summaryKey: string): MessageLogEntry => ({
          id: 'msg-6',
          severity: 'info',
          summary: `Translated: ${summaryKey}`,
          timestamp: new Date(),
        })
      ),
      warnLocalized: vi.fn(
        (summaryKey: string): MessageLogEntry => ({
          id: 'msg-7',
          severity: 'warn',
          summary: `Translated: ${summaryKey}`,
          timestamp: new Date(),
        })
      ),
      errorLocalized: vi.fn(
        (summaryKey: string): MessageLogEntry => ({
          id: 'msg-8',
          severity: 'error',
          summary: `Translated: ${summaryKey}`,
          timestamp: new Date(),
        })
      ),
      showToast: vi.fn(
        (toast: Omit<ToastMessage, 'id'>): ToastMessage => ({
          ...toast,
          id: 1,
        })
      ),
      hideToast: vi.fn().mockReturnValue(true),
      clearToasts: vi.fn(),
      getAllMessages: vi.fn().mockReturnValue([]),
      getMessagesByLevel: vi.fn().mockReturnValue([]),
      searchMessages: vi.fn().mockReturnValue([]),
      getRecentMessages: vi.fn().mockReturnValue([]),
      filterMessages: vi.fn().mockReturnValue([]),
      groupMessagesBySeverity: vi
        .fn()
        .mockReturnValue({ success: [], info: [], warn: [], error: [] }),
      getMessageStats: vi.fn().mockReturnValue({ success: 0, info: 0, warn: 0, error: 0 }),
      clearMessages: vi.fn(),
      exportMessages: vi.fn().mockReturnValue('{"messages":[]}'),
      downloadMessages: vi.fn(),
      setI18n: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Store Initialization', () => {
    it('should create store with initial state', () => {
      const store = useMessagingStore()

      expect(store.isReady).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.loadError).toBeNull()
    })

    it('should initialize successfully', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      expect(mockService.initialize).toHaveBeenCalled()
    })
  })

  describe('Basic Message Methods', () => {
    it('should send success message', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.success('Operation successful')

      expect(result.severity).toBe('success')
      expect(result.summary).toBe('Operation successful')
    })

    it('should send info message with detail', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.info('Information', 'Additional details')

      expect(result.severity).toBe('info')
      expect(result.summary).toBe('Information')
      expect(result.detail).toBe('Additional details')
    })

    it('should send warning message', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.warn('Warning!')

      expect(result.severity).toBe('warn')
      expect(result.summary).toBe('Warning!')
    })

    it('should send error message', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.error('Error occurred')

      expect(result.severity).toBe('error')
      expect(result.summary).toBe('Error occurred')
    })

    it('should support message options', async () => {
      const options: MessageOptions = {
        source: 'test',
        showToast: true,
        context: { userId: '123' },
      }

      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      await store.success('Test', 'Detail', options)

      expect(mockService.success).toHaveBeenCalledWith('Test', 'Detail', options)
    })
  })

  describe('Localized Messages', () => {
    it('should send localized success message', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.successLocalized('common.saveSuccess')

      expect(result.severity).toBe('success')
      expect(result.summary).toContain('common.saveSuccess')
    })

    it('should send localized error with interpolation', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.errorLocalized('errors.notFound', 'errors.notFoundDetail', {
        interpolation: { item: 'User' },
      })

      expect(result.severity).toBe('error')
    })
  })

  describe('Toast Management', () => {
    it('should show toast', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const toast = { severity: 'info' as const, summary: 'Test Toast' }
      const result = await store.showToast(toast)

      expect(result.id).toBeDefined()
      expect(result.summary).toBe('Test Toast')
    })

    it('should hide toast by id', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.hideToast(1)

      expect(result).toBe(true)
      expect(mockService.hideToast).toHaveBeenCalledWith(1)
    })

    it('should clear all toasts', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      await store.clearToasts()

      expect(mockService.clearToasts).toHaveBeenCalled()
    })
  })

  describe('PrimeVue Integration', () => {
    it('should inject PrimeVue toast', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const mockToast = {
        add: vi.fn(),
        remove: vi.fn(),
        removeGroup: vi.fn(),
        removeAllGroups: vi.fn(),
      }
      await store.setPrimeVueToast(mockToast)

      expect(mockService.setPrimeVueToast).toHaveBeenCalledWith(mockToast)
    })
  })

  describe('Message Retrieval', () => {
    it('should get all messages', async () => {
      const messages: MessageLogEntry[] = [
        { id: '1', severity: 'success', summary: 'Test', timestamp: new Date() },
      ]
      mockService.getAllMessages = vi.fn().mockReturnValue(messages)

      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const result = await store.getAllMessages()

      expect(result).toEqual(messages)
    })

    it('should search messages', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      await store.searchMessages('test', { caseSensitive: false })

      expect(mockService.searchMessages).toHaveBeenCalledWith('test', { caseSensitive: false })
    })

    it('should filter messages by severity', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      await store.filterMessages({ severity: ['error'], limit: 10 })

      expect(mockService.filterMessages).toHaveBeenCalledWith({ severity: ['error'], limit: 10 })
    })

    it('should get message statistics', async () => {
      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => mockService,
      }))

      const store = useMessagingStore()
      await store.initialize()

      const stats = await store.getMessageStats()

      expect(stats).toHaveProperty('success')
      expect(stats).toHaveProperty('error')
      expect(stats).toHaveProperty('info')
      expect(stats).toHaveProperty('warn')
    })
  })

  describe('Error Handling', () => {
    it('should handle initialization failure', async () => {
      const errorMock = {
        ...mockService,
        initialize: vi.fn().mockRejectedValue(new Error('Init failed')),
      }

      vi.doMock('@/stores/messaging/messaging.live', () => ({
        createLiveService: () => errorMock,
      }))

      const store = useMessagingStore()

      await expect(store.initialize()).rejects.toThrow()
      expect(store.loadError).toBeDefined()
    })

    it('should handle service not initialized gracefully', async () => {
      const store = useMessagingStore()

      // Service hasn't been initialized, but shouldn't throw
      let error = null
      let result = null
      try {
        result = await store.getAllMessages()
      } catch (err) {
        error = err
      }

      // Should either return a value or handle gracefully without error
      expect(error).toBeNull()
      expect(Array.isArray(result) || result === undefined).toBe(true)
    })
  })
})
