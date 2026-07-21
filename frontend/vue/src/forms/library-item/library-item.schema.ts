/**
 * Library Item Form Validation Schema
 *
 * Yup validation schema for library item forms.
 * Uses ValidationStore for common rules and LocalizationStore for error messages.
 *
 * @module forms/library-item
 */

import * as yup from 'yup'
import { useValidationStore } from '@/stores/validation'
import { useLocalizationStore } from '@/stores/localization'
import type { LibraryItemType } from '@/api/exercises'

/**
 * Valid library item types
 */
const VALID_ITEM_TYPES: LibraryItemType[] = [
  'movement',
  'speech_practice',
  'information',
  'minimal_pair',
  'word',
  'sentence',
  'breathing',
  'vocalization',
  'articulation',
  'rhythm',
  'intonation',
]

/**
 * Valid language codes
 */
const VALID_LANGUAGES = ['de', 'en', 'fr', 'es', 'it']

/**
 * Create validation schema for library item content (single language)
 *
 * @returns Yup object schema for content
 */
export const createContentSchema = async () => {
  const validation = useValidationStore()
  const loc = useLocalizationStore()
  const rules = await validation.getCommonRules()

  return yup.object({
    // Language: Required, must be valid language code
    language: rules
      .required(loc.t('libraryItems.form.validation.language_required'))
      .concat(
        yup.string().oneOf(VALID_LANGUAGES, loc.t('libraryItems.form.validation.language_invalid'))
      ),

    // Text Content: Required, 1-5000 characters
    text_content: rules
      .required(loc.t('libraryItems.form.validation.textContent_required'))
      .concat(rules.minLength(1, loc.t('libraryItems.form.validation.textContent_minLength')))
      .concat(rules.maxLength(5000, loc.t('libraryItems.form.validation.textContent_maxLength'))),

    // Audio File URL: Optional, valid URL format
    audio_file_url: yup
      .string()
      .nullable()
      .url(loc.t('libraryItems.form.validation.audioUrl_invalid')),

    // Video File URL: Optional, valid URL format
    video_file_url: yup
      .string()
      .nullable()
      .url(loc.t('libraryItems.form.validation.videoUrl_invalid')),

    // Image File URL: Optional, valid URL format
    image_file_url: yup
      .string()
      .nullable()
      .url(loc.t('libraryItems.form.validation.imageUrl_invalid')),

    // Phonetic Transcription: Optional, max 500 characters
    phonetic_transcription: rules
      .maxLength(500, loc.t('libraryItems.form.validation.phonetic_maxLength'))
      .nullable(),

    // Difficulty Notes: Optional, max 1000 characters
    difficulty_notes: rules
      .maxLength(1000, loc.t('libraryItems.form.validation.difficultyNotes_maxLength'))
      .nullable(),
  })
}

/**
 * Create validation schema for library item form
 *
 * CRITICAL: ValidationStore.getCommonRules() is async
 *
 * @returns Promise resolving to Yup object schema
 */
export const createLibraryItemSchema = async () => {
  const validation = useValidationStore()
  const loc = useLocalizationStore()
  const rules = await validation.getCommonRules()
  const contentSchema = await createContentSchema()

  return yup.object({
    // Item Type: Required, must be valid type
    item_type: rules
      .required(loc.t('libraryItems.form.validation.itemType_required'))
      .concat(
        yup.string().oneOf(VALID_ITEM_TYPES, loc.t('libraryItems.form.validation.itemType_invalid'))
      ),

    // Instruction ID: Optional, must be UUID if provided
    instruction_id: yup
      .string()
      .nullable()
      .uuid(loc.t('libraryItems.form.validation.instructionId_invalid')),

    // Display Order: Required, non-negative integer
    display_order: yup
      .number()
      .required(loc.t('libraryItems.form.validation.displayOrder_required'))
      .integer(loc.t('libraryItems.form.validation.displayOrder_integer'))
      .min(0, loc.t('libraryItems.form.validation.displayOrder_min')),

    // Repetitions: Optional, positive integer if provided
    repetitions: yup
      .number()
      .nullable()
      .integer(loc.t('libraryItems.form.validation.repetitions_integer'))
      .min(1, loc.t('libraryItems.form.validation.repetitions_min')),

    // Duration Seconds: Optional, positive number if provided
    duration_seconds: yup
      .number()
      .nullable()
      .min(1, loc.t('libraryItems.form.validation.duration_min')),

    // Metadata: Optional object
    metadata: yup.object().nullable(),

    // Contents: Required, at least one content entry
    contents: yup
      .array()
      .of(contentSchema)
      .required(loc.t('libraryItems.form.validation.contents_required'))
      .min(1, loc.t('libraryItems.form.validation.contents_minLength'))
      .test(
        'unique-languages',
        loc.t('libraryItems.form.validation.contents_uniqueLanguages'),
        (contents) => {
          if (!contents) return true
          const languages = contents.map((c) => c.language)
          return languages.length === new Set(languages).size
        }
      ),
  })
}
