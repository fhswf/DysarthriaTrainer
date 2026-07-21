# Form Feature Request Template

**Version**: 3.0  
**Last Updated**: 2025-11-09  
**Status**: Enhanced with real-world implementation lessons

Use this template when requesting a new form implementation. Complete all sections to ensure consistent, high-quality forms across the application.

**What's New in v3.0**:

- ✅ Enhanced UI Components & Layout section with Fieldsets, FloatLabel patterns, and error display strategies
- ✅ Added critical PrimeVue DatePicker configuration guidance (update-model-type, no dateFormat)
- ✅ Comprehensive related entity display patterns (colored tags, dropdowns, color handling)
- ✅ Expanded localization section with form sections, field hints, and validation translation patterns
- ✅ Added query-based routing recommendation with code examples
- ✅ Critical API type completeness checklist to avoid missing fields
- ✅ **New: Common Implementation Issues & Solutions section** documenting 7 major issues with prevention strategies
- ✅ Updated based on real employee-absence-demand-form implementation experience

---

## 📋 Basic Information

### Form Name

**Example**: `UserProfileForm`, `EmployeeScheduleForm`, `PatientAdmissionForm`

```
[Your form name here]
```

### Form Purpose

**Example**: "Allow users to create, edit, view, and delete employee records with validation"

```
[Brief description of what this form does]
```

### Usage Context

Select all that apply:

- [ ] Page-based form (full page dedicated to form)
- [ ] Dialog-based form (modal/popup)
- [ ] Inline form (embedded in another component)
- [ ] Multi-step wizard
- [ ] Other: ******\_\_\_******

### Priority

- [ ] Critical (blocking other work)
- [ ] High (needed soon)
- [ ] Medium (nice to have)
- [ ] Low (future enhancement)

---

## 🎯 Form Modes

Check all modes this form should support:

- [ ] **Create** - Add new records
- [ ] **Edit** - Modify existing records
- [ ] **View** - Read-only display of records
- [ ] **Delete** - Confirm deletion of records
- [ ] **Other**: ******\_\_\_******

### Mode-Specific Behavior

**Create Mode**:

- Initial values: [ ] Empty [ ] Pre-filled [ ] From template
- After success: [ ] Navigate back [ ] Stay on form [ ] Navigate to view [ ] Custom: ******\_\_\_******

**Edit Mode**:

- Load data from: [ ] API [ ] Store [ ] Props [ ] Other: ******\_\_\_******
- After success: [ ] Navigate back [ ] Stay on form [ ] Navigate to view [ ] Custom: ******\_\_\_******

**View Mode**:

- Show edit button: [ ] Yes [ ] No
- Show delete button: [ ] Yes [ ] No
- Allow navigation to edit: [ ] Yes [ ] No

**Delete Mode**:

- Confirmation required: [ ] Yes [ ] No
- Show deletion reason field: [ ] Yes [ ] No
- After success: [ ] Navigate back [ ] Custom: ******\_\_\_******

---

## 📊 Data Structure

### Form Data Interface

```typescript
// Example:
interface EmployeeFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthDate: Date
  departmentId: string
  employmentType: 'full-time' | 'part-time' | 'contract'
  startDate: Date
  endDate?: Date
  salary: number
  notes?: string
}
```

```typescript
interface [YourFormName]FormData {
  // Define all form fields with types
  // Use ? for optional fields
  // Use union types for enums/select options
}
```

### API Endpoints

**Create**: `POST /api/[resource]`  
**Edit**: `PUT /api/[resource]/{id}` or `PATCH /api/[resource]/{id}`  
**View**: `GET /api/[resource]/{id}`  
**Delete**: `DELETE /api/[resource]/{id}`

**Custom endpoints** (if different):

```
[List any custom endpoints]
```

---

## ✅ Validation Rules

### Required Fields

List all fields that are required:

```
- firstName (required)
- lastName (required)
- email (required, email format)
- departmentId (required)
- startDate (required)
```

### Field-Specific Validation

```typescript
// Example validation rules using Validation Service
{
  firstName: [
    rules.required('First name is required'),
    rules.minLength(2, 'Min 2 characters'),
    rules.maxLength(50, 'Max 50 characters'),
  ],
  email: [
    rules.required('Email is required'),
    rules.email('Invalid email format'),
    rules.asyncValidation(checkEmailUnique, 'Email already exists'),
  ],
  phone: [
    rules.phone('Invalid phone number'),
  ],
  salary: [
    rules.required('Salary is required'),
    rules.min(0, 'Salary cannot be negative'),
    rules.max(1000000, 'Salary seems unrealistic'),
  ],
}
```

```typescript
// Define your validation rules here
// Use common rules from Validation Service:
// - rules.required(message)
// - rules.email(message)
// - rules.phone(message)
// - rules.password(minLength, message)
// - rules.minLength(min, message)
// - rules.maxLength(max, message)
// - rules.pattern(regex, message)
// - rules.fileSize(maxMB, message)
// - rules.fileType(types[], message)
```

### Async Validation

Does this form need async validation (e.g., uniqueness checks)?

- [ ] Yes - Specify: ******\_\_\_******
- [ ] No

### Cross-Field Validation

Does this form need cross-field validation (e.g., end date after start date)?

- [ ] Yes - Specify: ******\_\_\_******
- [ ] No

---

## 🎨 UI Components

### Field Types

List each field and its input type:

| Field Name     | Input Type    | Options/Config                           | Required | Hint Text                         |
| -------------- | ------------- | ---------------------------------------- | -------- | --------------------------------- |
| firstName      | Text input    | maxLength: 50                            | Yes      | "Enter first name"                |
| email          | Email input   |                                          | Yes      | "Valid email required"            |
| birthDate      | Date picker   | maxDate: today, update-model-type="date" | Yes      | "Select date of birth"            |
| departmentId   | Dropdown      | Load from API, filter: true              | Yes      | -                                 |
| employmentType | Radio buttons | full-time, part-time, contract           | Yes      | -                                 |
| notes          | Textarea      | rows: 4                                  | No       | "Optional notes (max 2000 chars)" |

**Critical Component Configurations**:

