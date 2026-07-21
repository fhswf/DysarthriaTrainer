/**
 * Audio Devices Composable
 * 
 * Manages audio input device enumeration and selection.
 * Provides reactive access to available microphones.
 */

import { ref } from 'vue';

export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export function useAudioDevices() {
  const devices = ref<AudioDevice[]>([]);
  const selectedDeviceId = ref<string | null>(null);
  const permissionGranted = ref(false);
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  /**
   * Request microphone permission and enumerate devices
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop all tracks immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      permissionGranted.value = true;
      
      // Now enumerate devices
      await enumerateDevices();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Mikrofon-Zugriff verweigert';
      permissionGranted.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Enumerate available audio input devices
   */
  const enumerateDevices = async (): Promise<void> => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter only audio input devices
      const audioInputs = allDevices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Mikrofon ${devices.value.length + 1}`,
          groupId: device.groupId,
        }));
      
      devices.value = audioInputs;
      
      // Auto-select first device if none selected
      if (audioInputs.length > 0 && !selectedDeviceId.value) {
        selectedDeviceId.value = audioInputs[0].deviceId;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Geräteauflistung fehlgeschlagen';
    }
  };

  /**
   * Select an audio device by ID
   */
  const selectDevice = (deviceId: string): void => {
    if (devices.value.some(d => d.deviceId === deviceId)) {
      selectedDeviceId.value = deviceId;
    }
  };

  /**
   * Get currently selected device
   */
  const getSelectedDevice = (): AudioDevice | null => {
    if (!selectedDeviceId.value) return null;
    return devices.value.find(d => d.deviceId === selectedDeviceId.value) || null;
  };

  /**
   * Handle device change events
   */
  const handleDeviceChange = async (): Promise<void> => {
    await enumerateDevices();
  };

  /**
   * Start listening for device changes
   */
  const startDeviceChangeListener = (): void => {
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
  };

  /**
   * Stop listening for device changes
   */
  const stopDeviceChangeListener = (): void => {
    navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  };

  return {
    // State
    devices,
    selectedDeviceId,
    permissionGranted,
    error,
    isLoading,

    // Actions
    requestPermission,
    enumerateDevices,
    selectDevice,
    getSelectedDevice,
    startDeviceChangeListener,
    stopDeviceChangeListener,
  };
}
