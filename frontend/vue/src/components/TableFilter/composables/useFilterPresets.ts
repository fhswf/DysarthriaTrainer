import { ref, computed, type Ref } from 'vue';
import type { FilterPreset, QuickPreset } from '../types';

/**
 * Composable for managing filter presets
 * 
 * Handles preset selection, filter resolution, and quick preset management.
 * Supports both static filter objects and dynamic filter functions.
 * 
 * @template TParams - The filter parameters type
 * 
 * @example
 * ```typescript
 * interface EmployeeFilters {
 *   name?: string;
 *   department?: string;
 *   isActive?: boolean;
 * }
 * 
 * const { 
 *   selectedPreset, 
 *   resolvedFilters, 
 *   selectPreset,
 *   getPresetById 
 * } = useFilterPresets<EmployeeFilters>(
 *   presets,
 *   quickPresets,
 *   'all' // default preset ID
 * );
 * ```
 */
export function useFilterPresets<TParams extends Record<string, any>>(
  presets: FilterPreset<TParams>[],
  quickPresets: QuickPreset<TParams>[] = [],
  defaultPresetId?: string
) {
  // ============================================================================
  // State
  // ============================================================================

  /**
   * Currently selected preset (from dropdown menu)
   */
  const selectedPreset = ref<FilterPreset<TParams> | null>(null) as Ref<FilterPreset<TParams> | null>;

  // ============================================================================
  // Computed
  // ============================================================================

  /**
   * Resolved filters from the currently selected preset
   * Handles both static filter objects and dynamic filter functions
   */
  const resolvedFilters = computed<Partial<TParams>>(() => {
    if (!selectedPreset.value) {
      return {};
    }

    const { filters } = selectedPreset.value;

    // If filters is a function, call it to get the actual filters
    if (typeof filters === 'function') {
      return filters();
    }

    // Otherwise, return the static filters object
    return filters;
  });

  /**
   * ID of the currently selected preset (for easy comparison)
   */
  const selectedPresetId = computed<string | null>(() => {
    return selectedPreset.value?.id || null;
  });

  /**
   * Check if a specific preset is currently selected
   */
  const isPresetSelected = computed(() => {
    return (presetId: string): boolean => {
      return selectedPresetId.value === presetId;
    };
  });

  /**
   * Check if any preset is currently selected
   */
  const hasPresetSelected = computed<boolean>(() => {
    return selectedPreset.value !== null;
  });

  // ============================================================================
  // Preset Lookup
  // ============================================================================

  /**
   * Find a preset by ID from the dropdown presets
   * 
   * @param presetId - The preset ID to find
   * @returns The preset or null if not found
   * 
   * @example
   * ```typescript
   * const allPreset = getPresetById('all');
   * if (allPreset) {
   *   selectPreset(allPreset);
   * }
   * ```
   */
  function getPresetById(presetId: string): FilterPreset<TParams> | null {
    return presets.find(preset => preset.id === presetId) || null;
  }

  /**
   * Find a quick preset by ID
   * 
   * @param presetId - The quick preset ID to find
   * @returns The quick preset or null if not found
   * 
   * @example
   * ```typescript
   * const todayPreset = getQuickPresetById('today');
   * if (todayPreset) {
   *   const filters = resolveQuickPresetFilters(todayPreset);
   * }
   * ```
   */
  function getQuickPresetById(presetId: string): QuickPreset<TParams> | null {
    return quickPresets.find(preset => preset.id === presetId) || null;
  }

  /**
   * Get the default preset (first preset or specified default)
   * 
   * @returns The default preset or null if no presets available
   */
  function getDefaultPreset(): FilterPreset<TParams> | null {
    if (defaultPresetId) {
      const preset = getPresetById(defaultPresetId);
      if (preset) {
        return preset;
      }
    }

    // Fall back to first preset
    return presets.length > 0 ? presets[0] : null;
  }

  // ============================================================================
  // Filter Resolution
  // ============================================================================

  /**
   * Resolve filters from a preset (handles both static and function-based)
   * 
   * @param preset - The preset to resolve filters from
   * @returns The resolved filter object
   * 
   * @example
   * ```typescript
   * const preset = getPresetById('active');
   * const filters = resolvePresetFilters(preset);
   * // { isActive: true }
   * ```
   */
  function resolvePresetFilters(preset: FilterPreset<TParams> | null): Partial<TParams> {
    if (!preset) {
      return {};
    }

    const { filters } = preset;

    // If filters is a function, call it to get the actual filters
    if (typeof filters === 'function') {
      return filters();
    }

    // Otherwise, return the static filters object
    return filters;
  }

  /**
   * Resolve filters from a quick preset (handles both static and function-based)
   * 
   * @param quickPreset - The quick preset to resolve filters from
   * @returns The resolved filter object
   * 
   * @example
   * ```typescript
   * const quickPreset = getQuickPresetById('today');
   * const filters = resolveQuickPresetFilters(quickPreset);
   * // { createdAt__gte: '2024-01-15T00:00:00', createdAt__lte: '2024-01-15T23:59:59' }
   * ```
   */
  function resolveQuickPresetFilters(quickPreset: QuickPreset<TParams> | null): Partial<TParams> {
    if (!quickPreset) {
      return {};
    }

    const { filters } = quickPreset;

    // If filters is a function, call it to get the actual filters
    if (typeof filters === 'function') {
      return filters();
    }

    // Otherwise, return the static filters object
    return filters;
  }

  // ============================================================================
  // Preset Selection
  // ============================================================================

  /**
   * Select a preset from the dropdown menu
   * 
   * @param preset - The preset to select (or null to clear)
   * 
   * @example
   * ```typescript
   * const activePreset = getPresetById('active');
   * selectPreset(activePreset);
   * ```
   */
  function selectPreset(preset: FilterPreset<TParams> | null): void {
    selectedPreset.value = preset;
  }

  /**
   * Select a preset by ID
   * 
   * @param presetId - The preset ID to select
   * @returns true if preset was found and selected, false otherwise
   * 
   * @example
   * ```typescript
   * if (selectPresetById('active')) {
   *   console.log('Active preset selected');
   * }
   * ```
   */
  function selectPresetById(presetId: string): boolean {
    const preset = getPresetById(presetId);
    if (preset) {
      selectPreset(preset);
      return true;
    }
    return false;
  }

  /**
   * Select the default preset
   * 
   * @returns true if default preset was selected, false if no default available
   */
  function selectDefaultPreset(): boolean {
    const preset = getDefaultPreset();
    if (preset) {
      selectPreset(preset);
      return true;
    }
    return false;
  }

  /**
   * Clear the selected preset
   */
  function clearPreset(): void {
    selectedPreset.value = null;
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  /**
   * Check if a preset ID exists in the dropdown presets
   * 
   * @param presetId - The preset ID to check
   * @returns true if preset exists
   */
  function hasPreset(presetId: string): boolean {
    return presets.some(preset => preset.id === presetId);
  }

  /**
   * Check if a quick preset ID exists
   * 
   * @param presetId - The quick preset ID to check
   * @returns true if quick preset exists
   */
  function hasQuickPreset(presetId: string): boolean {
    return quickPresets.some(preset => preset.id === presetId);
  }

  /**
   * Get all available preset IDs
   * 
   * @returns Array of preset IDs
   */
  function getPresetIds(): string[] {
    return presets.map(preset => preset.id);
  }

  /**
   * Get all available quick preset IDs
   * 
   * @returns Array of quick preset IDs
   */
  function getQuickPresetIds(): string[] {
    return quickPresets.map(preset => preset.id);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  // Auto-select default preset if specified
  if (defaultPresetId) {
    selectDefaultPreset();
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    selectedPreset,
    
    // Computed
    resolvedFilters,
    selectedPresetId,
    isPresetSelected,
    hasPresetSelected,
    
    // Preset Lookup
    getPresetById,
    getQuickPresetById,
    getDefaultPreset,
    
    // Filter Resolution
    resolvePresetFilters,
    resolveQuickPresetFilters,
    
    // Preset Selection
    selectPreset,
    selectPresetById,
    selectDefaultPreset,
    clearPreset,
    
    // Validation Helpers
    hasPreset,
    hasQuickPreset,
    getPresetIds,
    getQuickPresetIds,
  };
}
