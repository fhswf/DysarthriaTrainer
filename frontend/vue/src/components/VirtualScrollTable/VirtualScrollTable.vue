<template>
  <div class="virtual-scroll-table-wrapper">
    <!-- Loading overlay for initial load -->
    <div v-if="loading && items.length === 0" class="loading-overlay">
      <slot name="loader">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </slot>
    </div>

    <!-- DataTable - CRITICAL: row-height and itemSize must match effectiveRowHeight -->
    <DataTable
      ref="dataTableRef"
      :value="items"
      :loading="loading && items.length > 0"
      :total-records="totalRecords"
      :virtual-scroll="true"
      :scroll-height="scrollHeight"
      :row-height="effectiveRowHeight"
      :data-key="dataKey"
      :scrollable="true"
      :striped="striped"
      :size="size"
      
      :virtualScrollerOptions="{
        itemSize: effectiveRowHeight,
        lazy: true,
        delay: LAZY_LOAD_DELAY,
        showLoader: false,
        onLazyLoad: handleLazyLoad
      }"
      v-bind="dataTableProps"
      @sort="$emit('sort', $event)"
    >
      <!-- Custom checkbox selection (avoids PrimeVue infinite loop with undefined placeholders) -->
      <Column 
        v-if="selectionMode !== 'none'" 
        :style="{ width: '3rem' }"
      >
        <template #header>
          <Checkbox
            :model-value="allLoadedSelected"
            :indeterminate="hasSelection && !allLoadedSelected"
            @update:model-value="toggleAllLoaded"
            binary
            :pt="{
              root: { 'aria-label': 'Select all loaded rows' }
            }"
          />
        </template>
        <template #body="slotProps">
          <Checkbox
            v-if="slotProps.data && slotProps.data[dataKey]"
            :model-value="isSelected(slotProps.data)"
            @update:model-value="toggleSelection(slotProps.data)"
            binary
          />
        </template>
      </Column>
      
      <!-- Dynamic columns -->
      <Column
        v-for="column in columns"
        :key="column.field"
        :field="column.field"
        :header="column.header"
        :sortable="column.sortable"
        :style="column.style"
      >
        <template #body="slotProps">
          <slot 
            :name="`column-${column.field}`" 
            :data="slotProps.data" 
            :field="column.field"
          >
            <span v-if="slotProps.data && slotProps.data[dataKey]">
              {{ formatColumnValue(slotProps.data[column.field], column) }}
            </span>
            <div v-else class="skeleton-cell">
              <div class="skeleton-text"></div>
            </div>
          </slot>
        </template>
        
        <template v-if="$slots[`header-${column.field}`]" #header>
          <slot :name="`header-${column.field}`" :column="column" />
        </template>
      </Column>
      
      <!-- Actions column -->
      <Column v-if="hasActions" header="Actions" :style="{ width: '10rem' }">
        <template #body="slotProps">
          <slot name="actions" :data="slotProps.data">
            <VirtualScrollTableActions
              v-if="slotProps.data && slotProps.data[dataKey]"
              :item="slotProps.data"
              :actions="actions"
              @view="$emit('view', slotProps.data)"
              @edit="$emit('edit', slotProps.data)"
              @delete="$emit('delete', slotProps.data)"
              @action="$emit('action', $event)"
            />
            <div v-else class="skeleton-actions">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
          </slot>
        </template>
      </Column>
      
      <template #empty>
        <slot name="empty">
          <div class="empty-message">No records found</div>
        </slot>
      </template>
    </DataTable>

    <!-- Progress Bar -->
    <VirtualScrollTableProgressBar
      v-if="showProgressBar"
      :first-visible="effectiveScrollPosition.first"
      :last-visible="effectiveScrollPosition.last"
      :total-records="totalRecords"
      :selection-count="props.selection?.length || 0"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, watch, onMounted, ref, nextTick } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Checkbox from 'primevue/checkbox';
import type { DataTableProps } from 'primevue/datatable';
import VirtualScrollTableActions from './VirtualScrollTableActions.vue';
import VirtualScrollTableProgressBar from './VirtualScrollTableProgressBar.vue';
import { ROW_HEIGHT, LAZY_LOAD_DELAY } from './constants/virtual-scroll-table.constants';
import { useVirtualScrollSelection } from './composables/useVirtualScrollSelection';
import { useVirtualScrollNavigation } from './composables/useVirtualScrollNavigation';
import { useVirtualScrollManagement } from './composables/useVirtualScrollManagement';
import { useTableSessionStorage } from './composables/useTableSessionStorage';
import { formatColumnValue } from './utils/column-formatters';
import type { SessionStorageConfig } from './composables/useSessionStorage';
import type {
  ColumnDefinition,
  ActionConfig,
  LazyLoadEvent
} from './types/virtual-scroll-table.types';

