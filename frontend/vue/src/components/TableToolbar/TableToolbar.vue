<template>
  <Toolbar class="table-toolbar">
    <!-- Start Section: Search, Filter, Refresh -->
    <template #start>
      <div class="toolbar-start">
        <!-- Search InputGroup with Title -->
        <div v-if="showSearch" class="toolbar-search">
          <InputGroup>
            <!-- Title (if provided) -->
            <InputGroupAddon v-if="title">
              <div class="font-bold">{{ title }}</div>
            </InputGroupAddon>
            
            <!-- Search Icon -->
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            
            <!-- Search Input -->
            <InputText
              :model-value="localSearchQuery"
              @update:model-value="handleSearchUpdate"
              :placeholder="computedSearchPlaceholder"
              size="small"
              class="flex-1"
            />
            
            <!-- Clear Button (conditional) -->
            <InputGroupAddon v-if="localSearchQuery">
              <Button
                icon="pi pi-times"
                severity="secondary"
                text
                size="small"
                @click="clearSearch"
              />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <!-- Filter Slot -->
        <slot name="filter" />

        <!-- Refresh Button -->
        <Button
          v-if="showRefresh"
          icon="pi pi-refresh"
          size="small"
          severity="secondary"
          outlined
          :loading="loading"
          :disabled="disabled"
          v-tooltip.bottom="computedRefreshTooltip"
          @click="$emit('refresh')"
        />
      </div>
    </template>

    <!-- End Section: Custom Actions + Delete/Export/Create -->
    <template #end>
      <div class="toolbar-end">
        <!-- Custom Actions Before Standard Buttons -->
        <slot name="actions-prepend" />

        <!-- Delete All Button (optional) -->
        <Button
          v-if="showDeleteAll"
          :label="computedDeleteAllLabel"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          outlined
          :disabled="disabled || loading || !selectedCount || selectedCount === 0"
          :badge="selectedCount && selectedCount > 0 ? String(selectedCount) : undefined"
          badge-severity="danger"
          v-tooltip.bottom="computedDeleteAllTooltip"
          @click="$emit('delete-all')"
        />


        
        <!-- Export Button -->
        <Button
          v-if="showExport"
          icon="pi pi-download"
          size="small"
          severity="secondary"
          outlined
          :disabled="disabled || loading"
          v-tooltip.bottom="computedExportTooltip"
          @click="$emit('export')"
        />

        <!-- Create Button -->
        <Button
          v-if="showCreate"
          :label="computedCreateLabel"
          icon="pi pi-plus"
          size="small"
          :disabled="disabled || loading"
          v-tooltip.bottom="computedCreateTooltip"
          @click="$emit('create')"
        />

        <!-- Custom Actions After Standard Buttons -->
        <slot name="actions-append" />
      </div>
    </template>
  </Toolbar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import { useLocalizationStore } from '@/stores/localization';
import type { TableToolbarProps, TableToolbarEmits } from './TableToolbar.types';