- **PrimeVue DatePicker**:

  - ALWAYS use `update-model-type="date"` for Date object v-model
  - DO NOT use `dateFormat` prop (auto-detects from locale in PrimeVue v4+)
  - CRITICAL: Use timezone-safe date conversion utilities (see Date Handling section below)
  - Example: `<DatePicker v-model="date" update-model-type="date" show-icon :show-button-bar="true" />`

- **Dropdown for Related Entities**:

  - Specify which API to load data from (e.g., `employeesApi`, `vacationTypesApi`)
  - Specify `option-label` and `option-value` properties
  - Enable filtering for long lists: `filter` prop
  - Example: `<Select v-model="value" :options="items" option-label="name" option-value="id" filter />`

- **Optional Fields Backend Integration**:

  - Empty values MUST be sent as `null` (not `undefined`) for proper backend clearing
  - Use `formData.field?.trim() || null` for text fields (handles whitespace)
  - Use `formData.field || null` for other optional fields
  - Example: `comment: formData.comment?.trim() || null`

- **Computed/Calculated Fields**:
  - Specify formula (e.g., "to_date - from_date + 1 days")
  - Display format (e.g., "X days", "$X.XX", "X%")
  - Update trigger (e.g., "recalculate when from_date or to_date changes")

### Date Handling (CRITICAL - Timezone-Safe Utilities)

**Problem**: Using `toISOString().split('T')[0]` causes timezone shifts. DatePicker shows 2025-11-05, but API receives 2025-11-04 in UTC+1 timezone.

**Solution**: ALWAYS use timezone-safe utilities from `/src/form/shared/utils/dateHelpers.ts`

**Available Utilities**:

```typescript
import { formatDateForApi, parseLocalDate, formatDate } from '@/form/shared/utils';

// Convert Date to YYYY-MM-DD for API (timezone-safe)
formatDateForApi(date: Date | null): string | null

// Parse YYYY-MM-DD string to Date in local timezone (timezone-safe)
parseLocalDate(dateString: string): Date

// Convenience function for both Date and string
formatDate(date: Date | string | null): string
```

**Usage Pattern**:

```typescript
// ❌ WRONG - Causes timezone shifts
date.toISOString().split('T')[0] // Converts to UTC first!
new Date('2025-11-05') // Parses as UTC midnight

// ✅ CORRECT - Uses local timezone
formatDateForApi(date) // Uses local date components
parseLocalDate('2025-11-05') // Creates Date in local timezone
```

**In Form Types** (converting API to FormData):

```typescript
import { parseLocalDate } from '@/form/shared/utils'

export function apiToFormData(apiData: ApiResponse): FormData {
  return {
    date_field: apiData.date_field ? parseLocalDate(apiData.date_field) : null,
  }
}
```

**In Form Payloads** (converting FormData to API):

```typescript
import { formatDateForApi } from '@/form/shared/utils'

export function formDataToPayload(formData: FormData): ApiPayload {
  return {
    date_field: formatDateForApi(formData.date_field),
  }
}
```

**In Vue Components** (for computed properties with string storage):

```typescript
import { formatDateForApi, parseLocalDate } from '@/form/shared/utils'

const dateModel = computed({
  get(): Date | null {
    if (!formData.date_field) return null
    return parseLocalDate(formData.date_field)
  },
  set(value: Date | null): void {
    formData.date_field = formatDateForApi(value)
  },
})
```

**For Forms with Date Objects** (when using `update-model-type="date"`):

- FormData already stores Date objects (no conversion needed in component)
- Only convert when creating API payloads: `formatDateForApi(formData.date_field)`
- Parse when loading from API: `parseLocalDate(apiResponse.date_field)`

**See Also**:

- [Timezone Fix Summary](/src/concepts/forms/TIMEZONE_FIX_SUMMARY.md)
- [Date Helpers Source](/src/form/shared/utils/dateHelpers.ts)

### Layout Structure

- [ ] Single column
- [ ] Two columns (responsive: single on mobile)
- [ ] Three columns
- [ ] **Fieldsets/Sections** (recommended for complex forms with 5+ fields)
  - [ ] Yes - Specify sections below:
    - Section 1: ******\_\_\_****** (fields: ******\_\_\_******)
    - Section 2: ******\_\_\_****** (fields: ******\_\_\_******)
    - Section 3: ******\_\_\_****** (fields: ******\_\_\_******)
  - [ ] No - Single flat form
  - **Section Options**:
    - [ ] Toggleable (collapsible)
    - [ ] Always expanded
    - [ ] Custom: ******\_\_\_******

**Layout Pattern** (check one):

- [ ] **FloatLabel variant="on"** (recommended - follows employee form pattern)
  - Labels appear inside input, float up on focus/filled
  - Provides clean, modern appearance
  - Requires `FloatLabel` wrapper + `size="small"` on inputs
  - Example: `<FloatLabel variant="on"><Input id="name" /><label for="name">Name *</label></FloatLabel>`
- [ ] Traditional labels above inputs
- [ ] Labels beside inputs (horizontal)
- [ ] Custom: ******\_\_\_******

**Error Display Pattern** (check one):

- [ ] **Below field with `min-h-5` container** (recommended - prevents layout shift)
  - Reserves space for error message to prevent UI jumping
  - Uses opacity transition for smooth appearance
  - Example: `<small class="block min-h-5 text-xs text-red-500" :class="{ 'opacity-0': !error }">{{ error || '&nbsp;' }}</small>`
- [ ] Inline with field (may cause layout shift)
- [ ] Validation summary at top only
- [ ] Custom: ******\_\_\_******

**Field Hints/Help Text** (check one):

- [ ] **Display below label** (in min-h-5 container with error toggle)
  - Shows hint by default, error on validation failure
  - Example: `<small class="block min-h-5 text-xs" :class="error ? 'text-red-500' : 'text-gray-600'">{{ error || hint }}</small>`
- [ ] Display as tooltips (icon with hover)
- [ ] Display above label
- [ ] No hints needed
- [ ] Custom: ******\_\_\_******

### Related Entity Display

For fields that reference other entities (employees, types, categories, etc.):

**Employee/Person Dropdown**:

