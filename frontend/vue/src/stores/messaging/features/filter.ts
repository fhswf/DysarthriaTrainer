import type { MessageLogEntry, MessageSeverity, FilterOptions } from '../messaging.types';

export function filterMessages(
  messages: MessageLogEntry[],
  options: FilterOptions & { severity?: MessageSeverity[] }
): MessageLogEntry[] {
  let filtered = [...messages];

  // Filter by severity
  if (options.severity && options.severity.length > 0) {
    filtered = filtered.filter(m => options.severity!.includes(m.severity));
  }

  // Filter by time
  if (options.since) {
    const sinceDate = typeof options.since === 'string' ? new Date(options.since) : options.since;
    filtered = filtered.filter(m => m.timestamp >= sinceDate);
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function groupMessagesBySeverity(messages: MessageLogEntry[]): Record<MessageSeverity, MessageLogEntry[]> {
  return {
    success: messages.filter(m => m.severity === 'success'),
    info: messages.filter(m => m.severity === 'info'),
    warn: messages.filter(m => m.severity === 'warn'),
    error: messages.filter(m => m.severity === 'error'),
  };
}

export function getMessageStats(messages: MessageLogEntry[]): Record<MessageSeverity, number> {
  return {
    success: messages.filter(m => m.severity === 'success').length,
    info: messages.filter(m => m.severity === 'info').length,
    warn: messages.filter(m => m.severity === 'warn').length,
    error: messages.filter(m => m.severity === 'error').length,
  };
}
