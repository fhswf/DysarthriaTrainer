<template>
  <div class="flex flex-col h-full p-2">
    <!-- Toolbar (default or custom slot) -->
    <slot name="toolbar" :search-query="searchQuery" :loading="loading" :selected-count="selectedItems.length"
      :on-search="handleSearch" :on-refresh="refresh" :on-create="handleCreate" :on-export="handleExport"
      :on-delete-all="handleDeleteAll">
      <TableToolbar v-model:search-query="searchQuery" :title="pageTitle" :search-placeholder="searchPlaceholder"
        :show-search="features.search" :show-refresh="features.refresh" :show-create="features.create"
        :show-export="features.export" :show-delete-all="showDeleteAll" :selected-count="selectedItems.length"
        :loading="loading || isExporting" :disabled="false" @update:search-query="handleSearch" @refresh="refresh"
        @create="handleCreate" @export="handleExport" @delete-all="handleDeleteAll">
        <!-- Filter slot - Pass through TableFilter component -->
        <template #filter>
          <slot name="filter">
            <TableFilter v-if="features.filters && filterConfig" ref="tableFilterRef" :config="filterConfig"
              @change="handleFiltersApplied" />
          </slot>
        </template>

        <!-- Additional toolbar actions (prepend) -->
        <template #actions-prepend>
          <slot name="toolbar-actions-prepend" />
        </template>

        <!-- Additional toolbar actions (append) -->
        <template #actions-append>
          <slot name="toolbar-actions-append" />
        </template>
      </TableToolbar>
    </slot>

    <!-- Virtual Scroll Table -->
    <div class="flex-1 mt-4">
      <VirtualScrollTable ref="tableRef" :items="items" :data-key="dataKey" :loading="loading"
        :total-records="totalRecords" :columns="localizedColumns" :row-height="tableConfig.rowHeight"
        :scroll-height="tableConfig.scrollHeight" :striped="tableConfig.striped" :size="tableConfig.size"
        :selection-mode="tableConfig.selectionMode" show-progress-bar v-model:selection="(selectedItems as T[])"
        :sortable="features.sort" :sort-field="sortField" :sort-order="sortOrder" :actions="{
          view: features.viewAction,
          edit: features.editAction,
          delete: features.deleteAction,
        }" @lazy-load="onLazyLoad" @sort="handleSort" @view="handleView" @edit="handleEdit" @delete="handleDelete">
        <!-- Column cell slots -->
        <template v-for="col in columns" :key="col.field" #[`column-${col.field}`]="slotProps">
          <slot :name="`column-${col.field}`" v-bind="slotProps">
            <!-- Default: Use format function or raw value -->
            <template v-if="slotProps.data && col.format">
              {{ col.format(slotProps.data[col.field], slotProps.data) }}
            </template>
            <template v-else-if="slotProps.data">
              {{ slotProps.data[col.field] }}
            </template>
            <template v-else>
              <!-- Loading placeholder -->
              <span class="text-gray-400">...</span>
            </template>
          </slot>
        </template>

        <!-- Row actions (view, edit, delete) -->
        <template #actions="{ data }">
          <slot name="actions" :data="data">
            <div v-if="data" class="flex gap-2">
              <Button v-if="features.viewAction" icon="pi pi-eye" severity="secondary" text size="small"
                @click="handleView(data)" />
              <Button v-if="features.editAction" icon="pi pi-pencil" severity="secondary" text size="small"
                @click="handleEdit(data)" />
              <Button v-if="features.deleteAction" icon="pi pi-trash" severity="danger" text size="small"
                @click="handleDelete(data)" />
            </div>
          </slot>
        </template>

        <!-- Empty state -->
        <template #empty>
          <slot name="empty" :is-filtered="isFiltered" :on-clear-filters="clearFilters" :on-create="handleCreate">
            <div class="text-center py-12">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
              <h3 class="text-xl font-semibold mb-2">
                {{ emptyTitle }}
              </h3>
              <p class="text-gray-600 mb-4">
                {{ isFiltered ? emptyDescriptionFiltered : emptyDescription }}
              </p>
              <div class="flex gap-2 justify-center">
                <Button v-if="isFiltered" :label="clearFiltersLabel" icon="pi pi-filter-slash" @click="clearFilters" />
                <Button v-if="features.create" :label="createActionLabel" icon="pi pi-plus" @click="handleCreate" />
              </div>
            </div>
          </slot>
        </template>
      </VirtualScrollTable>
    </div>

    <!-- Confirm Dialog for deletions -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any> = any">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import Button from 'primevue/button';
