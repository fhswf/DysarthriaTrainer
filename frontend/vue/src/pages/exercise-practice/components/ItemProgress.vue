<template>
    <div class="flex items-center gap-3">
        <!-- Progress Items -->
        <div v-for="(item, index) in items" :key="index" class="relative">
            <!-- Progress Item -->
            <div :class="itemClasses(index)" @click="handleItemClick(index)">
                <!-- Completed Check -->
                <i v-if="item.completed" class="pi pi-check text-white text-xs" />

                <!-- Current Indicator -->
                <div v-else-if="index === currentIndex" class="w-2 h-2 bg-white rounded-full" />

                <!-- Item Number (for non-compact) -->
                <span v-else-if="!compact" class="text-xs">{{ index + 1 }}</span>
            </div>

            <!-- Connector Line -->
            <div v-if="index < items.length - 1" :class="connectorClasses(index)" />

            <!-- Item Label (optional) -->
            <div v-if="showLabels && item.label"
                class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-xs text-surface-600 whitespace-nowrap">
                {{ item.label }}
            </div>
        </div>

        <!-- Summary Text -->
        <div v-if="showSummary" class="ml-2 text-sm text-surface-700">
            <span class="font-semibold">{{ completedCount }}</span>
            <span class="text-surface-500"> / {{ items.length }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ProgressItem {
    /** Item identifier */
    id?: string | number

    /** Item label (optional) */
    label?: string

    /** Whether item is completed */
    completed: boolean

    /** Whether item is skipped */
    skipped?: boolean
}

interface Props {
    /** Progress items */
    items: ProgressItem[]

    /** Current active item index */
    currentIndex: number

    /** Compact mode (smaller circles) */
    compact?: boolean

    /** Show item labels below */
    showLabels?: boolean

    /** Show completed/total summary */
    showSummary?: boolean

    /** Enable click on items */
    clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    compact: false,
    showLabels: false,
    showSummary: true,
    clickable: false
})

interface Emits {
    (e: 'item-click', index: number): void
}

const emit = defineEmits<Emits>()

const completedCount = computed(() => {
    return props.items.filter(item => item.completed).length
})

const itemClasses = (index: number) => {
    const item = props.items[index]
    const isCurrent = index === props.currentIndex
    const isCompleted = item.completed
    const isSkipped = item.skipped

    const baseClasses = [
        'flex items-center justify-center rounded-full transition-all duration-300',
        props.compact ? 'w-3 h-3' : 'w-8 h-8'
    ]

    if (isCompleted) {
        baseClasses.push('bg-green-500 border-2 border-green-500')
    } else if (isCurrent) {
        baseClasses.push('bg-primary-500 border-2 border-primary-500 ring-4 ring-primary-100')
    } else if (isSkipped) {
        baseClasses.push('bg-orange-300 border-2 border-orange-300')
    } else {
        baseClasses.push('bg-surface-200 border-2 border-surface-300')
    }

    if (props.clickable) {
        baseClasses.push('cursor-pointer hover:scale-110')
    }

    return baseClasses
}

const connectorClasses = (index: number) => {
    const currentItem = props.items[index]

    const baseClasses = [
        'absolute left-full top-1/2 transform -translate-y-1/2',
        props.compact ? 'w-4 h-0.5' : 'w-8 h-1',
        'transition-colors duration-300'
    ]

    // Connector is colored if current item is completed
    if (currentItem.completed) {
        baseClasses.push('bg-green-500')
    } else {
        baseClasses.push('bg-surface-300')
    }

    return baseClasses
}

const handleItemClick = (index: number) => {
    if (props.clickable) {
        emit('item-click', index)
    }
}
</script>

<style scoped>
/* Smooth animations */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

/* Ring animation for current item */
@keyframes pulse-ring {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.ring-4 {
    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
