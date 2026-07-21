<template>
    <div class="content-editor">
        <!-- Language Tabs -->
        <TabView v-model:activeIndex="activeTabIndex" @tab-change="handleTabChange">
            <TabPanel v-for="(content, index) in modelValue" :key="`content-${index}`" :value="index"
                :header="getLanguageLabel(content.language)" :closable="modelValue.length > 1"
                @close="handleRemoveContent(index)">
                <div class="flex flex-col gap-6">
                    <!-- Language Selection -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <Select :id="`language-${index}`" v-model="content.language" :options="languageOptions"
                                option-label="label" option-value="value" :disabled="readonly"
                                :invalid="hasError(index, 'language')" class="w-full"
                                @change="handleLanguageChange(index)" @blur="handleBlur(index, 'language')" />
                            <label :for="`language-${index}`">
                                {{ loc.t('libraryItems.form.fields.language') }} *
                            </label>
                        </FloatLabel>
                        <small v-if="hasError(index, 'language')" class="text-red-500 min-h-5">
                            {{ getError(index, 'language') }}
                        </small>
                    </div>

                    <!-- Text Content -->
                    <div class="flex flex-col gap-2">
                        <FloatLabel variant="on">
                            <Textarea :id="`text-content-${index}`" v-model="content.text_content" :disabled="readonly"
                                :invalid="hasError(index, 'text_content')" rows="5" class="w-full"
                                @input="handleInput(index)" @blur="handleBlur(index, 'text_content')" />
                            <label :for="`text-content-${index}`">
                                {{ loc.t('libraryItems.form.fields.textContent') }} *
                            </label>
                        </FloatLabel>
                        <small v-if="hasError(index, 'text_content')" class="text-red-500 min-h-5">
                            {{ getError(index, 'text_content') }}
                        </small>
                    </div>

                    <!-- Media URLs Row -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputText :id="`audio-url-${index}`" v-model="content.audio_file_url"
                                    :disabled="readonly" :invalid="hasError(index, 'audio_file_url')" class="w-full"
                                    @input="handleInput(index)" @blur="handleBlur(index, 'audio_file_url')" />
                                <label :for="`audio-url-${index}`">
                                    {{ loc.t('libraryItems.form.fields.audioUrl') }}
                                </label>
                            </FloatLabel>
                            <small v-if="hasError(index, 'audio_file_url')" class="text-red-500 min-h-5">
                                {{ getError(index, 'audio_file_url') }}
                            </small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputText :id="`video-url-${index}`" v-model="content.video_file_url"
                                    :disabled="readonly" :invalid="hasError(index, 'video_file_url')" class="w-full"
                                    @input="handleInput(index)" @blur="handleBlur(index, 'video_file_url')" />
                                <label :for="`video-url-${index}`">
                                    {{ loc.t('libraryItems.form.fields.videoUrl') }}
                                </label>
                            </FloatLabel>
                            <small v-if="hasError(index, 'video_file_url')" class="text-red-500 min-h-5">
                                {{ getError(index, 'video_file_url') }}
                            </small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputText :id="`image-url-${index}`" v-model="content.image_file_url"
                                    :disabled="readonly" :invalid="hasError(index, 'image_file_url')" class="w-full"
                                    @input="handleInput(index)" @blur="handleBlur(index, 'image_file_url')" />
                                <label :for="`image-url-${index}`">
                                    {{ loc.t('libraryItems.form.fields.imageUrl') }}
                                </label>
                            </FloatLabel>
                            <small v-if="hasError(index, 'image_file_url')" class="text-red-500 min-h-5">
                                {{ getError(index, 'image_file_url') }}
                            </small>
                        </div>
                    </div>

                    <!-- Additional Fields Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Phonetic Transcription -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <InputText :id="`phonetic-${index}`" v-model="content.phonetic_transcription"
                                    :disabled="readonly" :invalid="hasError(index, 'phonetic_transcription')"
                                    class="w-full" @input="handleInput(index)"
                                    @blur="handleBlur(index, 'phonetic_transcription')" />
                                <label :for="`phonetic-${index}`">
                                    {{ loc.t('libraryItems.form.fields.phoneticTranscription') }}
                                </label>
                            </FloatLabel>
                            <small v-if="hasError(index, 'phonetic_transcription')" class="text-red-500 min-h-5">
                                {{ getError(index, 'phonetic_transcription') }}
                            </small>
                        </div>

                        <!-- Difficulty Notes -->
                        <div class="flex flex-col gap-2">
                            <FloatLabel variant="on">
                                <Textarea :id="`difficulty-${index}`" v-model="content.difficulty_notes"
                                    :disabled="readonly" :invalid="hasError(index, 'difficulty_notes')" rows="3"
                                    class="w-full" @input="handleInput(index)"
                                    @blur="handleBlur(index, 'difficulty_notes')" />
                                <label :for="`difficulty-${index}`">
                                    {{ loc.t('libraryItems.form.fields.difficultyNotes') }}
                                </label>
                            </FloatLabel>
                            <small v-if="hasError(index, 'difficulty_notes')" class="text-red-500 min-h-5">
                                {{ getError(index, 'difficulty_notes') }}
                            </small>
                        </div>
                    </div>
                </div>
            </TabPanel>
        </TabView>

        <!-- Add Language Button -->
        <div v-if="!readonly" class="mt-4">
            <Button :label="loc.t('libraryItems.actions.addLanguage')" icon="pi pi-plus" severity="secondary" outlined
                @click="handleAddContent" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Textarea from 'primevue/textarea'
