/**
 * Error History
 * 
 * Tracks all errors that occur in the application with filtering
 * and statistics capabilities.
 */

import type { ErrorHistoryEntry, ProcessedError, HistoryOptions } from '../error.types';

export class ErrorHistory {
  private history: ErrorHistoryEntry[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  add(error: ProcessedError): void {
    const entry: ErrorHistoryEntry = {
      ...error,
      recovered: false,
      displayedToUser: false,
    };
    
    this.history.push(entry);
    
    // Trim history if it exceeds max size
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  getAll(options?: HistoryOptions): ErrorHistoryEntry[] {
    let filtered = [...this.history];

    if (options?.category) {
      filtered = filtered.filter(entry => entry.category === options.category);
    }

    if (options?.severity) {
      filtered = filtered.filter(entry => entry.severity === options.severity);
    }

    if (options?.since) {
      filtered = filtered.filter(entry => entry.timestamp >= options.since!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  clear(): void {
    this.history = [];
  }

  setMaxSize(size: number): void {
    this.maxSize = size;
    // Trim history if it exceeds new max size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }
  }

  getStats() {
    const total = this.history.length;
    const recovered = this.history.filter(e => e.recovered).length;
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.history.forEach(entry => {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    });

    return {
      total,
      recovered,
      recoveryRate: total > 0 ? recovered / total : 0,
      byCategory,
      bySeverity,
    };
  }
}
