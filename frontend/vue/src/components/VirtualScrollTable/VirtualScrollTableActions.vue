<template>
  <div class="virtual-scroll-table-actions">
    <!-- View Button -->
    <Button
      v-if="actions?.view"
      icon="pi pi-eye"
      class="p-button-rounded p-button-text p-button-sm"
      v-tooltip.top="'View'"
      @click="$emit('view', item)"
    />
    
    <!-- Edit Button -->
    <Button
      v-if="actions?.edit"
      icon="pi pi-pencil"
      class="p-button-rounded p-button-text p-button-sm"
      v-tooltip.top="'Edit'"
      @click="$emit('edit', item)"
    />
    
    <!-- Delete Button -->
    <Button
      v-if="actions?.delete"
      icon="pi pi-trash"
      class="p-button-rounded p-button-text p-button-sm p-button-danger"
      v-tooltip.top="'Delete'"
      @click="$emit('delete', item)"
    />
    
    <!-- Custom Actions -->
    <Button
      v-for="action in visibleCustomActions"
      :key="action.name"
      :icon="action.icon"
      :disabled="action.disabled?.(item)"
      class="p-button-rounded p-button-text p-button-sm"
      v-tooltip.top="action.label"
      @click="handleCustomAction(action)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import type { ActionConfig, CustomAction } from './types/virtual-scroll-table.types';

interface Props {
  item: any;
  actions?: ActionConfig;
}

interface Emits {
  (e: 'view', item: any): void;
  (e: 'edit', item: any): void;
  (e: 'delete', item: any): void;
  (e: 'action', payload: { action: string; item: any }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Filter custom actions by visibility
 */
const visibleCustomActions = computed(() => {
  if (!props.actions?.custom) return [];
  
  return props.actions.custom.filter((action: CustomAction) => {
    if (!action.visible) return true;
    return action.visible(props.item);
  });
});

/**
 * Handle custom action click
 */
const handleCustomAction = (action: CustomAction) => {
  if (action.handler) {
    action.handler(props.item);
  }
  emit('action', { action: action.name, item: props.item });
};
</script>

<style scoped>
.virtual-scroll-table-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: flex-end;
}
</style>
