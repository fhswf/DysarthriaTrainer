import type { MessageSeverity } from '../messaging.types';

interface DebouncedMessage {
  severity: MessageSeverity;
  summary: string;
  detail?: string;
  timestamp: number;
}

export class MessageDebouncer {
  private recentMessages: Map<string, DebouncedMessage> = new Map();
  private debounceTime: number;
  private cleanupInterval: number;

  constructor(debounceTime: number = 1000, cleanupInterval: number = 5000) {
    this.debounceTime = debounceTime;
    this.cleanupInterval = cleanupInterval;
    this.startCleanupTimer();
  }

  shouldDebounce(severity: MessageSeverity, summary: string, detail?: string): boolean {
    const key = this.createKey(severity, summary, detail);
    const existing = this.recentMessages.get(key);
    const now = Date.now();

    if (existing && now - existing.timestamp < this.debounceTime) {
      // Update timestamp to extend debounce window
      existing.timestamp = now;
      return true;
    }

    // Not debounced - store it
    this.recentMessages.set(key, {
      severity,
      summary,
      detail,
      timestamp: now,
    });

    return false;
  }

  clear(): void {
    this.recentMessages.clear();
  }

  private createKey(severity: MessageSeverity, summary: string, detail?: string): string {
    return `${severity}:${summary}:${detail || ''}`;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, message] of this.recentMessages.entries()) {
        if (now - message.timestamp > this.debounceTime * 2) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => this.recentMessages.delete(key));
    }, this.cleanupInterval);
  }
}
