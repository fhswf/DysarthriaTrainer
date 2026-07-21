<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';

// Props
interface Props {
    audioUrl?: string;
    type: 'instruction' | 'example';
    mode?: 'compact' | 'full';
    autoPlay?: boolean;
    loop?: boolean;
    showProgress?: boolean;
    showTime?: boolean;
    volume?: number;
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'compact',
    autoPlay: false,
    loop: false,
    showProgress: true,
    showTime: true,
    volume: 1.0
});

// Emits
const emit = defineEmits<{
    play: [];
    pause: [];
    ended: [];
    timeupdate: [time: number];
    error: [error: Error];
}>();

// Refs
const audioElement = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isLoaded = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const hasAutoPlayed = ref(false); // Track if auto-play already triggered for current URL
const playCount = ref(0); // Track number of times audio has played for current URL

// Computed
const progressPercent = computed(() => {
    if (duration.value === 0) return 0;
    return (currentTime.value / duration.value) * 100;
});

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));

// Helper function to attempt auto-play
function attemptAutoPlay() {
    console.log('[AudioPlayer] attemptAutoPlay called', {
        type: props.type,
        autoPlay: props.autoPlay,
        hasAutoPlayed: hasAutoPlayed.value,
        isPlaying: isPlaying.value,
        hasError: hasError.value,
        audioUrl: props.audioUrl
    });

    if (audioElement.value && props.autoPlay && !hasAutoPlayed.value && !isPlaying.value && !hasError.value && props.audioUrl) {
        console.log('[AudioPlayer] Attempting to play', { type: props.type });
        emit('play');
        void audioElement.value.play()
            .then(() => {
                // Successfully started playing, mark as auto-played
                hasAutoPlayed.value = true;
                console.log('[AudioPlayer] Auto-play successful', { type: props.type });
            })
            .catch((err) => {
                // Autoplay blocked by browser policy - this is expected, don't mark as played
                // This allows future uncollapse/manual actions to work
                console.log('[AudioPlayer] Auto-play blocked by browser', { type: props.type, error: err.message });
            });
    } else {
        console.log('[AudioPlayer] Auto-play skipped, conditions not met');
    }
}

// Methods
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function togglePlay() {
    if (!audioElement.value) return;

    try {
        if (isPlaying.value) {
            audioElement.value.pause();
        } else {
            // Emit play event before playing (allows parent to pause other audio)
            emit('play');
            await audioElement.value.play();
        }
    } catch (error) {
        hasError.value = true;
        errorMessage.value = 'Audiowiedergabe fehlgeschlagen';
        emit('error', error as Error);
    }
}

function pause() {
    if (audioElement.value && isPlaying.value) {
        audioElement.value.pause();
    }
}

function replay() {
    if (!audioElement.value) return;
    audioElement.value.currentTime = 0;
    void audioElement.value.play();
}

function handleLoadedMetadata() {
    if (audioElement.value) {
        duration.value = audioElement.value.duration;
        isLoaded.value = true;
        console.log('[AudioPlayer] Metadata loaded', { type: props.type, duration: duration.value, loop: props.loop });
    }
}

function handlePlay() {
    isPlaying.value = true;
    emit('play');
    console.log('[AudioPlayer] Playing', { type: props.type, currentTime: currentTime.value });
}

function handlePause() {
    isPlaying.value = false;
    emit('pause');
    console.log('[AudioPlayer] Paused', { type: props.type, currentTime: currentTime.value });
}

function handleTimeUpdate() {
    if (audioElement.value) {
        currentTime.value = audioElement.value.currentTime;
        emit('timeupdate', currentTime.value);
    }
}

function handleEnded() {
    playCount.value++;
    console.log('[AudioPlayer] Ended event', { type: props.type, loop: props.loop, playCount: playCount.value });

    // Always stop after one play - no looping
    isPlaying.value = false;
    currentTime.value = 0;
    emit('ended');
    console.log('[AudioPlayer] Audio ended, stopping', { type: props.type, playCount: playCount.value });
}

function handleError(_event: Event) {
    hasError.value = true;
    errorMessage.value = 'Audio konnte nicht geladen werden';
    emit('error', new Error('Audio loading failed'));
}

// Watch for URL changes - pause, reset, and auto-play if enabled
watch(
    () => props.audioUrl,
    (newUrl, oldUrl) => {
        console.log('[AudioPlayer] URL changed', { type: props.type, oldUrl, newUrl });
        if (audioElement.value) {
            // Pause current audio if playing
            if (isPlaying.value) {
                audioElement.value.pause();
                isPlaying.value = false;
                emit('pause');
            }

            // Reset state
            currentTime.value = 0;
            hasError.value = false;
            errorMessage.value = '';
            hasAutoPlayed.value = false; // Reset auto-play tracking for new URL
            playCount.value = 0; // Reset play count for new URL
            console.log('[AudioPlayer] State reset for new URL', { type: props.type });

            // Load new audio if URL provided
            if (newUrl && newUrl !== oldUrl) {
                audioElement.value.load();
                console.log('[AudioPlayer] Loading new audio', { type: props.type, autoPlay: props.autoPlay });
                // Auto-play after source change if autoPlay is enabled
                if (props.autoPlay) {
                    // Wait for loadedmetadata event to ensure audio is ready
                    const handleLoaded = () => {
                        console.log('[AudioPlayer] Audio loaded after URL change', { type: props.type });
                        attemptAutoPlay();
                        audioElement.value?.removeEventListener('loadedmetadata', handleLoaded);
                    };
                    audioElement.value.addEventListener('loadedmetadata', handleLoaded);
                }
            } else if (!newUrl && oldUrl) {
                // Clear audio source if URL removed
                audioElement.value.src = '';
                console.log('[AudioPlayer] Audio source cleared', { type: props.type });
            }
        }
    }
);