- Display format: [ ] Full name only [ ] Name + email (two lines) [ ] Name + avatar [ ] Custom: ******\_\_\_******
- Filtering: [ ] Yes (searchable) [ ] No
- Search placeholder: ******\_\_\_******
- Load limit: ******\_\_\_****** (e.g., 1000 for virtual scroll)
- Fields to load: ******\_\_\_****** (e.g., 'id,firstname,lastname,email')

**Status/State Dropdown**:

- Display format: [ ] Plain text [ ] Colored tags with icons [ ] Badges [ ] Custom: ******\_\_\_******
- If using tags, specify severity mapping:
  ```
  'pending': warn / pi-clock
  'approved': success / pi-check-circle
  'rejected': danger / pi-times-circle
  ```

**Type/Category Dropdowns** (e.g., vacation type, product category):

- Display format: [ ] Plain text [ ] Colored tags [ ] Icons [ ] Custom: ******\_\_\_******
- **Color Handling** (if using colored tags):
  - Backend provides: [ ] `color` field only [ ] `bg_color` field only [ ] Both `color` and `bg_color`
  - **Color Priority Logic** (if backend has both):
    1. If both `bg_color` and `color` → use directly (bg=background, color=text)
    2. If only `bg_color` → calculate contrasting text color (black/white)
    3. If only `color` (legacy) → use as background, calculate text color
    4. If no colors → fallback to: ******\_\_\_******
  - Text contrast calculation: [ ] Auto (luminance-based) [ ] Fixed white/black
  - Fallback color (if no backend color): ******\_\_\_****** (e.g., '#6B7280' gray)

**Example Color Handling Function**:

```typescript
function getVacationTypeStyle(type: VacationType) {
  // Priority 1: Both bg_color and color provided
  if (type.bg_color && type.color) {
    return { backgroundColor: type.bg_color, color: type.color }
  }
  // Priority 2: Only bg_color (calculate text)
  if (type.bg_color) {
    return { backgroundColor: type.bg_color, color: getTextColor(type.bg_color) }
  }
  // Priority 3: Only color (legacy, use as background)
  if (type.color) {
    return { backgroundColor: type.color, color: getTextColor(type.color) }
  }
  // Priority 4: Fallback
  return { backgroundColor: '#6B7280', color: '#FFFFFF' }
}
```

### Action Buttons

**Primary Actions**:

- [ ] Save/Submit button
  - Label (key): [ ] `common.save` [ ] `common.create` (create mode) + `common.save` (edit mode) [ ] Custom: ******\_\_\_******
  - Disabled when: [ ] `!isValid` [ ] `isSubmitting` [ ] Both (recommended)
  - Loading state: [ ] Show spinner [ ] Disable only [ ] Both (recommended)
  - Position: [ ] Bottom right (recommended) [ ] Bottom left [ ] Top right [ ] Custom: ******\_\_\_******
  - Size: [ ] small (recommended for forms) [ ] normal [ ] large
- [ ] Cancel button
  - Label (key): `common.cancel` or custom: ******\_\_\_******
  - Default action: [ ] Navigate back [ ] Close dialog [ ] Custom: ******\_\_\_******
  - Confirm if dirty: [ ] Yes (recommended) [ ] No
  - Confirmation message: ******\_\_\_******
  - Position: [ ] Bottom left (recommended) [ ] Bottom right [ ] Custom: ******\_\_\_******
  - Style: [ ] Secondary outlined (recommended) [ ] Text [ ] Custom: ******\_\_\_******

**Secondary Actions**:

- [ ] Delete button
  - When shown: [ ] Edit mode only (recommended) [ ] View mode only [ ] Both
  - Confirmation: [ ] Yes (required) [ ] No
  - Confirmation message: ******\_\_\_******
  - Label: ******\_\_\_****** (e.g., `[domain].actions.delete`)
  - Position: ******\_\_\_****** (separate from primary actions)
- [ ] Reset button
  - Action: [ ] Reset to initial values [ ] Reset to empty [ ] Custom: ******\_\_\_******
- [ ] Preview button
- [ ] Other: ******\_\_\_******

---

## 🔄 Navigation & Behavior

### Page-Based Forms

**Route Configuration**:

```typescript
// Example:
{
  path: '/employee-form',
  name: 'employee-form',
  component: () => import('@/pages/employee-form/app-employee-form.vue'),
  meta: { requiresAuth: true }
}
```

**Mode Detection** (check one):

- [ ] **Query parameter** (`?mode=create&id=123`) - **Recommended for auto-imported routes**
  - ✅ Works with Vue Router's auto-import system (no route file modifications)
  - ✅ Keeps all mode logic in same route/component
  - ✅ Easy to share URLs with specific modes
  - Example: `/employee-absence-demands?mode=edit&id=5`
  - Mode detection:
    ```typescript
    const route = useRoute()
    const mode = computed(() => {
      const modeParam = route.query.mode as string
      if (modeParam === 'edit' && route.query.id) return 'edit'
      if (modeParam === 'view' && route.query.id) return 'view'
      if (modeParam === 'create') return 'create'
      return 'create' // default
    })
    const itemId = computed(() => {
      const id = route.query.id
      return id ? Number(id) : null
    })
    ```
  - Navigation from table:
    ```typescript
    // Create
    router.push({ path: '/employee-absence-demands', query: { mode: 'create' } })
    // Edit
    router.push({ path: '/employee-absence-demands', query: { mode: 'edit', id: item.id } })
    // View
    router.push({ path: '/employee-absence-demands', query: { mode: 'view', id: item.id } })
    ```
- [ ] Route parameter (`/employee-form/:mode/:id?`) - Traditional approach
  - Requires explicit route definitions
  - Cleaner URLs but more route configuration
- [ ] Route name pattern (`v2-employee-create`, `v2-employee-edit`) - Multiple routes
  - Most explicit but requires multiple route files/definitions
- [ ] Custom: ******\_\_\_******

**Default Success Navigation**:

- [ ] Navigate back to list (`router.back()` or specific route)
- [ ] Stay on form with success message
- [ ] Navigate to view mode of created/edited item
- [ ] Custom: ******\_\_\_******

**Default Cancel Navigation**:

- [ ] Navigate back (`router.back()`)
- [ ] Navigate to specific route: ******\_\_\_******
- [ ] Custom: ******\_\_\_******

