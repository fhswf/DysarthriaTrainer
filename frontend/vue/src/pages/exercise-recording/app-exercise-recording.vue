<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';

import RecordingControls from '@/components/RecordingControls.vue';
import WaveformDisplay from '@/components/WaveformDisplay.vue';
import TranscriptionPanel from '@/components/TranscriptionPanel.vue';
import AudioQualityIndicator from '@/components/AudioQualityIndicator.vue';
import DeviceSelector from '@/components/DeviceSelector.vue';

import { useAudioDevices } from '@/composables/useAudioDevices';
import { useAudioRecorder } from '@/composables/useAudioRecorder';
import { useAudioStreaming } from '@/composables/useAudioStreaming';
import { useAudioQuality } from '@/composables/useAudioQuality';

const loc = useLocalizationStore();
const router = useRouter();
const route = useRoute();

// Composables
const audioDevicesComposable = useAudioDevices();
const {
  devices,
  selectedDeviceId,
  permissionGranted,
  error: deviceError,
  requestPermission,
  enumerateDevices,
  selectDevice,
  startDeviceChangeListener,
  stopDeviceChangeListener,
} = audioDevicesComposable;

const {
  isRecording,
  isPaused,
  duration,
  recordedBlob,
  error: recorderError,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  clearRecording,
  getRecordedBase64,
} = useAudioRecorder();

const {
  isConnected,
  isStreaming,
  partialTranscription,
  finalTranscription,
  warnings,
  error: streamingError,
  connect,
  disconnect,
  startStreaming,
  sendChunk,
  stopStreaming,
} = useAudioStreaming();

const {
  metrics,
  qualityLevel,
  qualityColor,
  qualityLabel,
  isSuitableForTherapy,
  updateMetrics,
  clear: clearQuality,
} = useAudioQuality();

// Local state
const mediaStream = ref<MediaStream | null>(null);
const isProcessing = ref(false);
const exerciseId = computed(() => route.params.id as string);
const chunkIndex = ref(0);
const localMediaRecorder = ref<MediaRecorder | null>(null);
const lastChunk = ref<Blob | null>(null);

// Computed
const currentTranscription = computed(() => {
  return isStreaming.value ? partialTranscription.value : finalTranscription.value;
});

const combinedError = computed(() => {
  return deviceError.value ?? recorderError.value ?? streamingError.value;
});

const canRecord = computed(() => {
  return permissionGranted.value && isConnected.value && !isProcessing.value;
});

// Lifecycle
onMounted(async () => {
  // Start device change listener
  startDeviceChangeListener();

  // Request microphone permission
  await requestPermission();

  // Connect to WebSocket
  await connect();
});

onUnmounted(() => {
  // Stop device change listener
  stopDeviceChangeListener();

  // Clean up local MediaRecorder
  if (localMediaRecorder.value && localMediaRecorder.value.state !== 'inactive') {
    localMediaRecorder.value.stop();
  }

  // Clean up media stream
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
  }

  disconnect();
});

// Handlers
const handleStart = async () => {
  try {
    isProcessing.value = true;
    chunkIndex.value = 0;

    // Get media stream with proper audio constraints
    const constraints: MediaStreamConstraints = {
      audio: selectedDeviceId.value
        ? {
          deviceId: { exact: selectedDeviceId.value },
          echoCancellation: true,
          noiseSuppression: false, // Keep original for backend analysis
          autoGainControl: false,
          sampleRate: 16000, // 16kHz for speech recognition
          channelCount: 1, // Mono
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
    startStreaming({
      language: 'de',
      onPartialTranscription: (_text) => {
        // Partial transcription received - handled by composable
      },
      onFinalTranscription: (response) => {
        // Final transcription received
        if (response.quality_metrics) {
          updateMetrics(response.quality_metrics);
        }
      },
    });

    // Create our own MediaRecorder to intercept chunks
    const mimeType = MediaRecorder.isTypeSupported('audio/wav')
      ? 'audio/wav'
      : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

    localMediaRecorder.value = new MediaRecorder(mediaStream.value, { mimeType });

    // Handle data available - store chunk and send previous one
    localMediaRecorder.value.ondataavailable = async (event: BlobEvent) => {
      if (event.data.size > 0 && isStreaming.value) {
        try {
          // Send previous chunk as non-final (if exists)
          if (lastChunk.value) {
            await sendChunk(lastChunk.value, false);
            chunkIndex.value++;
          }
          // Store current chunk (will be sent on next iteration or as final)
          lastChunk.value = event.data;
        } catch (error) {
          console.error('Failed to send audio chunk:', error);
        }
      }
    };

    // Handle recording stop
    localMediaRecorder.value.onstop = () => {
      isRecording.value = false;
      isPaused.value = false;
    };

    // Handle errors
    localMediaRecorder.value.onerror = (event: Event) => {
      console.error('MediaRecorder error:', event);
      error.value = 'Aufnahmefehler aufgetreten';
    };

    // Start recording with 1-second chunks
    localMediaRecorder.value.start(1000);
    isRecording.value = true;

    // Also start the built-in recorder for duration tracking
    await startRecording(selectedDeviceId.value ?? undefined);

    isProcessing.value = false;
  } catch (err) {
    // Failed to start recording
    console.error('Recording start error:', err);
    stopStreaming();
    isProcessing.value = false;
  }
};

const handleStop = async () => {
  try {
    isProcessing.value = true;

    // Stop local MediaRecorder (triggers one final ondataavailable event)
    if (localMediaRecorder.value && localMediaRecorder.value.state !== 'inactive') {
      localMediaRecorder.value.stop();
    }

    // Wait a moment for the final chunk to be collected
    await new Promise(resolve => setTimeout(resolve, 100));

    // Stop built-in recorder (for duration tracking)
    stopRecording();

    // Stop media stream
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop());
      mediaStream.value = null;
    }

    // Send the last chunk as final (if exists)
    if (lastChunk.value && isStreaming.value) {
      await sendChunk(lastChunk.value, true);
      lastChunk.value = null;
    }

    stopStreaming();
    localMediaRecorder.value = null;
    isProcessing.value = false;
  } catch (err) {
    // Failed to stop recording
    console.error('Recording stop error:', err);
    stopStreaming();
    localMediaRecorder.value = null;
    lastChunk.value = null;
    isProcessing.value = false;
  }
};

