# TableFilter Component - API Reference

**Version**: 1.0.0  
**Last Updated**: October 24, 2025

---

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [Component API](#component-api)
3. [Composable API](#composable-api)
4. [Utility Functions](#utility-functions)
5. [Constants](#constants)

---

## Type Definitions

### Core Configuration Types

#### `TableFilterConfig<TParams>`

Main configuration object for the TableFilter component.

```typescript
interface TableFilterConfig<TParams extends Record<string, any>> {
  // Required
  id: string;
  i18nPrefix: string;
  presets: FilterPreset<TParams>[];
  fields: FilterFieldDefinition<TParams>[];
  
  // Optional
  quickPresets?: QuickPreset<TParams>[];
  storage?: FilterStorageOptions;
  defaults?: FilterDefaults<TParams>;
}
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for session storage |
| `i18nPrefix` | `string` | Yes | Base translation key prefix |
| `presets` | `FilterPreset<TParams>[]` | Yes | Dropdown menu presets |
| `fields` | `FilterFieldDefinition<TParams>[]` | Yes | Field definitions |
| `quickPresets` | `QuickPreset<TParams>[]` | No | Dialog button presets |
| `storage` | `FilterStorageOptions` | No | Session storage configuration |
| `defaults` | `FilterDefaults<TParams>` | No | Default values on initialization |

---

### Preset Types

#### `FilterPreset<TParams>`

Dropdown menu preset definition.

```typescript
interface FilterPreset<TParams> {
  id: string;
  labelKey: string;
  icon: string;
  filters: Partial<TParams> | FilterFunction<TParams>;
  descriptionKey?: string;
}
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique preset identifier |
| `labelKey` | `string` | Yes | Translation key for preset label |
| `icon` | `string` | Yes | PrimeIcons CSS class (e.g., `'pi pi-users'`) |
| `filters` | `Partial<TParams> \| FilterFunction<TParams>` | Yes | Static filter object or function returning filters |
| `descriptionKey` | `string` | No | Translation key for description tooltip |

**Example**:
```typescript
const preset: FilterPreset<EmployeeFilters> = {
  id: 'active',
  labelKey: 'employees.filters.presets.active',
  icon: 'pi pi-check',
  filters: { isActive: true },
};
```

#### `QuickPreset<TParams>`

Dialog button preset definition.

```typescript
interface QuickPreset<TParams> {
  id: string;
  labelKey: string;
  icon: string;
  filters: Partial<TParams> | FilterFunction<TParams>;
  severity?: ButtonSeverity;
  clearFields?: (keyof TParams)[];
}
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique preset identifier |
| `labelKey` | `string` | Yes | Translation key for button label |
| `icon` | `string` | Yes | PrimeIcons CSS class |
| `filters` | `Partial<TParams> \| FilterFunction<TParams>` | Yes | Static filter object or function |
| `severity` | `ButtonSeverity` | No | Button color variant (`'primary'`, `'success'`, `'info'`, etc.) |
| `clearFields` | `(keyof TParams)[]` | No | Fields to clear before applying preset |

**Example**:
```typescript
const quickPreset: QuickPreset<EmployeeFilters> = {
  id: 'today',
  labelKey: 'employees.filters.quickPresets.today',
  icon: 'pi pi-calendar',
  severity: 'info',
  filters: () => ({
    hireDate__gte: new Date().toISOString().split('T')[0],
  }),
  clearFields: ['hireDate__lte'],
};
```

#### `FilterFunction<TParams>`

Function that returns filter values (for dynamic presets).

```typescript
type FilterFunction<TParams> = (currentFilters?: Partial<TParams>) => Partial<TParams>;
```

**Parameters**:
- `currentFilters?`: Current filter values (optional)

**Returns**:
- `Partial<TParams>`: Filter object to apply

---

### Field Types

#### `FilterFieldDefinition<TParams>`

Defines a single filter field.

```typescript
interface FilterFieldDefinition<TParams> {
  // Required
  key: keyof TParams;
  type: FilterFieldType;
  labelKey: string;
  
  // Optional
  group?: string;
  groupLabelKey?: string;
  colSpan?: number;
  validation?: FilterFieldValidation;
  condition?: FilterFieldCondition<TParams>;
  options?: FilterFieldOptions;
}
```

**Properties**:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `key` | `keyof TParams` | Yes | - | Filter parameter key (must match interface) |
| `type` | `FilterFieldType` | Yes | - | Field type (see [Field Types](#filterfieldtype)) |
| `labelKey` | `string` | Yes | - | Translation key for field label |
| `group` | `string` | No | - | Group name for organization |
| `groupLabelKey` | `string` | No | - | Translation key for group label |
| `colSpan` | `number` | No | `6` | Column span (1-12) in 12-column grid |
| `validation` | `FilterFieldValidation` | No | - | Validation rules |
| `condition` | `FilterFieldCondition<TParams>` | No | - | Conditional visibility function |
| `options` | `FilterFieldOptions` | No | - | Type-specific options |

#### `FilterFieldType`

Supported field types.

```typescript
type FilterFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'dateRange'
  | 'datetimeRange'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'tristate'
  | 'slider'
  | 'rating'
  | 'custom';
```

**Type Mapping**:

| Type | PrimeVue Component | Value Type | Description |
|------|-------------------|------------|-------------|
| `text` | `InputText` | `string` | Text input field |
| `number` | `InputNumber` | `number` | Number input with increment/decrement |
| `date` | `DatePicker` | `string` | Date picker (ISO format) |
| `datetime` | `DatePicker` | `string` | Date + time picker |
| `dateRange` | Two `DatePicker` | `string` | From/to date range (`__gte`, `__lte`) |
| `datetimeRange` | Two `DatePicker` | `string` | From/to datetime range |
| `select` | `Select` | `any` | Dropdown select (single value) |
| `multiselect` | `Select` | `any[]` | Multi-select dropdown |
| `boolean` | `Checkbox` | `boolean` | Checkbox (true/false) |
| `tristate` | `Checkbox` | `boolean \| null` | Checkbox with null state |
| `slider` | `Slider` | `number` | Slider with min/max |
| `rating` | `Rating` | `number` | Star rating (1-5) |
| `custom` | Custom | `any` | Custom Vue component |

#### `FilterFieldValidation`

Validation rules for a field.

```typescript
interface FilterFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}
```

**Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `required` | `boolean` | Field is required (must have value) |
| `min` | `number` | Minimum value (number/slider) |
| `max` | `number` | Maximum value (number/slider) |
| `minLength` | `number` | Minimum string length (text) |
| `maxLength` | `number` | Maximum string length (text) |
| `pattern` | `RegExp` | Regular expression pattern (text) |
| `custom` | `(value: any) => boolean` | Custom validation function |

**Example**:
```typescript
validation: {
  required: true,
  min: 18,
  max: 120,
  custom: (value) => value % 2 === 0, // Must be even
}
```

#### `FilterFieldCondition<TParams>`

Function to determine field visibility.

```typescript
type FilterFieldCondition<TParams> = (filters: Partial<TParams>) => boolean;
```

**Parameters**:
- `filters`: Current filter values

**Returns**:
- `boolean`: `true` if field should be visible

**Example**:
```typescript
condition: (filters) => {
  // Only show salary field if "Manager" role is selected
  return filters.role === 'manager';
}
```

#### `FilterFieldOptions`

Type-specific field options.

```typescript
interface FilterFieldOptions {
  // Text/Number
  placeholderKey?: string;
  maxLength?: number;
  
  // Number/Slider
  min?: number;
  max?: number;
  step?: number;
  showButtons?: boolean;
  
  // Date/DateTime
  dateFormat?: string;
  showTime?: boolean;
  hourFormat?: '12' | '24';
  showButtonBar?: boolean;
  
  // Select/MultiSelect
  selectOptions?: SelectOption[];
  
  // Custom
  component?: Component;
  componentProps?: Record<string, any>;
}
```

**Properties**:

| Property | Applies To | Type | Description |
|----------|------------|------|-------------|
| `placeholderKey` | text, number, select | `string` | Translation key for placeholder |
| `maxLength` | text | `number` | Maximum character length |
| `min` | number, slider | `number` | Minimum value |
| `max` | number, slider | `number` | Maximum value |
| `step` | number, slider | `number` | Increment step |
| `showButtons` | number | `boolean` | Show +/- buttons |
| `dateFormat` | date, datetime | `string` | Date format (default: `'yy-mm-dd'`) |
| `showTime` | datetime | `boolean` | Show time picker |
| `hourFormat` | datetime | `'12' \| '24'` | Hour format |
| `showButtonBar` | date, datetime | `boolean` | Show today/clear buttons |
| `selectOptions` | select, multiselect | `SelectOption[]` | Dropdown options |
| `component` | custom | `Component` | Vue component |
| `componentProps` | custom | `Record<string, any>` | Props for custom component |

#### `SelectOption`

Dropdown option definition.

```typescript
interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}
```

---

### Storage Types

#### `FilterStorageOptions`

Session storage configuration.

```typescript
interface FilterStorageOptions {
  enabled?: boolean;
  persistPreset?: boolean;
  persistCustom?: boolean;
  autoSave?: boolean;
}
```

**Properties**:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable session storage |
| `persistPreset` | `boolean` | `true` | Save selected preset ID |
| `persistCustom` | `boolean` | `true` | Save custom filter values |
| `autoSave` | `boolean` | `false` | Auto-save on every change |

**Storage Key Format**: `table-filter:${config.id}`

**Example Storage Data**:
```typescript
{
  presetId: 'active',
  customFilters: { name: 'John', isActive: true }
}
```

#### `FilterDefaults<TParams>`

Default values on initialization.

```typescript
interface FilterDefaults<TParams> {
  preset?: string;
  filters?: Partial<TParams>;
}
```

**Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `preset` | `string` | Default preset ID to select |
| `filters` | `Partial<TParams>` | Default filter values |

---

## Component API

### `TableFilter<TParams>`

Main filter component.

#### Props

```typescript
interface TableFilterProps<TParams extends Record<string, any>> {
  config: TableFilterConfig<TParams>;
  filters?: Partial<TParams>; // v-model
}
```

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `config` | `TableFilterConfig<TParams>` | Yes | - | Filter configuration object |
| `filters` | `Partial<TParams>` | No | `{}` | v-model for filter values |

#### Events

```typescript
interface TableFilterEmits<TParams> {
  'update:filters': [filters: Partial<TParams>];
  'change': [filters: Partial<TParams>];
  'apply': [filters: Partial<TParams>];
  'clear': [];
}
```

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:filters` | `filters: Partial<TParams>` | Emitted on filter change (v-model) |
| `change` | `filters: Partial<TParams>` | Emitted on filter change |
| `apply` | `filters: Partial<TParams>` | Emitted when Apply button clicked |
| `clear` | - | Emitted when Clear button clicked |

#### Exposed Methods

```typescript
interface TableFilterExposed<TParams> {
  applyFilters(): void;
  clearFilters(): void;
  getActiveFilters(): Partial<TParams>;
}
```

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `applyFilters()` | - | `void` | Apply current filters and close dialog |
| `clearFilters()` | - | `void` | Clear all filters and reset to defaults |
| `getActiveFilters()` | - | `Partial<TParams>` | Get current filter values |

**Usage**:
```vue
<script setup>
const filterRef = ref<InstanceType<typeof TableFilter>>();

function handleApply() {
  filterRef.value?.applyFilters();
}

function handleClear() {
  filterRef.value?.clearFilters();
}

const current = filterRef.value?.getActiveFilters();
</script>

<template>
  <TableFilter ref="filterRef" v-model:filters="filters" :config="config" />
</template>
```

---

### `FilterDialog<TParams>`

Filter editing dialog component.

#### Props

```typescript
interface FilterDialogProps<TParams> {
  visible: boolean;
  i18nPrefix: string;
  fields: FilterFieldDefinition<TParams>[];
  filters: Partial<TParams>;
  quickPresets?: QuickPreset<TParams>[];
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | v-model for dialog visibility |
| `i18nPrefix` | `string` | Yes | Translation key prefix |
| `fields` | `FilterFieldDefinition<TParams>[]` | Yes | Field definitions |
| `filters` | `Partial<TParams>` | Yes | Current filter values |
| `quickPresets` | `QuickPreset<TParams>[]` | No | Quick preset buttons |

#### Events

```typescript
interface FilterDialogEmits<TParams> {
  'update:visible': [visible: boolean];
  'apply': [filters: Partial<TParams>];
  'clear': [];
}
```

---

### `FilterSplitButton<TParams>`

Dropdown button component.

#### Props

```typescript
interface FilterSplitButtonProps<TParams> {
  i18nPrefix: string;
  labelKey: string;
  icon: string;
  severity: ButtonSeverity;
  presets: FilterPreset<TParams>[];
  selectedPresetId: string | null;
  activeFilterCount: number;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `i18nPrefix` | `string` | Yes | Translation key prefix |
| `labelKey` | `string` | Yes | Button label translation key |
| `icon` | `string` | Yes | PrimeIcons CSS class |
| `severity` | `ButtonSeverity` | Yes | Button color variant |
| `presets` | `FilterPreset<TParams>[]` | Yes | Dropdown presets |
| `selectedPresetId` | `string \| null` | Yes | Currently selected preset ID |
| `activeFilterCount` | `number` | Yes | Number of active filters (for badge) |

#### Events

```typescript
interface FilterSplitButtonEmits<TParams> {
  'click': [];
  'preset-select': [presetId: string];
}
```

---

### `FilterField<TParams>`

Individual field renderer component.

#### Props

```typescript
interface FilterFieldProps<TParams> {
  field: FilterFieldDefinition<TParams>;
  modelValue: any;
  placeholder?: string;
  errorMessage?: string;
  invalid?: boolean;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `field` | `FilterFieldDefinition<TParams>` | Yes | Field definition |
| `modelValue` | `any` | Yes | v-model value |
| `placeholder` | `string` | No | Placeholder text |
| `errorMessage` | `string` | No | Validation error message |
| `invalid` | `boolean` | No | Invalid state |

#### Events

```typescript
interface FilterFieldEmits {
  'update:modelValue': [value: any];
}
```

---

## Composable API

### `useTableFilter<TParams>`

Main composable for filter logic.

#### Signature

```typescript
function useTableFilter<TParams extends Record<string, any>>(
  config: Ref<TableFilterConfig<TParams>> | TableFilterConfig<TParams>,
  initialFilters?: Ref<Partial<TParams>> | Partial<TParams>
): UseTableFilterReturn<TParams>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Ref<TableFilterConfig<TParams>> \| TableFilterConfig<TParams>` | Yes | Filter configuration |
| `initialFilters` | `Ref<Partial<TParams>> \| Partial<TParams>` | No | Initial filter values |

#### Returns

```typescript
interface UseTableFilterReturn<TParams> {
  // State
  customFilters: Ref<Partial<TParams>>;
  tempFilters: Ref<Partial<TParams>>;
  selectedPresetId: Ref<string | null>;
  isDialogVisible: Ref<boolean>;
  
  // Computed
  activeFilters: ComputedRef<Partial<TParams>>;
  activeFilterCount: ComputedRef<number>;
  buttonLabelKey: ComputedRef<string>;
  
  // Methods
  applyFilters: () => void;
  clearFilters: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  handleApply: () => void;
  handleClear: () => void;
  selectPreset: (presetId: string) => void;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `customFilters` | `Ref<Partial<TParams>>` | User's custom filter values |
| `tempFilters` | `Ref<Partial<TParams>>` | Temporary values in dialog |
| `selectedPresetId` | `Ref<string \| null>` | Currently selected preset ID |
| `isDialogVisible` | `Ref<boolean>` | Dialog visibility state |
| `activeFilters` | `ComputedRef<Partial<TParams>>` | Merged preset + custom filters |
| `activeFilterCount` | `ComputedRef<number>` | Number of active filters |
| `buttonLabelKey` | `ComputedRef<string>` | Translation key for button label |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `applyFilters()` | - | `void` | Validate and apply current filters |
| `clearFilters()` | - | `void` | Clear all filters and reset |
| `openDialog()` | - | `void` | Open filter dialog |
| `closeDialog()` | - | `void` | Close filter dialog |
| `handleApply()` | - | `void` | Handle Apply button click |
| `handleClear()` | - | `void` | Handle Clear button click |
| `selectPreset(presetId)` | `presetId: string` | `void` | Select preset by ID |

---

### `useFilterPresets<TParams>`

Manages preset selection and resolution.

#### Signature

```typescript
function useFilterPresets<TParams>(
  presets: Ref<FilterPreset<TParams>[]>
): UseFilterPresetsReturn<TParams>
```

#### Returns

```typescript
interface UseFilterPresetsReturn<TParams> {
  selectedPresetId: Ref<string | null>;
  resolvedFilters: ComputedRef<Partial<TParams>>;
  selectPreset: (presetId: string) => void;
  clearPreset: () => void;
}
```

---

### `useFilterForm<TParams>`

Organizes fields into groups and handles visibility.

#### Signature

```typescript
function useFilterForm<TParams>(
  fields: Ref<FilterFieldDefinition<TParams>[]>
): UseFilterFormReturn<TParams>
```

#### Returns

```typescript
interface UseFilterFormReturn<TParams> {
  groupedFields: ComputedRef<FilterFieldGroup<TParams>[]>;
  ungroupedFields: ComputedRef<FilterFieldDefinition<TParams>[]>;
  visibleFields: (filters: Partial<TParams>) => FilterFieldDefinition<TParams>[];
  getFieldPlaceholder: (field: FilterFieldDefinition<TParams>) => string;
}
```

---

### `useFilterStorage<TParams>`

Handles session storage persistence.

#### Signature

```typescript
function useFilterStorage<TParams>(
  storageKey: string,
  options: FilterStorageOptions
): UseFilterStorageReturn<TParams>
```

#### Returns

```typescript
interface UseFilterStorageReturn<TParams> {
  save: (filters: Partial<TParams>, presetId?: string | null) => void;
  load: () => { customFilters: Partial<TParams>; presetId: string | null } | null;
  clear: () => void;
}
```

---

## Utility Functions

### `validateFilter`

Validates a single filter value against field rules.

```typescript
function validateFilter(
  value: any,
  field: FilterFieldDefinition<any>
): { valid: boolean; message?: string }
```

**Parameters**:
- `value`: Filter value to validate
- `field`: Field definition with validation rules

**Returns**:
- `{ valid: true }` if valid
- `{ valid: false, message: string }` if invalid

**Example**:
```typescript
const result = validateFilter('john@example.com', {
  key: 'email',
  type: 'text',
  labelKey: 'fields.email',
  validation: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
});
// result: { valid: true }
```

---

### `validateFilters`

Validates all filter values.

```typescript
function validateFilters<TParams>(
  filters: Partial<TParams>,
  fields: FilterFieldDefinition<TParams>[]
): ValidationResult<TParams>
```

**Parameters**:
- `filters`: Filter values to validate
- `fields`: Array of field definitions

**Returns**:
```typescript
interface ValidationResult<TParams> {
  valid: boolean;
  errors: Partial<Record<keyof TParams, string>>;
}
```

**Example**:
```typescript
const result = validateFilters(
  { email: 'invalid-email', age: 15 },
  fields
);
// result: {
//   valid: false,
//   errors: {
//     email: 'Invalid email format',
//     age: 'Must be at least 18'
//   }
// }
```

---

### `cleanFilters`

Removes null, undefined, and empty values from filters.

```typescript
function cleanFilters<TParams>(
  filters: Partial<TParams>
): Partial<TParams>
```

**Parameters**:
- `filters`: Filter object to clean

**Returns**:
- Cleaned filter object

**Example**:
```typescript
const cleaned = cleanFilters({
  name: 'John',
  email: '',
  age: null,
  isActive: true,
});
// Result: { name: 'John', isActive: true }
```

---

### `mergeFilters`

Merges multiple filter objects (right-most takes precedence).

```typescript
function mergeFilters<TParams>(
  ...filterObjects: Partial<TParams>[]
): Partial<TParams>
```

**Parameters**:
- `...filterObjects`: Filter objects to merge

**Returns**:
- Merged filter object

**Example**:
```typescript
const merged = mergeFilters(
  { name: 'John', age: 30 },
  { age: 25, email: 'john@example.com' }
);
// Result: { name: 'John', age: 25, email: 'john@example.com' }
```

---

### `getActiveFilterCount`

Counts non-empty filter values.

```typescript
function getActiveFilterCount<TParams>(
  filters: Partial<TParams>
): number
```

**Parameters**:
- `filters`: Filter object

**Returns**:
- Number of active (non-empty) filters

**Example**:
```typescript
const count = getActiveFilterCount({
  name: 'John',
  email: '',
  age: 30,
  isActive: null,
});
// Result: 2 (name and age)
```

---

## Constants

### `STORAGE_KEY_PREFIX`

Prefix for session storage keys.

```typescript
const STORAGE_KEY_PREFIX = 'table-filter:';
```

**Usage**:
```typescript
const storageKey = `${STORAGE_KEY_PREFIX}${config.id}`;
// Example: 'table-filter:employee-table'
```

---

### `DEFAULT_COL_SPAN`

Default column span for fields.

```typescript
const DEFAULT_COL_SPAN = 6;
```

**Usage**: Fields without explicit `colSpan` use this value (6 out of 12 columns = 50% width).

---

### `DEFAULT_STORAGE_OPTIONS`

Default storage configuration.

```typescript
const DEFAULT_STORAGE_OPTIONS: FilterStorageOptions = {
  enabled: true,
  persistPreset: true,
  persistCustom: true,
  autoSave: false,
};
```

---

## Type Guards

### `isFilterFunction`

Checks if value is a filter function.

```typescript
function isFilterFunction<TParams>(
  value: any
): value is FilterFunction<TParams>
```

**Example**:
```typescript
if (isFilterFunction(preset.filters)) {
  const resolved = preset.filters();
}
```

---

### `isRangeField`

Checks if field is a range type.

```typescript
function isRangeField(
  field: FilterFieldDefinition<any>
): boolean
```

**Example**:
```typescript
if (isRangeField(field)) {
  // Handle dateRange or datetimeRange
}
```

---

## Generic Type Parameters

All types and components support generic type parameters for type safety:

```typescript
// Define your filter interface
interface EmployeeFilters {
  name?: string;
  isActive?: boolean;
  hireDate__gte?: string;
  hireDate__lte?: string;
}

// Use with full type safety
const config: TableFilterConfig<EmployeeFilters> = { /* ... */ };
const filters = ref<Partial<EmployeeFilters>>({});

// Component usage
<TableFilter<EmployeeFilters>
  v-model:filters="filters"
  :config="config"
/>
```

---

## Error Types

### `ValidationError`

Thrown when validation fails.

```typescript
class ValidationError extends Error {
  field: string;
  value: any;
  rule: string;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-24 | Initial release |

---

**Need Help?**

- Check the [Usage Guide](./USAGE_GUIDE.md) for examples
- Review TypeScript definitions for IntelliSense
- Check browser console for runtime errors

**Version**: 1.0.0  
**Last Updated**: October 24, 2025
