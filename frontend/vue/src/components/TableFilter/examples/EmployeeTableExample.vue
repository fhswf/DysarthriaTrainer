<template>
  <div class="employee-table-example">
    <h1>Employee Table with Filters</h1>
    
    <!-- Filter Component -->
    <div class="filter-section mb-4">
      <TableFilter
        ref="filterRef"
        v-model:filters="filters"
        :config="employeeFilterConfig"
        @change="handleFilterChange"
        @apply="handleFilterApply"
      />
      
      <!-- Filter Debug Info -->
      <div v-if="showDebug" class="debug-panel mt-3 p-3 bg-gray-100 rounded">
        <h3>Active Filters ({{ activeFilterCount }})</h3>
        <pre>{{ JSON.stringify(filters, null, 2) }}</pre>
      </div>
    </div>
    
    <!-- Employee Table -->
    <div class="table-section">
      <DataTable
        :value="filteredEmployees"
        :loading="loading"
        :rows="10"
        :paginator="true"
        :rowsPerPageOptions="[10, 25, 50]"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="employeeId" header="ID" sortable />
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="department" header="Department" sortable />
        <Column field="employmentStatus" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.employmentStatus" :severity="getStatusSeverity(data.employmentStatus)" />
          </template>
        </Column>
        <Column field="isActive" header="Active" sortable>
          <template #body="{ data }">
            <i :class="data.isActive ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
          </template>
        </Column>
        <Column field="hireDate" header="Hire Date" sortable />
        <Column field="location" header="Location" sortable />
      </DataTable>
    </div>
    
    <!-- Actions -->
    <div class="actions-section mt-4">
      <Button label="Clear Filters" icon="pi pi-times" severity="secondary" @click="clearFilters" />
      <Button label="Reset to Active" icon="pi pi-refresh" severity="info" @click="resetToActive" class="ml-2" />
      <Button label="Toggle Debug" icon="pi pi-code" severity="secondary" text @click="showDebug = !showDebug" class="ml-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { TableFilter } from '../index';
import { employeeFilterConfig, type EmployeeFilters } from './employeeFilterConfig';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

/**
 * Employee Table Example
 * 
 * Demonstrates TableFilter component with:
 * - Real employee data
 * - Filter integration with DataTable
 * - Async data loading simulation
 * - Debug panel for development
 */

// ============================================================================
// State
// ============================================================================

const filterRef = ref<{
  applyPreset: (presetId: string) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;
  openDialog: () => void;
  getFilters: () => Partial<EmployeeFilters>;
  getActiveFilterCount: () => number;
} | null>(null);
const filters = ref<Partial<EmployeeFilters>>({});
const loading = ref(false);
const showDebug = ref(false);

// Mock employee data
const employees = ref([
  {
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    department: 'engineering',
    employmentStatus: 'fulltime',
    isActive: true,
    hireDate: '2020-01-15',
    lastLogin: '2024-10-24',
    location: 'hq',
    salary: 85000,
    age: 32,
  },
  {
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    department: 'sales',
    employmentStatus: 'fulltime',
    isActive: true,
    hireDate: '2019-06-20',
    lastLogin: '2024-10-23',
    location: 'branch',
    salary: 75000,
    age: 29,
  },
  {
    employeeId: 'EMP003',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    department: 'marketing',
    employmentStatus: 'parttime',
    isActive: true,
    hireDate: '2021-03-10',
    lastLogin: '2024-10-24',
    location: 'remote',
    salary: 50000,
    age: 35,
  },
  {
    employeeId: 'EMP004',
    name: 'Alice Williams',
    email: 'alice.williams@company.com',
    department: 'hr',
    employmentStatus: 'fulltime',
    isActive: false,
    hireDate: '2018-11-05',
    lastLogin: '2024-09-15',
    location: 'hq',
    salary: 70000,
    age: 41,
  },
  {
    employeeId: 'EMP005',
    name: 'Charlie Brown',
    email: 'charlie.brown@company.com',
    department: 'engineering',
    employmentStatus: 'intern',
    isActive: true,
    hireDate: '2024-06-01',
    lastLogin: '2024-10-24',
    location: 'hq',
    salary: 35000,
    age: 22,
  },
  {
    employeeId: 'EMP006',
    name: 'Diana Prince',
    email: 'diana.prince@company.com',
    department: 'finance',
    employmentStatus: 'fulltime',
    isActive: true,
    hireDate: '2017-02-28',
    lastLogin: '2024-10-24',
    location: 'hq',
    salary: 95000,
    age: 38,
  },
]);

