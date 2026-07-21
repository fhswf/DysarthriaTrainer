<template>
    <Dialog :visible="visible" :header="dialogTitle" modal closable :draggable="false" class="w-full max-w-4xl"
        @update:visible="$emit('update:visible', $event)">
        <!-- Item Type Selection (only in create mode) -->
        <div v-if="!item" class="mb-6">
            <label for="item_type" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.labels.itemType') }} *
            </label>
            <Select id="item_type" v-model="localFormData.item_type" :options="itemTypeOptions" option-label="label"
                option-value="value" class="w-full" :class="{ 'p-invalid': errors.item_type }"
                @change="handleItemTypeChange" />
            <small v-if="errors.item_type" class="text-red-500">{{ errors.item_type }}</small>
        </div>

        <!-- Generic Item Fields -->
        <Fieldset :legend="loc.t('exercises.items.sections.generic')" class="mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Display Order -->
                <div>
                    <label for="display_order" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.displayOrder') }} *
                    </label>
                    <InputNumber id="display_order" v-model="localFormData.display_order" :min="0" class="w-full"
                        :class="{ 'p-invalid': errors.display_order }" />
                    <small v-if="errors.display_order" class="text-red-500">{{ errors.display_order }}</small>
                </div>

                <!-- Repetitions -->
                <div>
                    <label for="repetitions" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.repetitions') }}
                    </label>
                    <InputNumber id="repetitions" v-model="localFormData.repetitions" :min="1" :max="100" class="w-full"
                        :placeholder="loc.t('exercises.items.hints.repetitions')" />
                </div>

                <!-- Target Phoneme -->
                <div>
                    <label for="target_phoneme" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.targetPhoneme') }}
                    </label>
                    <InputText id="target_phoneme" v-model="localFormData.target_phoneme" class="w-full"
                        :placeholder="loc.t('exercises.items.hints.targetPhoneme')" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                <!-- Language -->
                <div>
                    <label for="language" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.language') }} *
                    </label>
                    <Select id="language" v-model="localFormData.content.language" :options="languageOptions"
                        option-label="label" option-value="value" class="w-full"
                        :class="{ 'p-invalid': contentErrors.language }" />
                    <small v-if="contentErrors.language" class="text-red-500">{{ contentErrors.language }}</small>
                </div>
            </div>
        </Fieldset>

        <!-- Content Fields -->
        <Fieldset :legend="loc.t('exercises.items.sections.content')" class="mb-6">
            <div class="space-y-4">
                <!-- Text Content -->
                <div>
                    <label for="text_content" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.textContent') }} *
                    </label>
                    <Textarea id="text_content" v-model="localFormData.content.text_content" rows="3" class="w-full"
                        :class="{ 'p-invalid': contentErrors.text_content }"
                        :placeholder="loc.t('exercises.items.hints.textContent')" />
                    <small v-if="contentErrors.text_content" class="text-red-500">{{ contentErrors.text_content
                        }}</small>
                </div>

                <!-- Phonetic Transcription -->
                <div>
                    <label for="phonetic_transcription" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.phoneticTranscription') }}
                    </label>
                    <InputText id="phonetic_transcription" v-model="localFormData.content.phonetic_transcription"
                        class="w-full" :placeholder="loc.t('exercises.items.hints.phoneticTranscription')" />
                </div>

                <!-- Media URLs -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="audio_file_url" class="block font-semibold mb-2">
                            {{ loc.t('exercises.items.labels.audioFileUrl') }}
                        </label>
                        <InputText id="audio_file_url" v-model="localFormData.content.audio_file_url" class="w-full"
                            :placeholder="loc.t('exercises.items.hints.audioFileUrl')" />
                    </div>

                    <div>
                        <label for="demonstration_video_url" class="block font-semibold mb-2">
                            {{ loc.t('exercises.items.labels.demonstrationVideoUrl') }}
                        </label>
                        <InputText id="demonstration_video_url" v-model="localFormData.content.demonstration_video_url"
                            class="w-full" :placeholder="loc.t('exercises.items.hints.demonstrationVideoUrl')" />
                    </div>

                    <div>
                        <label for="visual_cue_image_url" class="block font-semibold mb-2">
                            {{ loc.t('exercises.items.labels.visualCueImageUrl') }}
                        </label>
                        <InputText id="visual_cue_image_url" v-model="localFormData.content.visual_cue_image_url"
                            class="w-full" :placeholder="loc.t('exercises.items.hints.visualCueImageUrl')" />
                    </div>
                </div>

                <!-- Difficulty Notes -->
                <div>
                    <label for="difficulty_notes" class="block font-semibold mb-2">
                        {{ loc.t('exercises.items.labels.difficultyNotes') }}
                    </label>
                    <Textarea id="difficulty_notes" v-model="localFormData.content.difficulty_notes" rows="2"
                        class="w-full" :placeholder="loc.t('exercises.items.hints.difficultyNotes')" />
                </div>
            </div>
        </Fieldset>

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
import type {
    ExerciseItemFormData,
    ExerciseItemType,
} from './exercise-editor.types'
import { createEmptyItem } from './exercise-editor.types'

