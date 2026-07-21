/**
 * Library Item Form Module
 *
 * Barrel export for library item form components and utilities.
 *
 * @module forms/library-item
 */

// Main form component
export { default as LibraryItemForm } from './LibraryItemForm.vue'

// Content editor component
export { default as ContentEditor } from './components/ContentEditor.vue'

// Composable
export { useLibraryItemForm } from './useLibraryItemForm'

// Types
export type {
  LibraryItemFormData,
  LibraryItemContentFormData,
  LibraryItemFormMode,
  LibraryItemFormOptions,
} from './library-item.types'

export {
  apiToFormData,
  formDataToCreatePayload,
  formDataToUpdatePayload,
  createEmptyFormData,
} from './library-item.types'

// Schema
export { createLibraryItemSchema, createContentSchema } from './library-item.schema'
