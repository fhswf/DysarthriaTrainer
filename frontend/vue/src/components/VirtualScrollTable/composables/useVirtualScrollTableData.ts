import { ref, watch, onBeforeUnmount, type Ref } from 'vue';
import type { 
  BaseApiClient, 
  LazyLoadEvent,
  VirtualScrollTableDataOptions
} from '../types/virtual-scroll-table.types';
import { INITIAL_PAGE_SIZE, LAZY_LOAD_DELAY } from '../constants/virtual-scroll-table.constants';
import { buildParams } from '../utils/filter-processor';
import {
  createChunkTracker,
  getChunkRange,
  getChunksInRange,
  isChunkLoaded,
  isChunkLoading,
  getChunksToLoad,
  markChunkLoading,
  markChunkLoaded,
  unmarkChunkLoading,
  clearChunks,
  type ChunkTracker
} from '../utils/chunk-tracker';
import {
  createRequestTracker,
  getNextSequence,
  setChunkSequence,
  getChunkSequence,
  isResponseOutdated,
  updateLatestCompleted,
  createAbortController,
  removeAbortController,
  cancelAllRequests,
  isCancellationError,
  type RequestTracker
} from '../utils/request-tracker';

/**
 * Composable for managing virtual scroll table data with intelligent chunked lazy loading
 * 
 * Features:
 * - Fixed chunk size intervals (default 50 records per chunk)
 * - Track loaded chunks to prevent duplicate loads
 * - Only load chunks that intersect with visible + buffer range
 * - Prevents double-loading the same data
 * - Memory efficient chunk tracking with Set
 * - **Request cancellation on filter/sort/search change**
 * - **Race condition prevention with sequence numbers**
 * 
 * @param apiClient - API client with list() method
 * @param options - Configuration options
 */
