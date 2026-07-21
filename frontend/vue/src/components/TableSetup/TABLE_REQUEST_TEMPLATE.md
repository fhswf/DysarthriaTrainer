# New Table Setup Request

**Entity Name:** _e.g., Tasks, Customers, Orders_  
**Route Path:** _e.g., `/tasks`, `/customers`_  
**Estimated Complexity:** ☐ Simple  ☐ Medium  ☐ Complex

---

## 📋 Basic Information

### API Endpoint
- **Base URL:** _e.g., `/api/main/tasks/`_ ⚠️ **CRITICAL: Must use `/api/main/{endpoint}` convention**
- **Existing API Service:** ☐ Yes  ☐ No  ☐ Needs Updates
- **API Service Path:** _e.g., `@/v2/api/tasks`_
- **Signal Parameter Support:** ☐ Yes  ☐ No  ☐ Unknown ⚠️ **CRITICAL: list() must accept signal?: AbortSignal**
- **Supports CSV Export:** ☐ Yes  ☐ No  ☐ Unknown (check if `_export=csv` parameter works)

### Data Model
```typescript
// Primary entity interface
interface YourEntity {
  id: number;
  // Add key properties here
}
```

---

## 📊 Columns Configuration

| Field | Header Label | Sortable | Width | Format | Notes |
|-------|--------------|----------|-------|--------|-------|
| `id` | ID | ✓ | 80px | - | - |
| | | | | | |
| | | | | | |

**Custom Rendering Needed:**
- ☐ Links/Navigation
- ☐ Tags/Badges
- ☐ Images/Avatars
- ☐ Formatted dates/numbers
- ☐ Custom actions
- ☐ Other: ___________

---

## 🔍 Filter Requirements

**Filtering Needed:** ☐ Yes  ☐ No

### Quick Presets (Dropdown)
**At least one preset is required** - these appear in the main dropdown menu

| Preset ID | Label | Filter Logic | Icon |
|-----------|-------|--------------|------|
| `all` | All Items | No filters | `pi pi-list` ⚠️ **Must be 'pi pi-{icon}' format** |
| | | | |

⚠️ **CRITICAL ICON FORMAT**: All icons must use two classes: `'pi pi-{icon-name}'`
- ❌ Wrong: `'pi-list'`
- ✅ Correct: `'pi pi-list'`

⚠️ **CRITICAL DYNAMIC DATES**: Date-based filters must use arrow functions:
- ❌ Wrong: `filters: { created_at__gte: dayjs().toISOString() }`
- ✅ Correct: `filters: () => ({ created_at__gte: dayjs().toISOString() })`

### Quick Action Buttons (Optional)
These appear as buttons inside the filter dialog for common shortcuts

| Preset ID | Label | Filter Logic | Icon | Severity |
|-----------|-------|--------------|------|----------|
| | | | `pi pi-{icon}` ⚠️ **Two classes** | success/info/warning/danger |

⚠️ **CRITICAL**: If filter logic includes dates, use arrow function syntax:
- ✅ Correct: `filters: () => ({ date__gte: dayjs().toISOString() })`

### Filter Fields
| Field Key | Type | Label | Group | Options/Choices |
|-----------|------|-------|-------|-----------------|
| | text / select / date / tristate / daterange / numberrange | | basic | |
| | | | | |

**Available Field Types:**
- `text` - Text input
- `select` - Dropdown selection (requires `choices` option)
- `date` - Single date picker
- `daterange` - Start/end date range
- `tristate` - Yes/No/All toggle
- `numberrange` - Min/max numeric range

**Field Groups:**
- ☐ Basic Information
- ☐ Contact Information
- ☐ Advanced Filters
- ☐ Custom: ___________

---

## ⚙️ Features & Actions

### Table Features
- ☐ Search (by: _____________)
- ☐ Filters
- ☐ Sort
- ☐ Refresh
- ☐ CSV Export
- ☐ Bulk Delete

### Row Actions
- ☐ View (navigate to: _____________)
- ☐ Edit (navigate to: _____________)
- ☐ Delete (confirmation required)
- ☐ Custom Actions: ___________

### Toolbar Actions
- ☐ Create New (navigate to: _____________)
- ☐ Import
- ☐ Other: ___________

---

## 🎨 Customization

### Initial State
- **Default Sort Field:** _e.g., `name`_
- **Default Sort Order:** ☐ Ascending  ☐ Descending
- **Default Filter Preset:** _e.g., `all`_

