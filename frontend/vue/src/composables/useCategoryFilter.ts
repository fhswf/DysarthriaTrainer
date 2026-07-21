import { ref, computed } from 'vue'
import type { ExerciseCategory } from '@/api/exercises/exercises.types'
import { exerciseCategoriesApi } from '@/api/exercises'

const STORAGE_KEY = 'exercise-selection-categories'

export function useCategoryFilter() {
  const categories = ref<ExerciseCategory[]>([])
  const selectedCategories = ref<string[]>([])
  const loading = ref(false)

  async function loadCategories(): Promise<void> {
    try {
      loading.value = true
      // API returns paginated response: { count, results }
      const response = await exerciseCategoriesApi.list(false) // false = don't include deleted
      categories.value = response.results
      // Restore selection from localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[]
          const validIds = parsed.filter((id: string) =>
            categories.value.some((c: ExerciseCategory) => c.id === id)
          )
          selectedCategories.value = validIds.length > 0 ? validIds : getAllCategoryIds()
        } catch {
          selectedCategories.value = getAllCategoryIds()
        }
      } else {
        selectedCategories.value = getAllCategoryIds()
      }
    } catch (error) {
      // Log error for debugging but don't expose to console in production
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to load categories:', error)
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  function getAllCategoryIds(): string[] {
    return categories.value.map((c: ExerciseCategory) => c.id)
  }

  const isAllSelected = computed(() => selectedCategories.value.length === categories.value.length)

  function toggleCategory(categoryId: string): void {
    const index = selectedCategories.value.indexOf(categoryId)
    if (index > -1) {
      // Allow deselecting even if it's the last one
      selectedCategories.value.splice(index, 1)
    } else {
      selectedCategories.value.push(categoryId)
    }
    saveToStorage()
  }

  function selectAll(): void {
    selectedCategories.value = getAllCategoryIds()
    saveToStorage()
  }

  function deselectAll(): void {
    selectedCategories.value = []
    saveToStorage()
  }

  function reset(): void {
    selectAll()
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCategories.value))
    } catch (error) {
      // Log error for debugging but don't expose to console in production
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save category filter to localStorage:', error)
      }
    }
  }

  return {
    categories,
    selectedCategories,
    loading,
    isAllSelected,
    loadCategories,
    toggleCategory,
    selectAll,
    deselectAll,
    reset,
  }
}
