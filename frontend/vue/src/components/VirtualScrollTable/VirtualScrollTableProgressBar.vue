<template>
  <div class="virtual-scroll-progress-bar">
    <div class="progress-wrapper">
      <!-- PrimeVue ProgressBar (background and fill) -->
      <ProgressBar 
        :value="progressPercentage"
        :showValue="false"
        :pt="{
          root: { class: selectionCount > 0 ? 'progress-selection' : '' }
        }"
      >
        
      </ProgressBar>
      
      <!-- Centered text overlay (always visible, regardless of progress width) -->
      <div class="progress-overlay">
        <span v-if="selectionCount > 0" class="progress-text">
          {{ selectionCount }} / {{ totalRecords }} {{ selectedLabel }}
        </span>
        <span v-else class="progress-text">
          {{ displayRange }} / {{ totalRecords }} {{ recordsLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import ProgressBar from 'primevue/progressbar';
import { useLocalizationStore } from '@/stores/localization';

interface Props {
  /** First visible item index (0-based) */
  firstVisible: number;
  /** Last visible item index (0-based) */
  lastVisible: number;
  /** Total number of records */
  totalRecords: number;
  /** Number of selected items */
  selectionCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  selectionCount: 0
});

// Localization store
const loc = useLocalizationStore();

// Reactive localized labels with fallbacks
const selectedLabel = ref('selected');
const recordsLabel = ref('records');

// Load translations on mount
onMounted(async () => {
  try {
    selectedLabel.value = await loc.t('common.selected');
    recordsLabel.value = await loc.t('common.records');
  } catch (error) {
    console.warn('[VirtualScrollTableProgressBar] Failed to load translations:', error);
    // Fallback values already set
  }
});

// Watch for locale changes to update labels
watch(() => loc.getLocale(), async () => {
  try {
    selectedLabel.value = await loc.t('common.selected');
    recordsLabel.value = await loc.t('common.records');
  } catch (error) {
    console.warn('[VirtualScrollTableProgressBar] Failed to update translations:', error);
  }
});

// Display range string (1-indexed for user display)
const displayRange = computed(() => {
  if (props.totalRecords === 0) return '0-0';
  const first = Math.min(props.firstVisible + 1, props.totalRecords);
  const last = Math.min(props.lastVisible + 1, props.totalRecords);
  return `${first}-${last}`;
});

// Progress calculation based on last visible item with minimum visibility
const progressPercentage = computed(() => {
  if (props.totalRecords === 0) return 0;
  
  let percentage = 0;
  if (props.selectionCount > 0) {
    // Selection mode: percentage of selected items
    percentage = (props.selectionCount / props.totalRecords) * 100;
  } else {
    // Scroll mode: percentage based on last visible item
    const lastVisible1Indexed = Math.min(props.lastVisible + 1, props.totalRecords);
    percentage = (lastVisible1Indexed / props.totalRecords) * 100;
  }
  
  // Ensure minimum 1% visibility if there's any progress
  return percentage > 0 ? Math.max(percentage, 1) : 0;
});
</script>

<style scoped>
.virtual-scroll-progress-bar {
  margin-top: 1rem;
  padding-top: 0.75rem;
}

/* Wrapper for progress bar + overlay */
.progress-wrapper {
  position: relative;
  width: 100%;
}

/* ProgressBar root styling */
.virtual-scroll-progress-bar :deep(.p-progressbar) {
  height: 1.5rem;
  overflow: hidden;
}

/* ProgressBar value (filled portion) - Normal scroll mode */
.virtual-scroll-progress-bar :deep(.p-progressbar-value) {  
  transition: width 0.3s ease-in-out;
  min-width: 1%; /* Ensure visibility even at low percentages */
  display: flex !important; /* Override inline style if needed */
}

/* ProgressBar value - Selection mode (blue gradient) */
.virtual-scroll-progress-bar :deep(.progress-selection .p-progressbar-value) {
  background: linear-gradient(
    90deg,
    var(--p-blue-500) 0%,
    var(--p-blue-400) 100%
  );
}

/* Centered text overlay (always visible, regardless of progress width) */
.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* Allow clicks through to progress bar */
}

/* Progress text styling */
.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--p-text-color);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Subtle shadow for readability */
}
</style>
