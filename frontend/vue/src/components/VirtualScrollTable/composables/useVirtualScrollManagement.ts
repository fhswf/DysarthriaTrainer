/**
 * Virtual Scroll Management Composable
 * 
 * Handles scroll event listening, position tracking, and restoration for VirtualScrollTable.
 * Extracted from VirtualScrollTable.vue to reduce component size and improve maintainability.
 * 
 * Features:
 * - Native scroll event handling for real-time updates
 * - Scroll position tracking (first/last visible indices)
 * - Session storage integration for scroll restoration
 * - Automatic cleanup on unmount
 * 
 * @module useVirtualScrollManagement
 */

import { ref, type Ref, onBeforeUnmount } from 'vue';
import type DataTable from 'primevue/datatable';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[ScrollManagement]', ...args);

export interface ScrollManagementOptions {
  /**
   * DataTable ref from parent component
   */
  dataTableRef: Ref<InstanceType<typeof DataTable> | undefined>;
  
  /**
   * Effective row height (computed from props)
   */
  effectiveRowHeight: Ref<number>;
  
  /**
   * Total number of records in the dataset
   */
  totalRecords: Ref<number>;
  
  /**
   * Callback to emit scroll position changes
   */
  onScrollChange?: (position: { first: number; last: number }) => void;
  
  /**
   * Whether progress bar is enabled (requires scroll tracking)
   */
  enableProgressBar?: boolean;
}

/**
 * Virtual Scroll Management Composable
 * 
 * @param options - Configuration options
 * @returns Scroll management state and methods
 * 
 * @example
 * ```typescript
 * const scrollManagement = useVirtualScrollManagement({
 *   dataTableRef,
 *   effectiveRowHeight,
 *   totalRecords,
 *   onScrollChange: (pos) => emit('scroll-index-change', pos),
 *   enableProgressBar: true,
 * });
 * 
 * // Access scroll position
 * const { scrollPosition } = scrollManagement;
 * 
 * // Manual attachment (usually called in onMounted)
 * scrollManagement.attachScrollListener();
 * ```
 */
export function useVirtualScrollManagement(options: ScrollManagementOptions) {
  const {
    dataTableRef,
    effectiveRowHeight,
    totalRecords,
    onScrollChange,
    enableProgressBar = false,
  } = options;

  /**
   * Current scroll position (visible row indices)
   */
  const scrollPosition = ref<{ first: number; last: number }>({
    first: 0,
    last: 0,
  });

  /**
   * Handle native scroll event for real-time progress bar updates
   * This provides smooth, continuous updates as the user scrolls
   */
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const clientHeight = target.clientHeight;
    
    // Calculate which rows are visible based on scroll position
    const firstVisibleIndex = Math.floor(scrollTop / effectiveRowHeight.value);
    const visibleRowCount = Math.ceil(clientHeight / effectiveRowHeight.value);
    const lastVisibleIndex = Math.min(
      firstVisibleIndex + visibleRowCount - 1,
      totalRecords.value - 1
    );

    // Update scroll position for progress bar (real-time)
    scrollPosition.value = {
      first: firstVisibleIndex,
      last: lastVisibleIndex
    };

    // Notify parent of scroll change
    onScrollChange?.({
      first: firstVisibleIndex,
      last: lastVisibleIndex
    });

    log('📜 SCROLL EVENT', {
      scrollTop,
      firstVisible: firstVisibleIndex,
      lastVisible: lastVisibleIndex,
      visibleCount: lastVisibleIndex - firstVisibleIndex + 1
    });
  };

  /**
   * Calculate and update initial scroll position based on DOM
   * Called after DataTable mounts to set correct initial state
   */
  const updateInitialScrollPosition = () => {
    if (!dataTableRef.value) {
      log('⚠️ DataTable ref not available for initial position calculation');
      return;
    }

    if (totalRecords.value === 0) {
      log('⚠️ No records available yet, skipping initial position calculation');
      return;
    }

    try {
      // @ts-ignore - accessing internal PrimeVue structure
      const virtualScroller = dataTableRef.value.$refs?.virtualScroller;
      
      if (!virtualScroller) {
        log('⚠️ VirtualScroller not found for initial position');
        return;
      }

      // @ts-ignore
      const scrollElement = virtualScroller.$el?.querySelector('.p-virtualscroller') || virtualScroller.$el;
      
      if (scrollElement) {
        const clientHeight = scrollElement.clientHeight;
        
        if (clientHeight === 0) {
          log('⚠️ VirtualScroller has no height yet, skipping calculation');
          return;
        }
        
        // Calculate how many rows fit in the viewport
        const visibleRowCount = Math.ceil(clientHeight / effectiveRowHeight.value);
        
        // Initial scroll shows rows 0 to visibleRowCount-1
        const initialLast = Math.min(visibleRowCount - 1, totalRecords.value - 1);
        
        scrollPosition.value = {
          first: 0,
          last: initialLast
        };

        // Notify parent
        onScrollChange?.({
          first: 0,
          last: initialLast
        });

        log('📍 Initial scroll position calculated', {
          clientHeight,
          rowHeight: effectiveRowHeight.value,
          visibleRows: visibleRowCount,
          first: 0,
          last: initialLast,
          totalRecords: totalRecords.value
        });
      }
    } catch (error) {
      log('❌ Error calculating initial scroll position:', error);
    }
  };

  /**
   * Attach native scroll listener to the VirtualScroller element
   * This is necessary because DataTable's virtualScrollerOptions doesn't expose onScrollIndexChange
   */
  const attachScrollListener = () => {
    if (!dataTableRef.value) {
      log('⚠️ DataTable ref not available yet');
      return;
    }

    try {
      // Access internal VirtualScroller through DataTable's $refs
      // @ts-ignore - accessing internal PrimeVue structure
      const virtualScroller = dataTableRef.value.$refs?.virtualScroller;
      
      if (!virtualScroller) {
        log('⚠️ VirtualScroller not found in DataTable');
        return;
      }

      // Access the scrollable element (the one that actually scrolls)
      // @ts-ignore
      const scrollElement = virtualScroller.$el?.querySelector('.p-virtualscroller') || virtualScroller.$el;
      
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        log('✅ Native scroll listener attached to VirtualScroller');
      } else {
        log('⚠️ Could not find scrollable element in VirtualScroller');
      }
    } catch (error) {
      log('❌ Error attaching scroll listener:', error);
    }
  };

  /**
   * Remove scroll listener
   * Called manually or automatically on unmount
   */
  const detachScrollListener = () => {
    if (!dataTableRef.value) return;

    try {
      // @ts-ignore
      const virtualScroller = dataTableRef.value.$refs?.virtualScroller;
      if (virtualScroller) {
        // @ts-ignore
        const scrollElement = virtualScroller.$el?.querySelector('.p-virtualscroller') || virtualScroller.$el;
        if (scrollElement) {
          scrollElement.removeEventListener('scroll', handleScroll);
          log('✅ Scroll listener detached');
        }
      }
    } catch (error) {
      log('❌ Error detaching scroll listener:', error);
    }
  };

  // Automatic cleanup on component unmount
  onBeforeUnmount(() => {
    detachScrollListener();
  });

  return {
    scrollPosition,
    attachScrollListener,
    detachScrollListener,
    updateInitialScrollPosition,
    handleScroll,
  };
}
