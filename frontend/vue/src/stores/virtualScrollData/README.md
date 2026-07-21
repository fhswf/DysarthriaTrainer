# Virtual Scroll Data Store

Store-based data management system for virtual scrolling tables in the V2 architecture.

## Overview

The Virtual Scroll Data Store provides lifecycle-independent paging with automatic request deduplication and concurrency limiting. It's designed to eliminate race conditions and improve performance for large datasets.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vue Component                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  useVirtualScrollTableData (Composable)         │   │
│  └───────────────────┬─────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│           useVirtualScrollDataStore (Pinia)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Map<string, VirtualScrollPager>                │   │
│  │  - createPager()                                │   │
│  │  - getPager()                                   │   │
│  │  - removePager()                                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              VirtualScrollPager<T>                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Page Cache: Map<pageNum, Page|Promise<Page>>  │   │
│  │  - getCount()                                   │   │
│  │  - getRecord(index)                             │   │
│  │  - getRecords(first, last)                      │   │
│  │  - updateConfig()                               │   │
│  └───────────────────┬─────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               PromiseQueue<T>                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Concurrency: 5 max                             │   │
│  │  - add(promiseFn)                               │   │
│  │  - clear()                                      │   │
│  └───────────────────┬─────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Client                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  list(params): Promise<PaginatedResponse>       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Module Structure

```
virtualScrollData/
├── index.ts              # Main exports
├── store.ts              # Pinia store
├── VirtualScrollPager.ts # Core pager class
├── PromiseQueue.ts       # Concurrency manager
├── types.ts              # TypeScript types
└── README.md             # This file
```

## Usage

### Basic Usage

```typescript
import { useVirtualScrollDataStore } from '@/v2/stores/virtualScrollData';

// In component setup
const store = useVirtualScrollDataStore();

// Create pager instance
const pager = store.createPager('employee-table', employeeApi, 50);

// Get total count
const count = await pager.getCount(); // 1000

// Get records for virtual scroll viewport
const records = await pager.getRecords(0, 50); // First 50 items
```

### With Filters and Sorting

```typescript
// Update configuration (triggers reset)
pager.updateConfig(
  'name',                    // Sort field
  1,                         // Sort order (1 = asc, -1 = desc)
  { status: 'active' }       // Filters
);

// Reload data with new config
const records = await pager.getRecords(0, 50);
```

### Cleanup

```typescript
import { onBeforeUnmount } from 'vue';

// Always cleanup on unmount to prevent memory leaks
onBeforeUnmount(() => {
  store.removePager('employee-table');
});
```

## Key Features

### 1. Promise Caching (Request Deduplication)

Multiple concurrent requests for the same page return the same promise:

```typescript
// Both calls fire only ONE API request
const promise1 = pager.getRecords(0, 50);
const promise2 = pager.getRecords(25, 75); // Overlaps with first request

await Promise.all([promise1, promise2]); // Only page 0 requested once
```

**How it works**:
1. First request creates promise, caches it
2. Second request finds cached promise, returns it
3. After API response, promise replaced with actual data

### 2. Concurrency Limiting

PromiseQueue ensures maximum 5 concurrent API requests:

```typescript
// User rapidly scrolls through 1000 items
// Without limiting: 20+ concurrent requests → Server overload
// With PromiseQueue: Max 5 concurrent requests → Server happy
```

### 3. Lifecycle Independence

Pagers live in the store, not in components:

```typescript
// ❌ V1: Component unmounts → Race condition
// Async callback tries to update unmounted component

// ✅ V2: Component unmounts → Pager still in store
// onBeforeUnmount cleanup prevents memory leaks
```

### 4. Zero setTimeout

Direct async loading eliminates timing issues:

```typescript
// ❌ V1: setTimeout(async () => { ... }, 200)
//      - Race conditions
//      - Arbitrary delays
//      - Lifecycle tracking required

// ✅ V2: await pager.getRecords(...)
//      - Direct async
//      - No race conditions
//      - Vue reactivity via nextTick
```

## API Reference

### VirtualScrollPager<T>

**Constructor**
```typescript
new VirtualScrollPager<T>(apiClient: BaseApiClient<T>, pageSize: number = 50)
```

**Methods**
- `getCount(): Promise<number>` - Get total item count
- `getRecord(index: number): Promise<T | null>` - Get single item by index
- `getRecords(first: number, last: number): Promise<(T | null)[]>` - Get range of items
- `updateConfig(sortField?, sortOrder?, filters?)` - Update and reset if changed
- `reset()` - Clear cache and pending requests

**Properties**
- `count: number | null` - Total item count
- `sortField: string | null` - Current sort field
- `sortOrder: number | null` - Current sort order
- `filters: Record<string, any>` - Current filters

### useVirtualScrollDataStore

**Actions**
- `createPager<T>(key, apiClient, pageSize)` - Create new pager instance
- `getPager<T>(key)` - Get existing pager instance
- `removePager(key)` - Remove pager instance (cleanup)
- `getActiveKeys()` - Get all active pager keys
- `clearAll()` - Remove all pagers

### PromiseQueue<T>

**Constructor**
```typescript
new PromiseQueue<T>(concurrency: number = 5)
```

**Methods**
- `add(promiseFn: () => Promise<T>): Promise<T>` - Add promise to queue
- `clear()` - Clear pending tasks

**Properties**
- `running: number` - Current running count
- `pending: number` - Current queued count

## Performance Comparison

### V1 (Old Approach)
```
Code: 871 lines
State trackers: 5
Lifecycle guards: 5+
Race conditions: Prone
Memory leaks: Possible
Concurrency: Unlimited
```

### V2 (New Approach)
```
Code: 350 lines (60% reduction)
State trackers: 2
Lifecycle guards: 0
Race conditions: Immune
Memory leaks: Prevented
Concurrency: 5 max
```

## Migration Guide

### From V1 to V2

**V1 Code**:
```typescript
const { items, loading, totalRecords, onLazyLoad } = 
  useVirtualScrollTableData(apiService, options);
```

**V2 Code**:
```typescript
// Same API - drop-in replacement
const { items, loading, totalRecords, onLazyLoad } = 
  useVirtualScrollTableData(apiService, options);

// Behind the scenes: Now uses store-based pager
```

**Feature Flag**:
```typescript
// In useTableSetupData.ts
const USE_V2_PAGER = true; // Enable V2
```

## Troubleshooting

### Memory Leaks
**Symptom**: Memory usage grows over time
**Cause**: Not removing pagers on unmount
**Solution**: Always add cleanup:
```typescript
onBeforeUnmount(() => {
  store.removePager(instanceKey);
});
```

### Duplicate Requests
**Symptom**: Same page requested multiple times
**Cause**: Different pager instances for same table
**Solution**: Use consistent instance keys

### Stale Data
**Symptom**: Old data shown after filter change
**Cause**: Pager not reset after config change
**Solution**: `updateConfig()` automatically resets

## Related Documentation

- [V2_IMPLEMENTATION.md](../../components/VirtualScrollTable/V2_IMPLEMENTATION.md) - Full V2 implementation guide
- [REFACTORING_CONCEPT.md](../../../../docs/concepts/virtual-scroll-table/REFACTORING_CONCEPT.md) - Original refactoring plan
- [V2_RENDER_TIMING_FIX.md](../../components/VirtualScrollTable/V2_RENDER_TIMING_FIX.md) - Render timing fixes

## License

Internal use only - Part of Omnia Pflege application
