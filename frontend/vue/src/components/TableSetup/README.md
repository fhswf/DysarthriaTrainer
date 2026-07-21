# TableSetup Component

A high-level composite component that dramatically reduces CRUD table boilerplate by integrating **TableToolbar**, **TableFilter**, and **VirtualScrollTable** into a single, easy-to-configure component.

## 📊 Code Reduction

- **Before**: ~1,145 lines across 7 files
- **After**: ~60-80 lines in 1 component
- **Reduction**: 93% less boilerplate

## ✨ Features

- 🔍 **Integrated Search** - Full-text search with debounce
- 🎯 **Advanced Filtering** - TableFilter component integration (13 field types)
- 📄 **Virtual Scrolling** - Efficient rendering of large datasets
- 💾 **Session Storage** - Persists search, sort, and scroll position
- 🌍 **Full i18n** - Async translation for all labels
- ⚡ **TypeScript** - Full type safety with generics
- 🎨 **Customizable** - Extensive slot support
- 🔄 **CRUD Actions** - Built-in create, view, edit, delete support
- 📤 **Export** - Data export with current filters
- ✅ **Confirmation Dialogs** - Safe delete operations

## 📦 Installation

```typescript
import { TableSetup } from '@/v2/components/TableSetup';
import type { TableSetupProps } from '@/v2/components/TableSetup';
```

## 🚀 Quick Start

### Basic Usage

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    data-key="id"
    i18n-key="employees"
    @create="handleCreate"
    @view="handleView"
    @edit="handleEdit"
  />
</template>

<script setup lang="ts">
import { TableSetup } from '@/v2/components/TableSetup';
import type { TableColumnDefinition } from '@/v2/components/TableSetup';
import type { Employee } from '@/types/employee';

// API Service (implements TableApiService interface)
const employeeService = {
  list: async (params) => {
    const response = await api.get('/employees', { params });
    return {
      results: response.data.results,
      count: response.data.count,
    };
  },
  delete: async (id) => {
    await api.delete(`/employees/${id}`);
  },
};

// Column definitions
const columns: TableColumnDefinition[] = [
  { field: 'id', headerKey: 'id', sortable: true },
  { field: 'firstName', headerKey: 'firstName', sortable: true },
  { field: 'lastName', headerKey: 'lastName', sortable: true },
  { field: 'email', headerKey: 'email', sortable: false },
  { 
    field: 'status', 
    headerKey: 'status', 
    sortable: true,
    format: (value) => value ? 'Active' : 'Inactive'
  },
];

// Event handlers
function handleCreate() {
  // Navigate to create form or open dialog
}

function handleView(employee: Employee) {
  // Navigate to detail view
}

function handleEdit(employee: Employee) {
  // Navigate to edit form or open dialog
}
</script>
```

### With Advanced Filtering

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    :filter-config="filterConfig"
    data-key="id"
    i18n-key="employees"
    @create="handleCreate"
    @filters-changed="handleFiltersChanged"
  />
</template>

<script setup lang="ts">
import { TableSetup } from '@/v2/components/TableSetup';
import type { TableFilterConfig } from '@/v2/components/TableFilter';

// Filter configuration
const filterConfig: TableFilterConfig = {
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'department',
      label: 'Department',
      type: 'multiselect',
      options: departmentOptions.value,
    },
    {
      name: 'hireDate',
      label: 'Hire Date',
      type: 'date-range',
    },
  ],
  presets: [
    {
      id: 'active',
      label: 'Active Employees',
      icon: 'pi-check-circle',
      filters: { status: 'active' },
    },
  ],
  storageKey: 'employee-filters',
  i18nKey: 'employees.filters',
};

function handleFiltersChanged(filters: Record<string, any>) {
  console.log('Active filters:', filters);
}
</script>
```

### Custom Column Slots

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    data-key="id"
    i18n-key="employees"
  >
    <!-- Custom avatar column -->
    <template #column-avatar="{ data }">
      <Avatar
        :image="data.avatarUrl"
        :label="data.firstName[0] + data.lastName[0]"
        shape="circle"
      />
    </template>

    <!-- Custom status column with badge -->
    <template #column-status="{ value }">
      <Tag
        :value="value ? 'Active' : 'Inactive'"
        :severity="value ? 'success' : 'danger'"
      />
    </template>

    <!-- Custom actions -->
    <template #column-actions="{ data }">
      <Button
        icon="pi pi-envelope"
        text
        size="small"
        @click="sendEmail(data)"
      />
      <Button
        icon="pi pi-download"
        text
        size="small"
        @click="downloadContract(data)"
      />
    </template>
  </TableSetup>
