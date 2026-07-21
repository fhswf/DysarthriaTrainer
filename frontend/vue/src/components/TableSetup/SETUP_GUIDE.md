# TableSetup Quick Start Guide

Complete guide for creating new table pages using the TableSetup component.

---

## 📦 What You Get

TableSetup provides a complete table page with:
- ✅ Infinite scroll with virtual scrolling
- ✅ Search functionality
- ✅ Advanced filtering with presets
- ✅ Sorting
- ✅ CRUD actions (view, edit, delete)
- ✅ CSV export
- ✅ Session storage (remembers scroll position, sort, filters)
- ✅ Responsive empty states
- ✅ Loading states and skeletons
- ✅ Confirmation dialogs
- ✅ Full localization support

**Time to create new table:** ~1-2 hours (vs 8-16 hours manual implementation)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create Column Configuration

**File:** `config/yourEntityColumns.ts`

```typescript
import type { TableColumnDefinition } from '@/v2/components/TableSetup';
import dayjs from 'dayjs';

export const yourEntityColumns: TableColumnDefinition[] = [
  {
    field: 'name',           // Property name in your data
    headerKey: 'yourEntities.columns.name', // Full translation key
    sortable: true,          // Enable sorting
    style: { width: '200px' }, // Column width
  },
  {
    field: 'created_at',
    headerKey: 'yourEntities.columns.createdAt', // Or just 'createdAt' (auto-prefixed)
    sortable: true,
    style: { width: '120px' },
    format: (value) => dayjs(value).format('DD.MM.YYYY'), // Optional formatter
  },
];
```

### Step 2: Create Filter Configuration (Optional)

**File:** `config/yourEntityFilterConfig.ts`

```typescript
import type { TableFilterConfig } from '@/v2/components/TableFilter';
import dayjs from 'dayjs';

export interface YourEntityFilters {
  name__icontains?: string;
  status?: string;
  created_at__gte?: string;
}

export const yourEntityFilterConfig: TableFilterConfig<YourEntityFilters> = {
  id: 'your-entity-table',
  i18nPrefix: 'yourEntities.filters',
  
  // Dropdown presets (at least one required)
  presets: [
    {
      id: 'all',
      labelKey: 'yourEntities.filters.presets.all',
      icon: 'pi pi-list', // ⚠️ CRITICAL: Must be 'pi pi-{icon}' (two classes)
      filters: {},
    },
    {
      id: 'recent',
      labelKey: 'yourEntities.filters.presets.recent',
      icon: 'pi pi-clock', // ⚠️ CRITICAL: Must be 'pi pi-{icon}' (two classes)
      // ⚠️ CRITICAL: Use arrow function for dynamic dates, not static values
      filters: () => ({
        created_at__gte: dayjs().subtract(7, 'days').toISOString(),
      }),
    },
  ],
  
  // Optional: Quick preset buttons shown in filter dialog
  quickPresets: [
    {
      id: 'today',
      labelKey: 'yourEntities.filters.quickPresets.today',
      icon: 'pi pi-calendar', // ⚠️ CRITICAL: Must be 'pi pi-{icon}' (two classes)
      severity: 'success',
      // ⚠️ CRITICAL: Use arrow function for dynamic dates, not static values
      filters: () => ({
        created_at__gte: dayjs().startOf('day').toISOString(),
      }),
    },
  ],
  
  // Filter fields
  fields: [
    {
      key: 'name__icontains',
      type: 'text',
      labelKey: 'yourEntities.filters.fields.name',
      group: 'basic',
      groupLabelKey: 'yourEntities.filters.groups.basic',
      colSpan: 6,
    },
    {
      key: 'status',
      type: 'select',
      labelKey: 'yourEntities.filters.fields.status',
      group: 'basic',
      groupLabelKey: 'yourEntities.filters.groups.basic',
      colSpan: 6,
      options: {
        choices: ['active', 'inactive', 'pending'],
      },
    },
  ],
  
  // Storage configuration
  storage: {
    enabled: true,
    persistPreset: true,
    persistCustom: true,
    autoSave: false,
  },
  
  // Default values
  defaults: {
    preset: 'all',
    filters: {},
  },
};
```

