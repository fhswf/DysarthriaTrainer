# Phase 3 Component Integration Example

This document shows how to integrate all 12 Phase 3 components (Week 1-2) into the ExercisePractice page.

## Overview

**File**: `app-exercise-practice.vue`  
**Components Used**: 12 Phase 3 components + existing page structure  
**Purpose**: Complete exercise practice workflow with professional recording UI

## Component Integration Points

### 1. Recording Controls Section (Top Bar)

```vue
<template>
  <div class="exercise-practice">
    <!-- Recording Control Bar - Fixed at top -->
    <div
      class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center gap-4 flex-wrap">
          <!-- Device Selection -->
          <DeviceSelector
            :model-value="selectedDeviceId"
            :disabled="isRecording"
            @update:model-value="handleDeviceChange"
          />

          <!-- Recording Toggle -->
          <RecordingToggleButton
            :is-recording="isRecording"
            :is-paused="false"
            :has-permission="hasPermission"
            @start="handleStartRecording"
            @stop="handleStopRecording"
          />

          <!-- Recording Status -->
          <RecordingStatusDisplay
            v-if="isRecording || audioBlob"
            :is-recording="isRecording"
            :duration-seconds="recordingDuration"
            :file-size-bytes="fileSizeBytes"
            :show-file-size="!!audioBlob"
            compact
          />

          <!-- Quality Indicator (compact when recording) -->
          <AudioQualityIndicator
            v-if="isRecording"
            :quality-level="currentQuality"
            :volume-level="volumeLevel"
            :has-issues="hasQualityIssues"
            compact
            class="ml-auto"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <!-- ... existing exercise content ... -->
    </div>
  </div>
</template>
```

### 2. Session Navigation (Bottom of Exercise Card)

```vue
<template>
  <!-- After exercise item display -->
  <div class="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
    <!-- Progress Indicators -->
    <ItemProgress
      :items="progressItems"
      :current-index="currentItemIndex"
      show-labels
      class="mb-4"
    />

    <!-- Navigation Controls -->
    <SessionNavigation
      :current-index="currentItemIndex"
      :total="exercise.items.length"
      :disabled="isProcessing"
      item-label="Übung"
      show-progress-icon
      loop
      @previous="previousItem"
      @next="nextItem"
      @change="handleItemChange"
    />
  </div>
</template>
```

### 3. Timeline Markers (For Recording Events)

```vue
<template>
  <!-- Recording Timeline (when session has recordings) -->
  <div v-if="sessionHasRecordings" class="mt-4">
    <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ t('recording.timeline') }}
    </div>
    <div class="relative h-12 bg-gray-100 dark:bg-gray-800 rounded">
      <TimestampMarker
        v-for="marker in recordingMarkers"
        :key="marker.id"
        :timestamp="marker.timestamp"
        :total-duration="totalSessionDuration"
        :marker-type="marker.type"
        :label="marker.label"
        :show-label="true"
        @click="handleMarkerClick(marker)"
      />
    </div>
  </div>
</template>
```

### 4. Quality Details Panel (Expandable)

```vue
<template>
  <!-- Quality Panel (when recording or has issues) -->
  <div v-if="isRecording || hasQualityIssues" class="mt-4">
    <AudioQualityDetails
      :quality-level="currentQuality"
      :metrics="{
        snr: currentSNR,
        volumeRMS: volumeLevel,
        clippingDetected: hasClipping,
        noiseLevel: noiseLevel,
      }"
      :warnings="qualityWarnings"
      :is-expanded="showQualityDetails"
      @toggle="showQualityDetails = !showQualityDetails"
    />
  </div>
</template>
```

### 5. Session Dialogs

