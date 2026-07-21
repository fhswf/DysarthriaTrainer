import { PromiseQueue } from './PromiseQueue';
import type { BaseApiClient, Page, PaginatedResponse } from './types';

/**
 * Virtual Scroll Pager
 * 
 * Lifecycle-independent data manager for virtual scrolling tables.
 * Based on the legacy DataPager pattern but optimized for virtual scroll.
 * 
 * ## Key Features
 * 
 * - **Promise Caching**: Prevents duplicate requests for the same page
 * - **Concurrency Limiting**: Queue-based system prevents API overload (5 concurrent max)
 * - **Store-Based**: Independent of component lifecycle (no race conditions)
 * - **Zero setTimeout**: Direct async loading eliminates timing issues
 * 
 * ## Architecture
 * 
 * ```
 * Component Request (index 0-49)
 *         ↓
 * VirtualScrollPager.getRecords(0, 50)
 *         ↓
 * Calculates pages needed (page 0)
 *         ↓
 * Checks cache: pages Map
 *    ├─ Hit: Return cached page
 *    └─ Miss: Create promise → Queue → API request
 *         ↓
 * PromiseQueue limits concurrency
 *         ↓
 * Cache promise (deduplicate concurrent requests)
 *         ↓
 * API Response → Cache actual page
 * ```
 * 
 * ## Usage Example
 * 
 * ```typescript
 * // Create pager
 * const pager = new VirtualScrollPager(apiClient, 50);
 * 
 * // Get total count
 * const count = await pager.getCount(); // 1000 items
 * 
 * // Get records for virtual scroll
 * const records = await pager.getRecords(0, 50); // First 50 items
 * 
 * // Update filters/sorting
 * pager.updateConfig('name', 1, { status: 'active' });
 * 
 * // Reset on filter change
 * pager.reset();
 * ```
 * 
 * @template T - The type of items being paginated
 */
export class VirtualScrollPager<T = any> {
  /**
   * Cache of loaded pages
   * 
   * Key: Page number (0-indexed)
   * Value: Actual page data OR promise that will resolve to page data
   * 
   * Using promises as cache values enables automatic request deduplication:
   * - First request: Creates promise, caches it
   * - Concurrent requests: Return same cached promise
   * - After load: Promise replaced with actual page data
   */
  private pages: Map<number, Page<T> | Promise<Page<T>>>;

  /**
   * Request queue for concurrency limiting
   * 
   * Prevents overwhelming the API server during fast scrolling.
   * Maximum 5 concurrent requests.
   */
  private queue: PromiseQueue<Page<T>>;

  /**
   * API client for fetching data
   */
  private readonly apiClient: BaseApiClient<T>;

  /**
   * Number of items per page
   */
  private readonly pageSize: number;
  
  /**
   * Total number of items (null until first page loads)
   */
  public count: number | null = null;

  /**
   * Current sort field
   */
  public sortField: string | null = null;

  /**
   * Current sort order (1 = ascending, -1 = descending)
   */
  public sortOrder: number | null = null;

  /**
   * Current filter parameters
   */
  public filters: Record<string, any> = {};

  /**
   * Create a new VirtualScrollPager
   * 
   * @param apiClient - API client implementing BaseApiClient interface
   * @param pageSize - Number of items per page (default: 50)
   * 
   * @example
   * ```typescript
   * const pager = new VirtualScrollPager(employeeApi, 50);
   * ```
   */
  constructor(apiClient: BaseApiClient<T>, pageSize: number = 50) {
    this.apiClient = apiClient;
    this.pageSize = pageSize;
    this.pages = new Map();
    this.queue = new PromiseQueue(5); // 5 concurrent requests max
  }

  /**
   * Reset pager state
   * 
   * Clears all cached pages and pending requests.
   * Called when filters/sorting change.
   * 
   * @example
   * ```typescript
   * pager.reset(); // Clear cache on filter change
   * ```
   */
  reset() {
    this.count = null;
    this.pages.clear();
    this.queue.clear();
  }

  /**
   * Update configuration
   * 
   * Compares new config with current state.
   * If anything changed, resets the pager.
   * 
   * @param sortField - Field to sort by
   * @param sortOrder - Sort direction (1 = asc, -1 = desc)
   * @param filters - Filter parameters
   * 
   * @example
   * ```typescript
   * // Update sorting
   * pager.updateConfig('name', 1);
   * 
   * // Update filters
   * pager.updateConfig('name', 1, { status: 'active' });
   * ```
   */
  updateConfig(sortField?: string, sortOrder?: number, filters?: Record<string, any>) {
    const changed = 
      this.sortField !== sortField ||
      this.sortOrder !== sortOrder ||
      JSON.stringify(this.filters) !== JSON.stringify(filters);

    if (changed) {
      this.sortField = sortField ?? null;
      this.sortOrder = sortOrder ?? null;
      this.filters = filters ?? {};
      this.reset();
    }
  }