### Dialog-Based Forms

**Dialog Configuration**:

```typescript
// Example:
{
  width: '600px',
  modal: true,
  dismissableMask: false,
  closeOnEscape: false,
  showHeader: true,
  header: '[Dynamic based on mode]',
}
```

**Default Success Behavior**:

- [ ] Close dialog
- [ ] Close dialog + emit success event
- [ ] Close dialog + refresh parent data
- [ ] Custom: ******\_\_\_******

**Default Cancel Behavior**:

- [ ] Close dialog
- [ ] Close dialog + emit cancel event
- [ ] Show confirmation if dirty
- [ ] Custom: ******\_\_\_******

### Override Capabilities

Should the form expose callback props to override default behavior?

```typescript
// Example props interface
interface [FormName]Props {
  // ... other props

  // Override success behavior
  onSuccess?: (result: [ResultType]) => void | Promise<void>;

  // Override cancel behavior
  onCancel?: () => void | Promise<void>;

  // Override error behavior
  onError?: (error: Error) => void | Promise<void>;

  // Custom navigation after save
  navigateAfterSave?: (result: [ResultType]) => void;

  // Prevent default navigation
  preventDefaultNavigation?: boolean;
}
```

- [ ] Yes, expose override callbacks (specify which ones above)
- [ ] No, use defaults only
- [ ] Custom requirements: ******\_\_\_******

---

## 🌍 Localization

**IMPORTANT:** The localization service is **fully async**. All translation methods return Promises and must be awaited.

```typescript
// ✅ Correct - Always await
const title = await loc.t('employees.form.title.create')
const label = await loc.t('employees.form.labels.firstName')

// ❌ Incorrect - Missing await (will fail)
const title = loc.t('employees.form.title.create') // Returns Promise, not string!
```

See [Localization Service README](../../stores/localization/README.md) for complete documentation.

### Translation Keys Needed

**Form Title** (per mode):

```typescript
// Example:
'employees.form.title.create' // "Create Employee"
'employees.form.title.edit' // "Edit Employee"
'employees.form.title.view' // "Employee Details"
'employees.form.title.delete' // "Delete Employee"
```

**Field Labels**:

```
[domain].form.labels.[fieldName]

Example:
'employees.form.labels.firstName'  // "First Name"
'employees.form.labels.email'      // "Email Address"
```

**Form Sections** (if using Fieldsets):

```
[domain].form.sections.[sectionName]

Example:
'employeeAbsenceDemands.form.sections.basic'        // "Basic Information"
'employeeAbsenceDemands.form.sections.dateRange'    // "Date Range"
'employeeAbsenceDemands.form.sections.additional'   // "Additional Information"
```

**Field Hints/Help Text** (highly recommended for complex fields):

```
[domain].form.hints.[fieldName]

Example:
'employeeAbsenceDemands.form.hints.fromDate'    // "Start date of the absence period"
'employeeAbsenceDemands.form.hints.toDate'      // "End date (must be after or equal to start date)"
'employeeAbsenceDemands.form.hints.published'   // "Optional publication date for the absence request"
'employeeAbsenceDemands.form.hints.comment'     // "Additional notes or comments (max 2000 characters)"
```

**Validation Messages**:

```
[domain].form.validation.[fieldName]_[rule]

Example:
'employees.form.validation.firstName_required'  // "First name is required"
'employees.form.validation.email_invalid'       // "Invalid email address"
'employeeAbsenceDemands.form.validation.toDate_after_fromDate'  // "End date must be after or equal to start date"
```

**CRITICAL: Validation Message Translation**:

- Yup validation schemas produce English error messages by default
- These messages MUST be translated to support multi-language
- **Recommended Pattern**: Create `translateValidationError()` function in composable
  ```typescript
  const translateValidationError = async (message: string): Promise<string> => {
    const errorKeyMap: Record<string, string> = {
      'Email is required': 'employees.form.validation.email_required',
      'Invalid email format': 'employees.form.validation.email_invalid',
      // ... map all possible Yup error messages
    }
    const key = errorKeyMap[message]
    return key ? await loc.t(key) : message
  }
  ```
- Call this function in `validateField()` and `validateForm()` methods
- Ensures errors display in user's selected language

**Common Validation Keys to Define**:

```
[domain].form.validation.employee_required
[domain].form.validation.vacationType_required
[domain].form.validation.fromDate_required
[domain].form.validation.toDate_required
[domain].form.validation.toDate_after_fromDate
[domain].form.validation.dateFormat_invalid
[domain].form.validation.comment_maxLength
[domain].form.validation.status_required
[domain].form.validation.status_invalid
```

Example:
'employees.form.validation.firstName_required' // "First name is required"
'employees.form.validation.email_invalid' // "Invalid email address"

```

**Action Buttons**:
```

[domain].actions.[action]

Example:
'employees.actions.create' // "Create Employee"
'employees.actions.update' // "Update Employee"
'employees.actions.delete' // "Delete Employee"

```

**Provide all custom translation keys** (or use common ones like `common.save`, `common.cancel`):

```

// List all custom translation keys needed
// Use common keys where possible:
// - common.save, common.cancel, common.delete
// - common.create, common.edit, common.view
// - validation.email_invalid, validation.field_required

````

---

## 🔌 Service Dependencies

### Required Services
Check all services this form will use:

- [x] **Validation Service** (always required for forms)
- [ ] **API Service** (for data loading/submission) - See [API README](../../api/README.md)
- [ ] **Localization Service** (for translations) - **Async!** See [Localization README](../../stores/localization/README.md)
- [ ] **Messaging Service** (for success/error toasts)
- [ ] **Auth Service** (for permission checks)
- [ ] **Error Service** (for error handling)
- [ ] **Other**: _______________

### API Endpoints Detail

**Service/Module**: `[e.g., UsersApi, EmployeesApi]`

**Note:** Use resource API classes (not direct API store calls). See [API Module README](../../api/README.md) for patterns.