### Table Appearance
- **Row Height:** ☐ Small (50px)  ☐ Normal (60px)  ☐ Large (80px)
- **Selection Mode:** ☐ None  ☐ Single  ☐ Multiple
- **Striped Rows:** ☐ Yes  ☐ No

### Empty State
- **Custom Message:** _Optional - leave blank for default_
- **Custom Action:** _Optional_

---

## 🌐 Translations

**i18n Key:** _e.g., `tasks`, `customers`_

**IMPORTANT:** The localization service is async. All translation methods must be awaited:
```typescript
// ✅ Correct
const title = await loc.t('tasks.title');

// ❌ Incorrect
const title = loc.t('tasks.title');
```

### Required Translation Keys
```yaml
yourEntities:
  title: "Page Title"
  
  search:
    placeholder: "Search placeholder..."
  
  columns:
    # Column header translations
    # Use either full path in headerKey or short key (auto-prefixed)
    name: "Name"
    status: "Status"
    
  emptyState:
    title: "No items found"
    description: "Get started message"
    descriptionFiltered: "No items match your filters"
    clearFilters: "Clear Filters"
    action: "Create Item"
    
  confirmDelete:
    title: "Confirm Delete"
    message: "Are you sure?"
    
  messages:
    deleteSuccess: "Item deleted successfully"
    exportSuccess: "Data exported successfully"
    
  errors:
    deleteFailed: "Failed to delete item"
    exportFailed: "Failed to export data"
    
  filters:
    # Preset labels
    presets:
      all: "All Items"
      
    # Quick preset labels (if used)
    quickPresets:
      today: "Today"
      
    # Field labels
    fields:
      name: "Name"
      
    # Group labels
    groups:
      basic: "Basic Information"
```

**Translation Files:**
- ☐ English (`en/yourEntities.ts`)
- ☐ German (`de/yourEntities.ts`)
- ☐ Other: ___________

---

## 🔐 Permissions & Access Control

- **Required Permission:** _e.g., `view_tasks`, `manage_customers`_
- **Role Restrictions:** _e.g., Admin only, Manager+_
- **Row-Level Security:** ☐ Yes  ☐ No
  - Details: ___________

---

## 📝 Additional Requirements

### Special Behaviors
_Describe any special logic, conditional rendering, or unique features_

**Examples:**
- Inline editing (like SelectButton for roles)
- Conditional row styling
- Dynamic action buttons based on row state
- Real-time updates or polling
- Custom confirmation dialogs

### Related Pages/Components
_List any related forms, detail pages, or dependent components_

### Data Dependencies
_External data needed (dropdowns, related entities, etc.)_

### Performance Considerations
- **Expected Record Count:** _e.g., ~1000, ~10000, ~100000_
- **Heavy Filtering:** ☐ Yes  ☐ No
- **Real-time Updates:** ☐ Yes  ☐ No

---

## ✅ Acceptance Criteria

### Implementation Requirements
- [ ] **API Service** has all critical requirements:
  - [ ] `public readonly baseUrl = '/api/main/{endpoint}'` (correct path convention)
  - [ ] `list()` accepts `signal?: AbortSignal` parameter
  - [ ] Signal is passed to axios: `get(url, { params, signal })`
  - [ ] `delete()` accepts `id: number | string` (not just number)
- [ ] **Page Component** has proper API wrapper:
  - [ ] Wrapper accepts signal parameter: `list: async (params, signal?) => {}`
  - [ ] Signal forwarded to API: `await api.list(apiParams, signal)`
  - [ ] Search uses `'search' in params` check (not `if (params.search)`)
  - [ ] Parameter mapping excludes control params (page, pageSize, sortField, sortOrder)
- [ ] **Filter Configuration** follows best practices:
  - [ ] All icons use `'pi pi-{icon}'` format (two classes)
  - [ ] Dynamic date filters use arrow functions: `filters: () => ({})`
  - [ ] No static date values that evaluate at module load
- [ ] **Icons** display correctly:
  - [ ] All preset icons visible in dropdown
  - [ ] All quick preset icons visible in dialog
  - [ ] All custom column icons visible in table

