import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import type { TableFilterConfig, FilterPreset, QuickPreset } from '../types';
import { useFilterPresets } from './useFilterPresets';
import { useFilterForm } from './useFilterForm';
import { useFilterStorage } from './useFilterStorage';
import { cleanFilters, mergeFilters, countActiveFilters, isFiltersEmpty } from '../utils/filterCleaner';
import { validateFilters } from '../utils/filterValidator';

/**
 * Main composable for the TableFilter component
 * 
 * Orchestrates all filter functionality:
 * - Preset management (dropdown + quick presets)
 * - Custom filter values
 * - Form field grouping and visibility
 * - Session storage persistence
 * - Validation
 * 
 * @template TParams - The filter parameters type
 * 
 * @example
 * ```typescript
 * interface EmployeeFilters {
 *   name?: string;
 *   department?: string;
 *   isActive?: boolean;
 *   createdAt__gte?: string;
 *   createdAt__lte?: string;
 * }
 * 
 * const config: TableFilterConfig<EmployeeFilters> = {
 *   id: 'employee-table',
 *   i18nPrefix: 'employees.filters',
 *   presets: [...],
 *   quickPresets: [...],
 *   fields: [...],
 * };
 * 
 * const {
 *   filters,
 *   applyPreset,
 *   applyQuickPreset,
 *   applyCustomFilters,
 *   clearAllFilters,
 * } = useTableFilter<EmployeeFilters>(config);
 * 
 * // Use filters in API call
 * watch(filters, (newFilters) => {
 *   fetchEmployees(newFilters);
 * });
 * ```
 */