interface Props {
    visible: boolean
    item: ExerciseItemFormData | null
    saving?: boolean
}

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'save', data: ExerciseItemFormData): void
}

const props = withDefaults(defineProps<Props>(), {
    saving: false,
})

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const localFormData = ref<ExerciseItemFormData>(createEmptyItem('word', 0))
const errors = ref<Partial<Record<keyof ExerciseItemFormData, string>>>({})
const contentErrors = ref<Record<string, string>>({})

const dialogTitle = computed(() =>
    props.item
        ? loc.t('exercises.items.dialog.titleEdit')
        : loc.t('exercises.items.dialog.titleCreate')
)

const languageOptions = computed(() => [
    { label: loc.t('languages.de'), value: 'de' },
    { label: loc.t('languages.en'), value: 'en' },
])

const itemTypeOptions = computed(() => [
    {
        label: loc.t('exercises.items.types.minimalPair'),
        value: 'minimal_pair',
    },
    {
        label: loc.t('exercises.items.types.word'),
        value: 'word',
    },
    {
        label: loc.t('exercises.items.types.sentence'),
        value: 'sentence',
    },
    {
        label: loc.t('exercises.items.types.breathing'),
        value: 'breathing',
    },
    {
        label: loc.t('exercises.items.types.vocalization'),
        value: 'vocalization',
    },
    {
        label: loc.t('exercises.items.types.articulation'),
        value: 'articulation',
    },
    {
        label: loc.t('exercises.items.types.rhythm'),
        value: 'rhythm',
    },
    {
        label: loc.t('exercises.items.types.intonation'),
        value: 'intonation',
    },
    {
        label: loc.t('exercises.items.types.movement'),
        value: 'movement',
    },
    {
        label: loc.t('exercises.items.types.information'),
        value: 'information',
    },
])

watch(
    () => props.item,
    (newItem) => {
        if (newItem) {
            // Deep clone to prevent mutations affecting the original item
            localFormData.value = JSON.parse(JSON.stringify(newItem))
        } else {
            localFormData.value = createEmptyItem('word', 0)
        }
        errors.value = {}
        contentErrors.value = {}
    },
    { immediate: true }
)

watch(
    () => props.visible,
    (isVisible) => {
        if (!isVisible) {
            errors.value = {}
            contentErrors.value = {}
        }
    }
)

const handleItemTypeChange = () => {
    // Reset content when type changes
    const newItem = createEmptyItem(localFormData.value.item_type, localFormData.value.display_order)
    localFormData.value.content = newItem.content
    contentErrors.value = {}
}

const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExerciseItemFormData, string>> = {}
    const newContentErrors: Record<string, string> = {}

    if (!localFormData.value.item_type) {
        newErrors.item_type = loc.t('exercises.items.errors.itemTypeRequired')
    }

    if (localFormData.value.display_order < 0) {
        newErrors.display_order = loc.t('exercises.items.errors.displayOrderInvalid')
    }

    // Validate content fields
    const content = localFormData.value.content
    if (!content.language) {
        newContentErrors.language = loc.t('exercises.items.errors.languageRequired')
    }

    if (!content.text_content?.trim()) {
        newContentErrors.text_content = loc.t('exercises.items.errors.textContentRequired')
    }

    errors.value = newErrors
    contentErrors.value = newContentErrors
    return Object.keys(newErrors).length === 0 && Object.keys(newContentErrors).length === 0
}

const handleSave = () => {
    if (validateForm()) {
        emit('save', localFormData.value)
    }
}

const handleCancel = () => {
    emit('update:visible', false)
}
</script>
