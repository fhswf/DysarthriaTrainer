<template>
  <Dialog
    v-model:visible="isVisible"
    :header="dialogTitle"
    :modal="true"
    :dismissableMask="false"
    :closeOnEscape="true"
    class="filter-dialog"
    :style="{ width: '700px' }"
  >
    <div class="space-y-6">
      <!-- Quick Filter Presets -->
      <div v-if="quickPresets.length > 0" class="flex flex-col gap-2">
        <label class="text-sm font-medium">{{ quickPresetsLabel }}</label>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="preset in quickPresets"
            :key="preset.id"
            :label="quickPresetLabels[preset.id] || preset.id"
            :icon="preset.icon"
            :severity="preset.severity || 'secondary'"
            size="small"
            @click="handleQuickPreset(preset)"
          />
        </div>
      </div>

      <Divider v-if="quickPresets.length > 0" />

      <!-- Filter Form with Fieldsets -->
      <div class="filter-form">
        <!-- Ungrouped Fields -->
        <fieldset 
          v-if="ungroupedFields.length > 0" 
          class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 mb-6"
        >
          <legend class="text-sm font-medium px-2">{{ ungroupedFieldsLabel }}</legend>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="field in ungroupedFields"
              :key="String(field.key)"
              :class="field.colSpan === 12 ? 'md:col-span-2' : ''"
            >
              <FilterFieldWrapper
                :field="field"
                :modelValue="getFieldValue(field)"
                :label="fieldLabels[String(field.key)] || String(field.key)"
                :placeholder="fieldPlaceholders[String(field.key)]"
                :invalid="fieldErrors[String(field.key)] !== undefined"
                :errorMessage="fieldErrors[String(field.key)]"
                @update:modelValue="updateField(field.key, $event)"
              />
            </div>
          </div>
        </fieldset>

        <!-- Grouped Fields -->
        <fieldset
          v-for="group in groupedFields"
          :key="group.group"
          class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 mb-6"
        >
          <legend class="text-sm font-medium px-2">
            {{ groupLabels[group.group] || group.group }}
          </legend>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="field in group.fields"
              :key="String(field.key)"
              :class="field.colSpan === 12 ? 'md:col-span-2' : ''"
            >
              <FilterFieldWrapper
                :field="field"
                :modelValue="getFieldValue(field)"
                :label="fieldLabels[String(field.key)] || String(field.key)"
                :placeholder="fieldPlaceholders[String(field.key)]"
                :invalid="fieldErrors[String(field.key)] !== undefined"
                :errorMessage="fieldErrors[String(field.key)]"
                @update:modelValue="updateField(field.key, $event)"
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex justify-between w-full">
        <!-- Left: Clear Button -->
        <Button
          :label="clearLabel"
          icon="pi pi-times"
          severity="secondary"
          text
          size="small"
          @click="handleClear"
        />

        <!-- Right: Cancel & Apply Buttons -->
        <div class="flex gap-2">
          <Button
            :label="cancelLabel"
            severity="secondary"
            outlined
            size="small"
            @click="handleCancel"
          />
          <Button
            :label="applyLabel"
            severity="primary"
            size="small"
            :disabled="!isValid"
            @click="handleApply"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts" generic="TParams extends Record<string, any>">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import type { FilterFieldDefinition, FilterFieldGroup, QuickPreset } from '../types';
import FilterFieldWrapper from './FilterFieldWrapper.vue';
import { useLocalizationStore } from '@/stores/localization';
import { getRangeFieldKeys } from '../utils';

/**
 * FilterDialog Component
 * 
 * Displays a dialog with dynamic form fields for filtering.
 * Supports field grouping, validation, and quick presets.
 * Integrates with async Pinia localization service.
 */

// ============================================================================
// Props
// ============================================================================

export interface FilterDialogProps<TParams extends Record<string, any>> {
  /**
   * Control dialog visibility (v-model)
   */
  visible: boolean;

  /**
   * Translation key prefix for all labels
   * @example 'employees.filters'
   */
  i18nPrefix: string;

  /**
   * Current temporary filter values
   */
  tempFilters: Partial<TParams>;

  /**
   * Visible field definitions (after conditional filtering)
   */
  visibleFields: FilterFieldDefinition<TParams>[];

