# Forms Module

**Version**: 2.0  
**Status**: Production Ready  
**Type**: Form Infrastructure

Centralized form patterns with validation service integration, reusable composables, and per-form organization.

## 📁 Structure

```
forms/
├── README.md                 # This file
├── shared/                   # Shared utilities
│   ├── types/
│   │   ├── common.ts         # Form interfaces (FormState, FormSubmitOptions, etc.)
│   │   └── index.ts
│   ├── composables/
│   │   ├── useFormState.ts   # Form state management
│   │   ├── useFormSubmit.ts  # Form submission handler
│   │   └── index.ts
│   └── utils/
│       ├── formHelpers.ts    # Helper functions
│       └── index.ts
└── [form-name]/              # Individual forms
    ├── [FormName].vue        # Form component
    ├── [form-name].schema.ts # Validation schema
    ├── [form-name].types.ts  # Form-specific types
    ├── use[FormName].ts      # Form composable (optional)
    └── index.ts              # Exports
```

### Key Components

- **Shared Types**: Common form interfaces (BaseFormData, FormState, FormSubmitOptions)
- **Shared Composables**: Reusable form logic (useFormState, useFormSubmit)
- **Per-Form Folders**: Each form self-contained with schema, types, component
- **Validation Integration**: Uses Validation Service for all validation

## 🚀 Usage

### Creating a New Form

#### 1. Create Form Folder

```bash
mkdir -p src/form/user-profile
cd src/form/user-profile
```

#### 2. Define Types

```typescript
// user-profile.types.ts
export interface UserProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  bio?: string
}

export interface UserProfileFormOptions {
  userId?: string
  onSuccess?: (user: User) => void
  onError?: (error: Error) => void
}
```

#### 3. Create Validation Schema

```typescript
// user-profile.schema.ts
import * as yup from 'yup'
import { useValidationStore } from '@/stores/validation'

export const createUserProfileSchema = async () => {
  const validation = useValidationStore()
  const rules = await validation.getCommonRules()

  return yup.object({
    firstName: rules
      .required('First name is required')
      .concat(rules.minLength(2, 'Min 2 characters')),
    lastName: rules
      .required('Last name is required')
      .concat(rules.minLength(2, 'Min 2 characters')),
    email: rules.email('Invalid email address'),
    phone: rules.phone('Invalid phone number').nullable(),
    bio: rules.maxLength(500, 'Bio cannot exceed 500 characters').nullable(),
  })
}
```

#### 4. Create Form Composable

```typescript
// useUserProfile.ts
import { ref, computed } from 'vue'
import { useFormState, useFormSubmit } from '@/form/shared/composables'
import { useValidationStore } from '@/stores/validation'
import { useApiStore } from '@/stores/api'
import { createUserProfileSchema } from './user-profile.schema'
import type { UserProfileFormData, UserProfileFormOptions } from './user-profile.types'

export const useUserProfile = (options: UserProfileFormOptions = {}) => {
  const validation = useValidationStore()
  const api = useApiStore()

  // Form data
  const formData = ref<UserProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  })

  // Create schema
  const schema = ref<any>(null)
  const initSchema = async () => {
    schema.value = await createUserProfileSchema()
  }
  initSchema()

  // Form state management
  const formState = useFormState<UserProfileFormData>()

  // Submit handler
  const { handleSubmit, isSubmitting } = useFormSubmit({
    schema,
    formData,
    formState,
    async onSubmit(data) {
      const response = await api.put(`/users/${options.userId}`, data)
      return response.data
    },
    onSuccess(result) {
      options.onSuccess?.(result)
    },
    onError(error) {
      options.onError?.(error)
    },
  })

  // Validate field
  const validateField = async (field: keyof UserProfileFormData) => {
    if (!schema.value) return

    const errors = await validation.validateField(
      schema.value,
      field as string,
      formData.value[field]
    )

    if (errors.length > 0) {
      formState.setFieldError(field as string, errors[0].message)
    } else {
      formState.clearFieldError(field as string)
    }
  }

  return {
    formData,
    formState,
    isSubmitting,
    handleSubmit,
    validateField,
  }
}
```

#### 5. Create Form Component

