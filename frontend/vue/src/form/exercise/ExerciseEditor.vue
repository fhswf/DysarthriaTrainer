<template>
  <form @submit.prevent="handleSubmit" class="exercise-editor-form" :class="{ 'readonly': isReadonly }">
    <!-- Basic Information -->
    <ExerciseBasicInfoSection :form-data="formData" :errors="errors" :categories="categories"
      :loading-categories="loadingCategories" :difficulty-options="difficultyOptions" :mode="mode"
      @update:field="updateField" @validate="validateField" @mark-dirty="markDirty" />

    <!-- Content -->
    <Fieldset :legend="loc.t('exercises.form.sections.content')" class="mb-6">
      <!-- Instructions -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="font-semibold">{{ loc.t('exercises.form.labels.instructions') }}</label>
          <Button type="button" :label="loc.t('exercises.form.buttons.addInstruction')" icon="pi pi-plus" size="small"
            @click="openInstructionsDialog" />
        </div>
        <div v-if="formData.instructions && formData.instructions.length > 0" class="space-y-2 mt-3">
          <div v-for="(instruction, index) in formData.instructions" :key="instruction.id || index"
            class="flex items-center justify-between p-3 border border-surface-200 rounded-lg">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <Badge :value="instruction.language?.toUpperCase()" severity="info" />
                <span class="text-sm text-surface-500">
                  #{{ index + 1 }}
                </span>
              </div>
              <div v-if="instruction.hint_text" class="text-sm text-surface-700 line-clamp-2">
                {{ instruction.hint_text }}
              </div>
              <div v-if="instruction.explanation_text" class="text-xs text-surface-500 line-clamp-1 mt-1">
                {{ instruction.explanation_text }}
              </div>
            </div>
            <div class="flex gap-2">
              <Button type="button" icon="pi pi-pencil" size="small" text rounded @click="editInstruction(index)" />
              <Button type="button" icon="pi pi-trash" size="small" text rounded severity="danger"
                @click="deleteInstruction(index)" />
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-surface-500 italic">
          {{ loc.t('exercises.instructions.hints.noInstructions') }}
        </div>
      </div>

      <!-- Exercise Items -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="font-semibold">{{ loc.t('exercises.form.labels.items') }}</label>
          <Button type="button" :label="loc.t('exercises.form.buttons.addItem')" icon="pi pi-plus" size="small"
            @click="openItemDialog" />
        </div>
        <div v-if="formData.items && formData.items.length > 0" class="space-y-2 mt-3">
          <div v-for="(item, index) in formData.items" :key="item.id || index"
            class="flex items-center justify-between p-3 border border-surface-200 rounded-lg">
            <div class="flex items-center gap-3">
              <i :class="getItemIcon(item.item_type)" class="text-xl text-primary-500" />
              <div>
                <div class="font-medium">{{ getItemTypeLabel(item.item_type) }}</div>
                <div class="text-sm text-surface-500">
                  {{ loc.t('exercises.items.labels.displayOrder') }}: {{ item.display_order }}
                  <span v-if="item.repetitions"> • {{ item.repetitions }}x</span>
                  <span v-if="item.duration_seconds"> • {{ item.duration_seconds }}s</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <Button type="button" icon="pi pi-pencil" size="small" text rounded @click="editItem(index)" />
              <Button type="button" icon="pi pi-trash" size="small" text rounded severity="danger"
                @click="deleteItem(index)" />
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-surface-500 italic">
          {{ loc.t('exercises.items.hints.noItems') }}
        </div>
      </div>
    </Fieldset>

    <!-- Settings -->
    <Fieldset :legend="loc.t('exercises.form.sections.settings')" class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Difficulty Level -->
        <FloatLabel variant="on">
          <Select v-model="formData.difficulty_level" :options="difficultyOptions" option-label="label"
            option-value="value" input-id="difficulty_level" class="w-full"
            :class="{ 'p-invalid': errors.difficulty_level }" @change="validateField('difficulty_level')"
            @blur="markDirty" />
          <label for="difficulty_level">{{ loc.t('exercises.form.labels.difficultyLevel') }} *</label>
        </FloatLabel>
        <div class="min-h-5 text-sm text-red-500">{{ errors.difficulty_level }}</div>

        <!-- Duration -->
        <FloatLabel variant="on">
          <InputNumber v-model="formData.estimated_duration_minutes" input-id="duration" :min="1" :max="180"
            :suffix="` ${loc.t('common.units.minutes')}`" class="w-full"
            :class="{ 'p-invalid': errors.estimated_duration_minutes }"
            @blur="validateField('estimated_duration_minutes'); markDirty()" />
          <label for="duration">{{ loc.t('exercises.form.labels.duration') }}</label>
        </FloatLabel>
        <div class="min-h-5 text-sm text-red-500">{{ errors.estimated_duration_minutes }}</div>
      </div>

      <!-- Active Status -->
      <div class="mt-4">
        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.is_active" input-id="is_active" binary @change="markDirty" />
          <label for="is_active">{{ loc.t('exercises.form.labels.isActive') }}</label>
        </div>
      </div>
    </Fieldset>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-2">
      <Button type="button" :label="loc.t('common.actions.cancel')" severity="secondary" outlined
        @click="handleCancel" />
      <Button v-if="mode === 'view'" type="button" :label="loc.t('common.actions.edit')" icon="pi pi-pencil"
        @click="switchToEditMode" />
      <Button v-else type="submit"
        :label="mode === 'create' ? loc.t('common.actions.create') : loc.t('common.actions.save')"
        :loading="isSubmitting" :disabled="isSubmitting || isLoading" />
    </div>

    <!-- Instructions Dialog -->
    <ExerciseInstructionsDialog v-model:visible="instructionsDialogVisible" :instructions="currentInstructions"
      :saving="savingInstructions" @save="handleSaveInstructions" @upload-audio="handleUploadAudio"
      @upload-image="handleUploadImage" />

    <!-- Item Dialog -->
    <ExerciseItemDialog v-model:visible="itemDialogVisible" :item="currentItem" :saving="savingItem"
      @save="handleSaveItem" @upload-video="handleUploadVideo" @upload-audio="handleUploadAudio"
      @upload-image="handleUploadImage" />
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalizationStore } from '@/stores/localization'
import { exerciseCategoryService } from '@/services/exerciseCategoryService'
import type { ExerciseCategory } from '@/services/exerciseCategoryService'
import { useExerciseEditor } from './useExerciseEditor'
import type { ExerciseFormOptions, ExerciseInstructionsFormData, ExerciseItemFormData, ExerciseItemType } from './exercise-editor.types'
import ExerciseBasicInfoSection from './ExerciseBasicInfoSection.vue'
import ExerciseInstructionsDialog from './ExerciseInstructionsDialog.vue'
import ExerciseItemDialog from './ExerciseItemDialog.vue'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import Badge from 'primevue/badge'

