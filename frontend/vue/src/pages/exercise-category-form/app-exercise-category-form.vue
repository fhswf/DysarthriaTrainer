<template>
  <div class="exercise-category-form-page min-h-screen bg-surface-ground">
    <!-- Page Header -->
    <div class="bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
      <div class="container mx-auto px-4 py-6 md:px-8">
        <!-- Breadcrumb -->
        <nav class="mb-4">
          <ol class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
            <li>
              <router-link
                to="/"
                class="hover:text-primary-500 transition-colors"
              >
                {{ loc.t('common.navigation.home') }}
              </router-link>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-angle-right text-xs" />
              <router-link
                to="/exercise-categories"
                class="hover:text-primary-500 transition-colors"
              >
                {{ loc.t('exerciseCategories.title') }}
              </router-link>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-angle-right text-xs" />
              <span class="text-surface-900 dark:text-surface-0">{{ pageTitle }}</span>
            </li>
          </ol>
        </nav>

        <!-- Page Title -->
        <div class="flex items-center gap-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30"
          >
            <i :class="pageTitleIcon" class="text-2xl text-primary-500" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
              {{ pageTitle }}
            </h1>
            <p v-if="pageSubtitle" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
              {{ pageSubtitle }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="container mx-auto px-4 py-8 md:px-8">
      <ExerciseCategoryForm
        :mode="mode"
        :category-id="categoryId"
        @success="handleSuccess"
        @error="handleError"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocalizationStore } from '@/stores/localization'
import { ExerciseCategoryForm } from '@/form/exercise-category'
import type { ExerciseCategory } from '@/services/exerciseCategoryService'

const router = useRouter()
const route = useRoute()
const loc = useLocalizationStore()

// Route params
const mode = computed(() => {
  const modeParam = route.query.mode as string | undefined
  if (modeParam === 'edit' || modeParam === 'view') {
    return modeParam
  }
  return 'create'
})

const categoryId = computed(() => route.query.id as string | undefined)

// Page metadata
const pageTitle = ref('')
const pageSubtitle = ref('')

const pageTitleIcon = computed(() => {
  switch (mode.value) {
    case 'create':
      return 'pi pi-plus-circle'
    case 'edit':
      return 'pi pi-pencil'
    case 'view':
      return 'pi pi-eye'
    default:
      return 'pi pi-list'
  }
})

// Load page title
onMounted(() => {
  const titleKey =
    mode.value === 'create'
      ? 'exerciseCategories.form.title.create'
      : mode.value === 'edit'
        ? 'exerciseCategories.form.title.edit'
        : 'exerciseCategories.form.title.view'

  pageTitle.value = loc.t(titleKey)

  // Add subtitle for edit mode (will be updated when category loads)
  if (mode.value === 'edit' && categoryId.value) {
    pageSubtitle.value = loc.t('exerciseCategories.form.subtitle.edit', {
      name: '...',
    })
  }
})

// Event handlers
const handleSuccess = (_category: ExerciseCategory) => {
  // Navigate back to category list
  void router.push('/exercise-categories')
}

const handleError = (_error: Error) => {
  // Error already shown by composable via messaging store
  // No additional handling needed
}

const handleCancel = () => {
  // Navigate back to category list
  void router.push('/exercise-categories')
}
</script>

<style scoped>
/* Styles handled by Tailwind classes in template */
</style>
