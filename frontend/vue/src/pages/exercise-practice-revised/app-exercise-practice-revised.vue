<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { Exercise, ExerciseItem, ItemContent } from '@/types/exercise';
import { useMessagingStore } from '@/stores/messaging';
import { useAudioRecorder } from '@/composables/useAudioRecorder';
import { useAudioDevices } from '@/composables/useAudioDevices';
import { useAudioQuality } from '@/composables/useAudioQuality';

// Import existing components from exercise-practice
import RecordingStatusDisplay from '@/pages/exercise-practice/components/RecordingStatusDisplay.vue';
import AudioQualityIndicator from '@/pages/exercise-practice/components/AudioQualityIndicator.vue';
import WaveformDisplay from '@/components/WaveformDisplay.vue';
import InstructionsDialog from '@/pages/exercise-practice/components/InstructionsDialog.vue';
import MicrophoneSettingsDialog from '@/pages/exercise-practice/components/MicrophoneSettingsDialog.vue';

// Phase 2: Audio components
import AudioPlayer from './components/AudioPlayer.vue';

// Phase 3: Video components
import VideoPlayer from './components/VideoPlayer.vue';

// PrimeVue components
import Button from 'primevue/button';
import Card from 'primevue/card';
import Panel from 'primevue/panel';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Tag from 'primevue/tag';

// Mock data
import mockExerciseData from './uebungseinheit-01-transformed.json';

/**
 * Exercise Practice Page - Revised with Full Features
 * 
 * Combines:
 * - New data structure (instruction + contents array)
 * - Existing recording/audio features
 * - Collapsible instruction/content sections
 * - Phase 3 recording integration
 */

const router = useRouter();
const route = useRoute();
const messaging = useMessagingStore();

// Get backTo URL parameter
const backToUrl = computed(() => {
  const backTo = route.query.backTo as string | undefined;
  return backTo ?? '/exercises';
});

// State
const exercise = ref<Exercise | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const currentItemIndex = ref(0);

// Expanded practice items (items × contents × repetitions)
interface PracticeIteration {
  item: ExerciseItem;
  content: ItemContent;
  contentIndex: number; // 0-based index within item's contents
  totalContents: number; // Total contents for this item
  iteration: number; // 1-based iteration number
  totalIterations: number;
}

const practiceQueue = ref<PracticeIteration[]>([]);

// Phase 3 Recording Integration
const audioRecorder = useAudioRecorder();
const audioDevices = useAudioDevices();
const audioQuality = useAudioQuality();

// UI State for recording/dialogs
const showWaveform = ref(false);
const showInstructionsDialog = ref(false);
const showMicrophoneDialog = ref(false);
const showWelcomeDialog = ref(true); // Show on page load for user interaction
const mediaStream = ref<MediaStream | null>(null);

// Panel collapsed state
const isInstructionCollapsed = ref(false);
const isContentCollapsed = ref(true);

// Audio player refs and state
const instructionAudioRef = ref<InstanceType<typeof AudioPlayer> | null>(null);
const contentAudioRef = ref<InstanceType<typeof AudioPlayer> | null>(null);
const activeAudioPlayer = ref<'instruction' | 'content' | null>(null);
const autoPlayEnabled = ref(false); // Enabled after welcome dialog closes
const audioPlayerKey = ref(0); // Increment to force AudioPlayer remount

// Video player refs and state
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null);
const showVideo = ref(false); // Toggle between video and text display

// Computed
const fileSizeBytes = computed(() => audioRecorder.duration.value * 16000 * 2);

const currentPracticeItem = computed<PracticeIteration | null>(() => {
  if (practiceQueue.value.length === 0) return null;
  return practiceQueue.value[currentItemIndex.value] ?? null;
});

const currentItem = computed<ExerciseItem | null>(() => {
  return currentPracticeItem.value?.item ?? null;
});

