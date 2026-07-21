<template>
    <div class="exercise-category-form w-full max-w-4xl mx-auto">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <ProgressSpinner />
        </div>

        <!-- Form Content -->
        <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-6">
            <!-- Basic Information Section -->
            <Fieldset :legend="loc.t('exerciseCategories.form.sections.basic')">
                <div class="flex flex-col gap-6">
                    <!-- Category Name -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputText id="name" v-model="formData.name" :disabled="isReadonly"
                                :invalid="isFieldTouched('name') && !!errors.name" class="w-full"
                                @blur="handleBlur('name')" />
                            <label for="name">
                                {{ loc.t('exerciseCategories.form.labels.name') }} *
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.name') }}
                        </small>
                        <small v-if="isFieldTouched('name') && errors.name" class="text-red-500 min-h-5">
                            {{ errors.name }}
                        </small>
                    </div>

                    <!-- URL Slug -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputText id="slug" v-model="formData.slug" :disabled="isReadonly"
                                :invalid="isFieldTouched('slug') && !!errors.slug" class="w-full"
                                @blur="handleBlur('slug')" @focus="handleSlugFocus" />
                            <label for="slug">
                                {{ loc.t('exerciseCategories.form.labels.slug') }} *
                            </label>
                        </FloatLabel>
                        <small v-if="autoSlug" class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.slugAuto') }}
                        </small>
                        <small v-else class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.slug') }}
                        </small>
                        <small v-if="isFieldTouched('slug') && errors.slug" class="text-red-500 min-h-5">
                            {{ errors.slug }}
                        </small>
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <Textarea id="description" v-model="formData.description" :disabled="isReadonly"
                                :invalid="isFieldTouched('description') && !!errors.description" rows="4" class="w-full"
                                @blur="handleBlur('description')" />
                            <label for="description">
                                {{ loc.t('exerciseCategories.form.labels.description') }}
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.description') }}
                        </small>
                        <small v-if="isFieldTouched('description') && errors.description" class="text-red-500 min-h-5">
                            {{ errors.description }}
                        </small>
                    </div>
                </div>
            </Fieldset>

            <!-- Display Settings Section -->
            <Fieldset :legend="loc.t('exerciseCategories.form.sections.display')">
                <div class="flex flex-col gap-6">
                    <!-- Icon -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputText id="icon_url" v-model="formData.icon_url" :disabled="isReadonly"
                                :invalid="isFieldTouched('icon_url') && !!errors.icon_url" class="w-full"
                                placeholder="pi pi-book" @blur="handleBlur('icon_url')" />
                            <label for="icon_url">
                                {{ loc.t('exerciseCategories.form.labels.iconUrl') }}
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.iconUrl') }}
                        </small>
                        <small v-if="isFieldTouched('icon_url') && errors.icon_url" class="text-red-500 min-h-5">
                            {{ errors.icon_url }}
                        </small>

                        <!-- Icon Preview -->
                        <div v-if="formData.icon_url && isValidIcon"
                            class="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                            <span class="font-medium text-sm text-surface-600 dark:text-surface-400">
                                {{ loc.t('exerciseCategories.form.labels.iconPreview') }}:
                            </span>
                            <i :class="formData.icon_url" class="text-2xl text-primary-500" />
                        </div>
                    </div>

                    <!-- Display Order -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputNumber id="display_order" v-model="formData.display_order" :disabled="isReadonly"
                                :invalid="isFieldTouched('display_order') && !!errors.display_order" :min="0" :step="1"
                                :use-grouping="false" class="w-full" @blur="handleBlur('display_order')" />
                            <label for="display_order">
                                {{ loc.t('exerciseCategories.form.labels.displayOrder') }} *
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('exerciseCategories.form.hints.displayOrder') }}
                        </small>
                        <small v-if="isFieldTouched('display_order') && errors.display_order"
                            class="text-red-500 min-h-5">
                            {{ errors.display_order }}
                        </small>
                    </div>
                </div>
            </Fieldset>

            <!-- Action Buttons -->
            <div class="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                <Button v-if="!isReadonly" type="button" :label="loc.t('exerciseCategories.form.buttons.cancel')"
                    severity="secondary" outlined @click="handleCancel" />
                <Button v-if="isReadonly" type="button" :label="loc.t('exerciseCategories.form.buttons.back')"
                    severity="secondary" @click="handleCancel" />
                <Button v-if="!isReadonly" type="submit" :label="formMode === 'create'
                    ? loc.t('exerciseCategories.form.buttons.create')
                    : loc.t('exerciseCategories.form.buttons.update')
                    " :loading="isSubmitting" :disabled="!isValid || !isDirty" />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import { useExerciseCategory } from './useExerciseCategory'
import type { ExerciseCategory } from '@/services/exerciseCategoryService'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'

// Props
interface Props {
    /** Form mode (create/edit/view) */
    mode?: 'create' | 'edit' | 'view'
    /** Category ID (required for edit/view) */
    categoryId?: string
}

// Emits
const emit = defineEmits<{
    success: [category: ExerciseCategory]
    error: [error: Error]
    cancel: []
}>()

const props = withDefaults(defineProps<Props>(), {
    mode: 'create',
})

const loc = useLocalizationStore()

// Form composable - options passed once at setup (reactivity handled by composable internally)
const {
    formData,
    errors,
    isDirty,
    isSubmitting,
    isLoading,
    isValid,
    isReadonly,
    autoSlug,
    validateField,
    handleSubmit: submit,
    handleCancel: cancel,
    isFieldTouched,
    setFieldTouched,
} = useExerciseCategory({
    mode: props.mode,
    categoryId: props.categoryId,
    onSuccess: (category) => emit('success', category),
    onError: (error) => emit('error', error),
    onCancel: () => emit('cancel'),
})

// Computed
const formMode = computed(() => props.mode)

// Icon validation regex
const iconPattern = /^pi pi-[\w-]+$/
const isValidIcon = computed(() => {
    if (!formData.value.icon_url) return false
    return iconPattern.test(formData.value.icon_url)
})

// Event handlers
const handleBlur = async (field: keyof typeof formData.value) => {
    setFieldTouched(field)
    await validateField(field)
}

const handleSlugFocus = () => {
    // Disable auto-slug when user manually edits slug field
    if (autoSlug.value) {
        autoSlug.value = false
    }
}

const handleSubmit = async () => {
    await submit()
}

const handleCancel = () => {
    cancel()
}
</script>

<style scoped>
/* Styles handled by Tailwind classes in template */
</style>
