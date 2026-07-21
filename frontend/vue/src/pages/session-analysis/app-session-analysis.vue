<template>
  <div class="session-analysis-page h-0 grow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-6">
        <Button icon="pi pi-arrow-left" :label="loc.t('common.back')" text @click="handleBack" class="mb-4" />

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ loc.t('sessionAnalysis.pageTitle') }}
            </h1>
            <p class="mt-2 text-sm text-gray-600">
              {{ loc.t('sessionAnalysis.pageDescription') }}
            </p>
          </div>

          <div v-if="sessionId" class="text-sm text-gray-500">
            <div>{{ loc.t('sessionAnalysis.sessionId') }}: <code
                class="bg-gray-100 px-2 py-1 rounded">{{ sessionId }}</code></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <Message v-if="!sessionId" severity="error" :closable="false" class="mb-6">
        {{ loc.t('sessionAnalysis.errors.noSessionId') }}
      </Message>

      <!-- Loading State -->
      <Card v-if="loading && sessionId" class="mb-6">
        <template #content>
          <div class="flex flex-col gap-4">
            <Skeleton width="100%" height="2rem" />
            <Skeleton width="100%" height="8rem" />
          </div>
        </template>
      </Card>

      <!-- Load Error State -->
      <Message v-if="loadError" severity="error" :closable="false" class="mb-6">
        {{ loadError }}
      </Message>

      <!-- Main Content -->
      <div v-if="sessionId && session && !loading" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left Column: Trigger and Status -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Analysis Trigger Card -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-bolt text-primary"></i>
                <span>{{ loc.t('sessionAnalysis.startAnalysisCard') }}</span>
              </div>
            </template>
            <template #content>
              <SessionAnalysisTrigger :session-id="sessionId" :disabled="!sessionId" @started="handleAnalysisStarted"
                @completed="handleAnalysisCompleted" @error="handleAnalysisError" />
            </template>
          </Card>

          <!-- Session Info Card -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <span>{{ loc.t('sessionAnalysis.sessionInfo') }}</span>
                <Tag :value="statusLabel" :severity="statusSeverity" />
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <!-- Session ID -->
                <div class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.sessionId') }}</label>
                  <div class="info-value font-mono text-xs break-all">{{ session.id }}</div>
                </div>

                <!-- Exercise -->
                <div class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.exerciseName') }}</label>
                  <div class="info-value">{{ session.exercise_id }}</div>
                </div>

                <!-- Started At -->
                <div class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.startedAt') }}</label>
                  <div class="info-value text-sm">
                    {{ formatDate(session.started_at) }}
                    <div class="text-gray-500 text-xs mt-1">{{ formatTime(session.started_at) }}</div>
                  </div>
                </div>

                <!-- Completed At -->
                <div v-if="session.completed_at" class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.completedAt') }}</label>
                  <div class="info-value text-sm">
                    {{ formatDate(session.completed_at) }}
                    <div class="text-gray-500 text-xs mt-1">{{ formatTime(session.completed_at) }}</div>
                  </div>
                </div>

                <!-- Progress -->
                <div class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.progress') }}</label>
                  <div class="space-y-2">
                    <ProgressBar :value="progressPercentage" />
                    <div class="info-value text-sm">
                      {{ session.completed_items }} / {{ session.total_items }} items
                    </div>
                  </div>
                </div>

                <!-- Recording Duration -->
                <div v-if="session.recording_duration_ms" class="info-item">
                  <label class="info-label">{{ loc.t('sessionDetails.recordingDuration') }}</label>
                  <div class="info-value">{{ formattedDuration }}</div>
                </div>

                <!-- Results Count -->
                <div class="info-item">
                  <label class="info-label">{{ loc.t('sessionAnalysis.resultsAvailable') }}</label>
                  <div class="info-value">
                    <Tag :value="String(session.results?.length || 0)" severity="info" />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Right Column: Progress Display -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Quick Actions -->
          <Card>
            <template #title>
              {{ loc.t('sessionAnalysis.quickActions') }}
            </template>
            <template #content>
              <div class="flex flex-col lg:flex-row gap-2">
                <Button :label="loc.t('sessionAnalysis.viewSession')" icon="pi pi-eye" severity="secondary" outlined
                  @click="handleViewSession" class="flex-1" />
                <Button :label="loc.t('sessionAnalysis.viewResults')" icon="pi pi-list" severity="secondary" outlined
                  @click="handleViewResults" class="flex-1" />
                <Button :label="loc.t('sessionAnalysis.editExercise')" icon="pi pi-pencil" severity="secondary" outlined
                  @click="handleEditExercise" class="flex-1" />
                <Button v-if="isComplete" :label="loc.t('sessionAnalysis.refreshResults')" icon="pi pi-refresh"
                  severity="info" outlined @click="handleRefreshResults" class="flex-1" />
              </div>
            </template>
          </Card>

          <!-- Progress Display -->
          <SessionAnalysisProgress :progress="progress" :is-connected="isWebSocketConnected" />

          <!-- Results Summary (shown after completion) -->
          <Card v-if="isComplete && resultsSummary">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-bar text-success"></i>
                <span>{{ loc.t('sessionAnalysis.resultsSummary') }}</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="stat-card">
                  <div class="text-3xl font-bold text-primary">{{ resultsSummary.totalProcessed }}</div>
                  <div class="text-sm text-gray-600">{{ loc.t('sessionAnalysis.totalProcessed') }}</div>
                </div>
                <div class="stat-card">
                  <div class="text-3xl font-bold text-success">{{ resultsSummary.successful }}</div>
                  <div class="text-sm text-gray-600">{{ loc.t('sessionAnalysis.successful') }}</div>
                </div>
                <div class="stat-card">
                  <div class="text-3xl font-bold text-orange-500">{{ resultsSummary.withErrors }}</div>
                  <div class="text-sm text-gray-600">{{ loc.t('sessionAnalysis.withErrors') }}</div>
                </div>
                <div class="stat-card">
                  <div class="text-3xl font-bold text-gray-700">{{ resultsSummary.avgScore }}%</div>
                  <div class="text-sm text-gray-600">{{ loc.t('sessionAnalysis.avgScore') }}</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import SessionAnalysisTrigger from '@/components/SessionAnalysisTrigger.vue'
