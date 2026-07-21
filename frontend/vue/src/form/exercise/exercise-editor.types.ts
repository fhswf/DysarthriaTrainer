/**
 * Exercise Form Types
 *
 * Type definitions for exercise creation and editing forms.
 *
 * @module form/exercise
 */

import type {
  Exercise,
  ExerciseDetail,
  ExerciseCreateDto,
  ExerciseUpdateDto,
  DifficultyLevel,
  ExerciseInstructions,
  ExerciseItemContent,
  ExerciseInstructionsCreateDto,
  ExerciseItemContentCreateDto,
} from '@/api/exercises'

// ============================================================================
// Exercise Item Types (Polymorphic Content)
// ============================================================================

/**
 * Exercise item type enum
 */
export type ExerciseItemType = 'movement' | 'speech_practice' | 'information'

/**
 * Movement item content
 */
export interface MovementContent {
  text_content: string
  demonstration_video_url: string | null
  image_url: string | null
}

/**
 * Speech practice item content
 */
export interface SpeechPracticeContent {
  text_content: string
  phonetic_transcription: string | null
  audio_example_url: string | null
  difficulty: number
}

/**
 * Information item content
 */
export interface InformationContent {
  text_content: string
  info_type: 'tip' | 'warning' | 'note'
  image_url: string | null
}

/**
 * Union type for item content
 */
export type ExerciseItemContent = MovementContent | SpeechPracticeContent | InformationContent

/**
 * Exercise item form data
 */
export interface ExerciseItemFormData {
  /** Unique client-side ID for tracking */
  id?: string
  /** Type of exercise item */
  item_type: ExerciseItemType
  /** Target phoneme for pronunciation exercises */
  target_phoneme: string | null
  /** Display order in the exercise */
  display_order: number
  /** Number of repetitions for this item */
  repetitions?: number | null
  /** Item-level instruction reference */
  instruction_id?: string | null
  /** Nested instruction object (when loaded) */
  instruction?: ExerciseInstructionsFormData | null
  /** Multi-language content */
  content: ExerciseItemContent
}

/**
 * Exercise instructions form data
 */
export interface ExerciseInstructionsFormData {
  /** Unique client-side ID for tracking */
  id?: string
  /** Language code (e.g., 'en', 'de') */
  language: string
  /** Hint text for users */
  hint_text: string | null
  /** Detailed explanation */
  explanation_text: string | null
  /** Safety notes and warnings */
  safety_notes: string | null // Fixed: was preparation_text
  /** Display order for multiple instructions */
  display_order?: number
}

// ============================================================================
// Form Data
// ============================================================================

/**
 * Form data structure for exercise forms
 * Includes all fields needed for create/edit operations
 */
export interface ExerciseFormData {
  category_id: string
  code: string // ⚠️ Changed from exercise_code (Nov 2025)
  title: string
  subtitle: string
  scope: string // ⚠️ Changed from description (Nov 2025)
  difficulty_level: DifficultyLevel
  estimated_duration_minutes: number | null
  target_phonemes: string[]
  instructions: ExerciseInstructionsFormData[] // ⚠️ Structured objects (Nov 2025)
  items: ExerciseItemFormData[] // Polymorphic exercise items
  is_active: boolean
  display_order: number | null
}

/**
 * Form options and callbacks
 */
