<template>
  <div class="exercise-practice p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <ProgressSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[400px]">
      <Message severity="error" :closable="false" class="mb-4">
        {{ error }}
      </Message>
      <Button label="Zurück" icon="pi pi-arrow-left" @click="goBack" />
    </div>

    <!-- Exercise Content -->
    <div v-else-if="exercise && currentItem" class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
              {{ exercise.title }}
            </h1>
            <p v-if="exercise.subtitle" class="text-surface-600 dark:text-surface-400 mt-1">
              {{ exercise.subtitle }}
            </p>
          </div>
          <Button label="Beenden" icon="pi pi-times" severity="secondary" @click="handleExit" />
        </div>

        <!-- Exercise Info -->
        <div class="flex gap-4 items-center text-sm text-surface-600 dark:text-surface-400 flex-wrap">
          <div class="flex items-center gap-2">
            <i class="pi pi-tag"></i>
            <span>{{ formatDifficulty(exercise.difficulty_level) }}</span>
          </div>
          <div v-if="exercise.estimated_duration_minutes" class="flex items-center gap-2">
            <i class="pi pi-clock"></i>
            <span>{{ exercise.estimated_duration_minutes }} min</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-list"></i>
            <span>{{ currentItemIndex + 1 }} / {{ practiceQueue.length }}</span>
          </div>

          <!-- Recording controls (right side) -->
          <div class="flex items-center gap-3 ml-auto">
            <!-- Instructions Button -->
            <Button v-if="currentInstructions" icon="pi pi-info-circle" label="Anleitung" severity="secondary" text
              size="small" @click="showInstructionsDialog = true" />

            <!-- Quality Badge and Waveform Toggle (only when recording) -->
            <template v-if="audioRecorder.isRecording.value">
              <!-- Quality Badge in Header (per spec: show quality indicator) -->
              <AudioQualityIndicator :snr="audioQuality.metrics.value?.snr_db ?? undefined"
                :volume="audioQuality.metrics.value?.rms_energy ?? undefined"
                :clipping="audioQuality.metrics.value?.clipping_detected ? 1 : 0"
                :noise-level="audioQuality.metrics.value?.spectral_flatness ?? undefined" show-icon compact
                @click="console.log('[DEBUG] Quality metrics:', audioQuality.metrics.value, 'Level:', audioQuality.qualityLevel.value)" />

              <!-- Toggle Waveform Button (per spec: show audio spectrum) -->
              <Button :icon="showWaveform ? 'pi pi-eye-slash' : 'pi pi-chart-bar'"
                :label="showWaveform ? 'Verbergen' : 'Spektrum'" severity="secondary" text size="small"
                @click="showWaveform = !showWaveform" />
            </template>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="mb-6">
        <ProgressBar :value="progressPercentage" :showValue="false" class="h-2" />
      </div>

      <!-- Waveform Display (when recording and toggled) -->
      <Card v-if="showWaveform && audioRecorder.isRecording.value" class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar"></i>
            <span>Audio Spektrum</span>
          </div>
        </template>
        <template #content>
          <WaveformDisplay :stream="mediaStream" :width="800" :height="120" type="bars" bar-color="#10b981"
            background-color="#1e1e1e" />
        </template>
      </Card>

      <!-- Current Exercise Item -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Tag :value="formatItemType(currentItem.item_type)" />
            </div>
            <span v-if="currentPracticeItem && currentPracticeItem.totalIterations > 1"
              class="text-sm text-surface-600 dark:text-surface-400">
              Wiederholung {{ currentPracticeItem.iteration }}/{{ currentPracticeItem.totalIterations }}
            </span>
          </div>
        </template>
        <template #content>
          <!-- Exercise Content Display -->

          <!-- Speech Practice Item -->
          <div v-if="currentItem.item_type === 'speech_practice'" class="space-y-4">
            <div class="text-center p-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div class="text-6xl font-bold mb-6 text-primary-600 dark:text-primary-400 leading-tight">
                {{ currentContent?.text_content || '' }}
              </div>

              <div v-if="currentContent?.phonetic_transcription"
                class="text-2xl text-surface-600 dark:text-surface-400 mt-4">
                Phonetik: {{ currentContent.phonetic_transcription }}
              </div>
            </div>
          </div>

          <!-- Movement Item -->
          <div v-else-if="currentItem.item_type === 'movement'" class="space-y-4">
            <div v-if="currentContent?.text_content" class="text-4xl font-semibold text-center">
              {{ currentContent.text_content }}
            </div>

            <div v-if="currentItem.repetitions"
              class="flex gap-4 justify-center text-sm text-surface-600 dark:text-surface-400">
              <div class="flex items-center gap-2">
                <i class="pi pi-refresh"></i>
                <span>{{ currentItem.repetitions }}x wiederholen</span>
              </div>
            </div>
          </div>

          <!-- Information Item -->
          <div v-else-if="currentItem.item_type === 'information'" class="space-y-4">
            <div class="text-xl leading-relaxed whitespace-pre-line">
              {{ currentContent?.text_content || '' }}
            </div>
          </div>

          <!-- Fallback for other types (vocalization, breathing, etc) -->
          <div v-else class="text-3xl text-surface-900 dark:text-surface-0 text-center font-semibold">
            {{ currentContent?.text_content || 'Führen Sie die Übung durch' }}
          </div>
        </template>
      </Card>

      <!-- Navigation with Inline Recording Controls (per spec: minimal footprint) -->
      <div class="flex flex-col gap-4">
        <!-- Control Bar: Record + Microphone Settings + Navigation (single row on desktop) -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Recording Toggle Button -->
          <Button :icon="audioRecorder.isRecording.value ? 'pi pi-stop' : 'pi pi-circle'" :class="[
            'transition-all duration-300 font-semibold',
            audioRecorder.isRecording.value ? '!bg-red-600 !text-white hover:!bg-red-700 recording-pulse' : ''
          ]" :severity="audioRecorder.isRecording.value ? 'danger' : 'primary'"
            :outlined="audioRecorder.isRecording.value"
            v-tooltip.right="loc.t(audioRecorder.isRecording.value ? 'recording.tooltips.stopRecording' : 'recording.tooltips.startRecording')"
            @click="audioRecorder.isRecording.value ? handleStopRecording() : handleStartRecording()"
            class="flex-shrink-0" />

          <!-- Microphone Settings Button (with status indicator) -->
          <Button icon="pi pi-microphone"
            :badge="audioDevices.devices.value.length > 0 && audioDevices.selectedDeviceId.value ? '' : '!'"
            :badge-severity="audioDevices.devices.value.length > 0 && audioDevices.selectedDeviceId.value ? 'success' : 'danger'"
            severity="secondary" outlined :disabled="audioRecorder.isRecording.value"
            v-tooltip.right="loc.t('recording.tooltips.microphoneSettings')" @click="showMicrophoneDialog = true"
            class="flex-shrink-0" />

          <!-- Recording Status (when recording) -->
          <RecordingStatusDisplay v-if="audioRecorder.isRecording.value" :duration="audioRecorder.duration.value"
            :file-size="fileSizeBytes" :status="audioRecorder.isRecording.value ? 'recording' : 'idle'"
            :show-file-size="false" compact class="flex-shrink-0" />

          <!-- Spacer -->
          <div class="flex-grow"></div>

          <!-- Navigation Buttons -->
          <Button label="Zurück" icon="pi pi-chevron-left" :disabled="currentItemIndex === 0" @click="previousItem"
            outlined v-tooltip.bottom="loc.t('recording.tooltips.previousItem')" class="flex-shrink-0" />

          <div class="flex gap-2">
            <Button v-if="currentItemIndex < practiceQueue.length - 1" label="Weiter" icon="pi pi-chevron-right"
              icon-pos="right" @click="nextItem" v-tooltip.bottom="loc.t('recording.tooltips.nextItem')"
              class="flex-shrink-0" />
            <Button v-else label="Abschließen" icon="pi pi-check" severity="success" @click="completeExercise"
              v-tooltip.bottom="loc.t('recording.tooltips.completeExercise')" class="flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>

    <!-- No Items State -->
    <div v-else-if="exercise && practiceQueue.length === 0"
      class="flex flex-col items-center justify-center min-h-[400px]">
      <Message severity="warn" :closable="false" class="mb-4">
        Diese Übung enthält keine Übungselemente.
      </Message>
      <Button label="Zurück" icon="pi pi-arrow-left" @click="goBack" />
    </div>

    <!-- Instructions Dialog -->
    <InstructionsDialog v-model:visible="showInstructionsDialog" :instructions="currentInstructions"
      :title="exercise?.title ? `Anleitung: ${exercise.title}` : 'Übungsanleitung'" />

    <!-- Microphone Settings Dialog -->
    <MicrophoneSettingsDialog v-model:visible="showMicrophoneDialog" v-model="audioDevices.selectedDeviceId.value"
      :devices="audioDevices.devices.value" :loading="audioDevices.isLoading.value"
      :disabled="audioRecorder.isRecording.value" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { exercisesApi, type ExerciseDetail, type ExerciseItem } from '@/api/exercises';
