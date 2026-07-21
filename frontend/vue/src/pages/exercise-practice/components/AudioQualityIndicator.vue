<template>
    <Badge :severity="qualitySeverity" :class="badgeClasses" @click="handleClick">
        <span class="flex items-center gap-2">
            <i v-if="showIcon" :class="qualityIcon" />
            <span>{{ qualityLabel }}</span>
        </span>
    </Badge>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Badge from 'primevue/badge'

type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

interface Props {
    /** Audio quality metrics */
    snr?: number
    volume?: number
    clipping?: number
    noiseLevel?: number

    /** Show icon in badge */
    showIcon?: boolean

    /** Compact mode (smaller size) */
    compact?: boolean

    /** Clickable badge */
    clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showIcon: true,
    compact: false,
    clickable: false
})

interface Emits {
    (e: 'click'): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const labels = ref({
    excellent: '',
    good: '',
    fair: '',
    poor: '',
    unknown: ''
})

onMounted(() => {
    labels.value.excellent = loc.t('recording.quality.excellent')
    labels.value.good = loc.t('recording.quality.good')
    labels.value.fair = loc.t('recording.quality.fair')
    labels.value.poor = loc.t('recording.quality.poor')
    labels.value.unknown = loc.t('recording.quality.unknown')
})

const qualityLevel = computed((): QualityLevel => {
    // If no metrics provided, return unknown
    if (props.snr === undefined && props.volume === undefined) {
        return 'unknown'
    }

    let score = 0
    let count = 0

    // SNR scoring (Signal-to-Noise Ratio in dB)
    if (props.snr !== undefined) {
        if (props.snr >= 40) score += 4      // Excellent: >40dB
        else if (props.snr >= 30) score += 3 // Good: 30-40dB
        else if (props.snr >= 20) score += 2 // Fair: 20-30dB
        else score += 1                      // Poor: <20dB
        count++
    }

    // Volume scoring (RMS energy 0-1, typical speech is 0.01-0.05)
    if (props.volume !== undefined) {
        if (props.volume >= 0.03 && props.volume <= 0.15) score += 4      // Excellent: 3-15% RMS
        else if (props.volume >= 0.01 && props.volume < 0.3) score += 3   // Good: 1-3% or 15-30% RMS
        else if (props.volume >= 0.005) score += 2                        // Fair: 0.5-1% RMS
        else score += 1                                                    // Poor: <0.5% RMS (silence/noise)
        count++
    }

    // Clipping penalty (percentage of clipped samples)
    if (props.clipping !== undefined && props.clipping > 0) {
        if (props.clipping < 0.01) score += 0       // <1% clipping: no penalty
        else if (props.clipping < 0.05) score -= 1  // 1-5%: minor penalty
        else score -= 2                              // >5%: major penalty
    }

    // Noise level penalty (spectral flatness 0-1, lower is better)
    if (props.noiseLevel !== undefined) {
        if (props.noiseLevel < 0.1) score += 0      // <0.1: clean signal, no penalty
        else if (props.noiseLevel < 0.3) score -= 1 // 0.1-0.3: some noise, minor penalty
        else score -= 2                              // >0.3: noisy signal, major penalty
    }

    if (count === 0) return 'unknown'

    const avgScore = score / count

    if (avgScore >= 3.5) return 'excellent'
    if (avgScore >= 2.5) return 'good'
    if (avgScore >= 1.5) return 'fair'
    return 'poor'
})

const qualityLabel = computed(() => {
    return labels.value[qualityLevel.value]
})

const qualitySeverity = computed(() => {
    switch (qualityLevel.value) {
        case 'excellent':
            return 'success'
        case 'good':
            return 'info'
        case 'fair':
            return 'warn'
        case 'poor':
            return 'danger'
        default:
            return 'secondary'
    }
})

const qualityIcon = computed(() => {
    switch (qualityLevel.value) {
        case 'excellent':
            return 'pi pi-check-circle'
        case 'good':
            return 'pi pi-thumbs-up'
        case 'fair':
            return 'pi pi-exclamation-triangle'
        case 'poor':
            return 'pi pi-times-circle'
        default:
            return 'pi pi-question-circle'
    }
})

const badgeClasses = computed(() => [
    'transition-all duration-300',
    {
        'text-xs px-2 py-1': props.compact,
        'text-sm px-3 py-1.5': !props.compact,
        'cursor-pointer hover:opacity-80': props.clickable
    }
])

const handleClick = () => {
    if (props.clickable) {
        emit('click')
    }
}
</script>

<style scoped>
/* Badge container styling */
:deep(.p-badge) {
    font-weight: 600;
    border-radius: 0.5rem;
}
</style>
