# Validation Service

**Version**: 2.0  
**Status**: Production Ready  
**Type**: Pinia Store Service

Schema-based form validation with Yup integration, field-level validation, async validation, and state management.

## 📁 Structure

```
validation/
├── index.ts                  # Pinia store (service entry point)
├── validation.types.ts       # TypeScript interfaces
├── validation.live.ts        # Production implementation (Yup)
├── validation.mock.ts        # Testing implementation
├── communication.ts          # Cross-service integration
└── __tests__/
    └── validation.spec.ts
```

### Key Components

- **Store**: Lazy-loaded service with live/mock switching
- **Schema Manager**: Yup schema creation and caching
- **Field Validator**: Single-field validation
- **Form Validator**: Full form validation (all fields)
- **Error Manager**: Error tracking per form/field
- **State Tracker**: Form dirty state, touched fields
- **Common Rules**: Reusable validation rules (email, password, phone, etc.)
- **Async Validator**: Remote validation (uniqueness checks)

## 🚀 Usage

### Schema Creation

```typescript
import { useValidationStore } from '@/stores/validation'
import * as yup from 'yup'

const validation = useValidationStore()

// Create schema
const userSchema = validation.createSchema(
  yup.object({
    username: yup.string().required('Username is required').min(3, 'Min 3 characters'),
    email: yup.string().required('Email is required').email('Invalid email'),
    password: yup.string().required('Password is required').min(8, 'Min 8 characters'),
    age: yup.number().min(18, 'Must be 18+').max(120, 'Invalid age'),
    website: yup.string().url('Invalid URL'),
    terms: yup.boolean().oneOf([true], 'Must accept terms'),
  })
)

// Store schema for later use
await validation.updateSchema('userForm', userSchema)

// Retrieve schema
const schema = await validation.getSchema('userForm')
```

### Common Validation Rules

```typescript
// Get pre-built common rules
const rules = await validation.getCommonRules()

// Email validation
const emailSchema = yup.object({
  email: rules.email('Please enter a valid email'),
})

// Password validation (min 8 chars, uppercase, lowercase, number, special char)
const passwordSchema = yup.object({
  password: rules.password(8, 'Password must be at least 8 characters'),
  confirmPassword: rules.confirmPassword('password', 'Passwords must match'),
})

// Phone validation
const phoneSchema = yup.object({
  phone: rules.phone('Invalid phone number'),
})

// File validation
const fileSchema = yup.object({
  avatar: rules
    .fileSize(5, 'File must be under 5MB')
    .concat(rules.fileType(['image/jpeg', 'image/png'], 'Only JPG/PNG allowed')),
})

// Length validation
const usernameSchema = yup.object({
  username: rules
    .required('Username required')
    .concat(rules.minLength(3, 'Min 3 characters'))
    .concat(rules.maxLength(20, 'Max 20 characters')),
})
```

### Field Validation

```typescript
// Validate single field
const errors = await validation.validateField(userSchema, 'email', 'invalid-email')

console.log(errors)
// [{ field: 'email', message: 'Invalid email', type: 'validation' }]

// Valid field
const errors2 = await validation.validateField(userSchema, 'email', 'user@example.com')
console.log(errors2) // []
```

### Form Validation

```typescript
// Validate entire form
const formData = {
  username: 'jd', // Too short
  email: 'invalid', // Invalid format
  password: '12345', // Too short
  age: 15, // Too young
}

const result = await validation.validateForm(userSchema, formData)

console.log(result.isValid) // false
console.log(result.errors)
// [
//   { field: 'username', message: 'Min 3 characters', type: 'min' },
//   { field: 'email', message: 'Invalid email', type: 'email' },
//   { field: 'password', message: 'Min 8 characters', type: 'min' },
//   { field: 'age', message: 'Must be 18+', type: 'min' }
// ]

// Valid form
const validData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  age: 25,
}

const result2 = await validation.validateForm(userSchema, validData)
console.log(result2.isValid) // true
console.log(result2.errors) // []
```

### Error Management

```typescript
// Set error manually
await validation.setError('userForm', 'email', 'Email already taken')

// Clear single field error
await validation.clearError('userForm', 'email')

// Clear all errors
await validation.clearAllErrors('userForm')

// Get all errors for form
const errors = await validation.getErrors('userForm')
console.log(errors)
// { email: 'Email already taken', username: 'Username required' }
```

### State Management

```typescript
// Get form state
const state = await validation.getFormState('userForm')
console.log(state)
// {
//   isValidating: false,
//   errors: { email: 'Invalid email' },
//   fieldErrors: { email: ['Invalid email', 'Already taken'] },
//   touchedFields: Set(['email', 'username']),
//   isDirty: true
// }

// Mark field as touched
await validation.setFieldTouched('userForm', 'email', true)

// Mark form as dirty
await validation.setFormDirty('userForm', true)

// Check touched fields
const state = await validation.getFormState('userForm')
if (state.touchedFields.has('email')) {
  // Show validation errors for email
}
```

### Async Validation

