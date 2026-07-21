/**
 * Virtual Scroll Table Selection Composable
 * 
 * Handles selection logic for virtual scroll tables.
 * NOTE: Traditional select-all doesn't work with virtual scrolling because
 * PrimeVue tries to select all items including undefined placeholders.
 * 
 * This composable provides:
 * - Individual row selection/deselection
 * - Toggle all loaded items (for toolbar buttons)
 * - Selection state queries
 */

import { computed, type ComputedRef } from 'vue';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[VirtualScrollSelection]', ...args);

export interface VirtualScrollSelectionOptions<T extends Record<string, any>> {
  /** Current items array (includes undefined placeholders) */
  items: ComputedRef<(T | undefined)[]> | (T | undefined)[];
  
  /** Current selection array */
  selection: ComputedRef<T[]> | T[];
  
  /** Data key for unique identification */
  dataKey: string;
  
  /** Callback when selection changes */
  onSelectionChange: (newSelection: T[]) => void;
}

export interface VirtualScrollSelectionReturn<T extends Record<string, any>> {
  /** Check if a specific item is selected */
  isSelected: (item: T) => boolean;
  
  /** Toggle selection of a single item */
  toggleSelection: (item: T) => void;
  
  /** Select all loaded (non-undefined) items */
  selectAllLoaded: () => void;
  
  /** Deselect all items */
  deselectAll: () => void;
  
  /** Toggle all loaded items (select if any unselected, deselect if all selected) */
  toggleAllLoaded: () => void;
  
  /** Check if any items are selected */
  hasSelection: ComputedRef<boolean>;
  
  /** Check if all loaded items are selected */
  allLoadedSelected: ComputedRef<boolean>;
  
  /** Count of selected items */
  selectionCount: ComputedRef<number>;
  
  /** Count of loaded (non-undefined) items */
  loadedItemsCount: ComputedRef<number>;
}

export function useVirtualScrollSelection<T extends Record<string, any>>(
  options: VirtualScrollSelectionOptions<T>
): VirtualScrollSelectionReturn<T> {
  
  // Unwrap refs for easier access
  const getItems = () => {
    return 'value' in options.items ? options.items.value : options.items;
  };
  
  const getSelection = () => {
    return 'value' in options.selection ? options.selection.value : options.selection;
  };
  
  /**
   * Get all loaded (non-undefined) items
   */
  const getLoadedItems = (): T[] => {
    return getItems().filter((item): item is T => 
      item?.[options.dataKey]
    );
  };
  
  /**
   * Count of loaded items
   */
  const loadedItemsCount = computed(() => getLoadedItems().length);
  
  /**
   * Check if a specific item is selected
   */
  const isSelected = (item: T): boolean => {
    if (!item || !item[options.dataKey]) {
      log('⚠️ isSelected: Invalid item', { item });
      return false;
    }
    
    const selection = getSelection();
    const result = selection.some(selected => 
      selected[options.dataKey] === item[options.dataKey]
    );
    
    return result;
  };
  
  /**
   * Toggle selection of a single item
   */
  const toggleSelection = (item: T): void => {
    if (!item || !item[options.dataKey]) {
      log('⚠️ toggleSelection: Invalid item', { item });
      return;
    }
    
    const currentSelection = getSelection();
    const isCurrentlySelected = isSelected(item);
    
    let newSelection: T[];
    if (isCurrentlySelected) {
      // Deselect
      newSelection = currentSelection.filter(selected => 
        selected[options.dataKey] !== item[options.dataKey]
      );
      log('❌ DESELECTED', { 
        id: item[options.dataKey],
        remainingCount: newSelection.length 
      });
    } else {
      // Select
      newSelection = [...currentSelection, item];
      log('✅ SELECTED', { 
        id: item[options.dataKey],
        totalCount: newSelection.length 
      });
    }
    
    options.onSelectionChange(newSelection);
  };
  
  /**
   * Select all loaded (non-undefined) items
   */
  const selectAllLoaded = (): void => {
    const loadedItems = getLoadedItems();
    
    log('✅ SELECT ALL LOADED', { 
      loadedCount: loadedItems.length,
      totalItems: getItems().length 
    });
    
    options.onSelectionChange(loadedItems);
  };
  
  /**
   * Deselect all items
   */
  const deselectAll = (): void => {
    const currentCount = getSelection().length;
    
    log('❌ DESELECT ALL', { 
      previousCount: currentCount 
    });
    
    options.onSelectionChange([]);
  };
  
  /**
   * Toggle all loaded items
   * Logic: If all loaded items are selected -> deselect all
   *        If any loaded items are not selected -> select all loaded
   */
  const toggleAllLoaded = (): void => {
    const loadedItems = getLoadedItems();
    const currentSelection = getSelection();
    
    // Check if all loaded items are selected
    const allSelected = loadedItems.length > 0 && loadedItems.every(item =>
      currentSelection.some(selected => 
        selected[options.dataKey] === item[options.dataKey]
      )
    );
    
    if (allSelected) {
      // All loaded items are selected -> deselect all
      log('🔄 TOGGLE ALL: Deselecting all', { 
        loadedCount: loadedItems.length 
      });
      deselectAll();
    } else {
      // Some or none are selected -> select all loaded
      log('🔄 TOGGLE ALL: Selecting all loaded', { 
        loadedCount: loadedItems.length,
        currentlySelected: currentSelection.length 
      });
      selectAllLoaded();
    }
  };
  
  /**
   * Check if any items are selected
   */
  const hasSelection = computed(() => {
    return getSelection().length > 0;
  });
  
  /**
   * Check if all loaded items are selected
   */
  const allLoadedSelected = computed(() => {
    const loadedItems = getLoadedItems();
    const selection = getSelection();
    
    if (loadedItems.length === 0) return false;
    
    return loadedItems.every(item =>
      selection.some(selected => 
        selected[options.dataKey] === item[options.dataKey]
      )
    );
  });
  
  /**
   * Count of selected items
   */
  const selectionCount = computed(() => {
    return getSelection().length;
  });
  
  return {
    isSelected,
    toggleSelection,
    selectAllLoaded,
    deselectAll,
    toggleAllLoaded,
    hasSelection,
    allLoadedSelected,
    selectionCount,
    loadedItemsCount
  };
}
