import type { MessageLogEntry, ExportOptions } from '../messaging.types';
import { filterMessages } from './filter';

export function exportMessages(messages: MessageLogEntry[], options: ExportOptions = {}): string {
  const format = options.format || 'json';
  
  // Apply severity filter if provided
  const filtered = options.severity && options.severity.length > 0
    ? filterMessages(messages, { severity: options.severity })
    : messages;

  if (format === 'csv') {
    return exportToCSV(filtered);
  }
  
  return exportToJSON(filtered);
}

function exportToJSON(messages: MessageLogEntry[]): string {
  return JSON.stringify(messages, (key, value) => {
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
}

function exportToCSV(messages: MessageLogEntry[]): string {
  if (messages.length === 0) {
    return 'id,severity,summary,detail,timestamp,source,userId\n';
  }

  const headers = ['id', 'severity', 'summary', 'detail', 'timestamp', 'source', 'userId'];
  const rows = messages.map(m => [
    m.id,
    m.severity,
    escapeCsv(m.summary),
    escapeCsv(m.detail || ''),
    m.timestamp.toISOString(),
    m.source || '',
    m.userId || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadExport(content: string, filename: string, format: 'json' | 'csv'): void {
  const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
}