### Functional Testing
- [ ] Table displays all required columns with correct widths
- [ ] Column headers properly localized (all async calls awaited)
- [ ] Sorting works on specified columns
- [ ] **Search functions correctly**:
  - [ ] Type search query - filters results
  - [ ] Clear search completely - reloads all data (not stuck)
  - [ ] Type very fast - no stuck skeleton loaders
- [ ] **Race condition prevention works**:
  - [ ] Open browser Network tab
  - [ ] Type very quickly in search box
  - [ ] Old requests show "cancelled" status (not "failed")
  - [ ] Only latest request completes successfully
  - [ ] Skeleton loaders disappear after final request
- [ ] Filters apply as expected (presets + fields)
- [ ] Filter state persists in session storage
- [ ] **Filter restoration on page load**:
  - [ ] Apply preset, refresh page - preset restored
  - [ ] Apply custom filters, refresh page - filters restored
  - [ ] Search query restored on page refresh
- [ ] CRUD actions navigate correctly
- [ ] CSV export works (if enabled) - downloads filtered data
- [ ] Delete confirmation dialogs display properly
- [ ] Empty states display properly (both filtered and unfiltered)
- [ ] Translations complete (EN + DE) - all async
- [ ] Session storage preserves state (search, sort, scroll, filters)
- [ ] Mobile responsive
- [ ] Performance acceptable (<500ms initial load)
- [ ] Custom column rendering (if any) works correctly
- [ ] Loading states and skeletons display properly
- [ ] **No console errors or warnings**

---

## 📎 Attachments

**Mockups/Designs:** _Link or attach wireframes/designs_

**Example Data:** _Sample JSON or CSV_

**Related Issues:** _Links to related tickets_

---

## 🚨 Critical Implementation Notes

**Before starting implementation, review these critical requirements:**

### 1. API Service Signal Parameter
```typescript
// ✅ REQUIRED - Accept and forward signal
async list(params?: Params, signal?: AbortSignal): Promise<Response> {
  const response = await this.getApi().get(url, { params, signal });
  return response.data;
}
```

### 2. Search Parameter Handling
```typescript
// ❌ WRONG - Empty string is falsy
if (params.search) {
  apiParams.search = params.search;
}

// ✅ CORRECT - Check key existence
if ('search' in params) {
  apiParams.search = params.search;
}
```

### 3. Icon Format
```typescript
// ❌ WRONG - Single class
icon: 'pi-list'

// ✅ CORRECT - Two classes
icon: 'pi pi-list'
```

### 4. Dynamic Dates
```typescript
// ❌ WRONG - Static value
filters: {
  date__gte: dayjs().toISOString(),
}

// ✅ CORRECT - Arrow function
filters: () => ({
  date__gte: dayjs().toISOString(),
})
```

### 5. API Path Convention
```typescript
// ❌ WRONG
public readonly baseUrl = '/api/tasks';

// ✅ CORRECT
public readonly baseUrl = '/api/main/tasks';
```

**📚 Required Reading Before Implementation:**
- [Table Cleanup Guides](/src/v2/concepts/table-cleanup/)
- [TableSetup Quick Start Guide](./SETUP_GUIDE.md)
- [Race Condition Fix Guide](../../concepts/table-cleanup/RACE_CONDITION_FIX.md)
- [Icon Format Fix Guide](../../concepts/table-cleanup/ICON_FORMAT_FIX.md)

---

## 📅 Timeline

**Priority:** ☐ Low  ☐ Medium  ☐ High  ☐ Critical

**Requested By:** _Name/Team_  
**Due Date:** _YYYY-MM-DD_  
**Estimated Effort:** _e.g., 2-4 hours, 1 day_

---

## 💬 Notes

_Any additional context, constraints, or considerations_

---

**Reference Documentation:**
- [TableSetup Quick Start Guide](./SETUP_GUIDE.md) - **Read Step 3 carefully for API wrapper pattern**
- [Table Cleanup Guides](../../concepts/table-cleanup/) - **REQUIRED READING for all implementations**
  - [Race Condition Fix](../../concepts/table-cleanup/RACE_CONDITION_FIX.md) - Signal parameter and search handling
  - [Icon Format Fix](../../concepts/table-cleanup/ICON_FORMAT_FIX.md) - PrimeVue icon requirements
  - [API Module Structure](../../concepts/table-cleanup/API_MODULE_STRUCTURE.md) - Proper API service pattern
- [TableFilter Documentation](../TableFilter/README.md)
- [Employee Table Example](../../pages/employee-table-v2/) - Reference implementation
