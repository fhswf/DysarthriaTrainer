<template>
    <div class="flex flex-col h-full">
        <TableSetup :api-service="categoryApiService" :columns="exerciseCategoryColumns" :initial-state="{
            sortField: 'sort_order',
            sortOrder: 1,
        }" :features="{
        search: true,
        filters: false,
        sort: true,
        refresh: true,
        export: true,
        create: true,
        deleteAll: false,
        viewAction: true,
        editAction: true,
        deleteAction: true,
    }" :table-config="{
        rowHeight: 60,
        scrollHeight: 'calc(100vh - 250px)',
        striped: true,
        size: 'small',
        selectionMode: 'multiple',
    }" data-key="id" i18n-key="exerciseCategories" storage-key="table-exercise-categories" @create="handleCreate"
            @view="handleView" @edit="handleEdit" @error="handleError">
            <!-- Custom column: Icon preview -->
            <template #column-icon_url="{ data }">
                <div v-if="data" class="flex items-center justify-center">
                    <i v-if="data.icon_url" :class="data.icon_url" class="text-2xl text-primary" />
                    <span v-else class="text-gray-400 text-xs">No icon</span>
                </div>
            </template>

            <!-- Custom column: Name with icon -->
            <template #column-name="{ data }">
                <div v-if="data" class="flex items-center gap-2">
                    <i v-if="data.icon_url" :class="data.icon_url" class="text-xl" />
                    <router-link :to="`/exercises/categories/${data.id}`"
                        class="text-primary hover:underline font-medium">
                        {{ data.name }}
                    </router-link>
                </div>
            </template>
        </TableSetup>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { TableSetup } from '@/components/TableSetup';
import type { TableApiService } from '@/components/TableSetup';
import { useLocalizationStore } from '@/stores/localization';
import { useMessagingStore } from '@/stores/messaging';
import { exerciseCategoryService } from '@/services/exerciseCategoryService';
import type { ExerciseCategory } from '@/services/exerciseCategoryService';
import { exerciseCategoryColumns } from './config/exerciseCategoryColumns';

const router = useRouter();
const loc = useLocalizationStore();
const messaging = useMessagingStore();

/**
 * API Service wrapper for TableSetup
 * 
 * ⚠️ CRITICAL: Must accept and forward signal parameter for race condition prevention
 * ⚠️ CRITICAL: Use 'in' operator for search check, not truthiness
 */
const categoryApiService: TableApiService<ExerciseCategory> = {
    baseUrl: exerciseCategoryService.baseUrl,

    list: async (params: Record<string, unknown>, signal?: AbortSignal) => {
        // Build API parameters, excluding TableSetup control parameters
        const apiParams: Record<string, unknown> = {};

        // Pagination
        if (params.limit !== undefined) {
            apiParams.limit = params.limit;
        }
        if (params.offset !== undefined) {
            apiParams.offset = params.offset;
        }

        // Sorting - map TableSetup format to API format
        if (params.sortField && params.sortOrder !== undefined) {
            const prefix = params.sortOrder === -1 ? '-' : '';
            apiParams.ordering = `${prefix}${params.sortField}`;
        }

        // Search - CRITICAL: Use 'in' operator, not truthiness
        if ('search' in params) {
            apiParams.search = params.search;
        }

        // Call API service with signal for cancellation support
        return await exerciseCategoryService.list(apiParams, signal);
    },

    delete: async (id) => await exerciseCategoryService.delete(id),
};

function handleCreate() {
    void router.push('/exercise-category-form');
}

function handleView(category: ExerciseCategory) {
    void router.push(`/exercise-category-form?id=${category.id}&mode=view`);
}

function handleEdit(category: ExerciseCategory) {
    void router.push(`/exercise-category-form?id=${category.id}&mode=edit`);
}

function handleError(error: Error) {
    const message = loc.t('exerciseCategories.errors.loadFailed');
    void messaging.error(message, error.message);
}
</script>
