<template>
    <Card class="max-w-md mx-auto">
        <template #header>
            <div class="flex items-center justify-between p-4 border-b border-surface-200">
                <div class="flex items-center gap-3">
                    <i class="pi pi-chart-bar text-xl text-primary-500" />
                    <h3 class="text-lg font-semibold m-0">{{ labels.title }}</h3>
                </div>
                <Button v-if="collapsible" :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" text rounded
                    @click="toggleExpanded" />
            </div>
        </template>

        <template #content>
            <div v-if="!collapsible || isExpanded" class="space-y-4">
                <!-- Overall Quality -->
                <div class="flex items-center justify-between pb-3 border-b border-surface-100">
                    <span class="font-medium text-surface-700">{{ labels.overallQuality }}</span>
                    <AudioQualityIndicator :snr="snr" :volume="volume" :clipping="clipping" :noise-level="noiseLevel"
                        show-icon :compact="false" />
                </div>

                <!-- SNR Metric -->
                <div v-if="snr !== undefined" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-microphone text-surface-500" />
                            <span class="text-sm font-medium text-surface-700">{{ labels.snr }}</span>
                        </div>
                        <span class="text-sm font-semibold" :class="getSnrColorClass(snr)">
                            {{ snr.toFixed(1) }} dB
                        </span>
                    </div>
                    <div class="w-full bg-surface-100 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300" :class="getSnrColorClass(snr, true)"
                            :style="{ width: `${getSnrPercentage(snr)}%` }" />
                    </div>
                </div>

                <!-- Volume Metric -->
                <div v-if="volume !== undefined" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-volume-up text-surface-500" />
                            <span class="text-sm font-medium text-surface-700">{{ labels.volume }}</span>
                        </div>
                        <span class="text-sm font-semibold" :class="getVolumeColorClass(volume)">
                            {{ (volume * 100).toFixed(0) }}%
                        </span>
                    </div>
                    <div class="w-full bg-surface-100 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300"
                            :class="getVolumeColorClass(volume, true)" :style="{ width: `${volume * 100}%` }" />
                    </div>
                </div>

                <!-- Clipping Metric -->
                <div v-if="clipping !== undefined && clipping > 0" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle text-orange-500" />
                            <span class="text-sm font-medium text-surface-700">{{ labels.clipping }}</span>
                        </div>
                        <span class="text-sm font-semibold" :class="getClippingColorClass(clipping)">
                            {{ (clipping * 100).toFixed(2) }}%
                        </span>
                    </div>
                    <div class="w-full bg-surface-100 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300"
                            :class="getClippingColorClass(clipping, true)"
                            :style="{ width: `${Math.min(clipping * 100, 100)}%` }" />
                    </div>
                </div>

                <!-- Noise Level Metric -->
                <div v-if="noiseLevel !== undefined" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-wave-pulse text-surface-500" />
                            <span class="text-sm font-medium text-surface-700">{{ labels.noise }}</span>
                        </div>
                        <span class="text-sm font-semibold" :class="getNoiseColorClass(noiseLevel)">
                            {{ (noiseLevel * 100).toFixed(0) }}%
                        </span>
                    </div>
                    <div class="w-full bg-surface-100 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300"
                            :class="getNoiseColorClass(noiseLevel, true)" :style="{ width: `${noiseLevel * 100}%` }" />
                    </div>
                </div>

                <!-- Recommendations -->
                <div v-if="showRecommendations && recommendations.length > 0" class="pt-3 border-t border-surface-100">
                    <h4 class="text-sm font-semibold text-surface-700 mb-2">{{ labels.recommendations }}</h4>
                    <ul class="space-y-1">
                        <li v-for="(rec, index) in recommendations" :key="index"
                            class="text-xs text-surface-600 flex items-start gap-2">
                            <i class="pi pi-info-circle text-blue-500 mt-0.5 text-xs" />
                            <span>{{ rec }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Collapsed View Summary -->
            <div v-else class="text-sm text-surface-600 text-center py-2">
                {{ labels.clickToExpand }}
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Card from 'primevue/card'
import Button from 'primevue/button'
import AudioQualityIndicator from './AudioQualityIndicator.vue'

interface Props {
    /** Signal-to-Noise Ratio in dB */
    snr?: number

    /** Volume level (0-1) */
    volume?: number

    /** Clipping percentage (0-1) */
    clipping?: number

    /** Noise level (0-1) */
    noiseLevel?: number

    /** Allow collapsing the details */
    collapsible?: boolean

    /** Initially expanded */
    initiallyExpanded?: boolean

    /** Show recommendations */
    showRecommendations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    collapsible: true,
    initiallyExpanded: true,
    showRecommendations: true
})