import TableToolbar from '@/components/TableToolbar/TableToolbar.vue';
import { TableFilter } from '@/components/TableFilter';
import { VirtualScrollTable } from '@/components/VirtualScrollTable';
import { useLocalizationStore } from '@/stores/localization';
import { useMessagingStore } from '@/stores/messaging';
import { useApiStore } from '@/stores/api';
import { useTableSetupData } from './composables/useTableSetupData';
import { useTableSetupStorage } from './composables/useTableSetupStorage';
import type {
  TableSetupProps,
  TableFeatures,
  TableConfig,
} from './TableSetup.types';
import type { ColumnDefinition } from '@/components/VirtualScrollTable/types/virtual-scroll-table.types';

/**
 * Props with defaults
 */
const props = withDefaults(defineProps<TableSetupProps<T>>(), {
  storageKey: '',
  features: () => ({
    search: true,
    filters: true,
    sort: true,
    refresh: true,
    export: true,
    create: true,
    deleteAll: false,
    viewAction: true,
    editAction: true,
    deleteAction: true,
  }),
  tableConfig: () => ({
    rowHeight: 50,
    scrollHeight: 'calc(100vh - 250px)',
    striped: true,
    size: 'small',
    selectionMode: 'multiple',
  }),
  initialState: () => ({}),
});

/**
 * Emits
 */
const emit = defineEmits<{
  'update:selection': [value: T[]];
  'create': [];
  'view': [item: T];
  'edit': [item: T];
  'delete': [item: T];
  'delete-all': [items: T[]];
  'export': [data: T[]];
  'data-loaded': [data: T[]];
  'error': [error: Error];
  'filters-changed': [filters: Record<string, unknown>];
}>();

/**
 * Services
 */
const loc = useLocalizationStore();
const messaging = useMessagingStore();
const confirm = useConfirm();

/**
 * Merged features with defaults
 */
const features = computed<Required<TableFeatures>>(() => ({
  search: true,
  filters: true,
  sort: true,
  refresh: true,
  export: true,
  create: true,
  deleteAll: false,
  viewAction: true,
  editAction: true,
  deleteAction: true,
  ...props.features,
}));

/**
 * Merged table config with defaults
 */
const tableConfig = computed<Required<TableConfig>>(() => ({
  rowHeight: 50,
  scrollHeight: 'calc(100vh - 250px)',
  striped: true,
  size: 'small',
  selectionMode: 'multiple',
  ...props.tableConfig,
}));

/**
 * Storage key (uses prop or defaults to i18nKey)
 */
const storageKey = computed(() => props.storageKey || `table-setup:${props.i18nKey}`);

/**
 * Storage instance
 */
const storage = useTableSetupStorage(storageKey.value);

/**
 * Table state
 */
const savedState = storage.loadState();
const searchQuery = ref(savedState?.search ?? props.initialState.searchQuery ?? '');
const sortField = ref(savedState?.sort?.field ?? props.initialState.sortField ?? 'id');
const sortOrder = ref<1 | -1>(savedState?.sort?.order ?? props.initialState.sortOrder ?? 1);
const selectedItems = ref<T[]>([]);
const tableRef = ref();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tableFilterRef = ref<any>(null);

/**
 * Initialize currentFilters from TableFilter storage
 * This ensures filters are available before the filter component emits them
 * Loads both preset filters and custom filters from storage
 */
function loadSavedFilters(): Record<string, unknown> {
  if (!props.filterConfig?.id) {
    return {};
  }

  try {
    // Load custom filters
    const filterStorageKey = `table-filter:${props.filterConfig.id}`;
    const storedCustom = sessionStorage.getItem(filterStorageKey);
    const customFilters = storedCustom ? JSON.parse(storedCustom) : {};

    // Load preset selection
    const presetStorageKey = `table-filter-preset:${props.filterConfig.id}`;
    const storedPresetId = sessionStorage.getItem(presetStorageKey);

    // Resolve preset filters if a preset is stored
    let presetFilters = {};
    if (storedPresetId && props.filterConfig.presets) {
      const preset = props.filterConfig.presets.find(p => p.id === storedPresetId);
      if (preset) {
        // Handle both static filters and filter functions
        presetFilters = typeof preset.filters === 'function'
          ? preset.filters()
          : preset.filters;
      }
    }

    // Merge preset filters with custom filters (custom overrides preset)
    return {
      ...presetFilters,
      ...customFilters,
    };
  } catch {
    // Silently fail and return empty filters
    return {};
  }
}

