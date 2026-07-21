import type { MessageLogEntry, MessageSeverity, FilterOptions } from '../messaging.types';

export class MessageLog {
  private messages: MessageLogEntry[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = 1000) {
    this.maxMessages = maxMessages;
  }

  add(entry: MessageLogEntry): MessageLogEntry {
    this.messages.unshift(entry);
    
    // Trim to max size
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }
    
    return entry;
  }

  getAll(): MessageLogEntry[] {
    return [...this.messages];
  }

  getByLevel(level: MessageSeverity, options?: FilterOptions): MessageLogEntry[] {
    let filtered = this.messages.filter(m => m.severity === level);
    
    if (options?.since) {
      const sinceDate = typeof options.since === 'string' ? new Date(options.since) : options.since;
      filtered = filtered.filter(m => m.timestamp >= sinceDate);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  search(query: string, caseSensitive = false, useRegex = false): MessageLogEntry[] {
    if (useRegex) {
      try {
        const regex = new RegExp(query, caseSensitive ? '' : 'i');
        return this.messages.filter(m => 
          regex.test(m.summary) || 
          (m.detail && regex.test(m.detail))
        );
      } catch {
        // Invalid regex, fall back to text search
        return this.textSearch(query, caseSensitive);
      }
    }
    
    return this.textSearch(query, caseSensitive);
  }

  private textSearch(query: string, caseSensitive: boolean): MessageLogEntry[] {
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    return this.messages.filter(m => {
      const summary = caseSensitive ? m.summary : m.summary.toLowerCase();
      const detail = m.detail ? (caseSensitive ? m.detail : m.detail.toLowerCase()) : '';
      
      return summary.includes(searchTerm) || detail.includes(searchTerm);
    });
  }

  getRecent(timeRange: string | number): MessageLogEntry[] {
    const now = Date.now();
    let milliseconds: number;

    if (typeof timeRange === 'number') {
      milliseconds = timeRange;
    } else {
      // Parse time range strings like "1h", "30m", "24h"
      const match = timeRange.match(/^(\d+)([mhd])$/);
      if (!match) {
        return [];
      }

      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 'm': milliseconds = value * 60 * 1000; break;
        case 'h': milliseconds = value * 60 * 60 * 1000; break;
        case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
        default: return [];
      }
    }

    const cutoff = new Date(now - milliseconds);
    return this.messages.filter(m => m.timestamp >= cutoff);
  }

  clear(): void {
    this.messages = [];
  }

  exportToJSON(): string {
    return JSON.stringify(this.messages, null, 2);
  }

  exportToCSV(): string {
    if (this.messages.length === 0) {
      return 'id,severity,summary,detail,timestamp,source,userId\n';
    }

    const headers = ['id', 'severity', 'summary', 'detail', 'timestamp', 'source', 'userId'];
    const rows = this.messages.map(m => [
      m.id,
      m.severity,
      this.escapeCsv(m.summary),
      this.escapeCsv(m.detail || ''),
      m.timestamp.toISOString(),
      m.source || '',
      m.userId || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
