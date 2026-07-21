# API Module

**Version**: 3.0  
**Status**: Production Ready  
**Type**: Resource API Implementations

Domain-specific API classes that wrap the API service for type-safe, resource-oriented HTTP operations with FastAPI backend.

## 📁 Structure

```
api/
├── README.md                # This file
├── shared/
│   ├── endpoints.ts         # Centralized endpoint constants
│   └── index.ts
├── types/
│   ├── common.ts            # Shared types (pagination, filters)
│   └── index.ts
└── users/                   # User resource (implemented)
    ├── index.ts             # Public exports
    ├── users.types.ts       # User domain types
    ├── users.api.ts         # UsersApi class
    └── users.mock.ts        # Mock data for testing
```

### Key Components

- **Resource APIs**: Domain-specific API classes (UsersApi, ExercisesApi, etc.)
- **Type Definitions**: TypeScript interfaces for requests/responses
- **Endpoint Constants**: Centralized URL definitions (optional)
- **Mock Data**: Test fixtures for development/testing

## 🚀 Usage Example: Users API

### Using the Users API

```typescript
import { usersApi } from '@/api/users'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/api/users'

// List all users (with optional filters)
const users = await usersApi.list({ search: 'john', limit: 20 })

// Get single user by ID
const user = await usersApi.getById('550e8400-e29b-41d4-a716-446655440000')

// Create user
const newUser = await usersApi.create({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'securepass123',
  fullName: 'John Doe',
})

// Update user (partial update with PATCH)
await usersApi.update('550e8400-e29b-41d4-a716-446655440000', {
  email: 'newemail@example.com',
  fullName: 'John Updated Doe',
})

// Delete user
await usersApi.delete('550e8400-e29b-41d4-a716-446655440000')
```

### Creating a Resource API (FastAPI Pattern)

```typescript
// users/users.api.ts
import { useApiStore } from '@/stores/api'
import type { User, CreateUserRequest, UpdateUserRequest, UserQueryParams } from './users.types'

export class UsersApi {
  private api = useApiStore()
  private readonly baseEndpoint = '/api/v1/users'

  // List users with optional filters
  async list(params?: UserQueryParams): Promise<User[]> {
    const response = await this.api.get<User[]>(this.baseEndpoint, {
      params,
      useCache: true,
      cacheTimeout: 30000, // 30 seconds
    })
    return response.data
  }

  // Get single user by ID (UUID)
  async getById(userId: string): Promise<User> {
    const response = await this.api.get<User>(`${this.baseEndpoint}/${userId}`, {
      useCache: true,
      cacheTimeout: 30000,
    })
    return response.data
  }

  // Create user
  async create(data: CreateUserRequest): Promise<User> {
    const response = await this.api.post<User>(this.baseEndpoint, data)
    // Clear cache after mutation
    await this.api.clearCache(this.baseEndpoint)
    return response.data
  }

  // Update user (PATCH for partial updates - FastAPI standard)
  async update(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.api.patch<User>(`${this.baseEndpoint}/${userId}`, data)
    // Clear cache after mutation
    await this.api.clearCache(this.baseEndpoint)
    return response.data
  }

  // Delete user
  async delete(userId: string): Promise<void> {
    await this.api.delete(`${this.baseEndpoint}/${userId}`)
    // Clear cache after mutation
    await this.api.clearCache(this.baseEndpoint)
  }
}

// Create singleton instance
export const usersApi = new UsersApi()
```

### Type Definitions (FastAPI Pattern)

```typescript
// users/users.types.ts

/**
 * User entity from FastAPI backend
 * Note: Backend returns username, email, fullName (no ID in response)
 */
export interface User {
  username: string
  email: string
  fullName: string
}

/**
 * Create user request (FastAPI UserIn schema)
 */
export interface CreateUserRequest {
  username: string
  email: string
  password: string
  fullName: string
}

/**
 * Update user request (partial update via PATCH)
 */
export interface UpdateUserRequest {
  email?: string
  fullName?: string
  password?: string // Optional password change
}

/**
 * Query parameters for list endpoint
 */
export interface UserQueryParams {
  search?: string // Search by username or email
  limit?: number // Max results
  offset?: number // Pagination offset
}
```

### Endpoint Constants

```typescript
// shared/endpoints.ts
export const USERS_ENDPOINTS = {
  BASE: '/users',
  BY_ID: (id: string) => `/users/${id}`,
  CURRENT: '/users/me',
  SEARCH: '/users/search',
  BY_ROLE: (role: string) => `/users/role/${role}`,
  ACTIVATE: (id: string) => `/users/${id}/activate`,
  STATS: '/users/stats',
} as const

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const

export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USERS_ENDPOINTS,
} as const
```

### Using in Components

