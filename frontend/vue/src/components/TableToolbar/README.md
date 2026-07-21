# TableToolbar Component

Standardized toolbar for data table CRUD operations with search, filter, and action buttons.

## 🎯 Features

- **Search Input**: Integrated search with clear button
- **Filter Slot**: Custom filter component support
- **Action Buttons**: Refresh, Export, Create, Delete All
- **Localization**: Full i18n support via localization store
- **Responsive**: Tailwind CSS responsive design
- **Customizable**: Show/hide any element, custom labels and tooltips
- **Slots**: Add custom actions before/after standard buttons

## 📦 Quick Start

```vue
<template>
  <TableToolbar
    title="Employees"
    v-model:search-query="searchQuery"
    search-placeholder="Search employees..."
    @refresh="loadData"
    @export="exportData"
    @create="createEmployee"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TableToolbar from '@/v2/components/TableToolbar/TableToolbar.vue';

const searchQuery = ref('');

const loadData = () => {
  console.log('Loading data...');
};

const exportData = () => {
  console.log('Exporting data...');
};

const createEmployee = () => {
  console.log('Creating employee...');
};
</script>
```

## 📐 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Toolbar title (shown in search group) |
| `searchQuery` | `string` | `''` | Search query (v-model) |
| `searchPlaceholder` | `string` | Auto | Search input placeholder |
| `showSearch` | `boolean` | `true` | Show search input |
| `showRefresh` | `boolean` | `true` | Show refresh button |
| `showExport` | `boolean` | `true` | Show export button |
| `showCreate` | `boolean` | `true` | Show create button |
| `showDeleteAll` | `boolean` | `false` | Show delete all button |
| `refreshLabel` | `string` | `''` | Refresh button label (optional) |
| `exportLabel` | `string` | `''` | Export button label (optional) |
| `createLabel` | `string` | Auto | Create button label |
| `deleteAllLabel` | `string` | Auto | Delete all button label |
| `refreshTooltip` | `string` | Auto | Refresh button tooltip |
| `exportTooltip` | `string` | Auto | Export button tooltip |
| `createTooltip` | `string` | Auto | Create button tooltip |
| `deleteAllTooltip` | `string` | Auto | Delete all button tooltip |
| `selectedCount` | `number` | `0` | Number of selected items |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disable all actions |

## 🎪 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:searchQuery` | `string` | Search query changed (v-model) |
| `refresh` | - | Refresh button clicked |
| `export` | - | Export button clicked |
| `create` | - | Create button clicked |
| `delete-all` | - | Delete all button clicked |

## 🎨 Slots

| Slot | Description |
|------|-------------|
| `filter` | Custom filter component (e.g., SplitButton, FilterDialog) |
| `actions-prepend` | Actions before standard buttons |
| `actions-append` | Actions after standard buttons |

## 💡 Usage Examples

### Basic Usage with All Features

```vue
<template>
  <div class="page-container">
    <TableToolbar
      title="Employees"
      v-model:search-query="searchQuery"
      :show-delete-all="hasSelection"
      :selected-count="selectedRows.length"
      @refresh="handleRefresh"
      @export="handleExport"
      @create="handleCreate"
      @delete-all="handleDeleteAll"
    >
      <template #filter>
        <SplitButton
          :label="activeFilter.label"
          :model="filterOptions"
          @click="applyFilter"
        />
      </template>
    </TableToolbar>

    <DataTable 
      :value="filteredData" 
      v-model:selection="selectedRows"
    >
      <!-- columns -->
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TableToolbar from '@/v2/components/TableToolbar/TableToolbar.vue';

const searchQuery = ref('');
const selectedRows = ref([]);
const data = ref([]);

const hasSelection = computed(() => selectedRows.value.length > 0);

const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  
  const query = searchQuery.value.toLowerCase();
  return data.value.filter(item => 
    item.name.toLowerCase().includes(query)
  );
});

const handleRefresh = async () => {
  // Reload data
};

const handleExport = () => {
  // Export to CSV
};

const handleCreate = () => {
  // Navigate to create form
};

const handleDeleteAll = async () => {
  // Confirm and delete selected
};
</script>
```