### Step 3: Create Page Component

**File:** `app-your-entity-table.vue`

```vue
<template>
  <div class="flex flex-col h-full">
    <TableSetup
      :api-service="yourEntityApiService"
      :columns="yourEntityColumns"
      :filter-config="yourEntityFilterConfig"
      data-key="id"
      i18n-key="yourEntities"
      storage-key="your-entity-table"
      :initial-state="{
        sortField: 'name',
        sortOrder: 1,
      }"
      @create="handleCreate"
      @view="handleView"
      @edit="handleEdit"
    >
      <!-- Custom column rendering (optional) -->
      <template #column-status="{ data }">
        <Tag
          :value="data.status"
          :severity="getStatusSeverity(data.status)"
        />
      </template>
    </TableSetup>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Tag from 'primevue/tag';
import { TableSetup } from '@/v2/components/TableSetup';
import type { TableApiService } from '@/v2/components/TableSetup';
import { useLocalizationStore } from '@/v2/stores/localization';
import { useV2MessagingStore } from '@/v2/stores/messaging';
import { yourEntitiesApi } from '@/v2/api/yourEntities';
import type { YourEntity } from '@/v2/api/yourEntities';
import { yourEntityColumns } from './config/yourEntityColumns';
import { yourEntityFilterConfig } from './config/yourEntityFilterConfig';

const router = useRouter();
const loc = useLocalizationStore();
const messaging = useV2MessagingStore();

// API Service wrapper - CRITICAL: Must handle signal parameter and search properly
const yourEntityApiService: TableApiService<YourEntity> = {
  baseUrl: yourEntitiesApi.baseUrl, // Use API's baseUrl for consistency
  
  // CRITICAL: API wrapper must accept and forward signal parameter for race condition prevention
  list: async (params: any, signal?: AbortSignal) => {
    // Build API parameters, excluding internal TableSetup control parameters
    const apiParams: any = {};
    
    // CRITICAL: Use 'in' operator to check key existence, not truthiness
    // Empty string "" is falsy in JavaScript - using if (params.search) would fail for cleared search
    if ('search' in params) {
      apiParams.search = params.search;
    }
    
    // Copy all other filter parameters (excluding TableSetup's control params)
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'page' && key !== 'pageSize' && key !== 'sortField' && 
          key !== 'sortOrder' && key !== 'search') {
        apiParams[key] = value;
      }
    }
    
    // Add pagination parameters
    if (params.page !== undefined) {
      apiParams.page = params.page;
    }
    if (params.pageSize !== undefined) {
      apiParams.page_size = params.pageSize;
    }
    
    // Add sorting parameters
    if (params.sortField) {
      const prefix = params.sortOrder === -1 ? '-' : '';
      apiParams.ordering = prefix + params.sortField;
    }
    
    // CRITICAL: Forward the signal for request cancellation (race condition prevention)
    return await yourEntitiesApi.list(apiParams, signal);
  },
  
  delete: async (id) => await yourEntitiesApi.delete(id),
};

function handleCreate() {
  router.push('/your-entities/create');
}

function handleView(item: YourEntity) {
  router.push(`/your-entities/${item.id}`);
}

function handleEdit(item: YourEntity) {
  router.push(`/your-entities/${item.id}/edit`);
}

function getStatusSeverity(status: string) {
  const severityMap = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning',
  };
  return severityMap[status] || 'info';
}
</script>
```

**⚠️ CRITICAL WARNINGS:**

1. **Never use direct API pass-through** - This will cause race conditions:
   ```typescript
   // ❌ WRONG - No signal parameter, no search handling
   const apiService: TableApiService<YourEntity> = {
     baseUrl: '/api/your-entities',
     list: yourEntitiesApi.list,  // Direct pass-through
     delete: yourEntitiesApi.delete,
   };
   ```

