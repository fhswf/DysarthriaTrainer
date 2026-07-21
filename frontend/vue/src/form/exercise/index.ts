/**
 * Exercise Form Module
 *
 * Exports all exercise form functionality.
 *
 * @module form/exercise
 */

export { useExerciseEditor } from './useExerciseEditor'
export { createExerciseSchema } from './exercise.schema'
export {
  apiToFormData,
  formDataToCreateDto,
  formDataToUpdateDto,
  createEmptyFormData,
  createEmptyInstructions,
  createEmptyItem,
} from './exercise-editor.types'
export type {
  ExerciseFormData,
  ExerciseFormOptions,
  ExerciseInstructionsFormData,
  ExerciseItemFormData,
  ExerciseItemType,
  ExerciseItemContent,
  MovementContent,
  SpeechPracticeContent,
  InformationContent,
} from './exercise-editor.types'
