# Filter System

Comprehensive guide to the VirtualScrollTable filter system with Django REST Framework integration.

## Table of Contents

- [Overview](#overview)
- [Filter Formats](#filter-formats)
- [DRF Operators](#drf-operators)
- [Usage Examples](#usage-examples)
- [Filter Utilities](#filter-utilities)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

The VirtualScrollTable supports **three filter formats** for maximum flexibility:

1. **Simple Filters** - Backward-compatible key-value pairs
2. **Advanced Filters** - Field-based filters with 25+ DRF operators
3. **Combined Filters** - Mix of simple and advanced filters

All filter formats are automatically converted to Django REST Framework query parameters by the `filter-processor` utility.

### Architecture

```
Parent Component
  ├── filters = ref({ ... })
  ↓
useVirtualScrollTableData
  ├── Watch filters for changes
  ├── Cancel pending requests on change
  ↓
buildParams (from filter-processor)
  ├── Detect filter format (simple/advanced/combined)
  ├── Process simple filters → key=value
  ├── Process advanced filters → field__operator=value
  ↓
API Request
  └── GET /api/resource/?offset=0&limit=50&field__operator=value
```

## Filter Formats

### 1. Simple Filters

**Use Case:** Basic filtering without operators, global search, boolean flags

**Type Definition:**
```typescript
type SimpleFilters = Record<string, any>;
```

**Example:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const searchQuery = ref('');
const isActive = ref<boolean | null>(null);
const role = ref('');

const filters = computed(() => ({
  search: searchQuery.value || undefined,
  is_active: isActive.value ?? undefined,
  role: role.value || undefined,
}));

const { items, loading, totalRecords, onLazyLoad } = 
  useVirtualScrollTableData(apiClient, {
    sortField: ref('created_at'),
    sortOrder: ref(-1),
    filters  // Simple format
  });
</script>
```

**API Request:**
```
GET /api/users/?offset=0&limit=50&search=john&is_active=true&role=admin
```

**When to Use:**
- Global search functionality
- Boolean flags (is_active, is_staff, etc.)
- Exact matches (status, role, etc.)
- Backend has custom filter fields

### 2. Advanced Filters

**Use Case:** Complex filtering with DRF lookup operators

**Type Definition:**
```typescript
interface AdvancedFilter {
  field: string;                    // Field name
  value: FilterValue;               // Filter value
  operator?: string;                // DRF operator (default: 'exact')
  enabled?: boolean;                // Enable/disable filter
}

type FilterValue = string | number | boolean | null | (string | number)[];

interface AdvancedFilters {
  advanced: AdvancedFilter[];
}
```

**Example:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AdvancedFilter } from '@/v2/components/VirtualScrollTable';

const usernameFilter = ref('');
const ageMin = ref<number | null>(null);
const ageMax = ref<number | null>(null);
const roles = ref<string[]>([]);
const createdAfter = ref('');

const filters = computed(() => ({
  advanced: [
    {
      field: 'username',
      value: usernameFilter.value,
      operator: 'icontains',          // Case-insensitive contains
      enabled: !!usernameFilter.value // Conditional filter
    },
    {
      field: 'age',
      value: ageMin.value,
      operator: 'gte',                // Greater than or equal
      enabled: ageMin.value !== null
    },
    {
      field: 'age',
      value: ageMax.value,
      operator: 'lte',                // Less than or equal
      enabled: ageMax.value !== null
    },
    {
      field: 'role',
      value: roles.value,
      operator: 'in',                 // Value in list
      enabled: roles.value.length > 0
    },
    {
      field: 'created_at',
      value: createdAfter.value,
      operator: 'gte',
      enabled: !!createdAfter.value
    }
  ] as AdvancedFilter[]
}));
</script>
```

**API Request:**
```
GET /api/users/?offset=0&limit=50
  &username__icontains=john
  &age__gte=18
  &age__lte=65
  &role__in=admin,staff,manager
  &created_at__gte=2024-01-01
```

**When to Use:**
- Range queries (age, date, price)
- Partial string matching (search by name)
- List filtering (multiple statuses, roles)
- Date/time filtering
- Complex queries requiring specific operators

### 3. Combined Filters

**Use Case:** Mix simple and advanced filters

**Type Definition:**
```typescript
interface CombinedFilters {
  simple?: SimpleFilters;
  advanced?: AdvancedFilter[];
}
```

**Example:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CombinedFilters, AdvancedFilter } from '@/v2/components/VirtualScrollTable';

const searchQuery = ref('');        // Simple: global search
const isActive = ref(true);         // Simple: boolean flag
const usernameFilter = ref('');     // Advanced: partial match
const minAge = ref<number | null>(null);  // Advanced: range

const filters = computed<CombinedFilters>(() => ({
  simple: {
    search: searchQuery.value || undefined,
    is_active: isActive.value,
  },
  advanced: [
    {
      field: 'username',
      value: usernameFilter.value,
      operator: 'icontains',
      enabled: !!usernameFilter.value
    },
    {
      field: 'age',
      value: minAge.value,
      operator: 'gte',
      enabled: minAge.value !== null
    }
  ] as AdvancedFilter[]
}));
</script>
```

**API Request:**
```
GET /api/users/?offset=0&limit=50
  &search=john
  &is_active=true
  &username__icontains=doe
  &age__gte=21
```

**When to Use:**
- Backend has both custom filters and DRF lookups
- Global search + specific field filters
- Mix of simple boolean flags and complex queries

## DRF Operators

### String Operators

| Operator | Description | Example | SQL Equivalent |
|----------|-------------|---------|----------------|
| `exact` | Exact match (case-sensitive) | `username__exact=john` | `WHERE username = 'john'` |
| `iexact` | Exact match (case-insensitive) | `username__iexact=JOHN` | `WHERE UPPER(username) = 'JOHN'` |
| `contains` | Contains (case-sensitive) | `email__contains=@gmail` | `WHERE email LIKE '%@gmail%'` |
| `icontains` | Contains (case-insensitive) | `email__icontains=GMAIL` | `WHERE UPPER(email) LIKE '%GMAIL%'` |
| `startswith` | Starts with (case-sensitive) | `username__startswith=admin` | `WHERE username LIKE 'admin%'` |
| `istartswith` | Starts with (case-insensitive) | `username__istartswith=ADMIN` | `WHERE UPPER(username) LIKE 'ADMIN%'` |
| `endswith` | Ends with (case-sensitive) | `email__endswith=.com` | `WHERE email LIKE '%.com'` |
| `iendswith` | Ends with (case-insensitive) | `email__iendswith=.COM` | `WHERE UPPER(email) LIKE '.COM'` |
| `regex` | Regular expression (case-sensitive) | `username__regex=^[a-z]+$` | `WHERE username ~ '^[a-z]+$'` |
| `iregex` | Regular expression (case-insensitive) | `username__iregex=^[A-Z]+$` | `WHERE username ~* '^[A-Z]+$'` |

### Numeric Operators

| Operator | Description | Example | SQL Equivalent |
|----------|-------------|---------|----------------|
| `gt` | Greater than | `age__gt=18` | `WHERE age > 18` |
| `gte` | Greater than or equal | `age__gte=18` | `WHERE age >= 18` |
| `lt` | Less than | `age__lt=65` | `WHERE age < 65` |
| `lte` | Less than or equal | `age__lte=65` | `WHERE age <= 65` |
| `range` | Between (inclusive) | `age__range=18,65` | `WHERE age BETWEEN 18 AND 65` |

### List Operators

| Operator | Description | Example | SQL Equivalent |
|----------|-------------|---------|----------------|
| `in` | Value in list | `status__in=active,pending` | `WHERE status IN ('active', 'pending')` |

### Boolean Operators

| Operator | Description | Example | SQL Equivalent |
|----------|-------------|---------|----------------|
| `isnull` | Is NULL / Is not NULL | `deleted_at__isnull=true` | `WHERE deleted_at IS NULL` |

### Date/Time Operators

| Operator | Description | Example | SQL Equivalent |
|----------|-------------|---------|----------------|
| `year` | Year equals | `created_at__year=2024` | `WHERE YEAR(created_at) = 2024` |
| `month` | Month equals (1-12) | `created_at__month=12` | `WHERE MONTH(created_at) = 12` |
| `day` | Day equals (1-31) | `created_at__day=25` | `WHERE DAY(created_at) = 25` |
| `hour` | Hour equals (0-23) | `created_at__hour=14` | `WHERE HOUR(created_at) = 14` |
| `minute` | Minute equals (0-59) | `created_at__minute=30` | `WHERE MINUTE(created_at) = 30` |
| `second` | Second equals (0-59) | `created_at__second=45` | `WHERE SECOND(created_at) = 45` |
| `date` | Date equals | `created_at__date=2024-12-25` | `WHERE DATE(created_at) = '2024-12-25'` |
| `time` | Time equals | `created_at__time=14:30:00` | `WHERE TIME(created_at) = '14:30:00'` |

### Combining Operators

You can combine multiple operators on the same field:

```typescript
const filters = computed(() => ({
  advanced: [
    { field: 'age', value: 18, operator: 'gte' },  // age >= 18
    { field: 'age', value: 65, operator: 'lte' },  // age <= 65
    // Result: age BETWEEN 18 AND 65
  ]
}));
```

## Usage Examples

### Example 1: User Search with Multiple Criteria

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CombinedFilters, AdvancedFilter } from '@/v2/components/VirtualScrollTable';

// Simple filters
const searchQuery = ref('');
const isActive = ref<boolean | null>(null);

// Advanced filters
const usernameFilter = ref('');
const emailDomain = ref('');
const minAge = ref<number | null>(null);
const roles = ref<string[]>([]);
const createdAfter = ref<string>('');
const lastLoginBefore = ref<string>('');

const filters = computed<CombinedFilters>(() => ({
  simple: {
    search: searchQuery.value || undefined,
    is_active: isActive.value ?? undefined,
  },
  advanced: [
    // Username contains (case-insensitive)
    {
      field: 'username',
      value: usernameFilter.value,
      operator: 'icontains',
      enabled: !!usernameFilter.value
    },
    // Email ends with domain
    {
      field: 'email',
      value: emailDomain.value,
      operator: 'iendswith',
      enabled: !!emailDomain.value
    },
    // Age minimum
    {
      field: 'age',
      value: minAge.value,
      operator: 'gte',
      enabled: minAge.value !== null
    },
    // Role in list
    {
      field: 'role',
      value: roles.value,
      operator: 'in',
      enabled: roles.value.length > 0
    },
    // Created after date
    {
      field: 'created_at',
      value: createdAfter.value,
      operator: 'gte',
      enabled: !!createdAfter.value
    },
    // Last login before date (inactive users)
    {
      field: 'last_login',
      value: lastLoginBefore.value,
      operator: 'lt',
      enabled: !!lastLoginBefore.value
    }
  ].filter(f => f.enabled !== false) as AdvancedFilter[]
}));
</script>

<template>
  <div class="filters">
    <InputText v-model="searchQuery" placeholder="Global search..." />
    <Checkbox v-model="isActive" label="Active only" />
    <InputText v-model="usernameFilter" placeholder="Username contains..." />
    <InputText v-model="emailDomain" placeholder="Email domain..." />
    <InputNumber v-model="minAge" placeholder="Min age" />
    <MultiSelect v-model="roles" :options="roleOptions" />
    <Calendar v-model="createdAfter" placeholder="Created after..." />
    <Calendar v-model="lastLoginBefore" placeholder="Last login before..." />
  </div>
  
  <VirtualScrollTable
    :items="users"
    :loading="loading"
    :total-records="totalRecords"
    :columns="columns"
    data-key="id"
    @lazy-load="onLazyLoad"
  />
</template>
```

### Example 2: Date Range Filtering

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const dateFrom = ref<Date | null>(null);
const dateTo = ref<Date | null>(null);

const filters = computed(() => ({
  advanced: [
    {
      field: 'created_at',
      value: dateFrom.value?.toISOString().split('T')[0],
      operator: 'gte',
      enabled: dateFrom.value !== null
    },
    {
      field: 'created_at',
      value: dateTo.value?.toISOString().split('T')[0],
      operator: 'lte',
      enabled: dateTo.value !== null
    }
  ]
}));
</script>
```

### Example 3: Conditional Filters

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const showDeleted = ref(false);
const showInactive = ref(false);

const filters = computed(() => ({
  advanced: [
    // Only filter deleted_at if NOT showing deleted
    {
      field: 'deleted_at',
      value: null,
      operator: 'isnull',
      enabled: !showDeleted.value  // Conditional: only when NOT showing deleted
    },
    // Only filter is_active if NOT showing inactive
    {
      field: 'is_active',
      value: true,
      operator: 'exact',
      enabled: !showInactive.value
    }
  ]
}));
</script>
```

## Filter Utilities

### buildParams

Main utility for converting filters to API parameters.

```typescript
import { buildParams } from '@/v2/components/VirtualScrollTable';

const params = buildParams(
  0,                          // offset
  50,                         // limit
  'username',                 // sortField
  1,                          // sortOrder (1 = ASC, -1 = DESC)
  {                           // filters
    advanced: [
      { field: 'age', value: 18, operator: 'gte' }
    ]
  }
);

// Result:
// {
//   offset: 0,
//   limit: 50,
//   ordering: 'username',
//   age__gte: 18
// }
```

### isCombinedFilters

Check if filters are in combined format.

```typescript
import { isCombinedFilters } from '@/v2/components/VirtualScrollTable';

if (isCombinedFilters(filters)) {
  // Has 'simple' or 'advanced' keys
  console.log('Combined format');
} else {
  // Simple key-value format
  console.log('Simple format');
}
```

### buildFilterParam

Build DRF parameter name.

```typescript
import { buildFilterParam } from '@/v2/components/VirtualScrollTable';

buildFilterParam('username', 'icontains'); // → 'username__icontains'
buildFilterParam('age', 'gte');            // → 'age__gte'
buildFilterParam('status', 'exact');       // → 'status' (exact is default)
buildFilterParam('status');                // → 'status'
```

### formatFilterValue

Format filter value for API.

```typescript
import { formatFilterValue } from '@/v2/components/VirtualScrollTable';

formatFilterValue('john');                 // → 'john'
formatFilterValue(['admin', 'staff']);     // → 'admin,staff'
formatFilterValue(true);                   // → 'true'
formatFilterValue(null);                   // → 'null'
formatFilterValue(42);                     // → '42'
```

## Best Practices

### 1. Use Computed for Filters

Always use `computed` for filters to ensure reactivity:

```typescript
// ✅ Good
const filters = computed(() => ({
  advanced: [
    { field: 'username', value: usernameFilter.value, operator: 'icontains' }
  ]
}));

// ❌ Bad
const filters = ref({
  advanced: [
    { field: 'username', value: usernameFilter.value, operator: 'icontains' }
  ]
});
```

### 2. Use enabled Flag for Conditional Filters

```typescript
// ✅ Good - enabled flag
const filters = computed(() => ({
  advanced: [
    {
      field: 'username',
      value: usernameFilter.value,
      operator: 'icontains',
      enabled: !!usernameFilter.value  // Only enabled when has value
    }
  ]
}));

// ❌ Bad - conditional array
const filters = computed(() => ({
  advanced: usernameFilter.value
    ? [{ field: 'username', value: usernameFilter.value, operator: 'icontains' }]
    : []
}));
```

### 3. Filter Undefined Values

```typescript
// ✅ Good
const filters = computed(() => ({
  search: searchQuery.value || undefined,  // undefined removed from params
  is_active: isActive.value ?? undefined,
}));

// ❌ Bad
const filters = computed(() => ({
  search: searchQuery.value,  // Sends empty string ''
  is_active: isActive.value,  // Sends false even when not set
}));
```

### 4. Type Safety with TypeScript

```typescript
import type { CombinedFilters, AdvancedFilter } from '@/v2/components/VirtualScrollTable';

// ✅ Good - typed
const filters = computed<CombinedFilters>(() => ({
  simple: { search: searchQuery.value },
  advanced: [
    { field: 'age', value: 18, operator: 'gte' }
  ] as AdvancedFilter[]
}));

// ❌ Bad - no types
const filters = computed(() => ({
  simple: { search: searchQuery.value },
  advanced: [
    { field: 'age', value: 18, operator: 'gte' }
  ]
}));
```

### 5. Complex Filters with Helpers

```typescript
// ✅ Good - helper functions
const buildAgeFilter = (min: number | null, max: number | null): AdvancedFilter[] => {
  const filters: AdvancedFilter[] = [];
  
  if (min !== null) {
    filters.push({ field: 'age', value: min, operator: 'gte', enabled: true });
  }
  
  if (max !== null) {
    filters.push({ field: 'age', value: max, operator: 'lte', enabled: true });
  }
  
  return filters;
};

const filters = computed(() => ({
  advanced: [
    ...buildAgeFilter(minAge.value, maxAge.value),
    ...buildDateFilter(dateFrom.value, dateTo.value),
  ]
}));
```

## Migration Guide

### From Simple to Advanced

**Before (Simple):**
```typescript
const filters = ref({
  search: 'john',
  is_active: true
});
```

**After (Advanced):**
```typescript
const filters = ref({
  advanced: [
    { field: 'search', value: 'john', operator: 'exact' },
    { field: 'is_active', value: true, operator: 'exact' }
  ]
});
```

### From Simple to Combined

Keep existing simple filters, add advanced:

```typescript
const filters = ref({
  simple: {
    search: 'john',     // Keep simple search
    is_active: true
  },
  advanced: [
    { field: 'age', value: 18, operator: 'gte' }  // Add advanced
  ]
});
```

### Backend Migration

**Django View Before:**
```python
# Custom filtering only
class UserListView(ListAPIView):
    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(username__icontains=search)
        return qs
```

**Django View After (with DRF filters):**
```python
from django_filters import rest_framework as filters

class UserFilter(filters.FilterSet):
    age__gte = filters.NumberFilter(field_name='age', lookup_expr='gte')
    age__lte = filters.NumberFilter(field_name='age', lookup_expr='lte')
    username__icontains = filters.CharFilter(field_name='username', lookup_expr='icontains')
    
    class Meta:
        model = User
        fields = ['is_active', 'role']  # Exact matches

class UserListView(ListAPIView):
    queryset = User.objects.all()
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = UserFilter
```

---

**Last Updated:** 2025-01-18  
**Component Version:** 2.0.0  
**Supported Operators:** 25+