2. **Always check search with 'in' operator** - Empty strings are falsy:
   ```typescript
   // ❌ WRONG - Empty string is falsy, cleared search won't work
   if (params.search) {
     apiParams.search = params.search;
   }
   
   // ✅ CORRECT - Checks key existence, not value truthiness
   if ('search' in params) {
     apiParams.search = params.search;
   }
   ```

3. **Icons must use two classes** - PrimeVue requirement:
   ```typescript
   // ❌ WRONG - Missing 'pi' base class
   icon: 'pi-list'
   
   // ✅ CORRECT - Both 'pi' and specific icon class
   icon: 'pi pi-list'
   ```

4. **Dynamic dates must use arrow functions** - Static values evaluate at module load:
   ```typescript
   // ❌ WRONG - Evaluates once when module loads
   filters: {
     created_at__gte: dayjs().startOf('day').toISOString(),
   }
   
   // ✅ CORRECT - Evaluates each time preset is applied
   filters: () => ({
     created_at__gte: dayjs().startOf('day').toISOString(),
   })
   ```

5. **API baseUrl must be /api/main/{endpoint}** - Standard path convention:
   ```typescript
   // ❌ WRONG - Missing 'main' segment
   public readonly baseUrl = '/api/your-entities';
   
   // ✅ CORRECT - Includes 'main' segment
   public readonly baseUrl = '/api/main/your-entities';
   ```

### Step 4: Add Translations

**Important:** The localization service is **async** - all methods return Promises and must be awaited.

**File:** `locales/en/yourEntities.ts`

```typescript
export default {
  title: 'Your Entities',
  
  search: {
    placeholder: 'Search by name...',
  },
  
  columns: {
    name: 'Name',
    status: 'Status',
    createdAt: 'Created',
  },
  
  emptyState: {
    title: 'No entities found',
    description: 'Get started by creating your first entity',
    descriptionFiltered: 'No entities match your search or filters',
    clearFilters: 'Clear Filters',
    action: 'Create Entity',
  },
  
  confirmDelete: {
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this entity?',
  },
  
  confirmDeleteAll: {
    title: 'Confirm Delete All',
    message: 'Are you sure you want to delete {count} entities?',
  },
  
  messages: {
    deleteSuccess: 'Entity deleted successfully',
    exportSuccess: 'Data exported successfully',
  },
  
  errors: {
    deleteFailed: 'Failed to delete entity',
    exportFailed: 'Failed to export data',
  },
  
  filters: {
    presets: {
      all: 'All Entities',
      recent: 'Recent (7 days)',
    },
    quickPresets: {
      today: 'Today',
    },
    groups: {
      basic: 'Basic Information',
    },
    fields: {
      name: 'Name',
      status: 'Status',
    },
  },
};
```

**Usage in components:**
```typescript
// ✅ Correct - Always await localization calls
const title = await loc.t('yourEntities.title');
const message = await loc.t('yourEntities.confirmDelete.message');

// ❌ Incorrect - Missing await
const title = loc.t('yourEntities.title'); // Returns Promise, not string!
```

### Step 5: Register Route

**File:** `router/index.ts`

```typescript
{
  path: '/your-entities',
  name: 'your-entities',
  component: () => import('@/v2/pages/your-entity-table/app-your-entity-table.vue'),
  meta: {
    requiresAuth: true,
    title: 'Your Entities',
  },
}
```

---

## 🎨 Customization

### Custom Column Rendering

Override default cell rendering with slots:

