<template>
  <div class="table-filter">
    <!-- Split Button -->
    <FilterSplitButton
      :i18nPrefix="config.i18nPrefix"
      :labelKey="filterState.buttonLabelKey.value"
      :icon="filterState.buttonIcon.value"
      :severity="filterState.buttonSeverity.value"
      :presets="config.presets"
      :selectedPresetId="filterState.selectedPresetId.value"
      :activeFilterCount="filterState.activeFilterCount.value"
      @click="filterState.openDialog()"
      @selectPreset="handlePresetSelect"
    />

    <!-- Filter Dialog -->
    <FilterDialog
      ref="dialogRef"
      v-model:visible="filterState.dialogVisible.value"
      v-model:tempFilters="filterState.tempFilters.value"
      :i18nPrefix="config.i18nPrefix"
      :visibleFields="filterState.visibleFields.value"
      :groupedFields="filterState.groupedFields.value"
      :ungroupedFields="filterState.ungroupedFields.value"
      :quickPresets="config.quickPresets || []"
      :validationErrors="validationErrors"
      :isValid="filterState.isTempFiltersValid.value"
      @apply="handleApply"
      @cancel="filterState.closeDialog()"
      @clear="filterState.clearTempFilters()"
      @quickPreset="handleQuickPreset"
    />
  </div>
</template>

<script setup lang="ts" generic="TParams extends Record<string, any>">
import { computed, watch, ref } from 'vue';
import type { TableFilterConfig, QuickPreset } from '../types';
import { useTableFilter } from '../composables/useTableFilter';
import FilterSplitButton from './FilterSplitButton.vue';
import FilterDialog from './FilterDialog.vue';
import { useFilterPresets } from '../composables/useFilterPresets';

/**
 * TableFilter Component
 * 
 * Main filter component that combines SplitButton + Dialog.
 * Provides v-model support for filter state and emits change events.
 * 
 * @example
 * ```vue
 * <TableFilter
 *   v-model:filters="filters"
 *   :config="filterConfig"
 *   @change="handleFilterChange"
 * />
 * ```
 */

// ============================================================================
// Props
// ============================================================================

export interface TableFilterProps<TParams extends Record<string, any>> {
  /**
   * Filter configuration
   */
  config: TableFilterConfig<TParams>;

  /**
   * Current filter values (v-model)
   */
  filters?: Partial<TParams>;
}

const props = withDefaults(defineProps<TableFilterProps<TParams>>(), {
  filters: () => ({}),
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  'update:filters': [value: Partial<TParams>];
  'change': [value: Partial<TParams>];
  'apply': [value: Partial<TParams>];
  'clear': [];
}>();

// ============================================================================
// Composable
// ============================================================================

const filterState = useTableFilter<TParams>(props.config);

/**
 * Reference to the dialog component
 * Using 'any' type because FilterDialog is a generic component
 * and TypeScript can't properly infer InstanceType for generic Vue components
 */
const dialogRef = ref<any>(null);

/**
 * Preset manager for resolving quick preset filters
 */
const presetManager = useFilterPresets<TParams>(
  props.config.presets,
  props.config.quickPresets || [],
  props.config.defaults?.preset
);

// ============================================================================
// Computed
// ============================================================================

/**
 * Validation errors for dialog
 */
const validationErrors = computed(() => {
  const validation = filterState.validateTempFilters();
  return validation.errors;
});

// ============================================================================
// Watch Filters
// ============================================================================

/**
 * Watch internal filters and emit updates
 * immediate: true ensures saved filters are emitted on mount
 */
watch(
  () => filterState.filters.value,
  (newFilters) => {
    emit('update:filters', newFilters);
    emit('change', newFilters);
  },
  { deep: true, immediate: true }
);

/**
 * Watch external filter changes (v-model)
 */
watch(
  () => props.filters,
  (newFilters) => {
    if (JSON.stringify(newFilters) !== JSON.stringify(filterState.filters.value)) {
      filterState.applyCustomFilters(newFilters || {});
    }
  },
  { deep: true }
);

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle preset selection from split button
 */
function handlePresetSelect(presetId: string) {
  filterState.applyPresetById(presetId);
}

/**
 * Handle quick preset click in dialog
 * Instead of applying directly, fill the form inputs
 */
function handleQuickPreset(preset: QuickPreset<TParams>) {
  // Resolve the preset filters (handle functions)
  const resolvedFilters = presetManager.resolveQuickPresetFilters(preset);
  
  // Apply to the dialog form (fills inputs instead of applying directly)
  if (dialogRef.value) {
    dialogRef.value.applyQuickPresetToForm(resolvedFilters);
  }
}

/**
 * Handle apply button in dialog
 */
function handleApply() {
  if (filterState.applyAndCloseDialog()) {
    emit('apply', filterState.filters.value);
  }
}

// ============================================================================
// Expose Public API
// ============================================================================

defineExpose({
  /**
   * Apply a preset by ID
   */
  applyPreset: filterState.applyPresetById,

  /**
   * Clear all filters
   */
  clearFilters: filterState.clearAllFilters,

  /**
   * Reset to defaults
   */
  resetToDefaults: filterState.resetToDefaults,

  /**
   * Open the dialog
   */
  openDialog: filterState.openDialog,

  /**
   * Get current filters
   */
  getFilters: () => filterState.filters.value,

  /**
   * Get active filter count
   */
  getActiveFilterCount: () => filterState.activeFilterCount.value,
});
</script>

<style scoped>
.table-filter {
  display: inline-block;
}
</style>
