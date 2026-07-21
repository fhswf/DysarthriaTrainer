<template>
  <div class="filter-field">
    <!-- Text Input -->
    <InputText
      v-if="field.type === 'text'"
      :id="fieldId"
      :modelValue="modelValue as string"
      :placeholder="placeholder"
      :invalid="invalid"
      :maxlength="field.options?.maxLength"
      size="small"
      class="w-full"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Number Input -->
    <InputNumber
      v-else-if="field.type === 'number'"
      :id="fieldId"
      :modelValue="modelValue as number"
      :placeholder="placeholder"
      :invalid="invalid"
      :min="field.options?.min"
      :max="field.options?.max"
      :step="field.options?.step"
      :showButtons="false"
      size="small"
      class="w-full"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Date Picker -->
    <DatePicker
      v-else-if="field.type === 'date'"
      :id="fieldId"
      :modelValue="modelValue"
      :placeholder="placeholder"
      :invalid="invalid"
      :showButtonBar="field.options?.showButtonBar !== false"
      size="small"
      class="w-full"
      updateModelType="date"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- DateTime Picker -->
    <DatePicker
      v-else-if="field.type === 'datetime'"
      :id="fieldId"
      :modelValue="modelValue"
      :placeholder="placeholder"
      :invalid="invalid"
      :showTime="true"
      :hourFormat="field.options?.hourFormat || '24'"
      :showButtonBar="field.options?.showButtonBar !== false"
      size="small"
      class="w-full"
      updateModelType="date"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Date Range (two pickers) -->
    <div v-else-if="field.type === 'dateRange'" class="date-range">
      <DatePicker
        :id="`${fieldId}-from`"
        :modelValue="getRangeValue('from')"
        :placeholder="placeholder"
        :invalid="invalid"
        :showButtonBar="field.options?.showButtonBar !== false"
        size="small"
        class="flex-1"
        updateModelType="date"
        @update:modelValue="updateRangeValue('from', $event)"
      />
      <span class="range-separator">–</span>
      <DatePicker
        :id="`${fieldId}-to`"
        :modelValue="getRangeValue('to')"
        :placeholder="placeholder"
        :invalid="invalid"
        :showButtonBar="field.options?.showButtonBar !== false"
        size="small"
        class="flex-1"
        updateModelType="date"
        @update:modelValue="updateRangeValue('to', $event)"
      />
    </div>

    <!-- DateTime Range (two pickers with time) -->
    <div v-else-if="field.type === 'datetimeRange'" class="date-range">
      <DatePicker
        :id="`${fieldId}-from`"
        :modelValue="getRangeValue('from')"
        :placeholder="placeholder"
        :invalid="invalid"
        :showTime="true"
        :hourFormat="field.options?.hourFormat || '24'"
        :showButtonBar="field.options?.showButtonBar !== false"
        size="small"
        class="flex-1"
        updateModelType="date"
        @update:modelValue="updateRangeValue('from', $event)"
      />
      <span class="range-separator">–</span>
      <DatePicker
        :id="`${fieldId}-to`"
        :modelValue="getRangeValue('to')"
        :placeholder="placeholder"
        :invalid="invalid"
        :showTime="true"
        :hourFormat="field.options?.hourFormat || '24'"
        :showButtonBar="field.options?.showButtonBar !== false"
        size="small"
        class="flex-1"
        updateModelType="date"
        @update:modelValue="updateRangeValue('to', $event)"
      />
    </div>

    <!-- Select/Dropdown -->
    <Select
      v-else-if="field.type === 'select'"
      :id="fieldId"
      :modelValue="modelValue"
      :options="field.options?.selectOptions || []"
      :placeholder="placeholder"
      :invalid="invalid"
      size="small"
      class="w-full"
      optionLabel="label"
      optionValue="value"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- MultiSelect -->
    <MultiSelect
      v-else-if="field.type === 'multiselect'"
      :id="fieldId"
      :modelValue="modelValue"
      :options="field.options?.selectOptions || []"
      :placeholder="placeholder"
      :invalid="invalid"
      size="small"
      class="w-full"
      optionLabel="label"
      optionValue="value"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Checkbox -->
    <Checkbox
      v-else-if="field.type === 'boolean'"
      :id="fieldId"
      v-model="checkboxValue"
      :binary="true"
      :invalid="invalid"
    />

    <!-- TriState Checkbox -->
    <SelectButton
      v-else-if="field.type === 'tristate'"
      :id="fieldId"
      v-model="tristateDisplayValue"
      :options="tristateOptions"
      option-label="label"
      option-value="value"
      :invalid="invalid"
      size="small"
      class="w-full"
    />

    <!-- Slider -->
    <Slider
      v-else-if="field.type === 'slider'"
      :id="fieldId"
      :modelValue="modelValue"
      :min="field.options?.min || 0"
      :max="field.options?.max || 100"
      :step="field.options?.step || 1"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Rating -->
    <Rating
      v-else-if="field.type === 'rating'"
      :id="fieldId"
      :modelValue="modelValue"
      :cancel="true"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Custom Component -->
    <component
      v-else-if="field.type === 'custom' && field.options?.component"
      :is="field.options.component"
      :id="fieldId"
      :modelValue="modelValue"
      :field="field"
      :invalid="invalid"
      v-bind="field.options?.componentProps || {}"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Error Message -->
    <small v-if="invalid && errorMessage" class="error-message">
      {{ errorMessage }}
    </small>
  </div>
