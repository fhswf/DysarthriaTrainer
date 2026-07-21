<template>
    <Dialog v-model:visible="isVisible" :header="labels.title" modal :closable="!requireConfirmation"
        :dismissable-mask="!requireConfirmation" class="max-w-2xl w-full mx-4">
        <div class="space-y-6 py-4">
            <!-- Session Info -->
            <div class="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
                <i class="pi pi-info-circle text-primary-500 text-2xl mt-1" />
                <div class="flex-1">
                    <h3 class="font-semibold text-surface-900 mb-2">{{ labels.sessionInfo }}</h3>
                    <div class="space-y-1 text-sm text-surface-700">
                        <p v-if="exerciseTitle">
                            <span class="font-medium">{{ labels.exercise }}:</span> {{ exerciseTitle }}
                        </p>
                        <p v-if="itemCount">
                            <span class="font-medium">{{ labels.items }}:</span> {{ itemCount }}
                        </p>
                        <p v-if="estimatedDuration">
                            <span class="font-medium">{{ labels.duration }}:</span> {{ estimatedDuration }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div v-if="showInstructions" class="space-y-3">
                <h4 class="font-semibold text-surface-900 flex items-center gap-2">
                    <i class="pi pi-book text-primary-500" />
                    {{ labels.instructions }}
                </h4>
                <ol class="list-decimal list-inside space-y-2 text-sm text-surface-700">
                    <li v-for="(instruction, index) in instructions" :key="index">
                        {{ instruction }}
                    </li>
                </ol>
            </div>

            <!-- Settings (Optional) -->
            <div v-if="showSettings" class="space-y-3">
                <h4 class="font-semibold text-surface-900 flex items-center gap-2">
                    <i class="pi pi-cog text-primary-500" />
                    {{ labels.settings }}
                </h4>

                <div class="space-y-3">
                    <!-- Auto-play next item -->
                    <div class="flex items-center justify-between p-3 bg-surface-50 rounded">
                        <div>
                            <label class="font-medium text-sm text-surface-900" for="autoplay">
                                {{ labels.autoPlay }}
                            </label>
                            <p class="text-xs text-surface-600">{{ labels.autoPlayDescription }}</p>
                        </div>
                        <InputSwitch id="autoplay" v-model="settings.autoPlay" />
                    </div>

                    <!-- Show quality feedback -->
                    <div class="flex items-center justify-between p-3 bg-surface-50 rounded">
                        <div>
                            <label class="font-medium text-sm text-surface-900" for="quality-feedback">
                                {{ labels.showQuality }}
                            </label>
                            <p class="text-xs text-surface-600">{{ labels.showQualityDescription }}</p>
                        </div>
                        <InputSwitch id="quality-feedback" v-model="settings.showQualityFeedback" />
                    </div>

                    <!-- Skip completed items -->
                    <div class="flex items-center justify-between p-3 bg-surface-50 rounded">
                        <div>
                            <label class="font-medium text-sm text-surface-900" for="skip-completed">
                                {{ labels.skipCompleted }}
                            </label>
                            <p class="text-xs text-surface-600">{{ labels.skipCompletedDescription }}</p>
                        </div>
                        <InputSwitch id="skip-completed" v-model="settings.skipCompleted" />
                    </div>
                </div>
            </div>

            <!-- Tips (Optional) -->
            <div v-if="showTips && tips.length > 0" class="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div class="flex items-start gap-3">
                    <i class="pi pi-lightbulb text-blue-600 text-xl mt-0.5" />
                    <div>
                        <h5 class="font-semibold text-blue-900 mb-2">{{ labels.tips }}</h5>
                        <ul class="space-y-1 text-sm text-blue-800">
                            <li v-for="(tip, index) in tips" :key="index" class="flex items-start gap-2">
                                <span>•</span>
                                <span>{{ tip }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <Button v-if="!requireConfirmation" :label="labels.cancel" severity="secondary" text
                    @click="handleCancel" />
                <Button :label="labels.start" icon="pi pi-play" @click="handleStart" autofocus />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'

export interface SessionSettings {
    autoPlay: boolean
    showQualityFeedback: boolean
    skipCompleted: boolean
}

interface Props {
    /** Dialog visibility */
    visible: boolean

    /** Exercise title */
    exerciseTitle?: string

    /** Number of items in session */
    itemCount?: number

    /** Estimated duration */
    estimatedDuration?: string

    /** Show instructions */
    showInstructions?: boolean

    /** Custom instructions list */
    instructions?: string[]

    /** Show settings panel */
    showSettings?: boolean

    /** Initial settings */
    initialSettings?: Partial<SessionSettings>

    /** Show tips */
    showTips?: boolean

    /** Custom tips list */
    tips?: string[]

    /** Require confirmation (no cancel button) */
    requireConfirmation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showInstructions: true,
    showSettings: true,
    showTips: true,
    requireConfirmation: false,
    instructions: () => [],
    tips: () => []
})

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'start', settings: SessionSettings): void
    (e: 'cancel'): void
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
    sessionInfo: '',
    exercise: '',
    items: '',
    duration: '',
    instructions: '',
    settings: '',
    autoPlay: '',
    autoPlayDescription: '',
    showQuality: '',
    showQualityDescription: '',
    skipCompleted: '',
    skipCompletedDescription: '',
    tips: '',
    start: '',
    cancel: ''
})

const settings = ref<SessionSettings>({
    autoPlay: true,
    showQualityFeedback: true,
    skipCompleted: false,
})

watch(
    () => props.initialSettings,
    (newSettings) => {
        if (newSettings) {
            settings.value = {
                autoPlay: newSettings.autoPlay ?? true,
                showQualityFeedback: newSettings.showQualityFeedback ?? true,
                skipCompleted: newSettings.skipCompleted ?? false,
            }
        }
    },
    { immediate: true, deep: true }
)

onMounted(() => {
    labels.value.title = loc.t('session.start.title')
    labels.value.sessionInfo = loc.t('session.start.info')
    labels.value.exercise = loc.t('session.start.exercise')
    labels.value.items = loc.t('session.start.items')
    labels.value.duration = loc.t('session.start.duration')
    labels.value.instructions = loc.t('session.start.instructions')
    labels.value.settings = loc.t('session.start.settings')
    labels.value.autoPlay = loc.t('session.start.autoPlay')
    labels.value.autoPlayDescription = loc.t('session.start.autoPlayDescription')
    labels.value.showQuality = loc.t('session.start.showQuality')
    labels.value.showQualityDescription = loc.t('session.start.showQualityDescription')
    labels.value.skipCompleted = loc.t('session.start.skipCompleted')
    labels.value.skipCompletedDescription = loc.t('session.start.skipCompletedDescription')
    labels.value.tips = loc.t('session.start.tips')
    labels.value.start = loc.t('session.start.startButton')
    labels.value.cancel = loc.t('common.cancel')
})

watch(() => props.visible, (newValue) => {
    isVisible.value = newValue
})

watch(isVisible, (newValue) => {
    emit('update:visible', newValue)
})

const handleStart = () => {
    emit('start', settings.value)
    isVisible.value = false
}

const handleCancel = () => {
    emit('cancel')
    isVisible.value = false
}

// Expose for testing
defineExpose({
    settings,
    handleStart,
    handleCancel
})
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

.space-y-1>*+* {
    margin-top: 0.25rem;
}
</style>