import { useMessagingStore } from '@/stores/messaging';
import { useLocalizationStore } from '@/stores/localization';
import { useAudioRecorder } from '@/composables/useAudioRecorder';
import { useAudioDevices } from '@/composables/useAudioDevices';
import { useAudioStreaming } from '@/composables/useAudioStreaming';
import { useAudioQuality } from '@/composables/useAudioQuality';
import { usePracticeSessionStore } from '@/stores/practiceSession';
import type { Exercise } from '@/stores/practiceSession/types';

// Phase 3 Recording Components (minimal footprint integration)
import RecordingToggleButton from './components/RecordingToggleButton.vue';
import RecordingStatusDisplay from './components/RecordingStatusDisplay.vue';
import AudioQualityIndicator from './components/AudioQualityIndicator.vue';
import AudioQualityDetails from './components/AudioQualityDetails.vue';
import WaveformDisplay from '@/components/WaveformDisplay.vue';
import InstructionsDialog from './components/InstructionsDialog.vue';
import MicrophoneSettingsDialog from './components/MicrophoneSettingsDialog.vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Tag from 'primevue/tag';

// Helper function to convert Float32Array to WAV blob
function float32ArrayToWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert Float32 to Int16
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const route = useRoute();
const router = useRouter();
const messaging = useMessagingStore();
const practiceSession = usePracticeSessionStore();
const loc = useLocalizationStore();

