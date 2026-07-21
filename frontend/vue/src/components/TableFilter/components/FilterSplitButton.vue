<template>
  <SplitButton
    :label="buttonLabel"
    :icon="icon"
    :severity="severity"
    :model="presetMenuItems"
    :badge="badgeValue"
    :badgeClass="badgeClass"
    @click="handleButtonClick"
  />
</template>

<script setup lang="ts" generic="TParams extends Record<string, any>">
import { ref, computed, watch, onMounted } from 'vue';
import SplitButton from 'primevue/splitbutton';
import type { FilterPreset } from '../types';
import { useLocalizationStore } from '@/stores/localization';

/**
 * FilterSplitButton Component
 * 
 * Displays a split button with:
 * - Current preset or "Custom Filters" label
 * - Dropdown menu with available presets
 * - Badge showing active filter count
 * - Click opens the filter dialog
 */

// ============================================================================
// Props
// ============================================================================

export interface FilterSplitButtonProps<TParams extends Record<string, any>> {
  /**
   * Translation key prefix
   */
  i18nPrefix: string;

  /**
   * Button label translation key
   */
  labelKey: string;

  /**
   * Button icon
   */
  icon: string;

  /**
   * Button severity/color
   */
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'contrast';

  /**
   * Available presets
   */
  presets: FilterPreset<TParams>[];

  /**
   * Currently selected preset ID
   */
  selectedPresetId?: string | null;

  /**
   * Active filter count (for badge)
   */
  activeFilterCount: number;
}

const props = withDefaults(defineProps<FilterSplitButtonProps<TParams>>(), {
  severity: 'primary',
  selectedPresetId: null,
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  'click': [];
  'selectPreset': [presetId: string];
}>();

// ============================================================================
// Localization
// ============================================================================

const loc = useLocalizationStore();

/**
 * Button label (translated)
 */
const buttonLabel = ref('');

/**
 * Preset labels (preset ID -> translated label)
 */
const presetLabels = ref<Record<string, string>>({});

/**
 * Load all translations
 */
async function loadTranslations() {
  try {
    // Button label
    buttonLabel.value = await loc.t(props.labelKey);

    // Custom filters label
    await loadCustomFiltersLabel();

    // Preset labels
    const labelPromises = props.presets.map(async (preset) => {
      const label = await loc.t(preset.labelKey);
      presetLabels.value[preset.id] = label;
    });

    await Promise.all(labelPromises);
  } catch (error) {
    console.error('[FilterSplitButton] Failed to load translations:', error);
  }
}

/**
 * Reload translations when labelKey changes
 */
watch(
  () => props.labelKey,
  () => {
    loadTranslations();
  }
);

/**
 * Load translations on mount
 */
onMounted(() => {
  loadTranslations();
});

// ============================================================================
// Computed
// ============================================================================

/**
 * Badge value (show count if > 0)
 */
const badgeValue = computed(() => {
  return props.activeFilterCount > 0 ? String(props.activeFilterCount) : undefined;
});

/**
 * Badge CSS class
 */
const badgeClass = computed(() => {
  return props.activeFilterCount > 0 ? 'badge-active' : '';
});

/**
 * Preset menu items for dropdown
 */
const presetMenuItems = computed(() => {
  const items = props.presets.map((preset) => ({
    label: presetLabels.value[preset.id] || preset.id,
    icon: preset.icon,
    command: () => handlePresetSelect(preset.id),
  }));

  // Add separator and "Custom Filters..." option
  items.push({
    separator: true,
  } as any);

  items.push({
    label: customFiltersLabel.value || 'Custom Filters...',
    icon: 'pi pi-filter',
    command: () => handleButtonClick(),
  });

  return items;
});

/**
 * Custom filters label
 */
const customFiltersLabel = ref('');

/**
 * Load custom filters label
 */
async function loadCustomFiltersLabel() {
  try {
    customFiltersLabel.value = await loc.t(`${props.i18nPrefix}.customFilters`);
  } catch (error) {
    console.error('[FilterSplitButton] Failed to load custom filters label:', error);
    customFiltersLabel.value = 'Custom Filters...';
  }
}

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle button click (opens dialog)
 */
function handleButtonClick() {
  emit('click');
}

/**
 * Handle preset selection from dropdown
 */
function handlePresetSelect(presetId: string) {
  emit('selectPreset', presetId);
}
</script>

<style scoped>
:deep(.badge-active) {
  background-color: var(--primary-color);
}
</style>
