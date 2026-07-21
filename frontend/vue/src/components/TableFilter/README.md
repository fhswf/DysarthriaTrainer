# TableFilter Component

**Version**: 3.0  
**Status**: Production Ready  
**Type**: Vue 3 Component (Composition API)

A comprehensive, declarative filtering system for data tables with preset management, field validation, localization, and persistent storage.

## 📁 Structure

```
TableFilter/
├── README.md                    # This file
├── API_REFERENCE.md             # Complete API documentation
├── USAGE_GUIDE.md               # Step-by-step usage guide
├── index.ts                     # Main exports
├── components/
│   ├── TableFilter.vue          # Main component
│   ├── FilterDialog.vue         # Filter dialog with fieldsets
│   ├── FilterField.vue          # Individual field renderer
│   ├── FilterFieldWrapper.vue   # Field with FloatLabel
│   ├── FilterSplitButton.vue    # Preset dropdown button
│   └── index.ts                 # Component exports
├── composables/
│   ├── useTableFilter.ts        # Main composable
│   ├── useFilterPresets.ts      # Preset management
│   ├── useFilterForm.ts         # Form state & validation
│   ├── useFilterStorage.ts      # LocalStorage persistence
│   └── index.ts                 # Composable exports
├── types/
│   ├── filter-config.types.ts   # Configuration types
│   ├── filter-field.types.ts    # Field definition types
│   ├── filter-preset.types.ts   # Preset types
│   └── index.ts                 # Type exports
├── utils/
│   ├── fieldRenderer.ts         # Field type utilities
│   ├── filterValidator.ts       # Validation logic
│   ├── filterCleaner.ts         # Filter cleaning/merging
│   └── index.ts                 # Utility exports
├── examples/
│   ├── employeeFilterConfig.ts  # Complete example config
│   ├── EmployeeTableExample.vue # Usage example
│   └── translations/            # Translation examples
└── __tests__/                   # Comprehensive test suite
```

## 🚀 Quick Start

### 1. Basic Setup

```vue
<template>
  <div>
    <TableFilter
      :config="filterConfig"
      @change="handleFilterChange"
    />
    
    <DataTable :value="filteredData" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TableFilter, type TableFilterConfig } from '@/v2/components/TableFilter';

interface ProductFilters {
  name?: string;
  category?: string;
  price__gte?: number;
  price__lte?: number;
}

const filterConfig: TableFilterConfig<ProductFilters> = {
  id: 'product-filter',
  i18nPrefix: 'products.filters',
  
  presets: [
    {
      id: 'all',
      labelKey: 'products.filters.presets.all',
      icon: 'pi pi-list',
      filters: {},
    },
    {
      id: 'electronics',
      labelKey: 'products.filters.presets.electronics',
      icon: 'pi pi-mobile',
      filters: { category: 'electronics' },
    },
  ],
  
  fields: [
    {
      key: 'name',
      type: 'text',
      labelKey: 'products.filters.fields.name',
      colSpan: 12,
    },
    {
      key: 'category',
      type: 'select',
      labelKey: 'products.filters.fields.category',
      options: {
        selectOptions: [
          { label: 'Electronics', value: 'electronics' },
          { label: 'Clothing', value: 'clothing' },
          { label: 'Books', value: 'books' },
        ],
      },
      colSpan: 6,
    },
    {
      key: 'price__gte',
      type: 'number',
      labelKey: 'products.filters.fields.minPrice',
      colSpan: 6,
    },
  ],
};

function handleFilterChange(filters: ProductFilters) {
  console.log('Active filters:', filters);
  // Make API call with filters
}
</script>
```

### 2. With TableSetup Integration

```vue
<template>
  <TableSetup
    :api-service="employeeApi"
    :columns="columns"
    :filter-config="filterConfig"
  >
    <template #default="{ data }">
      <DataTable :value="data">
        <Column field="name" header="Name" />
        <Column field="email" header="Email" />
      </DataTable>
    </template>
  </TableSetup>
</template>

<script setup lang="ts">
import { TableSetup } from '@/v2/components/TableSetup';
import { employeeApi } from '@/v2/api/employees';
import { employeeFilterConfig } from './config/employeeFilterConfig';

const columns = [
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
];

const filterConfig = employeeFilterConfig;
</script>
```