```vue
<TableSetup ...>
  <!-- Custom cell for 'email' column -->
  <template #column-email="{ data }">
    <a
      :href="`mailto:${data.email}`"
      class="text-blue-600 hover:underline"
    >
      {{ data.email }}
    </a>
  </template>
  
  <!-- Custom cell for 'avatar' column -->
  <template #column-avatar="{ data }">
    <Avatar
      :image="data.avatar_url"
      :label="data.initials"
      shape="circle"
    />
  </template>
  
  <!-- Custom cell for 'tags' column -->
  <template #column-tags="{ data }">
    <div class="flex gap-1">
      <Tag
        v-for="tag in data.tags"
        :key="tag"
        :value="tag"
      />
    </div>
  </template>
</TableSetup>
```

### Custom Toolbar Actions

Add extra buttons to toolbar:

```vue
<TableSetup ...>
  <!-- Prepend actions (left side) -->
  <template #toolbar-actions-prepend>
    <Button
      label="Import"
      icon="pi pi-upload"
      @click="handleImport"
    />
  </template>
  
  <!-- Append actions (right side) -->
  <template #toolbar-actions-append>
    <Button
      label="Settings"
      icon="pi pi-cog"
      severity="secondary"
      @click="handleSettings"
    />
  </template>
</TableSetup>
```

### Custom Empty State

```vue
<TableSetup ...>
  <template #empty="{ isFiltered, onClearFilters, onCreate }">
    <div class="text-center py-12">
      <img src="/empty-illustration.svg" alt="Empty" class="mb-4" />
      <h3 class="text-xl font-semibold mb-2">
        Custom Empty Message
      </h3>
      <p class="text-gray-600 mb-4">
        Your custom description here
      </p>
      <Button
        v-if="isFiltered"
        label="Clear Filters"
        @click="onClearFilters"
      />
      <Button
        label="Create First Item"
        @click="onCreate"
      />
    </div>
  </template>
</TableSetup>
```

### Feature Flags

Control which features are enabled:

```vue
<TableSetup
  :features="{
    search: true,
    filters: true,
    sort: true,
    refresh: true,
    export: true,
    create: true,
    deleteAll: false,     // Disable bulk delete
    viewAction: true,
    editAction: true,
    deleteAction: false,  // Disable delete action
  }"
  ...
/>
```

### Table Configuration

Customize table appearance:

```vue
<TableSetup
  :table-config="{
    rowHeight: 60,                        // Row height in pixels
    scrollHeight: 'calc(100vh - 300px)',  // Scroll container height
    striped: true,                        // Alternating row colors
    size: 'small',                        // 'small' | 'normal'
    selectionMode: 'multiple',            // 'single' | 'multiple' | 'none'
  }"
  ...
/>
```

---

## 📋 Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `api-service` | `TableApiService` | API service with `list()` and optional `delete()` |
| `columns` | `TableColumnDefinition[]` | Column definitions |
| `data-key` | `string` | Unique key property (usually `'id'`) |
| `i18n-key` | `string` | Translation key prefix |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filter-config` | `TableFilterConfig` | `undefined` | Filter configuration |
| `storage-key` | `string` | `table-setup:{i18nKey}` | Session storage key |
| `features` | `TableFeatures` | All enabled | Feature flags |
| `table-config` | `TableConfig` | See defaults | Table appearance config |
| `initial-state` | `TableInitialState` | `{}` | Initial sort/search state |

---

## 🎯 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `create` | - | User clicked create button |
| `view` | `item: T` | User clicked view action |
| `edit` | `item: T` | User clicked edit action |
| `delete` | `item: T` | User confirmed delete |
| `delete-all` | `items: T[]` | User confirmed bulk delete |
| `export` | `data: T[]` | Export completed |
| `data-loaded` | `data: T[]` | New data loaded |
| `error` | `error: Error` | Error occurred |
| `filters-changed` | `filters: Record<string, any>` | Filters changed |

---

## 🔧 API Service Interface

Your API service must implement:

```typescript
interface TableApiService<T = any> {
  // Required: List items with pagination
  // ⚠️ CRITICAL: Must accept signal parameter for race condition prevention
  list: (params: {
    limit?: number;
    offset?: number;
    search?: string;
    ordering?: string;
    [key: string]: any; // Filter params
  }, signal?: AbortSignal) => Promise<{  // ⚠️ signal parameter is CRITICAL
    count: number;
    results: T[];
  }>;
  
