<template>
  <div class="audio-recorder">
    <div class="flex flex-col items-center gap-4 p-6 bg-surface-50 dark:bg-surface-900 rounded-lg">
      <!-- Recording Status -->
      <div v-if="isRecording" class="flex items-center gap-2 text-red-600 dark:text-red-400">
        <i class="pi pi-circle-fill animate-pulse"></i>
        <span class="font-semibold">Aufnahme läuft...</span>
        <span class="text-sm">{{ formatDuration(recordingDuration) }}</span>
      </div>

      <!-- Recording Controls -->
      <div class="flex gap-2">
        <Button
          v-if="!isRecording && !audioBlob"
          label="Aufnahme starten"
          icon="pi pi-microphone"
          severity="danger"
          @click="$emit('start-recording')"
          size="large"
        />

        <Button
          v-if="isRecording"
          label="Stopp"
          icon="pi pi-stop"
          severity="danger"
          @click="$emit('stop-recording')"
          size="large"
        />
      </div>

      <!-- Playback Controls (after recording) -->
      <div v-if="audioBlob && !isRecording" class="flex flex-col items-center gap-4 w-full">
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <i class="pi pi-check-circle"></i>
          <span class="font-semibold">Aufnahme erstellt</span>
          <span class="text-sm">({{ formatDuration(recordingDuration) }})</span>
        </div>

        <div class="flex gap-2">
          <Button
            label="Abspielen"
            icon="pi pi-play"
            severity="success"
            @click="$emit('play-recording')"
            outlined
          />

          <Button
            label="Neue Aufnahme"
            icon="pi pi-refresh"
            severity="secondary"
            @click="$emit('start-recording')"
            outlined
          />

          <Button
            label="Löschen"
            icon="pi pi-trash"
            severity="danger"
            @click="$emit('clear-recording')"
            outlined
          />
        </div>

        <!-- Waveform Visualization Placeholder -->
        <div class="w-full h-16 bg-surface-100 dark:bg-surface-800 rounded flex items-center justify-center">
          <span class="text-sm text-surface-500">Audio-Wellenform</span>
        </div>
      </div>

      <!-- Help Text -->
      <div v-if="!isRecording && !audioBlob" class="text-center text-sm text-surface-500">
        <p>Klicken Sie auf "Aufnahme starten", um Ihre Stimme aufzunehmen.</p>
        <p class="mt-1">Stellen Sie sicher, dass Ihr Mikrofon aktiviert ist.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
}

defineProps<Props>();

defineEmits<{
  'start-recording': [];
  'stop-recording': [];
  'play-recording': [];
  'clear-recording': [];
}>();

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