const currentFilters = ref<Record<string, unknown>>(loadSavedFilters());
const isExporting = ref(false); // Loading state for export

/**
 * Data management
 */
const {
  items,
  loading,
  totalRecords,
  onLazyLoad,
  refresh,
  reset,
  handleSort,
  handleSearch: handleSearchInternal,
} = useTableSetupData<T>(
  props.apiService,
  searchQuery,
  sortField,
  sortOrder,
  currentFilters,
  storageKey.value
);

/**
 * Localized labels (loaded in onMounted)
 */
const pageTitle = ref('');
const searchPlaceholder = ref('');
const emptyTitle = ref('');
const emptyDescription = ref('');
const emptyDescriptionFiltered = ref('');
const clearFiltersLabel = ref('');
const createActionLabel = ref('');

/**
 * Localized columns with resolved headers
 */
const localizedColumns = ref<ColumnDefinition[]>([]);

/**
 * Check if items are selected
 */
const hasSelection = computed(() => selectedItems.value.length > 0);

/**
 * Show delete-all button when selection mode is enabled AND items are selected
 */
const showDeleteAll = computed(() => {
  return tableConfig.value.selectionMode !== 'none' && hasSelection.value;
});

/**
 * Check if filters are active
 */
const isFiltered = computed(() => {
  return searchQuery.value !== '' || Object.keys(currentFilters.value).length > 0;
});

/**
 * Handle search
 */
function handleSearch(query: string): void {
  handleSearchInternal(query);
}

/**
 * Handle filters applied from TableFilter
 */
function handleFiltersApplied(filters: Record<string, unknown>): void {
  // Only update if filters actually changed
  const filtersChanged = JSON.stringify(currentFilters.value) !== JSON.stringify(filters);

  if (filtersChanged) {
    currentFilters.value = filters;
    emit('filters-changed', filters);
  }
}

/**
 * Clear all filters and select first preset
 * Note: This only clears advanced filters (TableFilter), not the search query
 */
function clearFilters(): void {
  // Don't clear search query - only clear advanced filters
  // The search query should remain and be applied after filter reset

  // Select first preset if available
  if (props.filterConfig?.presets && props.filterConfig.presets.length > 0) {
    const firstPreset = props.filterConfig.presets[0];
    if (tableFilterRef.value) {
      tableFilterRef.value.applyPreset(firstPreset.id);
    }
  } else {
    // Fallback to old behavior if no presets
    currentFilters.value = {};
    if (tableFilterRef.value) {
      tableFilterRef.value.clearFilters();
    }
  }

  // Wait for reset to complete
  // This will reload data with current search query if present
  reset();
}

/**
 * Handle create
 */
function handleCreate(): void {
  emit('create');
}

/**
 * Handle view
 */
function handleView(item: T): void {
  emit('view', item);
}

/**
 * Handle edit
 */
function handleEdit(item: T): void {
  emit('edit', item);
}

/**
 * Handle delete (with confirmation)
 */
function handleDelete(item: T): void {
  const message = loc.t(`${props.i18nKey}.confirmDelete.message`);
  const header = loc.t(`${props.i18nKey}.confirmDelete.title`);

  confirm.require({
    message,
    header,
    icon: 'pi pi-exclamation-triangle',
    accept: () => void performDelete(item),
  });
}

/**
 * Perform delete
 */
async function performDelete(item: T): Promise<void> {
  if (!props.apiService.delete) {
    return;
  }

  try {
    const id = (item as Record<string, unknown>)[props.dataKey] as string | number;
    await props.apiService.delete(id);

    const successMsg = loc.t(`${props.i18nKey}.messages.deleteSuccess`);
    void messaging.success(successMsg);

    void refresh();
  } catch (error) {
    const errorMsg = loc.t(`${props.i18nKey}.errors.deleteFailed`);
    void messaging.error(errorMsg);
    emit('error', error as Error);
  }
}

/**
 * Handle delete all
 */
function handleDeleteAll(): void {
  const message = loc.t(`${props.i18nKey}.confirmDeleteAll.message`);
  const header = loc.t(`${props.i18nKey}.confirmDeleteAll.title`);

  confirm.require({
    message: message.replace('{count}', String(selectedItems.value.length)),
    header,
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      emit('delete-all', selectedItems.value as T[]);
    },
  });
}

