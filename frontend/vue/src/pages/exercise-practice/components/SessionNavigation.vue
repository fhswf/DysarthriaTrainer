<template>
    <div class="flex items-center justify-between p-4 bg-surface-50 border-b border-surface-200">
        <!-- Previous Button -->
        <Button :disabled="!hasPrevious || disabled" icon="pi pi-chevron-left"
            :label="compact ? undefined : labels.previous" :severity="compact ? 'secondary' : undefined" text
            @click="handlePrevious" class="min-h-[44px]" />

        <!-- Progress Counter -->
        <div class="flex flex-col items-center gap-1">
            <div class="flex items-center gap-2">
                <span class="text-lg font-semibold text-surface-700">
                    {{ currentIndex + 1 }} / {{ total }}
                </span>
                <i v-if="showProgressIcon" :class="progressIcon" class="text-primary-500" />
            </div>
            <span v-if="!compact && itemLabel" class="text-xs text-surface-500">
                {{ itemLabel }}
            </span>
        </div>

        <!-- Next Button -->
        <Button :disabled="!hasNext || disabled" icon="pi pi-chevron-right" :label="compact ? undefined : labels.next"
            :severity="compact ? 'secondary' : undefined" text iconPos="right" @click="handleNext"
            class="min-h-[44px]" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Button from 'primevue/button'

interface Props {
    /** Current item index (0-based) */
    currentIndex: number

    /** Total number of items */
    total: number

    /** Optional label for current item */
    itemLabel?: string

    /** Disable navigation */
    disabled?: boolean

    /** Compact mode (icons only) */
    compact?: boolean

    /** Show progress icon */
    showProgressIcon?: boolean

    /** Allow looping (go to first after last) */
    loop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    compact: false,
    showProgressIcon: true,
    loop: false
})

interface Emits {
    (e: 'previous'): void
    (e: 'next'): void
    (e: 'change', index: number): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const labels = ref({
    previous: '',
    next: ''
})

onMounted(() => {
    labels.value.previous = loc.t('common.previous')
    labels.value.next = loc.t('common.next')
})

const hasPrevious = computed(() => {
    return props.currentIndex > 0 || (props.loop && props.total > 1)
})

const hasNext = computed(() => {
    return props.currentIndex < props.total - 1 || (props.loop && props.total > 1)
})

const progressPercentage = computed(() => {
    if (props.total === 0) return 0
    return ((props.currentIndex + 1) / props.total) * 100
})

const progressIcon = computed(() => {
    const percentage = progressPercentage.value
    if (percentage === 100) return 'pi pi-check-circle'
    if (percentage >= 75) return 'pi pi-circle-fill'
    if (percentage >= 50) return 'pi pi-circle'
    if (percentage >= 25) return 'pi pi-circle'
    return 'pi pi-circle'
})

const handlePrevious = () => {
    if (!hasPrevious.value || props.disabled) return

    emit('previous')

    if (props.currentIndex > 0) {
        emit('change', props.currentIndex - 1)
    } else if (props.loop) {
        emit('change', props.total - 1)
    }
}

const handleNext = () => {
    if (!hasNext.value || props.disabled) return

    emit('next')

    if (props.currentIndex < props.total - 1) {
        emit('change', props.currentIndex + 1)
    } else if (props.loop) {
        emit('change', 0)
    }
}
</script>

<style scoped>
/* Ensure smooth transitions */
.flex {
    transition: all 0.3s ease;
}
</style>