const handlePause = () => {
  if (localMediaRecorder.value && localMediaRecorder.value.state === 'recording') {
    localMediaRecorder.value.pause();
  }
  pauseRecording();
};

const handleResume = () => {
  if (localMediaRecorder.value && localMediaRecorder.value.state === 'paused') {
    localMediaRecorder.value.resume();
  }
  resumeRecording();
};

const handleDeviceSelect = (deviceId: string) => {
  selectDevice(deviceId);
};

const handleDeviceRefresh = async () => {
  await enumerateDevices();
};

const handleClear = () => {
  clearRecording();
  clearQuality();
  lastChunk.value = null;
  chunkIndex.value = 0;
};

const handleSave = async () => {
  try {
    isProcessing.value = true;

    if (!recordedBlob.value) {
      console.warn('[Recording] No recorded audio to save');
      return;
    }

    console.log('[Recording] Saving session...');

    // 1. Create practice session
    const sessionResponse = await fetch('/api/v1/practice/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        exercise_id: exerciseId.value,
        total_items: 1,
        metadata: {},
      }),
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
    }

    const session = await sessionResponse.json();
    console.log('[Recording] Session created:', session.id);

    // 2. Upload audio file
    const formData = new FormData();
    formData.append('file', recordedBlob.value, 'recording.webm');
    formData.append('metadata', JSON.stringify({
      session_id: session.id,
      duration_ms: duration.value * 1000,
      transcription: finalTranscription.value,
    }));

    const uploadResponse = await fetch('/api/v1/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
    }

    const mediaFile = await uploadResponse.json();
    console.log('[Recording] Audio uploaded:', mediaFile.id);

    // 3. Complete session
    const completeResponse = await fetch(`/api/v1/practice/sessions/${session.id}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        audio_file_id: mediaFile.id,
        recording_duration_ms: duration.value * 1000,
        total_items: 1,
        completed_items: 1,
      }),
    });

    if (!completeResponse.ok) {
      throw new Error(`Failed to complete session: ${completeResponse.statusText}`);
    }

    console.log('[Recording] Session completed successfully');
    alert(loc.t('audio.recording.saved'));

    // Clear recording after successful save
    handleClear();

  } catch (error) {
    console.error('[Recording] Failed to save session:', error);
    alert(loc.t('audio.recording.saveFailed') || 'Failed to save recording');
  } finally {
    isProcessing.value = false;
  }
};

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="exercise-recording-page p-6">
    <div class="page-header flex items-center gap-4 mb-6">
      <button type="button" class="p-2 rounded hover:bg-gray-100" @click="handleBack">
        <i class="pi pi-arrow-left"></i>
      </button>
      <h1 class="text-3xl font-bold">{{ loc.t('audio.recording.title', { id: exerciseId }) }}</h1>
    </div>

    <!-- Error Messages -->
    <div v-if="combinedError" class="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ combinedError }}
    </div>

    <!-- Quality Warning -->
    <div v-if="metrics && !isSuitableForTherapy"
      class="p-4 mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
      {{ loc.t('audio.quality.notSuitableForTherapy') }}
    </div>

    <div class="content-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Controls & Device -->
      <div class="left-column space-y-6">
        <!-- Device Selector -->
        <div class="p-4 border rounded-lg bg-white shadow-sm">
          <DeviceSelector :devices="devices" :selected-device-id="selectedDeviceId" :disabled="isRecording"
            @select="handleDeviceSelect" @refresh="handleDeviceRefresh" />
        </div>

        <!-- Recording Controls -->
        <RecordingControls :is-recording="isRecording" :is-paused="isPaused" :is-connected="isConnected"
          :duration="duration" :disabled="!canRecord" @start="handleStart" @stop="handleStop" @pause="handlePause"
          @resume="handleResume" />

        <!-- Audio Quality Indicator -->
        <AudioQualityIndicator :metrics="metrics" :level="qualityLevel" :color="qualityColor" :label="qualityLabel" />
      </div>

      <!-- Right Column: Waveform & Transcription -->
      <div class="right-column space-y-6">
        <!-- Waveform Display -->
        <div class="p-4 border rounded-lg bg-white shadow-sm">
          <h3 class="text-lg font-semibold mb-4">{{ loc.t('audio.waveform.title') }}</h3>
          <WaveformDisplay :stream="mediaStream" :width="800" :height="120" type="bars" />
        </div>

        <!-- Transcription Panel -->
        <TranscriptionPanel :transcription="currentTranscription" :is-processing="isProcessing" :warnings="warnings"
          language="de" />

        <!-- Actions -->
        <div class="actions">
          <Button :label="loc.t('common.clear')" icon="pi pi-times" severity="secondary" outlined
            :disabled="!recordedBlob" @click="handleClear" />
          <Button :label="loc.t('common.save')" icon="pi pi-save" :disabled="!recordedBlob || !finalTranscription"
            @click="handleSave" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-recording-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.error-message,
.quality-warning {
  margin-bottom: 1.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
