/**
 * Library Item Form Types
 *
 * Type definitions for library item creation and editing forms.
 *
 * @module forms/library-item
 */

import type {
  LibraryItem,
  LibraryItemCreate,
  LibraryItemUpdate,
  LibraryItemType,
} from '@/api/exercises'

// ============================================================================
// Form Data
// ============================================================================

/**
 * Content entry for form (one per language)
 */
export interface LibraryItemContentFormData {
  /** Language code (e.g., 'de', 'en') */
  language: string
  /** Text content for this language */
  text_content: string
  /** Optional audio file URL */
  audio_file_url?: string | null
  /** Optional video file URL */
  video_file_url?: string | null
  /** Optional image file URL */
  image_file_url?: string | null
  /** Optional phonetic transcription */
  phonetic_transcription?: string | null
  /** Optional difficulty notes for this language */
  difficulty_notes?: string | null
}

/**
 * Form data structure for library item
 * Maps to API create/update payloads
 */
export interface LibraryItemFormData {
  /** Type of library item */
  item_type: LibraryItemType | ''
  /** Optional instruction ID reference */
  instruction_id: string | null
  /** Display order for sorting */
  display_order: number
  /** Optional number of repetitions */
  repetitions: number | null
  /** Optional duration in seconds */
  duration_seconds: number | null
  /** Optional metadata (free-form JSON) */
  metadata: Record<string, unknown>
  /** Content entries (one per language) */
  contents: LibraryItemContentFormData[]
}

// ============================================================================
// Form Options
// ============================================================================

/**
 * Form mode options
 */
export type LibraryItemFormMode = 'create' | 'edit' | 'view'

/**
 * Form options and callbacks
 */
export interface LibraryItemFormOptions {
  /** Form mode (create/edit/view) - defaults to 'create' */
  mode?: LibraryItemFormMode
  /** Library item ID (required for edit/view modes) */
  itemId?: string
  /** Initial item type (pre-select for create mode) */
  initialItemType?: LibraryItemType
  /** Success callback */
  onSuccess?: (item: LibraryItem) => void
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
 * @param item - API library item response
 * @returns Form data object
 */
export function apiToFormData(item: LibraryItem): LibraryItemFormData {
  return {
    item_type: item.item_type,
    instruction_id: item.instruction_id ?? null,
    display_order: item.display_order,
    repetitions: item.repetitions ?? null,
    duration_seconds: item.duration_seconds ?? null,
    metadata: item.metadata,
    contents: item.contents.map((content) => ({
      language: content.language,
      text_content: content.text_content,
      audio_file_url: content.audio_file_url,
      video_file_url: content.video_file_url,
      image_file_url: content.image_file_url,
      phonetic_transcription: content.phonetic_transcription,
      difficulty_notes: content.difficulty_notes,
    })),
  }
}

/**
 * Convert form data to API payload (create)
 *
 * @param formData - Form data
 * @returns API create payload
 */
export function formDataToCreatePayload(formData: LibraryItemFormData): LibraryItemCreate {
  return {
    item_type: formData.item_type as LibraryItemType,
    instruction_id: formData.instruction_id ?? undefined,
    display_order: formData.display_order,
    repetitions: formData.repetitions ?? undefined,
    duration_seconds: formData.duration_seconds ?? undefined,
    metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined,
    contents: formData.contents.map((content) => ({
      language: content.language.trim(),
      text_content: content.text_content.trim(),
      audio_file_url: content.audio_file_url?.trim() ?? undefined,
      video_file_url: content.video_file_url?.trim() ?? undefined,
      image_file_url: content.image_file_url?.trim() ?? undefined,
      phonetic_transcription: content.phonetic_transcription?.trim() ?? undefined,
      difficulty_notes: content.difficulty_notes?.trim() ?? undefined,
    })),
  }
}

/**
 * Convert form data to API payload (update)
 *
 * @param formData - Form data
 * @returns API update payload
 */
export function formDataToUpdatePayload(formData: LibraryItemFormData): LibraryItemUpdate {
  return {
    item_type: formData.item_type as LibraryItemType,
    instruction_id: formData.instruction_id ?? undefined,
    display_order: formData.display_order,
    repetitions: formData.repetitions ?? undefined,
    duration_seconds: formData.duration_seconds ?? undefined,
    metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined,
    contents: formData.contents.map((content) => ({
      language: content.language.trim(),
      text_content: content.text_content.trim(),
      audio_file_url: content.audio_file_url?.trim() ?? undefined,
      video_file_url: content.video_file_url?.trim() ?? undefined,
      image_file_url: content.image_file_url?.trim() ?? undefined,
      phonetic_transcription: content.phonetic_transcription?.trim() ?? undefined,
      difficulty_notes: content.difficulty_notes?.trim() ?? undefined,
    })),
  }
}

/**
 * Create empty form data with defaults
 *
 * @param options - Optional initial values
 * @returns Empty form data object
 */
export function createEmptyFormData(options?: {
  itemType?: LibraryItemType
  language?: string
}): LibraryItemFormData {
  return {
    item_type: options?.itemType ?? '',
    instruction_id: null,
    display_order: 0,
    repetitions: null,
    duration_seconds: null,
    metadata: {},
    contents: [
      {
        language: options?.language ?? 'de',
        text_content: '',
        audio_file_url: null,
        video_file_url: null,
        image_file_url: null,
        phonetic_transcription: null,
        difficulty_notes: null,
      },
    ],
  }
}
