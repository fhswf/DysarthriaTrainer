<template>
    <Fieldset :legend="loc.t('exercises.form.sections.basic')" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category -->
            <FloatLabel variant="on">
                <Select :model-value="formData.category_id" :options="categories" option-label="name" option-value="id"
                    :loading="loadingCategories" :placeholder="loc.t('exercises.form.labels.category')"
                    input-id="category_id" class="w-full" :class="{ 'p-invalid': errors.category_id }"
                    @update:model-value="$emit('update:field', 'category_id', $event)"
                    @change="$emit('validate', 'category_id')" @blur="$emit('mark-dirty')" />
                <label for="category_id">{{ loc.t('exercises.form.labels.category') }} *</label>
            </FloatLabel>
            <div class="min-h-5 text-sm text-red-500">{{ errors.category_id }}</div>

            <!-- Exercise Code -->
            <FloatLabel variant="on">
                <InputText :model-value="formData.code" input-id="code" class="w-full"
                    :class="{ 'p-invalid': errors.code }" :disabled="mode === 'edit'"
                    @update:model-value="$emit('update:field', 'code', $event)"
                    @blur="$emit('validate', 'code'); $emit('mark-dirty')" />
                <label for="code">{{ loc.t('exercises.form.labels.exerciseCode') }} *</label>
            </FloatLabel>
            <div v-if="!errors.code" class="min-h-5 text-sm text-surface-500">
                {{ loc.t('exercises.form.hints.exerciseCode') }}
            </div>
            <div v-else class="min-h-5 text-sm text-red-500">{{ errors.code }}</div>
        </div>

        <div class="grid grid-cols-1 gap-4 mt-4">
            <!-- Title -->
            <FloatLabel variant="on">
                <InputText :model-value="formData.title" input-id="title" class="w-full"
                    :class="{ 'p-invalid': errors.title }" @update:model-value="$emit('update:field', 'title', $event)"
                    @blur="$emit('validate', 'title'); $emit('mark-dirty')" />
                <label for="title">{{ loc.t('exercises.form.labels.title') }} *</label>
            </FloatLabel>
            <div class="min-h-5 text-sm text-red-500">{{ errors.title }}</div>

            <!-- Subtitle -->
            <FloatLabel variant="on">
                <InputText :model-value="formData.subtitle" input-id="subtitle" class="w-full"
                    :class="{ 'p-invalid': errors.subtitle }"
                    @update:model-value="$emit('update:field', 'subtitle', $event)"
                    @blur="$emit('validate', 'subtitle'); $emit('mark-dirty')" />
                <label for="subtitle">{{ loc.t('exercises.form.labels.subtitle') }}</label>
            </FloatLabel>
            <div class="min-h-5 text-sm text-red-500">{{ errors.subtitle }}</div>

            <!-- Scope (Description) -->
            <FloatLabel variant="on">
                <Textarea :model-value="formData.scope" input-id="scope" rows="4" class="w-full"
                    :class="{ 'p-invalid': errors.scope }" @update:model-value="$emit('update:field', 'scope', $event)"
                    @blur="$emit('validate', 'scope'); $emit('mark-dirty')" />
                <label for="scope">{{ loc.t('exercises.form.labels.description') }}</label>
            </FloatLabel>
            <div class="min-h-5 text-sm text-red-500">{{ errors.scope }}</div>

            <!-- Difficulty Level -->
            <FloatLabel variant="on">
                <Select :model-value="formData.difficulty_level" :options="difficultyOptions" option-label="label"
                    option-value="value" input-id="difficulty_level" class="w-full"
                    :class="{ 'p-invalid': errors.difficulty_level }"
                    @update:model-value="$emit('update:field', 'difficulty_level', $event)"
                    @change="$emit('validate', 'difficulty_level')" @blur="$emit('mark-dirty')" />
                <label for="difficulty_level">{{ loc.t('exercises.form.labels.difficultyLevel') }} *</label>
            </FloatLabel>
            <div class="min-h-5 text-sm text-red-500">{{ errors.difficulty_level }}</div>
        </div>
    </Fieldset>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'
import type { ExerciseFormData } from './exercise-editor.types'
import type { ExerciseCategory } from '@/api/exercises'

/**
 * Props for ExerciseBasicInfoSection component
 */
interface Props {
    /** Form data containing basic info fields */
    formData: ExerciseFormData
    /** Validation errors for each field */
    errors: Partial<Record<keyof ExerciseFormData, string>>
    /** Available exercise categories */
    categories: ExerciseCategory[]
    /** Whether categories are being loaded */
    loadingCategories: boolean
    /** Difficulty level options */
    difficultyOptions: Array<{ label: string; value: number }>
    /** Form mode (create or edit) */
    mode: 'create' | 'edit'
}

/**
 * Emits for ExerciseBasicInfoSection component
 */
interface Emits {
    /** Emitted when any field value changes */
    (e: 'update:field', field: keyof ExerciseFormData, value: unknown): void
    /** Emitted when a field needs validation */
    (e: 'validate', field: keyof ExerciseFormData): void
    /** Emitted when the form is marked as dirty */
    (e: 'mark-dirty'): void
}

defineProps<Props>()
defineEmits<Emits>()

const loc = useLocalizationStore()
</script>
