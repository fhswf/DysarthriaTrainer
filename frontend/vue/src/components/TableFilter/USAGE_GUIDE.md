# TableFilter Component - Usage Guide

**Version**: 1.0.0  
**Author**: Development Team  
**Last Updated**: October 24, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Configuration](#configuration)
5. [Field Types](#field-types)
6. [Presets](#presets)
7. [Localization](#localization)
8. [Advanced Features](#advanced-features)
9. [API Reference](#api-reference)
10. [Examples](#examples)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Import the Component

```typescript
import { TableFilter, type TableFilterConfig } from '@/v2/components/TableFilter';
```

### 2. Define Your Filter Interface

```typescript
interface MyFilters {
  name?: string;
  status?: 'active' | 'inactive';
  createdAt__gte?: string;
  createdAt__lte?: string;
}
```

### 3. Create Configuration

```typescript
const config: TableFilterConfig<MyFilters> = {
  id: 'my-table',
  i18nPrefix: 'myTable.filters',
  presets: [
    { id: 'all', labelKey: 'myTable.filters.all', icon: 'pi pi-list', filters: {} },
  ],
  fields: [
    { key: 'name', type: 'text', labelKey: 'myTable.filters.name' },
    { key: 'status', type: 'select', labelKey: 'myTable.filters.status', options: {/* ... */} },
  ],
};
```

### 4. Use in Template

```vue
<template>
  <TableFilter v-model:filters="filters" :config="config" @change="handleChange" />
</template>

<script setup lang="ts">
const filters = ref<Partial<MyFilters>>({});

function handleChange(newFilters: Partial<MyFilters>) {
  // Fetch data with new filters
  fetchData(newFilters);
}
</script>
```

---

## Installation

The TableFilter component is already part of the v2 component library. No additional installation required.

### Dependencies

Ensure you have these installed:
- Vue 3.x
- PrimeVue 4.3.9+
- Pinia 2.x (for localization)
- dayjs (optional, for date utilities)

---

## Basic Usage

### Minimal Example

```vue
<template>
  <div>
    <TableFilter v-model:filters="filters" :config="filterConfig" />
    
    <DataTable :value="filteredData" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { TableFilter, type TableFilterConfig } from '@/v2/components/TableFilter';

interface UserFilters {
  name?: string;
  isActive?: boolean;
}

const filters = ref<Partial<UserFilters>>({});

const filterConfig: TableFilterConfig<UserFilters> = {
  id: 'user-table',
  i18nPrefix: 'users.filters',
  presets: [
    {
      id: 'all',
      labelKey: 'users.filters.presets.all',
      icon: 'pi pi-users',
      filters: {},
    },
  ],
  fields: [
    {
      key: 'name',
      type: 'text',
      labelKey: 'users.filters.fields.name',
    },
    {
      key: 'isActive',
      type: 'boolean',
      labelKey: 'users.filters.fields.isActive',
    },
  ],
};

watch(filters, (newFilters) => {
  console.log('Filters changed:', newFilters);
});
</script>
```

---

## Configuration

### TableFilterConfig Interface

```typescript
interface TableFilterConfig<TParams> {
  // Required
  id: string;                              // Unique identifier for storage
  i18nPrefix: string;                      // Translation key prefix
  presets: FilterPreset<TParams>[];        // Dropdown presets
  fields: FilterFieldDefinition<TParams>[]; // Field definitions
  
  // Optional
  quickPresets?: QuickPreset<TParams>[];   // Dialog button presets
  storage?: FilterStorageOptions;          // Persistence options
  defaults?: FilterDefaults<TParams>;      // Default values
}
```

### Configuration Properties

#### `id` (required)
Unique identifier used for session storage key.

```typescript
id: 'employee-table'
// Storage key will be: 'table-filter:employee-table'
```

#### `i18nPrefix` (required)
Base translation key for all labels.

```typescript
i18nPrefix: 'employees.filters'
// Dialog title: 'employees.filters.dialogTitle'
// Apply button: 'employees.filters.apply'
```

#### `presets` (required)
Dropdown menu presets. At least one preset is recommended.

```typescript
presets: [
  {
    id: 'all',
    labelKey: 'employees.filters.presets.all',
    icon: 'pi pi-users',
    filters: {},
  },
  {
    id: 'active',
    labelKey: 'employees.filters.presets.active',
    icon: 'pi pi-check',
    filters: { isActive: true },
  },
]
```

#### `quickPresets` (optional)
Dialog button presets for quick filter changes.

```typescript
quickPresets: [
  {
    id: 'today',
    labelKey: 'employees.filters.quickPresets.today',
    icon: 'pi pi-calendar',
    severity: 'info',
    filters: () => ({
      createdAt__gte: new Date().toISOString().split('T')[0],
    }),
  },
]
```

#### `storage` (optional)
Session storage configuration.

```typescript
storage: {
  enabled: true,          // Enable persistence
  persistPreset: true,    // Save selected preset
  persistCustom: true,    // Save custom filters
  autoSave: false,        // Auto-save on change
}
```

#### `defaults` (optional)
Default values on initialization.

```typescript
defaults: {
  preset: 'active',       // Default preset ID
  filters: {},            // Default filter values
}
```

---

## Field Types

### Supported Types (13 Total)

#### 1. Text Input
```typescript
{
  key: 'name',
  type: 'text',
  labelKey: 'fields.name',
  options: {
    placeholderKey: 'fields.namePlaceholder',
    maxLength: 100,
  },
}
```

#### 2. Number Input
```typescript
{
  key: 'age',
  type: 'number',
  labelKey: 'fields.age',
  options: {
    min: 0,
    max: 120,
    step: 1,
  },
  validation: {
    min: 0,
    max: 120,
  },
}
```

#### 3. Date Picker
```typescript
{
  key: 'birthDate',
  type: 'date',
  labelKey: 'fields.birthDate',
  options: {
    dateFormat: 'yy-mm-dd',
    showButtonBar: true,
  },
}
```

#### 4. DateTime Picker
```typescript
{
  key: 'appointment',
  type: 'datetime',
  labelKey: 'fields.appointment',
  options: {
    dateFormat: 'yy-mm-dd',
    showTime: true,
    hourFormat: '24',
  },
}
```

#### 5. Date Range
```typescript
{
  key: 'createdAt__gte', // Note: uses __gte suffix
  type: 'dateRange',
  labelKey: 'fields.createdAt',
  options: {
    dateFormat: 'yy-mm-dd',
    showButtonBar: true,
  },
}
// Generates keys: createdAt__gte and createdAt__lte
```

#### 6. DateTime Range
```typescript
{
  key: 'eventTime__gte',
  type: 'datetimeRange',
  labelKey: 'fields.eventTime',
  options: {
    dateFormat: 'yy-mm-dd',
    showTime: true,
    hourFormat: '24',
  },
}
// Generates keys: eventTime__gte and eventTime__lte
```

#### 7. Select/Dropdown
```typescript
{
  key: 'status',
  type: 'select',
  labelKey: 'fields.status',
  options: {
    selectOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
    placeholderKey: 'fields.statusPlaceholder',
  },
}
```

#### 8. MultiSelect
```typescript
{
  key: 'departments',
  type: 'multiselect',
  labelKey: 'fields.departments',
  options: {
    selectOptions: [
      { label: 'Engineering', value: 'eng' },
      { label: 'Sales', value: 'sales' },
      { label: 'Marketing', value: 'marketing' },
    ],
  },
}
```

#### 9. Boolean (Checkbox)
```typescript
{
  key: 'isActive',
  type: 'boolean',
  labelKey: 'fields.isActive',
}
```

#### 10. TriState (Checkbox with null)
```typescript
{
  key: 'verified',
  type: 'tristate',
  labelKey: 'fields.verified',
}
// Values: true, false, null
```

#### 11. Slider
```typescript
{
  key: 'priority',
  type: 'slider',
  labelKey: 'fields.priority',
  options: {
    min: 0,
    max: 10,
    step: 1,
  },
}
```

#### 12. Rating
```typescript
{
  key: 'rating',
  type: 'rating',
  labelKey: 'fields.rating',
}
// 1-5 stars
```

#### 13. Custom Component
```typescript
{
  key: 'customField',
  type: 'custom',
  labelKey: 'fields.customField',
  options: {
    component: MyCustomComponent,
    componentProps: {
      // Custom props passed to component
      customProp: 'value',
    },
  },
}
```

### Field Options

Common options for all field types:

```typescript
{
  key: 'fieldName',
  type: 'text',
  labelKey: 'translation.key',
  
  // Optional
  group: 'groupName',                  // Group name for organization
  groupLabelKey: 'group.label.key',    // Group label translation key
  colSpan: 6,                          // Column span (1-12, default: 6)
  validation: {                        // Validation rules
    required: true,
    min: 0,
    max: 100,
    pattern: /regex/,
    custom: (value) => value > 10,
  },
  condition: (filters) => {            // Conditional visibility
    return filters.someField === 'value';
  },
}
```

---

## Presets

### Dropdown Presets

Presets appear in the SplitButton dropdown menu.

#### Static Filters
```typescript
{
  id: 'active',
  labelKey: 'presets.active',
  icon: 'pi pi-check',
  filters: {
    isActive: true,
    status: 'approved',
  },
}
```

#### Dynamic Filters (Function)
```typescript
{
  id: 'today',
  labelKey: 'presets.today',
  icon: 'pi pi-calendar',
  filters: () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      createdAt__gte: today,
      createdAt__lte: today,
    };
  },
}
```

### Quick Presets

Quick presets appear as buttons in the dialog.

```typescript
quickPresets: [
  {
    id: 'thisWeek',
    labelKey: 'quickPresets.thisWeek',
    icon: 'pi pi-calendar',
    severity: 'info',
    filters: () => {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1);
      return {
        createdAt__gte: monday.toISOString().split('T')[0],
      };
    },
    clearFields: ['createdAt__gte', 'createdAt__lte'], // Clear these fields first
  },
]
```

### Preset Properties

```typescript
interface FilterPreset<TParams> {
  id: string;                              // Unique identifier
  labelKey: string;                        // Translation key
  icon: string;                            // PrimeIcons class
  filters: Partial<TParams> | FilterFunction<TParams>; // Filters to apply
  descriptionKey?: string;                 // Description (optional)
}

interface QuickPreset<TParams> {
  id: string;                              // Unique identifier
  labelKey: string;                        // Translation key
  icon: string;                            // PrimeIcons class
  filters: Partial<TParams> | FilterFunction<TParams>; // Filters to apply
  severity?: ButtonSeverity;               // Button color
  clearFields?: (keyof TParams)[];         // Fields to clear first
}
```

---

## Localization

### Translation Structure

All text must come from the localization service.

#### Required Keys

```json
{
  "[i18nPrefix]": {
    "dialogTitle": "Filter Items",
    "apply": "Apply Filters",
    "cancel": "Cancel",
    "clear": "Clear All",
    "customFilters": "Custom Filters"
  }
}
```

#### Preset Labels

```json
{
  "[i18nPrefix]": {
    "presets": {
      "all": "All Items",
      "active": "Active Only"
    }
  }
}
```

#### Field Labels

```json
{
  "[i18nPrefix]": {
    "fields": {
      "name": "Name",
      "namePlaceholder": "Enter name...",
      "status": "Status"
    }
  }
}
```

#### Group Labels

```json
{
  "[i18nPrefix]": {
    "groups": {
      "basic": "Basic Information",
      "advanced": "Advanced Filters"
    }
  }
}
```

### Loading Translations

Translations are loaded automatically using the async Pinia localization service.

```typescript
import { useLocalizationStore } from '@/v2/stores/localization';

const loc = useLocalizationStore();

// In component onMounted:
const label = await loc.t('employees.filters.fields.name');
```

---

## Advanced Features

### Field Grouping

Group related fields together:

```typescript
fields: [
  {
    key: 'name',
    type: 'text',
    labelKey: 'fields.name',
    group: 'basic',
    groupLabelKey: 'groups.basic',
  },
  {
    key: 'email',
    type: 'text',
    labelKey: 'fields.email',
    group: 'basic',
    groupLabelKey: 'groups.basic',
  },
  {
    key: 'salary',
    type: 'number',
    labelKey: 'fields.salary',
    group: 'compensation',
    groupLabelKey: 'groups.compensation',
  },
]
```

### Conditional Fields

Show/hide fields based on current filter values:

```typescript
{
  key: 'managerName',
  type: 'text',
  labelKey: 'fields.managerName',
  condition: (filters) => {
    // Only show if "Manager" department is selected
    return filters.department === 'management';
  },
}
```

### Validation

Add validation rules to fields:

```typescript
{
  key: 'age',
  type: 'number',
  labelKey: 'fields.age',
  validation: {
    required: true,
    min: 18,
    max: 120,
  },
}

{
  key: 'email',
  type: 'text',
  labelKey: 'fields.email',
  validation: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
}

{
  key: 'customField',
  type: 'number',
  labelKey: 'fields.custom',
  validation: {
    custom: (value) => {
      return value % 2 === 0; // Must be even
    },
  },
}
```

### Session Storage

Filters are persisted to session storage:

```typescript
storage: {
  enabled: true,           // Enable persistence
  persistPreset: true,     // Save selected preset
  persistCustom: true,     // Save custom filter values
  autoSave: false,         // Auto-save on change (default: false)
}
```

Storage key format: `table-filter:${config.id}`

### Range Fields

Date and number ranges use Django-style `__gte`/`__lte` suffixes:

```typescript
// Filter interface
interface MyFilters {
  createdAt__gte?: string;
  createdAt__lte?: string;
}

// Field definition
{
  key: 'createdAt__gte',
  type: 'dateRange',
  labelKey: 'fields.createdAt',
}

// Generates filters:
// { createdAt__gte: '2024-01-01', createdAt__lte: '2024-12-31' }
```

---

## API Reference

### Component Props

```typescript
interface TableFilterProps<TParams> {
  config: TableFilterConfig<TParams>;  // Filter configuration
  filters?: Partial<TParams>;          // v-model for filters
}
```

### Component Events

```typescript
// Filter values changed
@change="(filters: Partial<TParams>) => void"

// Filter values updated (v-model)
@update:filters="(filters: Partial<TParams>) => void"

// Apply button clicked in dialog
@apply="(filters: Partial<TParams>) => void"

// Clear button clicked
@clear="() => void"
```

### Exposed Methods

```typescript
// Get component reference
const filterRef = ref<InstanceType<typeof TableFilter>>();

// Apply preset by ID
filterRef.value.applyPreset('active');

// Clear all filters
filterRef.value.clearFilters();

// Reset to default values
filterRef.value.resetToDefaults();

// Open dialog programmatically
filterRef.value.openDialog();

// Get current filters
const filters = filterRef.value.getFilters();

// Get active filter count
const count = filterRef.value.getActiveFilterCount();
```

### Composable API

You can also use the composable directly:

```typescript
import { useTableFilter } from '@/v2/components/TableFilter';

const {
  filters,
  activeFilterCount,
  applyPreset,
  applyCustomFilters,
  clearAllFilters,
  // ... more functions
} = useTableFilter(config);
```

---

## Examples

See the `/examples` directory for complete examples:

1. **Employee Table** (`employeeFilterConfig.ts`)
   - Complete configuration with all features
   - Multiple presets and quick presets
   - Field grouping
   - Conditional fields
   - Validation rules

2. **Translation Files** (`translations/en.json`, `translations/de.json`)
   - Complete translation structure
   - English and German examples

3. **Live Component** (`EmployeeTableExample.vue`)
   - Full integration with DataTable
   - Filter application logic
   - Debug panel

---

## Troubleshooting

### Common Issues

#### Filters Not Applying
- **Check**: v-model binding is correct
- **Check**: Event handlers are connected
- **Solution**: Use `@change` event to trigger data fetch

#### Translations Not Loading
- **Check**: Translation keys match configuration
- **Check**: Localization service is initialized
- **Solution**: Check browser console for loading errors

#### Fields Not Showing
- **Check**: Field `condition` function returns true
- **Check**: Field keys match filter interface
- **Solution**: Use debug panel to inspect visible fields

#### Range Fields Not Working
- **Check**: Field key ends with `__gte` or `__lte`
- **Check**: Filter interface includes both keys
- **Solution**: Use `dateRange` or `datetimeRange` type

#### Storage Not Persisting
- **Check**: `storage.enabled` is true
- **Check**: Unique `id` is set
- **Solution**: Check sessionStorage in browser DevTools

### Debug Mode

Enable debug panel in your component:

```vue
<template>
  <div>
    <TableFilter ref="filterRef" v-model:filters="filters" :config="config" />
    
    <!-- Debug Panel -->
    <pre>{{ JSON.stringify(filters, null, 2) }}</pre>
    <pre>Active Count: {{ filterRef?.getActiveFilterCount() }}</pre>
  </div>
</template>
```

### TypeScript Errors

#### Generic Type Errors
- **Issue**: `Type 'X' is not assignable to type 'keyof TParams'`
- **Solution**: Ensure field keys match your filter interface exactly

#### Import Errors
- **Issue**: `Cannot find module '@/v2/components/TableFilter'`
- **Solution**: Check path alias configuration in `tsconfig.json`

---

## Best Practices

### 1. Define Clear Filter Interfaces
```typescript
// ✅ Good - Clear, typed interface
interface EmployeeFilters {
  name?: string;
  isActive?: boolean;
  hireDate__gte?: string;
  hireDate__lte?: string;
}

// ❌ Bad - Generic Record type
type Filters = Record<string, any>;
```

### 2. Use Meaningful Preset IDs
```typescript
// ✅ Good - Descriptive IDs
presets: [
  { id: 'active-fulltime', ... },
  { id: 'recently-hired', ... },
]

// ❌ Bad - Generic IDs
presets: [
  { id: 'preset1', ... },
  { id: 'preset2', ... },
]
```

### 3. Group Related Fields
```typescript
// ✅ Good - Logical grouping
fields: [
  { key: 'name', group: 'basic', ... },
  { key: 'email', group: 'basic', ... },
  { key: 'salary', group: 'compensation', ... },
]
```

### 4. Use Dynamic Filters for Dates
```typescript
// ✅ Good - Calculated at runtime
filters: () => ({
  createdAt__gte: new Date().toISOString(),
})

// ❌ Bad - Hardcoded date
filters: {
  createdAt__gte: '2024-01-01',
}
```

### 5. Add Validation to User Inputs
```typescript
// ✅ Good - Validated field
{
  key: 'email',
  type: 'text',
  validation: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
}
```

---

## Performance Tips

1. **Use `autoSave: false`** for better performance (manual save on apply)
2. **Limit number of fields** - Too many fields can slow down rendering
3. **Use conditional fields** - Hide fields that aren't always needed
4. **Debounce data fetching** - Don't fetch on every filter change

---

## Migration Guide

### From v1 to v2

If migrating from a previous filter implementation:

1. **Extract filter configuration** from component into separate config object
2. **Update translation keys** to follow new structure
3. **Replace custom form** with `TableFilter` component
4. **Update filter interface** to use Django-style range keys (`__gte`, `__lte`)

---

**Need Help?**

- Check the examples in `/examples` directory
- Review the API documentation
- Check TypeScript types for IntelliSense

**Version**: 1.0.0  
**Last Updated**: October 24, 2025
