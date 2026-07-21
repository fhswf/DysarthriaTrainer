<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import type { ItemContent } from '@/types/exercise';

/**
 * ItemContentDisplay Component
 * 
 * Displays exercise content in a collapsible section.
 * Shows text content, optional background image, and video toggle button.
 */

interface Props {
    content: ItemContent[];
    initiallyExpanded?: boolean;
}

interface Emits {
    (e: 'toggle', collapsed: boolean): void;
    (e: 'video-show', contentId: string): void;
    (e: 'video-hide'): void;
}

const props = withDefaults(defineProps<Props>(), {
    initiallyExpanded: false
});

const emit = defineEmits<Emits>();

const isCollapsed = ref(false);
const currentContentIndex = ref(0);

// Initialize collapsed state after props are reactive
watchEffect(() => {
    if (props.initiallyExpanded !== undefined) {
        isCollapsed.value = !props.initiallyExpanded;
    }
});

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    emit('toggle', isCollapsed.value);
};

const currentContent = computed(() => {
    return props.content[currentContentIndex.value] || null;
});

const hasMultipleContents = computed(() => {
    return props.content.length > 1;
});

const backgroundImageStyle = computed(() => {
    if (currentContent.value?.image_url) {
        return {
            backgroundImage: `url(${currentContent.value.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        };
    }
    return {};
});

const hasVideo = computed(() => {
    return currentContent.value?.demonstration_video_url !== null;
});

const toggleVideo = () => {
    if (hasVideo.value && currentContent.value) {
        emit('video-show', currentContent.value.id);
    }
};

const nextContent = () => {
    if (currentContentIndex.value < props.content.length - 1) {
        currentContentIndex.value++;
    }
};

const previousContent = () => {
    if (currentContentIndex.value > 0) {
        currentContentIndex.value--;
    }
};
</script>

<template>
    <div class="item-content-display border rounded-lg overflow-hidden">
        <!-- Collapsible Header -->
        <button type="button"
            class="content-header w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
            @click="toggleCollapse" :aria-expanded="!isCollapsed" aria-controls="content-display">
            <span class="font-semibold text-lg">Übungsinhalt</span>
            <span class="chevron text-xl" :class="{ 'rotated': !isCollapsed }">▶</span>
        </button>

        <!-- Content Display -->
        <div v-if="!isCollapsed" id="content-display" class="content-body overflow-y-auto"
            :style="backgroundImageStyle">
            <div class="content-overlay p-6">
                <!-- Text Content (centered) -->
                <div v-if="currentContent?.text_content" class="text-content text-center mb-4">
                    <p class="text-lg">{{ currentContent.text_content }}</p>
                </div>

                <!-- Phonetic Transcription -->
                <div v-if="currentContent?.phonetic_transcription" class="phonetic text-center text-gray-600 mb-4">
                    <p class="font-mono">{{ currentContent.phonetic_transcription }}</p>
                </div>

                <!-- Video Toggle Button (Placeholder) -->
                <div v-if="hasVideo" class="video-control flex justify-center mt-4">
                    <button type="button"
                        class="video-btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                        @click="toggleVideo">
                        <span>📹</span>
                        <span>Video anzeigen</span>
                    </button>
                </div>

                <!-- Multi-Content Navigation -->
                <div v-if="hasMultipleContents"
                    class="content-navigation flex justify-between items-center mt-6 pt-4 border-t">
                    <button type="button"
                        class="nav-btn px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="currentContentIndex === 0" @click="previousContent">
                        ← Vorherige
                    </button>
                    <span class="text-sm text-gray-600">
                        {{ currentContentIndex + 1 }} / {{ content.length }}
                    </span>
                    <button type="button"
                        class="nav-btn px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="currentContentIndex === content.length - 1" @click="nextContent">
                        Nächste →
                    </button>
                </div>
            </div>
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

.content-header {
    cursor: pointer;
    user-select: none;
}

.content-body {
    max-height: 60vh;
    min-height: 200px;
}

.content-overlay {
    /* Semi-transparent background for better text readability over images */
    background-color: rgba(255, 255, 255, 0.95);
    min-height: 100%;
}

.text-content {
    font-size: 1.125rem;
    line-height: 1.75;
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

.content-body {
    animation: slideDown 0.3s ease-out;
}
</style>
