<template>
    <div class="speech-practice-content-form space-y-4">
        <!-- Text Content / Practice Text -->
        <div>
            <label for="text_content" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.speechPractice.labels.practiceText') }} *
            </label>
            <Textarea id="text_content" :model-value="content.text_content" rows="3" class="w-full"
                :class="{ 'p-invalid': errors.text_content }"
                :placeholder="loc.t('exercises.items.speechPractice.hints.practiceText')"
                @update:model-value="$emit('update:field', 'text_content', $event)" />
            <small v-if="errors.text_content" class="text-red-500">{{ errors.text_content }}</small>
            <small v-else class="text-surface-500">
                {{ loc.t('exercises.items.speechPractice.hints.practiceTextDescription') }}
            </small>
        </div>

        <!-- Phonetic Transcription -->
        <div>
            <label for="phonetic_transcription" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.speechPractice.labels.phoneticTranscription') }}
            </label>
            <InputText id="phonetic_transcription" :model-value="content.phonetic_transcription" class="w-full"
                :placeholder="loc.t('exercises.items.speechPractice.hints.phoneticTranscription')"
                @update:model-value="$emit('update:field', 'phonetic_transcription', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.items.speechPractice.hints.phoneticTranscriptionDescription') }}
            </small>
        </div>

        <!-- Difficulty -->
        <div>
            <label for="difficulty" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.speechPractice.labels.difficulty') }}
            </label>
            <InputNumber id="difficulty" :model-value="content.difficulty" :min="1" :max="10" class="w-full"
                @update:model-value="$emit('update:field', 'difficulty', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.items.speechPractice.hints.difficultyDescription') }}
            </small>
        </div>

        <!-- Audio Example -->
        <div>
            <label class="block font-semibold mb-2">
                {{ loc.t('exercises.items.speechPractice.labels.audioExample') }}
            </label>
            <div class="flex items-center gap-2">
                <InputText :model-value="content.audio_example_url" class="flex-1"
                    :placeholder="loc.t('exercises.items.speechPractice.hints.audioUrl')"
                    @update:model-value="$emit('update:field', 'audio_example_url', $event)" />
                <Button type="button" icon="pi pi-upload" :label="loc.t('common.actions.upload')" outlined
                    @click="$emit('upload-audio')" />
            </div>
            <audio v-if="content.audio_example_url" :src="content.audio_example_url" controls class="w-full mt-2" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'
import type { SpeechPracticeContent } from './exercise-editor.types'

interface Props {
    content: SpeechPracticeContent
    errors: Record<string, string>
}

interface Emits {
    (e: 'update:field', field: keyof SpeechPracticeContent, value: unknown): void
    (e: 'upload-audio'): void
}

defineProps<Props>()
defineEmits<Emits>()

const loc = useLocalizationStore()
</script>
