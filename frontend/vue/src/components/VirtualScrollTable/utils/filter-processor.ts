/**
 * Filter Processing Utility for Virtual Scroll Table
 * 
 * Handles conversion of filter definitions to Django REST Framework API parameters.
 * Supports simple key-value filters and advanced field-operator-value filters.
 * 
 * @module filter-processor
 */

import type {
  AdvancedFilter,
  CombinedFilters,
  SimpleFilters,
  FilterValue
} from '../types/virtual-scroll-table.types';

/**
 * Check if filters are in combined format (has 'simple' or 'advanced' keys)
 * 
 * @param filters - Filter object to check
 * @returns True if filters are in combined format
 * 
 * @example
 * isCombinedFilters({ simple: {...}, advanced: [...] }) → true
 * isCombinedFilters({ search: 'john' }) → false
 */
export const isCombinedFilters = (filters: any): filters is CombinedFilters => {
  return filters && (filters.simple !== undefined || filters.advanced !== undefined);
};

/**
 * Build Django REST Framework filter parameter name
 * 
 * Converts field name and operator into DRF lookup syntax.
 * The 'exact' operator is treated as default and doesn't add a suffix.
 * 
 * @param field - Field name (e.g., 'username', 'created_at')
 * @param operator - Filter operator (e.g., 'icontains', 'gte', 'in')
 * @returns DRF parameter name (e.g., 'username__icontains', 'created_at__gte')
 * 
 * @example
 * buildFilterParam('username', 'icontains') → 'username__icontains'
 * buildFilterParam('created_at', 'gte') → 'created_at__gte'
 * buildFilterParam('status', 'exact') → 'status'
 * buildFilterParam('status') → 'status'
 */
export const buildFilterParam = (field: string, operator?: string): string => {
  if (!operator || operator === 'exact') {
    return field;  // Default operator doesn't need suffix
  }
  return `${field}__${operator}`;
};

/**
 * Format filter value for API transmission
 * 
 * Converts JavaScript values to string representations suitable for URL parameters.
 * Arrays are converted to comma-separated strings for 'in' and 'range' operators.
 * 
 * @param value - Filter value (string, number, boolean, null, or array)
 * @returns Formatted value for API (arrays are comma-separated)
 * 
 * @example
 * formatFilterValue('john') → 'john'
 * formatFilterValue(123) → '123'
 * formatFilterValue(true) → 'true'
 * formatFilterValue(null) → 'null'
 * formatFilterValue(['admin', 'staff']) → 'admin,staff'
 * formatFilterValue([1, 2, 3]) → '1,2,3'
 */
