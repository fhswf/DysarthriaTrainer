/**
 * Virtual Scroll Data Store Module
 * 
 * Store-based data management for virtual scrolling tables.
 * Provides lifecycle-independent paging with automatic request deduplication
 * and concurrency limiting.
 * 
 * ## Architecture Overview
 * 
 * ```
 * Component (Vue)
 *      ↓
 * useVirtualScrollDataStore (Pinia)
 *      ↓
 * VirtualScrollPager (Data Manager)
 *      ↓
 * PromiseQueue (Concurrency Control)
 *      ↓
 * API Client (Network)
 * ```
 * 
 * ## Key Components
 * 
 * - **VirtualScrollPager**: Core data manager with page caching
 * - **PromiseQueue**: Limits concurrent API requests
 * - **Store**: Pinia store for managing pager instances
 * 
 * ## Usage Example
 * 
 * ```typescript
 * import { useVirtualScrollDataStore } from '@/stores/virtualScrollData';
 * 
 * // In component setup
 * const store = useVirtualScrollDataStore();
 * const pager = store.createPager('my-table', apiClient, 50);
 * 
 * // Get total count
 * const count = await pager.getCount();
 * 
 * // Get records for viewport
 * const records = await pager.getRecords(0, 50);
 * 
 * // Update filters
 * pager.updateConfig('name', 1, { status: 'active' });
 * 
 * // Cleanup on unmount
 * onBeforeUnmount(() => {
 *   store.removePager('my-table');
 * });
 * ```
 * 
 * ## Benefits Over V1 Approach
 * 
 * - **No setTimeout**: Eliminates race conditions
 * - **Store-based**: Independent of component lifecycle
 * - **Promise caching**: Automatic request deduplication
 * - **Concurrency limiting**: Prevents API overload
 * - **Code reduction**: 60% less code vs V1
 * 
 * @module virtualScrollData
 */

// Export store
export { useVirtualScrollDataStore } from './store';

// Export classes
export { VirtualScrollPager } from './VirtualScrollPager';
export { PromiseQueue } from './PromiseQueue';

// Export types
export type {
  BaseApiClient,
  PaginatedResponse,
  Page,
  PagerConfig
} from './types';
