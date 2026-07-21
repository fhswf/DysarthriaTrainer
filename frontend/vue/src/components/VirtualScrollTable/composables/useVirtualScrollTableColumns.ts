import type { ColumnDefinition } from '../types/virtual-scroll-table.types';

/**
 * Composable for managing column configurations with localization
 * 
 * @param resourceKey - Key for localization (e.g., 'users')
 * @param localizationStore - Optional localization store (if not using default)
 */
export const useVirtualScrollTableColumns = (
  resourceKey: string,
  localizationStore?: any
) => {
  // Use provided store or assume it's available globally
  const loc = localizationStore;

  /**
   * Create column definition with auto-translation
   * 
   * @param field - Field name in data object
   * @param options - Additional column options
   */
  const createColumn = (
    field: string,
    options: Partial<ColumnDefinition> = {}
  ): ColumnDefinition => {
    const header = loc 
      ? loc.t(`${resourceKey}.columns.${field}`)
      : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');

    return {
      field,
      header,
      sortable: true,
      filterable: true,
      ...options,
    };
  };

  /**
   * Format value based on type
   * 
   * @param value - Value to format
   * @param column - Column definition with optional format function
   */
  const formatValue = (value: any, column: ColumnDefinition): string => {
    // Use custom formatter if provided
    if (column.format) {
      return column.format(value);
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Handle boolean
    if (typeof value === 'boolean') {
      const yesText = loc ? loc.t('common.yes') : 'Yes';
      const noText = loc ? loc.t('common.no') : 'No';
      return value ? yesText : noText;
    }
    
    // Handle Date
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Default: convert to string
    return String(value);
  };

  /**
   * Create multiple columns at once
   * 
   * @param fields - Array of field names or field configs
   */
  const createColumns = (
    fields: (string | { field: string; options?: Partial<ColumnDefinition> })[]
  ): ColumnDefinition[] => {
    return fields.map(fieldConfig => {
      if (typeof fieldConfig === 'string') {
        return createColumn(fieldConfig);
      }
      return createColumn(fieldConfig.field, fieldConfig.options);
    });
  };

  return {
    createColumn,
    createColumns,
    formatValue,
  };
};