```typescript
// Check if email is unique (via API)
const isUnique = await validation.validateAsync('email', 'newuser@example.com', async (value) => {
  const response = await fetch(`/api/check-email?email=${value}`)
  const data = await response.json()
  return data.isAvailable
})

console.log(isUnique) // true or false

// In schema
const schema = yup.object({
  email: yup
    .string()
    .required('Email required')
    .email('Invalid email')
    .test('unique', 'Email already taken', async (value) => {
      if (!value) return true
      return await validation.validateAsync('email', value, async (v) => {
        const response = await fetch(`/api/check-email?email=${v}`)
        return (await response.json()).isAvailable
      })
    }),
})
```

### Reactive Schemas

```typescript
// Create schema that updates based on reactive data
const createDynamicSchema = () => {
  const minAge = computed(() => (userRole.value === 'admin' ? 21 : 18))

  return validation.createReactiveSchema(() =>
    yup.object({
      age: yup.number().min(minAge.value, `Must be ${minAge.value}+`),
    })
  )
}

const schemaFn = await createDynamicSchema()
const schema = schemaFn() // Re-execute to get updated schema
```

### Integration with Forms

```typescript
import { ref } from 'vue'

// Form data
const formData = ref({
  email: '',
  password: '',
})

// Validation errors
const errors = ref({})

// Validate on blur
const handleBlur = async (field: string) => {
  await validation.setFieldTouched('loginForm', field, true)

  const fieldErrors = await validation.validateField(loginSchema, field, formData.value[field])

  if (fieldErrors.length > 0) {
    errors.value[field] = fieldErrors[0].message
  } else {
    delete errors.value[field]
  }
}

// Validate on submit
const handleSubmit = async () => {
  const result = await validation.validateForm(loginSchema, formData.value)

  if (!result.isValid) {
    // Show errors
    result.errors.forEach((err) => {
      errors.value[err.field] = err.message
    })
    return
  }

  // Submit form
  await submitLogin(formData.value)
}
```

## 🔗 Service Dependencies

### Optional Services (via Communication Layer)

#### 1. API Service (Optional)

Required for async validation (uniqueness checks, remote validation).

**Usage**:

- Check email/username uniqueness
- Validate against external data
- Remote validation rules

**Fallback**: Returns `true` (assume valid) if API unavailable

#### 2. Messaging Service (Optional)

Shows validation errors as toasts.

**Usage**:

```typescript
await communication.showValidationError('email', 'Email already taken')
```

**Fallback**: Errors not shown as toasts (still available in state)

### Integration Pattern

```typescript
// communication.ts uses service registry
import { getServiceAsync } from '@/services/serviceRegistry'

// Async validation with API
const api = await getServiceAsync('api')
if (api) {
  const response = await api.post('/check-unique', { email: value })
  return response.data.isUnique
}
```

### Initialization Order (Service Bootstrap)

```
Phase 1: Config Service → Messaging Service → Localization Service
Phase 2: API Service → Error Service → Validation Service
Phase 3: Auth Service
```

**Note**: Validation is Phase 2 because it depends on API for async validation.

## 📊 Type Definitions

### ValidationError

```typescript
interface ValidationError {
  field: string // Field name
  message: string // Error message
  type: string // Error type (e.g., 'required', 'email', 'min')
}
```

### FormValidationState

```typescript
interface FormValidationState {
  isValidating: boolean // Currently validating
  errors: Record<string, string> // Current errors (field -> message)
  fieldErrors: Record<string, string[]> // All errors per field
  touchedFields: Set<string> // Fields user has interacted with
  isDirty: boolean // Form has been modified
}
```

### CommonValidationRules

```typescript
interface CommonValidationRules {
  required(message?: string): yup.StringSchema
  email(message?: string): yup.StringSchema
  password(minLength?: number, message?: string): yup.StringSchema
  confirmPassword(passwordField: string, message?: string): yup.StringSchema
  phone(message?: string): yup.StringSchema
  url(message?: string): yup.StringSchema
  minLength(min: number, message?: string): yup.StringSchema
  maxLength(max: number, message?: string): yup.StringSchema
  pattern(regex: RegExp, message?: string): yup.StringSchema
  fileSize(maxMB: number, message?: string): yup.MixedSchema
  fileType(types: string[], message?: string): yup.MixedSchema
}
```

## ⚡ Optimizations

### 1. Schema Caching

```typescript
// Schemas cached by form ID
const schemas = new Map<string, yup.ObjectSchema<any>>()
```

**How it works**:

- Schemas stored in Map by form ID
- No re-creation on validation
- Fast lookup by key

**Impact**: Faster validation, lower memory

### 2. Lazy Yup Loading

```typescript
// Yup loaded only when needed
const module = await import('./validation.live')
```

**How it works**:

- Yup (~50KB) not in initial bundle
- Loaded when validation needed
- Code splitting at service level

**Impact**: ~50KB smaller initial bundle

### 3. Early Abort

```typescript
// Validate with abortEarly: false for all errors
await schema.validate(data, { abortEarly: false })
```

**How it works**:

- Gets all validation errors at once
- No need for multiple validation passes
- User sees all issues immediately

