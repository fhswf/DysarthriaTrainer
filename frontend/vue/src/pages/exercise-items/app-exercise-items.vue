<template>
    <div class="flex flex-col h-full">
        <TableSetup :api-service="exerciseItemApiService" :columns="exerciseItemColumns" :initial-state="{
            sortField: 'display_order',
            sortOrder: 1,
        }" :features="{
        search: true,
        filters: false,
        sort: true,
        refresh: true,
        export: true,
        create: false,
        deleteAll: false,
        viewAction: true,
        editAction: true,
        deleteAction: true,
    }" :table-config="{
        rowHeight: 60,
        scrollHeight: 'calc(100vh - 300px)',
        striped: true,
        size: 'small',
        selectionMode: 'multiple',
    }" data-key="id" i18n-key="exerciseItems" storage-key="table-exercise-items" @view="handleView"
            @edit="handleEdit" @error="handleError">
            <!-- Custom column: Item type badge -->
            <template #column-item_type="{ data }">
                <Tag :value="loc.t(`exerciseItems.itemTypes.${(data as ExerciseItem).item_type}`)"
                    :severity="itemTypeSeverity[(data as ExerciseItem).item_type as keyof typeof itemTypeSeverity]"
                    :icon="itemTypeIcons[(data as ExerciseItem).item_type as keyof typeof itemTypeIcons]" />
            </template>

            <!-- Custom column: Exercise ID (truncated) -->
            <template #column-exercise_id="{ data }">
                <span class="font-mono text-xs text-gray-600">
                    {{ (data as ExerciseItem).exercise_id.substring(0, 8) }}...
                </span>
            </template>
        </TableSetup>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Tag from 'primevue/tag';
import TableSetup from '@/components/TableSetup/TableSetup.vue';
import type { TableApiService } from '@/components/TableSetup';
import { useLocalizationStore } from '@/stores/localization';
import { useMessagingStore } from '@/stores/messaging';
import { exerciseItemService } from '@/services/exerciseItemService';
import type { ExerciseItem } from '@/services/exerciseItemService';
import { exerciseItemColumns, itemTypeSeverity, itemTypeIcons } from './config/exerciseItemColumns';

const router = useRouter();
const loc = useLocalizationStore();
const messaging = useMessagingStore();

/**
 * API Service Adapter for TableSetup
 * Wraps exerciseItemService to match TableSetup's expected interface
 */
const exerciseItemApiService: TableApiService<ExerciseItem> = {
    list: async (params: Record<string, unknown>, signal?: AbortSignal) => {
        const apiParams: Record<string, unknown> = {};

        // Map TableSetup params to API params
        if (params.limit !== undefined) apiParams.limit = params.limit;
        if (params.offset !== undefined) apiParams.offset = params.offset;

        // Search - use 'in' operator to check for search parameter
        if ('search' in params) {
            apiParams.search = params.search;
        }

        // Sorting
        if (params.sortField && params.sortOrder !== undefined) {
            const prefix = params.sortOrder === -1 ? '-' : '';
            apiParams.ordering = `${prefix}${params.sortField}`;
        }

        const result = await exerciseItemService.list(apiParams, signal);
        return {
            count: result.total,
            results: result.items,
        };
    },

    delete: async (id: string | number) => {
        // Convert to string and cast as UUID for service method
        await exerciseItemService.delete(String(id) as `${string}-${string}-${string}-${string}-${string}`);
    },
};


/**
 * View exercise item details
 */
function handleView(item: ExerciseItem) {
    void router.push(`/exercise-items/${item.id}`);
}

/**
 * Edit exercise item
 */
function handleEdit(item: ExerciseItem) {
    void router.push(`/exercise-items/${item.id}/edit`);
}

/**
 * Handle errors from TableSetup
 */
function handleError(error: Error) {
    void messaging.error(loc.t('exerciseItems.error', { message: error.message }));
}
</script>

<style scoped>
/* Minimal styling - TableSetup handles most layout */
</style>