const loc = useLocalizationStore()

const isExpanded = ref(false)

watch(() => props.initiallyExpanded, (value: boolean) => {
    isExpanded.value = value
}, { immediate: true })

const labels = ref({
    title: '',
    overallQuality: '',
    snr: '',
    volume: '',
    clipping: '',
    noise: '',
    recommendations: '',
    clickToExpand: '',
    moveCloser: '',
    reduceBackground: '',
    lowerVolume: '',
    raiseVolume: '',
    checkMicrophone: ''
})

onMounted(() => {
    labels.value.title = loc.t('recording.quality.details.title')
    labels.value.overallQuality = loc.t('recording.quality.details.overall')
    labels.value.snr = loc.t('recording.quality.details.snr')
    labels.value.volume = loc.t('recording.quality.details.volume')
    labels.value.clipping = loc.t('recording.quality.details.clipping')
    labels.value.noise = loc.t('recording.quality.details.noise')
    labels.value.recommendations = loc.t('recording.quality.details.recommendations')
    labels.value.clickToExpand = loc.t('recording.quality.details.clickToExpand')
    labels.value.moveCloser = loc.t('recording.quality.recommendations.moveCloser')
    labels.value.reduceBackground = loc.t('recording.quality.recommendations.reduceBackground')
    labels.value.lowerVolume = loc.t('recording.quality.recommendations.lowerVolume')
    labels.value.raiseVolume = loc.t('recording.quality.recommendations.raiseVolume')
    labels.value.checkMicrophone = loc.t('recording.quality.recommendations.checkMicrophone')
})

const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

const recommendations = computed(() => {
    const recs: string[] = []

    if (props.snr !== undefined && props.snr < 20) {
        recs.push(labels.value.reduceBackground)
    }

    if (props.volume !== undefined) {
        if (props.volume < 0.3) {
            recs.push(labels.value.moveCloser)
            recs.push(labels.value.raiseVolume)
        } else if (props.volume > 0.95) {
            recs.push(labels.value.lowerVolume)
        }
    }

    if (props.clipping !== undefined && props.clipping > 0.05) {
        recs.push(labels.value.lowerVolume)
    }

    if (props.noiseLevel !== undefined && props.noiseLevel > 0.2) {
        recs.push(labels.value.reduceBackground)
        recs.push(labels.value.checkMicrophone)
    }

    return recs
})

// SNR Helpers
const getSnrPercentage = (snr: number): number => {
    // Map 0-50dB to 0-100%
    return Math.min(Math.max((snr / 50) * 100, 0), 100)
}

const getSnrColorClass = (snr: number, isBg = false): string => {
    const prefix = isBg ? 'bg-' : 'text-'
    if (snr >= 40) return `${prefix}green-500`
    if (snr >= 30) return `${prefix}blue-500`
    if (snr >= 20) return `${prefix}orange-500`
    return `${prefix}red-500`
}

// Volume Helpers
const getVolumeColorClass = (volume: number, isBg = false): string => {
    const prefix = isBg ? 'bg-' : 'text-'
    if (volume >= 0.6 && volume <= 0.9) return `${prefix}green-500`
    if (volume >= 0.4) return `${prefix}blue-500`
    if (volume >= 0.2) return `${prefix}orange-500`
    return `${prefix}red-500`
}

// Clipping Helpers
const getClippingColorClass = (clipping: number, isBg = false): string => {
    const prefix = isBg ? 'bg-' : 'text-'
    if (clipping < 0.01) return `${prefix}green-500`
    if (clipping < 0.05) return `${prefix}orange-500`
    return `${prefix}red-500`
}

// Noise Helpers
const getNoiseColorClass = (noise: number, isBg = false): string => {
    const prefix = isBg ? 'bg-' : 'text-'
    if (noise < 0.1) return `${prefix}green-500`
    if (noise < 0.2) return `${prefix}orange-500`
    return `${prefix}red-500`
}
</script>

<style scoped>
/* Smooth transitions for all metrics */
.space-y-4>*+* {
    margin-top: 1rem;
}

.space-y-2>*+* {
    margin-top: 0.5rem;
}

.space-y-1>*+* {
    margin-top: 0.25rem;
}
</style>
