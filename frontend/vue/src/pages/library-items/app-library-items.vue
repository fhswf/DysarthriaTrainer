<template>
    <div class="flex flex-col h-full">
        <TableSetup :api-service="libraryItemApiService" :columns="libraryItemColumns"
            :initial-state="initialTableState" :features="tableFeatures" :table-config="tableConfig"
            :filter-config="filterConfig" data-key="id" i18n-key="libraryItems" storage-key="table-library-items"
            @create="handleCreate" @view="handleView" @edit="handleEdit" @error="handleError">
            <!-- Custom column: Item Type with icon -->
            <template #column-item_type="{ data }">
                <div v-if="data" class="flex items-center gap-2">
                    <i :class="getItemTypeIcon(data.item_type)" class="text-lg text-primary" />
                    <span class="font-medium">
                        {{ loc.t(`libraryItems.itemTypes.${data.item_type}`) }}
                    </span>
                </div>
            </template>

            <!-- Custom column: Contents preview (languages) -->
            <template #column-contents="{ data }">
                <div v-if="data" class="flex flex-wrap gap-1">
                    <Tag v-for="content in data.contents" :key="content.id" :value="content.language.toUpperCase()"
                        severity="info" size="small" />
                </div>
            </template>

            <!-- Custom column: Text content preview -->
            <template #column-text_preview="{ data }">
                <div v-if="data && data.contents.length > 0" class="max-w-md">
                    <p class="text-sm text-surface-700 dark:text-surface-300 truncate">
                        {{ data.contents[0].text_content }}
                    </p>
                </div>
            </template>

            <!-- Custom column: Repetitions with badge -->
            <template #column-repetitions="{ data }">
                <div v-if="data" class="flex justify-center">
                    <Badge v-if="data.repetitions" :value="formatRepetitions(data.repetitions)" severity="info" />
                    <span v-else class="text-surface-400">-</span>
                </div>
            </template>

            <!-- Custom column: Duration -->
            <template #column-duration_seconds="{ data }">
                <div v-if="data" class="flex justify-center">
                    <span v-if="data.duration_seconds" class="text-sm">
                        {{ formatDuration(data.duration_seconds) }}
                    </span>
                    <span v-else class="text-surface-400">-</span>
                </div>
            </template>

            <!-- Custom column: Display Order -->
            <template #column-display_order="{ data }">
                <div v-if="data" class="flex justify-center">
                    <Badge :value="data.display_order" severity="secondary" />
                </div>
            </template>

            <!-- Custom column: Created At -->
            <template #column-created_at="{ data }">
                <div v-if="data" class="text-sm text-surface-600 dark:text-surface-400">
                    {{ formatDate(data.created_at) }}
                </div>
            </template>
        </TableSetup>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TableSetup from '@/components/TableSetup/TableSetup.vue'
import type { TableApiService } from '@/components/TableSetup/TableSetup.types'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import { useAuthStore } from '@/stores/auth'
import { libraryItemsApi } from '@/api/exercises'
import type { LibraryItem, LibraryItemListParams, LibraryItemType } from '@/api/exercises'
import {
    libraryItemColumns,
    filterConfig,
    tableFeatures,
    tableConfig,
    initialTableState,
} from './config/libraryItemColumns'
import {
    getItemTypeIcon,
    formatDuration,
    formatRepetitions,
} from '@/utils/libraryItems'

const router = useRouter()
const loc = useLocalizationStore()
const messaging = useMessagingStore()
const auth = useAuthStore()

// RBAC permissions
const canEdit = ref(false)

onMounted(async () => {
    // Initialize RBAC permissions
    canEdit.value = (await auth.hasRole('admin')) || (await auth.hasRole('therapist'))
})

/**
 * TableSetup API Service Adapter
 *
 * ⚠️ CRITICAL: Adapts backend response format to TableSetup expectations
 * - Backend returns: { items: [], total: number }
 * - TableSetup expects: { results: [], count: number }
 */
const libraryItemApiService: TableApiService<LibraryItem> = {
    /**
     * List library items with TableSetup parameters
     */
    list: async (
        params: Record<string, unknown>,
        signal?: AbortSignal
    ): Promise<{ count: number; results: LibraryItem[] }> => {
        // Transform TableSetup params to API params
        const apiParams: LibraryItemListParams = {
            limit: params.limit as number,
            offset: params.offset as number,
            ordering:
                params.sortOrder === -1 ? `-${params.sortField}` : (params.sortField as string),
            search: 'search' in params ? (params.search as string) : undefined,
            item_type: params.item_type as LibraryItemType | undefined,
            language: params.language as string | undefined,
            has_audio: params.has_audio as boolean | undefined,
            has_video: params.has_video as boolean | undefined,
        }

        // Call API with signal for cancellation
        const response = await libraryItemsApi.list(apiParams, signal)

        // Adapt response format: items/total → count/results
        return {
            count: response.total,
            results: response.items,
        }
    },

    /**
     * Delete a library item
     */
    delete: async (id: string | number) => {
        await libraryItemsApi.delete(String(id))
    },
}

/**
 * Format date to localized string
 */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(loc.currentLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Handle create button click
 */
function handleCreate() {
    void router.push('/library-item-form?mode=create')
}

/**
 * Handle view action
 */
function handleView(item: LibraryItem) {
    void router.push(`/library-item-form?mode=view&id=${item.id}`)
}

/**
 * Handle edit action
 */
function handleEdit(item: LibraryItem) {
    if (!canEdit.value) {
        void (async () => {
            await messaging.warn('You do not have permission to edit library items')
        })()
        return
    }

    void router.push(`/library-item-form?mode=edit&id=${item.id}`)
}

/**
 * Handle table errors
 */
function handleError(error: Error) {
    void (async () => {
        await messaging.error('An error occurred', error.message)
    })()
}
</script>
