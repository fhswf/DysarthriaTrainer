import { ref, computed, watch, type Ref } from 'vue';
import { useVirtualScrollTableData } from '@/components/VirtualScrollTable';
import { useVirtualScrollTableData as useVirtualScrollTableDataV2 } from '@/components/VirtualScrollTable/composables/useVirtualScrollTableData.v2';
import type { TableApiService } from '../TableSetup.types';
import { useTableSetupStorage } from './useTableSetupStorage';

/**
 * Feature flag: Use V2 pager (store-based, no race conditions)
 * Set to true to enable new implementation
 * Set to false to use legacy implementation
 */
const USE_V2_PAGER = true;

/**
 * Data management composable for table
 * 
 * @param apiService - API service for data fetching
 * @param searchQuery - Search query ref
 * @param sortField - Sort field ref
 * @param sortOrder - Sort order ref
 * @param filters - Filters ref
 * @param storageKey - Storage key
 * @returns Table data state and methods
 */
export function useTableSetupData<T extends Record<string, any> = any>(
  apiService: TableApiService<T>,
  searchQuery: Ref<string>,
  sortField: Ref<string>,
  sortOrder: Ref<1 | -1>,
  filters: Ref<Record<string, any>>,
  storageKey: string
) {
  const storage = useTableSetupStorage(storageKey);
  
  // Combined API parameters
  const apiFilters = computed(() => {
    return {
      ...filters.value,
      search: searchQuery.value || undefined,
    };
  });
  
  // Use VirtualScrollTable data composable (V1 or V2 based on feature flag)
  const dataComposable = USE_V2_PAGER 
    ? useVirtualScrollTableDataV2<T>
    : useVirtualScrollTableData<T>;
  
  const {
    items,
    loading,
    totalRecords,
    onLazyLoad,
    refresh,
    reset,
    loadInitial,
  } = dataComposable(apiService, {
    sortField,
    sortOrder,
    filters: apiFilters,
    pageSize: 50,
    delay: 200,
  });

  /**
   * Handle sort change
   */
  function handleSort(event: any): void {
    if (event.sortField) {
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      
      // Save to storage
      storage.updateState('sort', {
        field: event.sortField,
        order: event.sortOrder,
      });
      
      // No need to call reset() - useVirtualScrollTableData watcher handles it
    }
  }
  
  /**
   * Handle search change
   */
  function handleSearch(query: string): void {
    searchQuery.value = query;
    
    // Save to storage
    storage.updateState('search', query);
    
    // No need to call reset() - useVirtualScrollTableData watcher handles it
  }
  
  /**
   * Clear search
   */
  function clearSearch(): void {
    searchQuery.value = '';
    storage.updateState('search', '');
    // No need to call reset() - useVirtualScrollTableData watcher handles it
  }

  return {
    // Data
    items,
    loading,
    totalRecords,
    
    // Handlers
    onLazyLoad,
    refresh,
    reset,
    loadInitial,
    handleSort,
    handleSearch,
    clearSearch,
  };
}
