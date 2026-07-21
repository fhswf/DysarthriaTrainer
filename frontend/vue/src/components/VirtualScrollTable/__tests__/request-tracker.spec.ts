/**
 * Request Tracker - Unit Tests
 * 
 * Tests for request cancellation and race condition prevention
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRequestTracker,
  getNextSequence,
  isResponseOutdated,
  createAbortController,
  getAbortController,
  cancelRequest,
  cancelAllRequests,
  updateLatestCompleted,
  resetTracker,
  setChunkSequence,
  getChunkSequence,
  type RequestTracker
} from '../utils/request-tracker';

describe('Request Tracker Utility', () => {
  let tracker: RequestTracker;

  beforeEach(() => {
    tracker = createRequestTracker();
  });

  // ============================================================================
  // Factory Function Tests
  // ============================================================================

  describe('createRequestTracker', () => {
    it('should create tracker with initial sequence 0', () => {
      const t = createRequestTracker();
      expect(t.currentSequence).toBe(0);
      expect(t.latestCompleted).toBe(0);
    });

    it('should initialize with empty maps', () => {
      expect(tracker.chunkSequences.size).toBe(0);
      expect(tracker.abortControllers.size).toBe(0);
    });
  });

  // ============================================================================
  // Sequence Number Tests
  // ============================================================================

  describe('getNextSequence', () => {
    it('should start from 1', () => {
      const seq = getNextSequence(tracker);
      expect(seq).toBe(1);
    });

    it('should increment sequence', () => {
      const seq1 = getNextSequence(tracker);
      const seq2 = getNextSequence(tracker);
      const seq3 = getNextSequence(tracker);
      
      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
      expect(seq3).toBe(3);
    });

    it('should update currentSequence', () => {
      getNextSequence(tracker);
      expect(tracker.currentSequence).toBe(1);
      
      getNextSequence(tracker);
      expect(tracker.currentSequence).toBe(2);
    });
  });

  // ============================================================================
  // Chunk Sequence Tests
  // ============================================================================

  describe('setChunkSequence / getChunkSequence', () => {
    it('should store and retrieve sequence for chunk', () => {
      setChunkSequence(tracker, 0, 5);
      expect(getChunkSequence(tracker, 0)).toBe(5);
    });

    it('should return undefined for non-existent chunk', () => {
      expect(getChunkSequence(tracker, 99)).toBeUndefined();
    });

    it('should handle multiple chunks', () => {
      setChunkSequence(tracker, 0, 1);
      setChunkSequence(tracker, 1, 2);
      setChunkSequence(tracker, 2, 3);
      
      expect(getChunkSequence(tracker, 0)).toBe(1);
      expect(getChunkSequence(tracker, 1)).toBe(2);
      expect(getChunkSequence(tracker, 2)).toBe(3);
    });
  });

  // ============================================================================
  // Response Outdated Tests
  // ============================================================================

  describe('isResponseOutdated', () => {
    it('should return false when sequence matches', () => {
      setChunkSequence(tracker, 0, 5);
      expect(isResponseOutdated(tracker, 0, 5)).toBe(false);
    });

    it('should return true when sequence does not match', () => {
      setChunkSequence(tracker, 0, 5);
      expect(isResponseOutdated(tracker, 0, 3)).toBe(true);
    });

    it('should return true when no sequence stored', () => {
      expect(isResponseOutdated(tracker, 0, 5)).toBe(true);
    });

    it('should handle race condition scenario', () => {
      // Start request 1
      const seq1 = getNextSequence(tracker);
      setChunkSequence(tracker, 0, seq1);
      
      // Start request 2 (cancels request 1)
      const seq2 = getNextSequence(tracker);
      setChunkSequence(tracker, 0, seq2);
      
      // Request 1 response arrives - should be outdated
      expect(isResponseOutdated(tracker, 0, seq1)).toBe(true);
      
      // Request 2 response arrives - should be current
      expect(isResponseOutdated(tracker, 0, seq2)).toBe(false);
    });
  });

  // ============================================================================
  // AbortController Tests
  // ============================================================================

  describe('createAbortController', () => {
    it('should create controller for chunk', () => {
      const controller = createAbortController(tracker, 0);
      
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal.aborted).toBe(false);
    });

    it('should store controller in map', () => {
      createAbortController(tracker, 0);
      expect(tracker.abortControllers.has(0)).toBe(true);
    });

    it('should handle multiple chunks', () => {
      const controller1 = createAbortController(tracker, 0);
      const controller2 = createAbortController(tracker, 1);
      
      expect(controller1).not.toBe(controller2);
      expect(tracker.abortControllers.size).toBe(2);
    });
  });

  describe('getAbortController', () => {
    it('should return undefined for non-existent chunk', () => {
      const controller = getAbortController(tracker, 99);
      expect(controller).toBeUndefined();
    });

    it('should return controller for existing chunk', () => {
      const created = createAbortController(tracker, 0);
      const retrieved = getAbortController(tracker, 0);
      
      expect(retrieved).toBe(created);
    });
  });

  // ============================================================================
  // Cancellation Tests
  // ============================================================================

  describe('cancelRequest', () => {
    it('should cancel specific chunk request', () => {
      const controller = createAbortController(tracker, 3);
      setChunkSequence(tracker, 3, 5);
      
      cancelRequest(tracker, 3);
      
      expect(controller.signal.aborted).toBe(true);
      expect(tracker.abortControllers.has(3)).toBe(false);
      expect(tracker.chunkSequences.has(3)).toBe(false);
    });

    it('should handle non-existent chunk gracefully', () => {
      expect(() => cancelRequest(tracker, 999)).not.toThrow();
    });

    it('should not affect other chunks', () => {
      const controller1 = createAbortController(tracker, 1);
      const controller2 = createAbortController(tracker, 2);
      
      cancelRequest(tracker, 1);
      
      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(false);
    });
  });

  describe('cancelAllRequests', () => {
    it('should cancel all active requests', () => {
      const controller1 = createAbortController(tracker, 0);
      const controller2 = createAbortController(tracker, 1);
      const controller3 = createAbortController(tracker, 2);
      
      cancelAllRequests(tracker);
      
      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(true);
      expect(controller3.signal.aborted).toBe(true);
    });

    it('should clear all maps', () => {
      createAbortController(tracker, 0);
      createAbortController(tracker, 1);
      setChunkSequence(tracker, 0, 1);
      setChunkSequence(tracker, 1, 2);
      
      cancelAllRequests(tracker);
      
      expect(tracker.abortControllers.size).toBe(0);
      expect(tracker.chunkSequences.size).toBe(0);
    });

    it('should handle empty tracker', () => {
      expect(() => cancelAllRequests(tracker)).not.toThrow();
    });
  });

  // ============================================================================
  // Latest Completed Tests
  // ============================================================================

  describe('updateLatestCompleted', () => {
    it('should update latestCompleted', () => {
      updateLatestCompleted(tracker, 5);
      expect(tracker.latestCompleted).toBe(5);
    });

    it('should only update if sequence is higher', () => {
      updateLatestCompleted(tracker, 5);
      updateLatestCompleted(tracker, 3);
      
      expect(tracker.latestCompleted).toBe(5);
    });

    it('should update to higher sequence', () => {
      updateLatestCompleted(tracker, 5);
      updateLatestCompleted(tracker, 10);
      
      expect(tracker.latestCompleted).toBe(10);
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe('resetTracker', () => {
    it('should reset all state', () => {
      getNextSequence(tracker);
      getNextSequence(tracker);
      createAbortController(tracker, 0);
      setChunkSequence(tracker, 0, 1);
      updateLatestCompleted(tracker, 2);
      
      resetTracker(tracker);
      
      expect(tracker.currentSequence).toBe(0);
      expect(tracker.latestCompleted).toBe(0);
      expect(tracker.chunkSequences.size).toBe(0);
      expect(tracker.abortControllers.size).toBe(0);
    });

    it('should cancel all pending requests', () => {
      const controller1 = createAbortController(tracker, 0);
      const controller2 = createAbortController(tracker, 1);
      
      resetTracker(tracker);
      
      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(true);
    });
  });

  // ============================================================================
  // Race Condition Scenario Tests
  // ============================================================================

  describe('Race Condition Scenarios', () => {
    it('should handle rapid filter changes', () => {
      const controllers: AbortController[] = [];
      
      // Simulate 5 rapid filter changes for same chunk
      for (let i = 1; i <= 5; i++) {
        const controller = createAbortController(tracker, 0);
        const seq = getNextSequence(tracker);
        setChunkSequence(tracker, 0, seq);
        
        if (i < 5) {
          controllers.push(controller);
          // Manually cancel old requests
          cancelRequest(tracker, 0);
        }
      }
    });

    it('should handle scroll-triggered chunk loads', () => {
      // Simulate loading chunks 0, 1, 2 simultaneously
      const seq0 = getNextSequence(tracker);
      const controller0 = createAbortController(tracker, 0);
      setChunkSequence(tracker, 0, seq0);
      
      const seq1 = getNextSequence(tracker);
      const controller1 = createAbortController(tracker, 1);
      setChunkSequence(tracker, 1, seq1);
      
      const seq2 = getNextSequence(tracker);
      const controller2 = createAbortController(tracker, 2);
      setChunkSequence(tracker, 2, seq2);
      
      // All should be active
      expect(controller0.signal.aborted).toBe(false);
      expect(controller1.signal.aborted).toBe(false);
      expect(controller2.signal.aborted).toBe(false);
      
      // Complete in random order
      updateLatestCompleted(tracker, seq1);
      updateLatestCompleted(tracker, seq0);
      updateLatestCompleted(tracker, seq2);
      
      // seq2 is the latest completed
      expect(tracker.latestCompleted).toBe(seq2);
    });

    it('should handle filter change canceling all chunks', () => {
      // Load chunks 0-5
      for (let i = 0; i < 6; i++) {
        createAbortController(tracker, i);
        setChunkSequence(tracker, i, i + 1);
      }
      
      expect(tracker.abortControllers.size).toBe(6);
      
      // Filter change - cancel all
      cancelAllRequests(tracker);
      
      expect(tracker.abortControllers.size).toBe(0);
      expect(tracker.chunkSequences.size).toBe(0);
    });
  });
});