## 📋 Features

### Core Features

- ✅ **Declarative Configuration**: Define filters via TypeScript config
- ✅ **13 Field Types**: text, number, date, dateRange, select, multiselect, boolean, tristate, slider, rating, custom
- ✅ **Preset System**: Dropdown presets + quick preset buttons
- ✅ **Field Grouping**: Organize fields into collapsible fieldsets
- ✅ **Validation**: Built-in validation with custom rules
- ✅ **Localization**: Full i18n support with reactive language switching
- ✅ **Persistence**: LocalStorage for preset and filter state
- ✅ **Type Safety**: Full TypeScript support with generics

### Advanced Features

- ✅ **Dynamic Presets**: Compute preset values at runtime (e.g., "Last 7 days")
- ✅ **Conditional Fields**: Show/hide fields based on other field values
- ✅ **Range Fields**: Special handling for Django-style `__gte`/`__lte` filters
- ✅ **Auto-Apply**: Quick presets auto-apply filters
- ✅ **Clear Functions**: Granular control over which fields to clear
- ✅ **Reactive UI**: PrimeVue components with proper styling
- ✅ **Filter Counting**: Active filter badge on button
- ✅ **Utility Functions**: Clean, merge, validate, compare filters

## 🎨 Field Types

### Text-Based Fields

```typescript
{
  key: 'search',
  type: 'text',
  labelKey: 'filters.search',
  options: {
    placeholderKey: 'filters.searchPlaceholder',
    maxLength: 100,
  },
}
```

### Numeric Fields

```typescript
{
  key: 'age',
  type: 'number',
  labelKey: 'filters.age',
  options: {
    min: 0,
    max: 120,
    step: 1,
  },
  validation: {
    min: 18,
    max: 100,
  },
}
```

### Date Fields

```typescript
// Single date
{
  key: 'startDate',
  type: 'date',
  labelKey: 'filters.startDate',
  options: {
    showButtonBar: true,
  },
}

// Date range (automatically creates __gte and __lte)
{
  key: 'created_at__gte',
  type: 'dateRange',
  labelKey: 'filters.createdDate',
  options: {
    showButtonBar: true,
  },
}
```

### Select Fields

```typescript
{
  key: 'category',
  type: 'select',
  labelKey: 'filters.category',
  options: {
    selectOptions: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ],
    placeholderKey: 'filters.selectCategory',
  },
}

// Multi-select
{
  key: 'tags',
  type: 'multiselect',
  labelKey: 'filters.tags',
  options: {
    selectOptions: [
      { label: 'Tag 1', value: 'tag1' },
      { label: 'Tag 2', value: 'tag2' },
    ],
  },
}
```

### Boolean/Tristate Fields

```typescript
// Boolean (true/false only)
{
  key: 'isActive',
  type: 'boolean',
  labelKey: 'filters.isActive',
}

// Tristate (null/true/false - for __isnull filters)
{
  key: 'user__id__isnull',
  type: 'tristate',
  labelKey: 'filters.hasUser',
}
```

### Other Field Types

```typescript
// Slider
{
  key: 'priority',
  type: 'slider',
  labelKey: 'filters.priority',
  options: {
    min: 0,
    max: 10,
    step: 1,
  },
}

// Rating
{
  key: 'rating',
  type: 'rating',
  labelKey: 'filters.rating',
}

// Custom component
{
  key: 'customField',
  type: 'custom',
  labelKey: 'filters.custom',
  options: {
    component: MyCustomComponent,
    componentProps: {
      // Props passed to custom component
    },
  },
}
```

## 🎯 Preset System

### Dropdown Presets

Appear in the main filter button dropdown menu:

