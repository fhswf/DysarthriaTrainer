/**
 * Exercise Type Definitions
 *
 * Defines TypeScript interfaces for the new exercise data model where:
 * - Exercise contains multiple ExerciseItems
 * - Each ExerciseItem has one ExerciseInstructions (instruction) and multiple ItemContent entries
 * - The old ExerciseInstruction is deprecated
 */

/**
 * Exercise Category
 */
export interface ExerciseCategory {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Exercise Instructions (formerly attached to Exercise, now attached to ExerciseItem)
 */
export interface ExerciseInstructions {
  id: string
  exercise_id: string
  language: string
  hint_text: string | null
  explanation_text: string | null
  safety_notes: string | null
  audio_instruction_url: string | null
  image_url: string | null
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Item Content - The actual exercise content (text, audio, video)
 */
export interface ItemContent {
  id: string
  item_id: string
  language: string
  text_content: string | null
  demonstration_video_url: string | null
  image_url: string | null
  phonetic_transcription: string | null
  audio_example_url: string | null
  difficulty: string | null
  info_type: string | null
  created_at: string
  updated_at: string
}

/**
 * Exercise Item - A single exercise item within an Exercise
 */
export interface ExerciseItem {
  id: string
  exercise_id: string
  is_library_item: boolean
  item_type: 'movement' | 'breathing' | 'minimal_pair' | 'word_list' | 'sentence' | 'text'
  instruction_id: string | null
  instruction: ExerciseInstructions | null
  display_order: number
  repetitions: number | null
  duration_seconds: number | null
  metadata: {
    title?: string
    scope?: string
    [key: string]: unknown
  } | null
  contents: ItemContent[]
  created_at: string
  updated_at: string
}

/**
 * Main Exercise
 */
export interface Exercise {
  id: string
  category_id: string
  code: string
  title: string
  subtitle: string | null
  scope: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes: number | null
  display_order: number
  version: number
  is_active: boolean
  superseded_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
  deleted_by: string | null
  instructions: unknown[] // Deprecated, should be empty
  category: ExerciseCategory
  items: ExerciseItem[]
}

/**
 * @deprecated Use ExerciseInstructions attached to ExerciseItem instead
 */
export interface ExerciseInstruction {
  id: string
  exercise_id: string
  language: string
  // ... deprecated fields
}
