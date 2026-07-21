<template>
    <div class="exercise-instructions-form">
        <!-- Language Selection -->
        <div class="mb-4">
            <label for="language" class="block font-semibold mb-2">
                {{ loc.t('exercises.instructions.labels.language') }} *
            </label>
            <Select id="language" :model-value="formData.language" :options="languageOptions" option-label="label"
                option-value="value" class="w-full" :class="{ 'p-invalid': errors.language }"
                @update:model-value="$emit('update:field', 'language', $event)" />
            <small v-if="errors.language" class="text-red-500">{{ errors.language }}</small>
        </div>

        <!-- Hint Text -->
        <div class="mb-4">
            <label for="hint_text" class="block font-semibold mb-2">
                {{ loc.t('exercises.instructions.labels.hintText') }}
            </label>
            <Textarea id="hint_text" :model-value="formData.hint_text" rows="3" class="w-full"
                :placeholder="loc.t('exercises.instructions.hints.hintText')"
                @update:model-value="$emit('update:field', 'hint_text', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.instructions.hints.hintTextDescription') }}
            </small>
        </div>

        <!-- Explanation Text -->
        <div class="mb-4">
            <label for="explanation_text" class="block font-semibold mb-2">
                {{ loc.t('exercises.instructions.labels.explanationText') }}
            </label>
            <Textarea id="explanation_text" :model-value="formData.explanation_text" rows="5" class="w-full"
                :placeholder="loc.t('exercises.instructions.hints.explanationText')"
                @update:model-value="$emit('update:field', 'explanation_text', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.instructions.hints.explanationTextDescription') }}
            </small>
        </div>

        <!-- Preparation Text -->
        <div class="mb-4">
            <label for="preparation_text" class="block font-semibold mb-2">
                {{ loc.t('exercises.instructions.labels.preparationText') }}
            </label>
            <Textarea id="preparation_text" :model-value="formData.preparation_text" rows="3" class="w-full"
                :placeholder="loc.t('exercises.instructions.hints.preparationText')"
                @update:model-value="$emit('update:field', 'preparation_text', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.instructions.hints.preparationTextDescription') }}
            </small>
        </div>


    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import type { ExerciseInstructionsFormData } from './exercise-editor.types'

/**
 * Props for ExerciseInstructionsForm
 */
interface Props {
    /** Form data for instructions */
    formData: ExerciseInstructionsFormData
    /** Validation errors */
    errors: Partial<Record<keyof ExerciseInstructionsFormData, string>>
}

/**
 * Emits for ExerciseInstructionsForm
 */
interface Emits {
    /** Emitted when a field value changes */
    (e: 'update:field', field: keyof ExerciseInstructionsFormData, value: unknown): void
}

defineProps<Props>()
defineEmits<Emits>()

const loc = useLocalizationStore()

const languageOptions = computed(() => [
    { label: loc.t('languages.en'), value: 'en' },
    { label: loc.t('languages.de'), value: 'de' },
])
</script>
