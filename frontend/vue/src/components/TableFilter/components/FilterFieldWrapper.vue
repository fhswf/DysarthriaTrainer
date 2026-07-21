<template>
  <div class="filter-field-wrapper">
    <!-- FloatLabel for text-based inputs -->
    <FloatLabel v-if="useFloatLabel" variant="on">
      <FilterField
        :field="field"
        :modelValue="modelValue"
        :placeholder="placeholder"
        :invalid="invalid"
        :errorMessage="errorMessage"
        @update:modelValue="emit('update:modelValue', $event)"
      />
      <label :for="`filter-field-${String(field.key)}`">
        {{ label }}
        <span v-if="field.validation?.required" class="text-red-500 ml-1">*</span>
      </label>
    </FloatLabel>

    <!-- Direct rendering for checkboxes and other non-text inputs -->
    <div v-else class="field-with-label">
      <label :for="`filter-field-${String(field.key)}`" class="field-label">
        {{ label }}
        <span v-if="field.validation?.required" class="text-red-500 ml-1">*</span>
      </label>
      <FilterField
        :field="field"
        :modelValue="modelValue"
        :placeholder="placeholder"
        :invalid="invalid"
        :errorMessage="errorMessage"
        @update:modelValue="emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="TParams extends Record<string, any>">
import { computed } from 'vue';
import FloatLabel from 'primevue/floatlabel';
import FilterField from './FilterField.vue';
import type { FilterFieldDefinition } from '../types';

/**
 * FilterFieldWrapper Component
 * 
 * Wraps FilterField with FloatLabel for text-based inputs
 * or simple label for checkboxes and other components
 */

// ============================================================================
// Props
// ============================================================================

export interface FilterFieldWrapperProps<TParams extends Record<string, any>> {
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

const props = withDefaults(defineProps<FilterFieldWrapperProps<TParams>>(), {
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
 * Determine if FloatLabel should be used based on field type
 * FloatLabel works well for text inputs but not for checkboxes, sliders, etc.
 */
const useFloatLabel = computed(() => {
  const floatLabelTypes = [
    'text',
    'number',
    'date',
    'datetime',
    'dateRange',
    'datetimeRange',
    'select',
    'multiselect',
  ];
  return floatLabelTypes.includes(props.field.type);
});
</script>

<style scoped>
.field-with-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}
</style>
