<template>
  <div class="flex flex-col h-full">
    <TableSetup ref="tableSetupRef" :api-service="sessionApiService" :columns="sessionColumns"
      :filter-config="sessionFilters" :initial-state="{
        sortField: undefined,
        sortOrder: undefined,
      }" :features="{
        search: false,
        filters: true,
        sort: false,
        refresh: true,
        export: true,
        create: false,
        deleteAll: false,
        viewAction: true,
        editAction: false,
        deleteAction: true,
      }" :table-config="{
        rowHeight: 70,
        scrollHeight: 'calc(100vh - 300px)',
        striped: true,
        size: 'small',
        selectionMode: 'multiple',
      }" data-key="id" i18n-key="practiceSessions" storage-key="table-practice-sessions" @view="handleView"
      @delete="handleDelete" @error="handleError">
      <!-- Custom column: Status badge -->
      <template #column-status="{ data }">
        <Tag v-if="data" :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)"
          :icon="getStatusIcon(data.status)" />
      </template>

      <!-- Custom column: Exercise name with link -->
      <template #column-exercise_id="{ data }">
        <div v-if="data" class="flex flex-col">
          <router-link :to="`/exercises?id=${data.exercise_id}`" class="text-primary hover:underline font-medium">
            {{ getExerciseName(data.exercise_id) }}
          </router-link>
          <span class="text-xs text-gray-500">{{ data.exercise_id }}</span>
        </div>
      </template>

      <!-- Custom column: Items progress -->
      <template #column-completed_items="{ data }">
        <div v-if="data" class="flex items-center gap-2">
          <span class="font-medium">{{ data.completed_items }} / {{ data.total_items }}</span>
          <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
            <div class="bg-primary h-2 rounded-full transition-all"
              :style="{ width: `${getCompletionPercentage(data)}%` }" />
          </div>
        </div>
      </template>

      <!-- Custom column: Results count with quality indicator -->
      <template #column-results="{ data }">
        <div v-if="data && data.results" class="flex items-center gap-2">
          <Tag :value="String(data.results.length)" severity="info" />
          <i v-if="data.results.length > 0" class="pi pi-check-circle text-green-500" v-tooltip.top="'Has results'" />
        </div>
      </template>

      <!-- Custom actions slot -->
      <template #actions="{ data }">
        <div v-if="data" class="flex gap-2">
          <Button icon="pi pi-eye" severity="secondary" text size="small"
            v-tooltip.top="loc.t('common.actions.viewDetails')" @click="handleView(data)" />
          <Button v-if="data.status === 'completed' && data.completed_items > 0" icon="pi pi-chart-line"
            severity="success" text size="small" v-tooltip.top="loc.t('practiceSessions.actions.analyze')"
            @click="handleAnalyze(data)" />
          <Button v-if="data.status === 'completed'" icon="pi pi-download" severity="info" text size="small"
            v-tooltip.top="loc.t('practiceSessions.actions.download')" @click="handleDownload(data)" />
          <Button icon="pi pi-trash" severity="danger" text size="small" v-tooltip.top="loc.t('common.actions.delete')"
            @click="handleDelete(data)" />
        </div>
      </template>
    </TableSetup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { TableSetup } from '@/components/TableSetup'
import type { TableApiService } from '@/components/TableSetup'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import {
  sessionsWithResultsApi,
  type PracticeSessionWithResults,
} from '@/api/practiceSession/practiceSessionsWithResults.api'
import { sessionColumns } from './config/sessionColumns'
import { sessionFilters } from './config/sessionFilters'

const router = useRouter()
const loc = useLocalizationStore()
const messaging = useMessagingStore()
const confirm = useConfirm()

// Ref for TableSetup component
const tableSetupRef = ref<InstanceType<typeof TableSetup> | null>(null)

/**
 * API Service wrapper for TableSetup
 *
 * ⚠️ CRITICAL: Must accept and forward signal parameter for race condition prevention
 */