  /**
   * Grouped field definitions
   */
  groupedFields: FilterFieldGroup<TParams>[];

  /**
   * Ungrouped field definitions
   */
  ungroupedFields: FilterFieldDefinition<TParams>[];

  /**
   * Quick preset buttons
   */
  quickPresets?: QuickPreset<TParams>[];

  /**
   * Validation errors (field key -> error message)
   */
  validationErrors?: Record<string, string>;

  /**
   * Whether filters are valid
   */
  isValid?: boolean;
}

const props = withDefaults(defineProps<FilterDialogProps<TParams>>(), {
  quickPresets: () => [],
  validationErrors: () => ({}),
  isValid: true,
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'update:tempFilters': [value: Partial<TParams>];
  'apply': [];
  'cancel': [];
  'clear': [];
  'quickPreset': [preset: QuickPreset<TParams>];
}>();

// ============================================================================
// Localization
// ============================================================================

const loc = useLocalizationStore();

/**
 * Dialog title
 */
const dialogTitle = ref('');

/**
 * Quick presets section label
 */
const quickPresetsLabel = ref('');

/**
 * Ungrouped fields section label
 */
const ungroupedFieldsLabel = ref('');

/**
 * Button labels
 */
const applyLabel = ref('');
const cancelLabel = ref('');
const clearLabel = ref('');

/**
 * Field labels (field key -> translated label)
 */
const fieldLabels = ref<Record<string, string>>({});

/**
 * Field placeholders (field key -> translated placeholder)
 */
const fieldPlaceholders = ref<Record<string, string>>({});

/**
 * Group labels (group name -> translated label)
 */
const groupLabels = ref<Record<string, string>>({});

/**
 * Quick preset labels (preset ID -> translated label)
 */
const quickPresetLabels = ref<Record<string, string>>({});

/**
 * Load all translations
 */
async function loadTranslations() {
  try {
    // Dialog title
    dialogTitle.value = await loc.t(`${props.i18nPrefix}.dialogTitle`);

    // Quick presets label
    quickPresetsLabel.value = await loc.t(`${props.i18nPrefix}.quickFilters`) || 'Quick Filters';

    // Ungrouped fields label
    ungroupedFieldsLabel.value = await loc.t(`${props.i18nPrefix}.groups.ungrouped`) || 'General';

    // Button labels
    applyLabel.value = await loc.t(`${props.i18nPrefix}.apply`);
    cancelLabel.value = await loc.t(`${props.i18nPrefix}.cancel`);
    clearLabel.value = await loc.t(`${props.i18nPrefix}.clear`);

    // Field labels
    const labelPromises = props.visibleFields.map(async (field) => {
      const label = await loc.t(field.labelKey);
      fieldLabels.value[String(field.key)] = label;

      // Load placeholder if defined
      if (field.options?.placeholderKey) {
        const placeholder = await loc.t(field.options.placeholderKey);
        fieldPlaceholders.value[String(field.key)] = placeholder;
      }
    });

    // Group labels
    const groupPromises = props.groupedFields.map(async (group) => {
      const label = await loc.t(group.groupLabelKey);
      groupLabels.value[group.group] = label;
    });

    // Quick preset labels
    const presetPromises = props.quickPresets.map(async (preset) => {
      const label = await loc.t(preset.labelKey);
      quickPresetLabels.value[preset.id] = label;
    });

    await Promise.all([...labelPromises, ...groupPromises, ...presetPromises]);
  } catch (error) {
    console.error('[FilterDialog] Failed to load translations:', error);
  }
}

/**
 * Reload translations when visible fields change
 */
watch(
  () => props.visibleFields,
  () => {
    loadTranslations();
  },
  { deep: true }
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
 * Two-way binding for visibility
 */
const isVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

/**
 * Field validation errors
 */
const fieldErrors = computed(() => {
  return props.validationErrors || {};
});

// ============================================================================
// Methods
// ============================================================================

/**
 * Get the model value for a field
 * For range fields, constructs an object with from/to keys
 * For regular fields, returns the direct value
 */
function getFieldValue(field: FilterFieldDefinition<TParams>): any {
  if (field.type === 'dateRange' || field.type === 'datetimeRange') {
    const keys = getRangeFieldKeys(String(field.key), field.type);
    let fromValue: any = props.tempFilters[keys.from as keyof TParams];
    let toValue: any = props.tempFilters[keys.to as keyof TParams];
    
    // Defensive: unwrap if values are nested objects (shouldn't happen, but just in case)
    if (fromValue && typeof fromValue === 'object' && !Array.isArray(fromValue) && !(fromValue instanceof Date)) {
      // Check if it's a nested structure with the key inside
      if (keys.from in fromValue) {
        fromValue = (fromValue as any)[keys.from];
      }
    }
    if (toValue && typeof toValue === 'object' && !Array.isArray(toValue) && !(toValue instanceof Date)) {
      if (keys.to in toValue) {
        toValue = (toValue as any)[keys.to];
      }
    }
    
    // Convert string dates to Date objects
    const convertedFrom = fromValue && typeof fromValue === 'string' ? new Date(fromValue) : fromValue;
    const convertedTo = toValue && typeof toValue === 'string' ? new Date(toValue) : toValue;
    
    const result = {
      [keys.from]: convertedFrom,
      [keys.to]: convertedTo,
    };
    
    return result;
  }
  
  // For single date/datetime fields, convert strings to Date objects
  if (field.type === 'date' || field.type === 'datetime') {
    const value = props.tempFilters[field.key];
    return value && typeof value === 'string' ? new Date(value) : value;
  }
  
  return props.tempFilters[field.key];
}

/**
 * Convert Date object to ISO string for API
 */
function convertDateToString(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Update a field value
 */
function updateField(key: keyof TParams, value: any) {
  const updated = { ...props.tempFilters };
  
  // Check if this is a range field update (object with __gte/__lte keys)
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if the value object has range-like keys (__gte, __lte)
    const valueKeys = Object.keys(value);
    const isRangeValue = valueKeys.some(k => k.endsWith('__gte') || k.endsWith('__lte'));
    
    if (isRangeValue) {
      // This is a range field - spread the keys directly into tempFilters
      Object.keys(value).forEach(rangeKey => {
        const rangeValue = value[rangeKey];
        if (rangeValue === undefined || rangeValue === null || rangeValue === '') {
          delete updated[rangeKey as keyof TParams];
        } else {
          // Convert Date objects to ISO strings for API
          updated[rangeKey as keyof TParams] = convertDateToString(rangeValue);
        }
      });
      
      emit('update:tempFilters', updated);
      return;
    }
  }
  
  // Normal field update
  if (value === undefined || value === null || value === '') {
    delete updated[key];
  } else {
    // Convert Date objects to ISO strings for API
    updated[key] = convertDateToString(value);
  }
  
  emit('update:tempFilters', updated);
}

/**
 * Handle quick preset click
 */
function handleQuickPreset(preset: QuickPreset<TParams>) {
  // Emit to parent to get the resolved filters
  emit('quickPreset', preset);
}

/**
 * Apply quick preset filters to temp form values
 * This is called from parent after resolving the preset
 * @param filters - The resolved filter values to apply
 * @param autoApply - Whether to automatically apply the filters after setting them
 */
function applyQuickPresetToForm(filters: Partial<TParams>, autoApply = true) {
  // Merge quick preset filters with existing temp filters
  // This fills the form inputs instead of just applying directly
  const updated = { ...props.tempFilters };
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      updated[key as keyof TParams] = value;
    }
  });
  
  emit('update:tempFilters', updated);
  
  // Automatically apply the filters if requested
  if (autoApply) {
    // Use nextTick to ensure tempFilters update is processed first
    nextTick(() => {
      emit('apply');
    });
  }
}

/**
 * Handle apply button click
 */
function handleApply() {
  emit('apply');
}

/**
 * Handle cancel button click
 */
function handleCancel() {
  emit('cancel');
}

/**
 * Handle clear button click
 */
function handleClear() {
  emit('clear');
}

// ============================================================================
// Expose Public API
// ============================================================================

defineExpose({
  applyQuickPresetToForm,
});
</script>

<style scoped>
fieldset {
  border-width: 1px;
}

legend {
  font-weight: 600;
}
</style>
