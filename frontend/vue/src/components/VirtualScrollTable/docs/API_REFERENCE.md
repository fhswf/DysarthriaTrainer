# API Reference

Complete API reference for VirtualScrollTable component including props, events, slots, exposed methods, and TypeScript types.

## Table of Contents

- [Component Props](#component-props)
- [Events](#events)
- [Slots](#slots)
- [Exposed Methods](#exposed-methods)
- [TypeScript Types](#typescript-types)
- [Column Definition](#column-definition)
- [Action Configuration](#action-configuration)

## Component Props

### Data Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `T[]` | Yes | - | Array of data items (may contain undefined for virtual scrolling) |
| `totalRecords` | `number` | Yes | - | Total number of records in dataset |
| `loading` | `boolean` | Yes | - | Loading state indicator |
| `dataKey` | `string` | Yes | - | Unique identifier field for items (e.g., 'id') |

### Display Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `columns` | `ColumnDefinition[]` | Yes | - | Column configuration array |
| `emptyMessage` | `string` | No | `'No records found'` | Message shown when no data |
| `striped` | `boolean` | No | `false` | Alternating row colors |
| `showGridlines` | `boolean` | No | `false` | Show cell borders |
| `size` | `'small' \| 'normal' \| 'large'` | No | `'normal'` | Row size |

### Virtual Scrolling Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `virtualScrollerHeight` | `string` | No | `'600px'` | Container height (CSS value) |
| `virtualScrollItemSize` | `number` | No | `46` | Row height in pixels |
| `virtualScrollDelay` | `number` | No | `150` | Scroll debounce delay (ms) |

### Selection Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `selection` | `T[]` | No | `[]` | Selected items (v-model:selection) |
| `selectionMode` | `'single' \| 'multiple'` | No | - | Enable selection mode |

### Sorting Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sortField` | `string` | No | - | Current sort field (v-model:sortField) |
| `sortOrder` | `1 \| -1` | No | - | Sort order: 1 = asc, -1 = desc (v-model:sortOrder) |

### Scroll Navigation Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `scrollToIndex` | `number` | No | - | Initial scroll position (row index) |
| `scrollBehavior` | `'auto' \| 'smooth'` | No | `'auto'` | Scroll animation behavior |

### Filter Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filters` | `SimpleFilters \| AdvancedFilters \| CombinedFilters` | No | - | Current filters (v-model:filters) |

### Action Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `actions` | `ActionConfig` | No | - | Action buttons configuration |

### Layout Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `responsiveLayout` | `'scroll' \| 'stack'` | No | `'scroll'` | Responsive behavior |
| `dataTableProps` | `DataTableProps` | No | - | Pass-through props for PrimeVue DataTable |

### Complete Example

```vue
<template>
  <VirtualScrollTable
    v-model:selection="selectedUsers"
    v-model:sort-field="sortField"
    v-model:sort-order="sortOrder"
    v-model:filters="filters"
    :items="users"
    :total-records="totalRecords"
    :loading="loading"
    :columns="columns"
    data-key="id"
    selection-mode="multiple"
    virtual-scroller-height="600px"
    :virtual-scroll-item-size="46"
    :virtual-scroll-delay="150"
    :scroll-to-index="initialScrollIndex"
    scroll-behavior="smooth"
    :striped="true"
    :show-gridlines="false"
    size="normal"
    responsive-layout="scroll"
    empty-message="No users found"
    :actions="{
      view: true,
      edit: true,
      delete: true
    }"
    :data-table-props="{
      resizableColumns: true,
      columnResizeMode: 'fit'
    }"
    @lazy-load="onLazyLoad"
    @sort="onSort"
    @view="onView"
    @edit="onEdit"
    @delete="onDelete"
    @action="onCustomAction"
    @scroll="onScroll"
  />
</template>
```

## Events

### @lazy-load

Emitted when data needs to be loaded (initial load, scroll, filter change, sort).

**Payload:**
```typescript
interface LazyLoadEvent {
  first: number;          // Starting index
  last: number;           // Ending index
  rows: number;           // Number of rows per chunk
  sortField?: string;     // Current sort field
  sortOrder?: 1 | -1;     // Sort order (1 = asc, -1 = desc)
  filters?: SimpleFilters | AdvancedFilters | CombinedFilters;  // Current filters
}
```

**Example:**
```vue
<script setup lang="ts">
const onLazyLoad = async (event: LazyLoadEvent) => {
  loading.value = true;
  
  try {
    const response = await usersApi.list({
      offset: event.first,
      limit: event.rows,
      ordering: event.sortField && event.sortOrder 
        ? `${event.sortOrder === -1 ? '-' : ''}${event.sortField}` 
        : undefined,
      ...event.filters
    });
    
    // Update items array at correct position
    users.value.splice(event.first, event.rows, ...response.results);
    totalRecords.value = response.count;
  } finally {
    loading.value = false;
  }
};
</script>
```

### @sort

Emitted when user clicks sortable column header.

**Payload:**
```typescript
interface SortEvent {
  sortField: string;      // Column field name
  sortOrder: 1 | -1;      // 1 = ascending, -1 = descending
}
```

**Example:**
```vue
<script setup lang="ts">
const onSort = (event: SortEvent) => {
  console.log('Sorting by:', event.sortField, event.sortOrder === 1 ? 'asc' : 'desc');
  
  // Analytics tracking
  analytics.track('table_sorted', {
    field: event.sortField,
    order: event.sortOrder
  });
};
</script>
```

### @view

Emitted when view action button clicked.

**Payload:** `T` (the data item)

**Example:**
```vue
<script setup lang="ts">
const onView = (user: User) => {
  router.push(`/users/${user.id}`);
};
</script>
```

### @edit

Emitted when edit action button clicked.

**Payload:** `T` (the data item)

**Example:**
```vue
<script setup lang="ts">
const onEdit = (user: User) => {
  router.push(`/users/${user.id}/edit`);
};
</script>
```

### @delete

Emitted when delete action button clicked.

**Payload:** `T` (the data item)

**Example:**
```vue
<script setup lang="ts">
const onDelete = async (user: User) => {
  if (confirm(`Delete ${user.username}?`)) {
    await usersApi.delete(user.id);
    toast.success('User deleted');
    // Trigger reload
    reload();
  }
};
</script>
```

### @action

Emitted when custom action button clicked.

**Payload:**
```typescript
interface ActionEvent<T> {
  data: T;              // The data item
  action: string;       // The action command string
}
```

**Example:**
```vue
<script setup lang="ts">
const onCustomAction = ({ data, action }: ActionEvent<User>) => {
  switch (action) {
    case 'reset-password':
      resetPassword(data);
      break;
    case 'impersonate':
      impersonate(data);
      break;
    case 'export':
      exportUser(data);
      break;
  }
};
</script>
```

### @scroll

Emitted when user scrolls the table.

**Payload:**
```typescript
interface ScrollEvent {
  index: number;        // Current visible row index
}
```

**Example:**
```vue
<script setup lang="ts">
const onScroll = ({ index }: ScrollEvent) => {
  // Save scroll position
  localStorage.setItem('tableScrollPosition', String(index));
  
  // Track scroll depth
  const scrollPercent = (index / totalRecords.value) * 100;
  console.log(`Scrolled to ${scrollPercent.toFixed(1)}%`);
};
</script>
```

## Slots

### Column Slots

Dynamic slots for customizing column rendering. Format: `#column-{field}`.

**Props:**
```typescript
interface ColumnSlotProps<T> {
  data: T;                    // Row data
  column: ColumnDefinition;   // Column config
  field: string;              // Field name
  index: number;              // Row index
}
```

**Example:**
```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" ...>
    <!-- Custom status column -->
    <template #column-status="{ data }">
      <Tag 
        :value="data.status" 
        :severity="getStatusSeverity(data.status)"
      />
    </template>
    
    <!-- Custom email column -->
    <template #column-email="{ data, index }">
      <a :href="`mailto:${data.email}`">
        {{ data.email }}
      </a>
    </template>
  </VirtualScrollTable>
</template>
```

### Header Slots

Dynamic slots for customizing column headers. Format: `#header-{field}`.

**Props:**
```typescript
interface HeaderSlotProps {
  column: ColumnDefinition;   // Column config
  field: string;              // Field name
}
```

**Example:**
```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" ...>
    <!-- Custom header with icon -->
    <template #header-email="{ column }">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-envelope"></i>
        <span>{{ column.header }}</span>
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

### #actions

Override entire actions column with custom template.

**Props:**
```typescript
interface ActionsSlotProps<T> {
  data: T;        // Row data
  index: number;  // Row index
}
```

**Example:**
```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" ...>
    <template #actions="{ data }">
      <div class="flex gap-2">
        <Button 
          icon="pi pi-eye" 
          size="small" 
          text 
          @click="viewUser(data)"
        />
        <Button 
          icon="pi pi-pencil" 
          size="small" 
          text 
          @click="editUser(data)"
        />
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

### #empty

Override empty state display.

**Props:** None

**Example:**
```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" ...>
    <template #empty>
      <div class="text-center py-8">
        <i class="pi pi-users text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-2xl mb-2">No Users Found</h3>
        <p class="text-gray-500">Try adjusting your filters</p>
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

### #loading

Override loading indicator display.

**Props:** None

**Example:**
```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" ...>
    <template #loading>
      <div class="text-center py-8">
        <ProgressSpinner />
        <p class="mt-4 text-gray-500">Loading users...</p>
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

## Exposed Methods

Access via template ref.

```vue
<script setup lang="ts">
import type { VirtualScrollTable } from '@/v2/components/VirtualScrollTable';

const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();
</script>
```

### Selection Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `selectAllLoaded()` | `() => void` | Select all loaded items |
| `deselectAll()` | `() => void` | Clear all selections |
| `toggleAllLoaded()` | `() => void` | Toggle selection of all loaded items |

### Scroll Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `scrollToIndex(index, behavior?)` | `(index: number, behavior?: ScrollBehavior) => void` | Scroll to specific row index |
| `scrollToItem(keyValue, behavior?)` | `(keyValue: any, behavior?: ScrollBehavior) => void` | Scroll to item by data key value |
| `scrollToTop(behavior?)` | `(behavior?: ScrollBehavior) => void` | Scroll to first row |
| `scrollToBottom(behavior?)` | `(behavior?: ScrollBehavior) => void` | Scroll to last row |

### Exposed Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasSelection` | `ComputedRef<boolean>` | True if any items selected |
| `selectionCount` | `ComputedRef<number>` | Number of selected items |
| `allLoadedSelected` | `ComputedRef<boolean>` | True if all loaded items selected |
| `loadedItemsCount` | `ComputedRef<number>` | Number of loaded items (non-undefined) |

### Usage Example

```vue
<template>
  <div class="controls">
    <Button @click="selectAll">Select All</Button>
    <Button @click="deselectAll">Deselect All</Button>
    <Button @click="scrollToTop">Top</Button>
    <Button @click="scrollToBottom">Bottom</Button>
  </div>
  
  <div class="info">
    Selected: {{ tableRef?.selectionCount }} / {{ tableRef?.loadedItemsCount }}
  </div>
  
  <VirtualScrollTable ref="tableRef" ... />
</template>

<script setup lang="ts">
const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();

const selectAll = () => tableRef.value?.selectAllLoaded();
const deselectAll = () => tableRef.value?.deselectAll();
const scrollToTop = () => tableRef.value?.scrollToTop('smooth');
const scrollToBottom = () => tableRef.value?.scrollToBottom('smooth');
</script>
```

## TypeScript Types

### ColumnDefinition

```typescript
interface ColumnDefinition {
  field: string;              // Data field name (required)
  header: string;             // Display header text (required)
  sortable?: boolean;         // Enable sorting (default: false)
  
  // Styling
  style?: string;             // Column CSS style
  class?: string;             // Column CSS class
  headerStyle?: string;       // Header cell CSS style
  headerClass?: string;       // Header cell CSS class
  bodyStyle?: string;         // Body cell CSS style
  bodyClass?: string;         // Body cell CSS class
}
```

### SimpleFilters

Key-value pairs for exact matches.

```typescript
interface SimpleFilters {
  [key: string]: string | number | boolean | null;
}

// Example
const filters: SimpleFilters = {
  username: 'john',
  is_active: true,
  role_id: 5
};
```

### AdvancedFilters

Filters with specific operators.

```typescript
interface AdvancedFilters {
  [key: string]: {
    value: any;
    matchMode: DRFFilterOperator;
  };
}

type DRFFilterOperator =
  // String operators
  | 'exact' | 'iexact' | 'contains' | 'icontains' 
  | 'startswith' | 'istartswith' | 'endswith' | 'iendswith'
  | 'regex' | 'iregex'
  // Numeric operators
  | 'gt' | 'gte' | 'lt' | 'lte' | 'range'
  // List operator
  | 'in'
  // Boolean operator
  | 'isnull'
  // Date/time operators
  | 'date' | 'year' | 'month' | 'day' | 'week' | 'week_day'
  | 'quarter' | 'time';

// Example
const filters: AdvancedFilters = {
  username: {
    value: 'john',
    matchMode: 'icontains'
  },
  created_at: {
    value: ['2024-01-01', '2024-12-31'],
    matchMode: 'range'
  }
};
```

### CombinedFilters

Combine simple and advanced filters.

```typescript
interface CombinedFilters {
  simple: SimpleFilters;
  advanced: AdvancedFilters;
}

// Example
const filters: CombinedFilters = {
  simple: {
    is_active: true,
    role_id: 5
  },
  advanced: {
    username: {
      value: 'john',
      matchMode: 'icontains'
    },
    created_at: {
      value: '2024-01-01',
      matchMode: 'gte'
    }
  }
};
```

### ActionConfig

Configuration for action buttons.

```typescript
interface ActionConfig {
  view?: boolean;                    // Show view button (default: false)
  edit?: boolean;                    // Show edit button (default: false)
  delete?: boolean;                  // Show delete button (default: false)
  custom?: CustomAction[];           // Custom action buttons (default: [])
}

interface CustomAction {
  label: string;                     // Button label (required)
  icon: string;                      // PrimeVue icon class (required)
  command: string;                   // Action identifier (required)
  severity?: string;                 // Button severity (optional)
  visible?: (data: T) => boolean;    // Conditional visibility (optional)
}

// Example
const actions: ActionConfig = {
  view: true,
  edit: true,
  delete: true,
  custom: [
    {
      label: 'Reset Password',
      icon: 'pi pi-key',
      command: 'reset-password',
      severity: 'warning'
    },
    {
      label: 'Impersonate',
      icon: 'pi pi-user',
      command: 'impersonate',
      severity: 'info',
      visible: (user) => user.role !== 'admin'
    }
  ]
};
```

## Column Definition

### Basic Definition

```typescript
const columns: ColumnDefinition[] = [
  { field: 'id', header: 'ID', sortable: true },
  { field: 'username', header: 'Username', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
  { field: 'created_at', header: 'Created', sortable: true },
];
```

### Styled Definition

```typescript
const columns: ColumnDefinition[] = [
  {
    field: 'username',
    header: 'Username',
    sortable: true,
    style: 'min-width: 200px',
    headerClass: 'font-bold',
    bodyClass: 'font-mono'
  },
  {
    field: 'status',
    header: 'Status',
    style: 'width: 120px; text-align: center',
    bodyStyle: 'padding: 0.5rem'
  },
  {
    field: 'created_at',
    header: 'Created',
    sortable: true,
    style: 'width: 180px',
    headerStyle: 'background-color: var(--surface-100)'
  }
];
```

### Using Localization Helper

```typescript
import { useVirtualScrollTableColumns } from '@/v2/components/VirtualScrollTable';
import { useLocalizationStore } from '@/v2/stores/localization';

const localizationStore = useLocalizationStore();
const { createColumns } = useVirtualScrollTableColumns('users', localizationStore);

// Simple fields (auto-translated headers)
const columns = createColumns([
  'username',
  'email',
  'created_at'
]);

// With options
const columns = createColumns([
  { field: 'username', options: { sortable: true } },
  { field: 'email', options: { sortable: true } },
  { field: 'is_active', options: { sortable: false, style: 'width: 100px' } }
]);
```

## Action Configuration

### Built-in Actions Only

```typescript
const actions: ActionConfig = {
  view: true,
  edit: true,
  delete: true
};
```

### Custom Actions Only

```typescript
const actions: ActionConfig = {
  custom: [
    {
      label: 'Export',
      icon: 'pi pi-download',
      command: 'export'
    },
    {
      label: 'Archive',
      icon: 'pi pi-archive',
      command: 'archive',
      severity: 'warning'
    }
  ]
};
```

### Mixed Actions

```typescript
const actions: ActionConfig = {
  view: true,
  edit: true,
  custom: [
    {
      label: 'Reset Password',
      icon: 'pi pi-key',
      command: 'reset-password',
      severity: 'warning'
    },
    {
      label: 'Impersonate',
      icon: 'pi pi-user',
      command: 'impersonate',
      severity: 'info',
      visible: (user) => user.role !== 'admin' && user.is_active
    }
  ]
};
```

---

**Last Updated:** 2025-01-18  
**Component Version:** 2.0.0  
**API:** Complete Reference for Props, Events, Slots, Methods, Types