const props = defineProps<ExerciseFormOptions>()

const loc = useLocalizationStore()

// Form composable
const {
  formData,
  errors,
  isSubmitting,
  isLoading,
  handleSubmit,
  handleCancel,
  validateField,
  markDirty,
  addInstruction,
  removeInstruction,
  updateInstruction,
} = useExerciseEditor(props)

// Readonly mode for view
const isReadonly = computed(() => props.mode === 'view')
const router = useRouter()

// Helper to update field from section component
const updateField = (field: keyof typeof formData.value, value: unknown) => {
  ; (formData.value as Record<string, unknown>)[field as string] = value
}

const switchToEditMode = () => {
  // Navigate to edit mode for this exercise
  if (props.exerciseId) {
    void router.push(`/app-exercise-editor?mode=edit&id=${props.exerciseId}`)
  }
}

// Instructions Dialog
const instructionsDialogVisible = ref(false)
const currentInstructions = ref<ExerciseInstructionsFormData | null>(null)
const savingInstructions = ref(false)

const openInstructionsDialog = () => {
  currentInstructions.value = null
  instructionsDialogVisible.value = true
}

const editInstruction = (index: number) => {
  // Deep clone to prevent shared nested object references
  currentInstructions.value = JSON.parse(JSON.stringify(formData.value.instructions[index]))
  instructionsDialogVisible.value = true
}

const deleteInstruction = (index: number) => {
  if (confirm(loc.t('exercises.instructions.hints.confirmDelete'))) {
    formData.value.instructions.splice(index, 1)
    markDirty()
  }
}

