<template>
    <div class="flex flex-col h-full">
        <TableSetup ref="tableSetupRef" :api-service="exerciseApiService" :columns="exerciseColumns"
            :filter-config="exerciseFilters" :initial-state="{
                sortField: 'code',
                sortOrder: 1,
            }" :features="{
                search: true,
                filters: true,
                sort: true,
                refresh: true,
                export: true,
                create: true,
                deleteAll: false,
                viewAction: true,
                editAction: true,
                deleteAction: true,
            }" :table-config="{
                rowHeight: 70,
                scrollHeight: 'calc(100vh - 300px)',
                striped: true,
                size: 'small',
                selectionMode: 'multiple',
            }" data-key="id" i18n-key="exercises" storage-key="table-exercises" @create="handleCreate"
            @view="handleView" @edit="handleEdit" @delete="handleDelete" @error="handleError">
            <!-- Custom column: Title with subtitle -->
            <template #column-title="{ data }">
                <div v-if="data" class="flex flex-col">
                    <router-link :to="`/exercise-editor?mode=view&id=${data.id}`"
                        class="text-primary hover:underline font-medium">
                        {{ data.title }}
                    </router-link>
                    <span v-if="data.subtitle" class="text-xs text-gray-500">
                        {{ data.subtitle }}
                    </span>
                </div>
            </template>

            <!-- Custom column: Category badge -->
            <template #column-category_name="{ data }">
                <Tag v-if="data && getCategoryName(data.category_id)" :value="getCategoryName(data.category_id)"
                    severity="info" rounded />
                <span v-else class="text-gray-400 text-xs">-</span>
            </template>

            <!-- Custom column: Difficulty badge -->
            <template #column-difficulty_level="{ data }">
                <DifficultyBadge v-if="data" :level="data.difficulty_level" />
            </template>

            <!-- Custom column: Version badge -->
            <template #column-version="{ data }">
                <div v-if="data" class="flex items-center gap-2 justify-center">
                    <Tag :value="`v${data.version}`" severity="info" rounded />
                </div>
            </template>

            <!-- Custom column: Scope badge -->
            <template #column-scope="{ data }">
                <span v-if="data && data.scope" class="text-sm">{{ data.scope }}</span>
                <span v-else class="text-gray-400 text-xs">-</span>
            </template>
            <!-- Custom actions slot - add practice button -->
            <template #actions="{ data }">
                <div v-if="data" class="flex gap-2">
                    <Button icon="pi pi-play" severity="success" text size="small" v-tooltip.top="'Übung starten'"
                        @click="handlePractice(data)" />
                    <Button v-if="features.viewAction" icon="pi pi-eye" severity="secondary" text size="small"
                        @click="handleView(data)" />
                    <Button v-if="features.editAction" icon="pi pi-pencil" severity="secondary" text size="small"
                        @click="handleEdit(data)" />
                    <Button v-if="features.deleteAction" icon="pi pi-trash" severity="danger" text size="small"
                        @click="handleDelete(data)" />
                </div>
            </template>
        </TableSetup>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import DifficultyBadge from '@/components/DifficultyBadge.vue';
import { TableSetup } from '@/components/TableSetup';
import type { TableApiService } from '@/components/TableSetup';
import { useLocalizationStore } from '@/stores/localization';
import { useMessagingStore } from '@/stores/messaging';
import { exercisesApi } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';
import { exerciseCategoryService } from '@/services/exerciseCategoryService';
import type { ExerciseCategory } from '@/services/exerciseCategoryService';
import { exerciseColumns } from './config/exerciseColumns';
import { exerciseFilters } from './config/exerciseFilters';

const router = useRouter();
const loc = useLocalizationStore();
const messaging = useMessagingStore();
const confirm = useConfirm();

// Ref for TableSetup component
const tableSetupRef = ref<InstanceType<typeof TableSetup> | null>(null);

// Features configuration (matches the TableSetup features prop)
const features = {
    viewAction: true,
    editAction: true,
    deleteAction: true,
};

// Ref for dynamic filter config
const dynamicFilters = ref(exerciseFilters);

// Categories for name resolution
const categories = ref<ExerciseCategory[]>([]);

/**
 * Get category name by ID
 */
function getCategoryName(categoryId: string): string | null {
    const category = categories.value.find(cat => cat.id === categoryId);
    return category?.name || null;
}

/**
 * API Service wrapper for TableSetup
 * 
 * ⚠️ CRITICAL: Must accept and forward signal parameter for race condition prevention
 * ⚠️ CRITICAL: Use 'in' operator for search check, not truthiness
 */
const exerciseApiService: TableApiService<Exercise> = {
    baseUrl: '/api/v1/exercise/exercises',

    list: async (params: Record<string, unknown>, signal?: AbortSignal) => {
        // Build API parameters, excluding TableSetup control parameters
        const apiParams: Record<string, unknown> = {};

        // Pagination - use offset/limit directly (no conversion needed)
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

        // Filters - pass through all filter params
        if (params.category_id) {
            apiParams.category_id = params.category_id;
        }
        if (params.difficulty) {
            apiParams.difficulty = params.difficulty;
        }
        if (params.is_active !== undefined) {
            apiParams.active_only = params.is_active;
        }

        // Call API with signal for cancellation support
        return await exercisesApi.list(apiParams, signal);
    },

    delete: async (id) => await exercisesApi.delete(String(id)),
};

/**
 * Load categories for filter dropdown
 */
onMounted(async () => {
    try {
        const response = await exerciseCategoryService.list({ limit: 100 });
        categories.value = response.results;

        // Update filter config with categories
        const categoryField = dynamicFilters.value.fields.find(f => f.key === 'category_id');
        if (categoryField && categoryField.type === 'select' && categoryField.options) {
            categoryField.options.selectOptions = response.results.map(cat => ({
                label: cat.name,
                value: cat.id,
            }));
        }
    } catch {
        // Silently fail - filter will work without category options
    }
});

function handleCreate() {
    void router.push('/exercise-editor?mode=create');
}

function handleView(exercise: Exercise) {
    void router.push(`/exercise-editor?mode=view&id=${exercise.id}`);
}

function handleEdit(exercise: Exercise) {
    void router.push(`/exercise-editor?mode=edit&id=${exercise.id}`);
}

function handlePractice(exercise: Exercise) {
    void router.push(`/exercise-practice?id=${exercise.id}&backTo=/exercises`);
}

function handleDelete(exercise: Exercise) {
    const message = loc.t('exercises.confirmDelete.message');
    const header = loc.t('exercises.confirmDelete.title');

    confirm.require({
        message,
        header,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await exercisesApi.delete(exercise.id);
                void messaging.success(loc.t('exercises.messages.deleteSuccess'));

                // Refresh the table
                if (tableSetupRef.value) {
                    await tableSetupRef.value.refresh();
                }
            } catch (error) {
                void messaging.error(
                    loc.t('exercises.errors.deleteFailed'),
                    error instanceof Error ? error.message : String(error)
                );
            }
        }
    });
}

function handleError(error: Error) {
    const message = loc.t('exercises.errors.loadFailed');
    void messaging.error(message, error.message);
}
</script>