const sessionApiService: TableApiService<PracticeSessionWithResults> = {
  baseUrl: sessionsWithResultsApi.baseUrl,

  list: async (params: Record<string, unknown>, signal?: AbortSignal) => {
    // Build API parameters, excluding TableSetup control parameters
    const apiParams: Record<string, unknown> = {}

    // Pagination
    if (params.limit !== undefined) {
      apiParams.limit = params.limit
    }
    if (params.offset !== undefined) {
      apiParams.offset = params.offset
    }

    // Note: Sorting not yet supported by backend - ordering parameter removed

    // Filters
    if (params.status_filter) {
      apiParams.status_filter = params.status_filter
    }
    if (params.created_at__gte) {
      apiParams.created_at__gte = params.created_at__gte
    }
    if (params.created_at__lte) {
      apiParams.created_at__lte = params.created_at__lte
    }
    if (params.completed_at__gte) {
      apiParams.completed_at__gte = params.completed_at__gte
    }
    if (params.completed_at__lte) {
      apiParams.completed_at__lte = params.completed_at__lte
    }

    // Call API with signal for cancellation support
    return await sessionsWithResultsApi.list(apiParams, signal)
  },

  // Note: Delete functionality would need to be implemented in the API
  // For now, we'll show the action but it won't work until backend supports it
  delete: async (id) => {
    await sessionsWithResultsApi.delete(id)
  },
}

/**
 * Get status label for translation
 */
function getStatusLabel(status: string): string {
  return loc.t(`practiceSessions.status.${status}`)
}

/**
 * Get status severity for Tag component
 */
function getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const severityMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    completed: 'success',
    in_progress: 'warning',
    abandoned: 'danger',
  }
  return severityMap[status] || 'info'
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    completed: 'pi pi-check-circle',
    in_progress: 'pi pi-spinner',
    abandoned: 'pi pi-times-circle',
  }
  return iconMap[status] || 'pi pi-circle'
}

/**
 * Get exercise name (placeholder - would need to fetch from API)
 */
function getExerciseName(exerciseId: string): string {
  // TODO: Fetch exercise names and cache them
  return 'Exercise'
}

/**
 * Calculate completion percentage
 */
function getCompletionPercentage(session: PracticeSessionWithResults): number {
  if (session.total_items === 0) return 0
  return Math.round((session.completed_items / session.total_items) * 100)
}

function handleView(session: PracticeSessionWithResults) {
  // Navigate to session detail page with sessionId query parameter
  void router.push(`/session-details?sessionId=${session.id}`)
}

function handleAnalyze(session: PracticeSessionWithResults) {
  // Navigate to session analysis page with session UUID as query parameter
  void router.push(`/session-analysis?sessionId=${session.id}`)
}

function handleDownload(session: PracticeSessionWithResults) {
  // Download session results as JSON
  const dataStr = JSON.stringify(session, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `session-${session.id}-${new Date().getTime()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  void messaging.success(loc.t('practiceSessions.messages.downloadSuccess'))
}

function handleDelete(session: PracticeSessionWithResults) {
  const message = loc.t('practiceSessions.confirmDelete.message')
  const header = loc.t('practiceSessions.confirmDelete.title')

  confirm.require({
    message,
    header,
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        // Delete session (includes all results and media files)
        await sessionsWithResultsApi.delete(session.id)

        // Refresh table to show updated list
        if (tableSetupRef.value) {
          await tableSetupRef.value.refresh()
        }

        void messaging.success(loc.t('practiceSessions.messages.deleteSuccess'))
      } catch (error) {
        void messaging.error(
          loc.t('practiceSessions.errors.deleteFailed'),
          error instanceof Error ? error.message : String(error)
        )
      }
    },
  })
}

function handleError(error: Error) {
  const message = loc.t('practiceSessions.errors.loadFailed')
  void messaging.error(message, error.message)
}
</script>