/**
 * Handle export
 */
async function handleExport(): Promise<void> {
  // Prevent multiple simultaneous exports
  if (isExporting.value) {
    return;
  }

  isExporting.value = true;

  try {
    // Build params with current filters and export parameter
    // Clean up filter params - remove undefined/null values
    const cleanFilters: Record<string, unknown> = {};
    Object.entries(currentFilters.value).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    const params: Record<string, unknown> = {
      ...cleanFilters,
      offset: 0,
      limit: 10000,
      _export: 'csv',
    };

    // Add search if present
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    // Access the baseUrl from the apiService (it's a private property but we need it)
    // TypeScript will complain, but this is the cleanest solution for now
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiService = props.apiService as any;
    const baseUrl = apiService.baseUrl ?? '/api/unknown';

    // Make direct API call with blob response type
    const apiStore = useApiStore();
    const response = await apiStore.get(`${baseUrl}/`, {
      params,
      responseType: 'blob',
      useCache: false, // CRITICAL: Don't use cache for CSV export
    });

    // Response.data is the blob
    const blob = response.data as unknown as Blob;

    // Extract filename from Content-Disposition header if available
    let filename = 'export.csv';

    // Axios normalizes headers to lowercase
    const headers = response.headers;
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'];

    if (contentDisposition) {
      // Try multiple patterns to extract filename
      // Pattern 1: filename="something.csv"
      let filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      } else {
        // Pattern 2: filename=something.csv (without quotes)
        filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1].trim();
        }
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);

    // Emit event with empty results (since we have blob, not data)
    emit('export', []);

    const successMsg = loc.t(`${props.i18nKey}.messages.exportSuccess`);
    void messaging.success(successMsg);
  } catch (error) {
    const errorMsg = loc.t(`${props.i18nKey}.errors.exportFailed`);
    void messaging.error(errorMsg);
    emit('error', error as Error);
  } finally {
    isExporting.value = false;
  }
}

/**
 * Watch selection changes
 */
watch(selectedItems, (newSelection) => {
  emit('update:selection', newSelection as T[]);
});

/**
 * Watch items loaded
 */
watch(items, (newItems) => {
  if (newItems.length > 0) {
    emit('data-loaded', newItems.filter((item): item is T => item !== undefined));
  }
});

/**
 * Watch scroll position and save to storage
 * Watches the table's scroll position and persists it to session storage
 * for restoration when returning to the table
 */
watch(
  () => tableRef.value?.scrollPosition,
  (newPosition) => {
    if (newPosition && newPosition.first > 0) {
      storage.updateState('scroll', newPosition.first);
    }
  },
  { deep: true }
);

/**
 * Load localized content
 */
onMounted(() => {
  // Page title
  pageTitle.value = loc.t(`${props.i18nKey}.title`);

  // Search placeholder
  searchPlaceholder.value = loc.t(`${props.i18nKey}.search.placeholder`);

  // Empty state
  emptyTitle.value = loc.t(`${props.i18nKey}.emptyState.title`);
  emptyDescription.value = loc.t(`${props.i18nKey}.emptyState.description`);
  emptyDescriptionFiltered.value = loc.t(`${props.i18nKey}.emptyState.descriptionFiltered`);
  clearFiltersLabel.value = loc.t(`${props.i18nKey}.emptyState.clearFilters`);
  createActionLabel.value = loc.t(`${props.i18nKey}.emptyState.action`);

  // Localize columns
  localizedColumns.value = props.columns.map((col) => {
    const headerKey = col.headerKey.includes('.')
      ? col.headerKey
      : `${props.i18nKey}.columns.${col.headerKey}`;

    return {
      ...col,
      header: loc.t(headerKey),
    } as ColumnDefinition;
  });

  // Restore scroll position after data loads
  const savedState = storage.loadState();
  const savedScrollPosition = savedState?.scroll;

  if (savedScrollPosition && savedScrollPosition > 0) {
    // Wait for data to load, then scroll to saved position
    const stopWatch = watch(
      () => items.value.length > 0 && totalRecords.value > 0,
      (hasData) => {
        if (hasData && tableRef.value) {
          void nextTick(() => {
            tableRef.value.scrollToIndex(savedScrollPosition, 'auto');
          });
          stopWatch?.(); // Stop watching after scroll
        }
      },
      { immediate: true }
    );
  }
});

/**
 * Expose methods for parent components
 */
defineExpose({
  refresh,
});
</script>
