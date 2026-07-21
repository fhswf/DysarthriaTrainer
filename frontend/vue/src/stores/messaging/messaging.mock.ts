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
} from './messaging.types';

export function createMockService(config: MessagingConfig): MessagingServiceInterface {
  const messages: MessageLogEntry[] = [];
  const toasts: ToastMessage[] = [];
  let initialized = false;
  let nextId = 1;
  let nextToastId = 1;

  function createMockMessage(
    severity: MessageSeverity,
    summary: string,
    detail?: string,
    options?: MessageOptions
  ): MessageLogEntry {
    const entry: MessageLogEntry = {
      id: `mock_${nextId++}`,
      severity,
      summary,
      detail,
      timestamp: new Date(),
      source: options?.source || 'mock',
      context: options?.context,
      userId: options?.userId,
    };

    messages.unshift(entry);

    if (messages.length > config.maxMessages) {
      messages.pop();
    }

    if (options?.showToast) {
      toasts.push({
        id: nextToastId++,
        severity,
        summary,
        detail,
        ...options.toastOptions,
      });
    }

    return entry;
  }

  return {
    async initialize(): Promise<void> {
      initialized = true;
    },

    success(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMockMessage('success', summary, detail, options);
    },

    info(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMockMessage('info', summary, detail, options);
    },

    warn(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMockMessage('warn', summary, detail, options);
    },

    error(summary: string, detail?: string, options?: MessageOptions): MessageLogEntry {
      return createMockMessage('error', summary, detail, options);
    },

    successLocalized(summaryKey: string, detailKey?: string, options?: LocalizedMessageOptions): MessageLogEntry {
      return createMockMessage('success', `[i18n:${summaryKey}]`, detailKey ? `[i18n:${detailKey}]` : undefined, options);
    },

    infoLocalized(summaryKey: string, detailKey?: string, options?: LocalizedMessageOptions): MessageLogEntry {
      return createMockMessage('info', `[i18n:${summaryKey}]`, detailKey ? `[i18n:${detailKey}]` : undefined, options);
    },

    warnLocalized(summaryKey: string, detailKey?: string, options?: LocalizedMessageOptions): MessageLogEntry {
      return createMockMessage('warn', `[i18n:${summaryKey}]`, detailKey ? `[i18n:${detailKey}]` : undefined, options);
    },

    errorLocalized(summaryKey: string, detailKey?: string, options?: LocalizedMessageOptions): MessageLogEntry {
      return createMockMessage('error', `[i18n:${summaryKey}]`, detailKey ? `[i18n:${detailKey}]` : undefined, options);
    },

    showToast(toast: Omit<ToastMessage, 'id'>): ToastMessage {
      const fullToast: ToastMessage = {
        id: nextToastId++,
        ...toast,
      };
      toasts.push(fullToast);
      return fullToast;
    },

    hideToast(id: number): boolean {
      const index = toasts.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
        return true;
      }
      return false;
    },

    clearToasts(): void {
      toasts.length = 0;
    },

    getAllMessages(): MessageLogEntry[] {
      return [...messages];
    },

    getMessagesByLevel(level: MessageSeverity, options?: FilterOptions): MessageLogEntry[] {
      let filtered = messages.filter(m => m.severity === level);
      
      if (options?.since) {
        const sinceDate = typeof options.since === 'string' ? new Date(options.since) : options.since;
        filtered = filtered.filter(m => m.timestamp >= sinceDate);
      }
      
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      
      return filtered;
    },

    searchMessages(query: string, options?: SearchOptions): MessageLogEntry[] {
      const searchTerm = options?.caseSensitive ? query : query.toLowerCase();
      
      return messages.filter(m => {
        const summary = options?.caseSensitive ? m.summary : m.summary.toLowerCase();
        const detail = m.detail ? (options?.caseSensitive ? m.detail : m.detail.toLowerCase()) : '';
        
        return summary.includes(searchTerm) || detail.includes(searchTerm);
      });
    },

    getRecentMessages(timeRange: string | number): MessageLogEntry[] {
      return messages.slice(0, 10); // Mock: just return first 10
    },

    filterMessages(options: FilterOptions & { severity?: MessageSeverity[] }): MessageLogEntry[] {
      let filtered = [...messages];

      if (options.severity && options.severity.length > 0) {
        filtered = filtered.filter(m => options.severity!.includes(m.severity));
      }

      if (options.since) {
        const sinceDate = typeof options.since === 'string' ? new Date(options.since) : options.since;
        filtered = filtered.filter(m => m.timestamp >= sinceDate);
      }

      if (options.limit && options.limit > 0) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    },

    groupMessagesBySeverity(): Record<MessageSeverity, MessageLogEntry[]> {
      return {
        success: messages.filter(m => m.severity === 'success'),
        info: messages.filter(m => m.severity === 'info'),
        warn: messages.filter(m => m.severity === 'warn'),
        error: messages.filter(m => m.severity === 'error'),
      };
    },

    getMessageStats(): Record<MessageSeverity, number> {
      return {
        success: messages.filter(m => m.severity === 'success').length,
        info: messages.filter(m => m.severity === 'info').length,
        warn: messages.filter(m => m.severity === 'warn').length,
        error: messages.filter(m => m.severity === 'error').length,
      };
    },

    clearMessages(): void {
      messages.length = 0;
    },

    exportMessages(options?: ExportOptions): string {
      const format = options?.format || 'json';
      
      if (format === 'csv') {
        return 'id,severity,summary,detail,timestamp\n';
      }
      
      return JSON.stringify(messages, null, 2);
    },

    downloadMessages(filename: string, options?: ExportOptions): void {
      console.log(`[Mock] Downloading messages to ${filename}`);
    },

    setI18n(i18nService: any): void {
      console.log('[Mock] i18n service set');
    },

    isInitialized(): boolean {
      return initialized;
    },
  };
}
