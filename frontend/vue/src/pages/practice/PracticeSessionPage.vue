<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <Button icon="pi pi-arrow-left" severity="secondary" text @click="handleBack"
                        :label="loc.t('common.back')" />
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {{ exercise?.name || loc.t('session.title') }}
                        </h1>
                        <p v-if="currentSession" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {{ loc.t('session.status.inProgress') }}
                        </p>
                    </div>
                </div>

                <Button v-if="currentSession && !sessionStore.isRecording" icon="pi pi-times" severity="danger" text
                    @click="showAbandonDialog = true" :label="loc.t('session.abandon')" />
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 gap-4">
                <ProgressSpinner />
                <p class="text-gray-600 dark:text-gray-400">
                    {{ loc.t('common.loading') }}...
                </p>
            </div>

            <!-- Main Content -->
            <div v-else-if="currentSession" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column: Recording & Navigation -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <!-- Recording Controls -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-microphone" />
                                <span>{{ loc.t('recording.title') }}</span>
                            </div>
                        </template>
                        <template #content>
                            <RecordingControls :show-quality-indicator="true" :show-tips="!sessionStore.isRecording"
                                :enable-quality-warnings="true" @start="handleRecordingStart"
                                @stop="handleRecordingStop" @error="handleRecordingError" />
                        </template>
                    </Card>

                    <!-- Item Navigation -->
                    <ItemNavigation :show-quick-jump="true" :show-keyboard-shortcuts="true"
                        :enable-keyboard="!isDialogOpen" @next="handleItemNext" @previous="handleItemPrevious"
                        @jump="handleItemJump" @complete="handleItemComplete" />

                    <!-- Instructions -->
                    <Card v-if="!sessionStore.isRecording && !hasStartedRecording"
                        class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                        <template #content>
                            <div class="flex flex-col gap-3">
                                <div class="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-semibold">
                                    <i class="pi pi-info-circle text-xl" />
                                    <span>{{ loc.t('session.instructions.title') }}</span>
                                </div>
                                <ol class="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                    <li>{{ loc.t('session.instructions.step1') }}</li>
                                    <li>{{ loc.t('session.instructions.step2') }}</li>
                                    <li>{{ loc.t('session.instructions.step3') }}</li>
                                    <li>{{ loc.t('session.instructions.step4') }}</li>
                                </ol>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Right Column: Progress -->
                <div class="lg:col-span-1">
                    <div class="sticky top-6">
                        <SessionProgress :show-item-list="true" />
                    </div>
                </div>
            </div>

            <!-- No Session State -->
            <div v-else class="flex flex-col items-center justify-center py-12 gap-4">
                <i class="pi pi-inbox text-6xl text-gray-400" />
                <p class="text-xl text-gray-600 dark:text-gray-400">
                    {{ loc.t('session.empty.noSessions') }}
                </p>
                <Button :label="loc.t('session.start')" icon="pi pi-play" @click="handleBack" />
            </div>
        </div>

        <!-- Session Summary Dialog -->
        <SessionSummary v-model:visible="showSummary" :show-item-breakdown="true" @view-details="handleViewDetails"
            @start-new="handleStartNew" />

        <!-- Abandon Confirmation Dialog -->
        <Dialog v-model:visible="showAbandonDialog" modal :closable="true" class="w-full max-w-md">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-2xl" />
                    <span class="text-xl font-bold">{{ loc.t('session.dialogs.abandon.title') }}</span>
                </div>
            </template>

            <div class="flex flex-col gap-4">
                <p class="text-gray-700 dark:text-gray-300">
                    {{ loc.t('session.dialogs.abandon.message') }}
                </p>
                <div v-if="sessionStore.progressPercentage > 0"
                    class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p class="text-sm text-yellow-800 dark:text-yellow-200">
                        {{ loc.t('session.warnings.unsavedProgress') }}: {{ sessionStore.progressPercentage }}%
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3 justify-end">
                    <Button :label="loc.t('session.dialogs.abandon.cancel')" severity="secondary" outlined
                        @click="showAbandonDialog = false" />
                    <Button :label="loc.t('session.dialogs.abandon.confirm')" severity="danger"
                        @click="handleAbandon" />
                </div>
            </template>
        </Dialog>

        <!-- Complete Confirmation Dialog -->
        <Dialog v-model:visible="showCompleteDialog" modal :closable="true" class="w-full max-w-md">
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-2xl" />
                    <span class="text-xl font-bold">{{ loc.t('session.dialogs.complete.title') }}</span>
                </div>
            </template>

            <div class="flex flex-col gap-4">
                <p class="text-gray-700 dark:text-gray-300">
                    {{ loc.t('session.dialogs.complete.message') }}
                </p>
                <div
                    class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-green-800 dark:text-green-200">
                            {{ loc.t('session.progress.items', {
                                completed: sessionStore.completedItemsCount, total:
                            sessionStore.totalItems }) }}
                        </span>
                        <Badge :value="sessionStore.progressPercentage + '%'" severity="success" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3 justify-end">
                    <Button :label="loc.t('session.dialogs.complete.cancel')" severity="secondary" outlined
                        @click="showCompleteDialog = false" />
                    <Button :label="loc.t('session.dialogs.complete.confirm')" severity="success"
                        @click="handleComplete" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useLocalizationStore } from '@/stores/localization'
