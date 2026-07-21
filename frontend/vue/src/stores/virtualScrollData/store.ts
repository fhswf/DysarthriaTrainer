import { defineStore } from 'pinia';
import { VirtualScrollPager } from './VirtualScrollPager';
import type { BaseApiClient } from './types';

/**
 * Virtual Scroll Data Store
 * 
 * Pinia store for managing VirtualScrollPager instances.
 * Each component instance gets its own pager, identified by a unique key.
 * 
 * ## Purpose
 * 
 * - **Lifecycle Independence**: Pagers live in the store, not in components
 * - **Shared Access**: Multiple components can access same pager if needed
 * - **Memory Management**: Explicit cleanup on component unmount
 * 
 * ## Usage Pattern
 * 
 * ```typescript
 * // In component setup
 * const store = useVirtualScrollDataStore();
 * const pager = store.createPager('employee-table', employeeApi, 50);
 * 
 * // Use pager
 * const records = await pager.getRecords(0, 50);
 * 
 * // Cleanup on unmount
 * onBeforeUnmount(() => {
 *   store.removePager('employee-table');
 * });
 * ```
 * 
 * ## Instance Keys
 * 
 * Keys should be unique per table instance. Recommended format:
 * - Component-based: `'employee-table'`, `'user-table'`
 * - Route-based: `router.currentRoute.value.name`
 * - ID-based: `'table-' + componentId`
 * 
 * @example
 * ```typescript
 * import { useVirtualScrollDataStore } from '@/stores/virtualScrollData';
 * 
 * const store = useVirtualScrollDataStore();
 * 
 * // Create pager
 * const pager = store.createPager('my-table', apiClient);
 * 
 * // Get data
 * const count = await pager.getCount();
 * const records = await pager.getRecords(0, 50);
 * 
 * // Cleanup
 * store.removePager('my-table');
 * ```
 */
export const useVirtualScrollDataStore = defineStore('virtualScrollData', () => {
  /**
   * Map of pager instances
   * 
   * Key: Unique instance identifier (e.g., 'employee-table')
   * Value: VirtualScrollPager instance
   */
  const instances = new Map<string, VirtualScrollPager<any>>();

  /**
   * Create a new pager instance
   * 
   * If a pager with the same key already exists, it will be replaced.
   * 
   * @template T - The type of items being paginated
   * @param key - Unique identifier for this pager instance
   * @param apiClient - API client implementing BaseApiClient interface
   * @param pageSize - Number of items per page (default: 50)
   * @returns New VirtualScrollPager instance
   * 
   * @example
   * ```typescript
   * const pager = store.createPager('employee-table', employeeApi, 50);
   * ```
   */
  function createPager<T>(
    key: string, 
    apiClient: BaseApiClient<T>, 
    pageSize: number = 50
  ): VirtualScrollPager<T> {
    const pager = new VirtualScrollPager<T>(apiClient, pageSize);
    instances.set(key, pager);
    return pager;
  }

  /**
   * Get an existing pager instance
   * 
   * @template T - The type of items being paginated
   * @param key - Unique identifier for the pager instance
   * @returns VirtualScrollPager instance, or undefined if not found
   * 
   * @example
   * ```typescript
   * const pager = store.getPager<Employee>('employee-table');
   * if (pager) {
   *   const count = await pager.getCount();
   * }
   * ```
   */
  function getPager<T>(key: string): VirtualScrollPager<T> | undefined {
    return instances.get(key);
  }

  /**
   * Remove a pager instance
   * 
   * Deletes the pager from the store. Should be called on component unmount
   * to prevent memory leaks.
   * 
   * @param key - Unique identifier for the pager instance
   * 
   * @example
   * ```typescript
   * // In component
   * onBeforeUnmount(() => {
   *   store.removePager('employee-table');
   * });
   * ```
   */
  function removePager(key: string): void {
    const pager = instances.get(key);
    if (pager) {
      pager.reset(); // Clear any pending requests
      instances.delete(key);
    }
  }

  /**
   * Get all active pager keys
   * 
   * Useful for debugging or monitoring.
   * 
   * @returns Array of active pager instance keys
   * 
   * @example
   * ```typescript
   * const activeKeys = store.getActiveKeys();
   * console.log('Active pagers:', activeKeys);
   * ```
   */
  function getActiveKeys(): string[] {
    return Array.from(instances.keys());
  }

  /**
   * Clear all pager instances
   * 
   * Removes all pagers from the store. Use with caution.
   * 
   * @example
   * ```typescript
   * store.clearAll(); // Remove all pagers
   * ```
   */
  function clearAll(): void {
    instances.forEach(pager => pager.reset());
    instances.clear();
  }

  return {
    createPager,
    getPager,
    removePager,
    getActiveKeys,
    clearAll
  };
});
