import { ref } from 'vue'
import type { Exercise } from '@/api/exercises/exercises.types'
import type { ExerciseListParams } from '@/api/exercises/exercises.types'
import { exercisesApi } from '@/api/exercises'

/**
 * Composable for managing exercise list loading with infinite scroll and category filtering
 *
 * Features:
 * - Pagination with offset/limit
 * - Category filtering
 * - Loading states
 * - Error handling
 *
 * @example
 * const { exercises, loading, hasMore, loadMore, updateCategoryFilter } = useExerciseSelection()
 * await loadMore() // Load first page
 */
export function useExerciseSelection() {
  const exercises = ref<Exercise[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(0)
  const selectedCategories = ref<string[]>([])
  const error = ref<Error | null>(null)

  const pageSize = 20 // Load 20 exercises per page

  /**
   * Load next page of exercises
   *
   * @throws {Error} If API call fails
   */
  async function loadMore(): Promise<void> {
    if (loading.value || !hasMore.value) return

    try {
      loading.value = true
      error.value = null

      // If no categories selected, return empty results
      if (selectedCategories.value.length === 0) {
        exercises.value = []
        hasMore.value = false
        loading.value = false
        return
      }

      const params: ExerciseListParams & { category_ids?: string } = {
        offset: page.value * pageSize,
        limit: pageSize,
        active_only: true,
      }

      // Add category filter - backend expects category_ids as comma-separated string
      params.category_ids = selectedCategories.value.join(',')

      // Disable cache to ensure fresh data with current filters
      const response = await exercisesApi.list(params, undefined, false)

      // Append new exercises
      exercises.value.push(...response.results)

      // Update pagination
      page.value++
      hasMore.value = exercises.value.length < response.count
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load exercises')
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to load exercises:', err)
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset and reload with new filters
   *
   * @throws {Error} If API call fails
   */
  async function reload(): Promise<void> {
    exercises.value = []
    page.value = 0
    hasMore.value = true
    await loadMore()
  }

  /**
   * Update category filter and reload
   *
   * @param categoryIds - Array of category IDs to filter by (empty = all)
   * @throws {Error} If API call fails
   */
  async function updateCategoryFilter(categoryIds: string[]): Promise<void> {
    selectedCategories.value = categoryIds
    await reload()
  }

  /**
   * Reset all state
   */
  function reset(): void {
    exercises.value = []
    page.value = 0
    hasMore.value = true
    selectedCategories.value = []
    loading.value = false
    error.value = null
  }

  return {
    exercises,
    loading,
    hasMore,
    selectedCategories,
    error,
    loadMore,
    reload,
    updateCategoryFilter,
    reset,
  }
}
