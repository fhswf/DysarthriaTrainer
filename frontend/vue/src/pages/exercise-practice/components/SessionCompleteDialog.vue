<template>
    <Dialog v-model:visible="isVisible" :header="labels.title" modal closable class="max-w-2xl w-full mx-4">
        <div class="space-y-6 py-4">
            <!-- Completion Message -->
            <div class="text-center space-y-3">
                <div class="flex justify-center">
                    <i class="pi pi-check-circle text-green-500 text-6xl" />
                </div>
                <h3 class="text-2xl font-bold text-surface-900">
                    {{ labels.congratulations }}
                </h3>
                <p class="text-surface-600">
                    {{ labels.message }}
                </p>
            </div>

            <!-- Statistics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <!-- Items Completed -->
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-3xl font-bold text-green-600 mb-1">
                        {{ stats.completed }}
                    </div>
                    <div class="text-sm text-surface-600">
                        {{ labels.completed }}
                    </div>
                </div>

                <!-- Total Time -->
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-3xl font-bold text-blue-600 mb-1">
                        {{ formattedDuration }}
                    </div>
                    <div class="text-sm text-surface-600">
                        {{ labels.duration }}
                    </div>
                </div>

                <!-- Average Score -->
                <div v-if="stats.averageScore !== undefined" class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-3xl font-bold text-purple-600 mb-1">
                        {{ stats.averageScore }}%
                    </div>
                    <div class="text-sm text-surface-600">
                        {{ labels.averageScore }}
                    </div>
                </div>

                <!-- Quality Rating -->
                <div v-if="stats.qualityRating" class="text-center p-4 bg-orange-50 rounded-lg">
                    <div class="text-3xl font-bold text-orange-600 mb-1">
                        {{ stats.qualityRating }}
                    </div>
                    <div class="text-sm text-surface-600">
                        {{ labels.quality }}
                    </div>
                </div>
            </div>

            <!-- Detailed Stats (Optional) -->
            <div v-if="showDetailedStats" class="space-y-3">
                <h4 class="font-semibold text-surface-900">{{ labels.details }}</h4>

                <div class="space-y-2">
                    <div v-if="stats.totalRecordings" class="flex justify-between p-3 bg-surface-50 rounded">
                        <span class="text-surface-700">{{ labels.totalRecordings }}</span>
                        <span class="font-semibold text-surface-900">{{ stats.totalRecordings }}</span>
                    </div>

                    <div v-if="stats.retries" class="flex justify-between p-3 bg-surface-50 rounded">
                        <span class="text-surface-700">{{ labels.retries }}</span>
                        <span class="font-semibold text-surface-900">{{ stats.retries }}</span>
                    </div>

                    <div v-if="stats.skipped" class="flex justify-between p-3 bg-surface-50 rounded">
                        <span class="text-surface-700">{{ labels.skipped }}</span>
                        <span class="font-semibold text-surface-900">{{ stats.skipped }}</span>
                    </div>

                    <div v-if="stats.averageAttempts" class="flex justify-between p-3 bg-surface-50 rounded">
                        <span class="text-surface-700">{{ labels.averageAttempts }}</span>
                        <span class="font-semibold text-surface-900">{{ stats.averageAttempts }}</span>
                    </div>
                </div>
            </div>

            <!-- Feedback/Achievements (Optional) -->
            <div v-if="showAchievements && achievements.length > 0" class="space-y-3">
                <h4 class="font-semibold text-surface-900 flex items-center gap-2">
                    <i class="pi pi-trophy text-yellow-500" />
                    {{ labels.achievements }}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div v-for="(achievement, index) in achievements" :key="index"
                        class="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <i :class="achievement.icon" class="text-yellow-600 text-2xl" />
                        <div>
                            <div class="font-semibold text-surface-900">{{ achievement.title }}</div>
                            <div class="text-sm text-surface-600">{{ achievement.description }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Next Steps -->
            <div v-if="showNextSteps" class="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h5 class="font-semibold text-blue-900 mb-2">{{ labels.nextSteps }}</h5>
                <p class="text-sm text-blue-800">{{ labels.nextStepsMessage }}</p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between items-center">
                <Button v-if="showShareButton" :label="labels.share" icon="pi pi-share-alt" severity="secondary" text
                    @click="handleShare" />
                <div class="flex gap-3 ml-auto">
                    <Button v-if="showReviewButton" :label="labels.review" icon="pi pi-eye" severity="secondary"
                        @click="handleReview" />
                    <Button :label="labels.close" icon="pi pi-check" @click="handleClose" autofocus />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

export interface SessionStats {
    /** Number of completed items */
    completed: number

    /** Total duration in seconds */
    durationSeconds: number

    /** Average score (0-100) */
    averageScore?: number

    /** Quality rating (Excellent, Good, etc.) */
    qualityRating?: string

    /** Total recordings made */
    totalRecordings?: number

    /** Number of retries */
    retries?: number

    /** Number of skipped items */
    skipped?: number

    /** Average attempts per item */
    averageAttempts?: number
}

export interface Achievement {
    icon: string
    title: string
    description: string
}

interface Props {
    /** Dialog visibility */
    visible: boolean

    /** Session statistics */
    stats: SessionStats

    /** Show detailed statistics */
    showDetailedStats?: boolean

    /** Show achievements section */
    showAchievements?: boolean

    /** Achievements list */
    achievements?: Achievement[]

    /** Show next steps */
    showNextSteps?: boolean

    /** Show share button */
    showShareButton?: boolean

    /** Show review button */
    showReviewButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showDetailedStats: true,
    showAchievements: true,
    achievements: () => [],
    showNextSteps: true,
    showShareButton: false,
    showReviewButton: true
})

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'close'): void
    (e: 'review'): void
    (e: 'share'): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const isVisible = ref(false)

