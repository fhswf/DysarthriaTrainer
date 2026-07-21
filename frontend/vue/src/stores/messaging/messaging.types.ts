import type { ToastServiceMethods } from 'primevue/toastservice'

export type MessageSeverity = 'success' | 'info' | 'warn' | 'error'

export interface MessageLogEntry {
  id: string
  severity: MessageSeverity
  summary: string
  detail?: string
  timestamp: Date
  source?: string
  context?: Record<string, unknown>
  userId?: string
  stack?: string
}

export interface ToastMessage {
  id?: number
  severity: MessageSeverity
  summary: string
  detail?: string
  life?: number
  sticky?: boolean
  closable?: boolean
  group?: string
}

export interface MessageOptions {
  source?: string
  context?: Record<string, unknown>
  userId?: string
  showToast?: boolean
  toastOptions?: Partial<ToastMessage>
  debounce?: boolean
  stack?: string
}

export interface LocalizedMessageOptions extends MessageOptions {
  interpolation?: Record<string, unknown>
}

export interface SearchOptions {
  caseSensitive?: boolean
  useRegex?: boolean
}

export interface FilterOptions {
  since?: Date | string
  limit?: number
}

export interface ExportOptions {
  format?: 'json' | 'csv'
  severity?: MessageSeverity[]
  since?: Date
}

export interface MessagingConfig {
  maxMessages: number
  defaultToastLife: number
  enableDebounce: boolean
  debounceTime: number
  debounceWindow: number
  enableConsoleLog: boolean
  logLevel: MessageSeverity[]
}

export interface MessagingServiceInterface {
  // Initialization
  initialize(): Promise<void>
  isInitialized(): boolean

  // PrimeVue Toast integration
  setPrimeVueToast(toast: ToastServiceMethods): void

  // Basic message creation
  success(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry
  info(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry
  warn(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry
  error(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry

  // Localized messages
  successLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): MessageLogEntry
  infoLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): MessageLogEntry
  warnLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): MessageLogEntry
  errorLocalized(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): MessageLogEntry

  // Toast management
  showToast(toast: Omit<ToastMessage, 'id'>): ToastMessage
  hideToast(id: number): boolean
  clearToasts(): void

  // Message retrieval
  getAllMessages(): MessageLogEntry[]
  getMessagesByLevel(level: MessageSeverity, options?: FilterOptions): MessageLogEntry[]
  searchMessages(query: string, options?: SearchOptions): MessageLogEntry[]
  getRecentMessages(timeRange: string | number): MessageLogEntry[]
  filterMessages(options: FilterOptions & { severity?: MessageSeverity[] }): MessageLogEntry[]
  groupMessagesBySeverity(): Record<MessageSeverity, MessageLogEntry[]>
  getMessageStats(): Record<MessageSeverity, number>

  // Message management
  clearMessages(): void

  // Export
  exportMessages(options?: ExportOptions): string
  downloadMessages(filename: string, options?: ExportOptions): void

  // i18n integration
  setI18n(i18nService: unknown): void
}
