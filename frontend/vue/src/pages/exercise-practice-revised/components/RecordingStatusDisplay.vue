<template>
    <div class="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800">
        <!-- Status Indicator -->
        <div class="flex items-center gap-2">
            <i :class="[
                statusIcon,
                statusClasses,
                'text-base',
                status === 'recording' && 'animate-pulse'
            ]" />
        </div>

        <!-- Duration -->
        <div class="flex items-center gap-1.5">
            <i class="pi pi-clock text-surface-600 dark:text-surface-400 text-sm" />
            <span class="text-sm font-mono tabular-nums">
                {{ formattedDuration }}
            </span>
        </div>

        <!-- File Size -->
        <div v-if="showFileSize && !compact" class="flex items-center gap-2">
            <i class="pi pi-save text-surface-600 dark:text-surface-400" />
            <span class="text-sm font-mono tabular-nums">
                {{ formattedFileSize }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLocalizationStore } from '@/stores/localization'

interface Props {
    /** Recording duration in seconds */
    duration: number

    /** File size in bytes */
    fileSize: number

    /** Recording status */
    status: 'idle' | 'recording' | 'paused' | 'stopped'

    /** Show file size */
    showFileSize?: boolean

    /** Compact mode */
    compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showFileSize: true,
    compact: false
})

const loc = useLocalizationStore()

const labels = ref({
    recording: '',
    paused: '',
    stopped: '',
    idle: ''
})

onMounted(() => {
    labels.value.recording = loc.t('recording.status.recording')
    labels.value.paused = loc.t('recording.status.paused')
    labels.value.stopped = loc.t('recording.status.stopped')
    labels.value.idle = loc.t('recording.status.idle')
})

const statusIcon = computed(() => {
    switch (props.status) {
        case 'recording':
            return 'pi pi-circle-fill'
        case 'paused':
            return 'pi pi-pause-circle'
        case 'stopped':
            return 'pi pi-stop-circle'
        case 'idle':
            return 'pi pi-circle'
        default:
            return 'pi pi-circle'
    }
})

const statusClasses = computed(() => {
    switch (props.status) {
        case 'recording':
            return 'text-red-500'
        case 'paused':
            return 'text-orange-500'
        case 'stopped':
            return 'text-gray-500'
        case 'idle':
            return 'text-surface-400'
        default:
            return 'text-surface-400'
    }
})

const statusLabel = computed(() => {
    switch (props.status) {
        case 'recording':
            return labels.value.recording
        case 'paused':
            return labels.value.paused
        case 'stopped':
            return labels.value.stopped
        case 'idle':
            return labels.value.idle
        default:
            return labels.value.idle
    }
})

const formattedDuration = computed(() => {
    const minutes = Math.floor(props.duration / 60)
    const seconds = props.duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const formattedFileSize = computed(() => {
    const kb = props.fileSize / 1024
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
    }
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
})
</script>
