<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useWaveform } from '@/composables/useWaveform';

interface Props {
  stream?: MediaStream | null;
  width?: number;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
  type?: 'wave' | 'bars';
}

const props = withDefaults(defineProps<Props>(), {
  stream: null,
  width: 800,
  height: 100,
  barColor: '#4CAF50',
  backgroundColor: '#1e1e1e',
  type: 'bars',
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { initialize, drawBars, draw, stop, isActive } = useWaveform(canvasRef);

// Initialize waveform with stream
const initializeWaveform = async (stream: MediaStream | null) => {
  if (stream) {
    await initialize(stream, {
      barColor: props.barColor,
      backgroundColor: props.backgroundColor,
    });

    // Start appropriate drawing mode
    if (props.type === 'bars') {
      drawBars({
        barColor: props.barColor,
        backgroundColor: props.backgroundColor,
      });
    } else {
      draw({
        barColor: props.barColor,
        backgroundColor: props.backgroundColor,
      });
    }
  } else {
    stop();
  }
};

// Watch for stream changes
watch(
  () => props.stream,
  async (newStream) => {
    await initializeWaveform(newStream);
  }
);

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = props.width;
    canvasRef.value.height = props.height;
  }

  // Initialize with existing stream if available
  if (props.stream) {
    void initializeWaveform(props.stream);
  }
});
</script>

<template>
  <div class="waveform-display">
    <canvas ref="canvasRef" :width="width" :height="height" class="waveform-canvas" />
    <div v-if="!isActive" class="placeholder">
      <i class="pi pi-volume-off"></i>
      <span>Warte auf Audio-Signal...</span>
    </div>
  </div>
</template>

<style scoped>
.waveform-display {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.waveform-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #757575;
  font-size: 0.875rem;
}

.placeholder i {
  font-size: 2rem;
}
</style>
