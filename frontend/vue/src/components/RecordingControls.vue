<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import { useLocalizationStore } from '@/stores/localization';

const loc = useLocalizationStore();

interface Props {
  isRecording?: boolean;
  isPaused?: boolean;
  isConnected?: boolean;
  duration?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isRecording: false,
  isPaused: false,
  isConnected: true,
  duration: 0,
  disabled: false,
});

interface Emits {
  (e: 'start'): void;
  (e: 'stop'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
}

const emit = defineEmits<Emits>();

// Format duration as MM:SS
const formattedDuration = computed(() => {
  const minutes = Math.floor(props.duration / 60);
  const seconds = props.duration % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Button handlers
const handleStart = () => emit('start');
const handleStop = () => emit('stop');
const handlePause = () => emit('pause');
const handleResume = () => emit('resume');

// Button states
const canStart = computed(() => !props.isRecording && !props.disabled && props.isConnected);
const canStop = computed(() => props.isRecording);
const canPause = computed(() => props.isRecording && !props.isPaused);
const canResume = computed(() => props.isRecording && props.isPaused);
</script>

<template>
  <div class="recording-controls">
    <div class="flex items-center gap-3">
      <!-- Start Button -->
      <Button v-if="!isRecording" :label="loc.t('audio.controls.start')" icon="pi pi-circle" severity="success"
        size="large" :disabled="!canStart" @click="handleStart" class="recording-start-btn" />

      <!-- Pause/Resume Button -->
      <Button v-if="isRecording && !isPaused" :label="loc.t('audio.controls.pause')" icon="pi pi-pause"
        severity="warning" size="large" :disabled="!canPause" @click="handlePause" />

      <Button v-if="isRecording && isPaused" :label="loc.t('audio.controls.resume')" icon="pi pi-play" severity="info"
        size="large" :disabled="!canResume" @click="handleResume" />

      <!-- Stop Button -->
      <Button v-if="isRecording" :label="loc.t('audio.controls.stop')" icon="pi pi-stop" severity="danger" size="large"
        :disabled="!canStop" @click="handleStop" class="recording-stop-btn" />

      <!-- Duration Display -->
      <div v-if="isRecording" class="duration-display">
        <span class="recording-indicator" :class="{ paused: isPaused }"></span>
        <span class="duration-text">{{ formattedDuration }}</span>
      </div>

      <!-- Connection Status -->
      <div v-if="!isConnected" class="connection-status">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ loc.t('audio.connection.disconnected') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recording-controls {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.duration-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--surface-card);
  border-radius: 6px;
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.recording-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f44336;
  animation: pulse 1.5s ease-in-out infinite;
}

.recording-indicator.paused {
  background: #ffc107;
  animation: none;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.duration-text {
  color: var(--text-color);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 6px;
  font-size: 0.875rem;
}

.recording-start-btn {
  animation: subtle-pulse 2s ease-in-out infinite;
}

@keyframes subtle-pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }
}
</style>
