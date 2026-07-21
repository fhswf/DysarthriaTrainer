<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { useLocalizationStore } from '@/stores/localization';
import type { AudioDevice } from '@/composables/useAudioDevices';

const loc = useLocalizationStore();

interface Props {
  devices?: AudioDevice[];
  selectedDeviceId?: string | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  devices: () => [],
  selectedDeviceId: null,
  disabled: false,
});

interface Emits {
  (e: 'select', deviceId: string): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const deviceOptions = computed(() =>
  props.devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }))
);

const handleSelect = (event: { value: string }) => {
  emit('select', event.value);
};

const handleRefresh = () => {
  emit('refresh');
};
</script>

<template>
  <div class="device-selector">
    <label class="selector-label">
      <i class="pi pi-microphone"></i>
      {{ loc.t('audio.device.label') }}
    </label>

    <div class="selector-controls">
      <Dropdown :model-value="selectedDeviceId" :options="deviceOptions" option-label="label" option-value="value"
        :placeholder="loc.t('audio.device.placeholder')" :disabled="disabled" class="device-dropdown"
        @update:model-value="handleSelect" />

      <Button icon="pi pi-refresh" :disabled="disabled" severity="secondary" outlined @click="handleRefresh"
        :title="loc.t('audio.device.refresh')" />
    </div>

    <div v-if="devices.length === 0" class="no-devices">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ loc.t('audio.device.noDevices') }}</span>
    </div>
  </div>
</template>

<style scoped>
.device-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.selector-controls {
  display: flex;
  gap: 0.5rem;
}

.device-dropdown {
  flex: 1;
}

.no-devices {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
