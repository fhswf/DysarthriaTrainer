/**
 * Exercise API Types
 *
 * Type definitions for exercise and exercise item API operations.
 * Matches backend API schemas from issue #94.
 *
 * @module api/exercises
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseItemType = 'movement' | 'speech_practice' | 'information'
export type InfoType = 'context' | 'safety' | 'tip' | 'explanation'

// ============================================================================
// Exercise Category
// ============================================================================

export interface ExerciseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number // Backend field name (Nov 2025)
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface ExerciseCategoryCreateDto {
  name: string
  slug: string
  description?: string | null
  display_order?: number // Backend field name (Nov 2025)
}

export interface ExerciseCategoryUpdateDto {
  name?: string
  slug?: string
  description?: string | null
  display_order?: number // Backend field name (Nov 2025)
}

export interface ExerciseCategoryReorderDto {
  category_ids: string[]
}

// ============================================================================
// Exercise
// ============================================================================

// Exercise Instructions (structured, multi-language)
export interface ExerciseInstructions {
  id?: string
  exercise_id?: string
  language: string
  hint_text: string | null
  explanation_text: string | null
  safety_notes: string | null // Fixed: was preparation_text
  display_order: number
}

export interface Exercise {
  id: string
  category_id: string
  code: string // Backend returns 'code', not 'exercise_code'
  title: string
  subtitle: string | null
  scope: string | null // Backend returns 'scope', not 'description'
  difficulty_level: DifficultyLevel
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

export interface ExerciseDetail extends Exercise {
  instructions: ExerciseInstructions[] // ⚠️ Structured objects (Nov 2025)
  category: ExerciseCategory
  items: ExerciseItem[]
}

export interface ExerciseInstructionsCreateDto {
  language: string
  hint_text?: string | null
  explanation_text?: string | null
  safety_notes?: string | null // Backend field name (DB hasn't been migrated yet)
  display_order: number
}

export interface ExerciseItemContentCreateDto {
  language: string
  text_content: string
  audio_file_url?: string | null
  demonstration_video_url?: string | null
  phonetic_transcription?: string | null
  visual_cue_image_url?: string | null
  difficulty_notes?: string | null
}

export interface ExerciseCreateDto {
  category_id: string
  code: string // Backend field name (Nov 2025)
  title: string
  subtitle?: string | null
  scope?: string | null // Backend field name (Nov 2025)
  difficulty_level: DifficultyLevel
  estimated_duration_minutes?: number | null
  target_phonemes?: string[]
  instructions: ExerciseInstructionsCreateDto[] // ⚠️ Structured (Nov 2025)
  items: ExerciseItemCreateDto[] // Required
  is_active?: boolean
  display_order?: number
}

export interface ExerciseUpdateDto {
  title?: string
  subtitle?: string | null
  scope?: string | null // Backend field name (Nov 2025)
  difficulty_level?: DifficultyLevel
  estimated_duration_minutes?: number | null
  target_phonemes?: string[]
  instructions?: ExerciseInstructionsCreateDto[] // ⚠️ Structured (Nov 2025)
  items?: ExerciseItemCreateDto[] // Required
  is_active?: boolean
  display_order?: number
}

export interface ExerciseVersionCreateDto {
  scope: string // Required for versioning
  changes_summary?: string
}

// ============================================================================
// Exercise Item
// ============================================================================

/**
 * Exercise item content (multi-language)
 */
export interface ExerciseItemContent {
  id?: string
  exercise_item_id?: string
  language: string
  text_content: string
  audio_file_url: string | null
  demonstration_video_url: string | null
  phonetic_transcription: string | null
  visual_cue_image_url: string | null
  difficulty_notes: string | null
}

export interface ExerciseItem {
  id: string
  exercise_id: string
  item_type: ExerciseItemType // 'minimal_pair', 'word', 'sentence', etc.
  target_phoneme: string | null
  display_order: number
  repetitions?: number | null
  instruction_id?: string | null // Item-level instruction reference
  instruction?: ExerciseInstructions | null // Nested instruction object (eagerly loaded)
  contents: ExerciseItemContent[] // ⚠️ Multi-language contents (Nov 2025)
  created_at: string
  updated_at: string
}

export interface ExerciseItemCreateDto {
  item_type: ExerciseItemType // Backend expects 'item_type' (Nov 2025)
  target_phoneme?: string | null
  display_order: number
  repetitions?: number | null
  instruction_id?: string | null // Optional item-level instruction reference
  contents: ExerciseItemContentCreateDto[] // ⚠️ Required (Nov 2025)
}

export interface ExerciseItemUpdateDto {
  item_type?: ExerciseItemType
  target_phoneme?: string | null
  display_order?: number
  repetitions?: number | null
  instruction_id?: string | null // Optional item-level instruction reference
  contents?: ExerciseItemContentCreateDto[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ExerciseListResponse {
  count: number
  results: Exercise[]
}

export interface ExerciseItemListResponse {
  items: ExerciseItem[]
  total: number
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface ExerciseListParams {
  category_id?: string
  active_only?: boolean
  offset?: number
  limit?: number
  search?: string
  ordering?: string
}

export interface ExerciseDetailParams {
  load_instructions?: boolean
  load_items?: boolean
  language?: string
}

export interface ExerciseItemListParams {
  exercise_id: string
  item_type?: ExerciseItemType
  language?: string
}

export interface ExerciseItemReorderDto {
  item_ids: string[]
}

// Re-export library items types
export type {
  LibraryItem,
  LibraryItemContent,
  LibraryItemType,
  LibraryItemCreate,
  LibraryItemUpdate,
  LibraryItemListParams,
  LibraryItemListResponse,
  DuplicateItemOptions,
  AttachLibraryItemRequest,
} from './library-items.types'
