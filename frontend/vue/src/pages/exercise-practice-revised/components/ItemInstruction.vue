<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import type { ExerciseInstructions } from '@/types/exercise';

/**
 * ItemInstruction Component
 * 
 * Displays exercise instructions in a collapsible section.
 * Shows hint text and explanation text with optional "Verstanden" button.
 */

interface Props {
    instruction: ExerciseInstructions | null;
    initiallyExpanded?: boolean;
    emptyMessage?: string;
}

interface Emits {
    (e: 'understood'): void;
    (e: 'toggle-collapsed', collapsed: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
    initiallyExpanded: true,
    emptyMessage: 'Für diese Übung ist keine Anleitung verfügbar.'
});

const emit = defineEmits<Emits>();

const isCollapsed = ref(false);

// Initialize collapsed state after props are reactive
watchEffect(() => {
    if (props.initiallyExpanded !== undefined) {
        isCollapsed.value = !props.initiallyExpanded;
    }
});

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    emit('toggle-collapsed', isCollapsed.value);
};

const handleUnderstood = () => {
    emit('understood');
};

const hasContent = computed(() => {
    return props.instruction && (
        props.instruction.hint_text ??
        props.instruction.explanation_text ??
        props.instruction.safety_notes
    );
});

const headerText = computed(() => {
    return hasContent.value ? 'Anleitung' : '(Keine Anleitung)';
});
</script>

<template>
    <div class="item-instruction border rounded-lg overflow-hidden">
        <!-- Collapsible Header -->
        <button type="button"
            class="instruction-header w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
            @click="toggleCollapse" :aria-expanded="!isCollapsed" aria-controls="instruction-content">
            <span class="font-semibold text-lg">{{ headerText }}</span>
            <span class="chevron text-xl" :class="{ 'rotated': !isCollapsed }">▶</span>
        </button>

        <!-- Instruction Content -->
        <div v-if="!isCollapsed" id="instruction-content" class="instruction-content p-4 space-y-3">
            <template v-if="hasContent">
                <!-- Hint Text (colored background) -->
                <div v-if="instruction?.hint_text" class="hint-text p-3 rounded bg-blue-50 border-l-4 border-blue-400">
                    <p class="text-sm">{{ instruction.hint_text }}</p>
                </div>

                <!-- Explanation Text -->
                <div v-if="instruction?.explanation_text" class="explanation-text">
                    <p>{{ instruction.explanation_text }}</p>
                </div>

                <!-- Safety Notes -->
                <div v-if="instruction?.safety_notes"
                    class="safety-notes p-3 rounded bg-yellow-50 border-l-4 border-yellow-400">
                    <p class="text-sm font-medium">⚠️ Sicherheitshinweis:</p>
                    <p class="text-sm mt-1">{{ instruction.safety_notes }}</p>
                </div>

                <!-- Verstanden Button -->
                <div class="flex justify-end mt-4">
                    <button type="button"
                        class="understood-btn px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                        @click="handleUnderstood">
                        <span>✓</span>
                        <span>Verstanden</span>
                    </button>
                </div>
            </template>

            <!-- Empty State -->
            <template v-else>
                <div class="empty-state text-gray-500 text-center py-4">
                    <p>{{ emptyMessage }}</p>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.chevron {
    display: inline-block;
    transition: transform 0.3s ease;
}

.chevron.rotated {
    transform: rotate(90deg);
}

.instruction-header {
    cursor: pointer;
    user-select: none;
}

.instruction-content {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
