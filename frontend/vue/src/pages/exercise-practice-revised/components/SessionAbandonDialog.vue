<template>
    <Dialog v-model:visible="isVisible" :header="labels.title" modal :closable="false" :dismissable-mask="false"
        class="max-w-md w-full mx-4">
        <div class="space-y-6 py-4">
            <!-- Warning Icon -->
            <div class="flex justify-center">
                <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle text-orange-600 text-3xl" />
                </div>
            </div>

            <!-- Warning Message -->
            <div class="text-center space-y-2">
                <h3 class="text-xl font-bold text-surface-900">
                    {{ labels.confirmTitle }}
                </h3>
                <p class="text-surface-600">
                    {{ labels.confirmMessage }}
                </p>
            </div>

            <!-- Progress Info -->
            <div v-if="itemsCompleted > 0" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start gap-3">
                    <i class="pi pi-info-circle text-blue-600 text-xl mt-0.5" />
                    <div class="flex-1 space-y-2">
                        <p class="text-sm text-blue-900 font-medium">
                            {{ labels.progressInfo }}
                        </p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-blue-800">{{ labels.completedItems }}</span>
                            <span class="font-semibold text-blue-900">{{ itemsCompleted }} / {{ totalItems }}</span>
                        </div>
                        <div v-if="completionPercentage" class="w-full bg-blue-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                :style="{ width: `${completionPercentage}%` }" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Unsaved Recordings Warning -->
            <div v-if="hasUnsavedRecordings" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-start gap-3">
                    <i class="pi pi-exclamation-circle text-red-600 text-xl mt-0.5" />
                    <div>
                        <p class="text-sm font-semibold text-red-900 mb-1">
                            {{ labels.unsavedWarning }}
                        </p>
                        <p class="text-sm text-red-800">
                            {{ labels.unsavedMessage }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Consequences List -->
            <div class="space-y-2">
                <p class="text-sm font-semibold text-surface-900">
                    {{ labels.consequences }}
                </p>
                <ul class="space-y-2 text-sm text-surface-700">
                    <li class="flex items-start gap-2">
                        <i class="pi pi-times-circle text-red-500 mt-0.5" />
                        <span>{{ labels.loseProgress }}</span>
                    </li>
                    <li v-if="hasUnsavedRecordings" class="flex items-start gap-2">
                        <i class="pi pi-times-circle text-red-500 mt-0.5" />
                        <span>{{ labels.loseRecordings }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <i class="pi pi-times-circle text-red-500 mt-0.5" />
                        <span>{{ labels.noScore }}</span>
                    </li>
                </ul>
            </div>

            <!-- Alternative Action -->
            <div v-if="showSaveOption" class="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center gap-3">
                    <i class="pi pi-lightbulb text-green-600 text-lg" />
                    <p class="text-sm text-green-900">
                        {{ labels.saveAlternative }}
                    </p>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex flex-col gap-3">
                <!-- Primary Actions -->
                <div class="flex gap-3">
                    <Button :label="labels.keepWorking" icon="pi pi-arrow-left" severity="secondary" class="flex-1"
                        @click="handleCancel" autofocus />
                    <Button v-if="showSaveButton" :label="labels.saveAndExit" icon="pi pi-save" class="flex-1"
                        @click="handleSaveAndExit" />
                </div>

                <!-- Danger Action -->
                <Button :label="labels.abandonSession" icon="pi pi-times" severity="danger" outlined class="w-full"
                    @click="handleConfirm" />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

interface Props {
    /** Dialog visibility */
    visible: boolean

    /** Number of completed items */
    itemsCompleted: number

    /** Total items in session */
    totalItems: number

    /** Has unsaved recordings */
    hasUnsavedRecordings?: boolean

    /** Show save option */
    showSaveOption?: boolean

    /** Show save button */
    showSaveButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    hasUnsavedRecordings: false,
    showSaveOption: true,
    showSaveButton: false
})

interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
    (e: 'save-and-exit'): void
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
    confirmTitle: '',
    confirmMessage: '',
    progressInfo: '',
    completedItems: '',
    unsavedWarning: '',
    unsavedMessage: '',
    consequences: '',
    loseProgress: '',
    loseRecordings: '',
    noScore: '',
    saveAlternative: '',
    keepWorking: '',
    saveAndExit: '',
    abandonSession: ''
})

onMounted(() => {
    labels.value.title = loc.t('session.abandon.title')
    labels.value.confirmTitle = loc.t('session.abandon.confirmTitle')
    labels.value.confirmMessage = loc.t('session.abandon.confirmMessage')
    labels.value.progressInfo = loc.t('session.abandon.progressInfo')
    labels.value.completedItems = loc.t('session.abandon.completedItems')
    labels.value.unsavedWarning = loc.t('session.abandon.unsavedWarning')
    labels.value.unsavedMessage = loc.t('session.abandon.unsavedMessage')
    labels.value.consequences = loc.t('session.abandon.consequences')
    labels.value.loseProgress = loc.t('session.abandon.loseProgress')
    labels.value.loseRecordings = loc.t('session.abandon.loseRecordings')
    labels.value.noScore = loc.t('session.abandon.noScore')
    labels.value.saveAlternative = loc.t('session.abandon.saveAlternative')
    labels.value.keepWorking = loc.t('session.abandon.keepWorking')
    labels.value.saveAndExit = loc.t('session.abandon.saveAndExit')
    labels.value.abandonSession = loc.t('session.abandon.abandonButton')
})

const completionPercentage = computed(() => {
    if (props.totalItems === 0) return 0
    return Math.round((props.itemsCompleted / props.totalItems) * 100)
})

watch(() => props.visible, (newValue) => {
    isVisible.value = newValue
})

watch(isVisible, (newValue) => {
    emit('update:visible', newValue)
})

const handleConfirm = () => {
    emit('confirm')
    isVisible.value = false
}

const handleCancel = () => {
    emit('cancel')
    isVisible.value = false
}

const handleSaveAndExit = () => {
    emit('save-and-exit')
    isVisible.value = false
}
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
</style>
