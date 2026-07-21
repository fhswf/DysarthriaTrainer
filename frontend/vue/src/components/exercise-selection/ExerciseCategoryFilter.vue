<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import SelectButton from 'primevue/selectbutton'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import type { ExerciseCategory } from '@/api/exercises/exercises.types'
import { useLocalizationStore } from '@/stores/localization'

interface Props {
    modelValue: string[]
    categories: ExerciseCategory[]
    loading?: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    'reset': []
}>()
const loc = useLocalizationStore()

// Responsive: use MultiSelect on small/medium screens, SelectButton on large
const isMobileView = ref(false)

function updateViewport() {
    isMobileView.value = window.innerWidth < 1024 // lg breakpoint
}

onMounted(() => {
    updateViewport()
    window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateViewport)
})

// Filter modelValue to only include valid category IDs
const validSelectedIds = computed(() => {
    const validIds = new Set(props.categories.map(c => c.id))
    return props.modelValue.filter(id => validIds.has(id))
})

const isAllSelected = computed(() =>
    validSelectedIds.value.length === props.categories.length && props.categories.length > 0
)

const isNoneSelected = computed(() =>
    validSelectedIds.value.length === 0
)

const categoryOptions = computed(() =>
    props.categories.map(cat => ({
        label: cat.name,
        value: cat.id
    }))
)

function handleToggleAll() {
    if (isAllSelected.value) {
        // Deselect all
        emit('update:modelValue', [])
    } else {
        // Select all
        emit('update:modelValue', props.categories.map(c => c.id))
    }
}

function handleSelectionChange(value: string[]) {
    emit('update:modelValue', value)
}

// Sync back to parent if valid selection differs from modelValue
// This ensures invalid IDs are removed from the parent's state
watch(validSelectedIds, (newValidIds) => {
    // Check if arrays actually differ
    const modelValueSet = new Set(props.modelValue)
    const hasChanges = newValidIds.length !== props.modelValue.length ||
        newValidIds.some(id => !modelValueSet.has(id))

    if (hasChanges) {
        emit('update:modelValue', newValidIds)
    }
})
</script>

<template>
    <div class="category-filter sticky top-0 lg:top-[73px] z-10 bg-white dark:bg-gray-900 border-b py-2 px-3 shadow-md">
        <div class="flex items-center gap-2">
            <!-- Toggle All/None Button -->
            <Button
                :label="isAllSelected ? loc.t('exerciseSelection.deselectAll') : loc.t('exerciseSelection.selectAll')"
                :icon="isAllSelected ? 'pi pi-times' : 'pi pi-check'" @click="handleToggleAll"
                :severity="isAllSelected ? 'secondary' : 'primary'" size="small" outlined
                data-testid="toggle-all-button" class="flex-shrink-0" />

            <!-- Mobile/Tablet: MultiSelect (compact dropdown) -->
            <div v-if="isMobileView" class="flex-1 min-w-0">
                <MultiSelect :model-value="validSelectedIds" @update:model-value="handleSelectionChange"
                    :options="categoryOptions" option-label="label" option-value="value"
                    :placeholder="loc.t('exerciseSelection.selectCategories')" :disabled="props.loading" display="chip"
                    :max-selected-labels="2" class="w-full" aria-label="Select exercise categories"
                    data-testid="category-multiselect" />
            </div>

            <!-- Desktop: SelectButton (inline buttons) -->
            <div v-else class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-2 justify-center">
                    <SelectButton :model-value="validSelectedIds" @update:model-value="handleSelectionChange"
                        :options="categoryOptions" option-label="label" option-value="value" multiple
                        :disabled="props.loading" aria-label="Select exercise categories"
                        data-testid="category-select-button" />
                </div>
            </div>

            <!-- Reset Button -->
            <Button v-if="!isAllSelected && !isNoneSelected" icon="pi pi-refresh" text size="small"
                @click="$emit('reset')" v-tooltip.top="loc.t('common.reset')" class="flex-shrink-0" />
        </div>
    </div>
</template>

<style scoped>
/* Solid background to prevent see-through scrolling */
.category-filter {
    background: rgb(255, 255, 255);
}

.dark .category-filter {
    background: rgb(17, 24, 39);
}

/* Compact MultiSelect styling */
:deep(.p-multiselect) {
    min-width: 200px;
}

:deep(.p-multiselect-label) {
    padding: 0.5rem;
}
</style>
