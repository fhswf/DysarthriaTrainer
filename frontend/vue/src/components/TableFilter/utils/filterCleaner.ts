/**
 * Filter Cleaner Utility
 * 
 * Utilities for cleaning, merging, and manipulating filter objects.
 * Removes undefined, null, and empty string values to ensure clean API calls.
 */

/**
 * Remove undefined, null, and empty string values from filter object
 * Preserves falsy numbers (0) and booleans (false)
 * 
 * @param filters - Filter object to clean
 * @returns Cleaned filter object
 * 
 * @example
 * ```typescript
 * cleanFilters({
 *   name: 'John',
 *   age: 0,           // Kept (falsy number)
 *   active: false,    // Kept (falsy boolean)
 *   city: '',         // Removed (empty string)
 *   country: null,    // Removed (null)
 *   email: undefined, // Removed (undefined)
 * });
 * // Returns: { name: 'John', age: 0, active: false }
 * ```
 */
export function cleanFilters<TParams>(filters: Partial<TParams>): Partial<TParams> {
  const cleaned: Partial<TParams> = {};

  Object.entries(filters).forEach(([key, value]) => {
    // Keep value if it's not undefined, null, or empty string
    // This preserves 0, false, and other falsy values that are valid
    if (value !== undefined && value !== null && value !== '') {
      (cleaned as any)[key] = value;
    }
  });

  return cleaned;
}

/**
 * Check if filters object is empty (no active filters)
 * 
 * @param filters - Filter object to check
 * @returns true if empty after cleaning
 * 
 * @example
 * ```typescript
 * isFiltersEmpty({}) // true
 * isFiltersEmpty({ name: '', email: null }) // true (cleaned)
 * isFiltersEmpty({ name: 'John' }) // false
 * isFiltersEmpty({ active: false }) // false (false is a valid value)
 * ```
 */
export function isFiltersEmpty<TParams>(filters: Partial<TParams>): boolean {
  return Object.keys(cleanFilters(filters)).length === 0;
}

/**
 * Merge multiple filter objects
 * Later objects override earlier ones
 * All objects are cleaned before merging
 * 
 * @param filterObjects - Filter objects to merge
 * @returns Merged and cleaned filter object
 * 
 * @example
 * ```typescript
 * mergeFilters(
 *   { name: 'John', age: 30, city: '' },
 *   { age: 31, email: 'john@example.com' },
 *   { name: undefined, active: true }
 * );
 * // Returns: { age: 31, email: 'john@example.com', active: true }
 * // Note: 'name' removed (set to undefined), 'city' removed (empty string)
 * ```
 */
export function mergeFilters<TParams>(
  ...filterObjects: Partial<TParams>[]
): Partial<TParams> {
  const merged: Partial<TParams> = {};

  filterObjects.forEach((filters) => {
    // Clean each object before merging
    const cleaned = cleanFilters(filters);
    Object.assign(merged, cleaned);
  });

  return merged;
}

/**
 * Remove specific keys from filters
 * Useful for clearing conflicting fields when applying quick presets
 * 
 * @param filters - Filter object
 * @param keys - Keys to remove
 * @returns Filter object without specified keys
 * 
 * @example
 * ```typescript
 * omitFilterKeys(
 *   { name: 'John', day__gte: '2025-01-01', timestamp__gte: '2025-01-01T10:00' },
 *   ['timestamp__gte', 'timestamp__lte']
 * );
 * // Returns: { name: 'John', day__gte: '2025-01-01' }
 * ```
 */
export function omitFilterKeys<TParams>(
  filters: Partial<TParams>,
  keys: (keyof TParams)[]
): Partial<TParams> {
  const result: Partial<TParams> = { ...filters };

  keys.forEach((key) => {
    delete result[key];
  });

  return result;
}

/**
 * Pick specific keys from filters
 * Only includes specified keys in result
 * 
 * @param filters - Filter object
 * @param keys - Keys to keep
 * @returns Filter object with only specified keys
 * 
 * @example
 * ```typescript
 * pickFilterKeys(
 *   { name: 'John', age: 30, email: 'john@example.com', city: 'NYC' },
 *   ['name', 'email']
 * );
 * // Returns: { name: 'John', email: 'john@example.com' }
 * ```
 */
export function pickFilterKeys<TParams>(
  filters: Partial<TParams>,
  keys: (keyof TParams)[]
): Partial<TParams> {
  const result: Partial<TParams> = {};

  keys.forEach((key) => {
    if (key in filters) {
      result[key] = filters[key];
    }
  });

  return result;
}

/**
 * Count active filters (after cleaning)
 * 
 * @param filters - Filter object
 * @returns Number of active filters
 * 
 * @example
 * ```typescript
 * countActiveFilters({ name: 'John', age: 30, city: '' }) // 2
 * countActiveFilters({ active: false }) // 1 (false is a valid value)
 * countActiveFilters({}) // 0
 * ```
 */
export function countActiveFilters<TParams>(filters: Partial<TParams>): number {
  return Object.keys(cleanFilters(filters)).length;
}

/**
 * Check if two filter objects are equal (after cleaning)
 * 
 * @param filters1 - First filter object
 * @param filters2 - Second filter object
 * @returns true if equal after cleaning
 * 
 * @example
 * ```typescript
 * areFiltersEqual(
 *   { name: 'John', age: 30 },
 *   { name: 'John', age: 30, city: '' }
 * ) // true (city is empty)
 * 
 * areFiltersEqual(
 *   { name: 'John' },
 *   { name: 'Jane' }
 * ) // false
 * ```
 */
export function areFiltersEqual<TParams>(
  filters1: Partial<TParams>,
  filters2: Partial<TParams>
): boolean {
  const clean1 = cleanFilters(filters1);
  const clean2 = cleanFilters(filters2);

  const keys1 = Object.keys(clean1).sort();
  const keys2 = Object.keys(clean2).sort();

  // Different number of keys
  if (keys1.length !== keys2.length) return false;

  // Different keys
  if (keys1.join(',') !== keys2.join(',')) return false;

  // Different values
  return keys1.every((key) => clean1[key as keyof TParams] === clean2[key as keyof TParams]);
}
