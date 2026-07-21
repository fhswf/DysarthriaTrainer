import type { CacheConfig, CacheStats } from '../api.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number): void {
    if (!this.config.enabled) return;

    const key = this.generateKey(url, params);
    const timeout = ttl || this.config.defaultTimeout;
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + timeout,
    });

    // Enforce max size
    if (this.cache.size > this.config.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  get<T>(url: string, params?: Record<string, any>): T | null {
    if (!this.config.enabled) {
      this.misses++;
      return null;
    }

    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  has(url: string, params?: Record<string, any>): boolean {
    if (!this.config.enabled) return false;

    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (!this.config.enabled) {
      this.clear();
    }
  }
}