watch(
    () => props.visible,
    (newValue) => {
        isVisible.value = newValue
    },
    { immediate: true }
)

const labels = ref({
    title: '',
    congratulations: '',
    message: '',
    completed: '',
    duration: '',
    averageScore: '',
    quality: '',
    details: '',
    totalRecordings: '',
    retries: '',
    skipped: '',
    averageAttempts: '',
    achievements: '',
    nextSteps: '',
    nextStepsMessage: '',
    share: '',
    review: '',
    close: ''
})

onMounted(() => {
    labels.value.title = loc.t('session.complete.title')
    labels.value.congratulations = loc.t('session.complete.congratulations')
    labels.value.message = loc.t('session.complete.message')
    labels.value.completed = loc.t('session.complete.completed')
    labels.value.duration = loc.t('session.complete.duration')
    labels.value.averageScore = loc.t('session.complete.averageScore')
    labels.value.quality = loc.t('session.complete.quality')
    labels.value.details = loc.t('session.complete.details')
    labels.value.totalRecordings = loc.t('session.complete.totalRecordings')
    labels.value.retries = loc.t('session.complete.retries')
    labels.value.skipped = loc.t('session.complete.skipped')
    labels.value.averageAttempts = loc.t('session.complete.averageAttempts')
    labels.value.achievements = loc.t('session.complete.achievements')
    labels.value.nextSteps = loc.t('session.complete.nextSteps')
    labels.value.nextStepsMessage = loc.t('session.complete.nextStepsMessage')
    labels.value.share = loc.t('session.complete.share')
    labels.value.review = loc.t('session.complete.review')
    labels.value.close = loc.t('common.close')
})

const formattedDuration = computed(() => {
    const minutes = Math.floor(props.stats.durationSeconds / 60)
    const seconds = Math.floor(props.stats.durationSeconds % 60)

    if (minutes === 0) {
        return `${seconds}s`
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

watch(() => props.visible, (newValue) => {
    isVisible.value = newValue
})

watch(isVisible, (newValue) => {
    emit('update:visible', newValue)
})

const handleClose = () => {
    emit('close')
    isVisible.value = false
}

const handleReview = () => {
    emit('review')
}

const handleShare = () => {
    emit('share')
}
</script>

<style scoped>
.space-y-6>*+* {
    margin-top: 1.5rem;
}

.space-y-3>*+* {
    margin-top: 0.75rem;
}

.space-y-2>*+* {
    margin-top: 0.5rem;
}
</style>
