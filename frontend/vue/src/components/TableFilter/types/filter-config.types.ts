/**
 * Filter Configuration Type Definitions
 * 
 * Main configuration interface for the TableFilter component.
 * Integrates with the async Pinia localization service.
 */

import type { FilterPreset, QuickPreset } from './filter-preset.types';
import type { FilterFieldDefinition } from './filter-field.types';

/**
 * Storage configuration options
 */
export interface FilterStorageOptions {
  /**
   * Whether to enable session storage persistence
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom storage key
   * @default `table-filter-${config.id}`
   */
  storageKey?: string;

  /**
   * Whether to persist the selected preset ID
   * @default true
   */
  persistPreset?: boolean;

  /**
   * Whether to persist custom filter values
   * @default true
   */
  persistCustom?: boolean;

  /**
   * Whether to automatically save filters on change
   * @default false
   */
  autoSave?: boolean;
}

/**
 * Default filter values
 */
export interface FilterDefaults<TParams> {
  /**
   * Default preset ID to select on initialization
   * If not specified, first preset is used
   */
  preset?: string;

  /**
   * Default filter values to apply
   * Applied in addition to preset filters
   */
  filters?: Partial<TParams>;
}

/**
 * Main configuration for TableFilter component
 * 
 * @template TParams - The filter parameters type (e.g., EmployeeListParams)
 * 
 * @example
 * ```typescript
 * const config: TableFilterConfig<EmployeeListParams> = {
 *   id: 'employee-table',
 *   i18nPrefix: 'employees.filters',
 *   presets: [
 *     {
 *       id: 'all',
 *       labelKey: 'employees.filters.presets.all',
 *       icon: 'pi pi-list',
 *       filters: {},
 *     },
 *   ],
 *   fields: [
 *     {
 *       key: 'lastname__icontains',
 *       type: 'text',
 *       labelKey: 'employees.form.fields.lastname',
 *       group: 'name',
 *       groupLabelKey: 'employees.filters.groups.name',
 *     },
 *   ],
 *   storage: {
 *     enabled: true,
 *     storageKey: 'employee-table-filter',
 *   },
 *   defaults: {
 *     preset: 'all',
 *   },
 * };
 * ```
 */
export interface TableFilterConfig<TParams = Record<string, any>> {
  /**
   * Unique identifier for this filter instance
   * Used for namespacing storage keys and distinguishing multiple filters
   * 
   * @example 'employee-table', 'polypoint-log-table'
   */
  id: string;

  /**
   * Base translation key prefix for this filter
   * All translation keys will be prefixed with this value
   * 
   * @example 'employees.filters', 'polypointLog.filters'
   * 
   * Usage:
   * - Dialog title: `${i18nPrefix}.title`
   * - Apply button: `${i18nPrefix}.apply`
   * - Presets: `${i18nPrefix}.presets.{presetId}`
   * - Fields: Custom per field via labelKey
   */
  i18nPrefix: string;

  /**
   * Predefined filter presets for dropdown menu
   * At least one preset is required
   * 
   * @minLength 1
   */
  presets: FilterPreset<TParams>[];

  /**
   * Optional quick presets shown as buttons in dialog
   * Used for common filter shortcuts (e.g., date ranges)
   */
  quickPresets?: QuickPreset<TParams>[];

  /**
   * Field definitions for advanced filter dialog
   * Defines all filterable fields and how they're rendered
   */
  fields: FilterFieldDefinition<TParams>[];

  /**
   * Optional storage configuration
   * Controls how filter state is persisted across sessions
   */
  storage?: FilterStorageOptions;

  /**
   * Optional default values
   * Applied on initialization
   */
  defaults?: FilterDefaults<TParams>;
}

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG: Required<FilterStorageOptions> = {
  enabled: true,
  storageKey: '',
  persistPreset: true,
  persistCustom: true,
  autoSave: false,
};