// Get current content from practice item
const currentContent = computed<ItemContent | null>(() => {
  return currentPracticeItem.value?.content ?? null;
});

const progressText = computed(() => {
  return `${currentItemIndex.value + 1} / ${practiceQueue.value.length}`;
});

const progressPercentage = computed(() => {
  if (practiceQueue.value.length === 0) return 0;
  return Math.round(((currentItemIndex.value + 1) / practiceQueue.value.length) * 100);
});

const canGoBack = computed(() => currentItemIndex.value > 0);
const canGoForward = computed(() => currentItemIndex.value < practiceQueue.value.length - 1);

const itemTitle = computed(() => {
  return currentItem.value?.metadata?.title ?? 'Übung';
});

// Methods
const loadMockData = () => {
  try {
    loading.value = true;
    exercise.value = mockExerciseData as Exercise;

    // Build practice queue (items × contents × repetitions)
    practiceQueue.value = [];
    exercise.value.items.forEach(item => {
      const contents = item.contents ?? [];
      const reps = item.repetitions ?? 1;

      // For each repetition
      for (let rep = 1; rep <= reps; rep++) {
        // For each content in the item
        if (contents.length > 0) {
          contents.forEach((content, contentIdx) => {
            practiceQueue.value.push({
              item,
              content,
              contentIndex: contentIdx,
              totalContents: contents.length,
              iteration: rep,
              totalIterations: reps
            });
          });
        } else {
          // If no contents, create a single entry without content
          practiceQueue.value.push({
            item,
            content: {} as ItemContent,
            contentIndex: 0,
            totalContents: 0,
            iteration: rep,
            totalIterations: reps
          });
        }
      }
    });

    loading.value = false;
  } catch (_err) {
    error.value = 'Fehler beim Laden der Übungsdaten.';
    loading.value = false;
  }
};

// Handle welcome dialog start
const handleStart = () => {
  showWelcomeDialog.value = false;
  // Delay audio trigger until after dialog has finished closing animation
  setTimeout(() => {
    // After user interaction, trigger instruction audio if section is open
    if (!isInstructionCollapsed.value && instructionAudioRef.value) {
      instructionAudioRef.value?.play();
    }
    // Enable auto-play for subsequent panel toggles
    autoPlayEnabled.value = true;
  }, 300); // Wait for dialog close animation
};

const nextItem = () => {
  if (canGoForward.value) {
    // Get current item ID before navigation
    const prevItemId = currentPracticeItem.value?.item.id;
    currentItemIndex.value++;
    // Get new item ID after navigation
    const newItemId = practiceQueue.value[currentItemIndex.value]?.item.id;
    // Only reset panel states if moving to a different exercise item (not repetition or content)
    if (prevItemId !== newItemId) {
      isInstructionCollapsed.value = false;
      isContentCollapsed.value = true;
    }
    // Reset video display on navigation
    showVideo.value = false;
    // AudioPlayer automatically handles cleanup on URL change
  }
};

const previousItem = () => {
  if (canGoBack.value) {
    // Get current item ID before navigation
    const prevItemId = currentPracticeItem.value?.item.id;
    currentItemIndex.value--;
    // Get new item ID after navigation
    const newItemId = practiceQueue.value[currentItemIndex.value]?.item.id;
    // Only reset panel states if moving to a different exercise item (not repetition or content)
    if (prevItemId !== newItemId) {
      isInstructionCollapsed.value = false;
      isContentCollapsed.value = true;
    }
    // Reset video display on navigation
    showVideo.value = false;
    // AudioPlayer automatically handles cleanup on URL change
  }
};