  // Optional: Delete item (required if deleteAction feature enabled)
  delete?: (id: number | string) => Promise<void>;
  
  // Required for CSV export: Base URL for API endpoint
  // Used to construct download URL with _export=csv parameter
  // ⚠️ Should be '/api/main/{endpoint}' following standard convention
  baseUrl?: string;
}
```

### Example API Service

```typescript
import { useApiStore } from '@/v2/stores/api';

export interface Task {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

export interface TaskListParams {
  limit?: number;
  offset?: number;
  search?: string;
  ordering?: string;
  title__icontains?: string;
  status?: string;
}

export interface TaskListResponse {
  count: number;
  results: Task[];
}

class TaskApiService {
  private api: ReturnType<typeof useApiStore> | null = null;
  
  // ⚠️ CRITICAL: Must be public and readonly for CSV export and table wrapper
  // ⚠️ CRITICAL: Must use '/api/main/{endpoint}' path convention
  public readonly baseUrl = '/api/main/tasks';

  private getApi() {
    if (!this.api) {
      this.api = useApiStore();
    }
    return this.api;
  }

  // ⚠️ CRITICAL: Must accept signal parameter for race condition prevention
  async list(params?: TaskListParams, signal?: AbortSignal): Promise<TaskListResponse> {
    const response = await this.getApi().get<TaskListResponse>(
      `${this.baseUrl}/`,
      {
        params,
        signal,  // ⚠️ CRITICAL: Must pass signal to axios call
        useCache: true,
        cacheTimeout: 60000,
      }
    );
    return response.data;
  }

  async getById(id: number | string): Promise<Task> {
    const response = await this.getApi().get<Task>(
      `${this.baseUrl}/${id}/`,
      { useCache: true }
    );
    return response.data;
  }

  async delete(id: number | string): Promise<void> {
    await this.getApi().delete(`${this.baseUrl}/${id}/`);
  }
}

export const tasksApi = new TaskApiService();
```

**⚠️ API Service Critical Requirements:**

1. **Signal Parameter**: `list()` method MUST accept `signal?: AbortSignal` parameter
2. **Pass Signal to Axios**: Signal MUST be forwarded to axios call config
3. **Public baseUrl**: Must be `public readonly` for table wrapper and CSV export
4. **Standard Path**: Use `/api/main/{endpoint}` convention
5. **Flexible IDs**: `getById()` and `delete()` should accept `number | string`

---

## 💡 Common Patterns

### Pattern 1: Linked Name Column

```vue
<template #column-name="{ data }">
  <router-link
    :to="`/entities/${data.id}`"
    class="text-blue-600 hover:underline font-medium"
  >
    {{ data.name }}
  </router-link>
</template>
```

### Pattern 2: Status Badge

```vue
<template #column-status="{ data }">
  <Tag
    :value="data.status"
    :severity="getStatusSeverity(data.status)"
    :icon="getStatusIcon(data.status)"
  />
</template>

<script>
function getStatusSeverity(status: string) {
  const map = {
    active: 'success',
    pending: 'warning',
    inactive: 'danger',
  };
  return map[status] || 'info';
}

function getStatusIcon(status: string) {
  const map = {
    active: 'pi pi-check-circle',
    pending: 'pi pi-clock',
    inactive: 'pi pi-times-circle',
  };
  return map[status] || 'pi pi-circle';
}
</script>
```

### Pattern 3: Date Formatting

```typescript
// In column config
{
  field: 'created_at',
  headerKey: 'createdAt',
  format: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
}

// Or in template
<template #column-created_at="{ data }">
  {{ formatDate(data.created_at) }}
</template>

<script>
function formatDate(date: string) {
  return dayjs(date).format('DD.MM.YYYY HH:mm');
}
</script>
```

### Pattern 4: Conditional Actions

**Note:** While conditional action rendering is mentioned here, the current implementation does not support function-based feature flags. All action buttons (view, edit, delete) are either shown or hidden for all rows based on boolean flags.

For row-specific action control, use custom action slots:

```vue
<TableSetup
  :features="{
    viewAction: false, // Disable default actions
    editAction: false,
    deleteAction: false,
  }"
  ...
