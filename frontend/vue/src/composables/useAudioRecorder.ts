/**
 * Audio Recorder Composable
 * 
 * Manages audio recording using MediaRecorder API.
 * Prioritizes WAV format for medical/clinical applications.
 */

import { ref, computed } from 'vue';
import type { Ref } from 'vue';

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
}

export function useAudioRecorder() {
  const mediaRecorder = ref<MediaRecorder | null>(null);
  const mediaStream = ref<MediaStream | null>(null);
  const isRecording = ref(false);
  const isPaused = ref(false);
  const duration = ref(0);
  const recordedChunks = ref<Blob[]>([]);
  const recordedBlob = ref<Blob | null>(null);
  const error = ref<string | null>(null);

  let durationInterval: number | null = null;

  /**
   * Detect best supported audio format
   * Prioritizes WAV for medical applications
   */
  const detectSupportedFormat = (): { mimeType: string; extension: string } => {
    // Priority order: WAV > WebM (Opus) > WebM (VP8)
    const formats = [
      { mimeType: 'audio/wav', extension: 'wav' },
      { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
      { mimeType: 'audio/webm', extension: 'webm' },
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        return format;
      }
    }

    // Fallback
    return { mimeType: '', extension: 'webm' };
  };

  const supportedFormat = detectSupportedFormat();

  /**
   * Start recording from specified device
   */
  const startRecording = async (deviceId?: string): Promise<boolean> => {
    try {
      error.value = null;

      // Get media stream
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000, // 16kHz for speech recognition
              channelCount: 1, // Mono
            },
      };

      mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);

      // Create MediaRecorder
      const options: MediaRecorderOptions = supportedFormat.mimeType
        ? { mimeType: supportedFormat.mimeType }
        : {};

      mediaRecorder.value = new MediaRecorder(mediaStream.value, options);

      // Reset state
      recordedChunks.value = [];
      recordedBlob.value = null;
      duration.value = 0;

      // Handle data available
      mediaRecorder.value.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.value.onstop = () => {
        recordedBlob.value = new Blob(recordedChunks.value, {
          type: supportedFormat.mimeType || 'audio/webm',
        });
        stopDurationCounter();
      };

      // Handle errors
      mediaRecorder.value.onerror = (event: Event) => {
        error.value = 'Aufnahmefehler aufgetreten';
        console.error('MediaRecorder error:', event);
      };

      // Start recording
      mediaRecorder.value.start(1000); // Collect data every second
      isRecording.value = true;
      startDurationCounter();

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Aufnahme konnte nicht gestartet werden';
      return false;
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = (): void => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop();
      isRecording.value = false;
      isPaused.value = false;

      // Stop all media tracks
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => track.stop());
        mediaStream.value = null;
      }
    }
  };

  /**
   * Pause recording
   */
  const pauseRecording = (): void => {
    if (mediaRecorder.value && isRecording.value && !isPaused.value) {
      mediaRecorder.value.pause();
      isPaused.value = true;
      stopDurationCounter();
    }
  };

  /**
   * Resume recording
   */
  const resumeRecording = (): void => {
    if (mediaRecorder.value && isRecording.value && isPaused.value) {
      mediaRecorder.value.resume();
      isPaused.value = false;
      startDurationCounter();
    }
  };

  /**
   * Clear recorded data
   */
  const clearRecording = (): void => {
    recordedChunks.value = [];
    recordedBlob.value = null;
    duration.value = 0;
    error.value = null;
  };

  /**
   * Get recorded audio as Blob
   */
  const getRecordedBlob = (): Blob | null => {
    return recordedBlob.value;
  };

  /**
   * Get recorded audio as Data URL
   */
  const getRecordedDataURL = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!recordedBlob.value) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(recordedBlob.value);
    });
  };

  /**
   * Get recorded audio as Base64
   */
  const getRecordedBase64 = async (): Promise<string | null> => {
    const dataURL = await getRecordedDataURL();
    if (!dataURL) return null;

    // Remove data URL prefix (e.g., "data:audio/webm;base64,")
    const base64 = dataURL.split(',')[1];
    return base64;
  };

  /**
   * Download recorded audio
   */
  const downloadRecording = (filename?: string): void => {
    if (!recordedBlob.value) return;

    const url = URL.createObjectURL(recordedBlob.value);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording_${Date.now()}.${supportedFormat.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Start duration counter
   */
  const startDurationCounter = (): void => {
    durationInterval = window.setInterval(() => {
      duration.value += 1;
    }, 1000);
  };

  /**
   * Stop duration counter
   */
  const stopDurationCounter = (): void => {
    if (durationInterval !== null) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  };

  /**
   * Format duration as MM:SS
   */
  const formattedDuration = computed(() => {
    const minutes = Math.floor(duration.value / 60);
    const seconds = duration.value % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  return {
    // State
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    recordedBlob,
    error,
    supportedFormat,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    getRecordedBlob,
    getRecordedDataURL,
    getRecordedBase64,
    downloadRecording,
  };
}