// State
const exercise = ref<ExerciseDetail | null>(null);
const loading = ref(true);
const isLoadingExercise = ref(false);
const error = ref<string | null>(null);
const currentItemIndex = ref(0);

// Expanded practice items (items × repetitions)
interface PracticeIteration {
  item: ExerciseItem
  iteration: number // 1-based iteration number
  totalIterations: number
}

const practiceQueue = ref<PracticeIteration[]>([]);

// Phase 3 Recording Integration (complete functionality per spec)
const audioRecorder = useAudioRecorder();
const audioDevices = useAudioDevices();
const audioStreaming = useAudioStreaming();
const audioQuality = useAudioQuality();

// UI State
const showWaveform = ref(false);
const showQualityDetails = ref(false);
const showInstructionsDialog = ref(false);
const showMicrophoneDialog = ref(false);
const mediaStream = ref<MediaStream | null>(null);
const localMediaRecorder = ref<MediaRecorder | null>(null);
const lastChunk = ref<Blob | null>(null);
const chunkIndex = ref(0);

// Web Audio API for raw PCM streaming
const audioContext = ref<AudioContext | null>(null);
const scriptProcessor = ref<ScriptProcessorNode | null>(null);
const audioChunkBuffer = ref<Float32Array[]>([]);
const streamingInterval = ref<number | null>(null);

// Computed
const fileSizeBytes = computed(() => audioRecorder.duration.value * 16000 * 2); // Approximate
const hasQualityIssues = computed(() => audioQuality.qualityLevel.value === 'poor');

// Computed
const currentPracticeItem = computed<PracticeIteration | null>(() => {
  if (practiceQueue.value.length === 0) return null
  return practiceQueue.value[currentItemIndex.value] ?? null
})

const currentItem = computed<ExerciseItem | null>(() => {
  return currentPracticeItem.value?.item ?? null
})