// ============================================================================
// Computed
// ============================================================================

/**
 * Filter employees based on current filters
 */
const filteredEmployees = computed(() => {
  let result = employees.value;
  
  // Name filter
  if (filters.value.name) {
    const searchTerm = filters.value.name.toLowerCase();
    result = result.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Email filter
  if (filters.value.email) {
    const searchTerm = filters.value.email.toLowerCase();
    result = result.filter(emp => 
      emp.email.toLowerCase().includes(searchTerm)
    );
  }
  
  // Employee ID filter
  if (filters.value.employeeId) {
    const searchTerm = filters.value.employeeId.toLowerCase();
    result = result.filter(emp => 
      emp.employeeId.toLowerCase().includes(searchTerm)
    );
  }
  
  // Active status filter
  if (filters.value.isActive !== undefined) {
    result = result.filter(emp => emp.isActive === filters.value.isActive);
  }
  
  // Employment status filter
  if (filters.value.employmentStatus) {
    result = result.filter(emp => emp.employmentStatus === filters.value.employmentStatus);
  }
  
  // Department filter
  if (filters.value.department) {
    result = result.filter(emp => emp.department === filters.value.department);
  }
  
  // Location filter
  if (filters.value.location) {
    result = result.filter(emp => emp.location === filters.value.location);
  }
  
  // Hire date range filter
  if (filters.value.hireDate__gte) {
    result = result.filter(emp => emp.hireDate >= filters.value.hireDate__gte!);
  }
  if (filters.value.hireDate__lte) {
    result = result.filter(emp => emp.hireDate <= filters.value.hireDate__lte!);
  }
  
  // Last login range filter
  if (filters.value.lastLogin__gte) {
    result = result.filter(emp => emp.lastLogin >= filters.value.lastLogin__gte!);
  }
  if (filters.value.lastLogin__lte) {
    result = result.filter(emp => emp.lastLogin <= filters.value.lastLogin__lte!);
  }
  
  // Salary range filter
  if (filters.value.salary__gte !== undefined) {
    result = result.filter(emp => emp.salary >= filters.value.salary__gte!);
  }
  if (filters.value.salary__lte !== undefined) {
    result = result.filter(emp => emp.salary <= filters.value.salary__lte!);
  }
  
  // Age range filter
  if (filters.value.age__gte !== undefined) {
    result = result.filter(emp => emp.age >= filters.value.age__gte!);
  }
  if (filters.value.age__lte !== undefined) {
    result = result.filter(emp => emp.age <= filters.value.age__lte!);
  }
  
  return result;
});

/**
 * Active filter count
 */
const activeFilterCount = computed(() => {
  return filterRef.value?.getActiveFilterCount() || 0;
});

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle filter change
 */
function handleFilterChange(newFilters: Partial<EmployeeFilters>) {
  console.log('[EmployeeTable] Filters changed:', newFilters);
  
  // Simulate async data loading
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 300);
}

/**
 * Handle filter apply
 */
function handleFilterApply(appliedFilters: Partial<EmployeeFilters>) {
  console.log('[EmployeeTable] Filters applied:', appliedFilters);
}

/**
 * Clear all filters
 */
function clearFilters() {
  filterRef.value?.clearFilters();
}

/**
 * Reset to "Active" preset
 */
function resetToActive() {
  filterRef.value?.applyPreset('active');
}

/**
 * Get tag severity for employment status
 */
function getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'secondary' {
  switch (status) {
    case 'fulltime':
      return 'success';
    case 'parttime':
      return 'info';
    case 'contract':
      return 'warning';
    case 'intern':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  console.log('[EmployeeTable] Component mounted');
});
</script>

<style scoped>
.employee-table-example {
  padding: 2rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.debug-panel {
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  background: var(--surface-50);
}

.debug-panel h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.debug-panel pre {
  margin: 0;
  font-size: 0.875rem;
  overflow-x: auto;
}
</style>