```typescript
import { usersApi } from '@/api/users'
import type { User, CreateUserRequest } from '@/api/users'

// In setup()
const users = ref<User[]>([])
const loading = ref(false)

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await usersApi.list({
      search: 'john',
      limit: 20,
    })
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

const createUser = async (data: CreateUserRequest) => {
  try {
    const newUser = await usersApi.create(data)
    users.value.push(newUser)
  } catch (error) {
    console.error('Failed to create user:', error)
  }
}

const deleteUser = async (username: string) => {
  try {
    // Note: FastAPI uses username as identifier in URL
    await usersApi.delete(username)
    users.value = users.value.filter((u) => u.username !== username)
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
}
```

### Integration with Stores

```typescript
// stores/users/index.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/api/users'
import type { User } from '@/api/users'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    try {
      users.value = await usersApi.list()
    } finally {
      loading.value = false
    }
  }

  const fetchByUsername = async (username: string) => {
    loading.value = true
    try {
      const user = await usersApi.getById(username)
      return user
    } finally {
      loading.value = false
    }
  }

  return { users, currentUser, loading, fetchUsers, fetchByUsername }
})
```

## 🔗 Service Dependencies

### Required: API Service

All resource APIs depend on the API service store.

```typescript
import { useApiStore } from '@/stores/api'

class MyResourceApi {
  private api = useApiStore()

  async list() {
    return await this.api.get('/api/v1/my-resource')
  }
}
```

### Optional: Auth Service

For protected endpoints requiring authentication.

```typescript
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
if (!auth.isAuthenticated) {
  throw new Error('Authentication required')
}
```

## 📊 FastAPI Backend Patterns

### UUIDs as Identifiers

FastAPI backend uses UUIDs instead of integer IDs:

```typescript
// ✅ UUID format
const userId = '550e8400-e29b-41d4-a716-446655440000'
await usersApi.getById(userId)

// ❌ Not integer IDs
await usersApi.getById(123) // Wrong!
```

### PATCH for Updates

FastAPI uses PATCH for partial updates (not PUT):

```typescript
// ✅ PATCH for partial update
await this.api.patch(`/api/v1/users/${userId}`, {
  email: 'new@example.com',
})

// ❌ Don't use PUT
await this.api.put(`/api/v1/users/${userId}`, data) // Not used in FastAPI
```

### Response Format

FastAPI returns data directly (not wrapped in "data" field):

```typescript
// ✅ FastAPI response
const response = await this.api.get<User>('/api/v1/users/123')
const user = response.data // User object directly

// ❌ Not wrapped
const user = response.data.data // Wrong for FastAPI
```

### Error Responses

FastAPI returns standardized error formats:

- **404**: Resource not found
- **409**: Conflict (e.g., username already exists)
- **422**: Validation error
- **500**: Internal server error

```typescript
try {
  await usersApi.create(data)
} catch (error) {
  if (error.response?.status === 409) {
    console.error('Username already exists')
  } else if (error.response?.status === 422) {
    console.error('Validation failed:', error.response.data)
  }
}
```

## ⚡ Optimizations

### 1. Caching with Mutations

```typescript
// Cache GET requests
const users = await this.api.get('/api/v1/users', {
  useCache: true,
  cacheTimeout: 30000  // 30 seconds
});

// Clear cache after mutations
async create(data: CreateUserRequest): Promise<User> {
  const response = await this.api.post<User>('/api/v1/users', data);
  await this.api.clearCache('/api/v1/users');  // Clear list cache
  return response.data;
}
```

**Impact**: Fresh data after mutations, cached reads

### 2. Batch Requests

```typescript
// Fetch multiple resources at once
const [users, exercises, settings] = await Promise.all([
  usersApi.list(),
  exercisesApi.list(),
  settingsApi.get(),
])
```

**Impact**: Parallel loading, faster page load

### 3. Request Deduplication

```typescript
// API service automatically deduplicates identical requests
// Multiple components calling getById('123') = 1 API call
```

**Impact**: Prevents duplicate requests

### 4. Type Safety

```typescript
// Fully typed requests and responses
const response: ApiResponse<User> = await api.get<User>('/users/123')
const user: User = response.data // Type-safe
```

**Impact**: Catch errors at compile time

## 🚫 Anti-Patterns

```typescript
// ❌ Don't hardcode URLs in components
const response = await fetch('/api/v1/users');

// ✅ Use resource API classes
const users = await usersApi.list();

// ❌ Don't use API service directly in components
const api = useApiStore();
const response = await api.get('/api/v1/users');

// ✅ Use resource API wrapper
const users = await usersApi.list();

// ❌ Don't duplicate type definitions
interface User { username: string; } // In component
interface User { username: string; } // In another component

// ✅ Share types from api module
import type { User } from '@/api/users';

// ❌ Don't handle errors in API class
catch (error) {
  toast.error('Failed');  // Don't do this
}

// ✅ Throw errors, let caller handle
catch (error) {
  throw error;  // Caller decides how to handle
}

// ❌ Don't use PUT for updates (FastAPI uses PATCH)
await this.api.put(`/api/v1/users/${id}`, data);

// ✅ Use PATCH for partial updates
await this.api.patch(`/api/v1/users/${id}`, data);
```