// Get localized content for current item
const currentContent = computed(() => {
  if (!currentItem.value?.contents) return null
  const content = currentItem.value.contents.find(c => c.language === 'de')
  return content ?? currentItem.value.contents[0] ?? null
})

const currentInstructions = computed(() => {
  if (!exercise.value?.instructions?.length) return null;
  // Get instructions for current language (default to 'de')
  const instruction = exercise.value.instructions.find(inst => inst.language === 'de');
  return instruction ?? exercise.value.instructions[0]; // Fallback to first available
});

const progressPercentage = computed(() => {
  if (practiceQueue.value.length === 0) return 0
  return ((currentItemIndex.value + 1) / practiceQueue.value.length) * 100
})

// Methods
const expandItemsIntoPracticeQueue = (items: ExerciseItem[]): PracticeIteration[] => {
  const queue: PracticeIteration[] = []

  for (const item of items) {
    const repetitions = item.repetitions ?? 1

    // Create multiple iterations based on repetitions
    for (let i = 1; i <= repetitions; i++) {
      queue.push({
        item,
        iteration: i,
        totalIterations: repetitions
      })
    }
  }

  return queue
}

const loadExercise = async () => {
  const exerciseId = route.query.id as string;
  if (!exerciseId) {
    error.value = 'Keine Übungs-ID angegeben';
    loading.value = false;
    return;
  }

  // Prevent duplicate calls if already loading
  if (isLoadingExercise.value) {
    return;
  }

  try {
    isLoadingExercise.value = true;
    loading.value = true;
    error.value = null;

    // Load exercise with all items
    exercise.value = await exercisesApi.getWithItems(
      exerciseId,
      'de' // TODO: Get from localization service
    );

    // Check if exercise is active
    if (!exercise.value.is_active) {
      error.value = 'Diese Übung ist nicht verfügbar';
      return;
    }

    // Expand items by repetitions into practice queue
    practiceQueue.value = expandItemsIntoPracticeQueue(exercise.value.items)

    // Create practice session
    await practiceSession.startSession(exerciseId, exercise.value as unknown as Exercise, practiceQueue.value.length);

    // Items are already sorted by backend

    // Show instructions dialog if available
    if (currentInstructions.value) {
      showInstructionsDialog.value = true;
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Übung';
    error.value = errorMessage ?? 'Fehler beim Laden der Übung';
    void messaging.error('Übung konnte nicht geladen werden');
  } finally {
    isLoadingExercise.value = false;
    loading.value = false;
  }
};

const formatDifficulty = (level: string) => {
  const labels: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
  };
  return labels[level] ?? level;
};

const formatItemType = (type: string) => {
  const labels: Record<string, string> = {
    minimal_pair: 'Minimalpaar',
    word: 'Wort',
    sentence: 'Satz',
    breathing: 'Atemübung',
    vocalization: 'Stimmgebung',
    articulation: 'Artikulation',
    rhythm: 'Rhythmus',
    intonation: 'Intonation',
    movement: 'Bewegung',
    speech_practice: 'Sprechübung',
    information: 'Information',
  };
  return labels[type] ?? type;
};

const nextItem = async () => {
  if (practiceQueue.value.length > 0 && currentItemIndex.value < practiceQueue.value.length - 1) {
    // Capture event timestamp ONCE
    const eventTimestamp = Date.now();

    // Create result for CURRENT item before moving (only if not already created)
    const currentItem = practiceQueue.value[currentItemIndex.value];
    if (currentItem && practiceSession.currentSession && practiceSession.isRecording) {
      // Check if result already exists for this item+iteration
      const resultKey = `${currentItem.item.id}-${currentItem.iteration}`;
      const existingResults = Array.from(practiceSession.results.values());
      const alreadyCreated = existingResults.some(
        r => r.exerciseItemId === currentItem.item.id && r.iterationNumber === currentItem.iteration
      );

      if (!alreadyCreated) {
        await practiceSession.createResult(currentItem.item.id, currentItem.iteration, eventTimestamp);
      } else {
        console.log('[Practice] Skipping duplicate result creation for:', resultKey);
      }
    }

    // Move to next item
    currentItemIndex.value++;

    // Mark start time for the new current item (same timestamp = no gap!)
    if (practiceSession.isRecording) {
      practiceSession.startNextItem(eventTimestamp);
    }
  }
};