// Debug flag - set to false in production
const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[VirtualScrollTable]', ...args);

// Props interface
const props = withDefaults(defineProps<{
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
   * @example scrollToIndex: 50 (scrolls to row 50)
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
   * @example { storageKey: 'user-table', persistScroll: true, persistSearch: false }
   */
  sessionStorage?: Partial<SessionStorageConfig>;

  // DataTable Props Pass-through
  dataTableProps?: Partial<DataTableProps>;
}>(), {
  rowHeight: ROW_HEIGHT,
  scrollHeight: '100%',
  bufferMultiplier: 1.0,
  scrollToIndex: undefined,
  scrollBehavior: 'smooth',
  selectionMode: 'none',
  striped: true,
  size: 'small',
  showProgressBar: false,
  sessionStorage: undefined,
  dataTableProps: () => ({})
});

// Emits
const emit = defineEmits<{
  'update:selection': [value: T[]];
  'sort': [event: any];
  'lazy-load': [event: LazyLoadEvent];
  'scroll-index-change': [event: { first: number; last: number }];
  'view': [item: T];
  'edit': [item: T];
  'delete': [item: T];
  'action': [payload: { action: string; item: T }];
  'scroll': [event: { index: number }];
}>();

// DataTable reference for accessing VirtualScroller methods
const dataTableRef = ref<InstanceType<typeof DataTable>>();

// CRITICAL: effectiveRowHeight must match DataTable :row-height, VirtualScroller itemSize, and CSS
const effectiveRowHeight = computed(() => props.rowHeight);
const scrollManagement = useVirtualScrollManagement({
  dataTableRef,
  effectiveRowHeight,
  totalRecords: computed(() => props.totalRecords),
  onScrollChange: (position) => {
    emit('scroll-index-change', position);
  },
  enableProgressBar: props.showProgressBar,
});

// Destructure for template usage
const { scrollPosition, attachScrollListener, updateInitialScrollPosition } = scrollManagement;

// Computed scroll position with fallback for initial render
// This ensures progress bar shows reasonable values even before scroll listener is attached
const effectiveScrollPosition = computed(() => {
  // If scroll position has been initialized (last > 0), use it
  if (scrollPosition.value.last > 0) {
    log('📍 Using actual scrollPosition', scrollPosition.value);
    return scrollPosition.value;
  }
  
  // Otherwise, calculate a fallback based on props
  if (props.totalRecords > 0) {
    const scrollHeight = parseInt(props.scrollHeight) || 600;
    const visibleRowCount = Math.ceil(scrollHeight / props.rowHeight);
    const initialLast = Math.min(visibleRowCount - 1, props.totalRecords - 1);
    
    const fallback = {
      first: 0,
      last: initialLast
    };
    
    log('📍 Using fallback scrollPosition', { 
      scrollHeight, 
      visibleRowCount, 
      totalRecords: props.totalRecords,
      result: fallback 
    });
    
    return fallback;
  }
  
  // No data yet
  log('📍 No data yet - returning 0-0');
  return { first: 0, last: 0 };
});

// Selection composable - provides selection state and actions
const selection = useVirtualScrollSelection<T>({
  items: computed(() => props.items),
  selection: computed(() => props.selection || []),
  dataKey: props.dataKey,
  onSelectionChange: (newSelection) => {
    emit('update:selection', newSelection);
  }
});

// Destructure for template usage
const { 
  isSelected, 
  toggleSelection,
  selectAllLoaded,
  deselectAll,
  toggleAllLoaded,
  hasSelection,
  allLoadedSelected,
  selectionCount,
  loadedItemsCount
} = selection;

// Navigation composable - provides scroll-to methods
const navigation = useVirtualScrollNavigation<T>({
  dataTableRef,
  items: computed(() => props.items),
  totalRecords: computed(() => props.totalRecords),
  dataKey: props.dataKey,
  effectiveRowHeight,
  scrollToIndexProp: computed(() => props.scrollToIndex),
  scrollBehavior: computed(() => props.scrollBehavior),
  emit: (event: 'scroll', payload: { index: number }) => emit('scroll', payload)
});

// Destructure navigation methods
const {
  scrollToIndex,
  scrollToItem,
  scrollToTop,
  scrollToBottom
} = navigation;

// Session storage composable - handles scroll position persistence
const tableSessionStorage = useTableSessionStorage({
  config: props.sessionStorage,
  scrollPosition,
  items: computed(() => props.items),
  totalRecords: computed(() => props.totalRecords),
  scrollToIndex: navigation.scrollToIndex,
});

const { sessionStorageApi } = tableSessionStorage;

// Check if actions column should be shown
const hasActions = computed(() => {
  if (!props.actions) return false;
  return props.actions.view || props.actions.edit || props.actions.delete ||
         (props.actions.custom && props.actions.custom.length > 0);
});

