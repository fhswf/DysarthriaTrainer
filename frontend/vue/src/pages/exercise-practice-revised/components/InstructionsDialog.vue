<template>
    <Dialog v-model:visible="isVisible" modal :header="title" :style="{ width: '50rem' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div class="space-y-6">
            <!-- Hint Section -->
            <div v-if="instructions?.hint_text" class="animate-fade-in">
                <div class="flex items-center gap-3 mb-3">
                    <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900">
                        <i class="pi pi-lightbulb text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Hinweis</h3>
                </div>
                <p class="text-surface-700 dark:text-surface-300 leading-relaxed pl-12">
                    {{ instructions.hint_text }}
                </p>
            </div>

            <Divider v-if="instructions?.hint_text && instructions?.explanation_text" />

            <!-- Explanation Section -->
            <div v-if="instructions?.explanation_text" class="animate-fade-in">
                <div class="flex items-center gap-3 mb-3">
                    <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-900">
                        <i class="pi pi-info-circle text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Erklärung</h3>
                </div>
                <p class="text-surface-700 dark:text-surface-300 leading-relaxed pl-12 whitespace-pre-line">
                    {{ instructions.explanation_text }}
                </p>
            </div>

            <Divider v-if="instructions?.explanation_text && instructions?.preparation_text" />

            <!-- Preparation Section -->
            <div v-if="instructions?.preparation_text" class="animate-fade-in">
                <div class="flex items-center gap-3 mb-3">
                    <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 text-green-900">
                        <i class="pi pi-play-circle text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Vorbereitung</h3>
                </div>
                <p class="text-surface-700 dark:text-surface-300 leading-relaxed pl-12 whitespace-pre-line">
                    {{ instructions.preparation_text }}
                </p>
            </div>

            <!-- Empty State -->
            <div v-if="!instructions?.hint_text && !instructions?.explanation_text && !instructions?.preparation_text"
                class="text-center py-8 text-surface-500 dark:text-surface-400">
                <i class="pi pi-info-circle text-4xl mb-3"></i>
                <p>Für diese Übung sind keine zusätzlichen Anleitungen verfügbar.</p>
            </div>
        </div>

        <template #footer>
            <Button label="Schließen" icon="pi pi-times" @click="close" autofocus />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

export interface ExerciseInstruction {
    language: string;
    hint_text?: string | null;
    explanation_text?: string | null;
    preparation_text?: string | null;
}

interface Props {
    visible: boolean;
    instructions: ExerciseInstruction | null;
    title?: string;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Übungsanleitung',
});

const emit = defineEmits<Emits>();

const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
});

const close = () => {
    emit('update:visible', false);
};
</script>
