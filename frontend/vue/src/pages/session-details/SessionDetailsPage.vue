<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import { sessionsWithResultsApi } from '@/api/practiceSession/practiceSessionsWithResults.api'
import type { PracticeSessionWithResults } from '@/api/practiceSession/practiceSessionsWithResults.api'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Divider from 'primevue/divider'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Chip from 'primevue/chip'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'

// Services
const loc = useLocalizationStore()
const messaging = useMessagingStore()
const route = useRoute()
const router = useRouter()

// Session ID from query parameter
const sessionId = computed(() => route.query.sessionId as string)

// State
const session = ref<PracticeSessionWithResults | null>(null)
const loading = ref(true)

/**
 * Build media URL dynamically for both localhost and VM/WireGuard access
 */
function buildMediaUrl(fileId: string): string {
    const protocol = window.location.protocol
    const host = window.location.hostname === 'localhost'
        ? 'localhost:8000'
        : window.location.host
    return `${protocol}//${host}/api/v1/media/${fileId}`
}
const error = ref<string | null>(null)
const audioUrl = ref<string | null>(null)

// Computed
const statusSeverity = computed(() => {
    const status = session.value?.status?.toLowerCase()
    switch (status) {
        case 'completed':
            return 'success'
        case 'in_progress':
            return 'info'
        case 'abandoned':
            return 'warning'
        default:
            return 'secondary'
    }
})

const statusLabel = computed(() => {
    const status = session.value?.status?.toLowerCase()
    return status ? loc.t(`sessionDetails.status_${status}`) : 'N/A'
})

const progressPercentage = computed(() => {
    if (!session.value) return 0
    return Math.round((session.value.completed_items / session.value.total_items) * 100)
})