import SessionAnalysisProgress from '@/components/SessionAnalysisProgress.vue'
import { useSessionAnalysis } from '@/composables/useSessionAnalysis'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import { sessionsWithResultsApi } from '@/api/practiceSession/practiceSessionsWithResults.api'
import type { PracticeSessionWithResults } from '@/api/practiceSession/practiceSessionsWithResults.api'

const route = useRoute()
const router = useRouter()
const loc = useLocalizationStore()
const messaging = useMessagingStore()

// Get session ID from query parameter
const sessionId = computed(() => route.query.sessionId as string)

// Session analysis composable
const {
  progress,
  isAnalyzing,
  isComplete,
  hasErrors,
  refreshStatus,
} = useSessionAnalysis({
  sessionId: sessionId.value,
  autoConnect: true,
})

// Local state
const session = ref<PracticeSessionWithResults | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const isWebSocketConnected = ref(false)

// Computed
const statusSeverity = computed(() => {
  const status = session.value?.status?.toLowerCase()
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'info'
    case 'abandoned':
      return 'warning'
    default:
      return 'secondary'
  }
})

const statusLabel = computed(() => {
  const status = session.value?.status?.toLowerCase()
  return status ? loc.t(`sessionDetails.status_${status}`) : 'N/A'
})

const progressPercentage = computed(() => {
  if (!session.value) return 0
  return Math.round((session.value.completed_items / session.value.total_items) * 100)
})

const formattedDuration = computed(() => {
  if (!session.value?.recording_duration_ms) return 'N/A'
  const seconds = Math.floor(session.value.recording_duration_ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

const resultsSummary = computed(() => {
  if (!progress.value || !isComplete.value) return null

  const totalProcessed = progress.value.processed_results
  const withErrors = progress.value.errors.length
  const successful = totalProcessed - withErrors

  return {
    totalProcessed,
    successful,
    withErrors,
    avgScore: 0, // TODO: Calculate from actual results
  }
})

// Methods
async function loadSession() {
  loading.value = true
  loadError.value = null

  try {
    if (!sessionId.value) {
      loadError.value = loc.t('sessionAnalysis.errors.noSessionId')
      return
    }

    session.value = await sessionsWithResultsApi.get(sessionId.value)
  } catch (err: any) {
    console.error('Failed to load session:', err)
    loadError.value = err.response?.data?.message || loc.t('sessionAnalysis.errors.loadFailed')
    messaging.error(loadError.value || 'Failed to load session')
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push('/practice-sessions')
}

function handleViewSession() {
  router.push(`/session-details?sessionId=${sessionId.value}`)
}

function handleViewResults() {
  // Navigate to practice sessions page
  router.push('/practice-sessions')
}

function handleEditExercise() {
  // Navigate to exercise editor with the exercise ID
  if (session.value?.exercise_id) {
    router.push(`/exercise-editor?mode=edit&id=${session.value.exercise_id}`)
  }
}

function handleRefreshResults() {
  // Reload page to refresh all data
  window.location.reload()
}

function handleAnalysisStarted() {
  console.log('[SessionAnalysisPage] ✅ Analysis started for session:', sessionId.value)
  console.log('[SessionAnalysisPage] WebSocket connecting for real-time updates...')
  isWebSocketConnected.value = true
}

function handleAnalysisCompleted() {
  console.log('[SessionAnalysisPage] ✅ Analysis completed successfully')
  console.log('[SessionAnalysisPage] WebSocket disconnected')
  isWebSocketConnected.value = false
  // Optionally refresh status to get final results
  refreshStatus().catch(err => console.error('[SessionAnalysisPage] Failed to refresh status:', err))
}

function handleAnalysisError(error: string) {
  console.error('[SessionAnalysisPage] ❌ Analysis error:', error)
  console.error('[SessionAnalysisPage] Session ID:', sessionId.value)
}

function getSessionStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'info'
    case 'abandoned':
      return 'warning'
    default:
      return 'info'
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return loc.d(date, 'long')
}

function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Time'
  return date.toLocaleTimeString()
}

// Load session info on mount
onMounted(async () => {
  if (sessionId.value) {
    console.log('[SessionAnalysisPage] Mounted with sessionId:', sessionId.value)
    await loadSession()
    console.log('[SessionAnalysisPage] Ready. Click "Start Analysis" to begin.')
  }
})

// Watch for session ID changes
watch(() => route.query.sessionId, (newId) => {
  if (newId) {
    // Reload page with new session ID
    window.location.reload()
  }
})
</script>

<style scoped>
.session-analysis-page {
  background-color: #f9fafb;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

.stat-card {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: center;
}

:deep(.p-card) {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

:deep(.p-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
