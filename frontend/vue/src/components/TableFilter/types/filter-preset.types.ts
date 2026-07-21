/**
 * Filter Preset Type Definitions
 * 
 * Defines types for filter presets (dropdown menu items) and quick presets (dialog buttons).
 * All labels use translation keys that are resolved at runtime via the async localization service.
 */

/**
 * Button severity levels for PrimeVue components
 */
export type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

/**
 * Function that returns filter values dynamically
 * Used for presets that calculate values at runtime (e.g., "today" preset calculates current date)
 * 
 * @template TParams - The filter parameters type (e.g., EmployeeListParams)
 * @returns Partial filter values
 * 
 * @example
 * ```typescript
 * // Dynamic date preset
 * const todayFilter: FilterFunction<PolypointLogListParams> = () => ({
 *   day__gte: dayjs().format('YYYY-MM-DD'),
 *   day__lte: dayjs().format('YYYY-MM-DD'),
 * });
 * ```
 */
export type FilterFunction<TParams> = () => Partial<TParams>;

/**
 * Filter preset for dropdown menu
 * Represents a predefined filter configuration accessible from the SplitButton dropdown.
 * 
 * @template TParams - The filter parameters type (e.g., EmployeeListParams)
 * 
 * @example
 * ```typescript
 * const preset: FilterPreset<EmployeeListParams> = {
 *   id: 'with-user',
 *   labelKey: 'employees.filters.presets.withUser',
 *   icon: 'pi pi-user',
 *   filters: { user__id__isnull: false },
 *   descriptionKey: 'employees.filters.presets.withUserDesc',
 * };
 * ```
 */
export interface FilterPreset<TParams = Record<string, any>> {
  /**
   * Unique identifier for the preset
   */
  id: string;

  /**
   * Translation key for the preset label
   * IMPORTANT: This is NOT the actual label text - it's a key that will be
   * resolved asynchronously using `await loc.t(labelKey)`
   * 
   * @example 'employees.filters.presets.all' → "Show All" (en) or "Alle anzeigen" (de)
   */
  labelKey: string;

  /**
   * PrimeIcons icon class
   * @example 'pi pi-list', 'pi pi-user', 'pi pi-calendar'
   */
  icon: string;

  /**
   * Filter parameters to apply when preset is selected
   * Can be static object or function that returns filters dynamically
   */
  filters: Partial<TParams> | FilterFunction<TParams>;

  /**
   * Translation key for optional tooltip/description
   * Used to provide additional context about what the preset does
   */
  descriptionKey?: string;

  /**
   * Whether this is a user-created custom preset
   * Reserved for future feature: database-stored custom filters
   * @default false
   */
  isCustom?: boolean;

  /**
   * User ID who created this custom preset
   * Reserved for future feature: database-stored custom filters
   */
  createdBy?: number;
}

/**
 * Quick preset for dialog buttons
 * Represents a quick-access filter that appears as a button in the filter dialog.
 * Quick presets can partially update filters (e.g., set date range while keeping other filters).
 * 
 * @template TParams - The filter parameters type (e.g., PolypointLogListParams)
 * 
 * @example
 * ```typescript
 * const quickPreset: QuickPreset<PolypointLogListParams> = {
 *   id: 'today',
 *   labelKey: 'polypointLog.filters.quickPresets.today',
 *   icon: 'pi pi-calendar',
 *   filters: () => ({
 *     day__gte: dayjs().format('YYYY-MM-DD'),
 *     day__lte: dayjs().format('YYYY-MM-DD'),
 *   }),
 *   clearFields: ['timestamp__gte', 'timestamp__lte'],
 *   severity: 'secondary',
 * };
 * ```
 */
export interface QuickPreset<TParams = Record<string, any>> {
  /**
   * Unique identifier for the quick preset
   */
  id: string;

  /**
   * Translation key for the button label
   * IMPORTANT: This is NOT the actual label text - it's a key that will be
   * resolved asynchronously using `await loc.t(labelKey)`
   * 
   * @example 'polypointLog.filters.quickPresets.today' → "Today" (en) or "Heute" (de)
   */
  labelKey: string;

  /**
   * Optional PrimeIcons icon class for the button
   * @example 'pi pi-calendar', 'pi pi-clock'
   */
  icon?: string;

  /**
   * Partial filter parameters to apply
   * Unlike dropdown presets, quick presets only set these specific fields
   * and keep other existing filters intact
   * Can be static object or function for dynamic values
   */
  filters: Partial<TParams> | FilterFunction<TParams>;

  /**
   * Fields to clear when applying this quick preset
   * Useful for avoiding conflicts (e.g., clear timestamp range when setting day range)
   * 
   * @example
   * ```typescript
   * // When applying "today" day filter, clear conflicting timestamp filters
   * clearFields: ['timestamp__gte', 'timestamp__lte']
   * ```
   */
  clearFields?: (keyof TParams)[];

  /**
   * Button severity/color
   * @default 'secondary'
   */
  severity?: ButtonSeverity;
}
