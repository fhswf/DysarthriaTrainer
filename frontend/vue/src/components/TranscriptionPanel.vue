<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Chip from 'primevue/chip';
import Message from 'primevue/message';
import { useLocalizationStore } from '@/stores/localization';

const loc = useLocalizationStore();

interface Props {
  transcription?: string;
  isProcessing?: boolean;
  warnings?: string[];
  language?: string;
  processingTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  transcription: '',
  isProcessing: false,
  warnings: () => [],
  language: 'de',
  processingTime: 0,
});

const hasTranscription = computed(() => props.transcription.length > 0);
const wordCount = computed(() => {
  if (!props.transcription) return 0;
  return props.transcription.trim().split(/\s+/).filter(Boolean).length;
});

const languageLabel = computed(() => {
  const labels: Record<string, string> = {
    de: 'Deutsch',
    en: 'English',
  };
  return labels[props.language] || props.language;
});
</script>

<template>
  <Card class="transcription-panel">
    <template #title>
      <div class="flex items-center justify-between">
        <span>{{ loc.t('audio.transcription.title') }}</span>
        <div class="flex items-center gap-2">
          <Chip :label="languageLabel" icon="pi pi-globe" />
          <Chip v-if="processingTime > 0" :label="`${processingTime.toFixed(0)}ms`" icon="pi pi-clock" />
        </div>
      </div>
    </template>

    <template #content>
      <!-- Processing State -->
      <div v-if="isProcessing" class="processing-state">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <span>{{ loc.t('audio.transcription.processing') }}</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasTranscription" class="empty-state">
        <i class="pi pi-microphone"></i>
        <span>{{ loc.t('audio.transcription.empty') }}</span>
      </div>

      <!-- Transcription Content -->
      <div v-else class="transcription-content">
        <div class="transcription-text">
          {{ transcription }}
        </div>

        <!-- Word Count -->
        <div class="metadata">
          <span class="word-count">
            <i class="pi pi-list"></i>
            {{ loc.t('audio.transcription.wordCount', { count: wordCount }) }}
          </span>
        </div>

        <!-- Warnings -->
        <div v-if="warnings.length > 0" class="warnings-section">
          <Message v-for="(warning, index) in warnings" :key="index" severity="warn" :closable="false">
            {{ warning }}
          </Message>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.transcription-panel {
  height: 100%;
}

.processing-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 200px;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.5;
}

.transcription-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transcription-text {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  font-size: 1.125rem;
  line-height: 1.8;
  min-height: 120px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.metadata {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warnings-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
