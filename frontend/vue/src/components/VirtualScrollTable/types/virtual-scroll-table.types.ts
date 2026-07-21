import type { Component } from 'vue';
import type { DataTableProps } from 'primevue/datatable';
import type { SessionStorageConfig } from '../composables/useSessionStorage';

/**
 * Column definition for table
 */
export interface ColumnDefinition {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  style?: Record<string, string>;
  format?: (value: any) => string;
  component?: Component;
}

/**
 * Action configuration for table rows
 */
export interface ActionConfig {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  custom?: CustomAction[];
}

/**
 * Custom action definition
 */
export interface CustomAction {
  name: string;
  icon: string;
  label: string;
  handler: (item: any) => void;
  visible?: (item: any) => boolean;
  disabled?: (item: any) => boolean;
}

/**
 * Lazy load event from VirtualScroller
 */
export interface LazyLoadEvent {
  first: number;  // Start index
  last: number;   // End index (exclusive)
}

/**
 * API list response format
 */
export interface ApiListResponse<T> {
  count: number;      // Total records
  results: T[];       // Current page data
  next?: string;      // Next page URL
  previous?: string;  // Previous page URL
  offset?: number;    // Current offset
  limit?: number;     // Current limit
}

/**
 * Virtual Scroll Table component props
 */
export interface VirtualScrollTableProps<T = any> {
  // Required
  items: (T | undefined)[];
  loading: boolean;
  totalRecords: number;
  columns: ColumnDefinition[];
  dataKey: string;
  
  // Virtual Scrolling
  rowHeight?: number;
  scrollHeight?: string;
  bufferMultiplier?: number;
  
  /**
   * Initial scroll position (row index)
   * Scrolls to the specified row index when component mounts or when this value changes
   */
  scrollToIndex?: number;
  
  /**
   * Scroll behavior for scrollToIndex
   * @default 'smooth'
   */
  scrollBehavior?: 'auto' | 'smooth';
  
  // Selection
  selection?: T[];
  selectionMode?: 'single' | 'multiple' | 'none';
  
  // Actions
  actions?: ActionConfig;
  
  // Sorting
  sortField?: string;
  sortOrder?: 1 | -1;
  
  // Styling
  striped?: boolean;
  size?: 'small' | 'normal' | 'large';
  
  // Progress Bar
  showProgressBar?: boolean;
  
  // Session Storage
  /**
   * Session storage configuration
   * Enables persistence of scroll position and other state across page navigation
   */
  sessionStorage?: Partial<SessionStorageConfig>;
  
  // DataTable Props Pass-through
  dataTableProps?: Partial<DataTableProps>;
}

/**
 * Emits for Virtual Scroll Table component
 */
export interface VirtualScrollTableEmits<T = any> {
  (e: 'update:selection', value: T[]): void;
  (e: 'sort', event: any): void;
  (e: 'lazy-load', event: LazyLoadEvent): void;
  (e: 'view', item: T): void;
  (e: 'edit', item: T): void;
  (e: 'delete', item: T): void;
  (e: 'action', payload: { action: string; item: T }): void;
  (e: 'scroll', event: { index: number }): void;
}

/**
 * Base API client interface
 */
export interface BaseApiClient<T> {
  list(params?: Record<string, any>, signal?: AbortSignal): Promise<ApiListResponse<T>>;
}

/**
 * Filter operator types matching Django REST Framework filters
 * 
 * Examples:
 * - exact: field=value (default)
 * - iexact: field__iexact=value (case-insensitive)
 * - contains: field__contains=value
 * - icontains: field__icontains=value (case-insensitive)
 * - in: field__in=value1,value2,value3
 * - gt: field__gt=value (greater than)
 * - gte: field__gte=value (greater than or equal)
 * - lt: field__lt=value (less than)
 * - lte: field__lte=value (less than or equal)
 * - startswith: field__startswith=value
 * - istartswith: field__istartswith=value (case-insensitive)
 * - endswith: field__endswith=value
 * - iendswith: field__iendswith=value (case-insensitive)
 * - range: field__range=start,end
 * - isnull: field__isnull=true|false
 * - regex: field__regex=pattern
 * - iregex: field__iregex=pattern (case-insensitive)
 */
