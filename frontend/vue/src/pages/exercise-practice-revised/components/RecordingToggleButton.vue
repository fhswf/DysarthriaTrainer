<template>
    <Button :disabled="disabled || state === 'processing'" :class="buttonClasses" :icon="buttonIcon"
        :label="compact ? undefined : buttonLabel" :loading="state === 'processing'" @click="handleClick" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Button from 'primevue/button'

interface Props {
    /** Current recording state */
    state: 'idle' | 'recording' | 'paused' | 'processing' | 'error'

    /** Disable button */
    disabled?: boolean

    /** Show icon */
    showIcon?: boolean

    /** Compact mode (icon only) */
    compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    showIcon: true,
    compact: false
})

interface Emits {
    (e: 'start'): void
    (e: 'stop'): void
    (e: 'pause'): void
    (e: 'resume'): void
    (e: 'retry'): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const labels = ref({
    startRecording: '',
    stopRecording: '',
    pauseRecording: '',
    resumeRecording: '',
    processing: '',
    retry: ''
})

onMounted(() => {
    labels.value.startRecording = loc.t('recording.startRecording')
    labels.value.stopRecording = loc.t('recording.stopRecording')
    labels.value.pauseRecording = loc.t('recording.pauseRecording')
    labels.value.resumeRecording = loc.t('recording.resumeRecording')
    labels.value.processing = loc.t('recording.status.processing')
    labels.value.retry = loc.t('common.retry')
})

const buttonClasses = computed(() => [
    'min-w-[120px] min-h-[48px] transition-all duration-300 font-semibold',
    {
        // Idle state
        'hover:bg-surface-500': props.state === 'idle',

        // Recording state with pulse animation and red background
        '!bg-red-600 !text-white hover:!bg-red-700 recording-pulse': props.state === 'recording',

        // Paused state
        '!bg-orange-500 !text-white hover:!bg-orange-600': props.state === 'paused',

        // Processing state
        '!bg-blue-500 !text-white': props.state === 'processing',

        // Error state
        '!bg-red-600 !text-white hover:!bg-red-700': props.state === 'error',

        // Compact mode
        'min-w-[48px] w-[48px] p-0': props.compact
    }
])

const buttonIcon = computed(() => {
    if (!props.showIcon) return undefined

    switch (props.state) {
        case 'idle':
            return 'pi pi-circle'
        case 'recording':
            return 'pi pi-stop'
        case 'paused':
            return 'pi pi-play'
        case 'processing':
            return 'pi pi-spinner pi-spin'
        case 'error':
            return 'pi pi-exclamation-circle'
        default:
            return 'pi pi-circle'
    }
})

const buttonLabel = computed(() => {
    switch (props.state) {
        case 'idle':
            return labels.value.startRecording
        case 'recording':
            return labels.value.stopRecording
        case 'paused':
            return labels.value.resumeRecording
        case 'processing':
            return labels.value.processing
        case 'error':
            return labels.value.retry
        default:
            return labels.value.startRecording
    }
})

function handleClick() {
    switch (props.state) {
        case 'idle':
            emit('start')
            break
        case 'recording':
            emit('stop')
            break
        case 'paused':
            emit('resume')
            break
        case 'error':
            emit('retry')
            break
        // Processing state is disabled, no action
    }
}
</script>

<style scoped>
@keyframes recording-pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.85;
        transform: scale(0.98);
    }
}

.recording-pulse {
    animation: recording-pulse 2s infinite ease-in-out;
}
</style>