const previousItem = async () => {
  if (currentItemIndex.value > 0) {
    // Capture event timestamp ONCE
    const eventTimestamp = Date.now();

    // Create result for CURRENT item before moving back (only if not already created)
    const currentItem = practiceQueue.value[currentItemIndex.value];
    if (currentItem && practiceSession.currentSession && practiceSession.isRecording) {
      // Check if result already exists for this item+iteration
      const resultKey = `${currentItem.item.id}-${currentItem.iteration}`;
      const existingResults = Array.from(practiceSession.results.values());
      const alreadyCreated = existingResults.some(
        r => r.exerciseItemId === currentItem.item.id && r.iterationNumber === currentItem.iteration
      );

      if (!alreadyCreated) {
        await practiceSession.createResult(currentItem.item.id, currentItem.iteration, eventTimestamp);
      } else {
        console.log('[Practice] Skipping duplicate result creation for:', resultKey);
      }
    }

    // Move to previous item
    currentItemIndex.value--;

    // Mark start time for the new current item (same timestamp = no gap!)
    if (practiceSession.isRecording) {
      practiceSession.startNextItem(eventTimestamp);
    }
  }
};

const handleExit = async () => {
  // If recording is active, stop it and complete the session first
  if (audioRecorder.isRecording.value) {
    try {
      await handleStopRecording();
      console.log('[Practice] Recording stopped and session completed before exit');
    } catch (error) {
      console.error('[Practice] Failed to stop recording before exit:', error);
    }
  } else if (practiceSession.currentSession && practiceSession.currentSession.status !== 'completed') {
    // No recording but session is active - abandon it
    await practiceSession.abandonSession();
    console.log('[Practice] Session abandoned on exit (no recording)');
  }
  goBack();
};

const completeExercise = async () => {
  // If recording is active, stop it first and wait for completion
  if (audioRecorder.isRecording.value) {
    await handleStopRecording();
  }

  void messaging.success('Übung abgeschlossen!');
  goBack();
};

const goBack = () => {
  // Use backTo URL param if provided, otherwise default to exercises
  const backTo = route.query.backTo as string;
  if (backTo) {
    void router.push(backTo);
  } else {
    void router.push('/exercises');
  }
};