// Handle lazy load - triggered when VirtualScroller needs new items
const handleLazyLoad = (event: LazyLoadEvent) => {
  log('🔄 LAZY LOAD TRIGGERED', { 
    first: event.first, 
    last: event.last,
    itemsLength: props.items.length,
    totalRecords: props.totalRecords,
    timestamp: new Date().toISOString()
  });
  
  emit('lazy-load', event);
};

// Initialize component and attach scroll listener on mount
onMounted(async () => {
  log('🚀 COMPONENT MOUNTED', {
    totalRecords: props.totalRecords,
    itemsLength: props.items.length,
    rowHeight: props.rowHeight,
    scrollHeight: props.scrollHeight,
    selectionMode: props.selectionMode,
    hasActions: hasActions.value,
    dataKey: props.dataKey
  });

  // Wait for DataTable and VirtualScroller to fully render
  await nextTick();
  await nextTick(); // Double nextTick ensures VirtualScroller is mounted
  
  // Calculate initial scroll position based on actual DOM height
  if (props.showProgressBar) {
    updateInitialScrollPosition();
  }
  
  // Attach scroll listener for progress bar updates
  if (props.showProgressBar) {
    attachScrollListener();
  }
});

// Update scroll position when totalRecords changes (e.g., after initial data load)
watch(() => props.totalRecords, (newTotal, oldTotal) => {
  log('📊 TOTAL RECORDS CHANGED', { from: oldTotal, to: newTotal });
  
  // Recalculate initial position if progress bar is enabled and we went from 0 to actual data
  if (props.showProgressBar && oldTotal === 0 && newTotal > 0) {
    nextTick(() => {
      log('🔄 Triggering position update due to totalRecords change');
      updateInitialScrollPosition();
    });
  }
});

// Update scroll position when items are first loaded
watch(() => props.items.length, (newLength, oldLength) => {
  log('📦 ITEMS LENGTH CHANGED', { from: oldLength, to: newLength, totalRecords: props.totalRecords });
  
  // Recalculate position if progress bar is enabled and items just arrived
  if (props.showProgressBar && oldLength === 0 && newLength > 0 && props.totalRecords > 0) {
    nextTick(() => {
      log('🔄 Triggering position update due to items load');
      updateInitialScrollPosition();
    });
  }
});

// Expose methods for parent components
// Usage: tableRef.value?.selectAllLoaded(), scrollToIndex(50), getCurrentScrollPosition()
defineExpose({
  // Spread selection methods and state
  ...selection,
  
  // Spread navigation methods
  ...navigation,
  
  // Expose current scroll position
  getCurrentScrollPosition: () => scrollPosition.value.first,
  
  // Expose scroll position ref for reactive access
  scrollPosition: computed(() => scrollPosition.value)
});
</script>

<style scoped>
.virtual-scroll-table-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Critical: allows flexbox to shrink */
}

.virtual-scroll-table-wrapper :deep(.p-datatable) {
  flex: 1;
  min-height: 0; /* Critical: allows flexbox to shrink */
  height: auto; /* Let flex control height */
}

/* Ensure the table container takes full height */
.virtual-scroll-table-wrapper :deep(.p-datatable-table-container) {
  height: 100%;
}

/* Ensure virtualscroller takes full height */
.virtual-scroll-table-wrapper :deep(.p-virtualscroller) {
  height: 100% !important;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

/* CRITICAL: Row height must match effectiveRowHeight across DataTable, VirtualScroller, and CSS */
:deep(.p-datatable-tbody > tr) {
  height: v-bind('effectiveRowHeight + "px"') !important;
  min-height: v-bind('effectiveRowHeight + "px"') !important;
  max-height: v-bind('effectiveRowHeight + "px"') !important;
}

:deep(.p-datatable-tbody > tr > td) {
  height: v-bind('effectiveRowHeight + "px"');
  min-height: v-bind('effectiveRowHeight + "px"');
  max-height: v-bind('effectiveRowHeight + "px"');
  box-sizing: border-box;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Skeleton cells */
.skeleton-cell {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0;
}

.skeleton-text {
  height: 1rem;
  width: 80%;
  background: linear-gradient(
    90deg,
    var(--surface-200) 25%,
    var(--surface-300) 50%,
    var(--surface-200) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.skeleton-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Header styling - sticky with solid background */
:deep(.p-datatable-thead > tr > th) {
  background-color: var(--surface-ground);
  font-weight: 600;
  padding: 0.75rem 1rem;
  position: sticky;
  z-index: 1;
}

:deep(.p-datatable-thead > tr > th.p-datatable-column-sorted) {
  background-color: var(--surface-ground);
}

:deep(.p-datatable-thead > tr > th.p-datatable-sortable-column:hover) {
  background-color: var(--surface-hover);
}

/* Empty message */
.empty-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>