### Minimal Toolbar (Search Only)

```vue
<TableToolbar
  title="Simple Table"
  v-model:search-query="searchQuery"
  :show-refresh="false"
  :show-export="false"
  :show-create="false"
/>
```

### Custom Filter Component

```vue
<TableToolbar
  title="Advanced Table"
  v-model:search-query="searchQuery"
  @refresh="loadData"
>
  <template #filter>
    <TableFilter
      v-model:filters="filters"
      :config="filterConfig"
      @change="handleFilterChange"
    />
  </template>
</TableToolbar>
```

### Custom Actions

```vue
<TableToolbar
  title="Custom Actions"
  v-model:search-query="searchQuery"
  @refresh="loadData"
>
  <template #actions-prepend>
    <Button
      icon="pi pi-history"
      label="History"
      severity="secondary"
      outlined
      @click="showHistory"
    />
  </template>
  
  <template #actions-append>
    <Button
      icon="pi pi-cog"
      severity="secondary"
      outlined
      @click="showSettings"
    />
  </template>
</TableToolbar>
```

### Custom Labels and Tooltips

```vue
<template>
  <TableToolbar
    :title="pageTitle"
    v-model:search-query="searchQuery"
    :search-placeholder="searchPlaceholder"
    :create-label="createLabel"
    :create-tooltip="createTooltip"
    @create="handleCreate"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLocalizationStore } from '@/v2/stores/localization';

const loc = useLocalizationStore();

const pageTitle = ref('');
const searchPlaceholder = ref('');
const createLabel = ref('');
const createTooltip = ref('');

onMounted(async () => {
  pageTitle.value = await loc.t('employees.title');
  searchPlaceholder.value = await loc.t('employees.search.placeholder');
  createLabel.value = await loc.t('employees.actions.create');
  createTooltip.value = await loc.t('employees.actions.createTooltip');
});
</script>
```

## 🌍 Localization

The component uses the localization store for default labels and tooltips.

### Default Translation Keys

All default labels use these keys from `common.toolbar`:

- `searchPlaceholder` - Search input placeholder
- `refresh` - Refresh button tooltip
- `export` - Export button tooltip
- `create` - Create button label and tooltip
- `deleteAll` - Delete all button label and tooltip

### Custom Labels

You can override any label by providing props:

```vue
<TableToolbar
  create-label="Add Employee"
  create-tooltip="Create a new employee record"
/>
```

Or load from your own translation keys:

```vue
<script setup lang="ts">
const createLabel = ref('');

onMounted(async () => {
  createLabel.value = await loc.t('employees.actions.create');
});
</script>

<template>
  <TableToolbar :create-label="createLabel" />
</template>
```

## 🎨 Styling

The component uses Tailwind CSS for all styling. Key classes:

- `flex items-center gap-2` - Layout and spacing
- `max-w-[500px]` - Search input max width
- `rounded-lg` - Rounded toolbar corners
- `mb-4` - Bottom margin

No scoped CSS is needed. All responsive behavior is handled by Tailwind utilities.

## ♿ Accessibility

- All buttons have tooltips
- Loading states disable interactions
- Clear button only shows when needed
- Delete button disabled when no selection

## 🧪 Testing

See `__tests__/TableToolbar.spec.ts` for comprehensive unit tests.

Run tests:
```bash
npm run test:unit TableToolbar
```

## 📚 See Also

- [CONCEPT.md](../../concepts/table-toolbar/CONCEPT.md) - Design concept
- [IMPLEMENTATION_GUIDE.md](../../concepts/table-toolbar/IMPLEMENTATION_GUIDE.md) - Implementation guide
- [Localization Store](../../stores/localization/README.md) - Translation system
- [PrimeVue Toolbar](https://primevue.org/toolbar/) - Base component

## 📝 License

Part of the Omnia Pflege Next application.
