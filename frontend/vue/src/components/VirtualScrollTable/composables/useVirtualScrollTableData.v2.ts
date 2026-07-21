import { ref, watch, onBeforeUnmount, computed, nextTick, type Ref } from 'vue';
import { useVirtualScrollDataStore, type VirtualScrollPager } from '@/stores/virtualScrollData';
import type { 
  BaseApiClient,
  LazyLoadEvent,
  VirtualScrollTableDataOptions
} from '../types/virtual-scroll-table.types';

/**
 * Vue composable wrapper around VirtualScrollPager (V2 - Store-based)
 * 
 * Key Improvements over V1:
 * - No setTimeout (eliminates race conditions)
 * - Store-based pager (lifecycle independent)
 * - Promise caching (automatic deduplication)
 * - Queue-based concurrency (prevents API overload)
 * - Simpler state management (no chunk/request trackers)
 * 
 * Migration from V1:
 * - Same API surface (drop-in replacement)
 * - No behavioral changes for consumers
 * - Safer (no unmount race conditions)
 * 
 * @param apiClient - API client with list() method
 * @param options - Configuration options (same as V1)
 */
export const useVirtualScrollTableData = <T extends Record<string, any>>(
  apiClient: BaseApiClient<T>,
  options: VirtualScrollTableDataOptions
) => {
  const store = useVirtualScrollDataStore();
  
  // Create unique key for this component instance
  const instanceKey = `pager-${Date.now()}-${Math.random()}`;
  
  // Create pager in store (lifecycle independent)
  const pager: VirtualScrollPager<T> = store.createPager(
    instanceKey,
    apiClient,
    options.pageSize ?? 50
  );

  // Initialize pager with current filter/sort values BEFORE first load
  // This ensures the initial API call includes all saved state
  const initialFilters = options.filters.value;
  let filterParams: Record<string, any> = {};
  
  if (initialFilters) {
    if (initialFilters.simple || initialFilters.advanced) {
      // Combined format
      filterParams = { ...initialFilters.simple };
    } else {
      // Simple format (backward compatible)
      filterParams = { ...initialFilters };
    }
  }
  
  pager.updateConfig(
    options.sortField.value,
    options.sortOrder.value,
    filterParams
  );

  // Reactive refs for Vue integration
  const items = ref<(T | undefined)[]>([]) as Ref<(T | undefined)[]>;
  const loading = ref(false);
  const totalRecords = ref(0); // Use ref instead of computed - pager.count is not reactive

  /**
   * Load initial data
   * Called on mount and when filters/sort change
   */
  const loadInitial = async (priorityScrollPosition?: number) => {
    loading.value = true;
    try {
      // Clear items array FIRST to trigger empty state
      items.value = [];
      totalRecords.value = 0;
      
      // Wait for DOM update to show loading/empty state
      await nextTick();
      
      const count = await pager.getCount();
      
      console.log('📊 Total records loaded (V2):', count);
      
      // Update totalRecords ref (must be explicit since pager.count is not reactive)
      totalRecords.value = count;
      
      // Create new placeholder array
      await nextTick();
      items.value = Array.from({ length: count });
      
      // If priority scroll position, pre-load that range
      if (priorityScrollPosition !== undefined && priorityScrollPosition > 0) {
        const pageSize = options.pageSize ?? 50;
        const first = priorityScrollPosition;
        const last = Math.min(first + pageSize, count);
        
        const records = await pager.getRecords(first, last);
        await nextTick();
        records.forEach((record, i) => {
          if (record) {
            items.value[first + i] = record;
          }
        });
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Handle VirtualScroller lazy load event
   * 
   * NO SETTIMEOUT - Direct async load
   * Promise queue handles concurrency naturally
   * If component unmounts, function exits cleanly (no error)
   */
  const onLazyLoad = async (event: LazyLoadEvent) => {
    const { first, last } = event;
    
    console.log('🔄 Lazy load triggered (V2):', { 
      first, 
      last, 
      totalRecords: totalRecords.value,
      itemsLength: items.value.length 
    });
    
    loading.value = true;
    try {
      // Request range (pager handles deduplication at page level)
      const records = await pager.getRecords(first, last);
      
      // Defer array updates to next tick to avoid render conflicts
      await nextTick();
      
      // Update items array
      records.forEach((record, i) => {
        if (record) {
          items.value[first + i] = record;
        }
      });
      
      console.log('✅ Lazy load complete (V2):', { 
        loaded: records.filter(r => r !== null).length,
        total: records.length,
        totalRecords: totalRecords.value
      });
    } catch (error) {
      console.error('❌ Lazy load error (V2):', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refresh data (reload from beginning)
   */
  const refresh = async () => {
    console.log('🔄 Refresh triggered (V2) - clearing cache and reloading');
    pager.reset();
    await loadInitial();
  };

  /**
   * Reset (same as refresh for backward compatibility)
   */
  const reset = async () => {
    console.log('🔄 Reset triggered (V2) - clearing cache and reloading');
    pager.reset();
    await loadInitial();
  };

  /**
   * Watch for filter/sort changes
   * Updates pager config and reloads
   */
  watch(
    [
      () => options.sortField.value,
      () => options.sortOrder.value,
      () => options.filters.value
    ],
    async ([sortField, sortOrder, filters]) => {
      console.log('🔄 Filter/sort changed (V2) - updating config', { sortField, sortOrder, filters });
      
      // Extract filter values for pager
      // Handle both simple and combined filter formats
      let filterParams: Record<string, any> = {};
      
      if (filters) {
        if (filters.simple || filters.advanced) {
          // Combined format
          filterParams = { ...filters.simple };
          // Advanced filters would be processed by buildParams
        } else {
          // Simple format (backward compatible)
          filterParams = { ...filters };
        }
      }
      
      pager.updateConfig(sortField, sortOrder, filterParams);
      await loadInitial();
    },
    { deep: true }
  );

  /**
   * Debug: Watch totalRecords changes
   */
  watch(totalRecords, (newVal, oldVal) => {
    console.log('📊 Total records changed (V2):', { from: oldVal, to: newVal });
  });

  /**
   * Cleanup on unmount
   * Remove pager from store to prevent memory leak
   */
  onBeforeUnmount(() => {
    console.log('🧹 Component unmounting (V2) - cleaning up pager');
    store.removePager(instanceKey);
  });

  // Initial load
  loadInitial();

  return {
    items,
    loading,
    totalRecords,
    onLazyLoad,
    refresh,
    reset,
    loadInitial, // Expose for priority loading
  };
};
