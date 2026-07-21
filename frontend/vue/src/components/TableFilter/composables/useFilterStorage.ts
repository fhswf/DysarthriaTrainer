import { watch, type Ref } from 'vue';
import type { FilterStorageOptions } from '../types';

/**
 * Storage key prefix for all filter storage
 */
const STORAGE_KEY_PREFIX = 'table-filter:';

/**
 * Composable for managing filter persistence in session storage
 * 
 * Handles save/load/clear operations with optional auto-save watching.
 * Supports session storage only (filters cleared when browser closes).
 * 
 * @template TParams - The filter parameters type
 * 
 * @example
 * ```typescript
 * interface EmployeeFilters {
 *   name?: string;
 *   department?: string;
 * }
 * 
 * const filters = ref<Partial<EmployeeFilters>>({});
 * 
 * const {
 *   loadFilters,
 *   saveFilters,
 *   clearStorage
 * } = useFilterStorage<EmployeeFilters>(
 *   'employee-table',
 *   filters,
 *   { enabled: true, autoSave: true }
 * );
 * ```
 */
export function useFilterStorage<TParams extends Record<string, any>>(
  storageId: string,
  filtersRef: Ref<Partial<TParams>>,
  options: FilterStorageOptions = {}
) {
  // ============================================================================
  // Configuration
  // ============================================================================

  const {
    enabled = true,
    autoSave = false,
  } = options;

  /**
   * Generate the full storage key
   */
  const storageKey = `${STORAGE_KEY_PREFIX}${storageId}`;

  // ============================================================================
  // Storage Operations
  // ============================================================================

  /**
   * Save filters to session storage
   * 
   * @param filters - The filters to save (defaults to current filtersRef value)
   * @returns true if saved successfully, false otherwise
   * 
   * @example
   * ```typescript
   * const success = saveFilters({ name: 'John' });
   * if (success) {
   *   console.log('Filters saved');
   * }
   * ```
   */
  function saveFilters(filters?: Partial<TParams>): boolean {
    if (!enabled) {
      return false;
    }

    try {
      const filtersToSave = filters !== undefined ? filters : filtersRef.value;
      const serialized = JSON.stringify(filtersToSave);
      sessionStorage.setItem(storageKey, serialized);
      return true;
    } catch (error) {
      console.error('[useFilterStorage] Failed to save filters:', error);
      return false;
    }
  }

  /**
   * Load filters from session storage
   * 
   * @param applyToRef - If true, applies loaded filters to filtersRef (default: true)
   * @returns The loaded filters or null if not found/error
   * 
   * @example
   * ```typescript
   * // Load and apply to ref
   * const filters = loadFilters();
   * 
   * // Load without applying
   * const filters = loadFilters(false);
   * ```
   */
  function loadFilters(applyToRef: boolean = true): Partial<TParams> | null {
    if (!enabled) {
      return null;
    }

    try {
      const serialized = sessionStorage.getItem(storageKey);
      
      if (!serialized) {
        return null;
      }

      const loaded = JSON.parse(serialized) as Partial<TParams>;

      if (applyToRef) {
        filtersRef.value = loaded;
      }

      return loaded;
    } catch (error) {
      console.error('[useFilterStorage] Failed to load filters:', error);
      return null;
    }
  }

  /**
   * Clear filters from session storage
   * 
   * @param clearRef - If true, also clears the filtersRef (default: false)
   * @returns true if cleared successfully, false otherwise
   * 
   * @example
   * ```typescript
   * // Clear storage only
   * clearStorage();
   * 
   * // Clear storage and ref
   * clearStorage(true);
   * ```
   */
  function clearStorage(clearRef: boolean = false): boolean {
    if (!enabled) {
      return false;
    }

    try {
      sessionStorage.removeItem(storageKey);

      if (clearRef) {
        filtersRef.value = {};
      }

      return true;
    } catch (error) {
      console.error('[useFilterStorage] Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Check if filters exist in storage
   * 
   * @returns true if filters are stored
   */
  function hasStoredFilters(): boolean {
    if (!enabled) {
      return false;
    }

    try {
      const serialized = sessionStorage.getItem(storageKey);
      return serialized !== null;
    } catch (error) {
      console.error('[useFilterStorage] Failed to check storage:', error);
      return false;
    }
  }

  /**
   * Get the size of stored filters (in bytes)
   * Useful for debugging storage issues
   * 
   * @returns Size in bytes or 0 if not stored
   */
  function getStorageSize(): number {
    if (!enabled) {
      return 0;
    }

    try {
      const serialized = sessionStorage.getItem(storageKey);
      return serialized ? new Blob([serialized]).size : 0;
    } catch (error) {
      console.error('[useFilterStorage] Failed to get storage size:', error);
      return 0;
    }
  }

  // ============================================================================
  // Auto-Save Watcher
  // ============================================================================

  /**
   * Watch for filter changes and auto-save if enabled
   */
  if (enabled && autoSave) {
    watch(
      filtersRef,
      (newFilters) => {
        saveFilters(newFilters);
      },
      { deep: true }
    );
  }

  // ============================================================================
  // Auto-Load on Initialization
  // ============================================================================

  /**
   * Auto-load filters on initialization if storage is enabled
   */
  if (enabled) {
    const stored = loadFilters(false); // Load without applying yet
    if (stored) {
      // Only apply if current filters are empty
      const currentKeys = Object.keys(filtersRef.value);
      if (currentKeys.length === 0) {
        filtersRef.value = stored;
      }
    }
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Core Operations
    saveFilters,
    loadFilters,
    clearStorage,
    
    // Utility
    hasStoredFilters,
    getStorageSize,
    
    // Configuration
    storageKey,
    enabled,
    autoSave,
  };
}