export const useVirtualScrollTableData = <T extends Record<string, any>>(
  apiClient: BaseApiClient<T>,
  options: VirtualScrollTableDataOptions
) => {
  const itemsArray = ref<(T | undefined)[]>([]) as Ref<(T | undefined)[]>;
  const loading = ref(false);
  const totalRecords = ref(0);
  const loadTimeout = ref<NodeJS.Timeout>();
  
  // Component lifecycle flag
  let isMounted = true;
  
  // Initialize trackers
  const CHUNK_SIZE = options.pageSize || INITIAL_PAGE_SIZE;
  const chunkTracker: ChunkTracker = createChunkTracker(CHUNK_SIZE);
  const requestTracker: RequestTracker = createRequestTracker();

  /**
   * Cleanup on component unmount
   */
  onBeforeUnmount(() => {
    isMounted = false;
    
    // Clear any pending timeouts
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value);
    }
    if (resetDebounceTimeout) {
      clearTimeout(resetDebounceTimeout);
    }
    
    // Cancel all pending requests
    cancelAllRequests(requestTracker);
  });

  /**
   * Load a specific chunk with request cancellation and race condition prevention
   */
  const loadChunk = async (chunkIndex: number): Promise<void> => {
    // Guard: Skip if component unmounted
    if (!isMounted) {
      console.log(`⏭️  Chunk ${chunkIndex} skipped - component unmounted`);
      return;
    }
    
    // Skip if already loaded or loading
    if (isChunkLoaded(chunkTracker, chunkIndex) || isChunkLoading(chunkTracker, chunkIndex)) {
      console.log(`⏭️  Chunk ${chunkIndex} already loaded/loading, skipping`);
      return;
    }

    // Skip if totalRecords is 0 (table is in reset/initial state)
    // This prevents race condition where VirtualScroller triggers lazy load
    // after reset() sets totalRecords=0 but before loadInitial() completes
    if (totalRecords.value === 0) {
      console.log(`⏭️  Chunk ${chunkIndex} skipped - table in reset state (totalRecords=0)`);
      return;
    }

    const [start, end] = getChunkRange(chunkIndex, CHUNK_SIZE, totalRecords.value);
    const count = end - start;

    // Get sequence number and create abort controller
    const sequence = getNextSequence(requestTracker);
    setChunkSequence(requestTracker, chunkIndex, sequence);
    const abortController = createAbortController(requestTracker, chunkIndex);

    // Mark as loading
    markChunkLoading(chunkTracker, chunkIndex);
    
    try {
      const params = buildParams(
        start,
        count,
        options.sortField.value,
        options.sortOrder.value,
        options.filters.value
      );
      
      console.log(`📡 Loading chunk ${chunkIndex}:`, { 
        range: `${start}-${end - 1}`, 
        count,
        sequence
      });
      
      // Pass abort signal to API call
      const response = await apiClient.list(params, abortController.signal);
      
      // Guard: Skip if component unmounted during request
      if (!isMounted) {
        console.log(`⏭️  Chunk ${chunkIndex} response discarded - component unmounted`);
        unmarkChunkLoading(chunkTracker, chunkIndex);
        removeAbortController(requestTracker, chunkIndex);
        return;
      }
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log(`🚫 Chunk ${chunkIndex} request was cancelled (sequence ${sequence})`);
        unmarkChunkLoading(chunkTracker, chunkIndex);
        removeAbortController(requestTracker, chunkIndex);
        return;
      }

      // Check for race condition
      if (isResponseOutdated(requestTracker, chunkIndex, sequence)) {
        console.log(`⚠️  Chunk ${chunkIndex} response outdated (seq ${sequence}), discarding`);
        unmarkChunkLoading(chunkTracker, chunkIndex);
        removeAbortController(requestTracker, chunkIndex);
        return;
      }
      
      // Assign loaded data to array
      response.results.forEach((item, idx) => {
        const position = start + idx;
        if (position < itemsArray.value.length) {
          itemsArray.value[position] = item;
        }
      });
      
      // Mark chunk as loaded
      markChunkLoaded(chunkTracker, chunkIndex);
      removeAbortController(requestTracker, chunkIndex);
      
      // Update latest completed sequence
      updateLatestCompleted(requestTracker, sequence);
      
      console.log(`✅ Chunk ${chunkIndex} loaded:`, { 
        range: `${start}-${end - 1}`,
        sequence,
        loadedChunks: Array.from(chunkTracker.loadedChunks).sort((a, b) => a - b)
      });
      
    } catch (error: any) {
      // Don't log cancelled requests as errors
      if (!isCancellationError(error)) {
        console.error(`❌ Error loading chunk ${chunkIndex}:`, error);
      }
      
      unmarkChunkLoading(chunkTracker, chunkIndex);
      removeAbortController(requestTracker, chunkIndex);
      
      // Only throw non-cancellation errors
      if (!isCancellationError(error)) {
        throw error;
      }
    }
  };

  /**
   * Handle lazy load event from VirtualScroller
   * 
   * NEW STRATEGY:
   * 1. Calculate visible range from scroll position
   * 2. Add buffer before and after visible range
   * 3. Determine which chunks intersect with visible + buffer range
   * 4. Load only chunks that aren't already loaded/loading
   * 5. No duplicate loads!
   * 6. Cancel pending requests on new scroll
   * 7. Skip eager buffer loading if user hasn't scrolled yet (prevents blocking on mount)
   */
  const onLazyLoad = async (event: LazyLoadEvent) => {
    const { first, last } = event;
    const visibleCount = last - first;
    const bufferMultiplier = options.bufferMultiplier || 1.0;
    
    // OPTIMIZATION: If user is still at the top (hasn't scrolled yet),
    // don't eagerly load buffer chunks - wait for actual scrolling
    // This prevents the annoying "second load" that blocks interaction immediately after mount
    const hasScrolled = first > 0;
    const effectiveBufferMultiplier = hasScrolled ? bufferMultiplier : 0.2; // Minimal buffer until scrolling
    
    // Calculate range with buffer
    const bufferSize = Math.floor(visibleCount * effectiveBufferMultiplier);
    const rangeStart = Math.max(0, first - bufferSize);
    const rangeEnd = Math.min(totalRecords.value, last + bufferSize);
    
    console.log('🔄 onLazyLoad:', { 
      visible: { first, last, count: visibleCount },
      withBuffer: { start: rangeStart, end: rangeEnd },
      bufferSize,
      hasScrolled,
      effectiveBufferMultiplier
    });
    
    // Get all chunks that intersect with visible + buffer range
    const neededChunks = getChunksInRange(rangeStart, rangeEnd, CHUNK_SIZE);
    
    // Filter to only unloaded chunks using the utility function
    const chunksToLoad = getChunksToLoad(chunkTracker, rangeStart, rangeEnd);
    
    if (chunksToLoad.length === 0) {
      console.log('✅ All needed chunks already loaded:', {
        neededChunks,
        loadedChunks: Array.from(chunkTracker.loadedChunks).sort((a, b) => a - b)
      });
      return;
    }
    
    console.log('📦 Chunks to load:', {
      needed: neededChunks,
      alreadyLoaded: neededChunks.filter((c: number) => isChunkLoaded(chunkTracker, c)),
      toLoad: chunksToLoad
    });
    
    // Clear pending timeout
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value);
    }
    
    // Debounce for smooth fast scrolling
    loadTimeout.value = setTimeout(async () => {
      // Guard: Skip if component unmounted during timeout
      if (!isMounted) return;
      
      try {
        loading.value = true;
        
        // Load all needed chunks in parallel
        await Promise.all(chunksToLoad.map(chunk => loadChunk(chunk)));
        
      } catch (error) {
        console.error('❌ Error in lazy load:', error);
        throw error;
      } finally {
        // Guard: Only update if still mounted
        if (isMounted) {
          loading.value = false;
        }
      }
    }, options.delay || LAZY_LOAD_DELAY);
  };

  /**
   * Load initial data with request cancellation
   * Loads first chunk and initializes the array
   * 
   * @param priorityScrollPosition - Optional scroll position to load first (for session restoration)
   */
  const loadInitial = async (priorityScrollPosition?: number) => {
    if (loading.value) return;
    
    // Cancel any pending requests
    cancelAllRequests(requestTracker);
    
    loading.value = true;
    
    // Get sequence number for this request
    const sequence = getNextSequence(requestTracker);
    
    // Create AbortController for initial load
    const abortController = new AbortController();
    requestTracker.abortControllers.set(-1, abortController); // Use -1 for initial load
    
    try {
      // Determine which chunk to load first based on priority scroll position
      const priorityChunk = priorityScrollPosition !== undefined && priorityScrollPosition > 0
        ? Math.floor(priorityScrollPosition / CHUNK_SIZE)
        : 0;
      
      const priorityChunkStart = priorityChunk * CHUNK_SIZE;
      
      console.log('🚀 Initial load:', {
        priorityScrollPosition,
        priorityChunk,
        priorityChunkStart,
        chunkSize: CHUNK_SIZE
      });
      
      // Load the priority chunk first to get total count and populate visible area
      const params = buildParams(
        priorityChunkStart,
        CHUNK_SIZE,
        options.sortField.value,
        options.sortOrder.value,
        options.filters.value
      );
      const response = await apiClient.list(params, abortController.signal);
      
      // Guard: Skip if component unmounted during request
      if (!isMounted) {
        console.log('⏭️ Initial load response discarded - component unmounted');
        loading.value = false;
        requestTracker.abortControllers.delete(-1);
        return;
      }
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log('🚫 Initial load cancelled');
        loading.value = false;
        requestTracker.abortControllers.delete(-1);
        return;
      }
      
      // Check for race condition
      if (sequence <= requestTracker.latestCompleted) {
        console.log('⏭️ Initial load response outdated, ignoring');
        loading.value = false;
        requestTracker.abortControllers.delete(-1);
        return;
      }
      
      totalRecords.value = response.count;
      
      // Initialize array with undefined placeholders
      itemsArray.value = Array.from({ length: response.count });
      
      // Fill the priority chunk
      response.results.forEach((item, idx) => {
        const position = priorityChunkStart + idx;
        if (position < itemsArray.value.length) {
          itemsArray.value[position] = item;
        }
      });
      
      // Mark priority chunk as loaded
      chunkTracker.loadedChunks.clear();
      chunkTracker.loadedChunks.add(priorityChunk);
      
      // Update latest completed sequence
      requestTracker.latestCompleted = Math.max(sequence, requestTracker.latestCompleted);
      
      const totalChunks = Math.ceil(response.count / CHUNK_SIZE);
      
      console.log('✅ Initial load complete:', { 
        totalRecords: response.count,
        loaded: response.results.length,
        chunkSize: CHUNK_SIZE,
        totalChunks,
        loadedChunks: [priorityChunk],
        priorityChunkRange: `${priorityChunkStart}-${priorityChunkStart + response.results.length - 1}`,
        sequence
      });
      
      loading.value = false;
      requestTracker.abortControllers.delete(-1);
      
      // If priority chunk is not chunk 0, also load chunk 0 in the background
      // This ensures we have data at the beginning for proper table initialization
      if (priorityChunk > 0) {
        console.log('📦 Loading chunk 0 in background...');
        setTimeout(() => {
          // Guard: Skip if component unmounted during timeout
          if (!isMounted) return;
          loadChunk(0);
        }, 100);
      }
    } catch (error: any) {
      // Don't log cancelled requests as errors
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('🚫 Initial load cancelled');
      } else {
        console.error('❌ Error loading initial data:', error);
      }
      
      loading.value = false;
      requestTracker.abortControllers.delete(-1);
      
      // Only throw non-cancellation errors
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        throw error;
      }
    }
  };

  /**
   * Refresh data (reload from beginning) with cancellation
   */
  const refresh = async () => {
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value);
    }
    
    // Cancel all pending requests
    cancelAllRequests(requestTracker);
    
    // Clear chunk tracking
    chunkTracker.loadedChunks.clear();
    chunkTracker.loadingChunks.clear();
    
    itemsArray.value = [];
    totalRecords.value = 0;
    
    await loadInitial();
  };

  /**
   * Reset on filter/sort change with cancellation
   */
  const reset = () => {
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value);
    }
    
    // Cancel all pending requests
    cancelAllRequests(requestTracker);
    
    // Clear chunk tracking
    chunkTracker.loadedChunks.clear();
    chunkTracker.loadingChunks.clear();
    
    itemsArray.value = [];
    totalRecords.value = 0;
    
    loadInitial();
  };

  // Debounce timeout for filter/sort changes
  let resetDebounceTimeout: NodeJS.Timeout | undefined;
  const RESET_DEBOUNCE_DELAY = 300; // ms - wait for user to finish typing

  /**
   * Watch for changes in sort/filter with immediate cancellation + debounced reload
   * This ensures:
   * 1. Old requests are cancelled IMMEDIATELY on any change
   * 2. New requests are debounced to wait for user to finish typing
   * 3. No race conditions between search input and request state
   */
  watch(
    [
      () => options.sortField.value,
      () => options.sortOrder.value,
      () => options.filters.value
    ],
    () => {
    // STEP 1: Cancel immediately (no debounce)
    console.log('🔄 Filter/sort changed - cancelling pending requests');
    
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value);
    }
    
    // Cancel all ongoing requests immediately
    cancelAllRequests(requestTracker);
    
    // STEP 2: Debounce the reset/reload
    if (resetDebounceTimeout) {
      clearTimeout(resetDebounceTimeout);
    }
    
    resetDebounceTimeout = setTimeout(() => {
      // Guard: Skip if component unmounted during timeout
      if (!isMounted) return;
      
      console.log('⏱️ Debounce complete - resetting and loading');
      
      // Clear chunk tracking
      chunkTracker.loadedChunks.clear();
      chunkTracker.loadingChunks.clear();
      
      itemsArray.value = [];
      totalRecords.value = 0;
      
      loadInitial();
    }, RESET_DEBOUNCE_DELAY);
  }, { 
    deep: true 
  });

  // Initial load
  loadInitial();

  return {
    items: itemsArray,
    loading,
    totalRecords,
    onLazyLoad,
    refresh,
    reset,
    loadInitial, // Expose for priority loading
  };
};
