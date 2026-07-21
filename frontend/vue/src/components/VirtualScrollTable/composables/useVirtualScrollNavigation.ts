/**
 * Virtual Scroll Navigation Composable
 * 
 * Provides programmatic scroll navigation for VirtualScrollTable component.
 * Supports scroll-to-index, scroll-to-item, scroll-to-top, and scroll-to-bottom.
 * 
 * Uses PrimeVue VirtualScroller's native scrollToIndex() method when available,
 * with fallback to manual scroll calculation for robustness.
 */

import { watch, onMounted, nextTick, type Ref, type ComputedRef } from 'vue';
import type DataTable from 'primevue/datatable';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[VirtualScrollNavigation]', ...args);

export interface VirtualScrollNavigationOptions<T> {
  /** DataTable component reference */
  dataTableRef: Ref<InstanceType<typeof DataTable> | undefined>;
  
  /** Items array for finding items by key */
  items: ComputedRef<(T | undefined)[]> | (T | undefined)[];
  
  /** Total records count for bounds checking */
  totalRecords: ComputedRef<number> | number;
  
  /** Data key for unique identification */
  dataKey: string;
  
  /** Effective row height in pixels */
  effectiveRowHeight: ComputedRef<number> | number;
  
  /** Initial scroll position (row index) */
  scrollToIndexProp?: ComputedRef<number | undefined> | number | undefined;
  
  /** Scroll behavior ('auto' | 'smooth') */
  scrollBehavior?: ComputedRef<'auto' | 'smooth'> | 'auto' | 'smooth';
  
  /** Emit function for scroll events */
  emit?: (event: 'scroll', payload: { index: number }) => void;
}

export interface VirtualScrollNavigationReturn {
  /** Scroll to a specific row index */
  scrollToIndex: (index: number, behavior?: 'auto' | 'smooth') => Promise<void>;
  
  /** Scroll to a specific row by its data key value */
  scrollToItem: (keyValue: any, behavior?: 'auto' | 'smooth') => void;
  
  /** Scroll to the first row */
  scrollToTop: (behavior?: 'auto' | 'smooth') => void;
  
  /** Scroll to the last row */
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void;
}

