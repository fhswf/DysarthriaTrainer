<template>
    <Dialog v-model:visible="isVisible" modal :closable="false" :draggable="false" class="w-full max-w-2xl">
        <template #header>
            <div class="flex items-center gap-3">
                <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-3xl" />
                <span class="text-2xl font-bold">{{ loc.t('session.completion.title') }}</span>
            </div>
        </template>

        <div class="flex flex-col gap-6">
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-4">
                <!-- Total Items -->
                <Card class="shadow-sm">
                    <template #content>
                        <div class="flex flex-col items-center gap-2 py-2">
                            <i class="pi pi-list text-4xl text-blue-600 dark:text-blue-400" />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ loc.t('session.completion.totalItems') }}
                            </span>
                            <span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {{ totalItems }}
                            </span>
                        </div>
                    </template>
                </Card>

                <!-- Total Time -->
                <Card class="shadow-sm">
                    <template #content>
                        <div class="flex flex-col items-center gap-2 py-2">
                            <i class="pi pi-clock text-4xl text-purple-600 dark:text-purple-400" />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ loc.t('session.completion.totalTime') }}
                            </span>
                            <span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {{ formattedDuration }}
                            </span>
                        </div>
                    </template>
                </Card>

                <!-- Average Score (if available) -->
                <Card v-if="averageScore !== null" class="shadow-sm">
                    <template #content>
                        <div class="flex flex-col items-center gap-2 py-2">
                            <i class="pi pi-star text-4xl text-yellow-600 dark:text-yellow-400" />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ loc.t('session.completion.averageScore') }}
                            </span>
                            <span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {{ Math.round(averageScore) }}%
                            </span>
                        </div>
                    </template>
                </Card>

                <!-- Improvements (if available) -->
                <Card v-if="improvementPercentage !== null" class="shadow-sm">
                    <template #content>
                        <div class="flex flex-col items-center gap-2 py-2">
                            <i class="pi pi-chart-line text-4xl text-green-600 dark:text-green-400" />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ loc.t('session.completion.improvements') }}
                            </span>
                            <span class="text-3xl font-bold text-green-700 dark:text-green-300">
                                +{{ Math.round(improvementPercentage) }}%
                            </span>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Completion Message -->
            <div
                class="flex flex-col gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-center text-lg font-medium text-green-900 dark:text-green-100">
                    {{ completionMessage }}
                </p>
                <p v-if="encouragementMessage" class="text-center text-sm text-green-700 dark:text-green-300">
                    {{ encouragementMessage }}
                </p>
            </div>

            <!-- Item Breakdown (Optional) -->
            <div v-if="showItemBreakdown && itemResults.length > 0" class="flex flex-col gap-2">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ loc.t('session.completion.summary') }}
                </div>
                <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div v-for="result in itemResults" :key="result.id"
                        class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <div class="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                            {{ result.itemText }}
                        </div>
                        <div class="flex items-center gap-3">
                            <Badge :value="`${result.iteration}×`" severity="secondary" size="small" />
                            <div v-if="result.pronunciationScore !== null" class="text-sm font-medium" :class="{
                                'text-green-600 dark:text-green-400': result.pronunciationScore >= 80,
                                'text-yellow-600 dark:text-yellow-400': result.pronunciationScore >= 60 && result.pronunciationScore < 80,
                                'text-red-600 dark:text-red-400': result.pronunciationScore < 60,
                            }">
                                {{ Math.round(result.pronunciationScore) }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-3">
                <Button :label="loc.t('session.completion.viewDetails')" icon="pi pi-chart-bar"
                    @click="handleViewDetails" severity="info" outlined class="w-full" />
                <Button :label="loc.t('session.completion.startNew')" icon="pi pi-plus" @click="handleStartNew"
                    class="w-full" />
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { useLocalizationStore } from '@/stores/localization'
import { usePracticeSessionStore } from '@/stores/practiceSession'

interface SessionSummaryProps {
    /** Control dialog visibility externally */
    visible: boolean
    /** Show detailed item breakdown */
    showItemBreakdown?: boolean
}

interface SessionSummaryEmits {
    /** Emitted when visibility changes */
    (e: 'update:visible', value: boolean): void
    /** Emitted when user wants to view detailed results */
    (e: 'view-details'): void
    /** Emitted when user wants to start a new session */
    (e: 'start-new'): void
}

const props = withDefaults(defineProps<SessionSummaryProps>(), {
    showItemBreakdown: true,
})

const emit = defineEmits<SessionSummaryEmits>()

// Services
const loc = useLocalizationStore()
const sessionStore = usePracticeSessionStore()

// Local state
const isVisible = ref(props.visible)

// Watch for external visibility changes
watch(() => props.visible, (newVal) => {
    isVisible.value = newVal
})

// Watch for internal visibility changes
watch(isVisible, (newVal) => {
    emit('update:visible', newVal)
})

// Computed from store
const currentSession = computed(() => sessionStore.currentSession)
const totalItems = computed(() => sessionStore.totalItems)
const sessionDuration = computed(() => sessionStore.sessionDuration)
const results = computed(() => Array.from(sessionStore.results.values()))

// Computed - summary data
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

const averageScore = computed(() => {
    const scoresWithValues = results.value
        .filter(r => r.pronunciationScore !== null)
        .map(r => r.pronunciationScore!)

    if (scoresWithValues.length === 0) return null

    const sum = scoresWithValues.reduce((acc, score) => acc + score, 0)
    return sum / scoresWithValues.length
})

const improvementPercentage = computed(() => {
    // Calculate improvement from first to last attempts
    const scoresWithValues = results.value
        .filter(r => r.pronunciationScore !== null)
        .map(r => r.pronunciationScore!)

    if (scoresWithValues.length < 2) return null

    const firstScore = scoresWithValues[0]
    const lastScore = scoresWithValues[scoresWithValues.length - 1]

    return ((lastScore - firstScore) / firstScore) * 100
})

const itemResults = computed(() => {
    return results.value.map(result => {
        const item = sessionStore.exerciseItems.find(i => i.id === result.exerciseItemId)
        return {
            id: result.id,
            itemText: item?.text || 'Unknown item',
            iteration: result.iterationNumber,
            pronunciationScore: result.pronunciationScore,
            duration: result.durationMs,
        }
    })
})

const completionMessage = computed(() => {
    const score = averageScore.value
    if (score === null) {
        return loc.t('session.feedback.sessionCompleted')
    }

    if (score >= 90) {
        return 'Ausgezeichnete Leistung! 🎉'
    } else if (score >= 80) {
        return 'Sehr gut gemacht! 👏'
    } else if (score >= 70) {
        return 'Gute Arbeit! 👍'
    } else {
        return 'Sitzung abgeschlossen! 📝'
    }
})

const encouragementMessage = computed(() => {
    const improvement = improvementPercentage.value
    if (improvement === null) return null

    if (improvement > 10) {
        return 'Sie haben sich deutlich verbessert!'
    } else if (improvement > 0) {
        return 'Sie machen Fortschritte!'
    }
    return null
})

// Methods
function handleViewDetails() {
    emit('view-details')
    isVisible.value = false
}

function handleStartNew() {
    emit('start-new')
    isVisible.value = false
}
</script>
