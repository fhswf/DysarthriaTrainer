/**
 * Filter Field Type Definitions
 * 
 * Defines types for auto-generated form fields in the filter dialog.
 * All labels use translation keys resolved via the async localization service.
 */

/**
 * Supported filter field types
 * Each type maps to a specific PrimeVue component
 */
export type FilterFieldType =
  | 'text'           // InputText
  | 'number'         // InputNumber
  | 'date'           // DatePicker (single date)
  | 'dateRange'      // Two DatePickers (from/to) - special handling
  | 'datetime'       // DatePicker with time
  | 'datetimeRange'  // Two DatePickers with time - special handling
  | 'select'         // Select/Dropdown
  | 'multiselect'    // MultiSelect
  | 'boolean'        // Checkbox
  | 'tristate'       // TriStateCheckbox (true/false/null)
  | 'slider'         // Slider
  | 'rating'         // Rating
  | 'custom';        // Custom component via slot

/**
 * Select option for dropdown/multiselect fields
 */
export interface SelectOption {
  /**
   * Display label for the option
   * Can be a direct string or a translation key
   */
  label: string;

  /**
   * Value to store when option is selected
   */
  value: any;

  /**
   * Optional icon for the option
   */
  icon?: string;

  /**
   * Whether the option is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Field-specific options based on field type
 */
export interface FilterFieldOptions {
  // Select/multiselect options
  /**
   * Static list of options for select/multiselect
   */
  selectOptions?: SelectOption[];

  /**
   * Async function to load options dynamically
   * Useful for loading options from API
   */
  loadOptions?: () => Promise<SelectOption[]>;

  // Number/slider options
  /**
   * Minimum value
   */
  min?: number;

  /**
   * Maximum value
   */
  max?: number;

  /**
   * Step increment
   */
  step?: number;

  // Date/datetime options
  /**
   * Date format string
   * @default 'yy-mm-dd'
   */
  dateFormat?: string;

  /**
   * Whether to show time picker
   * @default false
   */
  showTime?: boolean;

  /**
   * Hour format (12 or 24 hour)
   * @default '24'
   */
  hourFormat?: '12' | '24';

  /**
   * Whether to show button bar (Today, Clear)
   * @default true
   */
  showButtonBar?: boolean;

  // Text options
  /**
   * Maximum character length
   */
  maxLength?: number;

  /**
   * Placeholder translation key
   * Used for text inputs and other fields
   */
  placeholderKey?: string;

  /**
   * Translation key for tristate options
   * Should point to an object with 'all', 'yes', 'no' keys
   * @example 'employees.filters.fields.hasUserOptions'
   */
  tristateOptionsKey?: string;

  // Custom component options
  /**
   * Custom Vue component to render
   * Used when type is 'custom'
   */
  component?: any;

  /**
   * Props to pass to custom component
   */
  componentProps?: Record<string, any>;
}

/**
 * Validation rules for field values
 */
export interface FilterFieldValidation {
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Minimum value (for numbers)
   */
  min?: number;

  /**
   * Maximum value (for numbers)
   */
  max?: number;

  /**
   * Regular expression pattern (for text)
   */
  pattern?: RegExp;

  /**
   * Custom validation function
   * 
   * @param value - The field value to validate
   * @param filters - All current filter values (for cross-field validation)
   * @returns true if valid, false if invalid, or error message string
   * 
   * @example
   * ```typescript
   * // Validate email format
   * custom: (value) => {
   *   if (!value) return true;
   *   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format';
   * }
   * ```
   */
  custom?: (value: any, filters: Record<string, any>) => boolean | string;
}

/**
 * Filter field definition for auto-generated forms
 * 
 * @template TParams - The filter parameters type (e.g., EmployeeListParams)
 * 
 * @example
 * ```typescript
 * const field: FilterFieldDefinition<EmployeeListParams> = {
 *   key: 'lastname__icontains',
 *   type: 'text',
 *   labelKey: 'employees.form.fields.lastname',
 *   placeholderKey: 'employees.form.fields.lastnamePlaceholder',
 *   group: 'name',
 *   groupLabelKey: 'employees.filters.groups.name',
 *   colSpan: 6,
 *   validation: {
 *     required: false,
 *     maxLength: 100,
 *   },
 * };
 * ```
 */
export interface FilterFieldDefinition<TParams = Record<string, any>> {
  /**
   * API parameter name that this field maps to
   * Must be a valid key from TParams
   * 
   * @example 'lastname__icontains', 'email__icontains', 'user__id__isnull'
   */
  key: keyof TParams;

  /**
   * Field type - determines which component to render
   */
  type: FilterFieldType;

  /**
   * Translation key for the field label
   * IMPORTANT: This is NOT the actual label text - it's a key that will be
   * resolved asynchronously using `await loc.t(labelKey)`
   * 
   * @example 'employees.form.fields.lastname' → "Last Name" (en) or "Nachname" (de)
   */
  labelKey: string;

  /**
   * Optional group identifier for organizing fields into fieldsets
   * Fields with the same group will be rendered together
   * 
   * @example 'name', 'contact', 'account', 'dates'
   */
  group?: string;

  /**
   * Translation key for the group label (fieldset legend)
   * Required if group is specified
   * 
   * @example 'employees.filters.groups.name' → "Name" (en) or "Name" (de)
   */
  groupLabelKey?: string;

  /**
   * Field-specific options (depends on field type)
   */
  options?: FilterFieldOptions;

  /**
   * Grid column span (1-12)
   * Used for responsive layout in PrimeVue Grid system
   * 
   * @default 12
   * @example 6 (half width), 4 (third width), 12 (full width)
   */
  colSpan?: number;

  /**
   * Optional validation rules
   */
  validation?: FilterFieldValidation;

  /**
   * Translation key for the placeholder text
   * 
   * @example 'employees.form.fields.lastnamePlaceholder' → "Enter last name..." (en)
   */
  placeholderKey?: string;

  /**
   * Translation key for help text
   * Displayed below the field as additional guidance
   * 
   * @example 'employees.filters.fields.hasUserHelp' → "Filter by user account status"
   */
  helpKey?: string;

  /**
   * Conditional rendering function
   * Field is only shown if this function returns true
   * Useful for showing/hiding fields based on other filter values
   * 
   * @param filters - Current filter values
   * @returns true to show field, false to hide
   * 
   * @example
   * ```typescript
   * // Only show "End Date" if "Start Date" is filled
   * condition: (filters) => !!filters.created_at__gte
   * ```
   */
  condition?: (filters: Partial<TParams>) => boolean;
}

/**
 * Grouped fields for rendering
 * Fields are organized by group for better UI organization
 */
export interface FilterFieldGroup<TParams = Record<string, any>> {
  /**
   * Group identifier
   */
  group: string;

  /**
   * Translation key for group label (fieldset legend)
   * IMPORTANT: Resolved asynchronously via `await loc.t(groupLabelKey)`
   */
  groupLabelKey: string;

  /**
   * Fields belonging to this group
   */
  fields: FilterFieldDefinition<TParams>[];
}
