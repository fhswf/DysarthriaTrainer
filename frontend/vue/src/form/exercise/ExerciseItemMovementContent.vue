<template>
    <div class="movement-content-form space-y-4">
        <!-- Text Content / Instruction -->
        <div>
            <label for="text_content" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.movement.labels.instruction') }} *
            </label>
            <Textarea id="text_content" :model-value="content.text_content" rows="4" class="w-full"
                :class="{ 'p-invalid': errors.text_content }"
                :placeholder="loc.t('exercises.items.movement.hints.instruction')"
                @update:model-value="$emit('update:field', 'text_content', $event)" />
            <small v-if="errors.text_content" class="text-red-500">{{ errors.text_content }}</small>
            <small v-else class="text-surface-500">
                {{ loc.t('exercises.items.movement.hints.instructionDescription') }}
            </small>
        </div>

        <!-- Demonstration Video -->
        <div>
            <label class="block font-semibold mb-2">
                {{ loc.t('exercises.items.movement.labels.demonstrationVideo') }}
            </label>
            <div class="flex items-center gap-2">
                <InputText :model-value="content.demonstration_video_url" class="flex-1"
                    :placeholder="loc.t('exercises.items.movement.hints.videoUrl')"
                    @update:model-value="$emit('update:field', 'demonstration_video_url', $event)" />
                <Button type="button" icon="pi pi-upload" :label="loc.t('common.actions.upload')" outlined
                    @click="$emit('upload-video')" />
            </div>
            <video v-if="content.demonstration_video_url" :src="content.demonstration_video_url" controls
                class="w-full max-w-md mt-2 rounded border" />
        </div>

        <!-- Image -->
        <div>
            <label class="block font-semibold mb-2">
                {{ loc.t('exercises.items.movement.labels.image') }}
            </label>
            <div class="flex items-center gap-2">
                <InputText :model-value="content.image_url" class="flex-1"
                    :placeholder="loc.t('exercises.items.movement.hints.imageUrl')"
                    @update:model-value="$emit('update:field', 'image_url', $event)" />
                <Button type="button" icon="pi pi-upload" :label="loc.t('common.actions.upload')" outlined
                    @click="$emit('upload-image')" />
            </div>
            <img v-if="content.image_url" :src="content.image_url" :alt="loc.t('exercises.items.movement.labels.image')"
                class="w-full max-w-md mt-2 rounded border" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useLocalizationStore } from '@/stores/localization'
import type { MovementContent } from './exercise-editor.types'

interface Props {
    content: MovementContent
    errors: Record<string, string>
}

interface Emits {
    (e: 'update:field', field: keyof MovementContent, value: unknown): void
    (e: 'upload-video'): void
    (e: 'upload-image'): void
}

defineProps<Props>()
defineEmits<Emits>()

const loc = useLocalizationStore()
</script>