/**
 * TableToolbar Component
 * 
 * Standardized toolbar for data table CRUD operations.
 * Provides search, filter, refresh, export, create, and delete functionality.
 * 
 * @example
 * ```vue
 * <TableToolbar
 *   title="Employees"
 *   v-model:search-query="searchQuery"
 *   @refresh="loadData"
 *   @create="createEmployee"
 * >
 *   <template #filter>
 *     <SplitButton :model="filterOptions" />
 *   </template>
 * </TableToolbar>
 * ```
 */

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(defineProps<TableToolbarProps>(), {
  title: '',
  searchQuery: '',
  searchPlaceholder: '',
  showSearch: true,
  showRefresh: true,
  showExport: true,
  showCreate: true,
  showDeleteAll: false,
  refreshLabel: '',
  exportLabel: '',
  createLabel: '',
  deleteAllLabel: '',
  refreshTooltip: '',
  exportTooltip: '',
  createTooltip: '',
  deleteAllTooltip: '',
  loading: false,
  disabled: false,
  selectedCount: 0,
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<TableToolbarEmits>();

// ============================================================================
// Localization
// ============================================================================

const loc = useLocalizationStore();

// ============================================================================
// State - Local Search with Debouncing
// ============================================================================

/**
 * Local search query for immediate UI feedback
 * This allows the user to type freely without lag
 */
const localSearchQuery = ref(props.searchQuery);

/**
 * Debounce timer for search
 */
let searchDebounceTimer: NodeJS.Timeout | undefined;
const SEARCH_DEBOUNCE_DELAY = 400; // ms - wait for user to stop typing

/**
 * Watch for external searchQuery changes (e.g., from clear filters)
 * Only update if the value is different AND user isn't actively typing
 */
watch(
  () => props.searchQuery,
  (newValue) => {
    // Only update local state if it's different and no pending debounce
    // This prevents losing focus during typing
    if (newValue !== localSearchQuery.value && !searchDebounceTimer) {
      localSearchQuery.value = newValue;
    }
  }
);

/**
 * Default localized labels
 * Loaded from localization store on mount
 */
const defaultSearchPlaceholder = ref('');
const defaultRefreshTooltip = ref('');
const defaultExportTooltip = ref('');
const defaultCreateLabel = ref('');
const defaultCreateTooltip = ref('');
const defaultDeleteAllLabel = ref('');
const defaultDeleteAllTooltip = ref('');

/**
 * Computed labels - use prop if provided, otherwise use localized default
 */
const computedSearchPlaceholder = computed(() => 
  props.searchPlaceholder || defaultSearchPlaceholder.value
);

const computedRefreshTooltip = computed(() => 
  props.refreshTooltip || defaultRefreshTooltip.value
);

const computedExportTooltip = computed(() => 
  props.exportTooltip || defaultExportTooltip.value
);

const computedCreateLabel = computed(() => 
  props.createLabel || defaultCreateLabel.value
);

const computedCreateTooltip = computed(() => 
  props.createTooltip || defaultCreateTooltip.value
);

const computedDeleteAllLabel = computed(() => 
  props.deleteAllLabel || defaultDeleteAllLabel.value
);

const computedDeleteAllTooltip = computed(() => 
  props.deleteAllTooltip || defaultDeleteAllTooltip.value
);

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle search input update with debouncing
 * Updates local state immediately for UI feedback
 * Emits update after user stops typing
 */
function handleSearchUpdate(value: string | null | undefined): void {
  const newValue = value ?? '';
  
  // Update local state immediately for responsive UI
  localSearchQuery.value = newValue;
  
  // Clear existing debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Debounce the emit to parent
  searchDebounceTimer = setTimeout(() => {
    emit('update:searchQuery', newValue);
  }, SEARCH_DEBOUNCE_DELAY);
}

/**
 * Clear search input
 * Clears both local state and emits to parent immediately
 */
function clearSearch(): void {
  // Clear debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Clear local state
  localSearchQuery.value = '';
  
  // Emit immediately (no debounce for clear action)
  emit('update:searchQuery', '');
}

// ============================================================================
// Lifecycle
// ============================================================================

/**
 * Load default localized labels on mount
 * These are used as fallbacks when props are not provided
 */
onMounted(async () => {
  defaultSearchPlaceholder.value = await loc.t('common.toolbar.searchPlaceholder');
  defaultRefreshTooltip.value = await loc.t('common.toolbar.refresh');
  defaultExportTooltip.value = await loc.t('common.toolbar.export');
  defaultCreateLabel.value = await loc.t('common.toolbar.create');
  defaultCreateTooltip.value = await loc.t('common.toolbar.create');
  defaultDeleteAllLabel.value = await loc.t('common.toolbar.deleteAll');
  defaultDeleteAllTooltip.value = await loc.t('common.toolbar.deleteAll');
});
</script>

<style scoped>
/* Compact toolbar styling */
.table-toolbar {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
}

.toolbar-start {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  flex: 1;
}

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

.toolbar-search {
  min-width: 300px;
  max-width: 500px;
  flex-shrink: 1;
  width: 100%;
}

/* Prevent filter elements from wrapping */
.toolbar-start :deep(.p-splitbutton) {
  white-space: nowrap;
  flex-shrink: 0;
}

/* Ensure button text doesn't wrap */
.toolbar-start :deep(.p-splitbutton .p-button-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Compact spacing for all buttons */
.toolbar-start :deep(.p-button),
.toolbar-end :deep(.p-button) {
  padding: 0.5rem 0.75rem;
}

/* Make SplitButton more compact */
.toolbar-start :deep(.p-splitbutton-defaultbutton) {
  padding: 0.5rem 0.75rem;
}

.toolbar-start :deep(.p-splitbutton-menubutton) {
  padding: 0.5rem;
}
</style>