  /**
   * Get a specific page (with caching and deduplication)
   * 
   * **Caching Logic**:
   * - If page already loaded: Return cached data
   * - If page currently loading: Return existing promise (deduplication)
   * - If page not requested: Create new request, cache promise, then cache result
   * 
   * **Deduplication**:
   * Multiple concurrent calls for the same page return the same promise,
   * ensuring only ONE API request is made per page.
   * 
   * @param pageNumber - Zero-indexed page number
   * @returns Promise resolving to page data
   * 
   * @private
   * @internal
   */
  private async getPage(pageNumber: number): Promise<Page<T>> {
    // Check cache
    const cached = this.pages.get(pageNumber);
    if (cached) {
      if (cached instanceof Promise) {
        return cached; // Already loading - deduplicate
      }
      return cached; // Already loaded - use cache
    }

    // Create promise and cache it (enables deduplication)
    const promise = this.queue.add(async () => {
      const offset = pageNumber * this.pageSize;
      const params: Record<string, any> = {
        offset,
        limit: this.pageSize,
        ...this.filters
      };

      // Add sorting if configured
      if (this.sortField) {
        params.ordering = (this.sortOrder === -1 ? '-' : '') + this.sortField;
      }

      const response = await this.apiClient.list(params);
      
      // Update count on first load
      if (this.count === null) {
        this.count = response.count;
      }

      const page: Page<T> = {
        count: response.count,
        results: response.results
      };

      // Replace promise with actual page
      this.pages.set(pageNumber, page);
      
      return page;
    });

    // Cache the promise (enables deduplication)
    this.pages.set(pageNumber, promise);
    
    return promise;
  }

  /**
   * Get a single record by index
   * 
   * Automatically loads the containing page if needed.
   * 
   * @param index - Zero-indexed position in the full dataset
   * @returns Promise resolving to the item, or null if index out of bounds
   * 
   * @example
   * ```typescript
   * const item = await pager.getRecord(125); // Gets item at index 125
   * ```
   */
  async getRecord(index: number): Promise<T | null> {
    // Initialize if needed
    if (this.count === null) {
      await this.getPage(0);
    }

    if (this.count === null || index >= this.count) {
      return null;
    }

    const pageNumber = Math.floor(index / this.pageSize);
    const offset = index % this.pageSize;

    const page = await this.getPage(pageNumber);
    return page.results[offset] ?? null;
  }

  /**
   * Get a range of records (for VirtualScroller)
   * 
   * Fires parallel requests for all needed records.
   * Automatic deduplication at page level ensures efficiency:
   * - Records from same page share same request
   * - Already-loading pages return cached promise
   * - Already-loaded pages return cached data
   * 
   * **Example**: `getRecords(0, 100)` with pageSize=50
   * - Fires 2 page requests (page 0, page 1)
   * - Each page request deduplicated if already loading
   * - Returns combined array of 100 items
   * 
   * @param first - Start index (inclusive)
   * @param last - End index (exclusive)
   * @returns Promise resolving to array of items (nulls for out-of-bounds)
   * 
   * @example
   * ```typescript
   * // Get records 0-49 for virtual scroll viewport
   * const records = await pager.getRecords(0, 50);
   * 
   * // User scrolls down - get records 50-99
   * const moreRecords = await pager.getRecords(50, 100);
   * ```
   */
  async getRecords(first: number, last: number): Promise<(T | null)[]> {
    const count = last - first;
    
    // Request all records in parallel
    // Multiple records from same page will return same promise (deduplication)
    const promises = Array.from({ length: count }, (_, i) => 
      this.getRecord(first + i)
    );

    return Promise.all(promises);
  }

  /**
   * Get total count
   * 
   * Loads first page if count not yet known.
   * 
   * @returns Promise resolving to total number of items
   * 
   * @example
   * ```typescript
   * const total = await pager.getCount(); // 1000
   * ```
   */
  async getCount(): Promise<number> {
    if (this.count !== null) {
      return this.count;
    }

    await this.getPage(0);
    return this.count ?? 0;
  }
}
