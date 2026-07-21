/**
 * Exercise Form Composable
 *
 * Manages form state, validation, and submission for exercise forms.
 *
 * @module form/exercise
 */

import { ref, computed, onMounted } from 'vue'
import { exercisesApi } from '@/api/exercises'
import type { Exercise } from '@/api/exercises'
import { useMessagingStore } from '@/stores/messaging'
import { useLocalizationStore } from '@/stores/localization'
import { createExerciseSchema } from './exercise.schema'
import {
  apiToFormData,
  formDataToCreateDto,
  formDataToUpdateDto,
  createEmptyFormData,
} from './exercise-editor.types'
import type {
  ExerciseFormData,
  ExerciseFormOptions,
  ExerciseInstructionsFormData,
} from './exercise-editor.types'

/**
 * Exercise form composable
 *
 * Provides form state management, validation, and submission logic.
 *
 * @param options - Form configuration options
 * @returns Form state and methods
 *
 * @example
 * ```vue
 * <script setup>
 * const { formData, errors, isSubmitting, handleSubmit } = useExerciseEditor({
 *   mode: 'create',
 *   onSuccess: (exercise) => router.push(`/exercises/${exercise.id}`)
 * })
 * </script>
 * ```
 */
export const useExerciseEditor = (options: ExerciseFormOptions) => {
  const { mode, exerciseId, onSuccess, onError, onCancel } = options

  const messaging = useMessagingStore()
  const loc = useLocalizationStore()

  // Form state
  const formData = ref<ExerciseFormData>(createEmptyFormData())
  const errors = ref<Partial<Record<keyof ExerciseFormData, string>>>({})
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const schema = ref<unknown>(null)

  // Computed
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  const isDirty = ref(false)

  /**
   * Initialize validation schema
   */
  const initSchema = async () => {
    try {
      schema.value = await createExerciseSchema()
    } catch (_err) {
      void messaging.error(loc.t('common.errors.initializationFailed'))
    }
  }

  /**
   * Load existing exercise data (edit mode)
   */
  const loadExercise = async () => {
    if (mode !== 'edit' || !exerciseId) return

    try {
      isLoading.value = true
      const exercise = await exercisesApi.getById(exerciseId, {
        load_instructions: true,
        load_items: true,
      })
      formData.value = apiToFormData(exercise)
    } catch (err) {
      const error = err as Error
      void messaging.error(loc.t('exercises.errors.loadFailed'))
      onError?.(error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Validate a single field
   */
  const validateField = async (field: keyof ExerciseFormData) => {
    if (!schema.value) return

    try {
      const schemaObj = schema.value as {
        validateAt: (field: string, value: unknown) => Promise<unknown>
      }
      await schemaObj.validateAt(field, formData.value)
      delete errors.value[field]
    } catch (err: unknown) {
      const error = err as { message: string }
      errors.value[field] = loc.t(error.message)
    }
  }

  /**
   * Validate all fields
   */
  const validateForm = async (): Promise<boolean> => {
    if (!schema.value) {
      return false
    }

    try {
      const schemaObj = schema.value as {
        validate: (value: unknown, options?: unknown) => Promise<unknown>
      }
      await schemaObj.validate(formData.value, { abortEarly: false })
      errors.value = {}
      console.log('✅ Validation passed')
      return true
    } catch (err: unknown) {
      const validationErrors: Partial<Record<keyof ExerciseFormData, string>> = {}
      const validationError = err as { inner?: Array<{ path?: string; message: string }> }

      if (validationError.inner) {
        console.error('❌ Validation errors:', validationError.inner)
        validationError.inner.forEach((error) => {
          if (error.path) {
            console.error(`  - ${error.path}: ${error.message}`)
            validationErrors[error.path as keyof ExerciseFormData] = loc.t(error.message)
          }
        })
      }

      errors.value = validationErrors
      console.error('Validation failed. Errors:', validationErrors)
      console.log('Current form data:', JSON.stringify(formData.value, null, 2))
      return false
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (isSubmitting.value) return

    // Validate form
    const isValid = await validateForm()
    if (!isValid) {
      void messaging.error(loc.t('common.validation.fixErrors'))
      return
    }

    try {
      isSubmitting.value = true

      let result: Exercise

      if (mode === 'create') {
        const createDto = formDataToCreateDto(formData.value)
        result = await exercisesApi.create(createDto)
        void messaging.success(loc.t('exercises.messages.createSuccess'))
      } else {
        if (!exerciseId) {
          throw new Error('Exercise ID is required for update')
        }
        const updateDto = formDataToUpdateDto(formData.value)
        result = await exercisesApi.update(exerciseId, updateDto)
        void messaging.success(loc.t('exercises.messages.updateSuccess'))
      }

      isDirty.value = false
      onSuccess?.(result)
    } catch (err) {
      const error = err as Error
      void messaging.error(
        mode === 'create'
          ? loc.t('exercises.errors.createFailed')
          : loc.t('exercises.errors.updateFailed')
      )
      onError?.(error)
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    if (isDirty.value) {
      // TODO: Add confirmation dialog
      const confirmed = confirm(loc.t('common.confirmations.discardChanges'))
      if (!confirmed) return
    }
    onCancel?.()
  }

  /**
   * Mark form as dirty on field change
   */
  const markDirty = () => {
    isDirty.value = true
  }

  /**
   * Add instruction to list
   */
  const addInstruction = (language = 'de') => {
    const newInstruction: ExerciseInstructionsFormData = {
      id: crypto.randomUUID(),
      language,
      hint_text: null,
      explanation_text: null,
      preparation_text: null,
    }
    formData.value.instructions.push(newInstruction)
    markDirty()
  }

  /**
   * Remove instruction from list
   */
  const removeInstruction = (index: number) => {
    formData.value.instructions.splice(index, 1)
    markDirty()
  }

  /**
   * Update instruction at index
   */
  const updateInstruction = (index: number, updates: Partial<ExerciseInstructionsFormData>) => {
    if (formData.value.instructions[index]) {
      formData.value.instructions[index] = {
        ...formData.value.instructions[index],
        ...updates,
      }
      markDirty()
    }
  }

  // Initialize on mount
  onMounted(async () => {
    await initSchema()
    await loadExercise()
  })

  return {
    // State
    formData,
    errors,
    isSubmitting,
    isLoading,
    isDirty,
    hasErrors,

    // Methods
    handleSubmit,
    handleCancel,
    validateField,
    validateForm,
    markDirty,

    // Instructions management
    addInstruction,
    removeInstruction,
    updateInstruction,
  }
}
