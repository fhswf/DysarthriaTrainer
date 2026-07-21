# VirtualScrollTable Component

> **🚀 V2 Implementation Active** - Now using store-based pager with zero race conditions!  
> See [V2_IMPLEMENTATION.md](./V2_IMPLEMENTATION.md) for details on the new architecture.

A high-performance virtual scrolling table component built on PrimeVue DataTable with intelligent chunked lazy loading, advanced filtering, and comprehensive TypeScript support.

> **⚡ Performance:** Efficiently handles 100K+ records with minimal memory footprint  
> **🎯 Smart Loading:** Store-based pager with promise caching and automatic deduplication  
> **🔧 Developer-Friendly:** Composable architecture, full TypeScript generics, extensive customization  
> **🛡️ Race-Free:** No setTimeout-based loading, immune to component unmount issues

## Quick Start

### Basic Usage

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="handleLazyLoad"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VirtualScrollTable, useVirtualScrollTableData } from '@/v2/components/VirtualScrollTable';

interface User {
  id: number;
  username: string;
  email: string;
}

const columns = [
  { field: 'username', header: 'Username', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
];

const {
  items: users,
  loading,
  totalRecords,
  handleLazyLoad,
} = useVirtualScrollTableData<User>({
  fetchFunction: async (params) => {
    const response = await fetch(`/api/users?offset=${params.offset}&limit=${params.limit}`);
    const data = await response.json();
    return { items: data.results, total: data.count };
  },
  chunkSize: 50,
});
</script>
```

## Core Concepts

### Virtual Scrolling
- **DOM Rendering:** Only renders visible rows (~20-30 items)
- **Performance:** Handles 100K+ records with constant memory usage
- **Scroll Position:** Tracks first/last visible row indices

### Chunked Lazy Loading
- **Smart Chunks:** Loads data in configurable chunks (default: 50 items)
- **Prefetching:** Loads ahead when scrolling near chunk boundaries
- **Request Management:** Automatic cancellation of stale requests
- **Race Condition Safe:** Prevents out-of-order data updates

### Composable Architecture
The component uses Vue 3 composables for modular functionality:
- **`useVirtualScrollTableData`** - Data fetching and chunk management
- **`useVirtualScrollManagement`** - Scroll event handling
- **`useVirtualScrollSelection`** - Row selection logic
- **`useVirtualScrollNavigation`** - Programmatic scrolling
- **`useSessionStorage`** - State persistence

## Common Use Cases

### With Sorting

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    :sort-field="sortField"
    :sort-order="sortOrder"
    data-key="id"
    @sort="handleSort"
    @lazy-load="handleLazyLoad"
  />
</template>

<script setup lang="ts">
const sortField = ref('username');
const sortOrder = ref<1 | -1>(1);

const handleSort = (event: any) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
};
</script>
```

### With Selection

```vue
<template>
  <VirtualScrollTable
    v-model:selection="selectedUsers"
    :items="users"
    :total-records="totalRecords"
    :columns="columns"
    selection-mode="multiple"
    data-key="id"
    @lazy-load="handleLazyLoad"
  />
</template>

<script setup lang="ts">
const selectedUsers = ref<User[]>([]);
</script>
```

### With Actions

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    :actions="{ view: true, edit: true, delete: true }"
    data-key="id"
    @view="handleView"
    @edit="handleEdit"
    @delete="handleDelete"
    @lazy-load="handleLazyLoad"
  />
</template>

<script setup lang="ts">
const handleView = (user: User) => console.log('View', user);
const handleEdit = (user: User) => console.log('Edit', user);
const handleDelete = (user: User) => console.log('Delete', user);
</script>
```

### With Session Storage

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    :session-storage="{
      storageKey: 'user-table',
      persistScroll: true,
      persistSearch: true,
      persistFilters: true,
      persistSort: true,
    }"
    data-key="id"
    @lazy-load="handleLazyLoad"
  />
</template>
```

**📖 See [SESSION_STORAGE.md](./docs/SESSION_STORAGE.md) for detailed guide**

### With Custom Column Slots

```vue
<template>
  <VirtualScrollTable :items="users" :columns="columns" data-key="id">
    <template #column-status="{ data }">
      <Badge :severity="data.is_active ? 'success' : 'danger'">
        {{ data.is_active ? 'Active' : 'Inactive' }}
      </Badge>
    </template>
    
    <template #column-avatar="{ data }">
      <Avatar :image="data.avatar_url" shape="circle" />
    </template>
  </VirtualScrollTable>
</template>
```

### Programmatic Scrolling

```vue
<template>
  <VirtualScrollTable ref="tableRef" :items="users" :columns="columns" data-key="id" />
  <Button @click="scrollToRow(100)">Jump to Row 100</Button>
</template>

<script setup lang="ts">
const tableRef = ref();

const scrollToRow = (index: number) => {
  tableRef.value?.scrollToIndex(index, 'smooth');
};
</script>
```

## Key Features

### Performance
- ✅ Handles 100K+ records smoothly
- ✅ Constant memory usage (only renders visible rows)
- ✅ Intelligent chunk prefetching
- ✅ Request cancellation for fast navigation
- ✅ Debounced scroll handling

**📖 See [PERFORMANCE.md](./docs/PERFORMANCE.md) for benchmarks**

### Advanced Filtering
- ✅ Simple filters (exact match)
- ✅ Advanced filters (Django-style: `__icontains`, `__gte`, `__range`, etc.)
- ✅ Multiple filter combinations
- ✅ Type-safe filter builder

**📖 See [FILTER_SYSTEM.md](./docs/FILTER_SYSTEM.md) for filter syntax**

### Selection System
- ✅ Single or multiple selection
- ✅ Select/deselect all loaded items
- ✅ Selection persistence across navigation
- ✅ Works correctly with virtual scrolling (no undefined items)

### Navigation & Scrolling
- ✅ Scroll to specific row by index
- ✅ Scroll to item by ID
- ✅ Smooth or instant scroll behavior
- ✅ Progress bar showing scroll position

### Customization
- ✅ Custom column templates (slots)
- ✅ Custom action buttons
- ✅ Custom empty state
- ✅ Custom loading overlay
- ✅ Flexible styling with PrimeVue theming

### State Persistence
- ✅ Automatic scroll position restoration
- ✅ Filter/sort/search state persistence
- ✅ Configurable per-feature persistence
- ✅ SSR-safe implementation

**📖 See [SESSION_STORAGE.md](./docs/SESSION_STORAGE.md) for configuration**

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `(T \| undefined)[]` | Yes | - | Array of items to display |
| `loading` | `boolean` | Yes | - | Loading state |
| `totalRecords` | `number` | Yes | - | Total number of records |
| `columns` | `ColumnDefinition[]` | Yes | - | Column configurations |
| `dataKey` | `string` | Yes | - | Unique identifier field |
| `rowHeight` | `number` | No | `53` | Height of each row in pixels |
| `scrollHeight` | `string` | No | `'100%'` | Table container height |
| `selectionMode` | `'single' \| 'multiple' \| 'none'` | No | `'none'` | Selection mode |
| `selection` | `T[]` | No | `[]` | Selected items (v-model) |
| `actions` | `ActionConfig` | No | - | Action button configuration |
| `sortField` | `string` | No | - | Current sort field |
| `sortOrder` | `1 \| -1` | No | - | Sort direction |
| `showProgressBar` | `boolean` | No | `false` | Show scroll progress bar |
| `sessionStorage` | `SessionStorageConfig` | No | - | Session storage configuration |

**📖 See [API_REFERENCE.md](./docs/API_REFERENCE.md) for complete API**

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `lazy-load` | `{ first: number, last: number, sortField?, sortOrder? }` | Triggered when new data needs loading |
| `update:selection` | `T[]` | Selection changed |
| `sort` | `{ sortField: string, sortOrder: 1 \| -1 }` | Sort changed |
| `scroll-index-change` | `{ first: number, last: number }` | Visible row range changed |
| `view` | `T` | View action clicked |
| `edit` | `T` | Edit action clicked |
| `delete` | `T` | Delete action clicked |
| `action` | `{ action: string, item: T }` | Custom action clicked |

## Composables

### useVirtualScrollTableData

Main composable for data management:

```typescript
const {
  items,              // Ref<(T | undefined)[]>
  loading,            // Ref<boolean>
  totalRecords,       // Ref<number>
  handleLazyLoad,     // (event: LazyLoadEvent) => Promise<void>
  handleFilterChange, // () => void
  reset,              // () => void
} = useVirtualScrollTableData<User>({
  fetchFunction: async (params) => {
    // Your API call
    return { items: [...], total: 1000 };
  },
  chunkSize: 50,
  sortField: ref('username'),
  sortOrder: ref(1),
  simpleFilters: ref({}),
});
```

**📖 See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for composable details**

## Utilities

### Column Formatters

```typescript
import { formatColumnValue } from '@/v2/components/VirtualScrollTable';

const formatted = formatColumnValue(value, column);
// Handles null, boolean, Date, custom formatters
```

### Filter Processor

```typescript
import { buildParams } from '@/v2/components/VirtualScrollTable';

const params = buildParams({
  offset: 0,
  limit: 50,
  sortField: 'username',
  sortOrder: 1,
  simpleFilters: { is_active: true },
  advancedFilters: [
    { field: 'username', operator: 'icontains', value: 'john' }
  ],
});
// Returns: { offset: 0, limit: 50, ordering: 'username', is_active: true, username__icontains: 'john' }
```

## Troubleshooting

### Items not loading
- ✅ Ensure `lazy-load` event is connected
- ✅ Check `fetchFunction` returns `{ items, total }`
- ✅ Verify `dataKey` matches your data structure

### No data after scroll
- ✅ Check chunk boundaries (offset/limit calculation)
- ✅ Verify API pagination is correct
- ✅ Check browser console for errors

### Selection issues
- ✅ Ensure `dataKey` is unique
- ✅ Use `v-model:selection` for two-way binding
- ✅ Check items are fully loaded (not undefined)

### Performance issues
- ✅ Reduce `chunkSize` if memory is limited
- ✅ Ensure `rowHeight` matches actual row height
- ✅ Disable `showProgressBar` if not needed
- ✅ Check for expensive column slot computations

## Documentation

### Comprehensive Guides
- **[📚 API Reference](./docs/API_REFERENCE.md)** - Complete prop/event/method documentation
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - Component structure and composables
- **[✨ Features](./docs/FEATURES.md)** - Feature overview and examples
- **[🔍 Filter System](./docs/FILTER_SYSTEM.md)** - Advanced filtering guide
- **[⚡ Performance](./docs/PERFORMANCE.md)** - Optimization and benchmarks
- **[💾 Session Storage](./docs/SESSION_STORAGE.md)** - State persistence guide

### Refactoring Documentation
- **[✅ Refactoring Checklist](./REFACTORING_CHECKLIST.md)** - Verification checklist
- **[📋 Refactoring Complete](./REFACTORING_COMPLETE.md)** - Summary report
- **[📊 Refactoring Final Report](./REFACTORING_FINAL_REPORT.md)** - Metrics and status

## TypeScript Support

Full TypeScript generics support:

```typescript
interface User {
  id: number;
  username: string;
  email: string;
}

// Type-safe throughout
const { items, handleLazyLoad } = useVirtualScrollTableData<User>({...});
// items is typed as Ref<(User | undefined)[]>
```

## Examples

See `example.ts` for complete working examples including:
- Basic usage
- With sorting and filtering
- With selection
- With custom actions
- With session storage
- Multiple tables on one page

## License

Part of the Omnia Pflege Next project.

---

**Need help?** Check the [comprehensive documentation](./docs/) or see [example.ts](./example.ts) for working code samples.