// Phase 3 Recording Handlers (complete integration per spec)
const handleStartRecording = async () => {
  // Request permission and enumerate devices if not already done
  if (!audioDevices.permissionGranted.value) {
    const granted = await audioDevices.requestPermission();
    if (!granted) {
      void messaging.error('Mikrofon-Berechtigung verweigert');
      return;
    }
  }

  // Connect to WebSocket for streaming
  if (!audioStreaming.isConnected.value) {
    await audioStreaming.connect();
  }

  try {
    chunkIndex.value = 0;
    lastChunk.value = null;

    // Get media stream with proper constraints
    const constraints: MediaStreamConstraints = {
      audio: audioDevices.selectedDeviceId.value
        ? {
          deviceId: { exact: audioDevices.selectedDeviceId.value },
          echoCancellation: true,
          noiseSuppression: false, // Keep original for backend analysis
          autoGainControl: false,
          sampleRate: 16000,
          channelCount: 1,
        }
        : {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000,
          channelCount: 1,
        },
    };

    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);

    // Start streaming session
    audioStreaming.startStreaming({
      language: 'de',
      onPartialTranscription: (_text) => {
        // Transcription available if needed
      },
      onFinalTranscription: (response) => {
        if (response.quality_metrics) {
          audioQuality.updateMetrics(response.quality_metrics);
        }
      },
    });

    // Create AudioContext for raw PCM capture
    audioContext.value = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.value.createMediaStreamSource(mediaStream.value);

    // Use ScriptProcessorNode to capture raw audio samples
    // Note: AudioWorklet is better but requires more setup
    scriptProcessor.value = audioContext.value.createScriptProcessor(4096, 1, 1);

    scriptProcessor.value.onaudioprocess = (event) => {
      if (!audioStreaming.isStreaming.value) return;

      // Get audio samples (Float32Array)
      const inputData = event.inputBuffer.getChannelData(0);

      // Clone the data (it gets reused)
      const chunk = new Float32Array(inputData);
      audioChunkBuffer.value.push(chunk);
    };

    // Connect audio graph: source -> processor -> destination (muted)
    source.connect(scriptProcessor.value);
    scriptProcessor.value.connect(audioContext.value.destination);

    // Send accumulated chunks every 1 second
    streamingInterval.value = window.setInterval(() => {
      if (audioChunkBuffer.value.length === 0) return;

      try {
        // Concatenate all accumulated chunks
        const totalLength = audioChunkBuffer.value.reduce((sum, chunk) => sum + chunk.length, 0);
        const concatenated = new Float32Array(totalLength);
        let offset = 0;

        for (const chunk of audioChunkBuffer.value) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }

        // Clear buffer
        audioChunkBuffer.value = [];

        // Convert Float32Array to WAV blob
        const wavBlob = float32ArrayToWav(concatenated, 16000);

        // Send to WebSocket (non-final)
        void audioStreaming.sendChunk(wavBlob, false);
        chunkIndex.value++;

      } catch (_error) {
        // Error handling for chunk sending
      }
    }, 1000);

    // Also start MediaRecorder for final full recording
    // Priority: MP4 for Safari compatibility, then WebM for Chrome/Firefox
    let mimeType = 'audio/webm'; // fallback
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
    }

    localMediaRecorder.value = new MediaRecorder(mediaStream.value, { mimeType });

    const recordedChunks: Blob[] = [];
    localMediaRecorder.value.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    localMediaRecorder.value.onstop = () => {
      lastChunk.value = new Blob(recordedChunks, { type: mimeType });
    };

    localMediaRecorder.value.start();

    // Also start the built-in recorder for duration tracking
    const success = await audioRecorder.startRecording(audioDevices.selectedDeviceId.value ?? undefined);

    // Start practice session recording
    if (practiceSession.currentSession) {
      await practiceSession.startRecording();
      // Note: First item timestamp will be created when recording stops
    }

    if (success) {
      void messaging.info('Aufnahme gestartet');
    } else {
      void messaging.error('Aufnahme konnte nicht gestartet werden');
      // Cleanup on failure
      if (localMediaRecorder.value) {
        localMediaRecorder.value.stop();
      }
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => track.stop());
        mediaStream.value = null;
      }
      audioStreaming.stopStreaming();
    }
  } catch (_err) {
    void messaging.error('Konnte Mikrofon nicht aktivieren');
    audioStreaming.stopStreaming();
  }
};

