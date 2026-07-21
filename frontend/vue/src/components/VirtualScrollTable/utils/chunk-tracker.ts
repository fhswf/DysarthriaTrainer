/**
 * Chunk Tracking Utility for Virtual Scroll Table
 * 
 * Manages tracking of loaded data chunks to prevent duplicate API calls.
 * Uses fixed chunk size intervals (e.g., 50 records per chunk).
 * 
 * @module chunk-tracker
 */

/**
 * Chunk-based loading tracker
 * Uses fixed chunk size (e.g., 50 records per chunk)
 * Tracks which chunks are loaded to prevent duplicate API calls
 */
export interface ChunkTracker {
  /** Chunk size (fixed interval) */
  chunkSize: number;
  /** Set of loaded chunk indices (e.g., chunk 0 = records 0-49, chunk 1 = records 50-99) */
  loadedChunks: Set<number>;
  /** Chunks currently being loaded (prevent duplicate requests) */
  loadingChunks: Set<number>;
}

/**
 * Create a new chunk tracker instance
 * 
 * @param chunkSize - Size of each chunk (default: 50)
 * @returns New ChunkTracker instance
 */
export const createChunkTracker = (chunkSize: number = 50): ChunkTracker => {
  return {
    chunkSize,
    loadedChunks: new Set<number>(),
    loadingChunks: new Set<number>()
  };
};

/**
 * Get chunk index for a record position
 * 
 * @param position - Record position in dataset (0-based)
 * @param chunkSize - Size of each chunk
 * @returns Chunk index
 * 
 * @example
 * getChunkIndex(0, 50) → 0  // positions 0-49 → chunk 0
 * getChunkIndex(25, 50) → 0
 * getChunkIndex(50, 50) → 1  // positions 50-99 → chunk 1
 * getChunkIndex(149, 50) → 2  // positions 100-149 → chunk 2
 */
export const getChunkIndex = (position: number, chunkSize: number): number => {
  return Math.floor(position / chunkSize);
};

/**
 * Get start and end positions for a chunk
 * 
 * @param chunkIndex - Chunk index (0-based)
 * @param chunkSize - Size of each chunk
 * @param totalRecords - Total number of records (for capping end position)
 * @returns [start, end] positions (end is exclusive)
 * 
 * @example
 * getChunkRange(0, 50, 1000) → [0, 50]  // chunk 0: records 0-49
 * getChunkRange(1, 50, 1000) → [50, 100]  // chunk 1: records 50-99
 * getChunkRange(19, 50, 980) → [950, 980]  // last chunk, capped at total
 */
export const getChunkRange = (
  chunkIndex: number, 
  chunkSize: number, 
  totalRecords: number
): [number, number] => {
  const start = chunkIndex * chunkSize;
  const end = Math.min(start + chunkSize, totalRecords);
  return [start, end];
};

/**
 * Check if a chunk is loaded
 * 
 * @param tracker - ChunkTracker instance
 * @param chunkIndex - Chunk index to check
 * @returns True if chunk is loaded
 */
export const isChunkLoaded = (tracker: ChunkTracker, chunkIndex: number): boolean => {
  return tracker.loadedChunks.has(chunkIndex);
};

/**
 * Check if a chunk is currently loading
 * 
 * @param tracker - ChunkTracker instance
 * @param chunkIndex - Chunk index to check
 * @returns True if chunk is being loaded
 */
export const isChunkLoading = (tracker: ChunkTracker, chunkIndex: number): boolean => {
  return tracker.loadingChunks.has(chunkIndex);
};

/**
 * Get all chunk indices that intersect with a range
 * 
 * @param start - Start position (inclusive)
 * @param end - End position (exclusive)
 * @param chunkSize - Size of each chunk
 * @returns Array of chunk indices
 * 
 * @example
 * getChunksInRange(0, 50, 50) → [0]  // only chunk 0
 * getChunksInRange(0, 100, 50) → [0, 1]  // chunks 0 and 1
 * getChunksInRange(25, 75, 50) → [0, 1]  // overlaps both chunks
 * getChunksInRange(150, 250, 50) → [3, 4]  // chunks 3 and 4
 */
export const getChunksInRange = (
  start: number, 
  end: number, 
  chunkSize: number
): number[] => {
  const startChunk = getChunkIndex(start, chunkSize);
  const endChunk = getChunkIndex(Math.max(0, end - 1), chunkSize); // end is exclusive
  const chunks: number[] = [];
  
  for (let i = startChunk; i <= endChunk; i++) {
    chunks.push(i);
  }
  
  return chunks;
};

/**
 * Mark a chunk as being loaded
 * 
 * @param tracker - ChunkTracker instance
 * @param chunkIndex - Chunk index to mark
 */
export const markChunkLoading = (tracker: ChunkTracker, chunkIndex: number): void => {
  tracker.loadingChunks.add(chunkIndex);
};

/**
 * Mark a chunk as loaded
 * 
 * @param tracker - ChunkTracker instance
 * @param chunkIndex - Chunk index to mark
 */
export const markChunkLoaded = (tracker: ChunkTracker, chunkIndex: number): void => {
  tracker.loadedChunks.add(chunkIndex);
  tracker.loadingChunks.delete(chunkIndex);
};

/**
 * Unmark a chunk as loading (e.g., on error or cancellation)
 * 
 * @param tracker - ChunkTracker instance
 * @param chunkIndex - Chunk index to unmark
 */
export const unmarkChunkLoading = (tracker: ChunkTracker, chunkIndex: number): void => {
  tracker.loadingChunks.delete(chunkIndex);
};

/**
 * Clear all chunk tracking data
 * 
 * @param tracker - ChunkTracker instance
 */
export const clearChunks = (tracker: ChunkTracker): void => {
  tracker.loadedChunks.clear();
  tracker.loadingChunks.clear();
};

/**
 * Get chunks that need to be loaded for a given range
 * 
 * Filters out chunks that are already loaded or currently loading.
 * 
 * @param tracker - ChunkTracker instance
 * @param start - Start position
 * @param end - End position
 * @returns Array of chunk indices that need to be loaded
 * 
 * @example
 * // Assuming chunks 0 and 2 are loaded, chunk 1 is loading
 * getChunksToLoad(tracker, 0, 200) → [3]  // Only chunk 3 needs loading
 */
export const getChunksToLoad = (
  tracker: ChunkTracker,
  start: number,
  end: number
): number[] => {
  const neededChunks = getChunksInRange(start, end, tracker.chunkSize);
  return neededChunks.filter(chunk => 
    !isChunkLoaded(tracker, chunk) && !isChunkLoading(tracker, chunk)
  );
};