>
  <!-- Custom actions with conditional rendering -->
  <template #actions="{ data }">
    <div class="flex gap-2">
      <Button
        icon="pi pi-eye"
        text
        @click="handleView(data)"
      />
      <Button
        v-if="!data.is_locked"
        icon="pi pi-pencil"
        text
        @click="handleEdit(data)"
      />
      <Button
        v-if="data.status !== 'locked'"
        icon="pi pi-trash"
        text
        severity="danger"
        @click="handleDelete(data)"
      />
    </div>
  </template>
</TableSetup>
```

### Pattern 5: Custom Action Buttons

```vue
<template #actions="{ data }">
  <div class="flex gap-2">
    <!-- Default actions -->
    <Button
      icon="pi pi-eye"
      text
      @click="handleView(data)"
    />
    
    <!-- Custom action -->
    <Button
      icon="pi pi-send"
      text
      severity="info"
      @click="handleSend(data)"
      :disabled="!data.can_send"
    />
  </div>
</template>
```

---

## 🐛 Troubleshooting

### Issue: Filters not working

**Check:**
1. Filter config `id` matches storage key
2. Field `key` matches API parameter name
3. API service accepts filter params

### Issue: Export downloads empty file

**Check:**
1. API service has `baseUrl` property
2. API endpoint supports `_export=csv` parameter
3. Backend returns CSV with proper headers

### Issue: Sort not working

**Check:**
1. Column has `sortable: true`
2. API service handles `ordering` parameter
3. `sortField` uses correct field name (or override with `column.sortField`)

### Issue: Translations missing

**Check:**
1. Translation file registered in locale index
2. Column header keys: Can use full path (e.g., `'yourEntities.columns.name'`) or short key (e.g., `'name'` - auto-prefixed with `{i18nKey}.columns.`)
3. Filter config `i18nPrefix` matches translation structure
4. **Important:** All localization methods are async - use `await loc.t(...)`, not `loc.t(...)`

---

## 📚 Further Reading

- [TableSetup API Reference](./API_REFERENCE.md)
- [TableFilter Documentation](../TableFilter/README.md)
- [VirtualScrollTable Documentation](../VirtualScrollTable/README.md)
- [Localization Store Documentation](../../stores/localization/README.md)
- [Complete Example](../../pages/employee-table-v2/)

---

## 🌐 Localization Notes

The `useLocalizationStore` is **fully asynchronous** to support dynamic locale loading:

```typescript
import { useLocalizationStore } from '@/v2/stores/localization';

const loc = useLocalizationStore();

// ✅ Correct usage (with await)
async function loadLabels() {
  const title = await loc.t('users.title');
  const placeholder = await loc.t('users.search.placeholder');
  return { title, placeholder };
}

// ✅ Also correct (in onMounted)
onMounted(async () => {
  const title = await loc.t('users.title');
  console.log(title);
});