const formattedDuration = computed(() => {
    if (!session.value?.recording_duration_ms) return 'N/A'
    const seconds = Math.floor(session.value.recording_duration_ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

// Methods
async function loadSession() {
    loading.value = true
    error.value = null

    try {
        // Validate session ID
        if (!sessionId.value) {
            error.value = loc.t('sessionDetails.errors.noSessionId')
            return
        }

        // Fetch session with results using the API module
        session.value = await sessionsWithResultsApi.get(sessionId.value)

        // Load audio if available - use dynamic URL for both localhost and VM/WireGuard
        if (session.value.session_audio_file_id) {
            audioUrl.value = buildMediaUrl(session.value.session_audio_file_id)
        }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error && 'response' in err
            ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? loc.t('sessionDetails.errors.loadFailed'))
            : loc.t('sessionDetails.errors.loadFailed')
        error.value = errorMessage
        void messaging.error(errorMessage)
    } finally {
        loading.value = false
    }
}

function getScoreSeverity(score: number): 'success' | 'info' | 'warning' | 'danger' {
    if (score >= 90) return 'success'
    if (score >= 75) return 'info'
    if (score >= 60) return 'warning'
    return 'danger'
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return loc.d(date, 'long')
}

function formatTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Time'
    return date.toLocaleTimeString()
}

function getQualitySeverity(quality: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (quality) {
        case 'excellent':
            return 'success'
        case 'good':
            return 'info'
        case 'fair':
            return 'warning'
        case 'poor':
            return 'danger'
        default:
            return 'secondary'
    }
}

function goBack() {
    void router.push('/practice-sessions')
}

/**
 * Get audio URL for a specific result with segment query parameters
 */
function getResultAudioUrl(result: { audio_file_id?: string | null; audio_segment_start_ms?: number | null; audio_segment_end_ms?: number | null }): string | null {
    if (!result.audio_file_id) return null

    const baseUrl = buildMediaUrl(result.audio_file_id)

    // Add query parameters for audio slicing on the backend
    if (result.audio_segment_start_ms !== null && result.audio_segment_end_ms !== null) {
        return `${baseUrl}?start_ms=${result.audio_segment_start_ms}&end_ms=${result.audio_segment_end_ms}`
    }

    return baseUrl
}

/**
 * Get formatted time range for audio segment
 */
function getAudioSegmentInfo(result: { audio_segment_start_ms?: number | null; audio_segment_end_ms?: number | null }): string | null {
    if (result.audio_segment_start_ms === null || result.audio_segment_start_ms === undefined ||
        result.audio_segment_end_ms === null || result.audio_segment_end_ms === undefined) {
        return null
    }
    const startSec = (result.audio_segment_start_ms / 1000).toFixed(2)
    const endSec = (result.audio_segment_end_ms / 1000).toFixed(2)
    return `${startSec}s - ${endSec}s`
}

// Lifecycle
onMounted(() => {
    void loadSession()
})
</script>

<template>
    <div class="p-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <Button :label="loc.t('sessionDetails.backToSessions')" icon="pi pi-arrow-left" text @click="goBack" />
            <h1 class="text-4xl font-bold mt-4 mb-2 text-surface-900 dark:text-surface-50">{{
                loc.t('sessionDetails.pageTitle') }}</h1>
            <p class="text-surface-600 dark:text-surface-400 mb-4">{{ loc.t('sessionDetails.pageDescription') }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="max-w-3xl mx-auto my-8">
            <Card>
                <template #content>
                    <div class="flex flex-col gap-4">
                        <Skeleton width="100%" height="2rem" />
                        <Skeleton width="100%" height="10rem" />
                        <Skeleton width="100%" height="8rem" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Error State -->
        <Message v-else-if="error" severity="error" :closable="false">
            {{ error }}
        </Message>

        <!-- Session Content -->
        <div v-else-if="session" class="flex flex-col gap-6">
            <!-- Session Info Card -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>{{ loc.t('sessionDetails.sessionInfo') }}</span>
                        <Tag :value="statusLabel" :severity="statusSeverity" />
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Session ID -->
                        <div class="flex flex-col gap-2">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.sessionId') }}</label>
                            <div class="text-surface-900 dark:text-surface-50 font-mono text-sm">{{ session.id }}</div>
                        </div>

                        <!-- Exercise -->
                        <div class="flex flex-col gap-2">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.exerciseName') }}</label>
                            <div class="text-base text-surface-900 dark:text-surface-50">{{ session.exercise_id }}</div>
                        </div>

                        <!-- Started At -->
                        <div class="flex flex-col gap-2">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.startedAt') }}</label>
                            <div class="text-base text-surface-900 dark:text-surface-50">
                                {{ formatDate(session.started_at) }}
                                <span class="text-surface-500 ml-2">{{ formatTime(session.started_at) }}</span>
                            </div>
                        </div>

                        <!-- Completed At -->
                        <div class="flex flex-col gap-2" v-if="session.completed_at">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.completedAt') }}</label>
                            <div class="text-base text-surface-900 dark:text-surface-50">
                                {{ formatDate(session.completed_at) }}
                                <span class="text-surface-500 ml-2">{{ formatTime(session.completed_at) }}</span>
                            </div>
                        </div>

                        <!-- Progress -->
                        <div class="flex flex-col gap-2">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.progress') }}</label>
                            <div class="flex items-center gap-3">
                                <ProgressBar :value="progressPercentage" class="flex-1" />
                                <span class="text-base text-surface-900 dark:text-surface-50">
                                    {{ session.completed_items }} / {{ session.total_items }}
                                </span>
                            </div>
                        </div>

                        <!-- Recording Duration -->
                        <div class="flex flex-col gap-2" v-if="session.recording_duration_ms">
                            <label
                                class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                    loc.t('sessionDetails.recordingDuration') }}</label>
                            <div class="text-base text-surface-900 dark:text-surface-50">{{ formattedDuration }}</div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Audio Player -->
            <Card v-if="audioUrl">
                <template #title>
                    <i class="pi pi-volume-up mr-2"></i>
                    {{ loc.t('sessionDetails.sessionAudio') }}
                </template>
                <template #content>
                    <audio controls class="w-full" :src="audioUrl">
                        {{ loc.t('sessionDetails.noAudio') }}
                    </audio>
                </template>
            </Card>

            <!-- Results Section -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>{{ loc.t('sessionDetails.results') }}</span>
                        <Chip
                            :label="loc.t('sessionDetails.showingResults', { count: session.results?.length || 0 })" />
                    </div>
                </template>
                <template #content>
                    <div v-if="!session.results || session.results.length === 0">
                        <Message severity="info" :closable="false">
                            {{ loc.t('sessionDetails.noResults') }}
                        </Message>
                    </div>

                    <Accordion v-else multiple class="w-full">
                        <AccordionTab v-for="(result, index) in session.results" :key="result.id"
                            :header="loc.t('sessionDetails.resultItem', { number: index + 1 })">
                            <div class="py-4">
                                <!-- Result Audio Player -->
                                <div v-if="getResultAudioUrl(result)" class="mb-6">
                                    <Card class="border border-surface-200">
                                        <template #title>
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <i class="pi pi-volume-up"></i>
                                                    <span>{{ loc.t('sessionDetails.resultAudio') }}</span>
                                                </div>
                                                <Chip v-if="getAudioSegmentInfo(result)"
                                                    :label="getAudioSegmentInfo(result)!" icon="pi pi-clock"
                                                    class="text-xs" />
                                            </div>
                                        </template>
                                        <template #content>
                                            <audio controls class="w-full" :src="getResultAudioUrl(result) ?? undefined"
                                                preload="metadata">
                                                {{ loc.t('sessionDetails.noAudio') }}
                                            </audio>
                                            <div v-if="result.audio_duration_ms" class="text-xs text-surface-500 mt-2">
                                                {{ loc.t('sessionDetails.audioDuration') }}: {{
                                                    (result.audio_duration_ms / 1000).toFixed(2) }}s
                                            </div>
                                        </template>
                                    </Card>
                                </div>

                                <!-- Basic Info -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div class="info-item">
                                        <label class="info-label">{{ loc.t('sessionDetails.iteration') }}</label>
                                        <div class="info-value">{{ result.iteration_number }}</div>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">{{ loc.t('sessionDetails.duration') }}</label>
                                        <div class="info-value">{{ (result.duration_ms / 1000).toFixed(2) }}s</div>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">{{ loc.t('sessionDetails.processingStatus') }}</label>
                                        <Tag :value="loc.t(`sessionDetails.status_${result.processing_status}`)" />
                                    </div>
                                </div>

                                <!-- Transcription -->
                                <div v-if="result.transcription" class="mb-6">
                                    <label class="info-label">{{ loc.t('sessionDetails.transcription') }}</label>
                                    <Card class="transcription-card">
                                        <template #content>
                                            <p class="text-lg">{{ result.transcription }}</p>
                                            <div v-if="result.transcription_confidence" class="mt-2">
                                                <small class="text-surface-500">
                                                    {{ loc.t('sessionDetails.confidence') }}: {{
                                                        (result.transcription_confidence * 100).toFixed(0) }}%
                                                </small>
                                            </div>
                                        </template>
                                    </Card>
                                </div>

                                <Divider />

                                <!-- Scores -->
                                <div v-if="result.evaluation_results?.scores" class="mb-6">
                                    <h4 class="section-title">{{ loc.t('sessionDetails.scores') }}</h4>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <!-- Overall Score -->
                                        <div class="score-card">
                                            <label class="score-label">{{ loc.t('sessionDetails.overallScore')
                                                }}</label>
                                            <div class="score-value">
                                                <Tag :value="`${result.evaluation_results.scores.overall_score}%`"
                                                    :severity="getScoreSeverity(result.evaluation_results.scores.overall_score)"
                                                    class="score-tag" />
                                            </div>
                                        </div>
                                        <!-- Pronunciation -->
                                        <div class="score-card">
                                            <label class="score-label">{{ loc.t('sessionDetails.pronunciationScore')
                                                }}</label>
                                            <div class="score-value">
                                                <Tag :value="`${result.evaluation_results.scores.pronunciation_score}%`"
                                                    :severity="getScoreSeverity(result.evaluation_results.scores.pronunciation_score)" />
                                            </div>
                                        </div>
                                        <!-- Accuracy -->
                                        <div class="score-card">
                                            <label class="score-label">{{ loc.t('sessionDetails.accuracyScore')
                                                }}</label>
                                            <div class="score-value">
                                                <Tag :value="`${result.evaluation_results.scores.accuracy_score}%`"
                                                    :severity="getScoreSeverity(result.evaluation_results.scores.accuracy_score)" />
                                            </div>
                                        </div>
                                        <!-- Fluency -->
                                        <div class="score-card">
                                            <label class="score-label">{{ loc.t('sessionDetails.fluencyScore')
                                                }}</label>
                                            <div class="score-value">
                                                <Tag :value="`${result.evaluation_results.scores.fluency_score}%`"
                                                    :severity="getScoreSeverity(result.evaluation_results.scores.fluency_score)" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <!-- Phoneme Analysis -->
                                <div v-if="result.phoneme_analysis" class="mb-6">
                                    <h4 class="section-title">{{ loc.t('sessionDetails.phonemeAnalysis') }}</h4>
                                    <div class="grid grid-cols-1 gap-4">
                                        <div v-if="result.phoneme_analysis.detected_phonemes?.length">
                                            <label class="info-label">{{ loc.t('sessionDetails.detectedPhonemes')
                                                }}</label>
                                            <div class="flex flex-wrap gap-2 mt-2">
                                                <Chip v-for="(phoneme, i) in result.phoneme_analysis.detected_phonemes"
                                                    :key="i" :label="phoneme" />
                                            </div>
                                        </div>
                                        <div v-if="result.phoneme_analysis.ipa_transcription">
                                            <label class="info-label">{{ loc.t('sessionDetails.ipaTranscription')
                                                }}</label>
                                            <div class="info-value font-mono">{{
                                                result.phoneme_analysis.ipa_transcription }}</div>
                                        </div>
                                        <div v-if="result.phoneme_analysis.phoneme_accuracy !== undefined">
                                            <label class="info-label">{{ loc.t('sessionDetails.phonemeAccuracy')
                                                }}</label>
                                            <div class="info-value">{{ (result.phoneme_analysis.phoneme_accuracy *
                                                100).toFixed(0) }}%</div>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <!-- Audio Quality -->
                                <div v-if="result.audio_quality_metrics" class="mb-6">
                                    <h4 class="section-title">{{ loc.t('sessionDetails.audioQuality') }}</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div v-if="result.audio_quality_metrics.quality_level">
                                            <label class="info-label">{{ loc.t('sessionDetails.qualityLevel') }}</label>
                                            <Tag :value="loc.t(`sessionDetails.quality_${result.audio_quality_metrics.quality_level}`)"
                                                :severity="getQualitySeverity(result.audio_quality_metrics.quality_level)" />
                                        </div>
                                        <div v-if="result.audio_quality_metrics.snr_db !== undefined">
                                            <label class="info-label">{{ loc.t('sessionDetails.snrDb') }}</label>
                                            <div class="info-value">{{ result.audio_quality_metrics.snr_db.toFixed(2) }}
                                                dB</div>
                                        </div>
                                        <div v-if="result.audio_quality_metrics.rms_energy !== undefined">
                                            <label class="info-label">{{ loc.t('sessionDetails.rmsEnergy') }}</label>
                                            <div class="info-value">{{
                                                result.audio_quality_metrics.rms_energy.toFixed(4) }}</div>
                                        </div>
                                        <div v-if="result.audio_quality_metrics.clipping_detected !== undefined">
                                            <label class="info-label">{{ loc.t('sessionDetails.clippingDetected')
                                                }}</label>
                                            <div class="info-value">
                                                <i
                                                    :class="result.audio_quality_metrics.clipping_detected ? 'pi pi-times-circle text-red-500' : 'pi pi-check-circle text-green-500'"></i>
                                                {{ result.audio_quality_metrics.clipping_detected ? 'Yes' : 'No' }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Warnings -->
                                    <div v-if="result.audio_quality_metrics.warnings?.length" class="mt-4">
                                        <label
                                            class="font-semibold text-sm text-surface-600 dark:text-surface-400 uppercase tracking-wide">{{
                                                loc.t('sessionDetails.warnings') }}</label>
                                        <Message v-for="(warning, i) in result.audio_quality_metrics.warnings" :key="i"
                                            severity="warn" :closable="false" class="mt-2">
                                            {{ warning }}
                                        </Message>
                                    </div>
                                </div>

                                <!-- Processing Error -->
                                <div v-if="result.processing_error" class="mt-4">
                                    <Message severity="error" :closable="false">
                                        <strong>{{ loc.t('sessionDetails.processingError') }}:</strong>
                                        {{ result.processing_error }}
                                    </Message>
                                </div>
                            </div>
                        </AccordionTab>
                    </Accordion>
                </template>
            </Card>
        </div>

        <!-- Empty State -->
        <div v-else class="max-w-3xl mx-auto my-8">
            <Message severity="info" :closable="false">
                {{ loc.t('sessionDetails.sessionNotFound') }}
            </Message>
        </div>
    </div>
</template>

<style scoped>
/* Minimal styles - using Tailwind for everything else */
@media (max-width: 768px) {
    .p-8 {
        padding: 1rem;
    }
}
</style>