export const formatFilterValue = (value: FilterValue): string => {
  if (Array.isArray(value)) {
    // For 'in' and 'range' operators: convert array to comma-separated string
    return value.map(v => String(v)).join(',');
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

/**
 * Process advanced filters into API parameters
 * 
 * Converts array of advanced filter definitions into DRF API parameters.
 * Skips disabled filters and empty values (except for 'isnull' operator).
 * 
 * @param advancedFilters - Array of advanced filter definitions
 * @param params - Existing params object to add filters to (modified in place)
 * 
 * @example
 * Input:
 * [
 *   { field: 'username', value: 'john', operator: 'icontains' },
 *   { field: 'status', value: ['active', 'pending'], operator: 'in' },
 *   { field: 'created_at', value: '2024-01-01', operator: 'gte' },
 *   { field: 'archived', value: false, operator: 'isnull' }
 * ]
 * 
 * Output (added to params):
 * {
 *   username__icontains: 'john',
 *   status__in: 'active,pending',
 *   created_at__gte: '2024-01-01',
 *   archived__isnull: 'false'
 * }
 */
export const processAdvancedFilters = (
  advancedFilters: AdvancedFilter[], 
  params: Record<string, any>
): void => {
  advancedFilters.forEach(filter => {
    // Skip disabled filters
    if (filter.enabled === false) {
      console.log(`⏭️  Skipping disabled filter: ${filter.field}`);
      return;
    }

    // Skip empty/null/undefined values (except for 'isnull' operator)
    if (filter.operator !== 'isnull' && 
        (filter.value === null || filter.value === undefined || filter.value === '')) {
      console.log(`⏭️  Skipping empty filter: ${filter.field}`);
      return;
    }

    // Build parameter name with operator
    const paramName = buildFilterParam(filter.field, filter.operator);
    
    // Format value
    const paramValue = formatFilterValue(filter.value);
    
    // Add to params
    params[paramName] = paramValue;

    console.log(`🔍 Advanced filter: ${paramName}=${paramValue}`);
  });
};

/**
 * Process simple filters into API parameters
 * 
 * Converts simple key-value filter object into API parameters.
 * Skips null, undefined, and empty string values.
 * 
 * @param simpleFilters - Simple key-value filter object
 * @param params - Existing params object to add filters to (modified in place)
 * 
 * @example
 * Input: { search: 'john', is_active: true, role: 'admin', empty: '' }
 * Output (added to params): { search: 'john', is_active: true, role: 'admin' }
 */
export const processSimpleFilters = (
  simpleFilters: SimpleFilters, 
  params: Record<string, any>
): void => {
  console.log('  📋 Input simple filters:', simpleFilters);
  Object.entries(simpleFilters).forEach(([key, value]) => {
    console.log(`    🔎 Checking filter: ${key}=${value} (type: ${typeof value}, is ${value === null ? 'null' : value === undefined ? 'undefined' : value === '' ? 'empty string' : 'valid'})`);
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value;
      console.log(`    ✅ Added filter: ${key}=${value}`);
    } else {
      console.log(`    ❌ Skipped filter: ${key} (value: ${value})`);
    }
  });
};

/**
 * Build complete API query parameters with filters
 * 
 * Combines pagination, sorting, and filters into a single parameter object.
 * Supports three filter formats:
 * 1. Simple filters (backward compatible): { search: 'john', is_active: true }
 * 2. Advanced filters only: { advanced: [{ field: 'username', value: 'john', operator: 'icontains' }] }
 * 3. Combined: { simple: {...}, advanced: [...] }
 * 
 * @param offset - Pagination offset
 * @param limit - Pagination limit
 * @param sortField - Optional sort field name
 * @param sortOrder - Optional sort order (1 = ascending, -1 = descending)
 * @param filters - Filter definitions in any supported format
 * @returns Complete API parameters object
 * 
 * @example
 * buildParams(0, 50, 'username', 1, { search: 'john' })
 * → { offset: 0, limit: 50, ordering: 'username', search: 'john' }
 * 
 * buildParams(100, 50, 'created_at', -1, {
 *   advanced: [{ field: 'status', value: 'active', operator: 'exact' }]
 * })
 * → { offset: 100, limit: 50, ordering: '-created_at', status: 'active' }
 */
export const buildParams = (
  offset: number,
  limit: number,
  sortField?: string,
  sortOrder?: 1 | -1,
  filters?: SimpleFilters | CombinedFilters
): Record<string, any> => {
  const params: Record<string, any> = {
    offset,
    limit,
  };

  // Add sorting
  if (sortField && sortOrder) {
    const direction = sortOrder === -1 ? '-' : '';
    params.ordering = `${direction}${sortField}`;
  }

  // Process filters based on format
  if (filters) {
    if (isCombinedFilters(filters)) {
      // Combined format: { simple: {...}, advanced: [...] }
      console.log('🔍 Using combined filters format');
      
      if (filters.simple) {
        console.log('  📝 Processing simple filters:', filters.simple);
        processSimpleFilters(filters.simple, params);
      }
      
      if (filters.advanced && filters.advanced.length > 0) {
        console.log('  🎯 Processing advanced filters:', filters.advanced.length, 'filter(s)');
        processAdvancedFilters(filters.advanced, params);
      }
    } else {
      // Simple format (backward compatible): { search: 'john', is_active: true }
      console.log('🔍 Using simple filters format (backward compatible)');
      processSimpleFilters(filters as SimpleFilters, params);
    }
  }

  console.log('📦 Final API params:', params);
  return params;
};