**Methods Used**:
```typescript
// Example using resource API:
import { usersApi } from '@/api/users';

- usersApi.create(data: UserCreateDto): Promise<User>
- usersApi.update(id: string, data: UserUpdateDto): Promise<User>
- usersApi.getById(id: string): Promise<User>
- usersApi.delete(id: string): Promise<void>

// For dropdowns/select options:
import { departmentsApi } from '@/api/departments';
- departmentsApi.list(): Promise<Department[]>
````

**CRITICAL: API Type Completeness**:

Before implementation, verify API types include ALL form fields:

1. **Check Main Entity Interface**:

   ```typescript
   // Example: EmployeeAbsenceDemand interface
   export interface EmployeeAbsenceDemand {
     id: number
     employee: number
     vacation_type: number
     from_date: string
     to_date: string
     comment?: string | null
     status: 'offen' | 'genehmigt' | 'abgelehnt'
     published?: string | null // ⚠️ Ensure this exists if form has published field
     // ... other fields
   }
   ```

2. **Check Create Payload Interface**:

   ```typescript
   export interface EmployeeAbsenceDemandCreatePayload {
     employee: number
     vacation_type: number
     from_date: string
     to_date: string
     comment?: string | null
     status?: 'offen' | 'genehmigt' | 'abgelehnt'
     published?: string | null // ⚠️ MUST be present if backend accepts it
   }
   ```

3. **Check Update Payload Interface**:
   ```typescript
   export interface EmployeeAbsenceDemandUpdatePayload
     extends Partial<EmployeeAbsenceDemandCreatePayload> {}
   // Ensure it inherits all fields from CreatePayload
   ```

**Common Issues to Avoid**:

- ❌ Form field exists but missing from API types → TypeScript errors
- ❌ API types exist but field not in Create/Update payload → Field not sent to backend
- ❌ Optional fields use `undefined` instead of `null` → Fields omitted from JSON (backend can't clear them)

**Checklist Before Implementation**:

- [ ] Main entity interface has all form fields
- [ ] CreatePayload interface has all creatable fields
- [ ] UpdatePayload inherits from CreatePayload (or has all fields)
- [ ] Optional fields typed as `field?: Type | null` (not just `Type`)
- [ ] Related entity types exist (Employee, VacationType, etc.)
- [ ] List params interface supports needed filters

---

## 🧪 Testing Requirements

### Unit Tests

- [ ] Validation schema tests
- [ ] Form composable tests
- [ ] Mode detection tests
- [ ] Navigation tests
- [ ] Submit handler tests
- [ ] Error handling tests

### Integration Tests

- [ ] Form submission (success)
- [ ] Form submission (error)
- [ ] Field validation on blur
- [ ] Cancel behavior
- [ ] Mode switching
- [ ] Data loading

### E2E Tests

- [ ] Complete create flow
- [ ] Complete edit flow
- [ ] Complete delete flow
- [ ] Cancel navigation
- [ ] Error scenarios

---

## 🎭 Accessibility

### Requirements

- [ ] Keyboard navigation support
- [ ] Screen reader support (ARIA labels)
- [ ] Focus management
- [ ] Error announcements
- [ ] Required field indicators
- [ ] Logical tab order

### ARIA Labels

Provide any specific ARIA label requirements:

```
// Example:
aria-label="Create employee form"
aria-describedby="form-instructions"
aria-invalid="true" (when field has error)
```

---

## 📱 Responsive Design

### Breakpoints

- [ ] Mobile (< 640px): Stack all fields vertically
- [ ] Tablet (640px - 1024px): Two columns
- [ ] Desktop (> 1024px): Three columns or custom layout
- [ ] Custom requirements: ******\_\_\_******

### Mobile Considerations

- [ ] Larger touch targets (44px minimum)
- [ ] Simplified navigation
- [ ] Sticky action buttons
- [ ] Custom mobile layout
- [ ] Other: ******\_\_\_******

---

## 🔒 Security & Permissions

### Permission Requirements

- [ ] Create: Requires role/permission: ******\_\_\_******
- [ ] Edit: Requires role/permission: ******\_\_\_******
- [ ] View: Requires role/permission: ******\_\_\_******
- [ ] Delete: Requires role/permission: ******\_\_\_******

### Data Sensitivity

- [ ] Contains PII (Personal Identifiable Information)
- [ ] Contains sensitive data (passwords, SSN, etc.)
- [ ] Requires audit logging
- [ ] Requires encryption
- [ ] Other: ******\_\_\_******

---

## 📋 Implementation Checklist

Use this checklist during implementation:

### 1. Setup Form Structure

- [ ] Create form folder: `/src/form/[form-name]/`
- [ ] Create types file: `[form-name].types.ts`
- [ ] Create schema file: `[form-name].schema.ts`
- [ ] Create composable: `use[FormName].ts`
- [ ] Create component: `[FormName].vue`
- [ ] Create index: `index.ts` (exports)
- [ ] Create tests folder: `__tests__/`

### 2. Page Integration (if page-based)

- [ ] Create page folder: `/src/pages/[form-name]/`
- [ ] Create page component: `app-[form-name].vue`
- [ ] Create mode composable: `composables/use[FormName]Mode.ts`
- [ ] Create navigation composable: `composables/use[FormName]Navigation.ts`
- [ ] Add route configuration

### 3. Dialog Integration (if dialog-based)

- [ ] Create dialog component wrapper
- [ ] Define dialog props interface
- [ ] Implement dialog events (close, success, cancel)
- [ ] Add dialog to parent component

### 4. Validation

- [ ] Define validation schema using Yup + Validation Service
- [ ] Add field-level validation
- [ ] Add form-level validation
- [ ] Add async validation (if needed)
- [ ] Add cross-field validation (if needed)
- [ ] Test validation rules

### 5. Localization

- [ ] Add English translations (`/src/locales/en/`)
- [ ] Add German translations (`/src/locales/de/`)
- [ ] Update form title translations
- [ ] Update field label translations
- [ ] Update validation message translations
- [ ] Update button label translations

### 6. Form Behavior

- [ ] Implement form state management (`useFormState`)
- [ ] Implement submit handler (`useFormSubmit`)
- [ ] Implement cancel handler with default navigation
- [ ] Implement mode detection (create/edit/view/delete)
- [ ] Implement data loading (edit/view modes)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success/error messages

### 7. Navigation & Overrides

- [ ] Implement default success navigation
- [ ] Implement default cancel navigation
- [ ] Expose override callbacks (onSuccess, onCancel, onError)
- [ ] Add preventDefaultNavigation prop (if needed)
- [ ] Test navigation flows

### 8. UI & Layout

- [ ] Implement form layout (responsive)
- [ ] Add field components (inputs, dropdowns, etc.)
- [ ] Add action buttons (save, cancel, delete)
- [ ] Add loading indicators
- [ ] Add error displays
- [ ] Style form elements
- [ ] Test responsive design

### 9. Accessibility

- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Test screen reader support
- [ ] Add focus management
- [ ] Add error announcements
- [ ] Test with accessibility tools

### 10. Testing

- [ ] Write unit tests for validation schema
- [ ] Write unit tests for form composable
- [ ] Write unit tests for mode/navigation composables
- [ ] Write integration tests
- [ ] Write E2E tests (if required)
- [ ] Test all form modes
- [ ] Test error scenarios

### 11. Documentation

- [ ] Update form README (if needed)
- [ ] Add JSDoc comments
- [ ] Add usage examples
- [ ] Document props/events
- [ ] Document custom behaviors

### 12. Review & Deploy

- [ ] Code review
- [ ] QA testing
- [ ] Accessibility audit
- [ ] Performance check
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 💡 Example Implementation

### Minimal Page-Based Form

```vue
<!-- /src/pages/employee-form/app-employee-form.vue -->
<template>
  <div class="min-h-full flex justify-center p-4 bg-gray-50">
    <div class="w-full max-w-4xl">
      <Card class="shadow-lg">
        <template #title>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">{{ pageTitle }}</h1>
            <Button icon="pi pi-times" text rounded @click="handleCancel" />
          </div>
        </template>

        <template #content>
          <EmployeeForm
            :form-data="formData"
            :mode="mode"
            :readonly="isReadonly"
            :loading="isSubmitting"
            :errors="errors"
            :touched="touched"
            @blur="handleBlur"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import { EmployeeForm, useEmployeeForm } from '@/form/employee'