import { usePracticeSessionStore } from '@/stores/practiceSession'
import { useMessagingStore } from '@/stores/messaging'
import RecordingControls from '@/components/recording/RecordingControls.vue'
import SessionProgress from '@/components/session/SessionProgress.vue'
import ItemNavigation from '@/components/session/ItemNavigation.vue'
import SessionSummary from '@/components/session/SessionSummary.vue'
import type { Exercise } from '@/stores/practiceSession/types'

// Services
const loc = useLocalizationStore()
const sessionStore = usePracticeSessionStore()
const messaging = useMessagingStore()
const route = useRoute()
const router = useRouter()

// Local state
const isLoading = ref(false)
const hasStartedRecording = ref(false)
const recordingBlob = ref<Blob | null>(null)
const showSummary = ref(false)
const showAbandonDialog = ref(false)
const showCompleteDialog = ref(false)
const exercise = ref<Exercise | null>(null)

// Computed
const currentSession = computed(() => sessionStore.currentSession)
const isDialogOpen = computed(() =>
    showSummary.value || showAbandonDialog.value || showCompleteDialog.value
)

// Methods
async function initializeSession() {
    const exerciseId = route.params.exerciseId as string

    if (!exerciseId) {
        void messaging.error(loc.t('errors.invalidParameters'))
        router.push({ name: 'exercises' })
        return
    }

    isLoading.value = true

    try {
        // In a real app, fetch exercise data from API
        // For now, create mock data
        exercise.value = {
            id: exerciseId,
            name: 'Pronunciation Practice',
            items: [
                { id: 'item1', text: 'Hello', repeatCount: 2, metadata: {} },
                { id: 'item2', text: 'World', repeatCount: 1, metadata: {} },
                { id: 'item3', text: 'Test', repeatCount: 1, metadata: {} },
            ],
            repeatCount: 1,
            metadata: { itemCount: 4 },
        }

        await sessionStore.startSession(exerciseId, exercise.value)

        // Load exercise items into store
        sessionStore.exerciseItems = exercise.value.items
    } catch (error) {
        void messaging.error(loc.t('session.errors.startFailed'))
        router.push({ name: 'exercises' })
    } finally {
        isLoading.value = false
    }
}

function handleBack() {
    if (currentSession.value && sessionStore.progressPercentage > 0) {
        showAbandonDialog.value = true
    } else {
        router.push({ name: 'exercises' })
    }
}

function handleRecordingStart() {
    hasStartedRecording.value = true
}

function handleRecordingStop(blob: Blob) {
    recordingBlob.value = blob
}

function handleRecordingError(error: Error) {
    console.error('Recording error:', error)
    void messaging.error(error.message)
}

function handleItemNext() {
    // Mark timestamp for completed item
    if (sessionStore.currentItem) {
        sessionStore.markItemTimestamp(
            sessionStore.currentItem.id,
            sessionStore.currentItem.text,
            sessionStore.currentIteration
        )
    }
}

function handleItemPrevious() {
    // Just navigate, no timestamp needed
}

function handleItemJump(index: number) {
    // Navigate to item
}

async function handleItemComplete() {
    // Mark timestamp for last item
    if (sessionStore.currentItem) {
        sessionStore.markItemTimestamp(
            sessionStore.currentItem.id,
            sessionStore.currentItem.text,
            sessionStore.currentIteration
        )
    }

    // Check if all items are complete
    if (sessionStore.progressPercentage >= 100) {
        showCompleteDialog.value = true
    } else {
        void messaging.warning(loc.t('session.warnings.incompleteItems'))
    }
}

async function handleComplete() {
    if (!recordingBlob.value) {
        void messaging.error(loc.t('recording.errors.notRecording'))
        return
    }

    showCompleteDialog.value = false
    isLoading.value = true

    try {
        // Create results for all timestamps
        for (const timestamp of sessionStore.timestamps) {
            if (!timestamp.resultId) {
                await sessionStore.createResult(
                    timestamp.exerciseItemId,
                    timestamp.iteration
                )
            }
        }

        // Complete session with audio
        await sessionStore.completeSession(recordingBlob.value)

        // Show summary
        showSummary.value = true
    } catch (error) {
        void messaging.error(loc.t('session.errors.completionFailed'))
    } finally {
        isLoading.value = false
    }
}

async function handleAbandon() {
    showAbandonDialog.value = false
    isLoading.value = true

    try {
        await sessionStore.abandonSession()
        router.push({ name: 'exercises' })
    } catch (error) {
        void messaging.error(loc.t('errors.sessionAbandonFailed'))
    } finally {
        isLoading.value = false
    }
}

function handleViewDetails() {
    router.push({
        name: 'session-results',
        params: { sessionId: currentSession.value?.id },
    })
}

function handleStartNew() {
    sessionStore.resetSession()
    router.push({ name: 'exercises' })
}

// Lifecycle
onMounted(() => {
    void initializeSession()
})

onUnmounted(() => {
    // Cleanup if needed, but don't reset session
    // User might navigate away temporarily
})

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    if (currentSession.value && sessionStore.progressPercentage > 0) {
        e.preventDefault()
        e.returnValue = ''
    }
})
</script>
