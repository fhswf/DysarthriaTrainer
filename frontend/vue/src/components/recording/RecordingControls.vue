<template>
    <div class="flex flex-col gap-4">
        <!-- Main Recording Button -->
        <div class="flex items-center justify-center">
            <button v-if="!isRecording" @click="handleStartRecording" :disabled="!hasPermission || isStarting"
                class="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                :class="{ 'animate-pulse': isStarting }">
                <i class="pi pi-circle text-2xl" />
                <span class="text-lg">{{ loc.t('recording.startRecording') }}</span>
            </button>

            <button v-else @click="handleStopRecording" :disabled="isStopping"
                class="flex items-center gap-3 px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200">
                <i class="pi pi-stop text-2xl" />
                <span class="text-lg">{{ loc.t('recording.stopRecording') }}</span>
            </button>
        </div>

        <!-- Recording Status -->
        <div v-if="isRecording || recordingDuration > 0" class="flex flex-col items-center gap-2">
            <!-- Duration Display -->
            <div class="flex items-center gap-2 text-2xl font-mono font-bold">
                <i v-if="isRecording" class="pi pi-circle-fill text-red-600 animate-pulse" />
                <span>{{ formattedDuration }}</span>
            </div>

            <!-- Status Text -->
            <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ statusText }}
            </p>
        </div>

        <!-- Audio Quality Indicator -->
        <div v-if="isRecording && showQualityIndicator" class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ loc.t('recording.quality.title') }}</span>
                <span class="font-semibold" :class="qualityColorClass">
                    {{ qualityLabel }}
                </span>
            </div>

            <!-- Audio Level Bar -->
            <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-100 rounded-full" :class="qualityBarClass"
                    :style="{ width: `${audioLevelPercentage}%` }" />
            </div>

            <!-- Quality Feedback -->
            <p v-if="qualityFeedback" class="text-xs text-center" :class="qualityColorClass">
                {{ qualityFeedback }}
            </p>
        </div>

        <!-- Permission Request -->
        <div v-if="hasPermission === false"
            class="flex flex-col items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-2xl" />
            <div class="text-center">
                <p class="font-medium text-yellow-900 dark:text-yellow-100">
                    {{ loc.t('recording.permissions.title') }}
                </p>
                <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {{ loc.t('recording.permissions.message') }}
                </p>
            </div>
            <button @click="requestPermission"
                class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors">
                {{ loc.t('recording.permissions.allow') }}
            </button>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex items-start gap-3">
                <i class="pi pi-times-circle text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                    <p class="font-medium text-red-900 dark:text-red-100">
                        {{ loc.t('recording.errors.startFailed') }}
                    </p>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                        {{ error }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Tips -->
        <div v-if="showTips && !isRecording"
            class="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-medium">
                <i class="pi pi-info-circle" />
                <span class="text-sm">{{ loc.t('recording.tips.speakClearly') }}</span>
            </div>
            <p class="text-xs text-blue-700 dark:text-blue-300 ml-6">
                {{ loc.t('recording.tips.minimizeNoise') }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import { useAudioRecorder } from '@/composables/useAudioRecorder'

interface RecordingControlsProps {
    /** Show audio quality indicator during recording */
    showQualityIndicator?: boolean
    /** Show recording tips when not recording */
    showTips?: boolean
    /** Enable automatic quality warnings */
    enableQualityWarnings?: boolean
}

interface RecordingControlsEmits {
    /** Emitted when recording starts */
    (e: 'start'): void
    /** Emitted when recording stops with the audio blob */
    (e: 'stop', blob: Blob): void
    /** Emitted when an error occurs */
    (e: 'error', error: Error): void
}

const props = withDefaults(defineProps<RecordingControlsProps>(), {
    showQualityIndicator: true,
    showTips: true,
    enableQualityWarnings: true,
})

const emit = defineEmits<RecordingControlsEmits>()

// Services
const loc = useLocalizationStore()

// Composable
const recorder = useAudioRecorder({
    enableQualityWarnings: props.enableQualityWarnings,
})

// Local state
const isStarting = ref(false)
const isStopping = ref(false)
const error = ref<string | null>(null)

// Computed
const statusText = computed(() => {
    if (recorder.isRecording.value) {
        return loc.t('recording.status.recording')
    } else if (recorder.duration.value > 0) {
        return loc.t('recording.status.stopped')
    }
    return loc.t('recording.status.idle')
})

const qualityLabel = computed(() => {
    const quality = recorder.audioQuality.value.quality
    return loc.t(`recording.quality.${quality}`)
})

const qualityColorClass = computed(() => {
    const quality = recorder.audioQuality.value.quality
    switch (quality) {
        case 'excellent':
            return 'text-green-600 dark:text-green-400'
        case 'good':
            return 'text-blue-600 dark:text-blue-400'
        case 'fair':
            return 'text-yellow-600 dark:text-yellow-400'
        case 'poor':
            return 'text-red-600 dark:text-red-400'
        default:
            return 'text-gray-600 dark:text-gray-400'
    }
})

const qualityBarClass = computed(() => {
    const quality = recorder.audioQuality.value.quality
    switch (quality) {
        case 'excellent':
            return 'bg-green-500'
        case 'good':
            return 'bg-blue-500'
        case 'fair':
            return 'bg-yellow-500'
        case 'poor':
            return 'bg-red-500'
        default:
            return 'bg-gray-500'
    }
})

const audioLevelPercentage = computed(() => {
    return Math.min((recorder.audioLevel.value / 255) * 100, 100)
})

const qualityFeedback = computed(() => {
    const quality = recorder.audioQuality.value
    if (quality.isClipping) {
        return loc.t('recording.quality.feedback.tooLoud')
    } else if (quality.isTooQuiet) {
        return loc.t('recording.quality.feedback.tooQuiet')
    } else if (quality.quality === 'excellent') {
        return loc.t('recording.quality.feedback.excellent')
    }
    return null
})

const hasPermission = computed(() => recorder.hasPermission.value)
const isRecording = computed(() => recorder.isRecording.value)
const recordingDuration = computed(() => recorder.duration.value)
const formattedDuration = computed(() => recorder.formattedDuration.value)

// Methods
async function handleStartRecording() {
    if (isStarting.value || recorder.isRecording.value) return

    error.value = null
    isStarting.value = true

    try {
        await recorder.startRecording()
        emit('start')
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        emit('error', err instanceof Error ? err : new Error('Unknown error'))
    } finally {
        isStarting.value = false
    }
}

async function handleStopRecording() {
    if (isStopping.value || !recorder.isRecording.value) return

    isStopping.value = true

    try {
        const blob = await recorder.stopRecording()
        if (blob) {
            emit('stop', blob)
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        emit('error', err instanceof Error ? err : new Error('Unknown error'))
    } finally {
        isStopping.value = false
    }
}

async function requestPermission() {
    try {
        await recorder.requestPermission()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Permission denied'
    }
}

// Watch for permission changes
watch(
    () => recorder.hasPermission.value,
    (newVal) => {
        if (newVal === false) {
            error.value = loc.t('recording.errors.permissionDenied')
        } else if (newVal === true) {
            error.value = null
        }
    }
)
</script>