```typescript
presets: [
  {
    id: 'all',
    labelKey: 'filters.presets.all',
    icon: 'pi pi-list',
    filters: {},
    descriptionKey: 'filters.presets.allDesc',
  },
  {
    id: 'active',
    labelKey: 'filters.presets.active',
    icon: 'pi pi-check',
    filters: {
      isActive: true,
    },
  },
  // Dynamic preset
  {
    id: 'recent',
    labelKey: 'filters.presets.recent',
    icon: 'pi pi-clock',
    filters: () => ({
      created_at__gte: dayjs().subtract(7, 'days').toISOString(),
    }),
  },
]
```

### Quick Presets

Appear as buttons in the filter dialog:

```typescript
quickPresets: [
  {
    id: 'today',
    labelKey: 'filters.quick.today',
    icon: 'pi pi-calendar',
    severity: 'info',
    filters: () => ({
      created_at__gte: dayjs().startOf('day').toISOString(),
    }),
    clearFields: ['created_at__gte', 'created_at__lte'],
  },
  {
    id: 'clear-dates',
    labelKey: 'filters.quick.clearDates',
    icon: 'pi pi-times',
    severity: 'secondary',
    filters: {},
    clearFields: ['created_at__gte', 'created_at__lte'],
  },
]
```

## 🌍 Localization

### Translation Keys

The component uses a hierarchical translation structure:

```typescript
{
  i18nPrefix: 'employees.filters',
  
  fields: [
    {
      labelKey: 'employees.filters.fields.name',
      // Resolves to: await loc.t('employees.filters.fields.name')
    }
  ],
  
  presets: [
    {
      labelKey: 'employees.filters.presets.all',
      descriptionKey: 'employees.filters.presets.allDescription',
    }
  ]
}
```

### Translation File Structure

```json
{
  "employees": {
    "filters": {
      "title": "Filter Employees",
      "quickFilters": "Quick Filters",
      "presets": {
        "all": "All Employees",
        "allDescription": "Show all employees",
        "active": "Active Only",
        "withUser": "With User Account"
      },
      "quickPresets": {
        "thisWeek": "This Week",
        "thisMonth": "This Month"
      },
      "fields": {
        "name": "Name",
        "namePlaceholder": "Enter name...",
        "email": "Email",
        "hasUser": "User Account"
      },
      "groups": {
        "basic": "Basic Information",
        "contact": "Contact Details",
        "advanced": "Advanced Filters",
        "ungrouped": "General"
      },
      "buttons": {
        "apply": "Apply Filters",
        "cancel": "Cancel",
        "clear": "Clear All"
      }
    }
  },
  "common": {
    "yes": "Yes",
    "no": "No",
    "any": "Any"
  }
}
```

### Reactive Language Switching

```typescript
// Translations update automatically when locale changes
window.addEventListener('locale-changed', (event) => {
  console.log('Switched to:', event.detail.newLocale);
  // Component auto-reloads all translations
});
```

## 💾 Storage & Persistence

### Configuration

```typescript
storage: {
  enabled: true,           // Enable localStorage
  persistPreset: true,     // Save selected preset
  persistCustom: true,     // Save custom filter values
  autoSave: false,         // Save on every change (vs on apply)
}
```

### Storage Keys

```
omnia-filter-{filterId}-preset        // Selected preset ID
omnia-filter-{filterId}-custom        // Custom filter values
```

### Programmatic Access

```typescript
import { useFilterStorage } from '@/v2/components/TableFilter';

const storage = useFilterStorage('employee-filter');

// Get stored preset
const preset = storage.getStoredPreset();

// Get stored filters
const filters = storage.getStoredFilters();

// Save filters
storage.saveFilters({ name: 'John' });

// Clear storage
storage.clearStorage();
```

## 🔧 Utility Functions

### Filter Cleaning

```typescript
import { cleanFilters, isFiltersEmpty } from '@/v2/components/TableFilter';

const filters = { name: '', age: 25, active: undefined };
const cleaned = cleanFilters(filters);
// { age: 25 }

const isEmpty = isFiltersEmpty(filters);
// false (has 'age')
```

### Filter Merging

```typescript
import { mergeFilters } from '@/v2/components/TableFilter';

const base = { name: 'John', age: 25 };
const override = { age: 30, city: 'NYC' };

const merged = mergeFilters(base, override);
// { name: 'John', age: 30, city: 'NYC' }
```

