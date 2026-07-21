/**
 * Waveform Display Composable
 * 
 * Manages audio waveform visualization using Canvas API.
 * Displays real-time audio levels during recording.
 */

import { ref, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export interface WaveformOptions {
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
}

export function useWaveform(canvasRef: Ref<HTMLCanvasElement | null>) {
  const audioContext = ref<AudioContext | null>(null);
  const analyser = ref<AnalyserNode | null>(null);
  const dataArray = ref<Uint8Array | null>(null);
  const isActive = ref(false);

  let animationFrameId: number | null = null;

  /**
   * Initialize waveform visualization
   */
  const initialize = async (
    stream: MediaStream,
    options: WaveformOptions = {}
  ): Promise<boolean> => {
    try {
      // Create audio context
      audioContext.value = new AudioContext();

      // Create analyser node
      analyser.value = audioContext.value.createAnalyser();
      analyser.value.fftSize = 2048;

      // Connect stream to analyser
      const source = audioContext.value.createMediaStreamSource(stream);
      source.connect(analyser.value);

      // Create data array for frequency data
      const bufferLength = analyser.value.frequencyBinCount;
      dataArray.value = new Uint8Array(bufferLength);

      isActive.value = true;

      // Start drawing
      draw(options);

      return true;
    } catch (err) {
      console.error('Failed to initialize waveform:', err);
      return false;
    }
  };

  /**
   * Draw waveform on canvas
   */
  const draw = (options: WaveformOptions = {}): void => {
    if (!isActive.value || !canvasRef.value || !analyser.value || !dataArray.value) {
      return;
    }

    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get frequency data
    analyser.value.getByteTimeDomainData(dataArray.value);

    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.barColor || '#4CAF50';
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / dataArray.value.length;
    let x = 0;

    for (let i = 0; i < dataArray.value.length; i++) {
      const v = dataArray.value[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Continue animation
    animationFrameId = requestAnimationFrame(() => draw(options));
  };

  /**
   * Draw bar-style waveform
   */
  const drawBars = (options: WaveformOptions = {}): void => {
    if (!isActive.value || !canvasRef.value || !analyser.value || !dataArray.value) {
      return;
    }

    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get frequency data
    analyser.value.getByteFrequencyData(dataArray.value);

    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate bar dimensions
    const barWidth = options.barWidth || 3;
    const barGap = options.barGap || 1;
    const barCount = Math.floor(canvas.width / (barWidth + barGap));
    const step = Math.floor(dataArray.value.length / barCount);

    // Draw bars
    ctx.fillStyle = options.barColor || '#4CAF50';

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray.value[dataIndex];
      const barHeight = (value / 255) * canvas.height;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Continue animation
    animationFrameId = requestAnimationFrame(() => drawBars(options));
  };

  /**
   * Stop waveform visualization
   */
  const stop = (): void => {
    isActive.value = false;

    // Cancel animation
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Close audio context
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }

    // Clear canvas
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      }
    }
  };

  /**
   * Get current audio level (0-1)
   */
  const getAudioLevel = (): number => {
    if (!analyser.value || !dataArray.value) return 0;

    analyser.value.getByteTimeDomainData(dataArray.value);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < dataArray.value.length; i++) {
      const normalized = (dataArray.value[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.value.length);

    return Math.min(rms * 2, 1); // Scale and clamp to 0-1
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stop();
  });

  return {
    // State
    isActive,

    // Actions
    initialize,
    draw,
    drawBars,
    stop,
    getAudioLevel,
  };
}
