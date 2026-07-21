<template>
    <div class="library-item-form w-full max-w-4xl mx-auto">
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
            <!-- Basic Information Section -->
            <Fieldset :legend="loc.t('libraryItems.form.sections.basic')">
                <div class="flex flex-col gap-6">
                    <!-- Item Type -->
                    <div class="flex flex-col gap-2">
                        <label for="item-type" class="font-medium">
                            {{ loc.t('libraryItems.form.fields.itemType') }} *
                        </label>
                        <Select id="item-type" v-model="formData.item_type" :options="itemTypeOptions"
                            option-label="label" option-value="value"
                            :placeholder="loc.t('libraryItems.form.placeholders.itemType')" :disabled="isReadonly"
                            :invalid="hasFieldError('item_type')" class="w-full" @change="handleItemTypeChange"
                            @blur="handleFieldBlur('item_type')" />
                        <small v-if="hasFieldError('item_type')" class="text-red-500 min-h-5">
                            {{ errors.item_type }}
                        </small>
                    </div>

                    <!-- Display Order & Instruction ID Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Display Order -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputNumber id="display-order" v-model="formData.display_order" :disabled="isReadonly"
                                    :invalid="hasFieldError('display_order')" :min="0" :use-grouping="false"
                                    class="w-full" @input="markDirty" @blur="handleFieldBlur('display_order')" />
                                <label for="display-order">
                                    {{ loc.t('libraryItems.form.fields.displayOrder') }} *
                                </label>
                            </FloatLabel>
                            <small v-if="hasFieldError('display_order')" class="text-red-500 min-h-5">
                                {{ errors.display_order }}
                            </small>
                        </div>

                        <!-- Instruction ID -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputText id="instruction-id" v-model="formData.instruction_id" :disabled="isReadonly"
                                    :invalid="hasFieldError('instruction_id')" class="w-full" @input="markDirty"
                                    @blur="handleFieldBlur('instruction_id')" />
                                <label for="instruction-id">
                                    {{ loc.t('libraryItems.form.fields.instructionId') }}
                                </label>
                            </FloatLabel>
                            <small class="text-surface-500">
                                {{ loc.t('libraryItems.form.hints.instructionId') }}
                            </small>
                            <small v-if="hasFieldError('instruction_id')" class="text-red-500 min-h-5">
                                {{ errors.instruction_id }}
                            </small>
                        </div>
                    </div>
                </div>
            </Fieldset>

            <!-- Execution Settings Section -->
            <Fieldset :legend="loc.t('libraryItems.form.sections.execution')">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Repetitions -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputNumber id="repetitions" v-model="formData.repetitions" :disabled="isReadonly"
                                :invalid="hasFieldError('repetitions')" :min="1" :use-grouping="false" class="w-full"
                                @input="markDirty" @blur="handleFieldBlur('repetitions')" />
                            <label for="repetitions">
                                {{ loc.t('libraryItems.form.fields.repetitions') }}
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('libraryItems.form.hints.repetitions') }}
                        </small>
                        <small v-if="hasFieldError('repetitions')" class="text-red-500 min-h-5">
                            {{ errors.repetitions }}
                        </small>
                    </div>

                    <!-- Duration -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <InputNumber id="duration" v-model="formData.duration_seconds" :disabled="isReadonly"
                                :invalid="hasFieldError('duration_seconds')" :min="1" :use-grouping="false" suffix=" s"
                                class="w-full" @input="markDirty" @blur="handleFieldBlur('duration_seconds')" />
                            <label for="duration">
                                {{ loc.t('libraryItems.form.fields.duration') }}
                            </label>
                        </FloatLabel>
                        <small class="text-surface-500">
                            {{ loc.t('libraryItems.form.hints.duration') }}
                        </small>
                        <small v-if="hasFieldError('duration_seconds')" class="text-red-500 min-h-5">
                            {{ errors.duration_seconds }}
                        </small>
                    </div>
                </div>
            </Fieldset>

            <!-- Multi-Language Content Section -->
            <Fieldset :legend="loc.t('libraryItems.form.sections.content')">
                <ContentEditor v-model="formData.contents" :errors="contentErrors as Array<Record<string, string>>"
                    :touched-fields="touchedContentFields" :readonly="isReadonly" @add-content="addContentEntry"
                    @remove-content="removeContentEntry" @validate-field="validateContentField"
                    @mark-dirty="markDirty" />
            </Fieldset>

            <!-- Action Buttons -->
            <div class="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                <Button type="button" :label="loc.t('common.actions.cancel')" severity="secondary" outlined
                    @click="handleCancel" />
                <Button v-if="!isReadonly" type="submit" :label="loc.t('common.actions.save')" :loading="isSubmitting"
                    :disabled="!isValid || isSubmitting" />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { useLocalizationStore } from '@/stores/localization'
import { useLibraryItemForm } from './useLibraryItemForm'
import ContentEditor from './components/ContentEditor.vue'
import type { LibraryItemFormOptions } from './library-item.types'

interface Props {
    options?: LibraryItemFormOptions
}

const props = withDefaults(defineProps<Props>(), {
    options: () => ({}),
})

const loc = useLocalizationStore()

// Use form composable
const {
    formData,
    errors,
    contentErrors,
    isSubmitting,
    isValid,
    isReadonly,
    touchedFields,
    touchedContentFields,
    validateField,
    validateContentField,
    handleSubmit,
    handleCancel,
    markDirty,
    addContentEntry,
    removeContentEntry,
} = useLibraryItemForm(props.options)

/**
 * Item type options for dropdown
 */
const itemTypeOptions = computed(() => [
    { label: loc.t('libraryItems.itemTypes.movement'), value: 'movement' },
    { label: loc.t('libraryItems.itemTypes.speech_practice'), value: 'speech_practice' },
    { label: loc.t('libraryItems.itemTypes.information'), value: 'information' },
    { label: loc.t('libraryItems.itemTypes.minimal_pair'), value: 'minimal_pair' },
    { label: loc.t('libraryItems.itemTypes.word'), value: 'word' },
    { label: loc.t('libraryItems.itemTypes.sentence'), value: 'sentence' },
    { label: loc.t('libraryItems.itemTypes.breathing'), value: 'breathing' },
    { label: loc.t('libraryItems.itemTypes.vocalization'), value: 'vocalization' },
    { label: loc.t('libraryItems.itemTypes.articulation'), value: 'articulation' },
    { label: loc.t('libraryItems.itemTypes.rhythm'), value: 'rhythm' },
    { label: loc.t('libraryItems.itemTypes.intonation'), value: 'intonation' },
])

/**
 * Check if field has error
 */
function hasFieldError(field: keyof typeof errors.value): boolean {
    return !!(errors.value[field] && touchedFields.value.has(field))
}

/**
 * Handle field blur
 */
function handleFieldBlur(field: keyof typeof errors.value) {
    void validateField(field)
}

/**
 * Handle item type change
 */
function handleItemTypeChange() {
    void validateField('item_type')
    markDirty()
}
</script>
