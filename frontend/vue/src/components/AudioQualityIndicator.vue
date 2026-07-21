<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from 'primevue/progressbar';
import Badge from 'primevue/badge';
import { useLocalizationStore } from '@/stores/localization';
import type { QualityMetrics, QualityLevel } from '@/composables/useAudioQuality';

const loc = useLocalizationStore();

interface Props {
  metrics?: QualityMetrics | null;
  level?: QualityLevel;
  color?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  metrics: null,
  level: 'poor',
  color: '#9E9E9E',
  label: 'Unbekannt',
});

// Calculate quality percentage for progress bar
const qualityPercentage = computed(() => {
  if (!props.metrics) return 0;

  let score = 0;
  let maxScore = 0;

  // SNR contribution (40%)
  if (props.metrics.snr_db !== null) {
    maxScore += 40;
    if (props.metrics.snr_db >= 20) score += 40;
    else if (props.metrics.snr_db >= 15) score += 30;
    else if (props.metrics.snr_db >= 10) score += 15;
  }

  // Clipping contribution (30%)
  maxScore += 30;
  if (!props.metrics.clipping_detected) score += 30;

  // RMS energy contribution (15%)
  if (props.metrics.rms_energy !== null) {
    maxScore += 15;
    if (props.metrics.rms_energy >= 0.1) score += 15;
    else if (props.metrics.rms_energy >= 0.05) score += 10;
    else if (props.metrics.rms_energy >= 0.02) score += 5;
  }

  // Spectral flatness contribution (15%)
  if (props.metrics.spectral_flatness !== null) {
    maxScore += 15;
    if (props.metrics.spectral_flatness <= 0.3) score += 15;
    else if (props.metrics.spectral_flatness <= 0.5) score += 10;
    else if (props.metrics.spectral_flatness <= 0.7) score += 5;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
});

const badgeSeverity = computed(() => {
  switch (props.level) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'success';
    case 'fair':
      return 'warning';
    case 'poor':
      return 'danger';
    default:
      return 'secondary';
  }
});
</script>

<template>
  <div class="audio-quality-indicator">
    <div class="quality-header">
      <span class="quality-title">{{ loc.t('audio.quality.title') }}</span>
      <Badge :value="label" :severity="badgeSeverity" />
    </div>

    <!-- Quality Progress Bar -->
    <ProgressBar :value="qualityPercentage" :show-value="false" :style="{ height: '8px' }" :pt="{
      value: {
        style: { background: color }
      }
    }" />

    <!-- Metrics Details (if available) -->
    <div v-if="metrics" class="metrics-details">
      <div class="metric-row">
        <span class="metric-label">SNR:</span>
        <span class="metric-value">
          {{ metrics.snr_db !== null ? `${metrics.snr_db.toFixed(1)} dB` : 'N/A' }}
        </span>
      </div>

      <div class="metric-row">
        <span class="metric-label">{{ loc.t('audio.quality.volume') }}:</span>
        <span class="metric-value">
          {{ metrics.rms_energy !== null ? `${(metrics.rms_energy * 100).toFixed(0)}%` : 'N/A' }}
        </span>
      </div>

      <div class="metric-row">
        <span class="metric-label">{{ loc.t('audio.quality.clipping') }}:</span>
        <span class="metric-value" :class="{ 'text-danger': metrics.clipping_detected }">
          {{ metrics.clipping_detected ? loc.t('audio.quality.yes') : loc.t('audio.quality.no') }}
        </span>
      </div>

      <div v-if="metrics.spectral_flatness !== null" class="metric-row">
        <span class="metric-label">{{ loc.t('audio.quality.noise') }}:</span>
        <span class="metric-value">
          {{ (metrics.spectral_flatness * 100).toFixed(0) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-quality-indicator {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.quality-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.quality-title {
  font-weight: 600;
  color: var(--text-color);
}

.metrics-details {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.metric-label {
  color: var(--text-color-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--text-color);
}

.text-danger {
  color: #f44336;
}
</style>
