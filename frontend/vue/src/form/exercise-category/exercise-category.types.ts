/**
 * Exercise Category Form Types
 *
 * Type definitions for exercise category creation and editing forms.
 *
 * @module form/exercise-category
 */

import type {
  ExerciseCategory,
  ExerciseCategoryCreate,
  ExerciseCategoryUpdate,
} from '@/services/exerciseCategoryService'

// ============================================================================
// Form Data
// ============================================================================

/**
 * Form data structure for exercise category
 * Maps directly to API create/update payloads
 */
export interface ExerciseCategoryFormData {
  /** Category name (e.g., "Mouth Gymnastics") */
  name: string
  /** URL-friendly identifier (unique, lowercase with hyphens) */
  slug: string
  /** Optional detailed description */
  description: string | null
  /** PrimeIcon class (e.g., "pi pi-heart") */
  icon_url: string | null
  /** Display order for sorting (lower numbers appear first) */
  display_order: number
}

// ============================================================================
// Form Options
// ============================================================================

/**
 * Form mode options
 */
export type ExerciseCategoryFormMode = 'create' | 'edit' | 'view'

/**
 * Form options and callbacks
 */
export interface ExerciseCategoryFormOptions {
  /** Form mode (create/edit/view) - defaults to 'create' */
  mode?: ExerciseCategoryFormMode
  /** Category ID (required for edit/view modes) */
  categoryId?: string
  /** Success callback */
  onSuccess?: (category: ExerciseCategory) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Cancel callback */
  onCancel?: () => void
}

// ============================================================================
// Conversion Helpers
// ============================================================================

/**
 * Convert API response to form data
 *
 * @param category - API category response
 * @returns Form data object
 */
export function apiToFormData(category: ExerciseCategory): ExerciseCategoryFormData {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon_url: category.icon_url,
    display_order: category.display_order,
  }
}

/**
 * Convert form data to API payload (create)
 *
 * @param formData - Form data
 * @returns API create payload
 */
export function formDataToCreatePayload(
  formData: ExerciseCategoryFormData
): ExerciseCategoryCreate {
  return {
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    description: formData.description?.trim() ?? undefined,
    icon_url: formData.icon_url?.trim() ?? undefined,
    display_order: formData.display_order,
  }
}

/**
 * Convert form data to API payload (update)
 *
 * @param formData - Form data
 * @returns API update payload
 */
export function formDataToUpdatePayload(
  formData: ExerciseCategoryFormData
): ExerciseCategoryUpdate {
  return {
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    description: formData.description?.trim() ?? undefined,
    icon_url: formData.icon_url?.trim() ?? undefined,
    display_order: formData.display_order,
  }
}

/**
 * Generate URL-friendly slug from name
 *
 * Converts name to lowercase, removes special characters,
 * replaces spaces with hyphens, and removes duplicate hyphens.
 *
 * @param name - Category name
 * @returns URL-friendly slug
 * @example
 * ```ts
 * generateSlug('Mouth Gymnastics') // 'mouth-gymnastics'
 * generateSlug('Speech & Language') // 'speech-language'
 * ```
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
