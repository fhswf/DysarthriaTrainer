# Session Storage Guide

The VirtualScrollTable provides comprehensive session storage capabilities to preserve user state across page navigation and browser refreshes. This significantly improves user experience by allowing users to return exactly where they left off.

## Architecture

The session storage system uses a **split architecture** for optimal flexibility:

1. **VirtualScrollTable Component** - Manages scroll position (tightly coupled to scrolling internals)
2. **Parent Composables** - Manage search, sort, and filters (application-specific logic)

Both use the same `storageKey` to ensure coordinated state management.

## Quick Start

### Minimal Setup (Scroll Only)

```vue
<VirtualScrollTable
  :items="users"
  :total-records="totalRecords"
  :columns="columns"
  data-key="id"
  :session-storage="{ storageKey: 'user-table' }"
  @lazy-load="handleLazyLoad"
/>
```

### Full Setup (Scroll + Search + Sort)

**1. Table Component:**
```vue
<VirtualScrollTable
  :items="users"
  :total-records="totalRecords"
  :columns="columns"
  data-key="id"
  :session-storage="{
    storageKey: 'user-table',
    persistScroll: true,
    debounceDelay: 300
  }"
  @lazy-load="handleLazyLoad"
/>
```

**2. Data Composable:**
```typescript
// composables/useUserTableData.ts
import { ref } from 'vue';
import { useSessionStorage } from '@/v2/components/VirtualScrollTable';

export const useUserTableData = () => {
  const searchQuery = ref('');
  const sortField = ref('username');
  const sortOrder = ref<1 | -1>(1);

  // Automatic persistence with watchers
  useSessionStorage(
    {
      storageKey: 'user-table',  // Same key as VirtualScrollTable
      persistSearch: true,
      persistSort: true,
    },
    {
      search: searchQuery,
      sortField: sortField,
      sortOrder: sortOrder,
    }
  );

  // State automatically loaded on mount and saved on change
  return { searchQuery, sortField, sortOrder };
};
```

## Configuration Reference

```typescript
interface SessionStorageConfig {
  /**
   * Unique storage key for this table instance
   * Used as prefix for all storage keys
   * REQUIRED
   */
  storageKey: string;

  /**
   * Enable/disable search query persistence
   * @default true
   */
  persistSearch?: boolean;

  /**
   * Enable/disable scroll position persistence
   * @default true
   */
  persistScroll?: boolean;

  /**
   * Enable/disable sort state persistence
   * @default false
   */
  persistSort?: boolean;

  /**
   * Enable/disable filters persistence
   * @default false
   */
  persistFilters?: boolean;

  /**
   * Debounce delay for saving state (ms)
   * Prevents excessive storage writes
   * @default 300
   */
  debounceDelay?: number;
}
```

## Manual State Management

For advanced use cases, you can manually control state:

```typescript
const { loadState, saveState, clearStorage } = useSessionStorage(
  { storageKey: 'user-table' },
  // No state refs = manual mode
);

// Manually load state
const savedState = loadState();
if (savedState.search) {
  searchQuery.value = savedState.search;
}

// Manually save state
saveState({
  search: searchQuery.value,
  scrollPosition: currentScrollIndex.value,
  sortField: sortField.value,
  sortOrder: sortOrder.value,
});

// Clear all stored state
clearStorage();
```

## Storage Keys

Session storage uses namespaced keys to prevent conflicts:

```
{storageKey}:search          // Search query
{storageKey}:scroll          // Scroll position (row index)
{storageKey}:sortField       // Sort field name
{storageKey}:sortOrder       // Sort order (1 or -1)
{storageKey}:filters         // Filter object
```

**Example for `storageKey: 'user-table'`:**
- `user-table:search`
- `user-table:scroll`
- `user-table:sortField`
- `user-table:sortOrder`
- `user-table:filters`

## Best Practices

### 1. Use Unique Storage Keys

```typescript
// ✅ Good - unique per table
storageKey: 'user-table'
storageKey: 'patient-table'
storageKey: 'invoice-table'

// ❌ Bad - conflicts between tables
storageKey: 'table'
```

### 2. Enable Only What You Need

```typescript
// ✅ Good - minimal persistence
{
  storageKey: 'user-table',
  persistScroll: true,
  persistSearch: true,
  // Don't persist sort/filters if not needed
}

// ⚠️ Caution - excessive persistence
{
  persistScroll: true,
  persistSearch: true,
  persistSort: true,
  persistFilters: true,  // Only if filters are stable
}
```

### 3. Consider Debounce Delay

```typescript
// Fast-changing state (search input)
debounceDelay: 300  // Default, good for most cases

// Slow-changing state (filters)
debounceDelay: 100  // Faster response

// Very stable state
debounceDelay: 500  // Less storage writes
```

