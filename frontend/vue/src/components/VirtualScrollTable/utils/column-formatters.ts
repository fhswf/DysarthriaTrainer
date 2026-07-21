import type { ColumnDefinition } from '../types/virtual-scroll-table.types';

/**
 * Format column value based on column definition
 * @param value - The raw value to format
 * @param column - The column definition containing format options
 * @returns Formatted string representation of the value
 */
export function formatColumnValue(value: any, column: ColumnDefinition): string {
  // Use custom format function if provided
  if (column.format) {
    return column.format(value);
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return '-';
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  // Default: convert to string
  return String(value);
}
