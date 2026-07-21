<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import Button from 'primevue/button';

// Props
interface Props {
  videoUrl?: string;
  posterUrl?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

const _props = withDefaults(defineProps<Props>(), {
  autoPlay: false,
  controls: true
});

// Emits
const emit = defineEmits<{
  play: [];
  pause: [];
  ended: [];
  'time-update': [time: number];
  error: [error: Error];
}>();

// Refs
const videoElement = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const aspectRatio = ref<string>('16:9');

// Computed
const aspectRatioClass = computed(() => {
  const [width, height] = aspectRatio.value.split(':').map(Number);
  const ratio = width / height;

  if (ratio > 2.2) return 'aspect-ultra-wide'; // 21:9
  if (ratio > 1.7) return 'aspect-wide'; // 16:9
  if (ratio > 1.2) return 'aspect-standard'; // 4:3
  if (ratio < 0.6) return 'aspect-portrait'; // 9:16
  return 'aspect-square'; // 1:1
});

// Methods
function handleLoadedMetadata() {
  if (videoElement.value) {
    const videoWidth = videoElement.value.videoWidth;
    const videoHeight = videoElement.value.videoHeight;

    // Detect aspect ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(videoWidth, videoHeight);
    const ratioW = videoWidth / divisor;
    const ratioH = videoHeight / divisor;
    aspectRatio.value = `${ratioW}:${ratioH}`;

    isLoading.value = false;
  }
}

function handlePlay() {
  isPlaying.value = true;
  emit('play');
}

function handlePause() {
  isPlaying.value = false;
  emit('pause');
}

function handleEnded() {
  isPlaying.value = false;
  emit('ended');
}

function handleTimeUpdate() {
  if (videoElement.value) {
    emit('time-update', videoElement.value.currentTime);
  }
}

function handleError(_event: Event) {
  hasError.value = true;
  isLoading.value = false;
  errorMessage.value = 'Video konnte nicht geladen werden';
  emit('error', new Error('Video loading failed'));
}

function retry() {
  if (videoElement.value) {
    hasError.value = false;
    isLoading.value = true;
    videoElement.value.load();
  }
}

// Cleanup
onUnmounted(() => {
  if (videoElement.value) {
    videoElement.value.pause();
    videoElement.value.src = '';
  }
});

// Expose methods
defineExpose({
  play: () => videoElement.value?.play(),
  pause: () => videoElement.value?.pause()
});
</script>

<template>
  <div v-if="videoUrl" class="video-player" :class="aspectRatioClass">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Video wird geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <i class="pi pi-exclamation-triangle" style="font-size: 2rem"></i>
      <p>{{ errorMessage }}</p>
      <Button label="Erneut versuchen" icon="pi pi-refresh" @click="retry" />
    </div>

    <!-- Video Element -->
    <video
      v-show="!isLoading && !hasError"
      ref="videoElement"
      :src="videoUrl"
      :poster="posterUrl"
      :autoplay="autoPlay"
      :controls="controls"
      @loadedmetadata="handleLoadedMetadata"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @timeupdate="handleTimeUpdate"
      @error="handleError"
      playsinline
    >
      <source :src="videoUrl" type="video/mp4" />
      Ihr Browser unterstützt keine Videos.
    </video>
  </div>
</template>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

/* Aspect Ratio Classes */
.aspect-wide {
  aspect-ratio: 16 / 9;
}

.aspect-ultra-wide {
  aspect-ratio: 21 / 9;
}

.aspect-portrait {
  aspect-ratio: 9 / 16;
}

.aspect-standard {
  aspect-ratio: 4 / 3;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

/* Fallback for browsers without aspect-ratio support */
@supports not (aspect-ratio: 16 / 9) {
  .video-player::before {
    content: '';
    display: block;
    padding-top: 56.25%; /* 16:9 */
  }

  .aspect-ultra-wide::before {
    padding-top: 42.86%; /* 21:9 */
  }

  .aspect-portrait::before {
    padding-top: 177.78%; /* 9:16 */
  }

  .aspect-standard::before {
    padding-top: 75%; /* 4:3 */
  }

  .aspect-square::before {
    padding-top: 100%; /* 1:1 */
  }
}

/* Video Element */
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
  padding: 40px;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
  padding: 40px;
  text-align: center;
}

/* Responsive */
@media (max-width: 767px) {
  .video-player {
    border-radius: 4px;
  }

  video {
    border-radius: 4px;
  }
}
</style>
