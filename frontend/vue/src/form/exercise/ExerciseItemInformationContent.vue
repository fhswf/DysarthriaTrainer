<template>
    <div class="information-content-form space-y-4">
        <!-- Text Content -->
        <div>
            <label for="text_content" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.information.labels.informationText') }} *
            </label>
            <Textarea id="text_content" :model-value="content.text_content" rows="5" class="w-full"
                :class="{ 'p-invalid': errors.text_content }"
                :placeholder="loc.t('exercises.items.information.hints.informationText')"
                @update:model-value="$emit('update:field', 'text_content', $event)" />
            <small v-if="errors.text_content" class="text-red-500">{{ errors.text_content }}</small>
            <small v-else class="text-surface-500">
                {{ loc.t('exercises.items.information.hints.informationTextDescription') }}
            </small>
        </div>

        <!-- Info Type -->
        <div>
            <label for="info_type" class="block font-semibold mb-2">
                {{ loc.t('exercises.items.information.labels.infoType') }} *
            </label>
            <Select id="info_type" :model-value="content.info_type" :options="infoTypeOptions" option-label="label"
                option-value="value" class="w-full" @update:model-value="$emit('update:field', 'info_type', $event)" />
            <small class="text-surface-500">
                {{ loc.t('exercises.items.information.hints.infoTypeDescription') }}
            </small>
        </div>

        <!-- Image -->
        <div>
            <label class="block font-semibold mb-2">
                {{ loc.t('exercises.items.information.labels.image') }}
            </label>
            <div class="flex items-center gap-2">
                <InputText :model-value="content.image_url" class="flex-1"
                    :placeholder="loc.t('exercises.items.information.hints.imageUrl')"
                    @update:model-value="$emit('update:field', 'image_url', $event)" />
                <Button type="button" icon="pi pi-upload" :label="loc.t('common.actions.upload')" outlined
                    @click="$emit('upload-image')" />
            </div>
            <img v-if="content.image_url" :src="content.image_url"
                :alt="loc.t('exercises.items.information.labels.image')" class="w-full max-w-md mt-2 rounded border" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import type { InformationContent } from './exercise-editor.types'

interface Props {
    content: InformationContent
    errors: Record<string, string>
}

interface Emits {
    (e: 'update:field', field: keyof InformationContent, value: unknown): void
    (e: 'upload-image'): void
}

defineProps<Props>()
defineEmits<Emits>()

const loc = useLocalizationStore()

const infoTypeOptions = computed(() => [
    {
        label: loc.t('exercises.items.information.infoTypes.tip'),
        value: 'tip',
    },
    {
        label: loc.t('exercises.items.information.infoTypes.warning'),
        value: 'warning',
    },
    {
        label: loc.t('exercises.items.information.infoTypes.note'),
        value: 'note',
    },
])
</script>