const handleStopRecording = async () => {
  // Capture stop timestamp FIRST (before any async operations)
  const stopTimestamp = Date.now();

  try {
    // Stop streaming interval
    if (streamingInterval.value) {
      clearInterval(streamingInterval.value);
      streamingInterval.value = null;
    }

    // Disconnect Web Audio API
    if (scriptProcessor.value) {
      scriptProcessor.value.disconnect();
      scriptProcessor.value.onaudioprocess = null;
      scriptProcessor.value = null;
    }

    if (audioContext.value) {
      await audioContext.value.close();
      audioContext.value = null;
    }

    // Stop MediaRecorder
    if (localMediaRecorder.value && localMediaRecorder.value.state !== 'inactive') {
      localMediaRecorder.value.stop();
    }

    // Wait for final chunk processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Stop built-in recorder (for duration tracking)
    audioRecorder.stopRecording();

    // Stop media stream
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => {
        track.stop();
      });
      mediaStream.value = null;
    }

    // Send the last chunk as final (if exists)
    if (lastChunk.value && audioStreaming.isStreaming.value) {
      await audioStreaming.sendChunk(lastChunk.value, true);
      // Don't nullify lastChunk yet - we need it for upload!
    }

    audioStreaming.stopStreaming();
    localMediaRecorder.value = null;

    // Hide waveform when recording stops
    showWaveform.value = false;

    void messaging.success('Aufnahme gestoppt');

    // Create result for FINAL item before completing session (only if not already created)
    const currentItem = practiceQueue.value[currentItemIndex.value];
    if (currentItem && practiceSession.currentSession && practiceSession.isRecording) {
      // Check if result already exists for this item+iteration
      const resultKey = `${currentItem.item.id}-${currentItem.iteration}`;
      const existingResults = Array.from(practiceSession.results.values());
      const alreadyCreated = existingResults.some(
        r => r.exerciseItemId === currentItem.item.id && r.iterationNumber === currentItem.iteration
      );

      if (!alreadyCreated) {
        await practiceSession.createResult(currentItem.item.id, currentItem.iteration, stopTimestamp);
      } else {
        console.log('[Practice] Skipping duplicate result creation for final item:', resultKey);
      }
    }

    // Complete session with audio upload
    // Use lastChunk from our MediaRecorder (has correct MIME type)
    const blob = lastChunk.value ?? audioRecorder.getRecordedBlob();

    console.log('[Practice] Audio blob for upload:', {
      hasLastChunk: !!lastChunk.value,
      lastChunkSize: lastChunk.value?.size,
      lastChunkType: lastChunk.value?.type,
      hasRecordedBlob: !!audioRecorder.getRecordedBlob(),
      recordedBlobSize: audioRecorder.getRecordedBlob()?.size,
      recordedBlobType: audioRecorder.getRecordedBlob()?.type,
      finalBlobSize: blob?.size,
      finalBlobType: blob?.type,
    });

    if (!blob) {
      console.error('[Practice] No audio blob available for upload');
      void messaging.error('Keine Aufnahme zum Speichern verfügbar');
    } else if (!practiceSession.currentSession) {
      console.error('[Practice] No active session to complete');
      void messaging.error('Keine aktive Sitzung zum Abschließen');
    } else {
      console.log('[Practice] Completing session with blob:', blob.size, 'bytes');
      await practiceSession.completeSession(blob);
      void messaging.success('Übungssitzung gespeichert');

      // Clean up blob after successful upload
      lastChunk.value = null;
    }
  } catch (_err) {
    audioStreaming.stopStreaming();
    localMediaRecorder.value = null;
    lastChunk.value = null;
    showWaveform.value = false;
  }
};

// Watch for quality metrics from streaming
watch(() => audioStreaming.qualityMetrics.value, (metrics) => {
  if (metrics) {
    audioQuality.updateMetrics(metrics);
  }
});

// Lifecycle
onMounted(async () => {
  void loadExercise();

  // Request permission and enumerate devices
  await audioDevices.requestPermission();

  // Start device change listener
  audioDevices.startDeviceChangeListener();

  // Connect to WebSocket
  await audioStreaming.connect();
});

onUnmounted(async () => {
  // If there's an active session with recording, try to save it before unmounting
  if (practiceSession.currentSession && practiceSession.currentSession.status === 'in_progress') {
    // If recording is active, stop it and complete the session
    if (audioRecorder.isRecording.value) {
      try {
        // Stop recording
        audioRecorder.stopRecording();

        // Get the recorded blob
        const blob = lastChunk.value ?? audioRecorder.getRecordedBlob();

        if (blob && blob.size > 0) {
          // Complete session with the audio
          await practiceSession.completeSession(blob);
          console.log('[Practice] Session auto-completed on unmount');
        } else {
          // No audio, mark as abandoned
          await practiceSession.abandonSession();
          console.log('[Practice] Session abandoned on unmount (no audio)');
        }
      } catch (error) {
        console.error('[Practice] Failed to complete session on unmount:', error);
        // Reset without saving
        practiceSession.resetSession();
      }
    } else {
      // Session active but no recording - abandon it
      await practiceSession.abandonSession();
      console.log('[Practice] Session abandoned on unmount (no recording)');
    }
  } else {
    // No active session or already completed, just reset
    practiceSession.resetSession();
  }

  // Stop device change listener
  audioDevices.stopDeviceChangeListener();

  // Clean up local MediaRecorder
  if (localMediaRecorder.value && localMediaRecorder.value.state !== 'inactive') {
    localMediaRecorder.value.stop();
  }

  // Cleanup media stream
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
  }

  // Disconnect WebSocket
  audioStreaming.disconnect();
});
</script>
<style scoped>
/* Recording pulse animation */
@keyframes recording-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.recording-pulse {
  animation: recording-pulse 1.5s ease-in-out infinite;
}
</style>