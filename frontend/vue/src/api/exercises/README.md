# Exercise API Documentation

Comprehensive TypeScript API client for exercise CRUD operations and related resources.

## Overview

The Exercise API provides complete functionality for managing:

- **Exercises** - Speech training exercises with versioning
- **Exercise Categories** - Organizational grouping of exercises
- **Exercise Items** - Individual components within exercises (movements, speech practice, information)

## Architecture

All APIs follow the project's resource-based API pattern:

- **Service Architecture**: APIs access the backend through the `useApiStore()` Pinia store
- **Type Safety**: Full TypeScript support with backend schema matching
- **Error Handling**: Unified error handling via API store
- **Signal Support**: All read operations support AbortSignal for request cancellation

## API Clients

### 1. Exercises API (`exercisesApi`)

Main API for exercise CRUD operations with versioning support.

```typescript
import { exercisesApi } from '@/api/exercises'
```

#### Methods

##### `list(params?, signal?): Promise<ExerciseListResponse>`

Get paginated list of exercises with optional filtering.

**Parameters:**

- `category_id?: string` - Filter by category UUID
- `active_only?: boolean` - Only show active exercises (default: true)
- `page?: number` - Page number (default: 1)
- `page_size?: number` - Items per page (default: 20)

**Example:**

```typescript
// List all exercises
const response = await exercisesApi.list()

// List exercises for specific category with pagination
const response = await exercisesApi.list({
  category_id: '123',
  active_only: true,
  page: 2,
  page_size: 20,
})
```

##### `getById(id, params?, signal?): Promise<ExerciseDetail>`

Get single exercise with optional relationship loading.

**Parameters:**

- `load_instructions?: boolean` - Load instruction steps
- `load_items?: boolean` - Load exercise items
- `language?: string` - Filter items by language

**Example:**

```typescript
// Get exercise with all data
const exercise = await exercisesApi.getById('123', {
  load_instructions: true,
  load_items: true,
  language: 'de',
})
```

##### `getByCode(code, signal?): Promise<ExerciseDetail>`

Get exercise by unique code (e.g., "LT001").

**Example:**

```typescript
const exercise = await exercisesApi.getByCode('LT001')
```

##### `create(data): Promise<Exercise>`

Create new exercise. Requires Admin/Therapist role.

**Example:**

```typescript
const exercise = await exercisesApi.create({
  category_id: '123',
  exercise_code: 'LT001',
  title: 'Lippenbewegung Übung',
  subtitle: 'Grundübung',
  description: 'Stärkt die Lippenmuskulatur',
  difficulty_level: 'beginner',
  estimated_duration_minutes: 5,
  instructions: ['Setzen Sie sich bequem hin', 'Pressen Sie die Lippen zusammen'],
  is_active: true,
})
```

##### `update(id, data): Promise<Exercise>`

Update existing exercise. Requires Admin/Therapist role.

**Example:**

```typescript
const exercise = await exercisesApi.update('123', {
  title: 'Updated Title',
  difficulty_level: 'intermediate',
})
```

##### `delete(id): Promise<void>`

Soft-delete exercise. Requires Admin role.

**Example:**

```typescript
await exercisesApi.delete('123')
```

##### `getVersions(code, signal?): Promise<Exercise[]>`

Get version history for an exercise by code.

**Example:**

```typescript
const versions = await exercisesApi.getVersions('LT001')
// Returns all versions ordered by version number
```

##### `createVersion(id, data): Promise<Exercise>`

Create new version of an exercise. Requires Admin/Therapist role.

**Example:**

```typescript
const newVersion = await exercisesApi.createVersion('123', {
  title: 'Updated Title V2',
  description: 'Improved with new techniques',
  difficulty_level: 'intermediate',
})
```

##### `getWithItems(id, language?, signal?): Promise<ExerciseDetail>`

Convenience method to get exercise with items and instructions.

**Example:**

```typescript
const exercise = await exercisesApi.getWithItems('123', 'de')
```

---

### 2. Exercise Categories API (`exerciseCategoriesApi`)

Manage exercise categories for organizational grouping.

```typescript
import { exerciseCategoriesApi } from '@/api/exercises'
```

#### Methods

##### `list(includeDeleted?, signal?): Promise<ExerciseCategory[]>`

Get all categories ordered by sort_order.

**Example:**

```typescript
// Active categories only
const categories = await exerciseCategoriesApi.list()

// Include deleted categories
const allCategories = await exerciseCategoriesApi.list(true)
```

##### `getById(id, signal?): Promise<ExerciseCategory>`

Get single category by UUID.

