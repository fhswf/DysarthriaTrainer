<template>
    <div class="library-item-form-page flex flex-col h-full">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
                <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="handleBack" />
                <div>
                    <h1 class="text-2xl font-bold">
                        {{ pageTitle }}
                    </h1>
                    <p v-if="itemId" class="text-surface-600 dark:text-surface-400 text-sm">
                        {{ loc.t('libraryItems.form.labels.itemId') }}: {{ itemId }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Form Card -->
        <Card class="flex-1">
            <template #content>
                <LibraryItemForm :options="formOptions" />
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { useLocalizationStore } from '@/stores/localization'
import LibraryItemForm from '@/forms/library-item/LibraryItemForm.vue'
import type { LibraryItemFormOptions, LibraryItemFormMode } from '@/forms/library-item/library-item.types'
import type { LibraryItem, LibraryItemType } from '@/api/exercises'

const route = useRoute()
const router = useRouter()
const loc = useLocalizationStore()

/**
 * Get form mode from query parameter
 */
const mode = computed<LibraryItemFormMode>(() => {
    const modeParam = route.query.mode as string
    if (modeParam === 'edit') return 'edit'
    if (modeParam === 'view') return 'view'
    return 'create'
})

/**
 * Get item ID from query parameter (for edit/view modes)
 */
const itemId = computed<string | undefined>(() => {
    const id = route.query.id as string
    return id || undefined
})

/**
 * Get initial item type from query parameter (for create mode)
 */
const initialItemType = computed<LibraryItemType | undefined>(() => {
    const type = route.query.type as LibraryItemType
    return type ?? undefined
})

/**
 * Page title based on mode
 */
const pageTitle = computed(() => {
    switch (mode.value) {
        case 'create':
            return loc.t('libraryItems.form.titles.create')
        case 'edit':
            return loc.t('libraryItems.form.titles.edit')
        case 'view':
            return loc.t('libraryItems.form.titles.view')
        default:
            return loc.t('libraryItems.form.titles.create')
    }
})

/**
 * Form options
 */
const formOptions = computed<LibraryItemFormOptions>(() => ({
    mode: mode.value,
    itemId: itemId.value,
    initialItemType: initialItemType.value,
    onSuccess: handleSuccess,
    onError: handleError,
    onCancel: handleCancel,
}))

/**
 * Handle successful form submission
 */
function handleSuccess(_item: LibraryItem) {
    void router.push('/library-items')
}

/**
 * Handle form error
 */
function handleError(_error: Error) {
    // Error already handled by form composable via messaging
}

/**
 * Handle form cancel
 */
function handleCancel() {
    void router.push('/library-items')
}

/**
 * Handle back button
 */
function handleBack() {
    void router.push('/library-items')
}

/**
 * Validate route parameters on mount
 */
onMounted(() => {
    // Validate that edit/view modes have an ID
    if ((mode.value === 'edit' || mode.value === 'view') && !itemId.value) {
        void router.push('/library-items')
    }
})
</script>

<style scoped>
.library-item-form-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}
</style>
