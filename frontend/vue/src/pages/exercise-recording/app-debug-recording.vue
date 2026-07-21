<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">🎤 Audio Aufnahme & Transkription</h1>

    <!-- Connection Status -->
    <div v-if="wsConnected"
      class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
      <span class="text-xl">✅</span>
      <span>WebSocket verbunden</span>
    </div>
    <div v-else class="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex items-center gap-2">
      <span class="text-xl">⚠️</span>
      <span>WebSocket nicht verbunden - Real-time Transkription deaktiviert</span>
    </div>

    <!-- Request Permission Button -->
    <div v-if="!permissionGranted" class="mb-6">
      <button @click="requestPermission"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
        🎤 Mikrofon-Berechtigung anfordern
      </button>
    </div>

    <div v-if="permissionGranted" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Controls -->
      <div class="lg:col-span-1 space-y-4">
        <!-- Device Selector -->
        <div class="p-4 bg-white border rounded-lg shadow-sm">
          <label class="block mb-2 font-bold text-sm">Mikrofon auswählen:</label>
          <select v-model="selectedDeviceId" @change="onDeviceChange" :disabled="isRecording"
            class="w-full p-2 border rounded">
            <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label }}
            </option>
          </select>
        </div>

        <!-- Recording Controls -->
        <div class="p-4 bg-white border rounded-lg shadow-sm">
          <h3 class="font-bold mb-3">Aufnahme</h3>
          <div class="flex flex-col gap-2">
            <button v-if="!isRecording" @click="handleStartRecording"
              class="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 font-semibold">
              ⏺ Aufnahme starten
            </button>

            <button v-if="isRecording && !isPaused" @click="pauseRecording"
              class="px-4 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              ⏸ Pause
            </button>

            <button v-if="isRecording && isPaused" @click="resumeRecording"
              class="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
              ▶ Fortsetzen
            </button>

            <button v-if="isRecording" @click="handleStopRecording"
              class="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">
              ⏹ Aufnahme beenden
            </button>
          </div>

          <!-- Duration -->
          <div v-if="isRecording" class="mt-4 text-center">
            <p class="text-3xl font-mono font-bold">{{ formattedDuration }}</p>
            <p class="text-sm text-gray-600 mt-1">{{ isPaused ? '⏸ PAUSIERT' : '⏺ AUFNAHME LÄUFT' }}</p>
          </div>
        </div>

        <!-- Playback -->
        <div v-if="recordedBlob" class="p-4 bg-white border rounded-lg shadow-sm">
          <h3 class="font-bold mb-3">🔊 Wiedergabe</h3>
          <audio :src="audioUrl" controls class="w-full mb-3"></audio>
          <button @click="clearRecording" class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            🗑 Löschen
          </button>
        </div>
      </div>

      <!-- Right Column: Visualization & Transcription -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Waveform Display -->
        <div class="p-4 bg-white border rounded-lg shadow-sm">
          <h3 class="font-bold mb-3">📊 Audio Waveform</h3>
          <canvas ref="waveformCanvas" width="800" height="120" class="w-full border rounded bg-gray-50"></canvas>
        </div>

        <!-- Transcription -->
        <div class="p-4 bg-white border rounded-lg shadow-sm">
          <h3 class="font-bold mb-3">📝 Transkription</h3>
          <div v-if="isRecording || transcription" class="space-y-2">
            <div v-if="partialTranscription" class="p-3 bg-blue-50 border border-blue-200 rounded">
              <p class="text-sm text-gray-600 mb-1">Partial:</p>
              <p class="text-gray-800 italic">{{ partialTranscription }}</p>
            </div>
            <div v-if="transcription" class="p-3 bg-green-50 border border-green-200 rounded">
              <p class="text-sm text-gray-600 mb-1">Final:</p>
              <p class="text-gray-900 font-medium">{{ transcription }}</p>
            </div>
            <div v-if="!transcription && !partialTranscription && isRecording"
              class="p-3 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
              Warte auf Audio...
            </div>
          </div>
          <div v-else class="p-3 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
            Starte eine Aufnahme um die Transkription zu sehen
          </div>
        </div>

        <!-- Quality Metrics (if available) -->
        <div v-if="qualityMetrics" class="p-4 bg-white border rounded-lg shadow-sm">
          <h3 class="font-bold mb-3">📈 Audio Qualität</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">SNR (dB)</p>
              <p class="text-xl font-bold">{{ qualityMetrics.snr_db?.toFixed(1) || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Clipping</p>
              <p class="text-xl font-bold" :class="qualityMetrics.has_clipping ? 'text-red-600' : 'text-green-600'">
                {{ qualityMetrics.has_clipping ? 'Ja' : 'Nein' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Sample Rate</p>
              <p class="text-xl font-bold">{{ qualityMetrics.sample_rate || 'N/A' }} Hz</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Dauer</p>
              <p class="text-xl font-bold">{{ qualityMetrics.duration_seconds?.toFixed(1) || 'N/A' }}s</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Errors -->
    <div v-if="deviceError || recorderError || wsError" class="mt-6 p-4 bg-red-100 border border-red-400 rounded">
      <p class="font-bold text-red-700">Fehler:</p>
      <p class="text-red-600">{{ deviceError || recorderError || wsError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAudioDevices } from '@/composables/useAudioDevices';
import { useAudioRecorder } from '@/composables/useAudioRecorder';

const route = useRoute();
const exerciseId = computed(() => route.params.exerciseId as string || '');

// Use composables directly
const audioDevices = useAudioDevices();
const audioRecorder = useAudioRecorder();

// Destructure
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
} = audioDevices;

const {
  isRecording,
  isPaused,
  duration,
  formattedDuration,
  recordedBlob,
  error: recorderError,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  clearRecording,
} = audioRecorder;

// WebSocket state
const ws = ref<WebSocket | null>(null);
const wsConnected = ref(false);
const wsError = ref<string | null>(null);
const transcription = ref('');
const partialTranscription = ref('');
const qualityMetrics = ref<any>(null);

// Waveform
const waveformCanvas = ref<HTMLCanvasElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const dataArray = ref<Uint8Array | null>(null);
const animationFrameId = ref<number | null>(null);
const mediaStream = ref<MediaStream | null>(null);

// Audio URL for playback
const audioUrl = computed(() => {
  if (recordedBlob.value) {
    return URL.createObjectURL(recordedBlob.value);
  }
  return '';
});

// WebSocket Functions
const connectWebSocket = () => {
  try {
    // Build WebSocket URL dynamically for both localhost and VM/WireGuard access
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost'
      ? 'localhost:8000'
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/audio/ws/audio/stream`;

    console.log('🔌 Connecting to WebSocket:', wsUrl);
    ws.value = new WebSocket(wsUrl);

    ws.value.onopen = () => {
      console.log('✅ WebSocket connected');
      wsConnected.value = true;
      wsError.value = null;

      // Send initial session info (if backend requires it)
      ws.value?.send(JSON.stringify({
        type: 'init',
        language: 'de',
      }));
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);

        if (data.type === 'partial_transcription') {
          partialTranscription.value = data.text;
        } else if (data.type === 'final_transcription') {
          transcription.value = data.text;
          partialTranscription.value = '';
          if (data.quality_metrics) {
            qualityMetrics.value = data.quality_metrics;
          }
        } else if (data.type === 'error') {
          wsError.value = data.message;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.value.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      wsError.value = 'WebSocket Verbindungsfehler - möglicherweise keine Berechtigung';
      wsConnected.value = false;
    };

    ws.value.onclose = (event) => {
      console.log('👋 WebSocket disconnected:', event.code, event.reason);
      if (event.code === 1006) {
        wsError.value = 'WebSocket Verbindung abgebrochen (403 - keine Berechtigung?)';
      }
      wsConnected.value = false;
    };
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    wsError.value = 'WebSocket konnte nicht verbunden werden';
  }
};

const disconnectWebSocket = () => {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
    wsConnected.value = false;
  }
};

const sendAudioChunk = async (blob: Blob) => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket not connected, skipping chunk');
    return;
  }

  try {
    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      ws.value?.send(JSON.stringify({
        type: 'audio_chunk',
        data: base64,
        format: 'webm',
        sample_rate: 16000,
      }));
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Failed to send audio chunk:', error);
  }
};

// Waveform Visualization
const initWaveform = async () => {
  if (!selectedDeviceId.value || !waveformCanvas.value) return;

  try {
    // Get media stream for visualization
    const constraints: MediaStreamConstraints = {
      audio: { deviceId: { exact: selectedDeviceId.value } },
    };
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);

    // Create audio context and analyser
    audioContext.value = new AudioContext();
    analyser.value = audioContext.value.createAnalyser();
    analyser.value.fftSize = 2048;

    const source = audioContext.value.createMediaStreamSource(mediaStream.value);
    source.connect(analyser.value);

    const bufferLength = analyser.value.frequencyBinCount;
    dataArray.value = new Uint8Array(bufferLength);

    // Start drawing
    drawWaveform();
  } catch (error) {
    console.error('Failed to initialize waveform:', error);
  }
};

const drawWaveform = () => {
  if (!waveformCanvas.value || !analyser.value || !dataArray.value) return;

  const canvas = waveformCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  animationFrameId.value = requestAnimationFrame(drawWaveform);

  analyser.value.getByteTimeDomainData(dataArray.value);

  // Clear canvas
  ctx.fillStyle = 'rgb(249, 250, 251)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw waveform
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgb(34, 197, 94)'; // Green
  ctx.beginPath();

  const sliceWidth = WIDTH / dataArray.value.length;
  let x = 0;

  for (let i = 0; i < dataArray.value.length; i++) {
    const v = dataArray.value[i] / 128.0;
    const y = (v * HEIGHT) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();
};

const stopWaveform = () => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }

  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }

  if (audioContext.value) {
    audioContext.value.close();
    audioContext.value = null;
  }
};

// Device change handler
const onDeviceChange = () => {
  if (selectedDeviceId.value) {
    selectDevice(selectedDeviceId.value);
  }
};

// Recording handlers
const handleStartRecording = async () => {
  console.log('🎤 Starting recording...');

  // Reset state
  transcription.value = '';
  partialTranscription.value = '';
  qualityMetrics.value = null;

  // Initialize waveform
  await initWaveform();

  // Start recording
  await startRecording(selectedDeviceId.value || undefined);
  console.log('  - Recording started:', isRecording.value);
};

const handleStopRecording = async () => {
  console.log('⏹ Stopping recording...');

  // Stop recording
  stopRecording();

  // Stop waveform
  stopWaveform();

  // Send final audio to backend if WebSocket is connected
  if (recordedBlob.value && wsConnected.value) {
    console.log('📤 Sending final audio to backend...');
    await sendAudioChunk(recordedBlob.value);
  }

  console.log('  - Recording stopped');
};

// Initialize
onMounted(async () => {
  console.log('🔄 DebugRecordingPage mounted');

  // Start device change listener
  startDeviceChangeListener();

  // Request permission
  if (permissionGranted.value) {
    await enumerateDevices();
  }

  // Connect WebSocket
  connectWebSocket();
});

onUnmounted(() => {
  console.log('👋 DebugRecordingPage unmounted');

  // Stop device change listener
  stopDeviceChangeListener();

  // Stop waveform
  stopWaveform();

  // Disconnect WebSocket
  disconnectWebSocket();

  // Cleanup audio URL
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
});
</script>