```vue
<template>
  <!-- Session Start Dialog -->
  <SessionStartDialog
    :visible="showStartDialog"
    :exercise-title="exercise?.title"
    :item-count="exercise?.items.length"
    :estimated-duration="`${exercise?.estimated_duration_minutes} min`"
    :show-settings="true"
    :cancellable="true"
    @start="handleSessionStart"
    @cancel="handleSessionCancel"
    @update:visible="showStartDialog = $event"
  />

  <!-- Session Complete Dialog -->
  <SessionCompleteDialog
    :visible="showCompleteDialog"
    :stats="{
      completedItems: completedCount,
      skippedItems: skippedCount,
      totalItems: exercise?.items.length || 0,
      duration: totalDuration,
      qualityScore: averageQuality,
    }"
    :show-review="true"
    :show-share="false"
    @close="handleCompleteClose"
    @review="handleReviewSession"
    @update:visible="showCompleteDialog = $event"
  />

  <!-- Session Abandon Dialog -->
  <SessionAbandonDialog
    :visible="showAbandonDialog"
    :completed-items="completedCount"
    :total-items="exercise?.items.length || 0"
    :has-unsaved="hasUnsaved Changes"
    :can-resume="canResumeSession"
    @confirm="handleAbandonConfirm"
    @save="handleAbandonSave"
    @cancel="showAbandonDialog = false"
    @update:visible="showAbandonDialog = $event"
  />
</template>
```

### 6. Permission Prompt

```vue
<template>
  <!-- Permission Prompt (shown when needed) -->
  <DevicePermissionPrompt
    v-if="!hasPermission && showPermissionPrompt"
    :permission-state="permissionState"
    :error-message="permissionError"
    @request="requestMicrophonePermission"
    @dismiss="showPermissionPrompt = false"
  />
</template>
```

## Complete Script Setup

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocalizationStore } from '@/stores/localization';

// Phase 3 Week 1 Components
import RecordingToggleButton from './components/RecordingToggleButton.vue';
import RecordingStatusDisplay from './components/RecordingStatusDisplay.vue';
import DeviceSelector from './components/DeviceSelector.vue';
import DevicePermissionPrompt from './components/DevicePermissionPrompt.vue';
import AudioQualityIndicator from './components/AudioQualityIndicator.vue';
import AudioQualityDetails from './components/AudioQualityDetails.vue';

// Phase 3 Week 2 Components
import SessionNavigation from './components/SessionNavigation.vue';
import ItemProgress from './components/ItemProgress.vue';
import TimestampMarker from './components/TimestampMarker.vue';
import SessionStartDialog from './components/SessionStartDialog.vue';
import SessionCompleteDialog from './components/SessionCompleteDialog.vue';
import SessionAbandonDialog from './components/SessionAbandonDialog.vue';

// Existing imports...
const loc = useLocalizationStore();
const t = loc.t;

// Recording state
const isRecording = ref(false);
const hasPermission = ref(false);
const selectedDeviceId = ref<string | null>(null);
const recordingDuration = ref(0);
const volumeLevel = ref(0);
const currentQuality = ref<'excellent' | 'good' | 'fair' | 'poor'>('good');

// Quality metrics
const currentSNR = ref(0);
const noiseLevel = ref(0);
const hasClipping = ref(false);
const hasQualityIssues = computed(() => currentQuality.value === 'poor' || hasClipping.value);
const qualityWarnings = computed(() => {
  const warnings = [];
  if (currentQuality.value === 'poor') warnings.push('Low signal quality');
  if (hasClipping.value) warnings.push('Audio clipping detected');
  if (noiseLevel.value > 0.5) warnings.push('High background noise');
  return warnings;
});

// Session state
const showStartDialog = ref(false);
const showCompleteDialog = ref(false);
const showAbandonDialog = ref(false);
const showPermissionPrompt = ref(false);
const permissionState = ref<'prompt' | 'granted' | 'denied'>('prompt');

// Progress tracking
const progressItems = computed(() =>
  exercise.value?.items.map((item, index) => ({
    id: item.id,
    label: `${index + 1}`,
    completed: index < currentItemIndex.value,
    skipped: false,
    current: index === currentItemIndex.value
  })) || []
);

