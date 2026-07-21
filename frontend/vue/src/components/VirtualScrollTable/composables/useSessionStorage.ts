/**
 * Session Storage Composable for VirtualScrollTable
 * 
 * Provides configurable session storage for table state including:
 * - Search query
 * - Scroll position
 * - Sort state
 * - Filters
 * 
 * Features:
 * - Configurable storage keys
 * - Enable/disable individual state persistence
 * - Type-safe storage and retrieval
 * - Auto-cleanup on session end
 * - SSR-safe (checks for window availability)
 */

import { watch, type Ref } from 'vue';

/**
 * Configuration for session storage
 */
export interface SessionStorageConfig {
  /**
   * Unique storage key for this table instance
   * Used as prefix for all storage keys
   * @example 'user-table', 'patient-table'
   */
  storageKey: string;

  /**
   * Enable/disable search query persistence
   * @default true
   */
  persistSearch?: boolean;

  /**
   * Enable/disable scroll position persistence
   * @default true
   */
  persistScroll?: boolean;

  /**
   * Enable/disable sort state persistence
   * @default false
   */
  persistSort?: boolean;

  /**
   * Enable/disable filters persistence
   * @default false
   */
  persistFilters?: boolean;

  /**
   * Debounce delay for saving state (ms)
   * Prevents excessive storage writes during rapid changes
   * @default 300
   */
  debounceDelay?: number;
}

/**
 * Storage keys for different state types
 */
interface StorageKeys {
  search: string;
  scroll: string;
  sortField: string;
  sortOrder: string;
  filters: string;
}

/**
 * Stored state interface
 */
export interface StoredTableState {
  search?: string;
  scrollPosition?: number;
  sortField?: string;
  sortOrder?: 1 | -1;
  filters?: Record<string, any>;
}

/**
 * Check if session storage is available
 */
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    window.sessionStorage.setItem(testKey, 'test');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Session Storage Composable
 * 
 * @param config - Configuration options
 * @param state - Reactive state refs to persist
 * @returns Methods for manual state management
 * 
 * @example
 * ```typescript
 * const searchQuery = ref('');
 * const scrollPosition = ref(0);
 * 
 * useSessionStorage(
 *   {
 *     storageKey: 'user-table',
 *     persistSearch: true,
 *     persistScroll: true,
 *   },
 *   {
 *     search: searchQuery,
 *     scrollPosition: scrollPosition,
 *   }
 * );
 * ```
 */
