/**
 * Request Tracking Utility for Virtual Scroll Table
 * 
 * Manages request cancellation and race condition prevention.
 * Ensures only the latest request's results are displayed using sequence numbers
 * and AbortController for cancellation.
 * 
 * @module request-tracker
 */

/**
 * Request tracking for race condition prevention
 * Ensures only the latest request's results are displayed
 */
export interface RequestTracker {
  /** Current request sequence number (increments on each request) */
  currentSequence: number;
  /** Latest completed sequence number */
  latestCompleted: number;
  /** Map of chunk index to its request sequence */
  chunkSequences: Map<number, number>;
  /** AbortController for current requests (keyed by chunk index or -1 for initial load) */
  abortControllers: Map<number, AbortController>;
}

/**
 * Create a new request tracker instance
 * 
 * @returns New RequestTracker instance
 */
export const createRequestTracker = (): RequestTracker => {
  return {
    currentSequence: 0,
    latestCompleted: 0,
    chunkSequences: new Map<number, number>(),
    abortControllers: new Map<number, AbortController>()
  };
};

/**
 * Get next sequence number for race condition tracking
 * 
 * @param tracker - RequestTracker instance
 * @returns New sequence number
 */
export const getNextSequence = (tracker: RequestTracker): number => {
  return ++tracker.currentSequence;
};

/**
 * Store sequence number for a chunk request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index (use -1 for initial load)
 * @param sequence - Sequence number to store
 */
export const setChunkSequence = (
  tracker: RequestTracker, 
  chunkIndex: number, 
  sequence: number
): void => {
  tracker.chunkSequences.set(chunkIndex, sequence);
};

/**
 * Get sequence number for a chunk request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index
 * @returns Sequence number or undefined if not found
 */
export const getChunkSequence = (
  tracker: RequestTracker, 
  chunkIndex: number
): number | undefined => {
  return tracker.chunkSequences.get(chunkIndex);
};

/**
 * Clear sequence number for a chunk request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index
 */
export const clearChunkSequence = (tracker: RequestTracker, chunkIndex: number): void => {
  tracker.chunkSequences.delete(chunkIndex);
};

/**
 * Check if a response is outdated (sequence mismatch)
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index
 * @param sequence - Response sequence number
 * @returns True if response is outdated and should be ignored
 */
export const isResponseOutdated = (
  tracker: RequestTracker, 
  chunkIndex: number, 
  sequence: number
): boolean => {
  const currentSequence = getChunkSequence(tracker, chunkIndex);
  return currentSequence !== sequence;
};

/**
 * Update latest completed sequence number
 * 
 * @param tracker - RequestTracker instance
 * @param sequence - Sequence number that completed
 */
export const updateLatestCompleted = (tracker: RequestTracker, sequence: number): void => {
  if (sequence > tracker.latestCompleted) {
    tracker.latestCompleted = sequence;
  }
};

/**
 * Create and store AbortController for a request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index (use -1 for initial load)
 * @returns New AbortController instance
 */
export const createAbortController = (
  tracker: RequestTracker, 
  chunkIndex: number
): AbortController => {
  const controller = new AbortController();
  tracker.abortControllers.set(chunkIndex, controller);
  return controller;
};

/**
 * Get AbortController for a request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index
 * @returns AbortController or undefined if not found
 */
export const getAbortController = (
  tracker: RequestTracker, 
  chunkIndex: number
): AbortController | undefined => {
  return tracker.abortControllers.get(chunkIndex);
};

/**
 * Remove AbortController for a request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index
 */
export const removeAbortController = (tracker: RequestTracker, chunkIndex: number): void => {
  tracker.abortControllers.delete(chunkIndex);
};

/**
 * Cancel a specific request
 * 
 * @param tracker - RequestTracker instance
 * @param chunkIndex - Chunk index to cancel
 */
export const cancelRequest = (tracker: RequestTracker, chunkIndex: number): void => {
  const controller = getAbortController(tracker, chunkIndex);
  if (controller) {
    controller.abort();
    console.log(`🚫 Cancelled request for chunk ${chunkIndex}`);
  }
  removeAbortController(tracker, chunkIndex);
  clearChunkSequence(tracker, chunkIndex);
};

/**
 * Cancel all pending requests
 * Called when filters/sort change or component unmounts
 * 
 * @param tracker - RequestTracker instance
 */
export const cancelAllRequests = (tracker: RequestTracker): void => {
  console.log('🚫 Cancelling all pending requests:', {
    pendingCount: tracker.abortControllers.size
  });
  
  tracker.abortControllers.forEach((controller, chunkIndex) => {
    controller.abort();
    console.log(`  ❌ Cancelled chunk ${chunkIndex}`);
  });
  
  tracker.abortControllers.clear();
  tracker.chunkSequences.clear();
};

/**
 * Check if an error is a cancellation error
 * 
 * @param error - Error to check
 * @returns True if error is from request cancellation
 */
export const isCancellationError = (error: any): boolean => {
  return error && (error.name === 'AbortError' || error.name === 'CanceledError');
};

/**
 * Reset request tracker state
 * 
 * @param tracker - RequestTracker instance
 */
export const resetTracker = (tracker: RequestTracker): void => {
  cancelAllRequests(tracker);
  tracker.currentSequence = 0;
  tracker.latestCompleted = 0;
};
