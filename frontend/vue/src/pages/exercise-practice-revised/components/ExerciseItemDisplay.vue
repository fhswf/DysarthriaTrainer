<template>
  <div class="exercise-item-display">
    <!-- Movement Item -->
    <div v-if="displayCategory === 'movement'" class="space-y-4">
      <div v-if="currentContent?.text_content" class="text-lg">
        {{ currentContent.text_content }}
      </div>

      <div v-if="currentContent?.difficulty_notes" class="text-sm text-surface-600 dark:text-surface-400 italic">
        {{ currentContent.difficulty_notes }}
      </div>

      <!-- Movement Details -->
      <div class="flex gap-4 text-sm text-surface-600 dark:text-surface-400">
        <div v-if="item.target_phoneme" class="flex items-center gap-2">
          <i class="pi pi-bullseye"></i>
          <span>Ziel-Phonem: {{ item.target_phoneme }}</span>
        </div>
      </div>

      <!-- Media Display -->
      <div v-if="currentContent?.demonstration_video_url"
        class="bg-surface-100 dark:bg-surface-800 rounded-lg p-8 text-center">
        <i class="pi pi-video text-4xl text-surface-400"></i>
        <p class="mt-2 text-surface-600 dark:text-surface-400">
          Video-Demonstration
        </p>
        <p class="text-sm text-surface-500">
          {{ currentContent.demonstration_video_url }}
        </p>
      </div>

      <div v-if="currentContent?.visual_cue_image_url"
        class="bg-surface-100 dark:bg-surface-800 rounded-lg p-8 text-center">
        <i class="pi pi-image text-4xl text-surface-400"></i>
        <p class="mt-2 text-surface-600 dark:text-surface-400">
          Visueller Hinweis
        </p>
        <p class="text-sm text-surface-500">
          {{ currentContent.visual_cue_image_url }}
        </p>
      </div>

      <!-- Audio Recording Section for Movement -->
      <AudioRecorder :is-recording="isRecording" :recording-duration="recordingDuration" :audio-blob="audioBlob"
        @start-recording="$emit('start-recording')" @stop-recording="$emit('stop-recording')"
        @play-recording="$emit('play-recording')" @clear-recording="$emit('clear-recording')" />
    </div>

    <!-- Speech Practice Item -->
    <div v-else-if="displayCategory === 'speech_practice'" class="space-y-4">
      <div class="text-center p-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <div class="text-4xl font-bold mb-4 text-primary-600 dark:text-primary-400">
          {{ currentContent?.text_content }}
        </div>

        <div v-if="currentContent?.phonetic_transcription" class="text-lg text-surface-600 dark:text-surface-400">
          Phonetik: {{ currentContent.phonetic_transcription }}
        </div>

        <div v-if="item.target_phoneme" class="mt-2">
          <Tag :value="'Ziel: ' + item.target_phoneme" severity="info" />
        </div>

        <div v-if="currentContent?.difficulty_notes" class="mt-4 text-sm text-surface-600 dark:text-surface-400 italic">
          {{ currentContent.difficulty_notes }}
        </div>
      </div>

      <!-- Reference Audio (if available) -->
      <div v-if="currentContent?.audio_file_url" class="flex items-center justify-center gap-2">
        <Button label="Beispiel anhören" icon="pi pi-play" severity="secondary" outlined @click="playReferenceAudio" />
        <span class="text-sm text-surface-500">{{ currentContent.audio_file_url }}</span>
      </div>

      <!-- Audio Recording Section for Speech Practice -->
      <div class="mt-6">
        <Divider />
        <h4 class="text-lg font-semibold mb-4 text-center">Ihre Aufnahme</h4>
        <AudioRecorder :is-recording="isRecording" :recording-duration="recordingDuration" :audio-blob="audioBlob"
          @start-recording="$emit('start-recording')" @stop-recording="$emit('stop-recording')"
          @play-recording="$emit('play-recording')" @clear-recording="$emit('clear-recording')" />
      </div>
    </div>

    <!-- Information Item -->
    <div v-else-if="displayCategory === 'information'" class="space-y-4">
      <div class="text-base leading-relaxed whitespace-pre-line">
        {{ currentContent?.text_content }}
      </div>

      <div v-if="currentContent?.difficulty_notes" class="mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-primary-500"></i>
          <span class="font-semibold text-sm">Hinweis</span>
        </div>
        <p class="text-sm text-surface-600 dark:text-surface-400">{{ currentContent.difficulty_notes }}</p>
      </div>

      <div v-if="currentContent?.visual_cue_image_url"
        class="bg-surface-100 dark:bg-surface-800 rounded-lg p-8 text-center">
        <i class="pi pi-image text-4xl text-surface-400"></i>
        <p class="mt-2 text-surface-600 dark:text-surface-400">
          Bild
        </p>
        <p class="text-sm text-surface-500">
          {{ currentContent.visual_cue_image_url }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExerciseItem } from '@/api/exercises';
import AudioRecorder from './AudioRecorder.vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';

interface Props {
  item: ExerciseItem;
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
}

const props = defineProps<Props>();

defineEmits<{
  'start-recording': [];
  'stop-recording': [];
  'play-recording': [];
  'clear-recording': [];
}>();

// Get content for current language (default to 'de')
const currentContent = computed(() => {
  if (!props.item.contents || props.item.contents.length === 0) return null;
  const content = props.item.contents.find(c => c.language === 'de');
  return content || props.item.contents[0]; // Fallback to first available
});

// Determine display category for the item type
const displayCategory = computed(() => {
  const type = props.item.item_type;

  // Speech practice types
  const speechTypes = ['minimal_pair', 'word', 'sentence', 'breathing', 'vocalization',
    'articulation', 'rhythm', 'intonation', 'speech_practice'];
  if (speechTypes.includes(type)) return 'speech_practice';

  // Movement types
  if (type === 'movement') return 'movement';

  // Information types
  if (type === 'information') return 'information';

  // Default to speech practice for unknown types
  return 'speech_practice';
});

const playReferenceAudio = () => {
  // TODO: Implement reference audio playback
  // This would fetch and play the audio file from the media service
  if (currentContent.value?.audio_file_url) {
    const audio = new Audio(currentContent.value.audio_file_url);
    void audio.play();
  }
};
</script>