### Filter Comparison

```typescript
import { areFiltersEqual } from '@/v2/components/TableFilter';

const filters1 = { name: 'John', age: 25 };
const filters2 = { age: 25, name: 'John' };

areFiltersEqual(filters1, filters2);
// true
```

### Active Filter Counting

```typescript
import { countActiveFilters } from '@/v2/components/TableFilter';

const filters = { name: 'John', age: undefined, city: '' };
const count = countActiveFilters(filters);
// 1 (only 'name' has a value)
```

### Validation

```typescript
import { validateFilters, validateDateRange } from '@/v2/components/TableFilter';

// Validate all filters against field definitions
const errors = validateFilters(filters, fieldDefinitions);

// Validate date range
const dateError = validateDateRange('2025-01-01', '2024-01-01');
// 'Start date must be before end date'
```

## 🎪 Events

### Main Events

```typescript
// Filter change (emitted on apply)
@change="(filters) => handleChange(filters)"

// Dialog open/close
@dialog-open="handleDialogOpen"
@dialog-close="handleDialogClose"

// Preset selection
@preset-change="(presetId) => handlePresetChange(presetId)"

// Filter clear
@clear="handleClear"
```

### Event Payload Types

```typescript
interface FilterChangeEvent<T> {
  filters: Partial<T>;
  preset: string | null;
  isDefault: boolean;
}
```

## 📊 Complete Example

See [`examples/employeeFilterConfig.ts`](./examples/employeeFilterConfig.ts) for a complete, production-ready example with:

- ✅ Multiple field types
- ✅ Field grouping
- ✅ Static and dynamic presets
- ✅ Quick preset buttons
- ✅ Validation rules
- ✅ Conditional fields
- ✅ Range fields
- ✅ Localization setup
- ✅ Storage configuration

## 🧪 Testing

```bash
# Run all tests
npm run test:filter

# Run specific test file
npm run test -- FilterField.spec.ts

# Watch mode
npm run test:watch
```

Test coverage:
- ✅ Component rendering
- ✅ Field type rendering
- ✅ Preset management
- ✅ Form validation
- ✅ Storage operations
- ✅ Utility functions
- ✅ Localization

## 🔄 Migration from Old Filter

If migrating from a legacy filter implementation:

1. **Convert filter object to config**:
   ```typescript
   // Old
   const filters = ref({ name: '', email: '' });
   
   // New
   const config: TableFilterConfig<Filters> = {
     id: 'my-filter',
     fields: [
       { key: 'name', type: 'text', labelKey: 'filters.name' },
       { key: 'email', type: 'text', labelKey: 'filters.email' },
     ],
   };
   ```

2. **Update event handlers**:
   ```typescript
   // Old
   watch(filters, (newFilters) => {
     fetchData(newFilters);
   });
   
   // New
   <TableFilter @change="fetchData" />
   ```

3. **Add translations**:
   ```json
   {
     "filters": {
       "name": "Name",
       "email": "Email"
     }
   }
   ```

## 📚 Further Reading

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Usage Guide](./USAGE_GUIDE.md) - Step-by-step usage guide
- [Localization README](../../stores/localization/README.md) - Localization service docs
- [PrimeVue Components](https://primevue.org/) - Component library documentation

## 🐛 Troubleshooting

### Filters not persisting

Check storage configuration:
```typescript
storage: {
  enabled: true,
  persistCustom: true,
}
```

### Translations not showing

1. Verify `i18nPrefix` matches translation structure
2. Check translation keys exist in locale files
3. Ensure localization store is initialized

### Date ranges not working

Use proper field naming:
```typescript
{
  key: 'created_at__gte',  // __gte suffix is important
  type: 'dateRange',        // Creates both __gte and __lte
}
```

### Tristate checkbox not clickable

Ensure field type is `'tristate'` not `'boolean'`:
```typescript
{
  key: 'user__id__isnull',
  type: 'tristate',  // Not 'boolean'
}
```

---

**Version**: 3.0  
**Last Updated**: October 27, 2025  
**Maintainer**: Development Team
