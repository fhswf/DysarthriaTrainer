<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import ExerciseCard from '@/components/exercise-selection/ExerciseCard.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useExerciseSelection } from '@/composables/useExerciseSelection'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import ExerciseCategoryFilter from '@/components/exercise-selection/ExerciseCategoryFilter.vue'
import { useCategoryFilter } from '@/composables/useCategoryFilter'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import type { Exercise } from '@/api/exercises/exercises.types'

const loc = useLocalizationStore()
const router = useRouter()
const messaging = useMessagingStore()

const {
    exercises,
    loading,
    hasMore,
    error,
    loadMore,
    updateCategoryFilter,
} = useExerciseSelection()

const {
    categories,
    selectedCategories,
    loading: categoriesLoading,
    loadCategories,
    reset: resetCategories,
} = useCategoryFilter()

/**
 * Handle exercise selection - navigate to practice page
 */
function handleSelectExercise(exercise: Exercise) {
    // Show feedback
    void messaging.info(loc.t('exerciseSelection.startingPractice'))

    // Navigate to practice page with query parameter
    void router.push(`/exercise-practice?id=${exercise.id}&backTo=/exercise-selection`)
}

/**
 * Load initial exercises
 */
onMounted(async () => {
    await loadCategories()
    try {
        await loadMore()
    } catch (_err) {
        void messaging.error(loc.t('exerciseSelection.loadError'))
    }
})

// Watch for category changes and reload exercises
watch(selectedCategories, async (newVal, oldVal) => {
    // Deep comparison to avoid unnecessary reloads
    if (newVal.length !== oldVal.length) {
        await updateCategoryFilter([...newVal])
        return
    }

    // Check if array contents actually changed
    const newSet = new Set(newVal)
    const hasChanges = oldVal.some(id => !newSet.has(id))

    if (hasChanges) {
        await updateCategoryFilter([...newVal])
    }
})

function handleResetFilters() {
    resetCategories()
}

// Setup infinite scroll
const scrollDisabled = computed(() => loading.value || !hasMore.value)
const { scrollContainer } = useInfiniteScroll(
    async () => {
        if (!loading.value && hasMore.value) {
            try {
                await loadMore()
            } catch (_err) {
                void messaging.error(loc.t('exerciseSelection.loadError'))
            }
        }
    },
    { threshold: 300, disabled: scrollDisabled }
)
</script>

<template>
    <div class="exercise-selection-page bg-gray-50 dark:bg-gray-950 min-h-screen">
        <!-- Page Header - only sticky on large screens -->
        <div
            class="page-header lg:sticky lg:top-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm py-4 px-4 text-center">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {{ loc.t('exerciseSelection.title') }}
            </h1>
            <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
                {{ loc.t('exerciseSelection.subtitle') }}
            </p>
        </div>
        <!-- Category Filter Bar (sticky) -->
        <ExerciseCategoryFilter v-model="selectedCategories" :categories="categories" :loading="categoriesLoading"
            @reset="handleResetFilters" />
        <!-- Exercise List -->
        <div ref="scrollContainer" class="exercise-list">
            <!-- Cards -->
            <div v-if="exercises.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ExerciseCard v-for="exercise in exercises" :key="exercise.id" :exercise="exercise"
                    @select="handleSelectExercise" />
            </div>

            <!-- Loading Indicator (Initial Load) -->
            <div v-if="loading && exercises.length === 0" class="flex justify-center items-center py-12">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4"
                    :aria-label="loc.t('exerciseSelection.loadingMore')" />
            </div>

            <!-- Loading More Indicator -->
            <div v-else-if="loading && exercises.length > 0" class="flex justify-center items-center py-8">
                <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4"
                    :aria-label="loc.t('exerciseSelection.loadingMore')" />
                <span class="ml-3 text-gray-600 dark:text-gray-400">
                    {{ loc.t('exerciseSelection.loadingMore') }}
                </span>
            </div>

            <!-- End of List Message -->
            <div v-else-if="!hasMore && exercises.length > 0" class="text-center py-8 text-gray-500" role="status"
                aria-live="polite">
                <i class="pi pi-check-circle text-2xl mb-2" />
                <p>{{ loc.t('exerciseSelection.endOfList') }}</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!loading && exercises.length === 0 && !error" class="text-center py-12" role="status">
                <i class="pi pi-search text-6xl text-gray-300 mb-4" />
                <p class="text-gray-600 dark:text-gray-400 text-lg">
                    {{ loc.t('exerciseSelection.noExercises') }}
                </p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-12" role="alert">
                <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
                <p class="text-red-600 dark:text-red-400 text-lg mb-4">
                    {{ loc.t('exerciseSelection.loadError') }}
                </p>
                <button type="button" @click="loadMore"
                    class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    {{ loc.t('common.retry') }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.exercise-selection-page {
    padding: 0;
}

.exercise-list {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
}

@media (min-width: 768px) {
    .exercise-list {
        padding: 1.5rem;
    }
}

@media (min-width: 1024px) {
    .exercise-list {
        padding: 2rem;
    }
}
</style>