```vue
<!-- UserProfileForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="firstName">First Name *</label>
      <input
        id="firstName"
        v-model="formData.firstName"
        type="text"
        @blur="handleBlur('firstName')"
        :class="{ 'has-error': formState.errors.value.firstName }"
      />
      <span v-if="formState.errors.value.firstName" class="error">
        {{ formState.errors.value.firstName }}
      </span>
    </div>

    <div class="form-field">
      <label for="lastName">Last Name *</label>
      <input
        id="lastName"
        v-model="formData.lastName"
        type="text"
        @blur="handleBlur('lastName')"
        :class="{ 'has-error': formState.errors.value.lastName }"
      />
      <span v-if="formState.errors.value.lastName" class="error">
        {{ formState.errors.value.lastName }}
      </span>
    </div>

    <div class="form-field">
      <label for="email">Email *</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        @blur="handleBlur('email')"
        :class="{ 'has-error': formState.errors.value.email }"
      />
      <span v-if="formState.errors.value.email" class="error">
        {{ formState.errors.value.email }}
      </span>
    </div>

    <div class="form-field">
      <label for="phone">Phone</label>
      <input id="phone" v-model="formData.phone" type="tel" @blur="handleBlur('phone')" />
    </div>

    <div class="form-field">
      <label for="bio">Bio</label>
      <textarea
        id="bio"
        v-model="formData.bio"
        rows="4"
        @blur="handleBlur('bio')"
        :class="{ 'has-error': formState.errors.value.bio }"
      />
      <span v-if="formState.errors.value.bio" class="error">
        {{ formState.errors.value.bio }}
      </span>
    </div>

    <div class="form-actions">
      <button type="submit" :disabled="isSubmitting || !formState.isValid">
        {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useUserProfile } from './useUserProfile'

const props = defineProps<{
  userId: string
}>()

const emit = defineEmits<{
  success: [user: User]
  error: [error: Error]
}>()

const { formData, formState, isSubmitting, handleSubmit, validateField } = useUserProfile({
  userId: props.userId,
  onSuccess: (user) => emit('success', user),
  onError: (error) => emit('error', error),
})

const handleBlur = async (field: string) => {
  formState.setFieldTouched(field, true)
  await validateField(field as any)
}
</script>
```

### Using Shared Composables

#### useFormState

```typescript
import { useFormState } from '@/form/shared/composables'

// Create form state
const formState = useFormState<MyFormData>()

// Track touched fields
formState.setFieldTouched('email', true)
const isEmailTouched = formState.isFieldTouched('email')

// Track dirty state
formState.setDirty(true)

// Manage errors
formState.setFieldError('email', 'Invalid email')
formState.clearFieldError('email')
formState.clearAllErrors()

// Computed properties
const isValid = formState.isValid
const hasErrors = formState.hasErrors
const isDirty = formState.isDirty

// Reset form
formState.reset()
```

#### useFormSubmit

```typescript
import { useFormSubmit } from '@/form/shared/composables';

const { handleSubmit, isSubmitting } = useFormSubmit({
  schema: myFormSchema,
  formData: formDataRef,
  formState: myFormState,
  async onSubmit(data) {
    // Submit to API
    const response = await api.post('/endpoint', data);
    return response.data;
  },
  onSuccess(result) {
    console.log('Success:', result);
  },
  onError(error) {
    console.error('Error:', error);
  },
  showSuccessMessage: true,
  resetOnSuccess: true,
});

// In template
<button @click="handleSubmit" :disabled="isSubmitting">Submit</button>
```

## 🔗 Service Dependencies

### Required: Validation Service

All forms use the Validation Service for schema-based validation.

```typescript
import { useValidationStore } from '@/stores/validation'

const validation = useValidationStore()
const rules = await validation.getCommonRules()
```

### Optional: API Service

For forms that submit to backend APIs.

```typescript
import { useApiStore } from '@/stores/api'

const api = useApiStore()
await api.post('/users', formData)
```

### Optional: Messaging Service

For showing success/error toasts.

```typescript
import { useMessagingStore } from '@/stores/messaging'

const messaging = useMessagingStore()
await messaging.success('Form submitted successfully')
```

## 📊 Shared Types

### BaseFormData

```typescript
interface BaseFormData {
  [key: string]: unknown
}
```

### FormState

```typescript
interface FormState<T extends BaseFormData> {
  touchedFields: Set<string>
  isDirty: boolean
  isSubmitting: boolean
  isValidating: boolean
  errors: Record<keyof T, string>
  submitCount: number
}
```

### FormSubmitOptions

```typescript
interface FormSubmitOptions {
  showSuccessMessage?: boolean
  successMessage?: string
  showErrorMessage?: boolean
  errorMessage?: string
  redirectOnSuccess?: string
  resetOnSuccess?: boolean
  onSuccess?: (result: unknown) => void
  onError?: (error: unknown) => void
  beforeSubmit?: (data: BaseFormData) => boolean | Promise<boolean>
  afterSubmit?: () => void
}
```

