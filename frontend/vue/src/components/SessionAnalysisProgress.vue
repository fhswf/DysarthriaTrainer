<template>
  <Card v-if="progress" class="session-analysis-progress">
    <template #title>
      <div class="flex items-center gap-2">
        <i :class="statusIcon" :style="{ color: statusColor }"></i>
        <span>{{ loc.t('sessionAnalysis.progressTitle') }}</span>
      </div>
    </template>

    <template #content>
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between text-sm mb-2">
          <span>{{ loc.t('sessionAnalysis.processed', {
            processed: progress.processed_results,
            total: progress.total_results
          }) }}</span>
          <span class="font-semibold">{{ Math.round(progress.progress_percentage) }}%</span>
        </div>
        <ProgressBar :value="progress.progress_percentage" :show-value="false" :class="progressBarClass" />
      </div>

      <!-- Status Information -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="status-item">
          <div class="text-sm text-gray-500">{{ loc.t('sessionAnalysis.status') }}</div>
          <Tag :value="statusLabel" :severity="statusSeverity" />
        </div>

        <div v-if="progress.started_at" class="status-item">
          <div class="text-sm text-gray-500">{{ loc.t('sessionAnalysis.started') }}</div>
          <div class="font-medium">{{ formatTimestamp(progress.started_at) }}</div>
        </div>

        <div v-if="progress.completed_at" class="status-item">
          <div class="text-sm text-gray-500">{{ loc.t('sessionAnalysis.completed') }}</div>
          <div class="font-medium">{{ formatTimestamp(progress.completed_at) }}</div>
        </div>

        <div v-if="duration" class="status-item">
          <div class="text-sm text-gray-500">{{ loc.t('sessionAnalysis.duration') }}</div>
          <div class="font-medium">{{ duration }}</div>
        </div>
      </div>

      <!-- Current Processing -->
      <div v-if="progress.current_result_id" class="mb-4 p-3 bg-blue-50 rounded">
        <div class="text-sm text-blue-700">
          <i class="pi pi-spin pi-spinner mr-2"></i>
          {{ loc.t('sessionAnalysis.processing') }}: {{ progress.current_result_id }}
        </div>
      </div>

      <!-- Errors -->
      <div v-if="progress.errors.length > 0" class="errors-section">
        <Accordion :multiple="false">
          <AccordionTab>
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-orange-500"></i>
                <span>{{ loc.t('sessionAnalysis.errorCount', { count: progress.errors.length }) }}</span>
              </div>
            </template>
            <div class="error-list max-h-48 overflow-y-auto">
              <div v-for="(error, index) in progress.errors" :key="index"
                class="error-item p-2 mb-2 bg-orange-50 rounded text-sm">
                <div class="font-medium">{{ loc.t('sessionAnalysis.result') }}: {{ error.result_id }}</div>
                <div class="text-gray-700">{{ error.error }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ formatTimestamp(error.timestamp) }}
                </div>
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      <!-- Real-time Connection Status -->
      <div v-if="isConnected" class="mt-3 flex items-center gap-2 text-sm text-green-600">
        <i class="pi pi-circle-fill" style="font-size: 0.5rem"></i>
        <span>{{ loc.t('sessionAnalysis.realtimeConnected') }}</span>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import type { AnalysisProgress } from '@/api/sessionAnalysis/sessionAnalysis.types'
import { useLocalizationStore } from '@/stores/localization'

interface Props {
  progress: AnalysisProgress | null
  isConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: false,
})

const loc = useLocalizationStore()

const statusIcon = computed(() => {
  switch (props.progress?.status) {
    case 'running':
      return 'pi pi-spin pi-spinner'
    case 'completed':
      return 'pi pi-check-circle'
    case 'failed':
      return 'pi pi-times-circle'
    default:
      return 'pi pi-clock'
  }
})

const statusColor = computed(() => {
  switch (props.progress?.status) {
    case 'running':
      return '#3B82F6' // blue
    case 'completed':
      return '#10B981' // green
    case 'failed':
      return '#EF4444' // red
    default:
      return '#6B7280' // gray
  }
})

const statusLabel = computed(() => {
  return loc.t(`sessionAnalysis.status_${props.progress?.status || 'pending'}`)
})

const statusSeverity = computed<'success' | 'info' | 'warning' | 'danger'>(() => {
  switch (props.progress?.status) {
    case 'completed':
      return 'success'
    case 'running':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'warning'
  }
})

const progressBarClass = computed(() => {
  if (props.progress?.status === 'completed') {
    return 'progress-complete'
  }
  if (props.progress?.status === 'failed') {
    return 'progress-error'
  }
  return ''
})

const duration = computed(() => {
  if (!props.progress?.started_at) return null

  const endTime = props.progress.completed_at || (Date.now() / 1000)
  const durationSec = Math.round(endTime - props.progress.started_at)

  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString()
}
</script>

<style scoped>
.session-analysis-progress {
  width: 100%;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-list {
  display: flex;
  flex-direction: column;
}

.error-item {
  border-left: 3px solid #f59e0b;
}

:deep(.progress-complete .p-progressbar-value) {
  background-color: #10B981;
}

:deep(.progress-error .p-progressbar-value) {
  background-color: #EF4444;
}
</style>
