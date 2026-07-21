/**
 * Field Renderer Utility
 * 
 * Maps filter field types to PrimeVue component names and provides
 * helper functions for special field handling (e.g., date ranges).
 */

import type { FilterFieldType } from '../types';

/**
 * Map field type to PrimeVue component name
 * 
 * @param type - The filter field type
 * @returns PrimeVue component name
 * 
 * @example
 * ```typescript
 * getComponentForFieldType('text') // 'InputText'
 * getComponentForFieldType('dateRange') // 'DatePicker' (special handling required)
 * getComponentForFieldType('select') // 'Select'
 * ```
 */
export function getComponentForFieldType(type: FilterFieldType): string {
  const componentMap: Record<FilterFieldType, string> = {
    text: 'InputText',
    number: 'InputNumber',
    date: 'DatePicker',
    dateRange: 'DatePicker', // Requires special handling (two components)
    datetime: 'DatePicker',
    datetimeRange: 'DatePicker', // Requires special handling (two components)
    select: 'Select',
    multiselect: 'MultiSelect',
    boolean: 'Checkbox',
    tristate: 'TriStateCheckbox',
    slider: 'Slider',
    rating: 'Rating',
    custom: 'custom', // Uses slot
  };

  return componentMap[type] || 'InputText';
}

/**
 * Check if field type requires special range handling
 * Range fields need two input components (from/to)
 * 
 * @param type - The filter field type
 * @returns true if field is a range type
 * 
 * @example
 * ```typescript
 * isRangeField('dateRange') // true
 * isRangeField('datetimeRange') // true
 * isRangeField('date') // false
 * ```
 */
export function isRangeField(type: FilterFieldType): boolean {
  return type === 'dateRange' || type === 'datetimeRange';
}

/**
 * Get field keys for range fields (from/to)
 * Assumes Django filter convention: field__gte (from), field__lte (to)
 * 
 * @param key - The base field key
 * @param type - The filter field type
 * @returns Object with 'from' and 'to' keys
 * 
 * @example
 * ```typescript
 * // For date range field
 * getRangeFieldKeys('created_at', 'dateRange')
 * // Returns: { from: 'created_at__gte', to: 'created_at__lte' }
 * 
 * // For datetime range field
 * getRangeFieldKeys('timestamp', 'datetimeRange')
 * // Returns: { from: 'timestamp__gte', to: 'timestamp__lte' }
 * 
 * // For non-range field
 * getRangeFieldKeys('lastname__icontains', 'text')
 * // Returns: { from: 'lastname__icontains', to: 'lastname__icontains' }
 * ```
 */
export function getRangeFieldKeys(
  key: string,
  type: FilterFieldType
): { from: string; to: string } {
  if (type === 'dateRange' || type === 'datetimeRange') {
    // Remove __gte or __lte suffix if present
    const baseKey = key.replace('__gte', '').replace('__lte', '');

    return {
      from: `${baseKey}__gte`,
      to: `${baseKey}__lte`,
    };
  }

  // Non-range fields use same key for both
  return { from: key, to: key };
}

/**
 * Check if field type supports time selection
 * 
 * @param type - The filter field type
 * @returns true if field supports time
 * 
 * @example
 * ```typescript
 * supportsTime('datetime') // true
 * supportsTime('datetimeRange') // true
 * supportsTime('date') // false
 * ```
 */
export function supportsTime(type: FilterFieldType): boolean {
  return type === 'datetime' || type === 'datetimeRange';
}

/**
 * Get default date format for field type
 * 
 * @param type - The filter field type
 * @returns Default date format string
 * 
 * @example
 * ```typescript
 * getDefaultDateFormat('date') // 'yy-mm-dd'
 * getDefaultDateFormat('datetime') // 'yy-mm-dd'
 * ```
 */
export function getDefaultDateFormat(type: FilterFieldType): string {
  return 'yy-mm-dd'; // PrimeVue default format
}