export function useVirtualScrollNavigation<T extends Record<string, any>>(
  options: VirtualScrollNavigationOptions<T>
): VirtualScrollNavigationReturn {
  
  // Helper to check if value is a ref
  const isRef = (val: any): val is ComputedRef<any> => {
    return val && typeof val === 'object' && 'value' in val;
  };
  
  // Unwrap refs for easier access
  const getItems = () => {
    return isRef(options.items) ? options.items.value : options.items;
  };
  
  const getTotalRecords = () => {
    return isRef(options.totalRecords) ? options.totalRecords.value : options.totalRecords;
  };
  
  const getRowHeight = () => {
    return isRef(options.effectiveRowHeight) 
      ? options.effectiveRowHeight.value 
      : options.effectiveRowHeight;
  };
  
  const getScrollBehavior = () => {
    return isRef(options.scrollBehavior)
      ? options.scrollBehavior.value
      : (options.scrollBehavior || 'smooth');
  };
  
  const getScrollToIndexProp = () => {
    if (!options.scrollToIndexProp) return undefined;
    return isRef(options.scrollToIndexProp)
      ? options.scrollToIndexProp.value
      : options.scrollToIndexProp;
  };
  
  /**
   * Scroll to a specific row index
   */
  const scrollToIndex = async (index: number, behavior?: 'auto' | 'smooth'): Promise<void> => {
    if (!options.dataTableRef.value) {
      log('⚠️  Cannot scroll: DataTable ref not available');
      return;
    }

    if (index < 0 || index >= getTotalRecords()) {
      log(`⚠️  Cannot scroll: Index ${index} out of bounds (0-${getTotalRecords() - 1})`);
      return;
    }

    await nextTick();
    await nextTick(); // Double nextTick for better reliability

    try {
      // Try multiple paths to access VirtualScroller
      const dataTableInstance = options.dataTableRef.value as any;
      
      // Path 1: $refs.virtualScroller (PrimeVue structure)
      let virtualScroller = dataTableInstance.$refs?.virtualScroller;
      
      // Path 2: $refs.virtualScrollerRef (alternative)
      if (!virtualScroller) {
        virtualScroller = dataTableInstance.$refs?.virtualScrollerRef;
      }
      
      // Path 3: Direct access
      if (!virtualScroller) {
        virtualScroller = dataTableInstance.virtualScroller;
      }
      
      log('🔍 VirtualScroller lookup:', {
        found: !!virtualScroller,
        hasScrollToIndex: virtualScroller && typeof virtualScroller.scrollToIndex === 'function',
        $refs: Object.keys(dataTableInstance.$refs || {}),
      });
      
      if (virtualScroller && typeof virtualScroller.scrollToIndex === 'function') {
        const scrollBehavior = behavior ?? getScrollBehavior();
        
        log(`📜 Scrolling to index ${index} with behavior '${scrollBehavior}' (using VirtualScroller.scrollToIndex)`);
        
        // Call PrimeVue VirtualScroller's scrollToIndex method
        virtualScroller.scrollToIndex(index, scrollBehavior);
        
        if (options.emit) {
          options.emit('scroll', { index });
        }
        
        log(`✅ Scrolled to index ${index}`);
      } else {
        log('⚠️  VirtualScroller scrollToIndex method not available, using fallback');
        
        // Fallback: manual scroll calculation
        const scrollElement = dataTableInstance.$el?.querySelector('.p-virtualscroller') 
          || dataTableInstance.$el?.querySelector('.p-datatable-wrapper');
          
        if (scrollElement) {
          const scrollTop = index * getRowHeight();
          log(`📜 Using fallback scroll to position ${scrollTop}px (index ${index}, rowHeight ${getRowHeight()})`);
          
          const effectiveBehavior = behavior ?? getScrollBehavior();
          if (effectiveBehavior === 'smooth') {
            scrollElement.scrollTo({ top: scrollTop, behavior: 'smooth' });
          } else {
            scrollElement.scrollTop = scrollTop;
          }
          
          if (options.emit) {
            options.emit('scroll', { index });
          }
          log(`✅ Fallback scrolled to index ${index}`);
        } else {
          log('❌ Scroll container not found');
        }
      }
    } catch (error) {
      log('❌ Error scrolling to index:', error);
    }
  };
  
  /**
   * Scroll to a specific row by its data key value
   */
  const scrollToItem = (keyValue: any, behavior?: 'auto' | 'smooth'): void => {
    const items = getItems();
    const index = items.findIndex(item => 
      item && item[options.dataKey] === keyValue
    );
    
    if (index === -1) {
      log(`⚠️  Item with ${options.dataKey}=${keyValue} not found or not loaded`);
      return;
    }
    
    log(`📍 Found item with ${options.dataKey}=${keyValue} at index ${index}`);
    scrollToIndex(index, behavior);
  };
  
  /**
   * Scroll to the first row
   */
  const scrollToTop = (behavior?: 'auto' | 'smooth'): void => {
    log('⬆️  Scrolling to top');
    scrollToIndex(0, behavior);
  };
  
  /**
   * Scroll to the last row
   */
  const scrollToBottom = (behavior?: 'auto' | 'smooth'): void => {
    log('⬇️  Scrolling to bottom');
    const lastIndex = getTotalRecords() - 1;
    scrollToIndex(lastIndex, behavior);
  };
  
  // Watch for scrollToIndex prop changes
  if (options.scrollToIndexProp !== undefined) {
    watch(() => getScrollToIndexProp(), (newIndex) => {
      if (newIndex !== undefined && newIndex !== null) {
        log(`👀 scrollToIndex prop changed to ${newIndex}`);
        nextTick(() => {
          scrollToIndex(newIndex);
        });
      }
    });
  }
  
  // Scroll to initial index on mount
  onMounted(() => {
    const initialIndex = getScrollToIndexProp();
    if (initialIndex !== undefined && initialIndex !== null) {
      log(`🚀 Initial scroll to index ${initialIndex}`);
      // Delay to ensure table is fully rendered
      setTimeout(() => {
        scrollToIndex(initialIndex);
      }, 100);
    }
  });
  
  return {
    scrollToIndex,
    scrollToItem,
    scrollToTop,
    scrollToBottom
  };
}