// Watch for autoPlay prop changes - trigger playback when section is uncollapsed
watch(
    () => props.autoPlay,
    (shouldAutoPlay, wasAutoPlay) => {
        console.log('[AudioPlayer] autoPlay prop changed', {
            type: props.type,
            shouldAutoPlay,
            wasAutoPlay,
            isLoaded: isLoaded.value,
            audioUrl: props.audioUrl
        });
        // Only trigger if autoPlay changed from false to true (section was collapsed, now uncollapsed)
        // Reset hasAutoPlayed when uncollapsing to allow playback
        if (shouldAutoPlay && !wasAutoPlay && isLoaded.value && props.audioUrl) {
            hasAutoPlayed.value = false; // Reset to allow auto-play on uncollapse
            console.log('[AudioPlayer] Section uncollapsed, resetting hasAutoPlayed', { type: props.type });
            // Small delay to ensure component is ready
            setTimeout(() => {
                if (props.autoPlay && !isPlaying.value) {
                    attemptAutoPlay();
                }
            }, 150);
        }
        // If autoPlay changed from true to false (section collapsed), pause the audio
        else if (!shouldAutoPlay && wasAutoPlay && isPlaying.value) {
            console.log('[AudioPlayer] Section collapsed, pausing audio', { type: props.type });
            if (audioElement.value) {
                audioElement.value.pause();
            }
        }
    }
);

// Initialize volume and trigger auto-play on mount if enabled
onMounted(() => {
    console.log('[AudioPlayer] Component mounted', {
        type: props.type,
        autoPlay: props.autoPlay,
        audioUrl: props.audioUrl,
        loop: props.loop,
        isLoaded: isLoaded.value
    });

    if (audioElement.value) {
        audioElement.value.volume = props.volume;

        // Trigger auto-play on initial load if section is uncollapsed
        if (props.autoPlay && props.audioUrl) {
            console.log('[AudioPlayer] Will attempt auto-play on mount', { type: props.type });
            // Wait for loadedmetadata to ensure audio is ready
            const handleInitialLoad = () => {
                console.log('[AudioPlayer] Initial metadata loaded', { type: props.type });
                // Delay slightly to ensure DOM is fully ready and avoid race conditions
                setTimeout(() => {
                    attemptAutoPlay();
                }, 200);
                audioElement.value?.removeEventListener('loadedmetadata', handleInitialLoad);
            };

            if (isLoaded.value) {
                console.log('[AudioPlayer] Already loaded on mount', { type: props.type });
                // Already loaded, play after short delay
                setTimeout(() => {
                    attemptAutoPlay();
                }, 200);
            } else {
                console.log('[AudioPlayer] Waiting for metadata', { type: props.type });
                // Wait for load
                audioElement.value.addEventListener('loadedmetadata', handleInitialLoad);
            }
        } else {
            console.log('[AudioPlayer] Auto-play not enabled on mount', { type: props.type, autoPlay: props.autoPlay });
        }
    }
});

// Cleanup
onUnmounted(() => {
    if (audioElement.value) {
        audioElement.value.pause();
        audioElement.value.src = '';
    }
});

// Expose methods for parent
defineExpose({
    play: togglePlay,
    pause,
    replay
});
</script>

<template>
    <!-- Hidden if no URL -->
    <div v-if="audioUrl" class="audio-player inline-flex items-center gap-2" @click.stop>
        <!-- Hidden audio element -->
        <audio ref="audioElement" :src="audioUrl" @loadedmetadata="handleLoadedMetadata" @play="handlePlay"
            @pause="handlePause" @timeupdate="handleTimeUpdate" @ended="handleEnded" @error="handleError" />

        <!-- Play/Pause Button -->
        <Button :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'" :disabled="hasError || !isLoaded"
            :severity="type === 'instruction' ? 'warning' : 'success'" rounded text size="small" @click="togglePlay"
            :aria-label="isPlaying ? 'Pause' : 'Play'" />

        <!-- Progress (only when playing) -->
        <div v-if="isPlaying && showProgress" class="progress-compact">
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>
        </div>

        <!-- Time (only when playing) -->
        <span v-if="isPlaying && showTime" class="time-display text-xs text-gray-600 dark:text-gray-400 font-mono">
            {{ formattedCurrentTime }} / {{ formattedDuration }}
        </span>

        <!-- Loop Button (example audio only) -->
        <Button v-if="type === 'example'" icon="pi pi-refresh" :class="{ 'text-blue-600': loop }" rounded text
            size="small" @click="audioElement!.loop = !audioElement!.loop" aria-label="Wiederholen" />

        <!-- Error State -->
        <i v-if="hasError" class="pi pi-exclamation-triangle text-red-500" v-tooltip.top="errorMessage"></i>
    </div>
</template>

<style scoped>
.progress-bar {
    width: 80px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2196f3, #21cbf3);
    transition: width 0.1s linear;
}
</style>