export function useTableFilter<TParams extends Record<string, any>>(
  config: TableFilterConfig<TParams>
) {
  // ============================================================================
  // Configuration
  // ============================================================================

  const {
    id,
    i18nPrefix,
    presets,
    quickPresets = [],
    fields,
    storage: storageOptions = {},
    defaults = {},
  } = config;

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Custom filter values entered by user in the dialog
   */
  const customFilters = ref<Partial<TParams>>({}) as Ref<Partial<TParams>>;

  /**
   * Temporary filter values being edited in the dialog
   * (not yet applied)
   */
  const tempFilters = ref<Partial<TParams>>({}) as Ref<Partial<TParams>>;

  /**
   * Whether the filter dialog is visible
   */
  const dialogVisible = ref(false);

  // ============================================================================
  // Composables
  // ============================================================================

  /**
   * Preset management
   */
  const presetManager = useFilterPresets<TParams>(
    presets,
    quickPresets,
    defaults.preset
  );

  /**
   * Final merged filters (for API calls)
   * Used as input to form composable for conditional field rendering
   */
  const mergedFilters = computed<Partial<TParams>>(() => {
    return mergeFilters(
      presetManager.resolvedFilters.value,
      customFilters.value
    );
  });

  /**
   * Form field management
   */
  const formManager = useFilterForm<TParams>(fields, mergedFilters);

  /**
   * Storage persistence
   */
  const storageManager = useFilterStorage<TParams>(
    id,
    customFilters,
    storageOptions
  );

  // ============================================================================
  // Preset Storage
  // ============================================================================

  /**
   * Storage key for preset selection
   */
  const presetStorageKey = `table-filter-preset:${id}`;

  /**
   * Save selected preset ID to storage
   */
  function savePresetSelection(presetId: string | null): void {
    if (!storageOptions.enabled || !storageOptions.persistPreset) {
      return;
    }

    try {
      if (presetId) {
        sessionStorage.setItem(presetStorageKey, presetId);
      } else {
        sessionStorage.removeItem(presetStorageKey);
      }
    } catch (error) {
      console.error('[useTableFilter] Failed to save preset selection:', error);
    }
  }

  /**
   * Load selected preset ID from storage
   */
  function loadPresetSelection(): string | null {
    if (!storageOptions.enabled || !storageOptions.persistPreset) {
      return null;
    }

    try {
      return sessionStorage.getItem(presetStorageKey);
    } catch (error) {
      console.error('[useTableFilter] Failed to load preset selection:', error);
      return null;
    }
  }

  /**
   * Watch preset changes and save to storage if persistPreset is enabled
   */
  if (storageOptions.enabled && storageOptions.persistPreset) {
    watch(
      () => presetManager.selectedPresetId.value,
      (newPresetId) => {
        savePresetSelection(newPresetId);
      }
    );
  }

  // ============================================================================
  // Computed - Final Filters
  // ============================================================================

  /**
   * Final cleaned filters ready for API calls
   * Merges preset filters + custom filters, then cleans empty values
   */
  const filters = computed<Partial<TParams>>(() => {
    return cleanFilters(mergedFilters.value);
  });

  /**
   * Count of active filters (after cleaning)
   */
  const activeFilterCount = computed<number>(() => {
    return countActiveFilters(filters.value);
  });

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed<boolean>(() => {
    return !isFiltersEmpty(filters.value);
  });

  /**
   * Check if only preset filters are active (no custom filters)
   */
  const hasOnlyPresetFilters = computed<boolean>(() => {
    return !isFiltersEmpty(presetManager.resolvedFilters.value) &&
           isFiltersEmpty(customFilters.value);
  });

  /**
   * Check if custom filters are active
   */
  const hasCustomFilters = computed<boolean>(() => {
    return !isFiltersEmpty(customFilters.value);
  });

  // ============================================================================
  // Computed - UI State
  // ============================================================================

  /**
   * Label for the SplitButton (current preset name or custom)
   * Returns translation key, NOT translated text
   */
  const buttonLabelKey = computed<string>(() => {
    if (presetManager.selectedPreset.value) {
      return presetManager.selectedPreset.value.labelKey;
    }
    return `${i18nPrefix}.customFilters`;
  });

  /**
   * Icon for the SplitButton
   */
  const buttonIcon = computed<string>(() => {
    if (presetManager.selectedPreset.value) {
      return presetManager.selectedPreset.value.icon;
    }
    return 'pi pi-filter';
  });

  /**
   * Severity for the SplitButton
   */
  const buttonSeverity = computed<'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast'>(() => {
    if (hasCustomFilters.value) {
      return 'warning'; // Indicate custom filters active
    }
    if (presetManager.selectedPreset.value) {
      return 'primary';
    }
    return 'secondary';
  });

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate current temp filters
   * 
   * @returns Validation result with errors
   */
  function validateTempFilters() {
    return validateFilters(tempFilters.value, fields);
  }

  /**
   * Validate current custom filters
   * 
   * @returns Validation result with errors
   */
  function validateCustomFilters() {
    return validateFilters(customFilters.value, fields);
  }

  /**
   * Check if temp filters are valid
   */
  const isTempFiltersValid = computed<boolean>(() => {
    return validateTempFilters().valid;
  });

  // ============================================================================
  // Preset Actions
  // ============================================================================

  /**
   * Apply a preset from the dropdown menu
   * Clears custom filters and selects the preset
   * 
   * @param preset - The preset to apply
   * 
   * @example
   * ```typescript
   * const activePreset = presets.find(p => p.id === 'active');
   * applyPreset(activePreset);
   * ```
   */
  function applyPreset(preset: FilterPreset<TParams> | null): void {
    // Clear custom filters when selecting a preset
    customFilters.value = {};
    
    // Select the preset
    presetManager.selectPreset(preset);
    
    // Save to storage
    storageManager.saveFilters();
  }

  /**
   * Apply a preset by ID
   * 
   * @param presetId - The preset ID to apply
   * @returns true if preset was found and applied
   */
  function applyPresetById(presetId: string): boolean {
    const preset = presetManager.getPresetById(presetId);
    if (preset) {
      applyPreset(preset);
      return true;
    }
    return false;
  }

  /**
   * Apply a quick preset (from dialog buttons)
   * Merges quick preset filters with existing custom filters
   * Optionally clears specified fields before merging
   * 
   * @param quickPreset - The quick preset to apply
   * 
   * @example
   * ```typescript
   * const todayPreset = quickPresets.find(p => p.id === 'today');
   * applyQuickPreset(todayPreset);
   * ```
   */
  function applyQuickPreset(quickPreset: QuickPreset<TParams>): void {
    const quickFilters = presetManager.resolveQuickPresetFilters(quickPreset);
    
    // If clearFields is specified, remove those fields first
    if (quickPreset.clearFields && quickPreset.clearFields.length > 0) {
      const clearedCustom = { ...customFilters.value };
      quickPreset.clearFields.forEach(key => {
        delete clearedCustom[key];
      });
      customFilters.value = mergeFilters(clearedCustom, quickFilters);
    } else {
      // Otherwise, just merge with existing custom filters
      customFilters.value = mergeFilters(customFilters.value, quickFilters);
    }
    
    // Clear preset selection (switching to custom mode)
    presetManager.clearPreset();
    
    // Save to storage
    storageManager.saveFilters();
  }

  /**
   * Apply a quick preset by ID
   * 
   * @param presetId - The quick preset ID to apply
   * @returns true if quick preset was found and applied
   */
  function applyQuickPresetById(presetId: string): boolean {
    const quickPreset = presetManager.getQuickPresetById(presetId);
    if (quickPreset) {
      applyQuickPreset(quickPreset);
      return true;
    }
    return false;
  }

  // ============================================================================
  // Custom Filter Actions
  // ============================================================================

  /**
   * Apply custom filters from the dialog
   * Validates filters before applying
   * 
   * @param filters - The custom filters to apply
   * @returns true if applied successfully, false if validation failed
   */
  function applyCustomFilters(filters: Partial<TParams>): boolean {
    // Validate filters
    const validation = validateFilters(filters, fields);
    if (!validation.valid) {
      console.warn('[useTableFilter] Validation failed:', validation.errors);
      return false;
    }
    
    // Clean and apply
    customFilters.value = cleanFilters(filters);
    
    // Clear preset selection (switching to custom mode)
    presetManager.clearPreset();
    
    // Save to storage
    storageManager.saveFilters();
    
    return true;
  }

  /**
   * Update a single filter value
   * 
   * @param key - The filter key to update
   * @param value - The new value
   */
  function updateFilter(key: keyof TParams, value: TParams[keyof TParams] | undefined): void {
    if (value === undefined || value === null || value === '') {
      // Remove the filter
      const updated = { ...customFilters.value };
      delete updated[key];
      customFilters.value = updated;
    } else {
      // Update the filter
      customFilters.value = {
        ...customFilters.value,
        [key]: value,
      };
    }
    
    // Clear preset selection (switching to custom mode)
    presetManager.clearPreset();
    
    // Save to storage if autoSave is enabled
    if (storageOptions.autoSave) {
      storageManager.saveFilters();
    }
  }

  /**
   * Clear all filters (preset + custom)
   */
  function clearAllFilters(): void {
    customFilters.value = {};
    presetManager.clearPreset();
    storageManager.clearStorage(true);
  }

  /**
   * Clear only custom filters (keep preset)
   */
  function clearCustomFilters(): void {
    customFilters.value = {};
    storageManager.saveFilters();
  }

  /**
   * Reset filters to defaults
   */
  function resetToDefaults(): void {
    customFilters.value = defaults.filters || {};
    
    if (defaults.preset) {
      presetManager.selectPresetById(defaults.preset);
    } else {
      presetManager.selectDefaultPreset();
    }
    
    storageManager.saveFilters();
  }

  // ============================================================================
  // Dialog Actions
  // ============================================================================

  /**
   * Open the filter dialog
   * Initializes temp filters with current custom filters
   */
  function openDialog(): void {
    tempFilters.value = { ...customFilters.value };
    dialogVisible.value = true;
  }

  /**
   * Close the filter dialog without applying changes
   */
  function closeDialog(): void {
    dialogVisible.value = false;
    tempFilters.value = {};
  }

  /**
   * Apply temp filters and close dialog
   * 
   * @returns true if applied successfully
   */
  function applyAndCloseDialog(): boolean {
    const success = applyCustomFilters(tempFilters.value);
    if (success) {
      closeDialog();
      return true;
    }
    return false;
  }

  /**
   * Clear temp filters in the dialog
   */
  function clearTempFilters(): void {
    tempFilters.value = {};
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize filters from defaults or storage
   */
  function initialize(): void {
    // Try to load custom filters from storage first
    const stored = storageManager.loadFilters(false);
    
    if (stored) {
      customFilters.value = stored;
    } else if (defaults.filters) {
      customFilters.value = defaults.filters;
    }
    
    // Try to load and restore preset selection from storage
    const storedPresetId = loadPresetSelection();
    
    if (storedPresetId) {
      // Restore the saved preset selection
      presetManager.selectPresetById(storedPresetId);
    } else if (defaults.preset) {
      // Fall back to default preset if no stored preset and no custom filters
      if (isFiltersEmpty(customFilters.value)) {
        presetManager.selectPresetById(defaults.preset);
      }
    }
  }

  // Auto-initialize
  initialize();

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Configuration
    id,
    i18nPrefix,
    
    // Final Filters (for API calls)
    filters,
    activeFilterCount,
    hasActiveFilters,
    hasOnlyPresetFilters,
    hasCustomFilters,
    
    // State
    customFilters,
    tempFilters,
    dialogVisible,
    
    // UI State
    buttonLabelKey,
    buttonIcon,
    buttonSeverity,
    
    // Preset Management
    selectedPreset: presetManager.selectedPreset,
    selectedPresetId: presetManager.selectedPresetId,
    presets,
    quickPresets,
    applyPreset,
    applyPresetById,
    applyQuickPreset,
    applyQuickPresetById,
    
    // Custom Filter Actions
    applyCustomFilters,
    updateFilter,
    clearAllFilters,
    clearCustomFilters,
    resetToDefaults,
    
    // Dialog Actions
    openDialog,
    closeDialog,
    applyAndCloseDialog,
    clearTempFilters,
    
    // Validation
    validateTempFilters,
    validateCustomFilters,
    isTempFiltersValid,
    
    // Form Management
    visibleFields: formManager.visibleFields,
    groupedFields: formManager.groupedFields,
    hasGroups: formManager.hasGroups,
    ungroupedFields: formManager.ungroupedFields,
    getFieldByKey: formManager.getFieldByKey,
    isFieldRequired: formManager.isFieldRequired,
    
    // Storage
    storageManager,
    
    // Utilities
    initialize,
  };
}