import { useEmployeeFormMode } from './composables/useEmployeeFormMode'
import { useEmployeeFormNavigation } from './composables/useEmployeeFormNavigation'

const loc = useLocalizationStore()
const { mode, employeeId, isReadonly, modeConfig } = useEmployeeFormMode()
const { navigateBack } = useEmployeeFormNavigation()

const pageTitle = ref('')

const {
  formData,
  isSubmitting,
  errors,
  touched,
  loadEmployee,
  handleSubmit: submitForm,
  handleCancel: cancelForm,
  validateField,
} = useEmployeeForm({
  mode: mode.value,
  employeeId: employeeId.value,

  // Default: navigate back to employee table
  onSuccess: () => navigateBack(),
  onCancel: () => navigateBack(),
})

const handleBlur = (field) => validateField(field)
const handleSubmit = () => submitForm()
const handleCancel = () => cancelForm()

onMounted(async () => {
  pageTitle.value = await loc.t(modeConfig.value.title)
  if (employeeId.value) {
    await loadEmployee(employeeId.value)
  }
})
</script>
```

### Minimal Dialog-Based Form

```vue
<!-- Usage in parent component -->
<template>
  <Button label="Add Employee" @click="showDialog = true" />

  <Dialog
    v-model:visible="showDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '600px' }"
  >
    <EmployeeForm :mode="'create'" @submit="handleFormSuccess" @cancel="showDialog = false" />
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EmployeeForm } from '@/form/employee'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const showDialog = ref(false)
const dialogTitle = ref('Add Employee')