**Example:**

```typescript
const category = await exerciseCategoriesApi.getById('123')
```

##### `getBySlug(slug, signal?): Promise<ExerciseCategory>`

Get category by URL-friendly slug.

**Example:**

```typescript
const category = await exerciseCategoriesApi.getBySlug('lippen-training')
```

##### `create(data): Promise<ExerciseCategory>`

Create new category. Requires Admin/Therapist role.

**Example:**

```typescript
const category = await exerciseCategoriesApi.create({
  name: 'Lippen-Training',
  slug: 'lippen-training',
  description: 'Übungen zur Stärkung der Lippenmuskulatur',
  sort_order: 1,
})
```

##### `update(id, data): Promise<ExerciseCategory>`

Update existing category. Requires Admin/Therapist role.

**Example:**

```typescript
const category = await exerciseCategoriesApi.update('123', {
  name: 'Lippen-Training Fortgeschritten',
  description: 'Erweiterte Übungen',
})
```

##### `delete(id, deletedBy): Promise<void>`

Soft-delete category. Requires Admin role.

**Example:**

```typescript
await exerciseCategoriesApi.delete('123', 'user-456')
```

##### `reorder(categoryIds): Promise<{ message: string }>`

Reorder categories by providing ordered list of IDs.

**Example:**

```typescript
await exerciseCategoriesApi.reorder(['category-2', 'category-3', 'category-1'])
```

---

### 3. Exercise Items API (`exerciseItemsApi`)

Manage individual components within exercises (polymorphic content).

```typescript
import { exerciseItemsApi } from '@/api/exercises'
```

#### Methods

##### `list(params, signal?): Promise<ExerciseItem[]>`

Get items for an exercise with optional filtering.

**Example:**

```typescript
// All items for exercise
const items = await exerciseItemsApi.list({ exercise_id: '123' })

// Filtered by type and language
const speechItems = await exerciseItemsApi.list({
  exercise_id: '123',
  item_type: 'speech_practice',
  language: 'de',
})
```

##### `getById(id, signal?): Promise<ExerciseItem>`

Get single item by UUID.

**Example:**

```typescript
const item = await exerciseItemsApi.getById('123')
```

##### `create(data): Promise<ExerciseItem>`

Create new exercise item. Requires Admin/Therapist role.

**Movement Item Example:**

```typescript
const item = await exerciseItemsApi.create({
  exercise_id: '123',
  item_type: 'movement',
  sort_order: 1,
  language: 'de',
  content: {
    instruction: 'Bewegen Sie Ihre Lippen',
    duration_seconds: 30,
    repetitions: 5,
    media_file_id: 'video-123',
  },
})
```

**Speech Practice Item Example:**

```typescript
const item = await exerciseItemsApi.create({
  exercise_id: '123',
  item_type: 'speech_practice',
  sort_order: 2,
  language: 'de',
  content: {
    text: 'Papa',
    phonetic_target: '/p/',
    difficulty: 'easy',
    audio_file_id: 'audio-123',
  },
})
```

**Information Item Example:**

```typescript
const item = await exerciseItemsApi.create({
  exercise_id: '123',
  item_type: 'information',
  sort_order: 3,
  language: 'de',
  content: {
    text: 'Diese Übung stärkt die Lippenmuskulatur',
    info_type: 'tip',
  },
})
```

##### `update(id, data): Promise<ExerciseItem>`

Update existing item. Requires Admin/Therapist role.

**Example:**

```typescript
const item = await exerciseItemsApi.update('123', {
  sort_order: 5,
  content: {
    instruction: 'Updated instruction',
  },
})
```

##### `delete(id): Promise<void>`

Delete item. Requires Admin/Therapist role.

**Example:**

```typescript
await exerciseItemsApi.delete('123')
```

##### `reorder(exerciseId, itemIds): Promise<ExerciseItem[]>`

Reorder items within an exercise.

**Example:**

```typescript
await exerciseItemsApi.reorder('exercise-123', ['item-2', 'item-3', 'item-1'])
```

---

## Type Definitions

### Exercise Types

```typescript
interface Exercise {
  id: string
  category_id: string
  exercise_code: string
  title: string
  subtitle: string | null
  description: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes: number | null
  version: number
  is_active: boolean
  superseded_by: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  created_by: string | null
  deleted_by: string | null
}

interface ExerciseDetail extends Exercise {
  instructions: string[]
  category: ExerciseCategory
  items: ExerciseItem[]
}
```

### Exercise Category Types

```typescript
interface ExerciseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}
```

### Exercise Item Types

