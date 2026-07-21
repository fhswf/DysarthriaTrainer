<template>
  <div class="session-analysis-trigger">
    <Button :label="buttonLabel" :icon="buttonIcon" :loading="isAnalyzing || isLoading" :disabled="isDisabled"
      severity="primary" @click="handleStartAnalysis" class="w-full" />

    <ProgressBar v-if="isAnalyzing && progressPercentage > 0" :value="formattedProgressPercentage" :show-value="true"
      class="mt-2" />

    <Message v-if="error" severity="error" :closable="true" @close="clearError" class="mt-2">
      {{ error }}
    </Message>

    <Message v-if="isComplete" severity="success" :closable="true" class="mt-2">
      {{ loc.t('sessionAnalysis.analysisComplete') }}
    </Message>

    <div v-if="hasErrors" class="mt-2">
      <Message severity="warn" :closable="false">
        {{ loc.t('sessionAnalysis.completedWithErrors', { count: progress?.errors.length || 0 }) }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { useSessionAnalysis } from '@/composables/useSessionAnalysis'
import { useLocalizationStore } from '@/stores/localization'

interface Props {
  sessionId: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  started: []
  completed: []
  error: [error: string]
}>()

const loc = useLocalizationStore()

const {
  progress,
  isAnalyzing,
  progressPercentage,
  isLoading,
  error,
  hasErrors,
  isComplete,
  startAnalysis: triggerAnalysis,
  clearError,
} = useSessionAnalysis({
  sessionId: props.sessionId,
  autoConnect: true,
})

const formattedProgressPercentage = computed(() => {
  return Math.round(progressPercentage.value * 10) / 10
})

const buttonLabel = computed(() => {
  if (isAnalyzing.value) {
    return loc.t('sessionAnalysis.analyzing')
  }
  if (isComplete.value) {
    return loc.t('sessionAnalysis.reanalyze')
  }
  return loc.t('sessionAnalysis.startAnalysis')
})

const buttonIcon = computed(() => {
  if (isAnalyzing.value) {
    return 'pi pi-spin pi-spinner'
  }
  if (isComplete.value) {
    return 'pi pi-refresh'
  }
  return 'pi pi-play'
})

const isDisabled = computed(() => {
  return props.disabled || isAnalyzing.value
})

async function handleStartAnalysis() {
  try {
    await triggerAnalysis()
    emit('started')
  } catch (err: any) {
    emit('error', err.message)
  }
}
</script>

<style scoped>
.session-analysis-trigger {
  display: flex;
  flex-direction: column;
}
</style>