const restartExercise = () => {
  // Stop any recording first
  if (audioRecorder.isRecording.value) {
    audioRecorder.stopRecording();
  }
  // Increment key to force AudioPlayer remount and reset
  audioPlayerKey.value++;
  // Reset to first item
  currentItemIndex.value = 0;
  // Reset panel states
  isInstructionCollapsed.value = false;
  isContentCollapsed.value = true;
  // Reset video display
  showVideo.value = false;
  // Restart instruction audio if available and auto-play is enabled
  setTimeout(() => {
    if (autoPlayEnabled.value && !isInstructionCollapsed.value && instructionAudioRef.value) {
      instructionAudioRef.value?.play();
    }
  }, 100); // Small delay to ensure UI updates
  void messaging.info('Übung neu gestartet');
};

const handleInstructionUnderstood = () => {
  isInstructionCollapsed.value = true;
  isContentCollapsed.value = false;
};

// Audio playback management (single audio policy)
const handleInstructionAudioPlay = () => {
  // Pause content audio if playing
  if (activeAudioPlayer.value === 'content' && contentAudioRef.value) {
    contentAudioRef.value.pause();
  }
  activeAudioPlayer.value = 'instruction';
};

const handleContentAudioPlay = () => {
  // Pause instruction audio if playing
  if (activeAudioPlayer.value === 'instruction' && instructionAudioRef.value) {
    instructionAudioRef.value.pause();
  }
  activeAudioPlayer.value = 'content';
};

const handleAudioPause = () => {
  activeAudioPlayer.value = null;
};

// Handle video toggle
function toggleVideoDisplay() {
  showVideo.value = !showVideo.value;
  // Pause content audio when showing video
  if (showVideo.value && contentAudioRef.value) {
    contentAudioRef.value.pause();
  }
}

// Handle video error
function handleVideoError(error: Error) {
  void messaging.error(`Video konnte nicht geladen werden: ${error.message}`);
  // Fallback to text mode
  showVideo.value = false;
}

const handleStartRecording = async () => {
  try {
    await audioRecorder.startRecording(audioDevices.selectedDeviceId.value ?? undefined);
    void messaging.success('Aufnahme gestartet');
  } catch {
    void messaging.error('Aufnahme konnte nicht gestartet werden');
  }
};

const handleStopRecording = () => {
  try {
    audioRecorder.stopRecording();
    void messaging.success('Aufnahme beendet');
  } catch {
    void messaging.error('Fehler beim Beenden der Aufnahme');
  }
};

const completeExercise = () => {
  void messaging.success('Übung abgeschlossen!');
  void router.push(backToUrl.value);
};

const handleExit = () => {
  void router.push(backToUrl.value);
};

const goBack = () => {
  router.back();
};

const formatDifficulty = (level: string) => {
  const map: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte'
  };
  return map[level] || level;
};

const formatItemType = (type: string) => {
  const map: Record<string, string> = {
    movement: 'Bewegung',
    breathing: 'Atmung',
    minimal_pair: 'Minimalpaar',
    word_list: 'Wortliste',
    sentence: 'Satz',
    text: 'Text',
    speech_practice: 'Sprechübung',
    information: 'Information',
    vocalization: 'Lautbildung'
  };
  return map[type] || type;
};

// Lifecycle
onMounted(async () => {
  loadMockData();

  // Request microphone permission and enumerate devices
  await audioDevices.requestPermission();

  // Start device change listener
  audioDevices.startDeviceChangeListener();
});

onUnmounted(() => {
  // Cleanup
  if (audioRecorder.isRecording.value) {
    audioRecorder.stopRecording();
  }
});
</script>