export interface ExerciseFormOptions {
  mode: 'create' | 'edit' | 'view'
  exerciseId?: string
  onSuccess?: (exercise: Exercise) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

// ============================================================================
// Data Converters
// ============================================================================

/**
 * Convert API Exercise to form data
 *
 * @param exercise - Exercise from API
 * @returns Form data ready for editing
 *
 * @example
 * ```typescript
 * const exercise = await exercisesApi.getById('123')
 * const formData = apiToFormData(exercise)
 * ```
 */
export function apiToFormData(exercise: ExerciseDetail): ExerciseFormData {
  return {
    category_id: exercise.category_id,
    code: exercise.code, // Direct mapping (Nov 2025)
    title: exercise.title,
    subtitle: exercise.subtitle ?? '',
    scope: exercise.scope ?? '', // Direct mapping (Nov 2025)
    difficulty_level: exercise.difficulty_level,
    estimated_duration_minutes: exercise.estimated_duration_minutes,
    target_phonemes: exercise.target_phonemes ?? [],
    instructions: (exercise.instructions ?? []).map((inst) => ({
      id: inst.id,
      language: inst.language,
      hint_text: inst.hint_text,
      explanation_text: inst.explanation_text,
      safety_notes: inst.safety_notes ?? null, // Updated field name
      display_order: inst.display_order ?? null, // Support display_order
    })),
    items: (exercise.items ?? []).map((item) => ({
      id: item.id,
      item_type: item.item_type as ExerciseItemType,
      target_phoneme: item.target_phoneme,
      display_order: item.display_order,
      repetitions: item.repetitions ?? null,
      content: item.contents[0] ?? createEmptyItemContent('de'), // Use first content
      instruction_id: item.instruction_id ?? null, // Item-level instruction reference
      instruction: item.instruction ?? null, // Nested instruction object if loaded
    })),
    is_active: exercise.is_active,
    display_order: exercise.display_order ?? null,
  }
}

/**
 * Convert form data to API create payload
 *
 * @param data - Form data
 * @returns Create DTO for API
 *
 * @example
 * ```typescript
 * const createDto = formDataToCreateDto(formData)
 * const exercise = await exercisesApi.create(createDto)
 * ```
 */
export function formDataToCreateDto(data: ExerciseFormData): ExerciseCreateDto {
  return {
    category_id: data.category_id,
    code: data.code, // Direct mapping (Nov 2025)
    title: data.title,
    subtitle: data.subtitle || null,
    scope: data.scope || null, // Direct mapping (Nov 2025)
    difficulty_level: data.difficulty_level,
    estimated_duration_minutes: data.estimated_duration_minutes,
    target_phonemes: data.target_phonemes,
    display_order: data.display_order ?? undefined,
    instructions: data.instructions.map((inst) => ({
      language: inst.language,
      hint_text: inst.hint_text,
      explanation_text: inst.explanation_text,
      safety_notes: inst.safety_notes, // Updated field name
      display_order: inst.display_order ?? undefined, // Include display_order
    })),
    items: data.items.map((item) => ({
      item_type: item.item_type,
      target_phoneme: item.target_phoneme,
      display_order: item.display_order,
      repetitions: item.repetitions ?? undefined,
      contents: [item.content], // Wrap single content in array
      instruction_id: item.instruction_id ?? undefined, // Send item-level instruction reference
    })),
    is_active: data.is_active,
  }
}

/**
 * Convert form data to API update payload
 *
 * @param data - Form data
 * @returns Update DTO for API
 *
 * @example
 * ```typescript
 * const updateDto = formDataToUpdateDto(formData)
 * const exercise = await exercisesApi.update('123', updateDto)
 * ```
 */
export function formDataToUpdateDto(data: ExerciseFormData): ExerciseUpdateDto {
  return {
    title: data.title,
    subtitle: data.subtitle || null,
    scope: data.scope || null, // Direct mapping (Nov 2025)
    difficulty_level: data.difficulty_level,
    estimated_duration_minutes: data.estimated_duration_minutes,
    target_phonemes: data.target_phonemes,
    display_order: data.display_order ?? undefined,
    instructions: data.instructions.map((inst) => ({
      language: inst.language,
      hint_text: inst.hint_text,
      explanation_text: inst.explanation_text,
      safety_notes: inst.safety_notes, // Updated field name
      display_order: inst.display_order ?? undefined, // Include display_order
    })),
    items: data.items.map((item) => ({
      item_type: item.item_type,
      target_phoneme: item.target_phoneme,
      display_order: item.display_order,
      repetitions: item.repetitions ?? undefined,
      contents: [item.content],
      instruction_id: item.instruction_id ?? undefined, // Send item-level instruction reference
    })),
    is_active: data.is_active,
  }
}

/**
 * Create empty form data with default values
 *
 * @returns Empty form data
 *
 * @example
 * ```typescript
 * const formData = createEmptyFormData()
 * ```
 */
export function createEmptyFormData(): ExerciseFormData {
  return {
    category_id: '',
    code: '', // Changed from exercise_code
    title: '',
    subtitle: '',
    scope: '', // Changed from description
    difficulty_level: 'beginner',
    estimated_duration_minutes: null,
    target_phonemes: [],
    instructions: [], // Structured objects
    items: [],
    is_active: true,
    display_order: null,
  }
}

/**
 * Create empty exercise instructions with default values
 *
 * @param language - Language code (default: 'de')
 * @returns Empty instructions form data
 *
 * @example
 * ```typescript
 * const instructions = createEmptyInstructions('de')
 * ```
 */
export function createEmptyInstructions(language = 'de'): ExerciseInstructionsFormData {
  return {
    id: crypto.randomUUID(),
    language,
    hint_text: null,
    explanation_text: null,
    safety_notes: null, // Updated field name
    display_order: undefined, // Support instruction ordering
  }
}

/**
 * Create empty exercise item content with default values
 *
 * @param language - Language code (default: 'de')
 * @returns Empty item content
 */
export function createEmptyItemContent(language = 'de'): ExerciseItemContent {
  return {
    language,
    text_content: '',
    audio_file_url: null,
    demonstration_video_url: null,
    phonetic_transcription: null,
    visual_cue_image_url: null,
    difficulty_notes: null,
  }
}

/**
 * Create empty exercise item with default values
 *
 * @param itemType - Type of exercise item
 * @param displayOrder - Display order (default: 0)
 * @returns Empty exercise item form data
 *
 * @example
 * ```typescript
 * const movementItem = createEmptyItem('movement', 1)
 * ```
 */
export function createEmptyItem(
  itemType: ExerciseItemType,
  displayOrder = 0
): ExerciseItemFormData {
  return {
    id: crypto.randomUUID(),
    item_type: itemType,
    target_phoneme: null,
    display_order: displayOrder,
    repetitions: null,
    content: createEmptyItemContent('de'),
    instruction_id: null, // Item-level instruction reference
    instruction: null, // Nested instruction object
  }
}