## ⚡ Optimizations

### 1. Lazy Schema Loading

```typescript
// Schema created async when needed
const schema = ref<any>(null)
onMounted(async () => {
  schema.value = await createMyFormSchema()
})
```

**Impact**: Faster initial render

### 2. Field-Level Validation

```typescript
// Validate only changed field on blur
@blur="validateField('email')"
```

**Impact**: Better performance, faster feedback

### 3. Show Errors for Touched Fields Only

```typescript
// Don't show errors until user interacts
v-if="formState.isFieldTouched('email') && formState.errors.value.email"
```

**Impact**: Better UX, less annoying

### 4. Shared Composables

```typescript
// Reuse form logic across all forms
const formState = useFormState();
const { handleSubmit } = useFormSubmit({...});
```

**Impact**: Less code duplication, consistency

## 🚫 Anti-Patterns

```typescript
// ❌ Don't validate on every input
<input @input="validate()" />

// ✅ Validate on blur
<input @blur="validateField('email')" />

// ❌ Don't create schema inline
const schema = yup.object({ ... });

// ✅ Use dedicated schema file
import { createMyFormSchema } from './my-form.schema';

// ❌ Don't handle submission in component
const submit = async () => {
  // validation logic
  // API call
  // error handling
};

// ✅ Use form composable
const { handleSubmit } = useFormSubmit({...});

// ❌ Don't show all errors immediately
<span class="error">{{ errors.email }}</span>

// ✅ Show errors for touched fields
<span v-if="touched.has('email')" class="error">{{ errors.email }}</span>

// ❌ Don't manage state manually
const isDirty = ref(false);
const isSubmitting = ref(false);
// ... etc

// ✅ Use shared composable
const formState = useFormState();
```

## 💡 Best Practices

1. **One Folder Per Form**

   - Keep all form files together
   - Easy to find and maintain

2. **Use Validation Service**

   ```typescript
   const rules = await validation.getCommonRules()
   const schema = yup.object({ email: rules.email() })
   ```

3. **Validate on Blur**

   - Less annoying for users
   - Better performance

4. **Show Errors for Touched Fields Only**

   ```typescript
   v-if="formState.isFieldTouched('email')"
   ```

5. **Use Shared Composables**

   - `useFormState` for state
   - `useFormSubmit` for submission

6. **Reset Form After Success**

   ```typescript
   resetOnSuccess: true
   ```

7. **Type Everything**

   - FormData interfaces
   - Options interfaces
   - Return types

8. **Extract Composables for Complex Forms**
   - Keep components focused on UI
   - Logic in composables

## 🚀 Quick Start

```typescript
// 1. Create form folder
mkdir src/form/my-form

// 2. Create types (my-form.types.ts)
export interface MyFormData {
  name: string;
  email: string;
}

// 3. Create schema (my-form.schema.ts)
import * as yup from 'yup';
export const createMyFormSchema = async () => {
  const rules = await validation.getCommonRules();
  return yup.object({
    name: rules.required(),
    email: rules.email(),
  });
};

// 4. Create composable (useMyForm.ts)
export const useMyForm = () => {
  const formData = ref<MyFormData>({ name: '', email: '' });
  const formState = useFormState();
  const { handleSubmit } = useFormSubmit({
    schema: mySchema,
    formData,
    formState,
    onSubmit: async (data) => api.post('/my-endpoint', data),
  });
  return { formData, formState, handleSubmit };
};

// 5. Use in component
const { formData, formState, handleSubmit } = useMyForm();
```

## 📚 Related

- [Validation Service](../stores/validation/README.md) - Form validation with Yup
- [API Module](../api/README.md) - Resource API patterns for form submission
- [Localization Service](../stores/localization/README.md) - **Async** translation service
- [Messaging Service](../stores/messaging/README.md) - Success/error toasts
- [Form Request Template](./FORM_REQUEST_TEMPLATE.md) - Template for new forms

**Important Notes:**

- ✅ Localization is async: Always use `await loc.t(...)`
- ✅ Use resource API classes (e.g., `usersApi.create()`) not direct API store calls
- ✅ Validation Service provides common rules - reuse them

---

**Pattern**: Per-Form Folders  
**Dependencies**: Validation Service (required), API Module (optional), Localization (optional)  
**Composables**: useFormState, useFormSubmit  
**Type Safety**: Full TypeScript support
