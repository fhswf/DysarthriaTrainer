/**
 * Virtual Scroll Table Constants
 * 
 * CRITICAL: ROW_HEIGHT must match in:
 * - Component :row-height prop
 * - virtualScrollerOptions.itemSize
 * - CSS td/tr height
 */
export const ROW_HEIGHT = 53;

/**
 * Initial page size for first load
 * Smaller initial load for faster perceived performance
 */
export const INITIAL_PAGE_SIZE = 50;

/**
 * Debounce delay for lazy loading (ms)
 * Prevents excessive API calls during fast scrolling
 */
export const LAZY_LOAD_DELAY = 200;

/**
 * Buffer multiplier for chunk loading
 * 
 * Defines how many screens of data to load before and after visible area:
 * - bufferMultiplier = 0.5: Load 0.5x visible rows before/after (minimal, frequent loads)
 * - bufferMultiplier = 1.0: Load 1x visible rows before/after (balanced, recommended)
 * - bufferMultiplier = 2.0: Load 2x visible rows before/after (aggressive, less frequent loads)
 * 
 * Formula: chunk_size = (visible_rows * bufferMultiplier) + visible_rows + (visible_rows * bufferMultiplier)
 * 
 * Example with 50 visible rows:
 * - buffer = 0.5: Load 25 + 50 + 25 = 100 rows total
 * - buffer = 1.0: Load 50 + 50 + 50 = 150 rows total (recommended)
 * - buffer = 2.0: Load 100 + 50 + 100 = 250 rows total
 * 
 * Next load triggers when scrolling below 50% of buffer
 */
export const DEFAULT_BUFFER_MULTIPLIER = 1.0;