const handleFormSuccess = (employee) => {
  showDialog.value = false
  // Refresh parent data, show message, etc.
}
</script>
```

### Custom Navigation Override

```vue
<script setup lang="ts">
// Override default navigation for custom behavior
const { handleSubmit, handleCancel } = useEmployeeForm({
  mode: 'create',

  // Custom success: stay on form and show another
  onSuccess: async (employee) => {
    await messaging.success('Employee created!')
    // Navigate to edit mode of created employee
    router.push({
      path: '/employee-form',
      query: { mode: 'edit', id: employee.id },
    })
  },

  // Custom cancel: show confirmation dialog
  onCancel: async () => {
    if (formState.isDirty) {
      const confirmed = await confirm('Discard changes?')
      if (confirmed) {
        navigateBack()
      }
    } else {
      navigateBack()
    }
  },
})
</script>
```

---

## 📚 Reference Documentation

- [Forms Module README](./README.md)
- [Validation Service README](../stores/validation/README.md)
- [API Module README](../api/README.md) - Resource API patterns
- [Localization Service README](../stores/localization/README.md) - **Async translation patterns**
- [Messaging Service README](../stores/messaging/README.md)
- [TableSetup Request Template](../components/TableSetup/TABLE_REQUEST_TEMPLATE.md)
- [Timezone Fix Summary](../concepts/forms/TIMEZONE_FIX_SUMMARY.md) - **Date handling best practices**
- [Date Helpers Source](./shared/utils/dateHelpers.ts) - **Timezone-safe utilities**

**Key Reminders:**

- ✅ All localization calls must use `await loc.t(...)`
- ✅ Use resource API classes (e.g., `usersApi.create()`) instead of direct API store calls
- ✅ Validation Service provides common rules - reuse them
- ✅ Form composables (`useFormState`, `useFormSubmit`) handle state management
- ✅ **CRITICAL**: Always use `formatDateForApi()` and `parseLocalDate()` for date conversions (never `toISOString()`)

---

## 🔍 Common Implementation Issues & Solutions

This section documents issues frequently encountered during form implementation and their solutions. Review before starting implementation to avoid common pitfalls.

### Issue 1: Layout and Styling Inconsistencies

**Problem**: Initial form layout doesn't match existing employee form patterns, resulting in inconsistent UX.

**Symptoms**:

- Labels inline with inputs instead of floating
- No section organization (all fields in one flat list)
- Inconsistent spacing and error display
- Wrong PrimeVue component variants

**Solution**:

- ✅ Use **Fieldsets** with `toggleable` for logical sections (Basic Info, Date Range, Additional)
- ✅ Use **FloatLabel variant="on"** for all inputs (labels float up on focus/fill)
- ✅ Use **min-h-5** containers for error messages to prevent layout shift
- ✅ Use correct PrimeVue components: `Select` (not Dropdown), `DatePicker` (not Calendar)
- ✅ Add `size="small"` to all input components for consistent sizing
- ✅ Reference existing employee form for styling patterns

**Prevention Checklist**:

- [ ] Review employee form layout before starting
- [ ] Define Fieldset sections in template request
- [ ] Specify FloatLabel variant in template
- [ ] Plan error display strategy (min-h-5 pattern)

---

### Issue 2: DatePicker Configuration & Timezone Problems

**Problem**: Date format issues, incorrect v-model bindings, and **timezone conversion bugs** causing wrong dates sent to API.

**Symptoms**:

- Date not displaying in correct format for user's locale
- Type errors: "Type 'Date' is not assignable to type 'string'"
- Date not properly converting between form data (string) and component (Date object)
- **CRITICAL: DatePicker shows 2025-11-05 but API receives 2025-11-04** (timezone shift bug)

**Root Cause of Timezone Bug**:
Using `toISOString().split('T')[0]` converts dates to UTC before formatting, causing date shifts in timezones with positive UTC offsets (e.g., UTC+1 converts midnight to 23:00 previous day in UTC).

**Solution**:

- ✅ **ALWAYS use `update-model-type="date"`** - PrimeVue DatePicker v-model binding
- ✅ **DO NOT use `dateFormat` prop** - Format auto-detects from user's locale (PrimeVue v4+)
- ✅ **ALWAYS use timezone-safe utilities** - `formatDateForApi()` and `parseLocalDate()` from shared utils
- ✅ **NEVER use** `toISOString().split('T')[0]` or `new Date(isoString)` for date conversion
- ✅ Use computed properties with timezone-safe utilities:

  ```typescript
  import { formatDateForApi, parseLocalDate } from '@/form/shared/utils'

  const fromDateValue = computed({
    get(): Date | null {
      if (!props.formData.from_date) return null
      // ✅ Timezone-safe: Parse as local date
      return parseLocalDate(props.formData.from_date)
    },
    set(value: Date | null): void {
      if (value === null) {
        props.formData.from_date = ''
      } else if (value instanceof Date && !isNaN(value.getTime())) {
        // ✅ Timezone-safe: Format using local components
        props.formData.from_date = formatDateForApi(value)
      }
    },
  })
  ```

**Prevention Checklist**:

- [ ] Add `update-model-type="date"` to all DatePicker components
- [ ] Remove any `dateFormat` props
- [ ] Import and use `formatDateForApi` and `parseLocalDate` utilities
- [ ] Create computed properties for Date ↔ string conversion using utilities
- [ ] Test with different timezones (UTC+1, UTC-5)
- [ ] Test with different locales (EN, DE)
- [ ] Verify API receives exact date shown in DatePicker (no timezone shifts)

**Related Documentation**:

- See [Timezone Fix Summary](/src/concepts/forms/TIMEZONE_FIX_SUMMARY.md) for detailed explanation
- See [Date Helpers Source](/src/form/shared/utils/dateHelpers.ts) for utility implementations

---

### Issue 3: Vacation Type Color Display

**Problem**: Colors from backend not displaying correctly (white text on white background, wrong color priorities).

**Symptoms**:

- Unreadable text due to missing text color calculation
- Backend provides both `bg_color` and `color` but only one is used
- Missing/null colors not handled gracefully

**Solution**:
Create intelligent color handling with proper priority logic:

```typescript
function getVacationTypeStyle(vacationType: VacationType) {
  // Priority 1: Both bg_color AND color provided → use directly
  if (vacationType.bg_color && vacationType.color) {
    return {
      backgroundColor: vacationType.bg_color, // e.g., "#FFF"
      color: vacationType.color, // e.g., "#000"
    }
  }

  // Priority 2: Only bg_color → calculate contrasting text color
  if (vacationType.bg_color) {
    return {
      backgroundColor: vacationType.bg_color,
      color: getTextColor(vacationType.bg_color), // Auto black/white
    }
  }

  // Priority 3: Only color (legacy) → use as background
  if (vacationType.color) {
    return {
      backgroundColor: vacationType.color,
      color: getTextColor(vacationType.color),
    }
  }

  // Priority 4: No colors → gray fallback
  return {
    backgroundColor: '#6B7280', // Tailwind gray-500
    color: '#FFFFFF',
  }
}

