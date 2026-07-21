/**
 * Exercises API Module
 *
 * Exports all exercise and exercise item API functionality.
 *
 * @module api/exercises
 */

// API classes
export { exercisesApi } from './exercises.api'
export { exerciseItemsApi } from './exercise-items.api'
export { exerciseCategoriesApi } from './exercise-categories.api'
export { libraryItemsApi } from './library-items.api'

// Types
export type {
  // Enums
  DifficultyLevel,
  ExerciseItemType,
  InfoType,
  // Exercise Category
  ExerciseCategory,
  ExerciseCategoryCreateDto,
  ExerciseCategoryUpdateDto,
  ExerciseCategoryReorderDto,
  // Exercise
  Exercise,
  ExerciseDetail,
  ExerciseCreateDto,
  ExerciseUpdateDto,
  ExerciseVersionCreateDto,
  // Exercise Item
  ExerciseItem,
  ExerciseItemContent,
  ExerciseItemCreateDto,
  ExerciseItemUpdateDto,
  // Response Types
  ExerciseListResponse,
  ExerciseItemListResponse,
  // Query Parameters
  ExerciseListParams,
  ExerciseDetailParams,
  ExerciseItemListParams,
  ExerciseItemReorderDto,
  // Library Item
  LibraryItem,
  LibraryItemContent,
  LibraryItemType,
  LibraryItemCreate,
  LibraryItemUpdate,
  LibraryItemListParams,
  LibraryItemListResponse,
  DuplicateItemOptions,
  AttachLibraryItemRequest,
} from './exercises.types'
