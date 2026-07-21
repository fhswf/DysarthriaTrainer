<template>
  <div class="exercise-editor-page p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
          {{ pageTitle }}
        </h1>
        <p v-if="mode === 'edit' && exerciseId" class="text-surface-600 dark:text-surface-400 mt-1">
          {{ loc.t('exercises.form.subtitle.edit', { id: exerciseId.substring(0, 8) }) }}
        </p>
      </div>

      <!-- Form -->
      <ExerciseEditor :mode="mode" :exercise-id="exerciseId" :on-success="handleSuccess" :on-error="handleError"
        :on-cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalizationStore } from '@/stores/localization'
import { useMessagingStore } from '@/stores/messaging'
import ExerciseEditor from '@/form/exercise/ExerciseEditor.vue'
import type { Exercise } from '@/api/exercises'

const route = useRoute()
const router = useRouter()
const loc = useLocalizationStore()
const messaging = useMessagingStore()

// Mode detection from query params
const mode = computed(() => {
  const modeParam = route.query.mode as string
  return modeParam === 'edit' ? 'edit' : 'create'
})

const exerciseId = computed(() => route.query.id as string | undefined)

const pageTitle = computed(() =>
  mode.value === 'create'
    ? loc.t('exercises.form.title.create')
    : loc.t('exercises.form.title.edit')
)

// Handlers
const handleSuccess = (exercise: Exercise) => {
  void messaging.success(
    mode.value === 'create'
      ? loc.t('exercises.messages.createSuccess')
      : loc.t('exercises.messages.updateSuccess')
  )
  void router.push(`/exercises/${exercise.id}`)
}

const handleError = (error: Error) => {
  void messaging.error(
    mode.value === 'create'
      ? loc.t('exercises.errors.createFailed')
      : loc.t('exercises.errors.updateFailed'),
    error.message
  )
}

const handleCancel = () => {
  void router.push('/exercises')
}
</script>

<style scoped>
.exercise-editor-page {
  min-height: calc(100vh - 4rem);
}
</style>
