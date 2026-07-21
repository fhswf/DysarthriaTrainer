<template>
    <div :class="markerClasses" @click="handleClick" :style="markerStyle">
        <!-- Marker Icon -->
        <div class="flex items-center justify-center w-full h-full">
            <i :class="iconClass" />
        </div>

        <!-- Timestamp Label -->
        <div v-if="showLabel"
            class="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-xs rounded whitespace-nowrap">
            {{ formattedTimestamp }}
        </div>

        <!-- Custom Label -->
        <div v-if="label"
            class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-surface-100 text-surface-700 text-xs rounded whitespace-nowrap">
            {{ label }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type MarkerType = 'start' | 'pause' | 'resume' | 'stop' | 'bookmark' | 'error' | 'warning' | 'custom'

interface Props {
    /** Timestamp in seconds */
    timestamp: number

    /** Total duration in seconds (for positioning) */
    totalDuration: number

    /** Marker type */
    type?: MarkerType

    /** Custom label */
    label?: string

    /** Show timestamp label on hover */
    showLabel?: boolean

    /** Clickable marker */
    clickable?: boolean

    /** Custom icon class */
    customIcon?: string

    /** Highlight marker */
    highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    type: 'bookmark',
    showLabel: true,
    clickable: true,
    highlighted: false
})

interface Emits {
    (e: 'click', timestamp: number): void
}

const emit = defineEmits<Emits>()

const formattedTimestamp = computed(() => {
    const minutes = Math.floor(props.timestamp / 60)
    const seconds = Math.floor(props.timestamp % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const markerPosition = computed(() => {
    if (props.totalDuration === 0) return 0
    return (props.timestamp / props.totalDuration) * 100
})

const markerStyle = computed(() => ({
    left: `${markerPosition.value}%`
}))

const markerClasses = computed(() => [
    'absolute bottom-0 transform -translate-x-1/2',
    'w-3 h-3 rounded-full border-2',
    'transition-all duration-200',
    {
        // Base styling
        'cursor-pointer hover:scale-125': props.clickable,
        'ring-2 ring-offset-1': props.highlighted,

        // Type-specific colors
        'bg-green-500 border-green-600': props.type === 'start',
        'bg-orange-500 border-orange-600': props.type === 'pause',
        'bg-blue-500 border-blue-600': props.type === 'resume',
        'bg-red-500 border-red-600': props.type === 'stop',
        'bg-purple-500 border-purple-600': props.type === 'bookmark',
        'bg-red-600 border-red-700': props.type === 'error',
        'bg-yellow-500 border-yellow-600': props.type === 'warning',
        'bg-surface-500 border-surface-600': props.type === 'custom',

        // Highlight ring colors
        'ring-green-300': props.highlighted && props.type === 'start',
        'ring-orange-300': props.highlighted && props.type === 'pause',
        'ring-blue-300': props.highlighted && props.type === 'resume',
        'ring-red-300': props.highlighted && (props.type === 'stop' || props.type === 'error'),
        'ring-purple-300': props.highlighted && props.type === 'bookmark',
        'ring-yellow-300': props.highlighted && props.type === 'warning',
        'ring-surface-300': props.highlighted && props.type === 'custom'
    }
])

const iconClass = computed(() => {
    if (props.customIcon) return props.customIcon

    const iconMap: Record<MarkerType, string> = {
        start: 'pi pi-play-circle text-white text-[6px]',
        pause: 'pi pi-pause text-white text-[6px]',
        resume: 'pi pi-play text-white text-[6px]',
        stop: 'pi pi-stop text-white text-[6px]',
        bookmark: 'pi pi-bookmark text-white text-[6px]',
        error: 'pi pi-times text-white text-[6px]',
        warning: 'pi pi-exclamation-triangle text-white text-[6px]',
        custom: 'pi pi-circle text-white text-[6px]'
    }

    return iconMap[props.type] || iconMap.custom
})

const handleClick = () => {
    if (props.clickable) {
        emit('click', props.timestamp)
    }
}
</script>

<style scoped>
/* Tooltip hover effect */
.absolute.bottom-full {
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
}

.relative:hover .absolute.bottom-full,
.absolute:hover .absolute.bottom-full {
    opacity: 1;
}

/* Ensure marker is above timeline */
.absolute {
    z-index: 10;
}
</style>