```typescript
type ExerciseItemType = 'movement' | 'speech_practice' | 'information'

interface ExerciseItem {
  id: string
  exercise_id: string
  item_type: ExerciseItemType
  sort_order: number
  language: string
  content: ExerciseItemContent
  created_at: string
  updated_at: string | null
}

interface ExerciseItemContent {
  // Common fields
  text?: string

  // Movement-specific
  instruction?: string
  duration_seconds?: number
  repetitions?: number
  media_file_id?: string

  // Speech practice-specific
  phonetic_target?: string
  difficulty?: string
  audio_file_id?: string

  // Information-specific
  info_type?: 'context' | 'safety' | 'tip' | 'explanation'

  // Additional polymorphic fields
  [key: string]: unknown
}
```

---

## Error Handling

All API methods throw errors that are handled by the API store:

```typescript
try {
  const exercise = await exercisesApi.getById('123')
} catch (error) {
  // Error is already logged and processed by API store
  // Check error.response for details
  console.error('Failed to fetch exercise:', error)
}
```

---

## Backend API Mapping

### Base URLs

- Exercises: `/api/v1/exercise/exercises`
- Categories: `/api/v1/exercise/categories`
- Items: `/api/v1/exercise/items`

### Endpoints

#### Exercises

- `GET /exercises` - List exercises
- `POST /exercises` - Create exercise
- `GET /exercises/{id}` - Get by ID
- `GET /exercises/code/{code}` - Get by code
- `GET /exercises/code/{code}/versions` - Get versions
- `PATCH /exercises/{id}` - Update exercise
- `POST /exercises/{id}/versions` - Create new version
- `DELETE /exercises/{id}` - Delete exercise

#### Categories

- `GET /categories` - List categories
- `POST /categories` - Create category
- `GET /categories/{id}` - Get by ID
- `GET /categories/slug/{slug}` - Get by slug
- `PATCH /categories/{id}` - Update category
- `POST /categories/reorder` - Reorder categories
- `DELETE /categories/{id}` - Delete category

#### Items

- `GET /items` - List items
- `POST /items` - Create item
- `GET /items/{id}` - Get by ID
- `PUT /items/{id}` - Update item
- `POST /items/reorder` - Reorder items
- `DELETE /items/{id}` - Delete item

---

## Usage Examples

### Complete Exercise Workflow

```typescript
// 1. Create category
const category = await exerciseCategoriesApi.create({
  name: 'Lippen-Training',
  slug: 'lippen-training',
  description: 'Übungen zur Stärkung der Lippenmuskulatur',
  sort_order: 1,
})

// 2. Create exercise
const exercise = await exercisesApi.create({
  category_id: category.id,
  exercise_code: 'LT001',
  title: 'Lippenbewegung',
  difficulty_level: 'beginner',
  estimated_duration_minutes: 5,
  instructions: ['Schritt 1', 'Schritt 2'],
  is_active: true,
})

// 3. Add exercise items
const item1 = await exerciseItemsApi.create({
  exercise_id: exercise.id,
  item_type: 'movement',
  sort_order: 1,
  content: {
    instruction: 'Bewegen Sie Ihre Lippen',
    duration_seconds: 30,
  },
})

const item2 = await exerciseItemsApi.create({
  exercise_id: exercise.id,
  item_type: 'speech_practice',
  sort_order: 2,
  content: {
    text: 'Papa',
    phonetic_target: '/p/',
  },
})

// 4. Get complete exercise
const fullExercise = await exercisesApi.getWithItems(exercise.id)

// 5. Update exercise
await exercisesApi.update(exercise.id, {
  difficulty_level: 'intermediate',
})

// 6. Create new version
const v2 = await exercisesApi.createVersion(exercise.id, {
  title: 'Lippenbewegung V2',
  description: 'Verbesserte Version',
})

// 7. View version history
const versions = await exercisesApi.getVersions('LT001')
```

---

## Notes

- All mutation operations (create, update, delete) require authentication
- Role requirements are enforced by backend:
  - **Admin**: All operations
  - **Therapist**: Create, update exercises/categories/items
  - **Patient**: Read-only access
- Soft deletes are used - deleted items remain in database with `deleted_at` timestamp
- Exercise versioning maintains history - old versions are marked with `superseded_by`
- Exercise items are polymorphic - content structure varies by `item_type`

---

## Related Documentation

- [Backend API Documentation](../../../backend/README.md)
- [Exercise Schemas](../../../backend/src/api/schemas/exercise.py)
- [Exercise Service](../../../backend/src/application/services/exercise_service.py)
