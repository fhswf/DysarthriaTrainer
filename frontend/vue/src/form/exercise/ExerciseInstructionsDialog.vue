<template>
    <Dialog :visible="visible" :header="dialogTitle" modal closable :draggable="false" class="w-full max-w-3xl"
        @update:visible="$emit('update:visible', $event)">
        <ExerciseInstructionsForm :form-data="localFormData" :errors="errors" @update:field="handleFieldUpdate" />

        <template #footer>
            <div class="flex items-center justify-end gap-2">
                <Button :label="loc.t('common.actions.cancel')" severity="secondary" outlined @click="handleCancel" />
                <Button :label="loc.t('common.actions.save')" :loading="saving" :disabled="saving"
                    @click="handleSave" />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import ExerciseInstructionsForm from './ExerciseInstructionsForm.vue'
import type { ExerciseInstructionsFormData } from './exercise-editor.types'
import { createEmptyInstructions } from './exercise-editor.types'

/**
 * Props for ExerciseInstructionsDialog
 */
interface Props {
    /** Whether the dialog is visible */
    visible: boolean
    /** Instructions data to edit (null for create mode) */
    instructions: ExerciseInstructionsFormData | null
    /** Whether save operation is in progress */
    saving?: boolean
}

/**
 * Emits for ExerciseInstructionsDialog
 */
interface Emits {
    /** Emitted when visibility changes */
    (e: 'update:visible', value: boolean): void
    /** Emitted when save is clicked */
    (e: 'save', data: ExerciseInstructionsFormData): void
}

const props = withDefaults(defineProps<Props>(), {
    saving: false,
})

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

// Local form data
const localFormData = ref<ExerciseInstructionsFormData>(createEmptyInstructions())
const errors = ref<Partial<Record<keyof ExerciseInstructionsFormData, string>>>({})

// Dialog title based on mode
const dialogTitle = computed(() =>
    props.instructions
        ? loc.t('exercises.instructions.dialog.titleEdit')
        : loc.t('exercises.instructions.dialog.titleCreate')
)

// Watch for instructions prop changes
watch(
    () => props.instructions,
    (newInstructions) => {
        if (newInstructions) {
            localFormData.value = { ...newInstructions }
        } else {
            localFormData.value = createEmptyInstructions()
        }
        errors.value = {}
    },
    { immediate: true }
)

// Watch for dialog close to reset form
watch(
    () => props.visible,
    (isVisible) => {
        if (!isVisible) {
            errors.value = {}
        }
    }
)

// Handle field update
const handleFieldUpdate = (
    field: keyof ExerciseInstructionsFormData,
    value: unknown
) => {
    ; (localFormData.value as Record<string, unknown>)[field] = value
    // Clear error for this field
    if (errors.value[field]) {
        delete errors.value[field]
    }
}

// Validate form
const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExerciseInstructionsFormData, string>> = {}

    if (!localFormData.value.language) {
        newErrors.language = loc.t('exercises.instructions.errors.languageRequired')
    }

    errors.value = newErrors
    return Object.keys(newErrors).length === 0
}

// Handle save
const handleSave = () => {
    if (validateForm()) {
        emit('save', localFormData.value)
    }
}

// Handle cancel
const handleCancel = () => {
    emit('update:visible', false)
}
</script>
