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
import { MessageLog } from './core/messageLog'
import { ToastManager } from './core/toastManager'
import { MessageDebouncer } from './core/debounce'
import { LocalizationHelper, type I18nService } from './features/localization'
import { filterMessages, groupMessagesBySeverity, getMessageStats } from './features/filter'
import { exportMessages, downloadExport } from './features/export'

export function createLiveService(config: MessagingConfig): MessagingServiceInterface {
  const messageLog = new MessageLog(config.maxMessages)
  const toastManager = new ToastManager(config.defaultToastLife)
  const debouncer = new MessageDebouncer(config.debounceTime)
  const localizationHelper = new LocalizationHelper()

  let isInitialized = false

  function generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  function createMessage(
    severity: MessageSeverity,
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): MessageLogEntry {
    const entry: MessageLogEntry = {
      id: generateId(),
      severity,
      summary,
      detail,
      timestamp: new Date(),
      source: options?.source,
      context: options?.context,
      userId: options?.userId,
      stack: options?.stack,
    }

    // Check debounce
    if (options?.debounce && debouncer.shouldDebounce(severity, summary, detail)) {
      return entry // Don't log or show toast
    }

    // Add to log
    messageLog.add(entry)

    // Show toast if requested (default to true for better UX)
    const shouldShowToast = options?.showToast !== false
    if (shouldShowToast) {
      toastManager.show({
        severity,
        summary,
        detail,
        ...options?.toastOptions,
      })
    }

    return entry
  }

  return {
    initialize(): Promise<void> {
      isInitialized = true
      return Promise.resolve()
    },

    isInitialized(): boolean {
      return isInitialized
    },

    setPrimeVueToast(toast: ToastServiceMethods): void {
      toastManager.setPrimeVueToast(toast)
    },

    success(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMessage('success', summary, detail, options)
    },

    info(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMessage('info', summary, detail, options)
    },

    warn(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMessage('warn', summary, detail, options)
    },

    error(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMessage('error', summary, detail, options)
    },

    successLocalized(
      summaryKey: string,
      detailKey?: string,
      options?: LocalizedMessageOptions
    ): MessageLogEntry {
      const { summary, detail } = localizationHelper.translateMessage(
        summaryKey,
        detailKey,
        options
      )
      return createMessage('success', summary, detail, options)
    },

    infoLocalized(
      summaryKey: string,
      detailKey?: string,
      options?: LocalizedMessageOptions
    ): MessageLogEntry {
      const { summary, detail } = localizationHelper.translateMessage(
        summaryKey,
        detailKey,
        options
      )
      return createMessage('info', summary, detail, options)
    },

    warnLocalized(
      summaryKey: string,
      detailKey?: string,
      options?: LocalizedMessageOptions
    ): MessageLogEntry {
      const { summary, detail } = localizationHelper.translateMessage(
        summaryKey,
        detailKey,
        options
      )
      return createMessage('warn', summary, detail, options)
    },

    errorLocalized(
      summaryKey: string,
      detailKey?: string,
      options?: LocalizedMessageOptions
    ): MessageLogEntry {
      const { summary, detail } = localizationHelper.translateMessage(
        summaryKey,
        detailKey,
        options
      )
      return createMessage('error', summary, detail, options)
    },

    showToast(toast: Omit<ToastMessage, 'id'>): ToastMessage {
      return toastManager.show(toast)
    },

    hideToast(id: number): boolean {
      return toastManager.remove(id)
    },

    clearToasts(): void {
      toastManager.clear()
    },

    getAllMessages(): MessageLogEntry[] {
      return messageLog.getAll()
    },

    getMessagesByLevel(level: MessageSeverity, options?: FilterOptions): MessageLogEntry[] {
      return messageLog.getByLevel(level, options)
    },

    searchMessages(query: string, options?: SearchOptions): MessageLogEntry[] {
      return messageLog.search(query, options?.caseSensitive, options?.useRegex)
    },

    getRecentMessages(timeRange: string | number): MessageLogEntry[] {
      return messageLog.getRecent(timeRange)
    },

    filterMessages(options: FilterOptions & { severity?: MessageSeverity[] }): MessageLogEntry[] {
      return filterMessages(messageLog.getAll(), options)
    },

    groupMessagesBySeverity(): Record<MessageSeverity, MessageLogEntry[]> {
      return groupMessagesBySeverity(messageLog.getAll())
    },

    getMessageStats(): Record<MessageSeverity, number> {
      return getMessageStats(messageLog.getAll())
    },

    clearMessages(): void {
      messageLog.clear()
    },

    exportMessages(options?: ExportOptions): string {
      return exportMessages(messageLog.getAll(), options)
    },

    downloadMessages(filename: string, options?: ExportOptions): void {
      const format = options?.format ?? 'json'
      const content = exportMessages(messageLog.getAll(), options)
      downloadExport(content, filename, format)
    },

    setI18n(i18nService: I18nService): void {
      localizationHelper.setI18nService(i18nService)
    },
  }
}