## 💡 Best Practices

1. **One Class Per Resource**

   - UsersApi for users, ExercisesApi for exercises
   - Single responsibility principle

2. **Use Cache Clearing After Mutations**

   ```typescript
   async create(data: CreateUserRequest): Promise<User> {
     const response = await this.api.post<User>('/api/v1/users', data);
     await this.api.clearCache('/api/v1/users');  // Clear list cache
     return response.data;
   }
   ```

3. **Type Everything**

   - Request parameters
   - Response data
   - Error responses

4. **Enable Caching for GET**

   ```typescript
   await this.api.get('/api/v1/users', {
     useCache: true,
     cacheTimeout: 30000, // 30 seconds
   })
   ```

5. **Keep API Classes Thin**

   - Just HTTP operations
   - No business logic
   - No state management

6. **Use Stores for State**

   - API classes fetch data
   - Stores manage state
   - Components use stores

7. **Document Methods**

   ```typescript
   /**
    * Get user by username
    * @param username - User's unique username
    * @returns User object
    * @throws 404 if user doesn't exist
    */
   async getById(username: string): Promise<User>
   ```

8. **Export Singleton Instance**

   ```typescript
   export const usersApi = new UsersApi()
   ```

9. **Use PATCH for Updates (FastAPI Pattern)**

   ```typescript
   // ✅ PATCH for partial updates
   await this.api.patch(`/api/v1/users/${id}`, { email: 'new@example.com' })
   ```

10. **Handle FastAPI Error Formats**
    ```typescript
    try {
      await usersApi.create(data)
    } catch (error) {
      if (error.response?.status === 422) {
        // Validation error - show field errors
        const errors = error.response.data.detail
      }
    }
    ```

## 🚀 Quick Start

```typescript
// 1. Create types file
// api/exercises/exercises.types.ts
export interface Exercise {
  id: string
  title: string
  description: string
}

export interface CreateExerciseRequest {
  title: string
  description: string
}

export interface UpdateExerciseRequest {
  title?: string
  description?: string
}

// 2. Create API class
// api/exercises/exercises.api.ts
import { useApiStore } from '@/stores/api'
import type { Exercise, CreateExerciseRequest, UpdateExerciseRequest } from './exercises.types'

export class ExercisesApi {
  private api = useApiStore()
  private readonly baseEndpoint = '/api/v1/exercises'

  async list(): Promise<Exercise[]> {
    const response = await this.api.get<Exercise[]>(this.baseEndpoint, {
      useCache: true,
      cacheTimeout: 30000,
    })
    return response.data
  }

  async getById(exerciseId: string): Promise<Exercise> {
    const response = await this.api.get<Exercise>(`${this.baseEndpoint}/${exerciseId}`, {
      useCache: true,
      cacheTimeout: 30000,
    })
    return response.data
  }

  async create(data: CreateExerciseRequest): Promise<Exercise> {
    const response = await this.api.post<Exercise>(this.baseEndpoint, data)
    await this.api.clearCache(this.baseEndpoint)
    return response.data
  }

  async update(exerciseId: string, data: UpdateExerciseRequest): Promise<Exercise> {
    const response = await this.api.patch<Exercise>(`${this.baseEndpoint}/${exerciseId}`, data)
    await this.api.clearCache(this.baseEndpoint)
    return response.data
  }

  async delete(exerciseId: string): Promise<void> {
    await this.api.delete(`${this.baseEndpoint}/${exerciseId}`)
    await this.api.clearCache(this.baseEndpoint)
  }
}

export const exercisesApi = new ExercisesApi()

// 3. Export from index.ts
// api/exercises/index.ts
export { ExercisesApi, exercisesApi } from './exercises.api'
export type { Exercise, CreateExerciseRequest, UpdateExerciseRequest } from './exercises.types'

// 4. Use in component
import { exercisesApi } from '@/api/exercises'
import type { Exercise } from '@/api/exercises'

const exercises = ref<Exercise[]>([])
exercises.value = await exercisesApi.list()
```

## 📚 Related

- **API Service Store**: `src/stores/api/` - Low-level HTTP client
- **Auth Service Store**: `src/stores/auth/` - Authentication for protected endpoints (if implemented)
- **Service Bootstrap**: `src/services/serviceRegistry.ts` - Service initialization
- **Users API**: `src/api/users/` - Complete implementation example

---

**Pattern**: Resource API Classes  
**Dependencies**: API Service (required)  
**Backend**: FastAPI with UUIDs  
**Type Safety**: Full TypeScript support  
**Testing**: Mock implementations available  
**Usage**: Import singleton instances (`usersApi`, `exercisesApi`, etc.)  
**Tests**: ✅ 48/48 passing (100%) - Users API  
**Version**: 3.0