function getTextColor(bgColor: string): string {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
```

**Prevention Checklist**:

- [ ] Check if backend provides `color`, `bg_color`, or both
- [ ] Implement 4-tier priority logic
- [ ] Add luminance-based text color calculation
- [ ] Define fallback color for missing data
- [ ] Test with various color combinations from backend

---

### Issue 4: Validation Messages Not Localized

**Problem**: Yup validation error messages hardcoded in English, don't respect user's language setting.

**Symptoms**:

- Validation errors always show in English even when UI is German
- Error messages use Yup defaults instead of custom translations

**Solution**:
Create translation mapping function in composable:

```typescript
const translateValidationError = async (message: string): Promise<string> => {
  const errorKeyMap: Record<string, string> = {
    'Employee is required': 'employeeAbsenceDemands.form.validation.employee_required',
    'Vacation type is required': 'employeeAbsenceDemands.form.validation.vacationType_required',
    'Start date is required': 'employeeAbsenceDemands.form.validation.fromDate_required',
    'End date is required': 'employeeAbsenceDemands.form.validation.toDate_required',
    'End date must be after or equal to start date':
      'employeeAbsenceDemands.form.validation.toDate_after_fromDate',
    'Invalid date format (YYYY-MM-DD)': 'employeeAbsenceDemands.form.validation.dateFormat_invalid',
    'Comment must be less than 2000 characters':
      'employeeAbsenceDemands.form.validation.comment_maxLength',
    'Status is required': 'employeeAbsenceDemands.form.validation.status_required',
    'Invalid status': 'employeeAbsenceDemands.form.validation.status_invalid',
  }

  const key = errorKeyMap[message]
  return key ? await loc.t(key) : message
}

// Use in validateField:
const validateField = async (field: keyof FormData) => {
  touched.value[field] = true
  try {
    await schema.validateAt(field, formData.value)
    delete errors.value[field]
  } catch (error: any) {
    errors.value[field] = await translateValidationError(error.message)
  }
}
```

**Prevention Checklist**:

- [ ] Define all validation translation keys in locale files
- [ ] Create `translateValidationError()` function
- [ ] Call translation function in `validateField()` and `validateForm()`
- [ ] Test validation in both languages

---

### Issue 5: Optional Fields Not Sent to Backend

**Problem**: When user clears optional fields (comment, published), values aren't sent to backend, so old values persist.

**Symptoms**:

- User clears comment → Save → Comment still shows old value after refresh
- Field is not included in JSON payload when empty

**Root Cause**:
JavaScript JSON serialization omits properties with `undefined` value:

```typescript
// ❌ Wrong - field omitted from JSON
comment: formData.comment || undefined // Results in: {}

// ✅ Correct - field included with null
comment: formData.comment || null // Results in: { "comment": null }
```

**Solution**:

```typescript
// In create/update payload:
{
  employee: formData.value.employee!,
  vacation_type: formData.value.vacation_type!,
  from_date: formData.value.from_date,
  to_date: formData.value.to_date,

  // ✅ Use || null (not || undefined)
  comment: formData.value.comment?.trim() || null,  // .trim() handles whitespace
  published: formData.value.published || null,

  status: formData.value.status,
}
```

**Prevention Checklist**:

- [ ] Use `|| null` for all optional fields (never `|| undefined`)
- [ ] Add `.trim()` for text fields to handle whitespace-only strings
- [ ] Test clearing previously set optional fields
- [ ] Verify backend receives explicit null values

---

### Issue 6: API Types Missing Form Fields

**Problem**: Form has fields but API types don't include them in Create/Update payloads.

**Symptoms**:

- TypeScript error: "Property 'published' does not exist on type 'CreatePayload'"
- Field not sent to backend even though form collects it

**Solution**:
Before implementation, verify API types:

1. Check main entity interface:

```typescript
export interface EmployeeAbsenceDemand {
  id: number
  employee: number
  vacation_type: number
  from_date: string
  to_date: string
  comment?: string | null
  status: 'offen' | 'genehmigt' | 'abgelehnt'
  published?: string | null // ✅ Must exist if form has this field
}
```

2. Check Create payload:

```typescript
export interface EmployeeAbsenceDemandCreatePayload {
  employee: number
  vacation_type: number
  from_date: string
  to_date: string
  comment?: string | null
  status?: 'offen' | 'genehmigt' | 'abgelehnt'
  published?: string | null // ✅ Must match form data
}
```

3. Check Update payload inherits properly:

```typescript
export interface EmployeeAbsenceDemandUpdatePayload
  extends Partial<EmployeeAbsenceDemandCreatePayload> {}
```

**Prevention Checklist**:

- [ ] Review API types file before starting form implementation
- [ ] Cross-reference form fields with CreatePayload interface
- [ ] Ensure UpdatePayload includes all fields (via extends or explicit)
- [ ] Type optional fields as `field?: Type | null` (not just `Type`)

---

### Issue 7: Missing Localization Keys

**Problem**: Translation keys not defined in locale files, causing missing text or English fallbacks.

**Required Key Categories**:

1. **Form titles** (4 modes):

   ```typescript
   'employeeAbsenceDemands.form.title.create'
   'employeeAbsenceDemands.form.title.edit'
   'employeeAbsenceDemands.form.title.view'
   'employeeAbsenceDemands.form.title.delete'
   ```

2. **Form sections** (if using Fieldsets):

   ```typescript
   'employeeAbsenceDemands.form.sections.basic'
   'employeeAbsenceDemands.form.sections.dateRange'
   'employeeAbsenceDemands.form.sections.additional'
   ```

3. **Field labels** (all form fields):

   ```typescript
   'employeeAbsenceDemands.form.labels.employee'
   'employeeAbsenceDemands.form.labels.vacationType'
   // ... one for each field
   ```

4. **Field hints** (for complex fields):

   ```typescript
   'employeeAbsenceDemands.form.hints.fromDate'
   'employeeAbsenceDemands.form.hints.toDate'
   'employeeAbsenceDemands.form.hints.published'
   'employeeAbsenceDemands.form.hints.comment'
   ```

5. **Validation messages** (all validation rules):

   ```typescript
   'employeeAbsenceDemands.form.validation.employee_required'
   'employeeAbsenceDemands.form.validation.toDate_after_fromDate'
   // ... one for each validation rule
   ```

6. **Status labels** (if using status enum):

   ```typescript
   'employeeAbsenceDemands.status.offen'
   'employeeAbsenceDemands.status.genehmigt'
   'employeeAbsenceDemands.status.abgelehnt'
   ```

7. **Success/error messages**:
   ```typescript
   'employeeAbsenceDemands.messages.createSuccess'
   'employeeAbsenceDemands.messages.updateSuccess'
   'employeeAbsenceDemands.messages.deleteSuccess'
   'employeeAbsenceDemands.messages.createError'
   'employeeAbsenceDemands.messages.updateError'
   'employeeAbsenceDemands.messages.deleteError'
   'employeeAbsenceDemands.messages.loadError'
   ```

**Prevention Checklist**:

- [ ] Define ALL key categories in BOTH en/ and de/ locale files
- [ ] Use consistent key naming: `[domain].form.[category].[field]_[detail]`
- [ ] Test form in both languages before considering complete
- [ ] Verify status labels load correctly (async in onMounted)

---

## ✅ Submission

Once completed, submit this request to the development team with:

1. **Filled Template**: Complete all applicable sections
2. **Mockups/Wireframes** (if available): Visual design of the form
3. **Priority**: Indicate urgency and blocking dependencies
4. **Stakeholders**: List who needs to review/approve

**Submitted by**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Reviewed by**: ******\_\_\_******  
**Approved by**: ******\_\_\_******

---

**Template Version**: 3.0  
**Last Updated**: 2025-11-09  
**Maintainer**: Development Team  
**Based On**: Employee Absence Demand Form implementation (Nov 2025)