### 4. Clear Storage When Appropriate

```typescript
const clearFilters = () => {
  searchQuery.value = '';
  filters.value = {};
  clearStorage();  // Clear persisted state too
};
```

## Examples

### Example 1: User Table with Search + Scroll

```typescript
// useUserTableData.ts
export const useUserTableData = () => {
  const searchQuery = ref('');
  
  useSessionStorage(
    {
      storageKey: 'user-table',
      persistSearch: true,
      persistScroll: false, // Handled by VirtualScrollTable
    },
    { search: searchQuery }
  );
  
  return { searchQuery };
};
```

```vue
<!-- app-user-table.vue -->
<VirtualScrollTable
  :session-storage="{ storageKey: 'user-table', persistScroll: true }"
/>
```

### Example 2: Patient Table with Sort Only

```typescript
export const usePatientTableData = () => {
  const sortField = ref('last_name');
  const sortOrder = ref<1 | -1>(1);
  
  useSessionStorage(
    {
      storageKey: 'patient-table',
      persistSort: true,
    },
    {
      sortField: sortField,
      sortOrder: sortOrder,
    }
  );
  
  return { sortField, sortOrder };
};
```

### Example 3: Invoice Table with Filters

```typescript
export const useInvoiceTableData = () => {
  const filters = ref({
    status: 'pending',
    date_range: null,
  });
  
  useSessionStorage(
    {
      storageKey: 'invoice-table',
      persistFilters: true,
      debounceDelay: 500, // Filters change less frequently
    },
    { filters: filters }
  );
  
  return { filters };
};
```

## Priority Loading

The session storage system integrates with intelligent data loading:

- **Saved scroll position** triggers priority loading of the chunk containing that position
- **Visible area populated first** for instant UI feedback
- **Background loading** fills in chunk 0 for proper table initialization
- **Seamless restoration** after data loads

```typescript
// Automatic in useVirtualScrollTableData
const savedScrollPosition = loadSavedScrollPosition();
if (savedScrollPosition > 0) {
  // Loads chunk containing the scroll position FIRST
  loadInitial(savedScrollPosition);
}
```

## Delete Operations

Scroll position is preserved during delete operations:

```typescript
// Single delete
const handleDelete = async (user: User) => {
  const scrollPos = tableRef.value?.getCurrentScrollPosition() ?? 0;
  await usersApi.delete(user.id);
  await refresh();
  
  // Restore scroll position (adjusted for deletion)
  setTimeout(() => {
    tableRef.value?.scrollToIndex(Math.max(0, scrollPos - 1), 'auto');
  }, 300);
};

// Bulk delete
const handleBulkDelete = async (ids: number[]) => {
  const scrollPos = tableRef.value?.getCurrentScrollPosition() ?? 0;
  const result = await usersApi.bulkDelete(ids);
  await refresh();
  
  // Adjust for number of deleted items
  setTimeout(() => {
    const adjusted = Math.max(0, scrollPos - result.deleted);
    tableRef.value?.scrollToIndex(adjusted, 'auto');
  }, 300);
};
```

## Troubleshooting

### State not persisting

- Check that `storageKey` is set and unique
- Verify session storage is available in browser
- Check browser console for storage quota errors

### State persisting when it shouldn't

- Call `clearStorage()` when resetting table
- Disable specific persistence flags
- Clear session storage manually in browser DevTools

### Performance issues

- Increase `debounceDelay` to reduce storage writes
- Disable persistence for frequently changing state
- Use manual mode for complex state management

### SSR errors

- The composable is SSR-safe and will gracefully disable in SSR context
- No action needed, storage will work in browser after hydration

## Technical Details

### Immediate State Loading

State is loaded **immediately** when the composable is called, not in `onMounted()`. This prevents race conditions where API calls are made with default/empty state before saved state is restored.

```typescript
// ✅ Correct - loads immediately
const { clearStorage } = useSessionStorage(config, { search: searchQuery });
// searchQuery.value is already populated with saved value

// ❌ Wrong - would load too late
onMounted(() => {
  const saved = loadState();
  searchQuery.value = saved.search; // API already called!
});
```

### Auto-persistence with Watchers

When state refs are provided, the composable automatically:
1. Loads saved values immediately
2. Sets up watchers for each ref
3. Debounces writes to prevent excessive storage operations
4. Cleans up on component unmount

### SSR Safety

The composable checks for `window.sessionStorage` availability:
```typescript
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Additional checks...
};
```

Gracefully degrades in SSR environments without errors.

---

**See Also:**
- [Main README](../README.md) - Component overview and quick start
- [API Reference](./API_REFERENCE.md) - Complete prop and event documentation
- [Architecture](./ARCHITECTURE.md) - Internal design and composables
