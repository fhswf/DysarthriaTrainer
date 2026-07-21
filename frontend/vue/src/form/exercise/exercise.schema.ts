/**
 * Exercise Form Validation Schema
 *
 * Yup validation schema for exercise forms.
 *
 * @module form/exercise
 */

import * as yup from 'yup'
import { useValidationStore } from '@/stores/validation'

/**
 * Create exercise validation schema
 *
 * Integrates with Validation Service for common rules.
 *
 * @returns Yup schema for exercise form validation
 *
 * @example
 * ```typescript
 * const schema = await createExerciseSchema()
 * await schema.validate(formData)
 * ```
 */
export const createExerciseSchema = async () => {
  const validation = useValidationStore()
  const rules = await validation.getCommonRules()

  return yup.object({
    // Category ID (required, must be UUID)
    category_id: rules.required('exercises.form.validation.category_required'),

    // Exercise Code (required)
    code: rules.required('exercises.form.validation.exerciseCode_required'),

    // Title (required, 3-200 characters)
    title: rules
      .required('exercises.form.validation.title_required')
      .concat(rules.minLength(3, 'exercises.form.validation.title_minLength'))
      .concat(rules.maxLength(200, 'exercises.form.validation.title_maxLength')),

    // Subtitle (optional, max 200 characters)
    subtitle: yup.string().max(200, 'exercises.form.validation.subtitle_maxLength'),

    // Scope/Description (optional, max 2000 characters)
    scope: yup.string().max(2000, 'exercises.form.validation.description_maxLength'),

    // Difficulty Level (required, specific values)
    difficulty_level: rules
      .required('exercises.form.validation.difficultyLevel_required')
      .concat(
        yup
          .string()
          .oneOf(
            ['beginner', 'intermediate', 'advanced'],
            'exercises.form.validation.difficultyLevel_invalid'
          )
      ),

    // Duration (optional, 1-180 minutes)
    estimated_duration_minutes: yup
      .number()
      .nullable()
      .min(1, 'exercises.form.validation.duration_min')
      .max(180, 'exercises.form.validation.duration_max'),

    // Target Phonemes (array of strings)
    target_phonemes: yup.array().of(yup.string().required()).default([]),

    // Instructions (array of structured objects)
    instructions: yup
      .array()
      .of(
        yup.object({
          language: yup
            .string()
            .required('exercises.form.validation.instruction_language_required'),
          hint_text: yup.string().nullable(),
          explanation_text: yup.string().nullable(),
          preparation_text: yup.string().nullable(),
        })
      )
      .default([]),

    // Items (array of exercise items with nested content)
    items: yup
      .array()
      .of(
        yup.object({
          id: yup.string().optional(),
          item_type: yup
            .string()
            .required('exercises.form.validation.item_type_required')
            .oneOf(
              [
                'minimal_pair',
                'word',
                'sentence',
                'breathing',
                'vocalization',
                'articulation',
                'rhythm',
                'intonation',
                'movement',
                'information',
              ],
              'exercises.form.validation.item_type_invalid'
            ),
          target_phoneme: yup.string().nullable(),
          display_order: yup
            .number()
            .required('exercises.form.validation.display_order_required')
            .min(0, 'exercises.form.validation.display_order_min'),
          content: yup.object({
            language: yup.string().required('exercises.form.validation.content_language_required'),
            text_content: yup.string().required('exercises.form.validation.text_content_required'),
            audio_file_url: yup.string().nullable(),
            demonstration_video_url: yup.string().nullable(),
            phonetic_transcription: yup.string().nullable(),
            visual_cue_image_url: yup.string().nullable(),
            difficulty_notes: yup.string().nullable(),
          }),
        })
      )
      .default([]),

    // Display Order (optional)
    display_order: yup.number().nullable(),

    // Active Status (boolean)
    is_active: yup.boolean().default(true),
  })
}