// ❌ Wrong - Missing await
const title = loc.t('users.title'); // Returns Promise<string>, not string!
```

**Key Methods:**
- `t(key, params?)` - Translate a key with optional parameters
- `tc(key, count, params?)` - Count-based translation (pluralization)
- `te(key)` - Check if translation exists
- `n(value, format?)` - Format numbers
- `d(value, format?)` - Format dates
- `setLocale(locale)` - Change active locale
- `getLocale()` - Get current locale code

All methods return `Promise` except getters like `getLocale()`.

---

## ✅ Checklist

Creating a new table page:

- [ ] Create column configuration file
- [ ] Create filter configuration file (if needed)
  - [ ] All icons use `'pi pi-{icon}'` format (two classes)
  - [ ] Dynamic date filters use arrow functions `() => ({})`
- [ ] Create API service
  - [ ] `list()` method accepts `signal?: AbortSignal` parameter
  - [ ] Signal is passed to axios call: `get(url, { params, signal })`
  - [ ] `baseUrl` is `public readonly` and uses `/api/main/{endpoint}`
  - [ ] `delete()` accepts `id: number | string`
- [ ] Create page component
  - [ ] API wrapper accepts and forwards signal parameter
  - [ ] Search uses `'search' in params` check (not `if (params.search)`)
  - [ ] Parameters properly mapped excluding control params
  - [ ] Icons use `'pi pi-{icon}'` format (two classes)
- [ ] Add translations (remember all methods are async)
- [ ] Register route
- [ ] Test CRUD operations
- [ ] Test filtering
  - [ ] Apply preset, refresh page - should restore
  - [ ] Apply custom filters, refresh page - should restore
- [ ] Test search
  - [ ] Type search query - should filter
  - [ ] Clear search completely - should reload all data
  - [ ] Type very fast - no stuck skeleton loaders
- [ ] Test export
- [ ] Test empty states
- [ ] Verify mobile responsiveness
- [ ] Check browser Network tab
  - [ ] During fast typing, old requests show "cancelled" not "failed"
  - [ ] No request errors (except legitimate 404s)

---

## 🚨 Common Issues & Solutions

### Issue: Skeleton loaders persist after search

**Cause**: Missing signal parameter or not forwarding it

**Solution**:
```typescript
// ✅ Correct - Accept and forward signal
list: async (params: any, signal?: AbortSignal) => {
  return await yourEntitiesApi.list(apiParams, signal);
}
```

### Issue: Search doesn't work when cleared

**Cause**: Using `if (params.search)` - empty string is falsy

**Solution**:
```typescript
// ❌ Wrong - Empty string is falsy
if (params.search) {
  apiParams.search = params.search;
}

// ✅ Correct - Check key existence
if ('search' in params) {
  apiParams.search = params.search;
}
```

### Issue: Icons not displaying

**Cause**: Using single class `'pi-icon'` instead of two classes

**Solution**:
```typescript
// ❌ Wrong
icon: 'pi-list'

// ✅ Correct
icon: 'pi pi-list'
```

### Issue: Filter preset dates are stale

**Cause**: Using static date values instead of arrow functions

**Solution**:
```typescript
// ❌ Wrong - Evaluates once at module load
filters: {
  created_at__gte: dayjs().startOf('day').toISOString(),
}

// ✅ Correct - Evaluates each time
filters: () => ({
  created_at__gte: dayjs().startOf('day').toISOString(),
})
```

### Issue: CSV export 404 error

**Cause**: Missing or wrong baseUrl path

**Solution**:
```typescript
// ❌ Wrong - Missing 'main' segment
public readonly baseUrl = '/api/tasks';

// ✅ Correct - Standard path convention
public readonly baseUrl = '/api/main/tasks';
```

---

## 📚 Additional Resources

- [Table Cleanup Guides](/src/v2/concepts/table-cleanup/) - Comprehensive fixes for common issues
  - [API Module Structure](../../concepts/table-cleanup/API_MODULE_STRUCTURE.md)
  - [Race Condition Fix](../../concepts/table-cleanup/RACE_CONDITION_FIX.md)
  - [Icon Format Fix](../../concepts/table-cleanup/ICON_FORMAT_FIX.md)
  - [Filter Initialization Fix](../../concepts/table-cleanup/FILTER_INITIALIZATION_FIX.md)
- [TableFilter Documentation](../TableFilter/README.md)
- [VirtualScrollTable Documentation](../VirtualScrollTable/README.md)
- [Complete Example](../../pages/employee-table-v2/)