import { useLocalizationStore } from '@/stores/localization'
import type { LibraryItemContentFormData } from '@/forms/library-item/library-item.types'

interface Props {
    modelValue: LibraryItemContentFormData[]
    errors?: Array<Record<string, string>>
    touchedFields?: Array<Set<string>>
    readonly?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: LibraryItemContentFormData[]): void
    (e: 'add-content'): void
    (e: 'remove-content', index: number): void
    (e: 'validate-field', contentIndex: number, field: string): void
    (e: 'mark-dirty'): void
}

const props = withDefaults(defineProps<Props>(), {
    errors: () => [],
    touchedFields: () => [],
    readonly: false,
})

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()
const activeTabIndex = ref(0)

/**
 * Language options for dropdown
 */
const languageOptions = computed(() => [
    { label: loc.t('libraryItems.languages.de'), value: 'de' },
    { label: loc.t('libraryItems.languages.en'), value: 'en' },
    { label: loc.t('libraryItems.languages.fr'), value: 'fr' },
    { label: loc.t('libraryItems.languages.es'), value: 'es' },
    { label: loc.t('libraryItems.languages.it'), value: 'it' },
])

/**
 * Get label for language code
 */
function getLanguageLabel(language: string): string {
    if (!language) return loc.t('libraryItems.form.labels.newLanguage')
    return loc.t(`libraryItems.languages.${language}`) || language.toUpperCase()
}

/**
 * Check if field has error
 */
function hasError(contentIndex: number, field: string): boolean {
    return !!(
        props.errors[contentIndex]?.[field] && props.touchedFields[contentIndex]?.has(field)
    )
}

/**
 * Get error message for field
 */
function getError(contentIndex: number, field: string): string {
    return props.errors[contentIndex]?.[field] || ''
}

/**
 * Handle tab change
 */
function handleTabChange(event: { index: number }) {
    activeTabIndex.value = event.index
}

/**
 * Handle input changes
 */
function handleInput(_contentIndex: number) {
    emit('mark-dirty')
}

/**
 * Handle field blur
 */
function handleBlur(contentIndex: number, field: string) {
    emit('validate-field', contentIndex, field)
}

/**
 * Handle language change
 */
function handleLanguageChange(contentIndex: number) {
    emit('validate-field', contentIndex, 'language')
    emit('mark-dirty')
}

/**
 * Handle add content
 */
function handleAddContent() {
    emit('add-content')
    // Switch to new tab after short delay
    setTimeout(() => {
        activeTabIndex.value = props.modelValue.length - 1
    }, 100)
}

/**
 * Handle remove content
 */
function handleRemoveContent(index: number) {
    emit('remove-content', index)
    // Adjust active tab if needed
    if (activeTabIndex.value >= props.modelValue.length - 1) {
        activeTabIndex.value = Math.max(0, props.modelValue.length - 2)
    }
}
</script>

<style scoped>
.content-editor {
    width: 100%;
}
</style>
