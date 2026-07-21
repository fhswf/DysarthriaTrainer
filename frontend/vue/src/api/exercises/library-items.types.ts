/**
 * Library Items API Types
 *
 * TypeScript interfaces for library item API operations.
 * Library items are reusable exercise content that can be attached to multiple exercises.
 *
 * Backend: FastAPI endpoint /api/v1/exercise/items/library
 *
 * @module api/exercises/library-items
 */

/**
 * Library item type enum
 */
export type LibraryItemType =
  | 'movement'
  | 'speech_practice'
  | 'information'
  | 'minimal_pair'
  | 'word'
  | 'sentence'
  | 'breathing'
  | 'vocalization'
  | 'articulation'
  | 'rhythm'
  | 'intonation'

/**
 * Content for a specific language within a library item
 */
export interface LibraryItemContent {
  id: string
  language: string
  text_content: string
  audio_file_url?: string | null
  video_file_url?: string | null
  image_file_url?: string | null
  phonetic_transcription?: string | null
  difficulty_notes?: string | null
}

/**
 * Complete library item entity from backend
 */
export interface LibraryItem {
  id: string
  item_type: LibraryItemType
  instruction_id?: string | null
  display_order: number
  repetitions?: number | null
  duration_seconds?: number | null
  metadata: Record<string, unknown>
  contents: LibraryItemContent[]
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

/**
 * Create payload for new library item
 */
export interface LibraryItemCreate {
  item_type: LibraryItemType
  instruction_id?: string | null
  display_order?: number
  repetitions?: number | null
  duration_seconds?: number | null
  metadata?: Record<string, unknown>
  contents: Array<{
    language: string
    text_content: string
    audio_file_url?: string | null
    video_file_url?: string | null
    image_file_url?: string | null
    phonetic_transcription?: string | null
    difficulty_notes?: string | null
  }>
}

/**
 * Update payload for existing library item (all fields optional)
 */
export interface LibraryItemUpdate {
  item_type?: LibraryItemType
  instruction_id?: string | null
  display_order?: number
  repetitions?: number | null
  duration_seconds?: number | null
  metadata?: Record<string, unknown>
  contents?: Array<{
    id?: string
    language: string
    text_content: string
    audio_file_url?: string | null
    video_file_url?: string | null
    image_file_url?: string | null
    phonetic_transcription?: string | null
    difficulty_notes?: string | null
  }>
}

/**
 * Query parameters for listing library items
 */
export interface LibraryItemListParams {
  limit?: number
  offset?: number
  ordering?: string
  search?: string
  item_type?: LibraryItemType
  language?: string
  has_audio?: boolean
  has_video?: boolean
}

/**
 * Response from list endpoint
 *
 * ⚠️ CRITICAL: Backend returns { items: [], total: number }
 * This differs from standard pagination { results: [], count: number }
 */
export interface LibraryItemListResponse {
  items: LibraryItem[]
  total: number
  limit: number
  offset: number
}

/**
 * Options for duplicating a library item
 */
export interface DuplicateItemOptions {
  as_library_item: boolean
  exercise_id?: string
  display_order?: number
}

/**
 * Request to attach library item to an exercise
 */
export interface AttachLibraryItemRequest {
  exercise_id: string
  display_order?: number
}
