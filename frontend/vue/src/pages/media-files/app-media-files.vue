<template>
    <div class="flex flex-col h-full">
        <TableSetup :api-service="mediaFileApiService" :columns="mediaFileColumns" :initial-state="{
            sortField: 'created_at',
            sortOrder: -1,
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
    }" data-key="id" i18n-key="mediaFiles" storage-key="table-media-files" @view="handleView" @edit="handleEdit"
            @error="handleError">
            <!-- Custom column: File Type with badge and icon -->
            <template #column-file_type="{ data }">
                <Tag :value="loc.t(`mediaFiles.fileTypes.${(data as MediaFile).file_type}`)"
                    :severity="fileTypeSeverity((data as MediaFile).file_type)"
                    :icon="fileTypeIcon((data as MediaFile).file_type)" />
            </template>

            <!-- Custom column: Filename with thumbnail (if image) -->
            <template #column-original_filename="{ data }">
                <div class="flex items-center gap-2">
                    <!-- Thumbnail for images -->
                    <img v-if="(data as MediaFile).file_type === 'image' && (data as MediaFile).thumbnail_url"
                        :src="(data as MediaFile).thumbnail_url!" :alt="(data as MediaFile).original_filename"
                        class="w-8 h-8 rounded object-cover" />
                    <!-- Fallback icon for non-images or missing thumbnails -->
                    <i v-else :class="fileTypeIcon((data as MediaFile).file_type)" class="text-xl text-gray-500"></i>
                    <!-- Filename with tooltip showing full name -->
                    <span :title="(data as MediaFile).original_filename" class="truncate">
                        {{ truncateFilename((data as MediaFile).original_filename) }}
                    </span>
                </div>
            </template>

            <!-- Custom column: MIME type with shortened display -->
            <template #column-mime_type="{ data }">
                <span :title="(data as MediaFile).mime_type" class="text-sm text-gray-600">
                    {{ (data as MediaFile).mime_type.split('/')[1] }}
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
import { mediaFileService } from '@/services/mediaFileService';
import type { MediaFile } from '@/services/mediaFileService';
import {
    mediaFileColumns,
    fileTypeSeverity,
    fileTypeIcon,
    truncateFilename,
} from './config/mediaFileColumns';

const router = useRouter();
const loc = useLocalizationStore();
const messaging = useMessagingStore();

/**
 * API Service Adapter for TableSetup
 * Wraps mediaFileService to match TableSetup's expected interface
 */
const mediaFileApiService: TableApiService<MediaFile> = {
    list: async (params: Record<string, unknown>, signal?: AbortSignal) => {
        const apiParams: Record<string, unknown> = {};

        // Map TableSetup params to API params
        if (params.limit !== undefined) apiParams.limit = params.limit;
        if (params.offset !== undefined) apiParams.offset = params.offset;

        // Search - use 'in' operator to check for search parameter
        if ('search' in params) {
            apiParams.search = params.search;
        }

        // File type filter
        if ('file_type' in params) {
            apiParams.file_type = params.file_type;
        }

        // MIME type filter
        if ('mime_type' in params) {
            apiParams.mime_type = params.mime_type;
        }

        // Sorting
        if (params.sortField && params.sortOrder !== undefined) {
            const prefix = params.sortOrder === -1 ? '-' : '';
            apiParams.ordering = `${prefix}${params.sortField}`;
        }

        // Note: Backend currently returns MediaFile[] without pagination wrapper
        // We'll need to adapt when/if backend adds pagination
        const files = await mediaFileService.list(apiParams, signal);
        return {
            count: files.length,
            results: files,
        };
    },

    delete: async (id: string | number) => {
        // Convert to string and cast as UUID for service method
        await mediaFileService.delete(String(id) as `${string}-${string}-${string}-${string}-${string}`);
    },
};

/**
 * View media file details
 */
function handleView(item: MediaFile) {
    void router.push(`/media-files/${item.id}`);
}

/**
 * Edit media file
 */
function handleEdit(item: MediaFile) {
    void router.push(`/media-files/${item.id}/edit`);
}

/**
 * Handle errors from TableSetup
 */
function handleError(error: Error) {
    void messaging.error(loc.t('mediaFiles.error', { message: error.message }));
}
</script>

<style scoped>
/* Minimal styling - TableSetup handles most layout */
</style>
