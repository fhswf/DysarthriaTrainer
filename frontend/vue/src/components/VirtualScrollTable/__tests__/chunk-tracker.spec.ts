/**
 * Unit tests for Chunk Tracker Utility
 * 
 * Tests O(1) chunk tracking for virtual scroll table data loading.
 * Covers chunk index calculation, range handling, state tracking, and performance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createChunkTracker,
  getChunkIndex,
  getChunkRange,
  isChunkLoaded,
  isChunkLoading,
  getChunksInRange,
  getChunksToLoad,
  markChunkLoaded,
  markChunkLoading,
  unmarkChunkLoading,
  clearChunks,
  type ChunkTracker
} from '../utils/chunk-tracker';

describe('Chunk Tracker Utility', () => {
  let tracker: ChunkTracker;

  beforeEach(() => {
    tracker = createChunkTracker(50); // Default chunk size of 50
  });

  // =====================================================
  // Factory Function Tests
  // =====================================================

  describe('createChunkTracker', () => {
    it('should create tracker with default chunk size', () => {
      const t = createChunkTracker();
      expect(t.chunkSize).toBe(50);
      expect(t.loadedChunks).toBeInstanceOf(Set);
      expect(t.loadingChunks).toBeInstanceOf(Set);
    });

    it('should create tracker with custom chunk size', () => {
      const t = createChunkTracker(100);
      expect(t.chunkSize).toBe(100);
    });

    it('should initialize with empty sets', () => {
      expect(tracker.loadedChunks.size).toBe(0);
      expect(tracker.loadingChunks.size).toBe(0);
    });
  });

  // =====================================================
  // Chunk Index Calculation Tests
  // =====================================================

  describe('getChunkIndex', () => {
    it('should calculate chunk index correctly for first chunk', () => {
      expect(getChunkIndex(0, 50)).toBe(0);
      expect(getChunkIndex(25, 50)).toBe(0);
      expect(getChunkIndex(49, 50)).toBe(0);
    });

    it('should calculate chunk index correctly for second chunk', () => {
      expect(getChunkIndex(50, 50)).toBe(1);
      expect(getChunkIndex(75, 50)).toBe(1);
      expect(getChunkIndex(99, 50)).toBe(1);
    });

    it('should calculate chunk index correctly for large indices', () => {
      expect(getChunkIndex(500, 50)).toBe(10);
      expect(getChunkIndex(1000, 50)).toBe(20);
    });

    it('should handle edge case of index 0', () => {
      expect(getChunkIndex(0, 50)).toBe(0);
    });

    it('should handle negative indices', () => {
      expect(getChunkIndex(-5, 50)).toBe(-1); // Math.floor(-5/50) = -1
      expect(getChunkIndex(-50, 50)).toBe(-1); // Math.floor(-50/50) = -1
    });
  });

  // =====================================================
  // Chunk Range Calculation Tests
  // =====================================================

  describe('getChunkRange', () => {
    it('should calculate range for chunk 0', () => {
      const [start, end] = getChunkRange(0, 50, 1000);
      expect(start).toBe(0);
      expect(end).toBe(50);
    });

    it('should calculate range for chunk 1', () => {
      const [start, end] = getChunkRange(1, 50, 1000);
      expect(start).toBe(50);
      expect(end).toBe(100);
    });

    it('should calculate range for chunk 10', () => {
      const [start, end] = getChunkRange(10, 50, 1000);
      expect(start).toBe(500);
      expect(end).toBe(550);
    });

    it('should cap end at total records', () => {
      const [start, end] = getChunkRange(19, 50, 980);
      expect(start).toBe(950);
      expect(end).toBe(980); // Capped at totalRecords
    });

    it('should handle custom chunk size', () => {
      const [start, end] = getChunkRange(1, 100, 1000);
      expect(start).toBe(100);
      expect(end).toBe(200);
    });
  });

  // =====================================================
  // Chunk Loading State Tests
  // =====================================================

  describe('isChunkLoaded', () => {
    it('should return false for unloaded chunk', () => {
      expect(isChunkLoaded(tracker, 0)).toBe(false);
    });

    it('should return true for loaded chunk', () => {
      markChunkLoaded(tracker, 0);
      expect(isChunkLoaded(tracker, 0)).toBe(true);
    });

    it('should track multiple loaded chunks independently', () => {
      markChunkLoaded(tracker, 0);
      markChunkLoaded(tracker, 2);
      
      expect(isChunkLoaded(tracker, 0)).toBe(true);
      expect(isChunkLoaded(tracker, 1)).toBe(false);
      expect(isChunkLoaded(tracker, 2)).toBe(true);
    });
  });

  describe('isChunkLoading', () => {
    it('should return false for chunk not loading', () => {
      expect(isChunkLoading(tracker, 0)).toBe(false);
    });

    it('should return true for loading chunk', () => {
      markChunkLoading(tracker, 1);
      expect(isChunkLoading(tracker, 1)).toBe(true);
    });

    it('should return false after loading completes', () => {
      markChunkLoading(tracker, 1);
      markChunkLoaded(tracker, 1);
      
      expect(isChunkLoading(tracker, 1)).toBe(false);
      expect(isChunkLoaded(tracker, 1)).toBe(true);
    });
  });

  // =====================================================
  // Chunk Range Query Tests
  // =====================================================

  describe('getChunksInRange', () => {
    it('should return single chunk for range within one chunk', () => {
      const chunks = getChunksInRange(10, 30, 50);
      expect(chunks).toEqual([0]);
    });

    it('should return multiple chunks for range spanning chunks', () => {
      const chunks = getChunksInRange(25, 75, 50);
      expect(chunks).toEqual([0, 1]);
    });

    it('should return all chunks in large range', () => {
      const chunks = getChunksInRange(0, 250, 50);
      expect(chunks).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle range at chunk boundary', () => {
      const chunks = getChunksInRange(50, 100, 50);
      expect(chunks).toEqual([1]);
    });

    it('should handle single item range', () => {
      const chunks = getChunksInRange(100, 101, 50);
      expect(chunks).toEqual([2]);
    });

    it('should handle empty range', () => {
      const chunks = getChunksInRange(50, 50, 50);
      expect(chunks).toEqual([]);
    });
  });

  // =====================================================
  // Chunk Load Filtering Tests
  // =====================================================

  describe('getChunksToLoad', () => {
    it('should return all chunks when none loaded', () => {
      const chunks = getChunksToLoad(tracker, 0, 100);
      expect(chunks).toEqual([0, 1]);
    });

    it('should exclude already loaded chunks', () => {
      markChunkLoaded(tracker, 0);
      const chunks = getChunksToLoad(tracker, 0, 150);
      expect(chunks).toEqual([1, 2]);
    });

    it('should exclude loading chunks', () => {
      markChunkLoading(tracker, 1);
      const chunks = getChunksToLoad(tracker, 0, 150);
      expect(chunks).toEqual([0, 2]);
    });

    it('should exclude both loaded and loading chunks', () => {
      markChunkLoaded(tracker, 0);
      markChunkLoading(tracker, 2);
      const chunks = getChunksToLoad(tracker, 0, 200);
      expect(chunks).toEqual([1, 3]);
    });

    it('should return empty array when all chunks loaded', () => {
      markChunkLoaded(tracker, 0);
      markChunkLoaded(tracker, 1);
      const chunks = getChunksToLoad(tracker, 0, 100);
      expect(chunks).toEqual([]);
    });
  });

  // =====================================================
  // State Mutation Tests
  // =====================================================

  describe('markChunkLoaded', () => {
    it('should mark chunk as loaded', () => {
      markChunkLoaded(tracker, 5);
      expect(isChunkLoaded(tracker, 5)).toBe(true);
    });

    it('should remove chunk from loading state', () => {
      markChunkLoading(tracker, 5);
      markChunkLoaded(tracker, 5);
      
      expect(isChunkLoading(tracker, 5)).toBe(false);
      expect(isChunkLoaded(tracker, 5)).toBe(true);
    });

    it('should be idempotent', () => {
      markChunkLoaded(tracker, 5);
      markChunkLoaded(tracker, 5);
      
      expect(tracker.loadedChunks.size).toBe(1);
    });
  });

  describe('markChunkLoading', () => {
    it('should mark chunk as loading', () => {
      markChunkLoading(tracker, 3);
      expect(isChunkLoading(tracker, 3)).toBe(true);
    });

    it('should be idempotent', () => {
      markChunkLoading(tracker, 3);
      markChunkLoading(tracker, 3);
      
      expect(tracker.loadingChunks.size).toBe(1);
    });
  });

  describe('unmarkChunkLoading', () => {
    it('should remove chunk from loading state', () => {
      markChunkLoading(tracker, 7);
      unmarkChunkLoading(tracker, 7);
      
      expect(isChunkLoading(tracker, 7)).toBe(false);
    });

    it('should allow retry after error', () => {
      markChunkLoading(tracker, 7);
      unmarkChunkLoading(tracker, 7);
      markChunkLoading(tracker, 7);
      
      expect(isChunkLoading(tracker, 7)).toBe(true);
    });
  });

  describe('clearChunks', () => {
    it('should reset all state', () => {
      markChunkLoaded(tracker, 1);
      markChunkLoaded(tracker, 3);
      markChunkLoading(tracker, 2);
      
      clearChunks(tracker);
      
      expect(tracker.loadedChunks.size).toBe(0);
      expect(tracker.loadingChunks.size).toBe(0);
    });

    it('should preserve chunk size', () => {
      const originalSize = tracker.chunkSize;
      clearChunks(tracker);
      expect(tracker.chunkSize).toBe(originalSize);
    });
  });

  // =====================================================
  // Performance Tests
  // =====================================================

  describe('Performance', () => {
    it('should handle O(1) lookup for loaded chunks', () => {
      // Load 1000 chunks
      for (let i = 0; i < 1000; i++) {
        markChunkLoaded(tracker, i);
      }

      const start = performance.now();
      
      // Check 1000 chunks
      for (let i = 0; i < 1000; i++) {
        isChunkLoaded(tracker, i);
      }
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // O(1) lookups should be very fast
    });

    it('should handle large ranges efficiently', () => {
      const start = performance.now();
      const chunks = getChunksInRange(0, 10000, 50);
      const duration = performance.now() - start;

      expect(chunks.length).toBe(200); // 10000 / 50 = 200 chunks
      expect(duration).toBeLessThan(10); // Should be fast
    });
  });

  // =====================================================
  // Edge Cases
  // =====================================================

  describe('Edge Cases', () => {
    it('should handle chunk size of 1', () => {
      expect(getChunkIndex(0, 1)).toBe(0);
      expect(getChunkIndex(1, 1)).toBe(1);
      expect(getChunkIndex(100, 1)).toBe(100);
    });

    it('should handle very large chunk sizes', () => {
      expect(getChunkIndex(5000, 10000)).toBe(0);
      expect(getChunkIndex(10000, 10000)).toBe(1);
    });

    it('should handle concurrent modifications', () => {
      markChunkLoading(tracker, 1);
      markChunkLoading(tracker, 2);
      markChunkLoaded(tracker, 1);
      markChunkLoaded(tracker, 3);
      
      expect(isChunkLoading(tracker, 1)).toBe(false);
      expect(isChunkLoading(tracker, 2)).toBe(true);
      expect(isChunkLoaded(tracker, 1)).toBe(true);
      expect(isChunkLoaded(tracker, 3)).toBe(true);
    });
  });

  // =====================================================
  // Integration Tests
  // =====================================================

  describe('Integration Scenarios', () => {
    it('should handle typical virtual scroll loading scenario', () => {
      // User scrolls to position 150 (needs chunks 2, 3, 4)
      const chunks = getChunksToLoad(tracker, 100, 250);
      expect(chunks).toEqual([2, 3, 4]);

      // Mark chunk 3 as loading
      markChunkLoading(tracker, 3);

      // Check again - chunk 3 should not be in list
      const remainingChunks = getChunksToLoad(tracker, 100, 250);
      expect(remainingChunks).toEqual([2, 4]);

      // Load chunk 3
      markChunkLoaded(tracker, 3);

      // Check final state
      const finalChunks = getChunksToLoad(tracker, 100, 250);
      expect(finalChunks).toEqual([2, 4]);
      expect(isChunkLoaded(tracker, 3)).toBe(true);
      expect(isChunkLoading(tracker, 3)).toBe(false);
    });

    it('should handle filter change requiring chunk reset', () => {
      // Load some chunks
      markChunkLoaded(tracker, 0);
      markChunkLoaded(tracker, 1);
      markChunkLoading(tracker, 2);

      // Filter changes - reset tracking
      clearChunks(tracker);

      // Verify all chunks need reloading
      const chunks = getChunksToLoad(tracker, 0, 150);
      expect(chunks).toEqual([0, 1, 2]);
    });
  });
});