</template>
```

### Custom Empty State

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    data-key="id"
    i18n-key="employees"
  >
    <template #empty="{ isFiltered, onClearFilters, onCreate }">
      <div class="text-center py-12">
        <img src="/empty-employees.svg" alt="No employees" class="w-48 mx-auto mb-4" />
        <h3 class="text-xl font-semibold mb-2">
          {{ isFiltered ? 'No results found' : 'No employees yet' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ isFiltered 
            ? 'Try adjusting your search or filters' 
            : 'Get started by adding your first employee' 
          }}
        </p>
        <div class="flex gap-2 justify-center">
          <Button
            v-if="isFiltered"
            label="Clear Filters"
            icon="pi pi-filter-slash"
            @click="onClearFilters"
          />
          <Button
            label="Add Employee"
            icon="pi pi-plus"
            @click="onCreate"
          />
        </div>
      </div>
    </template>
  </TableSetup>
</template>
```

### Feature Customization

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    :features="{
      search: true,
      filters: true,
      sort: true,
      refresh: true,
      export: false,        // Disable export
      create: true,
      deleteAll: true,      // Enable bulk delete
      viewAction: true,
      editAction: true,
      deleteAction: false,  // Hide delete button
    }"
    data-key="id"
    i18n-key="employees"
  />
</template>
```

### Table Configuration

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    :table-config="{
      rowHeight: 60,
      scrollHeight: '600px',
      striped: false,
      size: 'normal',
      selectionMode: 'single',  // or 'multiple'
    }"
    data-key="id"
    i18n-key="employees"
  />
</template>
```

### Initial State

```vue
<template>
  <TableSetup
    :api-service="employeeService"
    :columns="columns"
    :initial-state="{
      searchQuery: 'John',
      sortField: 'lastName',
      sortOrder: -1,  // Descending
    }"
    data-key="id"
    i18n-key="employees"
  />
</template>
```

## 📋 Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `apiService` | `TableApiService<T>` | API service with list() and delete() methods |
| `columns` | `TableColumnDefinition[]` | Column definitions |
| `dataKey` | `string` | Unique identifier field (e.g., 'id') |
| `i18nKey` | `string` | Base key for translations (e.g., 'employees') |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filterConfig` | `TableFilterConfig` | `undefined` | TableFilter configuration |
| `storageKey` | `string` | `table-setup:{i18nKey}` | Session storage key |
| `features` | `TableFeatures` | All enabled | Feature flags |
| `tableConfig` | `TableConfig` | Default config | Table display configuration |
| `initialState` | `TableInitialState` | `{}` | Initial search/sort state |

### TableApiService Interface

```typescript
interface TableApiService<T> {
  list(params: {
    offset?: number;
    limit?: number;
    sort?: string;
    search?: string;
    [key: string]: any;  // Additional filter params
  }): Promise<{ results: T[]; count: number }>;
  
  delete?(id: string | number): Promise<void>;
}
```

### TableColumnDefinition

```typescript
interface TableColumnDefinition {
  field: string;              // Data field name
  headerKey: string;          // Translation key (or full key with dots)
  sortable: boolean;          // Enable sorting
  format?: (value: any, row: any) => string;  // Custom formatter
  width?: string;             // Column width
  align?: 'left' | 'center' | 'right';
}
```

### TableFeatures

```typescript
interface TableFeatures {
  search?: boolean;           // Show search bar (default: true)
  filters?: boolean;          // Show filters (default: true)
  sort?: boolean;             // Enable sorting (default: true)
  refresh?: boolean;          // Show refresh button (default: true)
  export?: boolean;           // Show export button (default: true)
  create?: boolean;           // Show create button (default: true)
  deleteAll?: boolean;        // Show delete all button (default: false)
  viewAction?: boolean;       // Show view action (default: true)
  editAction?: boolean;       // Show edit action (default: true)
  deleteAction?: boolean;     // Show delete action (default: true)
}
```

### TableConfig

```typescript
interface TableConfig {
  rowHeight?: number;         // Row height in pixels (default: 50)
  scrollHeight?: string;      // Scroll container height (default: calc(100vh - 250px))
  striped?: boolean;          // Striped rows (default: true)
  size?: 'small' | 'normal' | 'large';  // Table size (default: small)
  selectionMode?: 'single' | 'multiple';  // Selection mode (default: multiple)
}
```

## 🎯 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `create` | `void` | Create button clicked |
| `view` | `T` | View action clicked |
| `edit` | `T` | Edit action clicked |
| `export` | `T[]` | Export button clicked (all filtered data) |
| `delete-all` | `T[]` | Delete all confirmed (selected items) |
| `update:selection` | `T[]` | Selection changed |
| `filters-changed` | `Record<string, any>` | Filters applied |
| `data-loaded` | `T[]` | Data loaded from API |
| `error` | `Error` | Error occurred |

## 🎨 Slots

| Slot | Props | Description |
|------|-------|-------------|
| `toolbar` | All toolbar props | Replace entire toolbar |
| `filter` | - | Custom filter component |
| `toolbar-actions-prepend` | - | Actions before standard buttons |
| `toolbar-actions-append` | - | Actions after standard buttons |
| `column-{field}` | `{ value, data, index }` | Custom cell content |
| `empty` | `{ isFiltered, onClearFilters, onCreate }` | Custom empty state |

## 🌍 Translation Keys

Required translation structure (example for `i18nKey="employees"`):

```json
{
  "employees": {
    "title": "Employees",
    "search": {
      "placeholder": "Search employees..."
    },
    "columns": {
      "id": "ID",
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email",
      "status": "Status"
    },
    "emptyState": {
      "title": "No employees yet",
      "description": "Get started by adding your first employee",
      "descriptionFiltered": "No employees match your search or filters",
      "clearFilters": "Clear Filters",
      "action": "Add Employee"
    },
    "confirmDelete": {
      "title": "Confirm Delete",
      "message": "Are you sure you want to delete this employee?"
    },
    "confirmDeleteAll": {
      "title": "Confirm Delete All",
      "message": "Are you sure you want to delete {count} employees?"
    },
    "messages": {
      "deleteSuccess": "Employee deleted successfully",
      "exportSuccess": "Data exported successfully"
    },
    "errors": {
      "deleteFailed": "Failed to delete employee",
      "exportFailed": "Failed to export data"
    }
  }
}
```

You can use full translation keys in columns:

```typescript
const columns = [
  { field: 'id', headerKey: 'common.labels.id', sortable: true },
  { field: 'name', headerKey: 'employees.columns.name', sortable: true },
];
```

## 💾 Session Storage

The component automatically persists:
- Search query
- Sort field and order
- Scroll position

Storage key format: `table-setup:{i18nKey}` (or custom via `storageKey` prop)

Clear storage programmatically:

```typescript
import { useTableSetupStorage } from '@/v2/components/TableSetup';

