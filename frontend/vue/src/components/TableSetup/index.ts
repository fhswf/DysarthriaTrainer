/**
 * TableSetup Component - Composite component for CRUD tables
 * 
 * Reduces boilerplate by ~90% by integrating:
 * - TableToolbar (search, actions, filters)
 * - TableFilter (advanced filtering)
 * - VirtualScrollTable (virtual scroll data display)
 */

export { default as TableSetup } from './TableSetup.vue';

export type {
  TableSetupProps,
  TableSetupEmits,
  TableColumnDefinition,
  TableFeatures,
  TableConfig,
  TableInitialState,
  TableStorageState,
  TableApiService,
} from './TableSetup.types';

export { useTableSetupStorage } from './composables/useTableSetupStorage';
export { useTableSetupData } from './composables/useTableSetupData';
