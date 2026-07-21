/**
 * TableFilter Type Definitions
 * 
 * Centralized export of all TableFilter types.
 * Import from this file to access all type definitions.
 * 
 * @example
 * ```typescript
 * import type {
 *   TableFilterConfig,
 *   FilterPreset,
 *   QuickPreset,
 *   FilterFieldDefinition,
 *   FilterFieldType,
 * } from '@/components/TableFilter/types';
 * ```
 */

// Configuration types
export type {
  TableFilterConfig,
  FilterStorageOptions,
  FilterDefaults,
} from './filter-config.types';

export {
  DEFAULT_STORAGE_CONFIG,
} from './filter-config.types';

// Preset types
export type {
  FilterPreset,
  QuickPreset,
  FilterFunction,
  ButtonSeverity,
} from './filter-preset.types';

// Field types
export type {
  FilterFieldDefinition,
  FilterFieldType,
  FilterFieldOptions,
  FilterFieldValidation,
  FilterFieldGroup,
  SelectOption,
} from './filter-field.types';