export function useSessionStorage(
  config: SessionStorageConfig,
  state?: {
    search?: Ref<string>;
    scrollPosition?: Ref<number>;
    sortField?: Ref<string>;
    sortOrder?: Ref<1 | -1>;
    filters?: Ref<Record<string, any>>;
  }
) {
  const {
    storageKey,
    persistSearch = true,
    persistScroll = true,
    persistSort = false,
    persistFilters = false,
    debounceDelay = 300,
  } = config;

  // Generate storage keys
  const keys: StorageKeys = {
    search: `${storageKey}:search`,
    scroll: `${storageKey}:scroll`,
    sortField: `${storageKey}:sortField`,
    sortOrder: `${storageKey}:sortOrder`,
    filters: `${storageKey}:filters`,
  };

  // Debounce timers
  const debounceTimers: Record<string, ReturnType<typeof setTimeout> | null> = {
    search: null,
    scroll: null,
    sortField: null,
    sortOrder: null,
    filters: null,
  };

  /**
   * Save value to session storage with debouncing
   */
  const saveToStorage = (key: string, value: any, timerKey: string) => {
    if (!isStorageAvailable()) return;

    // Clear existing timer
    if (debounceTimers[timerKey]) {
      clearTimeout(debounceTimers[timerKey]!);
    }

    // Set new timer
    debounceTimers[timerKey] = setTimeout(() => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save ${key}:`, e);
      }
    }, debounceDelay);
  };

  /**
   * Load value from session storage
   */
  const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    if (!isStorageAvailable()) return defaultValue;

    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (e) {
      console.warn(`[SessionStorage] Failed to load ${key}:`, e);
      return defaultValue;
    }
  };

  /**
   * Remove value from session storage
   */
  const removeFromStorage = (key: string) => {
    if (!isStorageAvailable()) return;

    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SessionStorage] Failed to remove ${key}:`, e);
    }
  };

  /**
   * Clear all stored state for this table
   */
  const clearStorage = () => {
    if (!isStorageAvailable()) return;

    Object.values(keys).forEach(key => {
      removeFromStorage(key);
    });
  };

  /**
   * Load all stored state
   */
  const loadState = (): StoredTableState => {
    const result: StoredTableState = {};

    if (persistSearch) {
      result.search = loadFromStorage(keys.search, '');
    }

    if (persistScroll) {
      result.scrollPosition = loadFromStorage(keys.scroll, 0);
    }

    if (persistSort) {
      result.sortField = loadFromStorage(keys.sortField, '');
      result.sortOrder = loadFromStorage(keys.sortOrder, 1);
    }

    if (persistFilters) {
      result.filters = loadFromStorage(keys.filters, {});
    }

    return result;
  };

  /**
   * Save all current state (manual mode - ignores persistence flags)
   */
  const saveState = (currentState: StoredTableState) => {
    if (!isStorageAvailable()) return;

    // When called manually, always save provided values regardless of persistence flags
    if (currentState.search !== undefined) {
      try {
        window.sessionStorage.setItem(keys.search, JSON.stringify(currentState.search));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save search:`, e);
      }
    }

    if (currentState.scrollPosition !== undefined) {
      try {
        window.sessionStorage.setItem(keys.scroll, JSON.stringify(currentState.scrollPosition));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save scroll:`, e);
      }
    }

    if (currentState.sortField !== undefined) {
      try {
        window.sessionStorage.setItem(keys.sortField, JSON.stringify(currentState.sortField));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save sortField:`, e);
      }
    }

    if (currentState.sortOrder !== undefined) {
      try {
        window.sessionStorage.setItem(keys.sortOrder, JSON.stringify(currentState.sortOrder));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save sortOrder:`, e);
      }
    }

    if (currentState.filters !== undefined) {
      try {
        window.sessionStorage.setItem(keys.filters, JSON.stringify(currentState.filters));
      } catch (e) {
        console.warn(`[SessionStorage] Failed to save filters:`, e);
      }
    }
  };

  // Setup watchers for auto-persistence if state refs are provided
  if (state) {
    // Load saved state IMMEDIATELY (not in onMounted)
    // This ensures state is available before any reactive dependencies trigger
    const savedState = loadState();

    if (persistSearch && state.search && savedState.search) {
      state.search.value = savedState.search;
    }

    if (persistScroll && state.scrollPosition !== undefined && savedState.scrollPosition) {
      state.scrollPosition.value = savedState.scrollPosition;
    }

    if (persistSort && state.sortField && savedState.sortField) {
      state.sortField.value = savedState.sortField;
    }

    if (persistSort && state.sortOrder && savedState.sortOrder) {
      state.sortOrder.value = savedState.sortOrder;
    }

    if (persistFilters && state.filters && savedState.filters) {
      state.filters.value = savedState.filters;
    }

    // Watch for changes and save
    if (persistSearch && state.search) {
      watch(
        state.search,
        (newValue) => {
          saveToStorage(keys.search, newValue, 'search');
        },
        { deep: true }
      );
    }

    if (persistScroll && state.scrollPosition) {
      watch(
        state.scrollPosition,
        (newValue) => {
          saveToStorage(keys.scroll, newValue, 'scroll');
        }
      );
    }

    if (persistSort && state.sortField) {
      watch(
        state.sortField,
        (newValue) => {
          saveToStorage(keys.sortField, newValue, 'sortField');
        }
      );
    }

    if (persistSort && state.sortOrder) {
      watch(
        state.sortOrder,
        (newValue) => {
          saveToStorage(keys.sortOrder, newValue, 'sortOrder');
        }
      );
    }

    if (persistFilters && state.filters) {
      watch(
        state.filters,
        (newValue) => {
          saveToStorage(keys.filters, newValue, 'filters');
        },
        { deep: true }
      );
    }
  }

  return {
    loadState,
    saveState,
    clearStorage,
  };
}
