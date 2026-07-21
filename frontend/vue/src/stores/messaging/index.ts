/**
 * Messaging Service Store
 *
 * Central messaging service providing:
 * - Message logging and management
 * - Toast notifications
 * - Message search and filtering
 * - Export capabilities
 * - i18n integration
 *
 * Architecture:
 * - Lazy-loaded implementation (live/mock)
 * - Environment-based configuration
 * - Service registry integration
 * - Phase 1 initialization (no dependencies)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MessagingServiceInterface,
  MessagingConfig,
  MessageLogEntry,
  ToastMessage,
  MessageOptions,
  LocalizedMessageOptions,
  SearchOptions,
  FilterOptions,
  ExportOptions,
  MessageSeverity,
} from './messaging.types'
import type { ToastServiceMethods } from 'primevue/toastservice'
import type { I18nService } from './features/localization'
import { logMessagingEvent } from './communication'

export const useMessagingStore = defineStore('messaging', () => {
  // State
  const implementation = ref<MessagingServiceInterface | null>(null)
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Computed
  const isReady = computed(() => implementation.value !== null)

  // Configuration
  const defaultConfig: MessagingConfig = {
    maxMessages: parseInt(import.meta.env.VITE_MESSAGING_MAX_MESSAGES ?? '1000', 10),
    defaultToastLife: parseInt(import.meta.env.VITE_MESSAGING_TOAST_LIFE ?? '5000', 10),
    enableDebounce: import.meta.env.VITE_MESSAGING_ENABLE_DEBOUNCE === 'true',
    debounceTime: parseInt(import.meta.env.VITE_MESSAGING_DEBOUNCE_TIME ?? '1000', 10),
    debounceWindow: parseInt(import.meta.env.VITE_MESSAGING_DEBOUNCE_WINDOW ?? '1000', 10),
    enableConsoleLog: import.meta.env.VITE_MESSAGING_CONSOLE_LOG === 'true',
    logLevel: (import.meta.env.VITE_MESSAGING_LOG_LEVEL ?? 'error,warn').split(
      ','
    ) as MessageSeverity[],
  }

  /**
   * Load the appropriate implementation based on environment
   */
  async function loadImplementation(): Promise<MessagingServiceInterface> {
    if (implementation.value) {
      return implementation.value
    }

    isLoading.value = true
    loadError.value = null

    try {
      const useMock = import.meta.env.VITE_MESSAGING_USE_MOCK === 'true'

      logMessagingEvent('Loading implementation', { useMock })

      if (useMock) {
        const { createMockService } = await import('./messaging.mock')
        implementation.value = createMockService(defaultConfig)
      } else {
        const { createLiveService } = await import('./messaging.live')
        implementation.value = createLiveService(defaultConfig)
      }

      await implementation.value.initialize()

      logMessagingEvent('Implementation loaded successfully')

      return implementation.value
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      loadError.value = `Failed to load messaging service: ${errorMessage}`
      // eslint-disable-next-line no-console
      console.error('[Messaging Service]', loadError.value, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Ensure implementation is loaded
   */
  async function ensureInitialized(): Promise<MessagingServiceInterface> {
    if (implementation.value) {
      return implementation.value
    }
    return loadImplementation()
  }

  // Basic messaging methods
  async function success(
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.success(summary, detail, options)
  }

  async function info(
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.info(summary, detail, options)
  }

  async function warn(
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.warn(summary, detail, options)
  }

  async function error(
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.error(summary, detail, options)
  }

  // Localized messaging methods
  async function successLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.successLocalized(summaryKey, detailKey, options)
  }

  async function infoLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.infoLocalized(summaryKey, detailKey, options)
  }

  async function warnLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.warnLocalized(summaryKey, detailKey, options)
  }

  async function errorLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): Promise<MessageLogEntry> {
    const impl = await ensureInitialized()
    return impl.errorLocalized(summaryKey, detailKey, options)
  }

  // Toast management
  async function showToast(toast: Omit<ToastMessage, 'id'>): Promise<ToastMessage> {
    const impl = await ensureInitialized()
    return impl.showToast(toast)
  }

  async function hideToast(id: number): Promise<boolean> {
    const impl = await ensureInitialized()
    return impl.hideToast(id)
  }

  async function clearToasts(): Promise<void> {
    const impl = await ensureInitialized()
    return impl.clearToasts()
  }

  // Message retrieval
  async function getAllMessages(): Promise<MessageLogEntry[]> {
    const impl = await ensureInitialized()
    return impl.getAllMessages()
  }

  async function getMessagesByLevel(
    level: MessageSeverity,
    options?: FilterOptions
  ): Promise<MessageLogEntry[]> {
    const impl = await ensureInitialized()
    return impl.getMessagesByLevel(level, options)
  }

  async function searchMessages(
    query: string,
    options?: SearchOptions
  ): Promise<MessageLogEntry[]> {
    const impl = await ensureInitialized()
    return impl.searchMessages(query, options)
  }

  async function getRecentMessages(timeRange: string | number): Promise<MessageLogEntry[]> {
    const impl = await ensureInitialized()
    return impl.getRecentMessages(timeRange)
  }

  async function filterMessages(
    options: FilterOptions & { severity?: MessageSeverity[] }
  ): Promise<MessageLogEntry[]> {
    const impl = await ensureInitialized()
    return impl.filterMessages(options)
  }

  async function groupMessagesBySeverity(): Promise<Record<MessageSeverity, MessageLogEntry[]>> {
    const impl = await ensureInitialized()
    return impl.groupMessagesBySeverity()
  }

  async function getMessageStats(): Promise<Record<MessageSeverity, number>> {
    const impl = await ensureInitialized()
    return impl.getMessageStats()
  }

  // Message management
  async function clearMessages(): Promise<void> {
    const impl = await ensureInitialized()
    return impl.clearMessages()
  }

  // Export
  async function exportMessages(options?: ExportOptions): Promise<string> {
    const impl = await ensureInitialized()
    return impl.exportMessages(options)
  }

  async function downloadMessages(filename: string, options?: ExportOptions): Promise<void> {
    const impl = await ensureInitialized()
    return impl.downloadMessages(filename, options)
  }

  // i18n integration
  async function setI18n(i18nService: I18nService): Promise<void> {
    const impl = await ensureInitialized()
    return impl.setI18n(i18nService)
  }

  // PrimeVue Toast integration
  async function setPrimeVueToast(toast: ToastServiceMethods): Promise<void> {
    const impl = await ensureInitialized()
    return impl.setPrimeVueToast(toast)
  }

  // Initialization
  async function initialize(): Promise<void> {
    await loadImplementation()
  }

  return {
    // State
    isReady,
    isLoading,
    loadError,

    // Initialization
    initialize,

    // Basic messaging
    success,
    info,
    warn,
    error,

    // Localized messaging
    successLocalized,
    infoLocalized,
    warnLocalized,
    errorLocalized,

    // Toast management
    showToast,
    hideToast,
    clearToasts,

    // Message retrieval
    getAllMessages,
    getMessagesByLevel,
    searchMessages,
    getRecentMessages,
    filterMessages,
    groupMessagesBySeverity,
    getMessageStats,

    // Message management
    clearMessages,

    // Export
    exportMessages,
    downloadMessages,

    // i18n
    setI18n,

    // PrimeVue Toast integration
    setPrimeVueToast,
  }
})
