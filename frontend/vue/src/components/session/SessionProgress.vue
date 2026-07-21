<template>
    <Card class="w-full">
        <template #title>
            <div class="flex items-center justify-between">
                <span>{{ loc.t('session.progress.title') }}</span>
                <Badge :value="progressPercentage + '%'" :severity="progressSeverity" size="large" />
            </div>
        </template>

        <template #content>
            <div class="flex flex-col gap-6">
                <!-- Progress Bar -->
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{{ loc.t('session.progress.items', { completed: completedCount, total: totalCount })
                            }}</span>
                        <span>{{ loc.t('session.progress.percentage', { percentage: progressPercentage }) }}</span>
                    </div>
                    <ProgressBar :value="progressPercentage" :show-value="false" class="h-3" />
                </div>

                <!-- Current Item Info -->
                <div v-if="currentItem"
                    class="flex flex-col gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {{ loc.t('session.items.current') }}
                        </span>
                        <Badge
                            :value="loc.t('session.progress.currentItem', { current: currentIndex + 1, total: totalCount })"
                            severity="info" />
                    </div>

                    <!-- Item Text -->
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ currentItem.text }}
                    </div>

                    <!-- Iteration Counter -->
                    <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <i class="pi pi-refresh" />
                        <span>{{ loc.t('session.progress.iteration', {
                            current: currentIteration, total:
                            currentItem.repeatCount }) }}</span>
                    </div>
                </div>

                <!-- Session Stats -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Total Items -->
                    <div class="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {{ loc.t('session.items.total', { count: totalItems }) }}
                        </span>
                        <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {{ totalItems }}
                        </span>
                    </div>

                    <!-- Completed -->
                    <div class="flex flex-col gap-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span class="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
                            {{ loc.t('session.items.completed') }}
                        </span>
                        <span class="text-2xl font-bold text-green-700 dark:text-green-300">
                            {{ completedCount }}
                        </span>
                    </div>

                    <!-- Duration -->
                    <div class="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {{ loc.t('session.timing.duration') }}
                        </span>
                        <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {{ formattedDuration }}
                        </span>
                    </div>

                    <!-- Remaining -->
                    <div class="flex flex-col gap-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span class="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            {{ loc.t('session.items.remaining', { count: remainingCount }) }}
                        </span>
                        <span class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {{ remainingCount }}
                        </span>
                    </div>
                </div>

                <!-- Item List (Optional) -->
                <div v-if="showItemList && exerciseItems.length > 0" class="flex flex-col gap-2">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ loc.t('session.items.total', { count: exerciseItems.length }) }}
                    </div>
                    <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                        <div v-for="(item, index) in exerciseItems" :key="item.id"
                            class="flex items-center gap-3 p-2 rounded border transition-colors" :class="{
                                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': index === currentIndex,
                                'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': isItemCompleted(item.id),
                                'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700': index !== currentIndex && !isItemCompleted(item.id),
                            }">
                            <div class="flex-shrink-0">
                                <i v-if="isItemCompleted(item.id)"
                                    class="pi pi-check-circle text-green-600 dark:text-green-400" />
                                <i v-else-if="index === currentIndex"
                                    class="pi pi-arrow-right text-blue-600 dark:text-blue-400" />
                                <i v-else class="pi pi-circle text-gray-400" />
                            </div>
                            <div class="flex-1 text-sm truncate">
                                {{ item.text }}
                            </div>
                            <Badge v-if="item.repeatCount > 1" :value="`${item.repeatCount}×`" severity="secondary"
                                size="small" />
                        </div>
                    </div>
                </div>

                <!-- Completion Message -->
                <div v-if="isComplete"
                    class="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-2xl" />
                    <div>
                        <p class="font-medium text-green-900 dark:text-green-100">
                            {{ loc.t('session.feedback.allItemsCompleted') }}
                        </p>
                        <p class="text-sm text-green-700 dark:text-green-300">
                            {{ loc.t('session.completion.totalTime') }}: {{ formattedDuration }}
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import { useLocalizationStore } from '@/stores/localization'
import { usePracticeSessionStore } from '@/stores/practiceSession'
import type { ExerciseItem } from '@/stores/practiceSession/types'

interface SessionProgressProps {
    /** Show detailed item list */
    showItemList?: boolean
}

const props = withDefaults(defineProps<SessionProgressProps>(), {
    showItemList: false,
})

// Services
const loc = useLocalizationStore()
const sessionStore = usePracticeSessionStore()

// Computed from store
const currentItem = computed(() => sessionStore.currentItem)
const currentIndex = computed(() => sessionStore.currentItemIndex)
const currentIteration = computed(() => sessionStore.currentIteration)
const exerciseItems = computed(() => sessionStore.exerciseItems)
const totalItems = computed(() => sessionStore.totalItems)
const completedCount = computed(() => sessionStore.completedItemsCount)
const progressPercentage = computed(() => sessionStore.progressPercentage)
const sessionDuration = computed(() => sessionStore.sessionDuration)

// Computed - local
const totalCount = computed(() => exerciseItems.value.length)

const remainingCount = computed(() => totalItems.value - completedCount.value)

const isComplete = computed(() => {
    return totalItems.value > 0 && completedCount.value >= totalItems.value
})

const progressSeverity = computed(() => {
    const percentage = progressPercentage.value
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 50) return 'warn'
    return 'secondary'
})

const formattedDuration = computed(() => {
    const totalSeconds = Math.floor(sessionDuration.value / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
        return loc.t('session.timing.format', { hours, minutes, seconds })
    }
    return loc.t('session.timing.formatShort', {
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
    })
})

// Methods
function isItemCompleted(itemId: string): boolean {
    return sessionStore.completedItemIds.has(itemId)
}
</script>