const handleSaveInstructions = async (data: ExerciseInstructionsFormData) => {
  try {
    savingInstructions.value = true

    if (!formData.value.instructions) {
      formData.value.instructions = []
    }

    // Check if editing existing instruction
    const existingIndex = formData.value.instructions.findIndex(inst => inst.id === data.id)

    if (existingIndex !== -1) {
      // Update existing instruction
      formData.value.instructions[existingIndex] = { ...data }
    } else {
      // Add new instruction
      data.id = crypto.randomUUID()
      formData.value.instructions.push(data)
    }

    markDirty()
    instructionsDialogVisible.value = false
    currentInstructions.value = null
  } catch (error) {
    console.error('Failed to save instructions:', error)
  } finally {
    savingInstructions.value = false
  }
}

const handleUploadAudio = () => {
  // TODO: Implement audio upload
  console.log('Upload audio requested')
}

const handleUploadImage = () => {
  // TODO: Implement image upload
  console.log('Upload image requested')
}

// Item Dialog
const itemDialogVisible = ref(false)
const currentItem = ref<ExerciseItemFormData | null>(null)
const currentItemIndex = ref<number | null>(null)
const savingItem = ref(false)

const openItemDialog = () => {
  currentItem.value = null
  currentItemIndex.value = null
  itemDialogVisible.value = true
}

const editItem = (index: number) => {
  // Deep clone to prevent shared nested object references
  currentItem.value = JSON.parse(JSON.stringify(formData.value.items[index]))
  currentItemIndex.value = index
  itemDialogVisible.value = true
}

const deleteItem = (index: number) => {
  if (confirm(loc.t('exercises.items.hints.confirmDelete'))) {
    formData.value.items.splice(index, 1)
    // Re-index display_order
    formData.value.items.forEach((item, idx) => {
      item.display_order = idx
    })
    markDirty()
  }
}

const handleSaveItem = async (data: ExerciseItemFormData) => {
  try {
    savingItem.value = true

    if (currentItemIndex.value !== null) {
      // Edit existing item
      formData.value.items[currentItemIndex.value] = { ...data }
    } else {
      // Add new item
      if (!formData.value.items) {
        formData.value.items = []
      }
      // Set display_order to next available
      data.display_order = formData.value.items.length
      data.id = `item-${Date.now()}-${Math.random()}`
      formData.value.items.push(data)
    }

    markDirty()
    itemDialogVisible.value = false
    currentItem.value = null
    currentItemIndex.value = null
  } catch (error) {
    console.error('Failed to save item:', error)
  } finally {
    savingItem.value = false
  }
}

const handleUploadVideo = () => {
  // TODO: Implement video upload
  console.log('Upload video requested')
}

const getItemIcon = (type: ExerciseItemType): string => {
  switch (type) {
    case 'movement':
      return 'pi pi-directions'
    case 'speech_practice':
      return 'pi pi-microphone'
    case 'information':
      return 'pi pi-info-circle'
    default:
      return 'pi pi-file'
  }
}

const getItemTypeLabel = (type: ExerciseItemType): string => {
  return loc.t(`exercises.items.types.${type === 'speech_practice' ? 'speechPractice' : type}`)
}

// Categories
const categories = ref<ExerciseCategory[]>([])
const loadingCategories = ref(false)

// Difficulty options
const difficultyOptions = computed(() => [
  {
    label: loc.t('exercises.difficulty.beginner'),
    value: 'beginner',
  },
  {
    label: loc.t('exercises.difficulty.intermediate'),
    value: 'intermediate',
  },
  {
    label: loc.t('exercises.difficulty.advanced'),
    value: 'advanced',
  },
])

// Load categories
const loadCategories = async () => {
  try {
    loadingCategories.value = true
    const response = await exerciseCategoryService.list({ limit: 100 })
    categories.value = response.results
  } catch (_err) {
    // Category loading failed - form will show empty dropdown
  } finally {
    loadingCategories.value = false
  }
}

onMounted(() => {
  void loadCategories()
})
</script>

<style scoped>
.exercise-editor-form {
  max-width: 800px;
}

.exercise-editor-form.readonly :deep(.p-inputtext),
.exercise-editor-form.readonly :deep(.p-textarea),
.exercise-editor-form.readonly :deep(.p-dropdown),
.exercise-editor-form.readonly :deep(.p-checkbox),
.exercise-editor-form.readonly :deep(.p-inputnumber) {
  pointer-events: none;
  opacity: 0.6;
}

.exercise-editor-form.readonly :deep(button:not(.cancel-btn):not(.edit-btn)) {
  display: none;
}
</style>
