/**
 * Type Definitions for Virtual Scroll Data Store
 */

/**
 * Paginated API response structure
 * 
 * Standard pagination format used by Django REST Framework
 */
export interface PaginatedResponse<T> {
  /**
   * Total number of items across all pages
   */
  count: number;

  /**
   * Array of items for the current page
   */
  results: T[];

  /**
   * URL to next page (optional)
   */
  next?: string | null;

  /**
   * URL to previous page (optional)
   */
  previous?: string | null;
}

/**
 * Cached page data structure
 * 
 * Internal representation of a loaded page
 */
export interface Page<T> {
  /**
   * Total count (cached from first page response)
   */
  count: number;

  /**
   * Items in this specific page
   */
  results: T[];
}

/**
 * Base API client interface
 * 
 * Minimal interface required by VirtualScrollPager.
 * Any API service that implements this can be used.
 * 
 * @template T - The type of items being paginated
 */
export interface BaseApiClient<T> {
  /**
   * Fetch a list of items with pagination
   * 
   * @param params - Query parameters (offset, limit, filters, ordering, etc.)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise resolving to paginated response
   */
  list(params: Record<string, any>, signal?: AbortSignal): Promise<PaginatedResponse<T>>;
}

/**
 * Pager configuration options
 */
export interface PagerConfig {
  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Field to sort by
   */
  sortField?: string | null;

  /**
   * Sort order (1 = ascending, -1 = descending)
   */
  sortOrder?: number | null;

  /**
   * Active filter parameters
   */
  filters?: Record<string, any>;
}
