<template>
    <div class="flex flex-col gap-4">
        <!-- Current Item Display -->
        <Card v-if="currentItem" class="w-full">
            <template #content>
                <div class="flex flex-col gap-4">
                    <!-- Item Header -->
                    <div class="flex items-center justify-between">
                        <Badge
                            :value="loc.t('session.progress.currentItem', { current: currentIndex + 1, total: totalItems })"
                            severity="info" size="large" />
                        <Badge v-if="currentItem.repeatCount > 1"
                            :value="loc.t('session.progress.iteration', { current: currentIteration, total: currentItem.repeatCount })"
                            severity="secondary" />
                    </div>

                    <!-- Item Text -->
                    <div class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {{ currentItem.text }}
                        </p>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="flex items-center justify-between gap-4">
                        <!-- Previous Button -->
                        <Button :label="loc.t('session.navigation.previous')" icon="pi pi-chevron-left"
                            :disabled="!canGoBack" @click="handlePrevious" severity="secondary" outlined
                            class="flex-1" />

                        <!-- Next/Complete Button -->
                        <Button v-if="!isLastItem" :label="loc.t('session.navigation.next')" icon="pi pi-chevron-right"
                            icon-pos="right" :disabled="!canGoNext" @click="handleNext" class="flex-1" />
                        <Button v-else :label="loc.t('session.actions.markComplete')" icon="pi pi-check"
                            icon-pos="right" :disabled="!canGoNext" @click="handleComplete" severity="success"
                            class="flex-1" />
                    </div>

                    <!-- Navigation Info -->
                    <div v-if="!canGoNext && !isComplete"
                        class="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                        <i class="pi pi-info-circle" />
                        <span>{{ loc.t('session.navigation.cannotGoNext') }}</span>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Quick Jump (Optional) -->
        <Card v-if="showQuickJump && exerciseItems.length > 1" class="w-full">
            <template #title>
                <span class="text-base">{{ loc.t('session.items.total', { count: exerciseItems.length }) }}</span>
            </template>
            <template #content>
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    <button v-for="(item, index) in exerciseItems" :key="item.id" @click="handleJumpTo(index)"
                        class="aspect-square flex items-center justify-center rounded-lg border-2 transition-all font-medium text-sm"
                        :class="{
                            'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': index === currentIndex,
                            'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100': isItemCompleted(item.id) && index !== currentIndex,
                            'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800': !isItemCompleted(item.id) && index !== currentIndex,
                        }" :disabled="index === currentIndex">
                        <i v-if="isItemCompleted(item.id)" class="pi pi-check" />
                        <span v-else>{{ index + 1 }}</span>
                    </button>
                </div>
            </template>
        </Card>

        <!-- Keyboard Shortcuts Info -->
        <div v-if="showKeyboardShortcuts"
            class="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-2">
                <kbd
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">←</kbd>
                <span>{{ loc.t('session.navigation.previous') }}</span>
            </div>
            <div class="flex items-center gap-2">
                <kbd
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">→</kbd>
                <span>{{ loc.t('session.navigation.next') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import { useLocalizationStore } from '@/stores/localization'
import { usePracticeSessionStore } from '@/stores/practiceSession'

interface ItemNavigationProps {
    /** Show quick jump grid */
    showQuickJump?: boolean
    /** Show keyboard shortcuts info */
    showKeyboardShortcuts?: boolean
    /** Enable keyboard navigation */
    enableKeyboard?: boolean
}

interface ItemNavigationEmits {
    /** Emitted when navigating to next item */
    (e: 'next'): void
    /** Emitted when navigating to previous item */
    (e: 'previous'): void
    /** Emitted when jumping to specific item */
    (e: 'jump', index: number): void
    /** Emitted when marking item as complete */
    (e: 'complete'): void
}

const props = withDefaults(defineProps<ItemNavigationProps>(), {
    showQuickJump: true,
    showKeyboardShortcuts: true,
    enableKeyboard: true,
})

const emit = defineEmits<ItemNavigationEmits>()

// Services
const loc = useLocalizationStore()
const sessionStore = usePracticeSessionStore()

// Computed from store
const currentItem = computed(() => sessionStore.currentItem)
const currentIndex = computed(() => sessionStore.currentItemIndex)
const currentIteration = computed(() => sessionStore.currentIteration)
const exerciseItems = computed(() => sessionStore.exerciseItems)
const totalItems = computed(() => sessionStore.totalItems)
const canGoBack = computed(() => sessionStore.canNavigateBack)
const canGoNext = computed(() => sessionStore.canNavigateNext)
const isLastItem = computed(() => sessionStore.isLastItem)
const isComplete = computed(() => {
    return sessionStore.completedItemsCount >= sessionStore.totalItems
})

// Methods
function handlePrevious() {
    if (!canGoBack.value) return
    sessionStore.previousItem()
    emit('previous')
}

function handleNext() {
    if (!canGoNext.value) return
    sessionStore.nextItem()
    emit('next')
}

function handleJumpTo(index: number) {
    if (index === currentIndex.value) return
    sessionStore.goToItem(index)
    emit('jump', index)
}

function handleComplete() {
    emit('complete')
}

function isItemCompleted(itemId: string): boolean {
    return sessionStore.completedItemIds.has(itemId)
}

// Keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
    if (!props.enableKeyboard) return

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault()
            handlePrevious()
            break
        case 'ArrowRight':
            event.preventDefault()
            if (canGoNext.value) {
                if (isLastItem.value) {
                    handleComplete()
                } else {
                    handleNext()
                }
            }
            break
    }
}

// Lifecycle
onMounted(() => {
    if (props.enableKeyboard) {
        window.addEventListener('keydown', handleKeyDown)
    }
})

onUnmounted(() => {
    if (props.enableKeyboard) {
        window.removeEventListener('keydown', handleKeyDown)
    }
})
</script>

<style scoped>
kbd {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.75rem;
}
</style>
