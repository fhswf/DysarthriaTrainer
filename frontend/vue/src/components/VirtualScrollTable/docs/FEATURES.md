# Features Guide

Comprehensive guide to VirtualScrollTable features including selection, scroll navigation, actions, slots, and advanced customization.

## Table of Contents

- [Selection System](#selection-system)
- [Scroll Navigation](#scroll-navigation)
- [Action Buttons](#action-buttons)
- [Slots & Templates](#slots--templates)
- [Column Configuration](#column-configuration)
- [Advanced Features](#advanced-features)

## Selection System

### Single Selection

Select one row at a time.

```vue
<template>
  <VirtualScrollTable
    v-model:selection="selectedUser"
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    selection-mode="single"
    @lazy-load="onLazyLoad"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface User {
  id: number;
  username: string;
}

const selectedUser = ref<User[]>([]);  // Array with 0 or 1 item

watch(selectedUser, (selection) => {
  if (selection.length > 0) {
    console.log('Selected user:', selection[0]);
  }
});
</script>
```

### Multiple Selection

Select multiple rows with checkboxes.

```vue
<template>
  <VirtualScrollTable
    v-model:selection="selectedUsers"
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    selection-mode="multiple"
    @lazy-load="onLazyLoad"
  />
  
  <div>{{ selectedUsers.length }} users selected</div>
</template>

<script setup lang="ts">
const selectedUsers = ref<User[]>([]);

const processSelection = () => {
  selectedUsers.value.forEach(user => {
    console.log('Process:', user.id);
  });
};
</script>
```

### Programmatic Selection

Control selection via ref.

```vue
<template>
  <VirtualScrollTable
    ref="tableRef"
    v-model:selection="selectedUsers"
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    selection-mode="multiple"
    @lazy-load="onLazyLoad"
  />
  
  <Button @click="selectAll">Select All Loaded</Button>
  <Button @click="deselectAll">Deselect All</Button>
  <Button @click="toggleAll">Toggle All</Button>
</template>

<script setup lang="ts">
import type { VirtualScrollTable } from '@/v2/components/VirtualScrollTable';

const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();
const selectedUsers = ref<User[]>([]);

const selectAll = () => {
  tableRef.value?.selectAllLoaded();
};

const deselectAll = () => {
  tableRef.value?.deselectAll();
};

const toggleAll = () => {
  tableRef.value?.toggleAllLoaded();
};
</script>
```

### Selection State

Access selection statistics via ref.

```vue
<script setup lang="ts">
const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();

// Computed from exposed ref properties
const hasSelection = computed(() => 
  tableRef.value?.hasSelection ?? false
);

const selectionCount = computed(() => 
  tableRef.value?.selectionCount ?? 0
);

const allLoadedSelected = computed(() => 
  tableRef.value?.allLoadedSelected ?? false
);

const loadedItemsCount = computed(() => 
  tableRef.value?.loadedItemsCount ?? 0
);
</script>

<template>
  <div class="selection-info">
    <span v-if="hasSelection">
      {{ selectionCount }} / {{ loadedItemsCount }} selected
    </span>
    <Tag v-if="allLoadedSelected" value="All Loaded Selected" severity="info" />
  </div>
</template>
```

### Selection Caveats

**Limitation:** Header checkbox selects only **loaded items**, not all records.

**Reason:** Virtual scrolling loads data in chunks. Unloaded data exists as `undefined` placeholders.

**Workaround:** Filter undefined items in parent component.

```vue
<script setup lang="ts">
const selection = ref<User[]>([]);

// Filter undefined placeholders
const filteredSelection = computed({
  get: () => selection.value.filter(item => item !== undefined),
  set: (value) => {
    selection.value = value.filter(item => item && item.id);
  }
});
</script>

<template>
  <VirtualScrollTable 
    v-model:selection="filteredSelection"
    ...
  />
</template>
```

## Scroll Navigation

### Basic Scrolling

Scroll to specific positions programmatically.

```vue
<template>
  <VirtualScrollTable
    ref="tableRef"
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="onLazyLoad"
  />
  
  <div class="controls">
    <Button @click="scrollToTop">Top</Button>
    <Button @click="scrollToBottom">Bottom</Button>
    <Button @click="scrollToMiddle">Middle</Button>
  </div>
</template>

<script setup lang="ts">
import type { VirtualScrollTable } from '@/v2/components/VirtualScrollTable';

const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();
const totalRecords = ref(1000);

const scrollToTop = () => {
  tableRef.value?.scrollToTop('smooth');
};

const scrollToBottom = () => {
  tableRef.value?.scrollToBottom('smooth');
};

const scrollToMiddle = () => {
  const middleIndex = Math.floor(totalRecords.value / 2);
  tableRef.value?.scrollToIndex(middleIndex, 'smooth');
};
</script>
```

### Scroll to Specific Item

Find and scroll to item by its key value.

```vue
<template>
  <div class="search-controls">
    <InputNumber v-model="userId" placeholder="User ID" />
    <Button @click="findUser">Find User</Button>
  </div>
  
  <VirtualScrollTable
    ref="tableRef"
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="onLazyLoad"
    @scroll="onScroll"
  />
</template>

<script setup lang="ts">
const tableRef = ref<InstanceType<typeof VirtualScrollTable>>();
const userId = ref<number>();

const findUser = () => {
  if (userId.value) {
    tableRef.value?.scrollToItem(userId.value, 'smooth');
  }
};

const onScroll = ({ index }: { index: number }) => {
  console.log('Scrolled to index:', index);
};
</script>
```

### Initial Scroll Position

Set initial scroll position on mount.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    :scroll-to-index="initialScrollIndex"
    scroll-behavior="smooth"
    @lazy-load="onLazyLoad"
  />
</template>

<script setup lang="ts">
// Scroll to row 100 on mount
const initialScrollIndex = ref(100);

// Or restore scroll position
onMounted(() => {
  const savedPosition = localStorage.getItem('tableScrollPosition');
  if (savedPosition) {
    initialScrollIndex.value = parseInt(savedPosition);
  }
});

// Save scroll position
const onScroll = ({ index }: { index: number }) => {
  localStorage.setItem('tableScrollPosition', String(index));
};
</script>
```

### Scroll Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `scrollToIndex(index, behavior?)` | `index: number, behavior?: 'auto' \| 'smooth'` | Scroll to specific row index |
| `scrollToItem(keyValue, behavior?)` | `keyValue: any, behavior?: 'auto' \| 'smooth'` | Scroll to item by data key |
| `scrollToTop(behavior?)` | `behavior?: 'auto' \| 'smooth'` | Scroll to first row |
| `scrollToBottom(behavior?)` | `behavior?: 'auto' \| 'smooth'` | Scroll to last row |

### Scroll Events

```vue
<template>
  <VirtualScrollTable
    @scroll="handleScroll"
    ...
  />
</template>

<script setup lang="ts">
const handleScroll = ({ index }: { index: number }) => {
  console.log('Current position:', index);
  
  // Track scroll position
  scrollHistory.push(index);
  
  // Analytics
  analytics.track('table_scrolled', { index });
};
</script>
```

## Action Buttons

### Built-in Actions

Configure standard action buttons.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    :actions="{
      view: true,
      edit: true,
      delete: true
    }"
    @lazy-load="onLazyLoad"
    @view="handleView"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>

<script setup lang="ts">
const handleView = (user: User) => {
  router.push(`/users/${user.id}`);
};

const handleEdit = (user: User) => {
  router.push(`/users/${user.id}/edit`);
};

const handleDelete = async (user: User) => {
  if (confirm(`Delete ${user.username}?`)) {
    await usersApi.delete(user.id);
    // Table will automatically reload
  }
};
</script>
```

### Custom Actions

Add custom action buttons.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    :actions="{
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
          visible: (user) => user.role !== 'admin'  // Conditional
        },
        {
          label: 'Export',
          icon: 'pi pi-download',
          command: 'export'
        }
      ]
    }"
    @lazy-load="onLazyLoad"
    @view="handleView"
    @edit="handleEdit"
    @action="handleCustomAction"
  />
</template>

<script setup lang="ts">
const handleCustomAction = ({ data, action }: { data: User; action: string }) => {
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

const resetPassword = async (user: User) => {
  await usersApi.resetPassword(user.id);
  toast.success('Password reset email sent');
};

const impersonate = (user: User) => {
  authStore.impersonate(user.id);
  router.push('/');
};

const exportUser = (user: User) => {
  const json = JSON.stringify(user, null, 2);
  downloadFile(`user-${user.id}.json`, json);
};
</script>
```

### Action Configuration

```typescript
interface ActionConfig {
  view?: boolean;                    // Show view button
  edit?: boolean;                    // Show edit button
  delete?: boolean;                  // Show delete button
  custom?: CustomAction[];           // Custom action buttons
}

interface CustomAction {
  label: string;                     // Button label
  icon: string;                      // PrimeVue icon class (e.g., 'pi pi-key')
  command: string;                   // Action identifier for @action event
  severity?: string;                 // Button severity: 'success', 'info', 'warning', 'danger'
  visible?: (data: T) => boolean;    // Conditional visibility function
}
```

### Actions Slot

Override entire actions column with custom template.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="onLazyLoad"
  >
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
          :disabled="!canEdit(data)"
        />
        <Button 
          icon="pi pi-trash" 
          size="small" 
          text 
          severity="danger"
          @click="deleteUser(data)"
          :disabled="!canDelete(data)"
        />
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

## Slots & Templates

### Column Slots

Customize individual column rendering.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="onLazyLoad"
  >
    <!-- Custom status badge -->
    <template #column-status="{ data }">
      <Tag 
        :value="data.status" 
        :severity="getStatusSeverity(data.status)"
      />
    </template>
    
    <!-- Custom email with icon -->
    <template #column-email="{ data }">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-envelope text-gray-500"></i>
        <a :href="`mailto:${data.email}`">{{ data.email }}</a>
      </div>
    </template>
    
    <!-- Custom avatar + name -->
    <template #column-username="{ data }">
      <div class="flex align-items-center gap-2">
        <Avatar 
          :image="data.avatar_url" 
          :label="data.username[0]" 
          shape="circle"
          size="small"
        />
        <span>{{ data.username }}</span>
      </div>
    </template>
    
    <!-- Custom date formatting -->
    <template #column-created_at="{ data }">
      <div>
        <div>{{ formatDate(data.created_at) }}</div>
        <small class="text-gray-500">{{ formatRelative(data.created_at) }}</small>
      </div>
    </template>
    
    <!-- Boolean as icon -->
    <template #column-is_active="{ data }">
      <i 
        :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"
      ></i>
    </template>
  </VirtualScrollTable>
</template>

<script setup lang="ts">
import { formatDate, formatRelative } from '@/utils/date';

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'inactive': return 'danger';
    default: return 'info';
  }
};
</script>
```

### Header Slots

Customize column headers.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    ...
  >
    <!-- Custom header with icon -->
    <template #header-email="{ column }">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-envelope"></i>
        <span>{{ column.header }}</span>
      </div>
    </template>
    
    <!-- Header with tooltip -->
    <template #header-created_at="{ column }">
      <div v-tooltip="'Date user was created in the system'">
        {{ column.header }}
        <i class="pi pi-info-circle text-gray-400 ml-1"></i>
      </div>
    </template>
    
    <!-- Header with filter indicator -->
    <template #header-status="{ column }">
      <div class="flex align-items-center gap-2">
        <span>{{ column.header }}</span>
        <Badge 
          v-if="hasStatusFilter" 
          value="F" 
          size="small" 
          severity="info"
        />
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

### Empty State Slot

Customize empty state when no data.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    ...
  >
    <template #empty>
      <div class="flex flex-column align-items-center justify-content-center py-8">
        <i class="pi pi-users text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-2xl font-bold mb-2">No Users Found</h3>
        <p class="text-gray-500 mb-4">
          There are no users matching your search criteria.
        </p>
        <Button label="Clear Filters" @click="clearFilters" />
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

### Loading Slot

Customize loading indicator.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    ...
  >
    <template #loading>
      <div class="flex flex-column align-items-center justify-content-center py-8">
        <ProgressSpinner />
        <p class="mt-4 text-gray-500">Loading users...</p>
      </div>
    </template>
  </VirtualScrollTable>
</template>
```

## Column Configuration

### Basic Columns

```typescript
const columns: ColumnDefinition[] = [
  { field: 'username', header: 'Username', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
  { field: 'created_at', header: 'Created', sortable: true },
  { field: 'is_active', header: 'Active', sortable: false },
];
```

### Advanced Column Configuration

```typescript
interface ColumnDefinition {
  field: string;              // Data field name
  header: string;             // Display header text
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

### Styled Columns

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
    bodyStyle: 'padding: 0.25rem'
  },
  {
    field: 'created_at',
    header: 'Created',
    sortable: true,
    style: 'width: 180px',
    headerStyle: 'background-color: var(--highlight-bg)'
  }
];
```

## Advanced Features

### Responsive Layout

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    responsive-layout="scroll"
    ...
  />
</template>
```

**Options:**
- `scroll` - Horizontal scroll for overflow columns
- `stack` - Stack columns vertically on mobile

### Table Styling

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    :striped="true"
    :show-gridlines="true"
    size="small"
    ...
  />
</template>
```

**Props:**
- `striped: boolean` - Alternating row colors
- `showGridlines: boolean` - Show cell borders
- `size: 'small' | 'normal' | 'large'` - Row size

### PrimeVue Props Pass-through

Pass any PrimeVue DataTable prop via `dataTableProps`.

```vue
<template>
  <VirtualScrollTable
    :items="users"
    :columns="columns"
    :data-table-props="{
      resizableColumns: true,
      columnResizeMode: 'fit',
      showGridlines: true,
      stripedRows: true,
      tableStyle: { minWidth: '50rem' }
    }"
    ...
  />
</template>
```

### Localization

Use with localization store for translated headers.

```vue
<script setup lang="ts">
import { useVirtualScrollTableColumns } from '@/v2/components/VirtualScrollTable';
import { useLocalizationStore } from '@/v2/stores/localization';

const localizationStore = useLocalizationStore();
const { createColumns } = useVirtualScrollTableColumns('users', localizationStore);

// Automatically translates headers using localization store
const columns = createColumns([
  'username',
  'email',
  'created_at',
  { field: 'is_active', options: { sortable: false } }
]);
</script>
```

---

**Last Updated:** 2025-01-18  
**Component Version:** 2.0.0  
**Features:** Selection, Navigation, Actions, Slots, Customization
