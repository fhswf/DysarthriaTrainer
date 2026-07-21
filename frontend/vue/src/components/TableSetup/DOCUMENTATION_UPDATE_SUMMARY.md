# TableSetup Documentation Update Summary

**Date:** November 9, 2025  
**Files Updated:**
- `SETUP_GUIDE.md`
- `TABLE_REQUEST_TEMPLATE.md`

## Overview

Updated the TableSetup documentation to accurately reflect the current codebase implementation, with particular focus on async localization, filter configuration, and API service requirements.

---

## Key Changes

### 1. **Async Localization Store** ⚠️ CRITICAL

**Issue:** Documentation showed synchronous localization usage, but the actual `useLocalizationStore` is fully async.

**Fixed:**
- Added prominent warnings about async nature throughout both documents
- Updated all code examples to use `await loc.t(...)`
- Added dedicated "Localization Notes" section with correct usage patterns
- Emphasized in multiple locations that missing `await` will cause runtime errors

**Example:**
```typescript
// ✅ Correct
const title = await loc.t('users.title');

// ❌ Incorrect (returns Promise, not string)
const title = loc.t('users.title');
```

---

### 2. **Column Header Keys**

**Issue:** Inconsistent documentation about `headerKey` usage.

**Fixed:**
- Clarified that `headerKey` can be either:
  - Full path: `'yourEntities.columns.name'`
  - Short key: `'name'` (auto-prefixed with `{i18nKey}.columns.`)
- Updated examples to show full paths for clarity
- Added note in troubleshooting section

---

### 3. **Filter Configuration Structure**

**Issue:** Documentation was incomplete - missing `quickPresets`, `storage`, and `defaults`.

**Fixed:**
- Added complete filter config structure in Step 2
- Documented `quickPresets` (optional quick action buttons in dialog)
- Added `storage` configuration options
- Added `defaults` for initial state
- Updated with real-world example structure

**New Structure:**
```typescript
export const config: TableFilterConfig = {
  id: 'table-id',
  i18nPrefix: 'entity.filters',
  presets: [...],        // Required: Dropdown menu presets
  quickPresets: [...],   // Optional: Dialog button shortcuts
  fields: [...],         // Filter fields
  storage: {...},        // Storage config
  defaults: {...},       // Default values
};
```

---

### 4. **API Service Requirements**

**Issue:** `baseUrl` was marked as "optional" but is required for CSV export.

**Fixed:**
- Clarified that `baseUrl` is required for CSV export feature
- Updated API service interface documentation
- Added note about CSV export parameter (`_export=csv`)
- Enhanced example with proper structure

**Updated Interface:**
```typescript
interface TableApiService<T> {
  list: (params: any) => Promise<{ count: number; results: T[] }>;
  delete?: (id: number | string) => Promise<void>;
  baseUrl?: string; // Required for CSV export
}
```

---

### 5. **Conditional Actions**

**Issue:** Documentation suggested function-based feature flags that aren't implemented.

**Fixed:**
- Removed misleading Pattern 4 example
- Replaced with correct approach using custom action slots
- Explained how to implement row-specific conditional actions

**Before (incorrect):**
```typescript
deleteAction: (item) => item.status !== 'locked'
```

**After (correct):**
```vue
<template #actions="{ data }">
  <Button v-if="data.status !== 'locked'" ... />
</template>
```

---

### 6. **Translation Structure**

**Issue:** Incomplete translation keys in examples.

**Fixed:**
- Added complete translation structure with all required keys
- Added `confirmDeleteAll` messages
- Added `messages` and `errors` sections
- Added `quickPresets` translation keys
- Updated with parameter interpolation examples

**Complete Keys:**
```yaml
yourEntities:
  title: "..."
  search: { placeholder: "..." }
  columns: { ... }
  emptyState: { title, description, descriptionFiltered, clearFilters, action }
  confirmDelete: { title, message }
  confirmDeleteAll: { title, message }
  messages: { deleteSuccess, exportSuccess }
  errors: { deleteFailed, exportFailed }
  filters:
    presets: { ... }
    quickPresets: { ... }
    groups: { ... }
    fields: { ... }
```

---

### 7. **Filter Field Types**

**Issue:** Template didn't list all available field types.

**Fixed:**
- Added complete list of field types with descriptions
- Documented: `text`, `select`, `date`, `daterange`, `tristate`, `numberrange`
- Added field type reference section in template

---

### 8. **Required Imports**

**Issue:** Missing critical imports in example code.

**Fixed:**
- Added `useLocalizationStore` import
- Added `useV2MessagingStore` import
- Ensured all examples have complete import statements

**Updated:**
```typescript
import { useLocalizationStore } from '@/v2/stores/localization';
import { useV2MessagingStore } from '@/v2/stores/messaging';
```

---

### 9. **Acceptance Criteria**

**Issue:** Checklist was too basic and missing key items.

**Fixed:**
- Expanded acceptance criteria with detailed items
- Added localization-specific checks
- Added CSV export verification
- Added loading states and skeleton checks
- Added session storage persistence items

**New Items:**
- Column headers properly localized (all async calls awaited)
- Filter state persists in session storage
- CSV export works - downloads filtered data
- Loading states and skeletons display properly
- Session storage preserves state (search, sort, scroll, filters)

---

### 10. **Additional Sections**

**Added:**
- **Localization Notes** section with async usage patterns
- **Special Behaviors** examples in template
- More detailed troubleshooting tips
- CSV export support checkbox in template
- Performance considerations note

---

## Impact Assessment

### Breaking Changes
❌ **None** - These are documentation-only updates

### Critical Corrections
⚠️ **Async localization** - Most critical fix. Developers following old docs would have runtime errors.

### Completeness
✅ **Significantly improved** - Documentation now matches actual implementation

---

## Testing Recommendations

Developers should verify:
1. All localization calls use `await`
2. Filter configs include all required sections
3. API services have `baseUrl` if export is enabled
4. Translation files are complete
5. Custom actions use slots, not feature flag functions

---

## Migration Guide

### For Existing Code

If you followed the old documentation:

1. **Add await to all localization calls:**
   ```typescript
   // Before
   const title = loc.t('key');
   
   // After
   const title = await loc.t('key');
   ```

2. **Update filter configs:**
   ```typescript
   // Add storage and defaults
   export const config = {
     // ... existing config
     storage: {
       enabled: true,
       persistPreset: true,
       persistCustom: true,
       autoSave: false,
     },
     defaults: {
       preset: 'all',
       filters: {},
     },
   };
   ```

3. **Ensure baseUrl is set:**
   ```typescript
   const apiService = {
     baseUrl: '/api/your-entities', // Required for export
     list: yourApi.list,
     delete: yourApi.delete,
   };
   ```

---

## Documentation Links

- **SETUP_GUIDE.md** - Complete setup walkthrough
- **TABLE_REQUEST_TEMPLATE.md** - Request template for new tables
- **Localization Store** - `src/v2/stores/localization/README.md`
- **TableFilter** - `src/v2/components/TableFilter/README.md`

---

## Verification Status

✅ All changes verified against:
- `TableSetup.vue` implementation
- `TableSetup.types.ts` interface definitions
- `useLocalizationStore` API
- Real-world examples (`user-table-v2`, `polypoint-entry-table-v2`)
- `TableFilter` type definitions
- Current codebase structure

---

## Next Steps

1. ✅ Documentation updated
2. ⏳ Review by team
3. ⏳ Update any dependent documentation
4. ⏳ Share with developers using TableSetup

---

**Reviewed by:** AI Assistant  
**Status:** Complete  
**Confidence:** High - All changes verified against source code