</template>

<script setup lang="ts" generic="TParams extends Record<string, any>">
import { computed, ref, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';
import Rating from 'primevue/rating';
import type { FilterFieldDefinition } from '../types';
import { getRangeFieldKeys } from '../utils/fieldRenderer';
import { useLocalizationStore } from '@/stores/localization';

/**
 * FilterField Component
 * 
 * Renders a single filter field based on its type.
 * Supports all 13 field types including range fields.
 */

// ============================================================================
// Localization
// ============================================================================

const loc = useLocalizationStore();

// ============================================================================
// Props
// ============================================================================

export interface FilterFieldProps<TParams extends Record<string, any>> {
  /**
   * Field definition
   */
  field: FilterFieldDefinition<TParams>;

  /**
   * Current field value
   */
  modelValue: any;

  /**
   * Field label (already translated)
   */
  label?: string;

  /**
   * Placeholder text (already translated)
   */
  placeholder?: string;

  /**
   * Whether field has validation error
   */
  invalid?: boolean;

  /**
   * Validation error message
   */
  errorMessage?: string;
}

const props = withDefaults(defineProps<FilterFieldProps<TParams>>(), {
  label: '',
  placeholder: '',
  invalid: false,
  errorMessage: '',
});

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

// ============================================================================
// Computed
// ============================================================================

/**
 * Unique field ID for label association
 */
const fieldId = computed(() => {
  return `filter-field-${String(props.field.key)}`;
});

/**
 * Whether field is required
 */
const isRequired = computed(() => {
  return props.field.validation?.required || false;
});

/**
 * Writable computed value for checkbox (boolean type)
 */
const checkboxValue = computed({
  get: () => props.modelValue === true,
  set: (value: boolean) => emit('update:modelValue', value)
});

/**
 * Writable computed value for tristate checkbox
 * Returns true, false, or null (unchecked/indeterminate)
 */
const tristateValue = computed({
  get: () => {
    console.log('[FilterField] Tristate get - field:', props.field.key, 'modelValue:', props.modelValue, 'type:', typeof props.modelValue);
    // Explicitly handle undefined as null for indeterminate state
    if (props.modelValue === undefined) return null;
    if (props.modelValue === true) return true;
    if (props.modelValue === false) return false;
    return null;
  },
  set: (value: boolean | null) => {
    console.log('[FilterField] Tristate set - field:', props.field.key, 'new value:', value, 'type:', typeof value);
    emit('update:modelValue', value);
  }
});

/**
 * Options for tristate SelectButton (localized)
 */
const tristateOptions = ref([
  { label: '', value: null },
  { label: '', value: false },  // false = user__id__isnull is false = Has User
  { label: '', value: true }     // true = user__id__isnull is true = No User
]);

/**
 * Load tristate translations
 */
async function loadTristateTranslations() {
  tristateOptions.value = [
    { label: await loc.t('common.any'), value: null },
    { label: await loc.t('common.yes'), value: false },
    { label: await loc.t('common.no'), value: true }
  ];
}

// Load translations on mount
onMounted(() => {
  loadTristateTranslations();
});

// Reload translations when locale changes
window.addEventListener('locale-changed', () => {
  loadTristateTranslations();
});

/**
 * Display value for tristate SelectButton (handles null properly)
 */
const tristateDisplayValue = computed({
  get: () => {
    const value = tristateValue.value;
    // Return the value as-is, SelectButton handles null
    return value;
  },
  set: (value: boolean | null) => {
    tristateValue.value = value;
  }
});

// ============================================================================
// Range Field Helpers
// ============================================================================

/**
 * Get value for range field (from or to)
 * Converts string dates to Date objects for DatePicker compatibility
 */
function getRangeValue(type: 'from' | 'to'): any {
  if (!props.modelValue || typeof props.modelValue !== 'object') {
    return undefined;
  }

  const keys = getRangeFieldKeys(String(props.field.key), props.field.type);
  const key = type === 'from' ? keys.from : keys.to;
  const value = props.modelValue[key];
  
  // DatePicker requires Date objects when using updateModelType="date"
  // Convert ISO string dates to Date objects
  if (value && typeof value === 'string') {
    try {
      return new Date(value);
    } catch (e) {
      console.warn('[FilterField] Invalid date string:', value);
      return value;
    }
  }
  
  // Value is already a Date object or null/undefined
  return value;
}

/**
 * Update range field value (from or to)
 */
function updateRangeValue(type: 'from' | 'to', value: any): void {
  const keys = getRangeFieldKeys(String(props.field.key), props.field.type);
  const key = type === 'from' ? keys.from : keys.to;
  
  const updated = { ...(props.modelValue || {}) };
  
  if (value === undefined || value === null || value === '') {
    delete updated[key];
  } else {
    updated[key] = value;
  }
  
  emit('update:modelValue', updated);
}
</script>

<style scoped>
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-field-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.required-indicator {
  color: var(--red-500);
  margin-left: 0.25rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.date-range :deep(.p-datepicker) {
  width: 100%;
}

.range-separator {
  color: var(--text-color-secondary);
  font-weight: 600;
  flex-shrink: 0;
}

.error-message {
  color: var(--red-500);
  font-size: 0.75rem;
}
</style>
