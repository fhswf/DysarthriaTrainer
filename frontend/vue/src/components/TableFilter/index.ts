/**
 * TableFilter - Complete Export
 * 
 * Main export file for the TableFilter component system.
 * Import everything you need from this single entry point.
 * 
 * @example
 * ```typescript
 * import { TableFilter, useTableFilter, type TableFilterConfig } from '@/components/TableFilter';
 * ```
 */

// Main Component
export { default as TableFilter } from './components/TableFilter.vue';

// Sub-components (for advanced usage)
export { FilterDialog, FilterSplitButton, FilterField } from './components';

// Composables
export {
  useTableFilter,
  useFilterPresets,
  useFilterForm,
  useFilterStorage,
} from './composables';

// Types
export type {
  // Configuration
  TableFilterConfig,
  FilterStorageOptions,
  FilterDefaults,
  
  // Presets
  FilterPreset,
  QuickPreset,
  FilterFunction,
  ButtonSeverity,
  
  // Fields
  FilterFieldDefinition,
  FilterFieldType,
  FilterFieldOptions,
  FilterFieldValidation,
  FilterFieldGroup,
  SelectOption,
} from './types';

// Utilities
export {
  // Field Renderer
  getComponentForFieldType,
  isRangeField,
  getRangeFieldKeys,
  supportsTime,
  getDefaultDateFormat,
  
  // Validator
  validateFilters,
  validateDateRange,
  validateNumberRange,
  validateEmail,
  
  // Cleaner
  cleanFilters,
  isFiltersEmpty,
  mergeFilters,
  omitFilterKeys,
  pickFilterKeys,
  countActiveFilters,
  areFiltersEqual,
} from './utils';
