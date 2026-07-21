<template>
  <div class="table-toolbar-example p-6">
    <h1 class="text-2xl font-bold mb-4">TableToolbar Component Example</h1>
    
    <!-- Example 1: Full Featured -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-3">Example 1: Full Featured Toolbar</h2>
      
      <TableToolbar
        title="Employees"
        v-model:search-query="searchQuery1"
        search-placeholder="Search employees by name or email..."
        :show-delete-all="hasSelection1"
        :selected-count="selectedRows1.length"
        :loading="loading1"
        @refresh="handleRefresh1"
        @export="handleExport1"
        @create="handleCreate1"
        @delete-all="handleDeleteAll1"
      >
        <template #filter>
          <Button
            icon="pi pi-filter"
            label="Filters"
            severity="secondary"
            outlined
            @click="showFilters1 = !showFilters1"
          />
        </template>
      </TableToolbar>

      <DataTable
        :value="filteredData1"
        v-model:selection="selectedRows1"
        data-key="id"
        paginator
        :rows="5"
        class="mt-4"
      >
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="role" header="Role" sortable />
      </DataTable>
    </div>

    <!-- Example 2: Minimal (Search Only) -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-3">Example 2: Minimal Toolbar (Search Only)</h2>
      
      <TableToolbar
        title="Products"
        v-model:search-query="searchQuery2"
        :show-refresh="false"
        :show-export="false"
        :show-create="false"
      />

      <DataTable
        :value="filteredData2"
        data-key="id"
        paginator
        :rows="5"
        class="mt-4"
      >
        <Column field="name" header="Product" sortable />
        <Column field="price" header="Price" sortable />
        <Column field="stock" header="Stock" sortable />
      </DataTable>
    </div>

    <!-- Example 3: Custom Actions -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-3">Example 3: Custom Actions</h2>
      
      <TableToolbar
        title="Orders"
        v-model:search-query="searchQuery3"
        @refresh="handleRefresh3"
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
            v-tooltip.bottom="'Settings'"
            @click="showSettings"
          />
        </template>
      </TableToolbar>

      <DataTable
        :value="filteredData3"
        data-key="id"
        paginator
        :rows="5"
        class="mt-4"
      >
        <Column field="orderNumber" header="Order #" sortable />
        <Column field="customer" header="Customer" sortable />
        <Column field="total" header="Total" sortable />
        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TableToolbar from './TableToolbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

/**
 * TableToolbar Example Component
 * 
 * Demonstrates various usage patterns of the TableToolbar component.
 */

// ============================================================================
// Example 1: Full Featured
// ============================================================================

const searchQuery1 = ref('');
const selectedRows1 = ref([]);
const loading1 = ref(false);
const showFilters1 = ref(false);

const data1 = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Manager' },
]);

const hasSelection1 = computed(() => selectedRows1.value.length > 0);

const filteredData1 = computed(() => {
  if (!searchQuery1.value) return data1.value;
  
  const query = searchQuery1.value.toLowerCase();
  return data1.value.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.email.toLowerCase().includes(query) ||
    item.role.toLowerCase().includes(query)
  );
});

const handleRefresh1 = async () => {
  loading1.value = true;
  console.log('[Example 1] Refreshing data...');
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  loading1.value = false;
  console.log('[Example 1] Data refreshed');
};

const handleExport1 = () => {
  console.log('[Example 1] Exporting data...', filteredData1.value);
  alert('Export functionality would generate CSV here');
};

const handleCreate1 = () => {
  console.log('[Example 1] Creating new employee...');
  alert('Navigate to create form');
};

const handleDeleteAll1 = () => {
  console.log('[Example 1] Deleting selected:', selectedRows1.value);
  
  if (confirm(`Delete ${selectedRows1.value.length} items?`)) {
    // Delete logic here
    selectedRows1.value = [];
    alert('Items deleted');
  }
};

// ============================================================================
// Example 2: Minimal
// ============================================================================

const searchQuery2 = ref('');

const data2 = ref([
  { id: 1, name: 'Laptop', price: '$999', stock: 15 },
  { id: 2, name: 'Mouse', price: '$29', stock: 50 },
  { id: 3, name: 'Keyboard', price: '$79', stock: 30 },
  { id: 4, name: 'Monitor', price: '$299', stock: 20 },
  { id: 5, name: 'Headphones', price: '$149', stock: 25 },
]);

const filteredData2 = computed(() => {
  if (!searchQuery2.value) return data2.value;
  
  const query = searchQuery2.value.toLowerCase();
  return data2.value.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.price.toLowerCase().includes(query)
  );
});

// ============================================================================
// Example 3: Custom Actions
// ============================================================================

const searchQuery3 = ref('');

const data3 = ref([
  { id: 1, orderNumber: 'ORD-001', customer: 'John Doe', total: '$1,299', status: 'completed' },
  { id: 2, orderNumber: 'ORD-002', customer: 'Jane Smith', total: '$599', status: 'pending' },
  { id: 3, orderNumber: 'ORD-003', customer: 'Bob Johnson', total: '$899', status: 'shipped' },
  { id: 4, orderNumber: 'ORD-004', customer: 'Alice Williams', total: '$1,499', status: 'completed' },
  { id: 5, orderNumber: 'ORD-005', customer: 'Charlie Brown', total: '$399', status: 'pending' },
]);

const filteredData3 = computed(() => {
  if (!searchQuery3.value) return data3.value;
  
  const query = searchQuery3.value.toLowerCase();
  return data3.value.filter(item => 
    item.orderNumber.toLowerCase().includes(query) ||
    item.customer.toLowerCase().includes(query)
  );
});

const handleRefresh3 = () => {
  console.log('[Example 3] Refreshing orders...');
};

const showHistory = () => {
  console.log('[Example 3] Showing history...');
  alert('History view would open here');
};

const showSettings = () => {
  console.log('[Example 3] Showing settings...');
  alert('Settings dialog would open here');
};

const getStatusSeverity = (status: string): 'success' | 'info' | 'warning' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'shipped':
      return 'info';
    case 'pending':
      return 'warning';
    default:
      return 'info';
  }
};
</script>

<style scoped>
.table-toolbar-example {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
