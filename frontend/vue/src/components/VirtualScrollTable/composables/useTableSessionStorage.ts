/**
 * Table Session Storage Integration Composable
 * 
 * Manages session storage integration specifically for VirtualScrollTable component.
 * Handles scroll position restoration and watches for data loading to trigger restoration.
 * 
 * This is separate from the base useSessionStorage composable - this handles the
 * component-level integration logic while useSessionStorage is the generic storage utility.
 * 
 * Features:
 * - Automatic scroll position saving via session storage
 * - Smart restoration after data loads
 * - Waiting for sufficient data before scrolling
 * - Integration with navigation composable
 * 
 * @module useTableSessionStorage
 */

import { ref, watch, type Ref } from 'vue';
import { useSessionStorage, type SessionStorageConfig } from './useSessionStorage';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[TableSessionStorage]', ...args);

export interface TableSessionStorageOptions {
  /**
   * Session storage configuration (from component props)
   */
  config: Partial<SessionStorageConfig> | undefined;
  
  /**
   * Current scroll position (first visible index)
   */
  scrollPosition: Ref<{ first: number; last: number }>;
  
  /**
   * Array of loaded items
   */
  items: Ref<any[]>;
  
  /**
   * Total number of records
   */
  totalRecords: Ref<number>;
  
  /**
   * Navigation function to scroll to index
   */
  scrollToIndex: (index: number, behavior?: 'auto' | 'smooth') => void | Promise<void>;
}

export interface TableSessionStorageReturn {
  /**
   * Session storage API (if enabled)
   */
  sessionStorageApi: ReturnType<typeof useSessionStorage> | null;
  
  /**
   * Whether scroll restoration is pending
   */
  scrollRestorationPending: Ref<boolean>;
  
  /**
   * Saved scroll position from storage
   */
  savedScrollPosition: Ref<number | undefined>;
}

/**
 * Table Session Storage Integration Composable
 * 
 * @param options - Configuration options
 * @returns Session storage state and API
 * 
 * @example
 * ```typescript
 * const tableSessionStorage = useTableSessionStorage({
 *   config: props.sessionStorage,
 *   scrollPosition: scrollManagement.scrollPosition,
 *   items: toRef(props, 'items'),
 *   totalRecords: toRef(props, 'totalRecords'),
 *   scrollToIndex: navigation.scrollToIndex,
 * });
 * 
 * // Check if restoration is pending
 * if (tableSessionStorage.scrollRestorationPending.value) {
 *   // ...
 * }
 * ```
 */
export function useTableSessionStorage(
  options: TableSessionStorageOptions
): TableSessionStorageReturn {
  const {
    config,
    scrollPosition,
    items,
    totalRecords,
    scrollToIndex,
  } = options;

  const scrollRestorationPending = ref(false);
  const savedScrollPosition = ref<number | undefined>(undefined);
  let sessionStorageApi: ReturnType<typeof useSessionStorage> | null = null;

  // Only setup if storage key is provided
  if (config?.storageKey) {
    const currentScrollIndex = ref(0);
    
    sessionStorageApi = useSessionStorage(
      {
        storageKey: config.storageKey,
        persistScroll: config.persistScroll ?? true,
        persistSearch: false, // Search handled at parent level
        persistSort: false, // Sort handled at parent level
        persistFilters: false, // Filters handled at parent level
        debounceDelay: config.debounceDelay ?? 300,
      },
      {
        scrollPosition: currentScrollIndex,
      }
    );

    // Load saved scroll position on initialization (but don't restore yet)
    const savedState = sessionStorageApi.loadState();
    if (savedState?.scrollPosition !== undefined && savedState.scrollPosition > 0) {
      savedScrollPosition.value = savedState.scrollPosition;
      scrollRestorationPending.value = true;
      log('📍 Saved scroll position loaded:', savedScrollPosition.value);
    }

    // Watch scroll position changes and update the ref
    watch(scrollPosition, (newPos) => {
      currentScrollIndex.value = newPos.first;
    });

    // Watch for items being loaded to trigger scroll restoration
    watch(() => items.value.filter(item => item !== undefined).length, (loadedCount) => {
      log('📦 LOADED ITEMS COUNT:', loadedCount);
      
      // Restore saved scroll position after sufficient data loads
      if (scrollRestorationPending.value && loadedCount > 0 && savedScrollPosition.value !== undefined) {
        // Check if we have enough data loaded around the target position
        const minRequiredItems = Math.min(savedScrollPosition.value + 20, totalRecords.value);
        
        if (loadedCount >= minRequiredItems || loadedCount >= 50) {
          log('📍 Sufficient data loaded, restoring scroll position:', savedScrollPosition.value);
          scrollRestorationPending.value = false;
          
          // Wait for data to render, then scroll
          setTimeout(() => {
            if (savedScrollPosition.value !== undefined) {
              scrollToIndex(savedScrollPosition.value, 'auto');
              log('✅ Scroll position restored to index', savedScrollPosition.value);
            }
          }, 300);
        }
      }
    });
  }

  return {
    sessionStorageApi,
    scrollRestorationPending,
    savedScrollPosition,
  };
}
