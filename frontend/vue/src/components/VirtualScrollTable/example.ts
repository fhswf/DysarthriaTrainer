/**
 * Example usage of VirtualScrollTable component
 * 
 * This example shows how to use the generic VirtualScrollTable component
 * to create a users table with virtual scrolling and lazy loading.
 */

import { ref } from 'vue';
import { 
  VirtualScrollTable, 
  useVirtualScrollTableData,
  useVirtualScrollTableColumns 
} from '@/components/VirtualScrollTable';
import { UsersApi } from '@/api/users';
import type { User } from '@/api/users';

// Setup API client
const usersApi = new UsersApi();

// Setup sort and filter state
const sortField = ref('last_name');
const sortOrder = ref<1 | -1>(1);
const filters = ref({ 
  search: '', 
  is_active: null 
});

// Use the data composable for lazy loading
const {
  items: users,
  loading,
  totalRecords,
  onLazyLoad: handleLazyLoad,
  refresh,
} = useVirtualScrollTableData<User>(usersApi, {
  sortField,
  sortOrder,
  filters,
  pageSize: 50,           // Initial load size
  bufferMultiplier: 1.5,  // Load 1.5x visible rows before/after
  delay: 200,             // Debounce delay
});

// Use the columns composable for column configuration
const { createColumns, formatValue } = useVirtualScrollTableColumns(
  'users',
  // Pass your localization store here if available
  // localizationStore
);

// Define columns
const columns = createColumns([
  { field: 'username', options: { sortable: true } },
  { field: 'email', options: { sortable: true } },
  { field: 'first_name', options: { sortable: true } },
  { field: 'last_name', options: { sortable: true } },
  { 
    field: 'is_active', 
    options: { 
      sortable: false,
      format: (value: boolean) => value ? 'Active' : 'Inactive'
    } 
  },
]);

// Selection state
const selectedUsers = ref<User[]>([]);

// Action handlers
const handleView = (user: User) => {
  console.log('View user:', user);
  // Navigate to user detail page
};

const handleEdit = (user: User) => {
  console.log('Edit user:', user);
  // Open edit dialog
};

const handleDelete = (user: User) => {
  console.log('Delete user:', user);
  // Show confirmation dialog
};

const handleCustomAction = ({ action, item }: { action: string; item: User }) => {
  console.log('Custom action:', action, item);
  // Handle custom action
};

/**
 * Template usage:
 * 
 * <template>
 *   <div class="users-page">
 *     <VirtualScrollTable
 *       :items="users"
 *       :loading="loading"
 *       :total-records="totalRecords"
 *       :columns="columns"
 *       :selection="selectedUsers"
 *       :actions="{ 
 *         view: true, 
 *         edit: true, 
 *         delete: true,
 *         custom: [
 *           {
 *             name: 'impersonate',
 *             icon: 'pi pi-user',
 *             label: 'Impersonate',
 *             handler: (user) => console.log('Impersonate:', user),
 *             visible: (user) => user.is_active
 *           }
 *         ]
 *       }"
 *       :buffer-multiplier="1.5"
 *       selection-mode="multiple"
 *       data-key="id"
 *       striped
 *       size="small"
 *       scroll-height="calc(100vh - 200px)"
 *       :data-table-props="{
 *         showGridlines: true,
 *         responsiveLayout: 'scroll',
 *         resizableColumns: true,
 *         columnResizeMode: 'expand',
 *         rowHover: true,
 *         breakpoint: '960px'
 *       }"
 *       @update:selection="selectedUsers = $event"
 *       @lazy-load="handleLazyLoad"
 *       @view="handleView"
 *       @edit="handleEdit"
 *       @delete="handleDelete"
 *       @action="handleCustomAction"
 *     >
 *       <!-- Custom column rendering for is_active -->
 *       <template #column-is_active="{ data }">
 *         <Tag
 *           :value="data.is_active ? 'Active' : 'Inactive'"
 *           :severity="data.is_active ? 'success' : 'danger'"
 *         />
 *       </template>
 *       
 *       <!-- Custom empty state -->
 *       <template #empty>
 *         <div class="empty-state">
 *           <i class="pi pi-users" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
 *           <p>No users found</p>
 *         </div>
 *       </template>
 *     </VirtualScrollTable>
 *   </div>
 * </template>
 */

export {
  users,
  loading,
  totalRecords,
  columns,
  selectedUsers,
  handleLazyLoad,
  handleView,
  handleEdit,
  handleDelete,
  handleCustomAction,
  refresh,
};