**Impact**: Better UX, fewer re-renders

### 4. Field-Level Validation

```typescript
// Validate single field, not entire form
const fieldSchema = yup.reach(schema, field)
await fieldSchema.validate(value)
```

**How it works**:

- Only validates changed field
- No unnecessary validation of other fields
- Fast feedback on blur/change

**Impact**: Faster field validation, better performance

### 5. State Isolation

```typescript
// Each form has isolated state
const formStates = new Map<string, FormValidationState>()
```

**How it works**:

- Forms don't share state
- No cross-form interference
- Multiple forms can validate independently

**Impact**: Supports multiple forms per page

## 🏗️ Architecture

### Validation Flow

```
Component calls validateField('email', value)
  ├── Get schema for form
  ├── Extract field schema (yup.reach)
  ├── Validate value against field schema
  ├── Return errors (if any)
  └── Update form state
```

### Form Submit Flow

```
Component calls validateForm(schema, data)
  ├── Validate all fields (abortEarly: false)
  ├── Collect all validation errors
  ├── Update form state
  └── Return { isValid, errors }
```

### Async Validation Flow

```
Field validates with async rule
  ├── Extract value
  ├── Call async validator function
  │   ├── Access API service
  │   ├── Make remote request
  │   └── Return boolean result
  ├── Return validation result
  └── Update field error state
```

### Live vs Mock

```typescript
// Environment-based switching
const useLive = import.meta.env.MODE !== 'test'
// Live: Full Yup validation
// Mock: Predefined validation results
```

## 🚫 Anti-Patterns

```typescript
// ❌ Don't validate on every keystroke
<input @input="validateField('email', $event.target.value)" />

// ✅ Validate on blur
<input @blur="validateField('email', formData.email)" />

// ❌ Don't create schema on every render
const schema = computed(() => yup.object({ ... }));

// ✅ Create once, reuse
const schema = yup.object({ ... });
await validation.updateSchema('myForm', schema);

// ❌ Don't ignore touched state
<span class="error">{{ errors.email }}</span>

// ✅ Show errors only for touched fields
<span v-if="touched.has('email')" class="error">{{ errors.email }}</span>

// ❌ Don't block on async validation
await validateAsync(...); // Blocks submit

// ✅ Show loading state
isValidating.value = true;
const isValid = await validateAsync(...);
isValidating.value = false;

// ❌ Don't duplicate validation logic
if (!email.includes('@')) { ... }  // Manual validation

// ✅ Use schema
const errors = await validation.validateField(schema, 'email', email);
```

## 💡 Best Practices

1. **Validate on Blur, Not on Input**

   - Better UX (less annoying)
   - Better performance
   - Only validate touched fields

2. **Use Common Rules**

   ```typescript
   const rules = await validation.getCommonRules()
   const schema = yup.object({
     email: rules.email(),
     password: rules.password(8),
   })
   ```

3. **Show Errors for Touched Fields Only**

   ```typescript
   const showError = (field) => {
     const state = await validation.getFormState('myForm')
     return state.touchedFields.has(field) && state.errors[field]
   }
   ```

4. **Cache Schemas**

   ```typescript
   await validation.updateSchema('userForm', userSchema)
   // Later...
   const schema = await validation.getSchema('userForm')
   ```

5. **Use Async Validation Sparingly**

   - Only for uniqueness checks
   - Debounce async calls
   - Show loading indicators

6. **Clear Errors on Success**

   ```typescript
   const result = await validation.validateForm(schema, data)
   if (result.isValid) {
     await validation.clearAllErrors('myForm')
   }
   ```

7. **Custom Error Messages**

   ```typescript
   yup.string().required('This field is required').email('Please enter a valid email address')
   ```

8. **Conditional Validation**
   ```typescript
   yup.object({
     country: yup.string(),
     zipCode: yup.string().when('country', {
       is: 'US',
       then: (schema) => schema.matches(/^\d{5}$/, 'Invalid US zip'),
       otherwise: (schema) => schema,
     }),
   })
   ```

## 🚀 Quick Start

```typescript
import { useValidationStore } from '@/stores/validation'
import * as yup from 'yup'

const validation = useValidationStore()

// Create schema
const schema = yup.object({
  email: yup.string().required().email(),
  password: yup.string().required().min(8),
})

// Validate field
const errors = await validation.validateField(schema, 'email', 'test@test.com')

// Validate form
const result = await validation.validateForm(schema, formData)
if (result.isValid) {
  // Submit
}

// Common rules
const rules = await validation.getCommonRules()
const quickSchema = yup.object({
  email: rules.email(),
  phone: rules.phone(),
})
```

## 📚 Related

- [Yup Documentation](https://github.com/jquense/yup)
- [Forms Module](../../forms/README.md)
- [Service Bootstrap](../../services/README.md)
- [API Service](../api/README.md)
- [Messaging Service](../messaging/README.md)

---

**Phase**: 2 (Core Services)  
**Dependencies**: API (optional), Messaging (optional)  
**Tests**: ✅ Passing  
**Validation Library**: Yup 1.x
