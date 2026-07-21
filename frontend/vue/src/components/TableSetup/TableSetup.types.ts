import type { Component } from 'vue';
import type { TableFilterConfig } from '@/components/TableFilter';

/**
 * Column definition with localization
 */
export interface TableColumnDefinition {
  field: string;
  headerKey: string;
  sortable?: boolean;
  style?: Record<string, string>;
  sortField?: string;
  format?: (value: any, row: any) => string;
}

/**
 * Feature flags
 */
export interface TableFeatures {
  search?: boolean;
  filters?: boolean;
  sort?: boolean;
  refresh?: boolean;
  export?: boolean;
  create?: boolean;
  deleteAll?: boolean;
  viewAction?: boolean;
  editAction?: boolean;
  deleteAction?: boolean;
}

/**
 * Table configuration
 */
export interface TableConfig {
  rowHeight?: number;
  scrollHeight?: string;
  striped?: boolean;
  size?: 'small' | 'normal';
  selectionMode?: 'single' | 'multiple' | 'none';
}

/**
 * Initial state
 */
export interface TableInitialState {
  sortField?: string;
  sortOrder?: 1 | -1;
  searchQuery?: string;
}

/**
 * API Service interface
 */
export interface TableApiService<T = any> {
  list: (params: any) => Promise<{ count: number; results: T[] }>;
  delete?: (id: number | string) => Promise<void>;
  baseUrl?: string; // Optional base URL for CSV export
}

/**
 * TableSetup component props
 */
export interface TableSetupProps<T = any> {
  // Required
  apiService: TableApiService<T>;
  columns: TableColumnDefinition[];
  dataKey: string;
  i18nKey: string;
  
  // Optional - Filter Configuration
  filterConfig?: TableFilterConfig<any>;
  
  // Optional - General
  storageKey?: string;
  features?: TableFeatures;
  tableConfig?: TableConfig;
  initialState?: TableInitialState;
}

/**
 * TableSetup emits
 */
export interface TableSetupEmits<T = any> {
  (e: 'update:selection', value: T[]): void;
  (e: 'create'): void;
  (e: 'view', item: T): void;
  (e: 'edit', item: T): void;
  (e: 'delete', item: T): void;
  (e: 'delete-all', items: T[]): void;
  (e: 'export', data: T[]): void;
  (e: 'data-loaded', data: T[]): void;
  (e: 'error', error: Error): void;
  (e: 'filters-changed', filters: Record<string, any>): void;
}

/**
 * Storage state interface
 */
export interface TableStorageState {
  search?: string;
  sort?: {
    field: string;
    order: 1 | -1;
  };
  scroll?: number;
}