const storage = useTableSetupStorage('table-setup:employees');
storage.clearState();
```

## 🔄 Programmatic Control

Access the component instance:

```vue
<template>
  <TableSetup
    ref="tableRef"
    :api-service="employeeService"
    :columns="columns"
    data-key="id"
    i18n-key="employees"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tableRef = ref();

// Refresh data
function refreshData() {
  tableRef.value?.refresh();
}

// Reset table (clears filters, search, sort)
function resetTable() {
  tableRef.value?.reset();
}
</script>
```

## 🧪 Testing

Example unit test:

```typescript
import { mount } from '@vue/test-utils';
import TableSetup from '@/v2/components/TableSetup/TableSetup.vue';

describe('TableSetup', () => {
  const mockApiService = {
    list: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const columns = [
    { field: 'id', headerKey: 'id', sortable: true },
    { field: 'name', headerKey: 'name', sortable: true },
  ];

  it('renders with required props', () => {
    const wrapper = mount(TableSetup, {
      props: {
        apiService: mockApiService,
        columns,
        dataKey: 'id',
        i18nKey: 'test',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('emits create event when create button clicked', async () => {
    const wrapper = mount(TableSetup, {
      props: {
        apiService: mockApiService,
        columns,
        dataKey: 'id',
        i18nKey: 'test',
      },
    });

    // Trigger create
    await wrapper.vm.handleCreate();
    
    expect(wrapper.emitted('create')).toBeTruthy();
  });
});
```

## 📚 Related Components

- [TableToolbar](../TableToolbar/README.md) - Toolbar with search and actions
- [TableFilter](../TableFilter/README.md) - Advanced filtering component
- [VirtualScrollTable](../VirtualScrollTable/README.md) - Virtual scrolling data table

## 🎯 Best Practices

1. **Use TypeScript generics** for type safety:
   ```typescript
   <TableSetup<Employee> ... />
   ```

2. **Keep column formatters simple**:
   ```typescript
   { 
     field: 'status', 
     format: (value) => value ? 'Active' : 'Inactive' 
   }
   ```

3. **Use slots for complex rendering**:
   ```vue
   <template #column-avatar="{ data }">
     <Avatar :image="data.avatar" />
   </template>
   ```

4. **Provide meaningful i18n keys**:
   ```typescript
   i18nKey="modules.employees.list"
   ```

5. **Handle errors gracefully**:
   ```vue
   @error="handleError"
   ```

## 🐛 Troubleshooting

### Filters not working
- Ensure `filterConfig` is provided
- Check `features.filters` is not false
- Verify API service accepts filter parameters

### Data not loading
- Check API service returns `{ results: T[], count: number }`
- Verify network requests in DevTools
- Check console for errors

### Translations missing
- Ensure all required translation keys exist
- Check `i18nKey` matches your translation structure
- Use full keys for columns if needed: `headerKey: "common.labels.id"`

### Session storage not persisting
- Check `storageKey` is unique
- Verify browser allows sessionStorage
- Clear storage if corrupted: `storage.clearState()`

## 📄 License

Part of the Omnia Pflege Next application.