// Recording markers
const recordingMarkers = computed(() => {
  // Example markers - populate from actual session data
  return [
    { id: '1', timestamp: 1500, type: 'start' as const, label: 'Start' },
    { id: '2', timestamp: 45000, type: 'item' as const, label: 'Item 1' },
    { id: '3', timestamp: 90000, type: 'item' as const, label: 'Item 2' }
  ];
});

// Handlers
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId;
};

const handleStartRecording = async () => {
  if (!hasPermission.value) {
    showPermissionPrompt.value = true;
    return;
  }
  // Start recording logic...
  isRecording.value = true;
};

const handleStopRecording = () => {
  isRecording.value = false;
};

const handleSessionStart = (settings: SessionSettings) => {
  showStartDialog.value = false;
  // Initialize session with settings...
};

const handleCompleteClose = () => {
  showCompleteDialog.value = false;
  router.push('/exercises');
};

const handleAbandonConfirm = () => {
  showAbandonDialog.value = false;
  router.push('/exercises');
};

// Initialize
onMounted(() => {
  // Show start dialog on mount
  showStartDialog.value = true;

  // Check microphone permission
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(result => {
        hasPermission.value = result.state === 'granted';
        permissionState.value = result.state as 'granted' | 'denied' | 'prompt';
      });
  }
});
</script>
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Recording Control Bar (sticky top)                       │
│ [Device Selector] [●REC] [Status] [Quality ✓]          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Exercise Header                                          │
│ Title, Progress Bar, Info                                │
├─────────────────────────────────────────────────────────┤
│ Instructions Card (collapsible)                          │
├─────────────────────────────────────────────────────────┤
│ Exercise Item Card                                       │
│ - Content display                                        │
│ - Audio playback (if recorded)                          │
├─────────────────────────────────────────────────────────┤
│ Quality Details (expandable, when recording)            │
│ ▼ Signal: 25dB │ Volume: 65% │ Clipping: No            │
├─────────────────────────────────────────────────────────┤
│ Timeline (when has recordings)                          │
│ [●──────✓──────✓────────────────────]                  │
├─────────────────────────────────────────────────────────┤
│ Progress Indicators                                      │
│ ●────●────◉────○────○                                   │
├─────────────────────────────────────────────────────────┤
│ Session Navigation                                       │
│ [← Back]         Übung 3 / 5         [Next →]          │
└─────────────────────────────────────────────────────────┘

[Dialogs overlay when triggered]
```

## Responsive Breakpoints

```css
/* Mobile (< 640px) */
- Stack recording controls vertically
- Hide quality details by default
- Compact progress indicators

/* Tablet (640px - 1024px) */
- Horizontal recording bar
- Show quality indicator, hide details
- Full progress display

/* Desktop (> 1024px) */
- Full horizontal layout
- Auto-expand quality details when issues
- Side-by-side content possible
```

## State Management Integration

All components integrate with existing state management:

- **usePracticeSessionStore**: Session lifecycle, progress tracking
- **useAudioRecorder**: Recording state, audio data
- **useAudioDevices**: Device enumeration, selection
- **useAudioQuality**: Quality monitoring, metrics
- **useLocalizationStore**: All UI text translations

## Testing

Each component has been unit tested. Integration testing should cover:

1. **Full Recording Flow**: Start dialog → device selection → record → quality monitoring → navigation → complete dialog
2. **Error Scenarios**: Permission denied, device failure, quality issues
3. **Mobile Experience**: Touch targets, responsive layout, orientation changes
4. **Accessibility**: Keyboard navigation, screen reader labels, focus management

## Next Steps

1. ✅ All 12 components implemented
2. ⏳ Integrate into app-exercise-practice.vue (copy relevant sections above)
3. ⏳ Wire up state management (connect to existing stores)
4. ⏳ Add E2E tests for complete workflow
5. ⏳ Mobile responsive testing
6. ⏳ Accessibility audit

---

**Created**: Phase 3 Day 4  
**Status**: Implementation guide complete  
**Components**: 12 Phase 3 components ready for integration