<template>
  <div class="h-full p-6">
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
    <div v-else-if="exercise && currentItem" class="max-w-4xl mx-auto h-full flex flex-col">
      <!-- Header Section -->
      <div class="flex-shrink-0">
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

        <!-- Exercise Info Row -->
        <div class="flex gap-4 items-center text-sm text-surface-600 dark:text-surface-400 flex-wrap mb-6">
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
            <span>{{ progressText }}</span>
          </div>

          <!-- Recording controls (right side) -->
          <div class="flex items-center gap-3 ml-auto">
            <!-- Instructions Button -->
            <Button v-if="currentItem.instruction" icon="pi pi-info-circle" label="Anleitung" severity="secondary" text
              size="small" @click="showInstructionsDialog = true" />

            <!-- Quality Badge and Waveform Toggle (only when recording) -->
            <template v-if="audioRecorder.isRecording.value">
              <!-- Quality Badge -->
              <AudioQualityIndicator :snr="audioQuality.metrics.value?.snr_db ?? undefined"
                :volume="audioQuality.metrics.value?.rms_energy ?? undefined"
                :clipping="audioQuality.metrics.value?.clipping_detected ? 1 : 0"
                :noise-level="audioQuality.metrics.value?.spectral_flatness ?? undefined" show-icon compact />

              <!-- Toggle Waveform Button -->
              <Button :icon="showWaveform ? 'pi pi-eye-slash' : 'pi pi-chart-bar'"
                :label="showWaveform ? 'Verbergen' : 'Spektrum'" severity="secondary" text size="small"
                @click="showWaveform = !showWaveform" />
            </template>
          </div>
        </div>

        <!-- Progress Bar -->
        <ProgressBar :value="progressPercentage" :showValue="false" class="h-2 mb-6" />

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

        <!-- Item Title & Iteration Info -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-700">
            {{ itemTitle }}
          </h2>
          <div class="flex items-center gap-2">
            <Tag :value="formatItemType(currentItem.item_type)" />
            <span v-if="currentPracticeItem && currentPracticeItem.totalIterations > 1"
              class="text-sm text-surface-600 dark:text-surface-400">
              Wiederholung {{ currentPracticeItem.iteration }}/{{ currentPracticeItem.totalIterations }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area (Collapsibles) - Flex Grow -->
      <div class="flex-grow flex flex-col min-h-0 mb-4 overflow-auto" style="position: relative;">
        <!-- Full-Screen Video Overlay -->
        <div v-if="showVideo && currentContent?.demonstration_video_url" class="video-fullscreen-overlay">
          <VideoPlayer ref="videoPlayerRef" :video-url="currentContent.demonstration_video_url" auto-play controls
            @error="handleVideoError" @ended="toggleVideoDisplay" />
          <Button icon="pi pi-times" class="video-close-button" rounded severity="secondary" size="large"
            @click="toggleVideoDisplay" />
        </div>

        <!-- Instruction Section (Collapsible) - Hidden during video -->
        <Panel v-if="currentItem.instruction && !showVideo" v-model:collapsed="isInstructionCollapsed" toggleable
          class="mb-4">
          <template #header>
            <div class="flex items-center gap-3 w-full">
              <span class="font-semibold">Anleitung</span>
              <!-- Instruction Audio Player -->
              <AudioPlayer v-if="currentItem.instruction.audio_instruction_url" :key="`instruction-${audioPlayerKey}`"
                ref="instructionAudioRef" :audio-url="currentItem.instruction.audio_instruction_url" type="instruction"
                mode="compact" :auto-play="autoPlayEnabled && !isInstructionCollapsed"
                @play="handleInstructionAudioPlay" @pause="handleAudioPause" />
            </div>
          </template>
          <div class="space-y-3">
            <!-- Hint Text -->
            <div v-if="currentItem.instruction.hint_text"
              class="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
              <p class="text-sm">{{ currentItem.instruction.hint_text }}</p>
            </div>

            <!-- Explanation Text -->
            <div v-if="currentItem.instruction.explanation_text">
              <p>{{ currentItem.instruction.explanation_text }}</p>
            </div>

            <!-- Safety Notes -->
            <div v-if="currentItem.instruction.safety_notes"
              class="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
              <p class="text-sm font-medium">⚠️ Sicherheitshinweis:</p>
              <p class="text-sm mt-1">{{ currentItem.instruction.safety_notes }}</p>
            </div>

            <!-- Verstanden Button -->
            <div class="flex justify-end pt-2">
              <Button label="Verstanden" icon="pi pi-check" severity="success" @click="handleInstructionUnderstood" />
            </div>
          </div>
        </Panel>

        <!-- Content Section (Collapsible) - Hidden during video -->
        <Panel v-if="currentContent && !showVideo" v-model:collapsed="isContentCollapsed" toggleable>
          <template #header>
            <div class="flex items-center gap-3 w-full">
              <span class="font-semibold">Übungsinhalt</span>
              <!-- Content Audio Player (Example Audio) -->
              <AudioPlayer v-if="currentContent.audio_example_url" :key="`content-${audioPlayerKey}`"
                ref="contentAudioRef" :audio-url="currentContent.audio_example_url" type="example" mode="compact" loop
                :auto-play="autoPlayEnabled && !isContentCollapsed" @play="handleContentAudioPlay"
                @pause="handleAudioPause" />
              <!-- Video Toggle Button -->
              <Button v-if="currentContent.demonstration_video_url" icon="pi pi-video" label="Video" severity="info"
                text rounded size="small" @click.stop="toggleVideoDisplay" />
            </div>
          </template>
          <div class="space-y-4">
            <!-- Text Mode (with background image) -->
            <div class="content-display" :style="{
              backgroundImage: currentContent.image_url
                ? `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${currentContent.image_url})`
                : 'none',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }">
              <!-- Text Content (centered) -->
              <div v-if="currentContent.text_content" class="content-text">
                <p class="text-center text-2xl font-medium">{{ currentContent.text_content }}</p>
              </div>

              <!-- Phonetic Transcription -->
              <div v-if="currentContent.phonetic_transcription" class="text-center text-gray-600 dark:text-gray-400">
                <p class="font-mono">{{ currentContent.phonetic_transcription }}</p>
              </div>
            </div>

            <!-- Content Progress Indicator -->
            <div v-if="currentPracticeItem && currentPracticeItem.totalContents > 1"
              class="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t">
              Inhalt {{ currentPracticeItem.contentIndex + 1 }} von {{ currentPracticeItem.totalContents }}
            </div>
          </div>
        </Panel>

        <!-- No Content State -->
        <Card v-if="!currentItem.instruction && !currentContent">
          <template #content>
            <div class="text-center p-12 text-surface-500">
              <p>Für diese Übung sind keine Inhalte verfügbar.</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Controls Section (Fixed at Bottom) -->
      <div class="flex-shrink-0">
        <!-- Control Bar: Record + Microphone Settings + Navigation -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Recording Toggle Button -->
          <Button :icon="audioRecorder.isRecording.value ? 'pi pi-stop' : 'pi pi-circle'" :class="[
            'transition-all duration-300 font-semibold',
            audioRecorder.isRecording.value ? '!bg-red-600 !text-white hover:!bg-red-700 recording-pulse' : ''
          ]" :severity="audioRecorder.isRecording.value ? 'danger' : 'primary'"
            :outlined="audioRecorder.isRecording.value"
            v-tooltip.right="audioRecorder.isRecording.value ? 'Aufnahme stoppen' : 'Aufnahme starten'"
            @click="audioRecorder.isRecording.value ? handleStopRecording() : handleStartRecording()"
            class="flex-shrink-0" />

          <!-- Microphone Settings Button -->
          <Button icon="pi pi-microphone"
            :badge="audioDevices.devices.value.length > 0 && audioDevices.selectedDeviceId.value ? '' : '!'"
            :badge-severity="audioDevices.devices.value.length > 0 && audioDevices.selectedDeviceId.value ? 'success' : 'danger'"
            severity="secondary" outlined :disabled="audioRecorder.isRecording.value"
            v-tooltip.right="'Mikrofon-Einstellungen'" @click="showMicrophoneDialog = true" class="flex-shrink-0" />

          <!-- Recording Status (when recording) -->
          <RecordingStatusDisplay v-if="audioRecorder.isRecording.value" :duration="audioRecorder.duration.value"
            :file-size="fileSizeBytes" :status="audioRecorder.isRecording.value ? 'recording' : 'idle'"
            :show-file-size="false" compact class="flex-shrink-0" />

          <!-- Auto-play Checkbox -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input v-model="autoPlayEnabled" type="checkbox" class="w-4 h-4 cursor-pointer" />
              <span class="text-surface-700 dark:text-surface-300">Auto-Play</span>
            </label>
          </div>

          <!-- Spacer -->
          <div class="flex-grow"></div>

          <!-- Restart Button -->
          <Button label="Neu starten" icon="pi pi-refresh" @click="restartExercise" outlined
            v-tooltip.bottom="'Übung von vorne beginnen'" class="flex-shrink-0" />

          <!-- Navigation Buttons -->
          <Button label="Zurück" icon="pi pi-chevron-left" :disabled="!canGoBack" @click="previousItem" outlined
            v-tooltip.bottom="'Vorheriges Element'" class="flex-shrink-0" />

          <div class="flex gap-2">
            <Button v-if="canGoForward" label="Weiter" icon="pi pi-chevron-right" icon-pos="right" @click="nextItem"
              v-tooltip.bottom="'Nächstes Element'" class="flex-shrink-0" />
            <Button v-else label="Abschließen" icon="pi pi-check" severity="success" @click="completeExercise"
              v-tooltip.bottom="'Übung abschließen'" class="flex-shrink-0" />
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
    <InstructionsDialog v-if="currentItem?.instruction" :visible="showInstructionsDialog"
      :instructions="currentItem.instruction" @update:visible="showInstructionsDialog = $event" />

    <!-- Microphone Settings Dialog -->
    <MicrophoneSettingsDialog :visible="showMicrophoneDialog" :model-value="audioDevices.selectedDeviceId.value"
      :devices="audioDevices.devices.value" :loading="false" @update:visible="showMicrophoneDialog = $event"
      @change="(deviceId: string) => audioDevices.selectDevice(deviceId)" />
  </div>

  <!-- Welcome Dialog -->
  <Dialog v-model:visible="showWelcomeDialog" modal :closable="false" :dismissableMask="false"
    header="Willkommen zur Sprachübung" :style="{ width: '30rem' }">
    <div class="space-y-4">
      <p class="text-lg">
        Klicken Sie auf "Starten", um mit der Übung zu beginnen.
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Die Audioanleitungen werden automatisch abgespielt.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Starten" icon="pi pi-play" severity="success" size="large" @click="handleStart" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.exercise-practice {
  min-height: 100vh;
}

/* Full-screen video overlay */
.video-fullscreen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Video close button overlay */
.video-close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.7) !important;
  border: 2px solid white !important;
}

.video-close-button:hover {
  background: rgba(0, 0, 0, 0.9) !important;
  transform: scale(1.1);
}

/* Video container styling */
.video-container {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Content display styling */
.content-display {
  width: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 300px;
}

/* Content text with background image support */
.content-text {
  font-size: clamp(1.5rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.4;
  max-width: 90%;
  padding: 32px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s;
}

/* Enhanced text shadow when background image is present */
.content-text[style*="background-image"] p {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* Responsive text sizing */
@media (max-width: 767px) {
  .content-text {
    font-size: clamp(1.2rem, 5vw, 2rem);
    padding: 24px;
    max-width: 95%;
  }

  .video-container {
    padding: 12px;
  }

  .content-display {
    padding: 20px;
  }

  .video-close-button {
    top: 10px;
    right: 10px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .content-text {
    font-size: clamp(1.4rem, 4.5vw, 2.5rem);
    padding: 28px;
  }
}

/* Recording pulse animation */
@keyframes recording-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }

  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.recording-pulse {
  animation: recording-pulse 2s infinite;
}
</style>
