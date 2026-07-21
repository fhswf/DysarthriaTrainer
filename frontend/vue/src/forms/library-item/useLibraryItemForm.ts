/**
 * Library Item Form Composable
 *
 * Manages form state, validation, and submission for library item forms.
 *
 * @module forms/library-item
 */
import { ref, computed, onMounted } from 'vue'
import * as yup from 'yup'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import { libraryItemsApi } from '@/api/exercises'
import type { LibraryItem } from '@/api/exercises'
import { createLibraryItemSchema, createContentSchema } from './library-item.schema'
import {
  apiToFormData,
  formDataToCreatePayload,
  formDataToUpdatePayload,
  createEmptyFormData,
} from './library-item.types'
import type { LibraryItemFormData, LibraryItemFormOptions } from './library-item.types'

/**
 * Library item form composable
 *
 * Provides form state management, validation, and submission logic.
 *
 * @param options - Form configuration options
 * @returns Form state and methods
 *
 * @example
 * ```vue
 * <script setup>
 * const { formData, errors, isSubmitting, handleSubmit } = useLibraryItemForm({
 *   mode: 'create',
 *   onSuccess: (item) => router.push('/library-items')
 * })
 * </script>
 * ```
 */
export function useLibraryItemForm(options: LibraryItemFormOptions = {}) {
  const loc = useLocalizationStore()
  const messaging = useMessagingStore()

  // Default to create mode
  const mode = options.mode ?? 'create'

  // Form data
  const formData = ref<LibraryItemFormData>(
    createEmptyFormData({
      itemType: options.initialItemType,
      language: loc.currentLocale,
    })
  )

  // Form state
  const errors = ref<Partial<Record<keyof LibraryItemFormData, string>>>({})
  const contentErrors = ref<Array<Partial<Record<string, string>>>>([{}])
  const touchedFields = ref<Set<keyof LibraryItemFormData>>(new Set())
  const touchedContentFields = ref<Array<Set<string>>>([new Set()])
  const isDirty = ref(false)
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const schema = ref<yup.AnyObjectSchema | null>(null)

  // Computed properties
  const isValid = computed(() => {
    const hasFormErrors = Object.keys(errors.value).length > 0
    const hasContentErrors = contentErrors.value.some((ce) => Object.keys(ce).length > 0)
    return !hasFormErrors && !hasContentErrors
  })
  const hasErrors = computed(() => !isValid.value)
  const isReadonly = computed(() => mode === 'view')

  // Initialize schema
  const initSchema = async () => {
    schema.value = await createLibraryItemSchema()
  }

  // Load existing library item (edit/view mode)
  const loadItem = async () => {
    if (!options.itemId || mode === 'create') return

    try {
      isLoading.value = true
      const item = await libraryItemsApi.getById(options.itemId)
      formData.value = apiToFormData(item)

      // Initialize content error tracking for loaded contents
      contentErrors.value = Array.from({ length: item.contents.length }, () => ({}))
      touchedContentFields.value = Array.from({ length: item.contents.length }, () => new Set())
    } catch (error) {
      const message = loc.t('libraryItems.errors.loadFailed')
      void messaging.error(message, (error as Error).message)
      options.onError?.(error as Error)
    } finally {
      isLoading.value = false
    }
  }

  // Validate single field
  const validateField = async (field: keyof LibraryItemFormData) => {
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

  // Validate content field
  const validateContentField = async (contentIndex: number, field: string) => {
    if (!schema.value) return

    try {
      const contentValue = formData.value.contents[contentIndex]
      const contentSchema = await createContentSchema()
      await contentSchema.validateAt(field, contentValue)
      delete contentErrors.value[contentIndex][field]
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        if (!contentErrors.value[contentIndex]) {
          contentErrors.value[contentIndex] = {}
        }
        contentErrors.value[contentIndex][field] = error.message
      }
    }

    touchedContentFields.value[contentIndex].add(field)
  }

  // Validate entire form
  const validateForm = async (): Promise<boolean> => {
    if (!schema.value) return false

    try {
      await schema.value.validate(formData.value, { abortEarly: false })
      errors.value = {}
      contentErrors.value = formData.value.contents.map(() => ({}))
      return true
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: Partial<Record<keyof LibraryItemFormData, string>> = {}
        const newContentErrors: Array<Record<string, string>> = formData.value.contents.map(
          () => ({})
        )

        error.inner?.forEach((err) => {
          if (err.path) {
            // Parse path: "contents[0].text_content"
            const contentMatch = err.path.match(/^contents\[(\d+)\]\.(.+)$/)
            if (contentMatch) {
              const [, indexStr, field] = contentMatch
              const index = parseInt(indexStr, 10)
              newContentErrors[index][field] = err.message
              touchedContentFields.value[index].add(field)
            } else {
              newErrors[err.path as keyof LibraryItemFormData] = err.message
              touchedFields.value.add(err.path as keyof LibraryItemFormData)
            }
          }
        })

        errors.value = newErrors
        contentErrors.value = newContentErrors
      }
      return false
    }
  }

  // Add new content entry
  const addContentEntry = () => {
    formData.value.contents.push({
      language: '',
      text_content: '',
      audio_file_url: null,
      video_file_url: null,
      image_file_url: null,
      phonetic_transcription: null,
      difficulty_notes: null,
    })
    contentErrors.value.push({})
    touchedContentFields.value.push(new Set())
    isDirty.value = true
  }

  // Remove content entry
  const removeContentEntry = (index: number) => {
    if (formData.value.contents.length <= 1) {
      void messaging.warn(loc.t('libraryItems.form.validation.contents_minLength'))
      return
    }

    formData.value.contents.splice(index, 1)
    contentErrors.value.splice(index, 1)
    touchedContentFields.value.splice(index, 1)
    isDirty.value = true
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

      let result: LibraryItem
      if (mode === 'create') {
        const payload = formDataToCreatePayload(formData.value)
        result = await libraryItemsApi.create(payload)
        void messaging.success(loc.t('libraryItems.messages.createSuccess'))
      } else {
        const payload = formDataToUpdatePayload(formData.value)
        result = await libraryItemsApi.update(options.itemId!, payload)
        void messaging.success(loc.t('libraryItems.messages.updateSuccess'))
      }

      isDirty.value = false
      options.onSuccess?.(result)
    } catch (error) {
      const message =
        mode === 'create'
          ? loc.t('libraryItems.errors.createFailed')
          : loc.t('libraryItems.errors.updateFailed')
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
    formData.value = createEmptyFormData({
      itemType: options.initialItemType,
      language: loc.currentLocale,
    })
    errors.value = {}
    contentErrors.value = [{}]
    touchedFields.value.clear()
    touchedContentFields.value = [new Set()]
    isDirty.value = false
  }

  // Mark field as touched
  const setFieldTouched = (field: keyof LibraryItemFormData) => {
    touchedFields.value.add(field)
  }

  // Mark content field as touched
  const setContentFieldTouched = (contentIndex: number, field: string) => {
    touchedContentFields.value[contentIndex].add(field)
  }

  // Clear field error
  const clearFieldError = (field: keyof LibraryItemFormData) => {
    delete errors.value[field]
  }

  // Clear content field error
  const clearContentFieldError = (contentIndex: number, field: string) => {
    delete contentErrors.value[contentIndex][field]
  }

  // Watch for changes to mark form as dirty
  const markDirty = () => {
    isDirty.value = true
  }

  // Initialize
  onMounted(async () => {
    await initSchema()
    await loadItem()
  })

  return {
    // Form data
    formData,
    errors,
    contentErrors,

    // State
    isDirty,
    isSubmitting,
    isLoading,
    isValid,
    hasErrors,
    isReadonly,
    touchedFields,
    touchedContentFields,

    // Methods
    validateField,
    validateContentField,
    validateForm,
    handleSubmit,
    handleCancel,
    resetForm,
    setFieldTouched,
    setContentFieldTouched,
    clearFieldError,
    clearContentFieldError,
    markDirty,

    // Content management
    addContentEntry,
    removeContentEntry,
  }
}