export type FilterOperator =
  | 'exact'          // Exact match (default)
  | 'iexact'         // Case-insensitive exact match
  | 'contains'       // Contains substring
  | 'icontains'      // Case-insensitive contains
  | 'in'             // Value in list
  | 'gt'             // Greater than
  | 'gte'            // Greater than or equal
  | 'lt'             // Less than
  | 'lte'            // Less than or equal
  | 'startswith'     // Starts with
  | 'istartswith'    // Case-insensitive starts with
  | 'endswith'       // Ends with
  | 'iendswith'      // Case-insensitive ends with
  | 'range'          // Value in range (inclusive)
  | 'isnull'         // Is null/not null
  | 'regex'          // Regex match
  | 'iregex'         // Case-insensitive regex
  | 'year'           // Date year
  | 'month'          // Date month
  | 'day'            // Date day
  | 'week_day'       // Date week day
  | 'hour'           // Time hour
  | 'minute'         // Time minute
  | 'second';        // Time second

/**
 * Filter value type - can be primitive or array for 'in' operator
 */
export type FilterValue = string | number | boolean | null | (string | number)[];

/**
 * Advanced filter definition for a single field
 * 
 * @example
 * Simple filter:
 * { field: 'username', value: 'john', operator: 'icontains' }
 * → username__icontains=john
 * 
 * @example
 * In filter:
 * { field: 'status', value: ['active', 'pending'], operator: 'in' }
 * → status__in=active,pending
 * 
 * @example
 * Range filter:
 * { field: 'created_at', value: ['2024-01-01', '2024-12-31'], operator: 'range' }
 * → created_at__range=2024-01-01,2024-12-31
 * 
 * @example
 * Null check:
 * { field: 'deleted_at', value: true, operator: 'isnull' }
 * → deleted_at__isnull=true
 */
export interface AdvancedFilter {
  /** Field name (e.g., 'username', 'created_at', 'email') */
  field: string;
  /** Filter value (string, number, boolean, null, or array for 'in'/'range') */
  value: FilterValue;
  /** Filter operator (default: 'exact') */
  operator?: FilterOperator;
  /** Whether this filter is active (default: true) */
  enabled?: boolean;
}

/**
 * Simple filter map (backward compatible)
 * Key-value pairs where key is field name, value is filter value
 * 
 * @example
 * {
 *   search: 'john',
 *   is_active: true,
 *   role: 'admin'
 * }
 */
export type SimpleFilters = Record<string, FilterValue | undefined>;

/**
 * Combined filters - supports both simple and advanced filtering
 * 
 * @example
 * Simple filters only:
 * {
 *   simple: { search: 'john', is_active: true }
 * }
 * 
 * @example
 * Advanced filters only:
 * {
 *   advanced: [
 *     { field: 'username', value: 'john', operator: 'icontains' },
 *     { field: 'created_at', value: ['2024-01-01', '2024-12-31'], operator: 'range' }
 *   ]
 * }
 * 
 * @example
 * Both simple and advanced:
 * {
 *   simple: { search: 'john' },  // Global search
 *   advanced: [
 *     { field: 'role', value: ['admin', 'staff'], operator: 'in' },
 *     { field: 'created_at', value: '2024-01-01', operator: 'gte' }
 *   ]
 * }
 */
export interface CombinedFilters {
  /** Simple key-value filters (backward compatible) */
  simple?: SimpleFilters;
  /** Advanced field-based filters with operators */
  advanced?: AdvancedFilter[];
}

/**
 * Options for useVirtualScrollTableData composable
 */
export interface VirtualScrollTableDataOptions {
  sortField: any;  // Ref<string>
  sortOrder: any;  // Ref<1 | -1>
  
  /** 
   * Filters - supports both formats:
   * 1. Simple: Ref<Record<string, any>> (backward compatible)
   * 2. Combined: Ref<CombinedFilters> (new advanced format)
   */
  filters: any;    // Ref<SimpleFilters | CombinedFilters>
  
  pageSize?: number;
  bufferMultiplier?: number;
  delay?: number;
}
