/**
 * Exercise Category Form Composable
 *
 * Manages form state, validation, and submission for exercise category forms.
 *
 * @module form/exercise-category
 */
import { ref, computed, watch, onMounted } from 'vue'
import * as yup from 'yup'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import { exerciseCategoryService } from '@/services/exerciseCategoryService'
import type { ExerciseCategory } from '@/services/exerciseCategoryService'
import { createExerciseCategorySchema } from './exercise-category.schema'
import {
  apiToFormData,
  formDataToCreatePayload,
  formDataToUpdatePayload,
  generateSlug,
} from './exercise-category.types'
import type {
  ExerciseCategoryFormData,
  ExerciseCategoryFormOptions,
} from './exercise-category.types'

/**
 * Exercise category form composable
 *
 * Provides form state management, validation, and submission logic.
 *
 * @param options - Form configuration options
 * @returns Form state and methods
 *
 * @example
 * ```vue
 * <script setup>
 * const { formData, errors, isSubmitting, handleSubmit } = useExerciseCategory({
 *   mode: 'create',
 *   onSuccess: (category) => router.push('/exercise-categories')
 * })
 * </script>
 * ```
 */
export function useExerciseCategory(options: ExerciseCategoryFormOptions = {}) {
  const loc = useLocalizationStore()
  const messaging = useMessagingStore()

  // Default to create mode
  const mode = options.mode ?? 'create'

  // Form data
  const formData = ref<ExerciseCategoryFormData>({
    name: '',
    slug: '',
    description: null,
    icon_url: null,
    display_order: 0,
  })

  // Form state
  const errors = ref<Partial<Record<keyof ExerciseCategoryFormData, string>>>({})
  const touchedFields = ref<Set<keyof ExerciseCategoryFormData>>(new Set())
  const isDirty = ref(false)
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const schema = ref<yup.AnyObjectSchema | null>(null)

  // Auto-generate slug from name
  const autoSlug = ref(true)

  // Computed properties
  const isValid = computed(() => Object.keys(errors.value).length === 0)
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  const isReadonly = computed(() => mode === 'view')

  // Initialize schema
  const initSchema = async () => {
    schema.value = await createExerciseCategorySchema()
  }

  // Load existing category (edit/view mode)
  const loadCategory = async () => {
    if (!options.categoryId || mode === 'create') return

    try {
      isLoading.value = true
      const category = await exerciseCategoryService.getById(options.categoryId)
      formData.value = apiToFormData(category)
      autoSlug.value = false // Disable auto-slug for existing categories
    } catch (error) {
      const message = loc.t('exerciseCategories.errors.loadFailed')
      void messaging.error(message, (error as Error).message)
      options.onError?.(error as Error)
    } finally {
      isLoading.value = false
    }
  }

  // Validate single field
  const validateField = async (field: keyof ExerciseCategoryFormData) => {
    if (!schema.value) return

    try {
      await schema.value.validateAt(field, formData.value)
      delete errors.value[field]
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        errors.value[field] = error.message
      }
    }

    touchedFields.value.add(field)
  }

  // Validate entire form
  const validateForm = async (): Promise<boolean> => {
    if (!schema.value) return false

    try {
      await schema.value.validate(formData.value, { abortEarly: false })
      errors.value = {}
      return true
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: Partial<Record<keyof ExerciseCategoryFormData, string>> = {}
        error.inner?.forEach((err) => {
          if (err.path) {
            newErrors[err.path as keyof ExerciseCategoryFormData] = err.message
            touchedFields.value.add(err.path as keyof ExerciseCategoryFormData)
          }
        })
        errors.value = newErrors
      }
      return false
    }
  }

  // Submit handler
  const handleSubmit = async () => {
    if (isSubmitting.value || isReadonly.value) return

    const isValid = await validateForm()
    if (!isValid) {
      void messaging.warn(loc.t('common.validation.fixErrors'))
      return
    }

    try {
      isSubmitting.value = true

      let result: ExerciseCategory
      if (mode === 'create') {
        const payload = formDataToCreatePayload(formData.value)
        result = await exerciseCategoryService.create(payload)
        void messaging.success(loc.t('exerciseCategories.messages.createSuccess'))
      } else {
        const payload = formDataToUpdatePayload(formData.value)
        result = await exerciseCategoryService.update(options.categoryId!, payload)
        void messaging.success(loc.t('exerciseCategories.messages.updateSuccess'))
      }

      isDirty.value = false
      options.onSuccess?.(result)
    } catch (error) {
      const message =
        mode === 'create'
          ? loc.t('exerciseCategories.errors.createFailed')
          : loc.t('exerciseCategories.errors.updateFailed')
      void messaging.error(message, (error as Error).message)
      options.onError?.(error as Error)
    } finally {
      isSubmitting.value = false
    }
  }

  // Cancel handler
  const handleCancel = () => {
    options.onCancel?.()
  }

  // Reset form
  const resetForm = () => {
    formData.value = {
      name: '',
      slug: '',
      description: null,
      icon_url: null,
      sort_order: 0,
    }
    errors.value = {}
    touchedFields.value.clear()
    isDirty.value = false
    autoSlug.value = true
  }

  // Mark field as touched
  const setFieldTouched = (field: keyof ExerciseCategoryFormData) => {
    touchedFields.value.add(field)
  }

  // Check if field is touched
  const isFieldTouched = (field: keyof ExerciseCategoryFormData) => {
    return touchedFields.value.has(field)
  }

  // Clear field error
  const clearFieldError = (field: keyof ExerciseCategoryFormData) => {
    delete errors.value[field]
  }

  // Watch name changes for auto-slug generation
  watch(
    () => formData.value.name,
    (newName) => {
      if (autoSlug.value && newName) {
        formData.value.slug = generateSlug(newName)
        // Clear slug error when auto-generating
        clearFieldError('slug')
      }
      isDirty.value = true
    }
  )

  // Watch form data for dirty state
  watch(
    formData,
    () => {
      isDirty.value = true
    },
    { deep: true }
  )

  // Initialize
  onMounted(async () => {
    await initSchema()
    await loadCategory()
  })

  return {
    // Form data
    formData,
    // State
    errors,
    touchedFields,
    isDirty,
    isSubmitting,
    isLoading,
    isValid,
    hasErrors,
    isReadonly,
    autoSlug,
    // Methods
    validateField,
    validateForm,
    handleSubmit,
    handleCancel,
    resetForm,
    setFieldTouched,
    isFieldTouched,
    clearFieldError,
    loadCategory,
  }
}
