<template>
    <div class="device-selector flex items-center gap-2">
        <Select v-model="selectedValue" :options="deviceOptions" option-label="label" option-value="value"
            :placeholder="labels.selectDevice" :disabled="disabled || loading || !hasDevices" :loading="loading" :class="[
                'w-[280px]',
                compact && 'w-[48px]'
            ]" @change="handleSelect">
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <i class="pi pi-microphone text-surface-600" />
                    <span v-if="!compact">{{ getSelectedDeviceLabel() }}</span>
                </div>
                <div v-else class="flex items-center gap-2">
                    <i class="pi pi-microphone text-surface-400" />
                    <span v-if="!compact" class="text-surface-500">{{ labels.selectDevice }}</span>
                </div>
            </template>

            <template #option="slotProps">
                <div class="flex items-center gap-2">
                    <i class="pi pi-microphone text-surface-600" />
                    <span>{{ slotProps.option.label }}</span>
                </div>
            </template>

            <template #empty>
                <div class="p-3 text-center text-surface-500">
                    {{ labels.noDevices }}
                </div>
            </template>
        </Select>

        <!-- Device Status Badge -->
        <Badge v-if="deviceStatus && !compact" :value="deviceStatus.label" :severity="deviceStatus.severity"
            class="ml-2" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocalizationStore } from '@/stores/localization'
import Select from 'primevue/select'
import Badge from 'primevue/badge'

interface Props {
    /** Currently selected device ID */
    modelValue: string | null

    /** List of available devices */
    devices: MediaDeviceInfo[] | { deviceId: string; label: string; groupId: string }[]

    /** Show loading state while enumerating */
    loading?: boolean

    /** Disabled state */
    disabled?: boolean

    /** Compact mode (icon only) */
    compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    disabled: false,
    compact: false
})

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'select', deviceId: string, device: MediaDeviceInfo | { deviceId: string; label: string; groupId: string }): void
    (e: 'change', deviceId: string): void
}

const emit = defineEmits<Emits>()

const loc = useLocalizationStore()

const selectedValue = computed({
    get: () => props.modelValue,
    set: (value) => {
        if (value) {
            emit('update:modelValue', value)
        }
    }
})

const labels = ref({
    selectDevice: '',
    noDevices: '',
    defaultMicrophone: '',
    deviceConnected: '',
    deviceDisconnected: ''
})

onMounted(() => {
    labels.value.selectDevice = loc.t('recording.device.select')
    labels.value.noDevices = loc.t('recording.device.none')
    labels.value.defaultMicrophone = loc.t('recording.device.default')
    labels.value.deviceConnected = loc.t('recording.device.connected')
    labels.value.deviceDisconnected = loc.t('recording.device.disconnected')
})

const hasDevices = computed(() => props.devices.length > 0)

const deviceOptions = computed(() => {
    if (!hasDevices.value) return []

    return props.devices.map(device => ({
        label: device.label || labels.value.defaultMicrophone,
        value: device.deviceId,
        device
    }))
})

const deviceStatus = computed(() => {
    if (props.loading) {
        return {
            label: 'Detecting...',
            severity: 'info'
        }
    }

    if (!hasDevices.value) {
        return {
            label: labels.value.deviceDisconnected,
            severity: 'danger'
        }
    }

    if (props.modelValue) {
        return {
            label: labels.value.deviceConnected,
            severity: 'success'
        }
    }

    return null
})

function getSelectedDeviceLabel(): string {
    if (!props.modelValue) return labels.value.selectDevice
    const option = deviceOptions.value.find(opt => opt.value === props.modelValue)
    return option?.label ?? labels.value.defaultMicrophone
}

function handleSelect(event: { value: string }) {
    const deviceId = event.value
    if (!deviceId) return

    const device = props.devices.find(d => d.deviceId === deviceId)
    if (!device) return

    emit('update:modelValue', deviceId)
    emit('select', deviceId, device)
    emit('change', deviceId)
}

// Auto-select first device if none selected
watch(() => props.devices, (newDevices) => {
    if (newDevices.length > 0 && !props.modelValue) {
        const defaultDevice = newDevices.find(d => d.deviceId === 'default') ?? newDevices[0]
        if (defaultDevice) {
            emit('update:modelValue', defaultDevice.deviceId)
        }
    }
}, { immediate: true })
</script>
