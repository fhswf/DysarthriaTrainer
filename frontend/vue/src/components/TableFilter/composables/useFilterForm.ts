import { computed, type ComputedRef } from 'vue';
import type { FilterFieldDefinition, FilterFieldGroup } from '../types';

/**
 * Composable for managing filter form structure
 * 
 * Handles field grouping, conditional field filtering, and form layout logic.
 * Does NOT manage form state (that's handled by useTableFilter).
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
 * const currentFilters = ref<Partial<EmployeeFilters>>({});
 * 
 * const {
 *   visibleFields,
 *   groupedFields,
 *   hasGroups
 * } = useFilterForm<EmployeeFilters>(fields, currentFilters);
 * ```
 */
export function useFilterForm<TParams extends Record<string, any>>(
  fields: FilterFieldDefinition<TParams>[],
  currentFilters: ComputedRef<Partial<TParams>> | { value: Partial<TParams> }
) {
  // ============================================================================
  // Computed - Field Visibility
  // ============================================================================

  /**
   * Filter fields based on conditional rendering
   * Only includes fields where condition() returns true (or no condition exists)
   */
  const visibleFields = computed<FilterFieldDefinition<TParams>[]>(() => {
    return fields.filter(field => {
      // If no condition, always visible
      if (!field.condition) {
        return true;
      }

      // Evaluate condition with current filters
      return field.condition(currentFilters.value);
    });
  });

  /**
   * Get visible fields that belong to a specific group
   * 
   * @param groupName - The group name to filter by
   * @returns Fields in the specified group
   */
  const getFieldsByGroup = computed(() => {
    return (groupName: string): FilterFieldDefinition<TParams>[] => {
      return visibleFields.value.filter(field => field.group === groupName);
    };
  });

  /**
   * Get visible fields that don't belong to any group (ungrouped)
   */
  const ungroupedFields = computed<FilterFieldDefinition<TParams>[]>(() => {
    return visibleFields.value.filter(field => !field.group);
  });

  // ============================================================================
  // Computed - Field Grouping
  // ============================================================================

  /**
   * Group visible fields by their group property
   * Returns an array of FilterFieldGroup objects for rendering
   * 
   * Groups are ordered by first appearance in the fields array
   */
  const groupedFields = computed<FilterFieldGroup<TParams>[]>(() => {
    const groups = new Map<string, FilterFieldDefinition<TParams>[]>();
    const groupOrder: string[] = [];

    // Collect fields into groups (preserving order)
    visibleFields.value.forEach(field => {
      if (field.group) {
        if (!groups.has(field.group)) {
          groups.set(field.group, []);
          groupOrder.push(field.group);
        }
        groups.get(field.group)!.push(field);
      }
    });

    // Convert to FilterFieldGroup array
    return groupOrder.map(groupName => {
      const groupFields = groups.get(groupName)!;
      const firstField = groupFields[0];

      return {
        group: groupName,
        groupLabelKey: firstField.groupLabelKey || groupName,
        fields: groupFields,
      };
    });
  });

  /**
   * Check if any fields are grouped
   */
  const hasGroups = computed<boolean>(() => {
    return groupedFields.value.length > 0;
  });

  /**
   * Check if there are any ungrouped fields
   */
  const hasUngroupedFields = computed<boolean>(() => {
    return ungroupedFields.value.length > 0;
  });

  /**
   * Get unique group names (in order of appearance)
   */
  const groupNames = computed<string[]>(() => {
    return groupedFields.value.map(group => group.group);
  });

  // ============================================================================
  // Computed - Field Layout
  // ============================================================================

  /**
   * Calculate total columns needed for grid layout
   * Respects colSpan property on fields
   * 
   * @returns Maximum column span (default: 12 for standard grid)
   */
  const totalColumns = computed<number>(() => {
    return 12; // Standard 12-column grid
  });

  /**
   * Get column span for a field (default: 6 = half width)
   * 
   * @param field - The field to get column span for
   * @returns Column span value
   */
  function getFieldColSpan(field: FilterFieldDefinition<TParams>): number {
    return field.colSpan || 6;
  }

  /**
   * Check if a field should take full width
   * 
   * @param field - The field to check
   * @returns true if field spans full width
   */
  function isFullWidth(field: FilterFieldDefinition<TParams>): boolean {
    return getFieldColSpan(field) >= totalColumns.value;
  }

  // ============================================================================
  // Field Lookup Helpers
  // ============================================================================

  /**
   * Find a field definition by key
   * 
   * @param key - The field key to find
   * @returns The field definition or undefined
   * 
   * @example
   * ```typescript
   * const nameField = getFieldByKey('name');
   * if (nameField) {
   *   console.log(nameField.type); // 'text'
   * }
   * ```
   */
  function getFieldByKey(key: keyof TParams): FilterFieldDefinition<TParams> | undefined {
    return fields.find(field => field.key === key);
  }

  /**
   * Check if a field key exists in the field definitions
   * 
   * @param key - The field key to check
   * @returns true if field exists
   */
  function hasField(key: keyof TParams): boolean {
    return fields.some(field => field.key === key);
  }

  /**
   * Get all field keys (useful for validation)
   * 
   * @returns Array of field keys
   */
  function getFieldKeys(): (keyof TParams)[] {
    return fields.map(field => field.key);
  }

  /**
   * Get only visible field keys (respects conditions)
   * 
   * @returns Array of visible field keys
   */
  function getVisibleFieldKeys(): (keyof TParams)[] {
    return visibleFields.value.map(field => field.key);
  }

  // ============================================================================
  // Field Property Helpers
  // ============================================================================

  /**
   * Check if a field is required
   * 
   * @param key - The field key to check
   * @returns true if field has required validation
   */
  function isFieldRequired(key: keyof TParams): boolean {
    const field = getFieldByKey(key);
    return field?.validation?.required || false;
  }

  /**
   * Get field label translation key
   * 
   * @param key - The field key
   * @returns The label translation key or empty string
   */
  function getFieldLabelKey(key: keyof TParams): string {
    const field = getFieldByKey(key);
    return field?.labelKey || '';
  }

  /**
   * Get field placeholder translation key (if defined)
   * 
   * @param key - The field key
   * @returns The placeholder translation key or undefined
   */
  function getFieldPlaceholderKey(key: keyof TParams): string | undefined {
    const field = getFieldByKey(key);
    return field?.options?.placeholderKey;
  }

  // ============================================================================
  // Conditional Rendering Helpers
  // ============================================================================

  /**
   * Check if a specific field is currently visible
   * (based on its condition function)
   * 
   * @param key - The field key to check
   * @returns true if field is visible
   */
  function isFieldVisible(key: keyof TParams): boolean {
    return visibleFields.value.some(field => field.key === key);
  }

  /**
   * Count total visible fields
   * 
   * @returns Number of visible fields
   */
  const visibleFieldCount = computed<number>(() => {
    return visibleFields.value.length;
  });

  /**
   * Check if all fields are visible
   * 
   * @returns true if no fields are hidden by conditions
   */
  const allFieldsVisible = computed<boolean>(() => {
    return visibleFields.value.length === fields.length;
  });

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Visible Fields
    visibleFields,
    visibleFieldCount,
    allFieldsVisible,
    getFieldsByGroup,
    ungroupedFields,
    
    // Grouped Fields
    groupedFields,
    hasGroups,
    hasUngroupedFields,
    groupNames,
    
    // Layout
    totalColumns,
    getFieldColSpan,
    isFullWidth,
    
    // Field Lookup
    getFieldByKey,
    hasField,
    getFieldKeys,
    getVisibleFieldKeys,
    
    // Field Properties
    isFieldRequired,
    getFieldLabelKey,
    getFieldPlaceholderKey,
    
    // Conditional Rendering
    isFieldVisible,
  };
}
